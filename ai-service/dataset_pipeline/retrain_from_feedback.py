"""
Offline Active Learning / Reward-Weighted Continual Fine-Tuning (Replay-based).

Quy trình học tăng cường Offline an toàn cho mô hình nhận diện 90 loài cây kiểng lá:
1. Đọc ảnh phản hồi đã được Admin kiểm duyệt từ `dataset_pipeline/feedback_retrain/`.
2. Lọc trùng MD5 (tránh 1 ảnh bị gửi trùng nhiều lần).
3. Cân bằng dữ liệu:
   - Giới hạn trần số ảnh phản hồi trên mỗi lớp (`--max-feedback-per-class`).
   - Trộn thêm Replay Buffer từ tập dữ liệu gốc (`--replay-per-class`) để chống Quên thảm họa (Catastrophic Forgetting).
   - Tính Balanced Class Weights kết hợp Reward Weight (`1.5` cho ca AI từng đoán sai `reward = -1`, `1.0` cho ca đúng `reward = +1`).
4. Áp dụng Data Augmentation nhẹ (lật ngang, xoay nhẹ, zoom nhẹ) cho tập huấn luyện.
5. Đánh giá Trước vs Sau trên tập Validation và xuất báo cáo `retrain_report.json`.
"""

import argparse
import hashlib
import json
import random
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
from PIL import Image
import tensorflow as tf


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "model" / "best_model.keras"
CLASS_NAMES_PATH = BASE_DIR / "model" / "class_names.json"
FEEDBACK_DIR = Path(__file__).resolve().parent / "feedback_retrain"
REPLAY_DIR = Path(__file__).resolve().parent / "augmented_dataset"
OUTPUT_MODEL_PATH = BASE_DIR / "model" / "best_model_retrained.keras"
REPORT_PATH = FEEDBACK_DIR / "retrain_report.json"
IMG_SIZE = (224, 224)
VALID_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def md5_file(path: Path) -> str:
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def load_class_to_index(class_names_path: Path) -> Dict[str, int]:
    with open(class_names_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    mapping: Dict[str, int] = {}
    if isinstance(data, dict):
        for idx_str, info in data.items():
            label = info.get("original_label") if isinstance(info, dict) else str(info)
            if label:
                mapping[label] = int(idx_str)
    elif isinstance(data, list):
        for idx, item in enumerate(data):
            label = item.get("original_label") if isinstance(item, dict) else str(item)
            mapping[label] = idx
    return mapping


def load_image_array(path: Path) -> np.ndarray:
    with Image.open(path) as img:
        img = img.convert("RGB").resize(IMG_SIZE, Image.Resampling.BILINEAR)
        arr = np.asarray(img, dtype=np.float32)
        return tf.keras.applications.mobilenet_v2.preprocess_input(arr)


def collect_feedback_samples(
    feedback_dir: Path,
    class_to_idx: Dict[str, int],
    max_per_class: int = 30,
    seed: int = 42,
) -> Tuple[List[Path], List[int], List[float], Dict[str, int]]:
    manifest_path = feedback_dir / "manifest.json"
    reward_by_file: Dict[str, int] = {}
    if manifest_path.exists():
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        for item in manifest.get("items", []):
            fp = str(Path(item["file_path"]).resolve())
            reward_by_file[fp] = int(item.get("reward", 1))

    paths, labels, reward_weights = [], [], []
    stats = {"duplicates_removed": 0, "capped_removed": 0, "hard_negatives": 0, "positives": 0}
    seen_hashes = set()
    rng = random.Random(seed)

    if not feedback_dir.exists():
        return paths, labels, reward_weights, stats

    for class_folder in sorted(feedback_dir.iterdir()):
        if not class_folder.is_dir() or class_folder.name not in class_to_idx:
            continue
        cls_idx = class_to_idx[class_folder.name]
        candidates = []
        for img_file in sorted(class_folder.iterdir()):
            if img_file.suffix.lower() not in VALID_EXTS:
                continue
            file_hash = md5_file(img_file)
            if file_hash in seen_hashes:
                stats["duplicates_removed"] += 1
                continue
            seen_hashes.add(file_hash)
            reward = reward_by_file.get(str(img_file.resolve()), 1)
            candidates.append((img_file, reward))

        # Ưu tiên giữ lại các ca AI từng đoán sai (reward < 0) trước khi cắt trần
        candidates.sort(key=lambda x: (0 if x[1] < 0 else 1, rng.random()))
        if len(candidates) > max_per_class:
            stats["capped_removed"] += len(candidates) - max_per_class
            candidates = candidates[:max_per_class]

        for img_file, reward in candidates:
            if reward < 0:
                stats["hard_negatives"] += 1
                w = 1.5
            else:
                stats["positives"] += 1
                w = 1.0
            paths.append(img_file)
            labels.append(cls_idx)
            reward_weights.append(w)

    return paths, labels, reward_weights, stats


def collect_replay_samples(
    replay_dir: Path, class_to_idx: Dict[str, int], max_per_class: int = 5, seed: int = 42
) -> Tuple[List[Path], List[int], List[float]]:
    paths, labels, weights = [], [], []
    if not replay_dir.exists():
        return paths, labels, weights

    rng = random.Random(seed)
    for class_folder in sorted(replay_dir.iterdir()):
        if not class_folder.is_dir() or class_folder.name not in class_to_idx:
            continue
        cls_idx = class_to_idx[class_folder.name]
        imgs = [p for p in class_folder.iterdir() if p.suffix.lower() in VALID_EXTS]
        if not imgs:
            continue
        chosen = rng.sample(imgs, min(len(imgs), max_per_class))
        for p in chosen:
            paths.append(p)
            labels.append(cls_idx)
            weights.append(1.0)
    return paths, labels, weights


def compute_balanced_sample_weights(labels: List[int], reward_weights: List[float]) -> np.ndarray:
    """Kết hợp Balanced Class Weight (kẹp ngưỡng [0.5, 3.0]) với Reward Weight."""
    counts = Counter(labels)
    total = len(labels)
    num_present_classes = max(len(counts), 1)
    combined = []
    for lbl, rw in zip(labels, reward_weights):
        cls_w = total / (num_present_classes * counts[lbl])
        cls_w = min(max(cls_w, 0.5), 3.0)
        combined.append(cls_w * rw)
    return np.array(combined, dtype=np.float32)


def make_augmented_dataset(
    x: np.ndarray, y: np.ndarray, w: np.ndarray, batch_size: int, training: bool
) -> tf.data.Dataset:
    ds = tf.data.Dataset.from_tensor_slices((x, y, w))
    if training:
        aug_layer = tf.keras.Sequential(
            [
                tf.keras.layers.RandomFlip("horizontal"),
                tf.keras.layers.RandomRotation(0.08),
                tf.keras.layers.RandomZoom(0.1),
            ]
        )
        ds = ds.shuffle(buffer_size=len(x), seed=42)
        ds = ds.batch(batch_size)
        ds = ds.map(
            lambda imgs, lbls, sw: (aug_layer(imgs, training=True), lbls, sw),
            num_parallel_calls=tf.data.AUTOTUNE,
        )
    else:
        ds = ds.batch(batch_size)
    return ds.prefetch(tf.data.AUTOTUNE)


def main():
    parser = argparse.ArgumentParser(
        description="Offline Reward-Weighted Continual Fine-Tuning with Class Balancing & Replay Buffer"
    )
    parser.add_argument("--epochs", type=int, default=6)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-5)
    parser.add_argument("--replay-per-class", type=int, default=5)
    parser.add_argument("--max-feedback-per-class", type=int, default=30)
    parser.add_argument("--val-ratio", type=float, default=0.15)
    parser.add_argument("--force-save", action="store_true")
    args = parser.parse_args()

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Không tìm thấy model gốc: {MODEL_PATH}")

    class_to_idx = load_class_to_index(CLASS_NAMES_PATH)
    fb_paths, fb_labels, fb_rweights, fb_stats = collect_feedback_samples(
        FEEDBACK_DIR,
        class_to_idx,
        max_per_class=args.max_feedback_per_class,
    )
    if not fb_paths:
        print(
            f"[INFO] Chưa có ảnh phản hồi nào trong {FEEDBACK_DIR}. "
            "Hãy duyệt phản hồi và bấm 'Xuất Tập Train Offline' trong trang Admin trước."
        )
        return

    rp_paths, rp_labels, rp_rweights = collect_replay_samples(
        REPLAY_DIR, class_to_idx, max_per_class=args.replay_per_class
    )

    all_paths = fb_paths + rp_paths
    all_labels = fb_labels + rp_labels
    all_rweights = fb_rweights + rp_rweights
    all_weights = compute_balanced_sample_weights(all_labels, all_rweights)

    print(
        f"[INFO] Feedback: {len(fb_paths)} (sai=-1: {fb_stats['hard_negatives']}, "
        f"đúng=+1: {fb_stats['positives']}, lọc trùng: {fb_stats['duplicates_removed']}, "
        f"cắt trần: {fb_stats['capped_removed']}) | Replay: {len(rp_paths)} | Tổng: {len(all_paths)}"
    )

    x_data = np.stack([load_image_array(p) for p in all_paths], axis=0)
    y_data = np.array(all_labels, dtype=np.int32)

    indices = np.arange(len(x_data))
    np.random.seed(42)
    np.random.shuffle(indices)
    x_data, y_data, w_data = x_data[indices], y_data[indices], all_weights[indices]

    has_val = len(x_data) >= 20
    if has_val:
        val_size = max(int(len(x_data) * args.val_ratio), 4)
        x_val, y_val, w_val = x_data[:val_size], y_data[:val_size], w_data[:val_size]
        x_train, y_train, w_train = x_data[val_size:], y_data[val_size:], w_data[val_size:]
    else:
        x_train, y_train, w_train = x_data, y_data, w_data
        x_val, y_val, w_val = x_data, y_data, w_data

    train_ds = make_augmented_dataset(x_train, y_train, w_train, args.batch_size, training=True)
    val_ds = make_augmented_dataset(x_val, y_val, w_val, args.batch_size, training=False)

    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=args.lr),
        loss=tf.keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"],
    )

    before_loss, before_acc = model.evaluate(val_ds, verbose=0)
    print(f"[BEFORE] Validation Loss: {before_loss:.4f} | Validation Accuracy: {before_acc * 100:.2f}%")

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss" if has_val else "loss",
            patience=2,
            restore_best_weights=True,
        )
    ]

    history = model.fit(
        train_ds,
        validation_data=val_ds if has_val else None,
        epochs=args.epochs,
        callbacks=callbacks,
        verbose=1,
    )

    after_loss, after_acc = model.evaluate(val_ds, verbose=0)
    print(f"[AFTER]  Validation Loss: {after_loss:.4f} | Validation Accuracy: {after_acc * 100:.2f}%")

    passed_gate = (after_acc >= before_acc - 0.02) or args.force_save
    if passed_gate:
        model.save(OUTPUT_MODEL_PATH)
        print(f"[SUCCESS] Đã lưu mô hình fine-tune mới tại: {OUTPUT_MODEL_PATH}")
    else:
        print(
            "[WARNING] Validation Accuracy giảm quá 2% so với model gốc nên KHÔNG ghi đè. "
            "Kiểm tra lại nhãn phản hồi hoặc chạy với --force-save nếu vẫn muốn lưu."
        )

    report = {
        "timestamp": datetime.now().isoformat(),
        "feedback_samples": len(fb_paths),
        "replay_samples": len(rp_paths),
        "total_samples": len(all_paths),
        "feedback_stats": fb_stats,
        "hyperparams": {
            "epochs": args.epochs,
            "batch_size": args.batch_size,
            "lr": args.lr,
            "replay_per_class": args.replay_per_class,
            "max_feedback_per_class": args.max_feedback_per_class,
        },
        "val_loss_before": round(float(before_loss), 4),
        "val_acc_before": round(float(before_acc), 4),
        "val_loss_after": round(float(after_loss), 4),
        "val_acc_after": round(float(after_acc), 4),
        "passed_quality_gate": passed_gate,
        "output_model": str(OUTPUT_MODEL_PATH) if passed_gate else None,
        "final_train_acc": round(float(history.history["accuracy"][-1]), 4),
    }
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as rf:
        json.dump(report, rf, ensure_ascii=False, indent=2)
    print(f"[INFO] Đã xuất báo cáo huấn luyện tại: {REPORT_PATH}")


if __name__ == "__main__":
    main()
