"""
Online Reinforcement / Active Data Supplementation & Incremental Learning
for low-data and/or < 60% accuracy plant species.

Features:
1. Loads priority species (< 60% accuracy or low Train/Val/Test counts) from
   `model/priority_low_species.json`, with fallback to
   `Bao_Cao_Chi_Tiet_90_Loai_Cay_MobileNetV2.xlsx` and `model/labels_vi.json` / `model/class_names.json`.
2. `record_online_sample(...)`: MD5 deduplication, stores samples in
   `dataset_pipeline/online_buffer/<original_label>/`, and for priority species
   generates 3 lightweight PIL augmented variants (horizontal flip, slight rotation,
   brightness jitter) immediately into the buffer.
3. `run_online_incremental_update(...)`: Thread-safe micro-batch incremental
   fine-tuning (unfreezing only final classification head / last few layers with
   lr=1e-5), mixing online buffer with a small Replay Buffer + Balanced Class
   Weights x Reward Weight, quality-gating before saving `model/best_model_online.keras`
   and writing `dataset_pipeline/online_buffer/online_learning_status.json`.
4. `get_online_learning_status()`: Returns priority species list, buffered sample
   counts per priority species, auto-trigger threshold, and last run metrics.
"""

import hashlib
import json
import os
import random
import re
import shutil
import tempfile
import threading
import zipfile
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

import numpy as np
from PIL import Image, ImageEnhance, ImageOps

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"
DATASET_PIPELINE_DIR = BASE_DIR / "dataset_pipeline"
ONLINE_BUFFER_DIR = DATASET_PIPELINE_DIR / "online_buffer"
BUFFER_MANIFEST_PATH = ONLINE_BUFFER_DIR / "buffer_manifest.json"
STATUS_FILE_PATH = ONLINE_BUFFER_DIR / "online_learning_status.json"
ONLINE_MODEL_PATH = MODEL_DIR / "best_model_online.keras"

PRIORITY_JSON_CANDIDATES = [
    MODEL_DIR / "priority_low_species.json",
    Path(r"e:\dowload\ai-service\model\priority_low_species.json"),
    Path(r"e:\CNTT\NLCNHTTT\ai-service\model\priority_low_species.json"),
]

EXCEL_REPORT_CANDIDATES = [
    Path(r"e:\CNTT\NLCNHTTT\00_Tai_Lieu_Bao_Cao\Danh_Gia_Mo_Hinh\Bao_Cao_Chi_Tiet_90_Loai_Cay_MobileNetV2.xlsx"),
    BASE_DIR.parent / "00_Tai_Lieu_Bao_Cao" / "Danh_Gia_Mo_Hinh" / "Bao_Cao_Chi_Tiet_90_Loai_Cay_MobileNetV2.xlsx",
]

REPLAY_DIR_CANDIDATES = [
    DATASET_PIPELINE_DIR / "augmented_dataset" / "train",
    DATASET_PIPELINE_DIR / "augmented_dataset",
    DATASET_PIPELINE_DIR / "raw_images",
    DATASET_PIPELINE_DIR / "feedback_retrain",
    Path(r"e:\dowload\ai-service\dataset_pipeline\augmented_dataset\train"),
    Path(r"e:\dowload\ai-service\dataset_pipeline\raw_images"),
]

VALID_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
IMG_SIZE = (224, 224)
AUTO_TRIGGER_THRESHOLD = int(os.getenv("ONLINE_LEARNING_THRESHOLD", "10"))
LOW_ACCURACY_THRESHOLD_PCT = 60.0
LOW_TRAIN_COUNT_THRESHOLD = 150
LOW_TEST_COUNT_THRESHOLD = 20

_BUFFER_LOCK = threading.Lock()
_TRAIN_LOCK = threading.Lock()
_IS_TRAINING = False
_PRIORITY_CACHE: Optional[List[Dict[str, Any]]] = None
_PRIORITY_CACHE_MTIME: Optional[float] = None


def _sanitize_folder_name(label: str) -> str:
    """Keep folder name readable and Windows-safe."""
    cleaned = re.sub(r'[<>:"/\\|?*]+', "_", str(label or "").strip())
    return cleaned.strip(" .") or "unknown_species"


def _md5_file(path: Path) -> str:
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _normalize_rgb(img: Image.Image) -> Image.Image:
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        rgba = img.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        return Image.alpha_composite(bg, rgba).convert("RGB")
    return img.convert("RGB")


def _load_labels_metadata() -> Tuple[Dict[int, Dict[str, Any]], Dict[str, Dict[str, Any]]]:
    """
    Returns:
      by_ma_loai: {MaLoaiCay (1..90): {class_index, ma_loai_cay, original_label, vietnamese_name}}
      by_label_lower: {original_label.lower(): same dict}
    """
    by_ma_loai: Dict[int, Dict[str, Any]] = {}
    by_label_lower: Dict[str, Dict[str, Any]] = {}

    labels_vi_candidates = [
        MODEL_DIR / "labels_vi.json",
        Path(r"e:\dowload\ai-service\model\labels_vi.json"),
    ]
    class_names_candidates = [
        MODEL_DIR / "class_names.json",
        Path(r"e:\dowload\ai-service\model\class_names.json"),
    ]

    labels_vi_path = next((p for p in labels_vi_candidates if p.exists()), None)
    class_names_path = next((p for p in class_names_candidates if p.exists()), None)

    if labels_vi_path is not None:
        try:
            with open(labels_vi_path, "r", encoding="utf-8") as f:
                items = json.load(f)
            for it in items:
                cid = int(it.get("class_id", 0))
                ma = cid + 1
                orig = str(it.get("original_label", "")).strip()
                vi = str(it.get("vietnamese_name", orig)).strip()
                rec = {
                    "class_index": cid,
                    "ma_loai_cay": ma,
                    "original_label": orig,
                    "vietnamese_name": vi,
                }
                by_ma_loai[ma] = rec
                if orig:
                    by_label_lower[orig.lower()] = rec
                    by_label_lower[_sanitize_folder_name(orig).lower()] = rec
        except Exception:
            pass
    elif class_names_path is not None:
        try:
            with open(class_names_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                for idx, item in enumerate(data):
                    orig = str(item.get("original_label") if isinstance(item, dict) else item).strip()
                    rec = {
                        "class_index": idx,
                        "ma_loai_cay": idx + 1,
                        "original_label": orig,
                        "vietnamese_name": orig,
                    }
                    by_ma_loai[idx + 1] = rec
                    if orig:
                        by_label_lower[orig.lower()] = rec
                        by_label_lower[_sanitize_folder_name(orig).lower()] = rec
            elif isinstance(data, dict):
                for idx_str, item in data.items():
                    idx = int(idx_str)
                    orig = str(item.get("original_label") if isinstance(item, dict) else item).strip()
                    rec = {
                        "class_index": idx,
                        "ma_loai_cay": idx + 1,
                        "original_label": orig,
                        "vietnamese_name": orig,
                    }
                    by_ma_loai[idx + 1] = rec
                    if orig:
                        by_label_lower[orig.lower()] = rec
                        by_label_lower[_sanitize_folder_name(orig).lower()] = rec
        except Exception:
            pass

    return by_ma_loai, by_label_lower


def _load_priority_from_excel() -> List[Dict[str, Any]]:
    """Fallback loader reading Bao_Cao_Chi_Tiet_90_Loai_Cay_MobileNetV2.xlsx."""
    excel_path = next((p for p in EXCEL_REPORT_CANDIDATES if p.exists()), None)
    if excel_path is None:
        return []

    try:
        import openpyxl
    except ImportError:
        return []

    _, by_label_lower = _load_labels_metadata()

    try:
        wb = openpyxl.load_workbook(str(excel_path), data_only=True)
    except Exception:
        return []

    split_counts: Dict[str, Tuple[int, int, int]] = {}
    if "Phan_Bo_Du_Lieu_30k" in wb.sheetnames:
        ws_split = wb["Phan_Bo_Du_Lieu_30k"]
        for row in ws_split.iter_rows(min_row=5, values_only=True):
            if not row or len(row) < 6 or not row[2]:
                continue
            orig_label = str(row[2]).strip()
            try:
                tr = int(row[3] or 0)
                va = int(row[4] or 0)
                te = int(row[5] or 0)
                split_counts[orig_label.lower()] = (tr, va, te)
            except (TypeError, ValueError):
                continue

    priority_list: List[Dict[str, Any]] = []
    sheet_name = "Bao_Cao_90_Loai" if "Bao_Cao_90_Loai" in wb.sheetnames else wb.sheetnames[0]
    ws = wb[sheet_name]
    for row in ws.iter_rows(min_row=4, values_only=True):
        if not row or len(row) < 6 or not row[0]:
            continue
        orig_label = str(row[0]).strip()
        vi_name = str(row[1] or orig_label).strip()
        try:
            precision = float(row[2]) if row[2] is not None else 0.0
            recall = float(row[3]) if row[3] is not None else 0.0
            f1 = float(row[4]) if row[4] is not None else 0.0
            test_cnt_sheet = int(row[5]) if row[5] is not None else 0
        except (TypeError, ValueError):
            continue

        recall_pct = round(recall * 100.0 if recall <= 1.0 else recall, 2)
        f1_pct = round(f1 * 100.0 if f1 <= 1.0 else f1, 2)
        tr_cnt, va_cnt, te_cnt = split_counts.get(orig_label.lower(), (0, 0, test_cnt_sheet))
        if te_cnt == 0:
            te_cnt = test_cnt_sheet

        reasons: List[str] = []
        if recall_pct < LOW_ACCURACY_THRESHOLD_PCT:
            reasons.append(f"Recall < 60% ({recall_pct}%)")
        if f1_pct < LOW_ACCURACY_THRESHOLD_PCT:
            reasons.append(f"F1 < 60% ({f1_pct}%)")
        if 0 < tr_cnt < LOW_TRAIN_COUNT_THRESHOLD:
            reasons.append(f"Low Train ({tr_cnt})")
        if 0 < te_cnt < LOW_TEST_COUNT_THRESHOLD:
            reasons.append(f"Low Test ({te_cnt})")

        if reasons:
            meta = by_label_lower.get(orig_label.lower(), {})
            priority_list.append(
                {
                    "ma_loai_cay": meta.get("ma_loai_cay"),
                    "vietnamese_name": meta.get("vietnamese_name") or vi_name,
                    "original_label": orig_label,
                    "recall_pct": recall_pct,
                    "f1_pct": f1_pct,
                    "precision_pct": round(precision * 100.0 if precision <= 1.0 else precision, 2),
                    "train_count": tr_cnt,
                    "val_count": va_cnt,
                    "test_count": te_cnt,
                    "reason": "; ".join(reasons),
                }
            )

    wb.close()
    priority_list.sort(key=lambda x: (x.get("recall_pct", 100.0), x.get("train_count", 9999)))
    return priority_list


def _normalize_priority_entry(item: Dict[str, Any], by_ma_loai: Dict[int, Dict[str, Any]], by_label_lower: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    orig = str(item.get("original_label") or item.get("label") or "").strip()
    ma = item.get("ma_loai_cay") or item.get("MaLoaiCay")
    meta = None
    if ma is not None:
        try:
            meta = by_ma_loai.get(int(ma))
        except (TypeError, ValueError):
            meta = None
    if meta is None and orig:
        meta = by_label_lower.get(orig.lower())

    resolved_ma = int(ma) if ma is not None else (meta["ma_loai_cay"] if meta else None)
    resolved_orig = orig or (meta["original_label"] if meta else "")
    resolved_vi = str(item.get("vietnamese_name") or (meta["vietnamese_name"] if meta else resolved_orig)).strip()

    recall_raw = item.get("recall_pct", item.get("recall", item.get("accuracy_pct")))
    recall_pct = None
    if recall_raw is not None:
        try:
            val = float(recall_raw)
            recall_pct = round(val * 100.0 if 0.0 <= val <= 1.0 else val, 2)
        except (TypeError, ValueError):
            recall_pct = None

    return {
        "ma_loai_cay": resolved_ma,
        "vietnamese_name": resolved_vi,
        "original_label": resolved_orig,
        "recall_pct": recall_pct,
        "train_count": int(item.get("train_count") or 0),
        "val_count": int(item.get("val_count") or 0),
        "test_count": int(item.get("test_count") or 0),
        "reason": str(item.get("reason") or "Low data / < 60% accuracy"),
    }


def load_priority_species(force_reload: bool = False) -> List[Dict[str, Any]]:
    """
    Load priority low-data / < 60% species list from `model/priority_low_species.json`.
    Falls back to reading `Bao_Cao_Chi_Tiet_90_Loai_Cay_MobileNetV2.xlsx` or `class_names.json`.
    """
    global _PRIORITY_CACHE, _PRIORITY_CACHE_MTIME

    json_path = next((p for p in PRIORITY_JSON_CANDIDATES if p.exists()), None)
    current_mtime = json_path.stat().st_mtime if json_path is not None else None

    if not force_reload and _PRIORITY_CACHE is not None and current_mtime == _PRIORITY_CACHE_MTIME:
        return _PRIORITY_CACHE

    by_ma_loai, by_label_lower = _load_labels_metadata()
    loaded: List[Dict[str, Any]] = []

    if json_path is not None:
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
            if isinstance(raw, dict):
                raw_items = (
                    raw.get("priority_species")
                    or raw.get("species")
                    or raw.get("items")
                    or []
                )
            elif isinstance(raw, list):
                raw_items = raw
            else:
                raw_items = []
            for item in raw_items:
                if isinstance(item, dict):
                    loaded.append(_normalize_priority_entry(item, by_ma_loai, by_label_lower))
        except Exception:
            loaded = []

    if not loaded:
        loaded = _load_priority_from_excel()

    _PRIORITY_CACHE = loaded
    _PRIORITY_CACHE_MTIME = current_mtime
    return loaded


def is_priority_species(
    ma_loai_cay: Optional[int] = None, original_label: Optional[str] = None
) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """Check whether a species belongs to the priority low-data / < 60% list."""
    species = load_priority_species()
    target_ma = None
    if ma_loai_cay is not None:
        try:
            target_ma = int(ma_loai_cay)
        except (TypeError, ValueError):
            target_ma = None
    target_lbl = str(original_label or "").strip().lower()

    for sp in species:
        if target_ma is not None and sp.get("ma_loai_cay") == target_ma:
            return True, sp
        if target_lbl and str(sp.get("original_label") or "").strip().lower() == target_lbl:
            return True, sp
    return False, None


def _load_manifest() -> Dict[str, Any]:
    if BUFFER_MANIFEST_PATH.exists():
        try:
            with open(BUFFER_MANIFEST_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict):
                data.setdefault("items", [])
                data.setdefault("seen_md5", {})
                return data
        except Exception:
            pass
    return {"items": [], "seen_md5": {}, "updated_at": None}


def _save_manifest(manifest: Dict[str, Any]) -> None:
    ONLINE_BUFFER_DIR.mkdir(parents=True, exist_ok=True)
    manifest["updated_at"] = datetime.now().isoformat()
    tmp_path = BUFFER_MANIFEST_PATH.with_suffix(".tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    tmp_path.replace(BUFFER_MANIFEST_PATH)


def _load_status_file() -> Dict[str, Any]:
    if STATUS_FILE_PATH.exists():
        try:
            with open(STATUS_FILE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict):
                return data
        except Exception:
            pass
    return {
        "status": "idle",
        "message": "Chưa có đợt học tăng cường Online nào được chạy.",
        "started_at": None,
        "finished_at": None,
        "samples_used": 0,
        "priority_samples_used": 0,
        "replay_samples_used": 0,
        "val_acc_before": None,
        "val_acc_after": None,
        "val_loss_before": None,
        "val_loss_after": None,
        "quality_gate_passed": None,
        "saved_model_path": None,
        "trained_raw_count": 0,
    }


def _save_status_file(status_data: Dict[str, Any]) -> None:
    ONLINE_BUFFER_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = STATUS_FILE_PATH.with_suffix(".tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(status_data, f, ensure_ascii=False, indent=2)
    tmp_path.replace(STATUS_FILE_PATH)


def _generate_priority_augmentations(src_img_path: Path, dst_dir: Path, stem: str) -> List[Path]:
    """
    Generate 3 lightweight online augmented variants for low-data priority species:
    1) Horizontal flip
    2) Slight rotation (+8 deg or -8 deg)
    3) Brightness jitter (1.15x or 0.85x)
    """
    aug_paths: List[Path] = []
    try:
        with Image.open(src_img_path) as raw:
            rgb = _normalize_rgb(raw)

            # 1. Horizontal flip
            flip_path = dst_dir / f"{stem}_aug_flip.jpg"
            ImageOps.mirror(rgb).save(flip_path, format="JPEG", quality=92)
            aug_paths.append(flip_path)

            # 2. Slight rotation
            angle = 8.0 if (hash(stem) % 2 == 0) else -8.0
            rot_path = dst_dir / f"{stem}_aug_rot.jpg"
            rgb.rotate(angle, resample=Image.Resampling.BILINEAR, fillcolor=(255, 255, 255)).save(
                rot_path, format="JPEG", quality=92
            )
            aug_paths.append(rot_path)

            # 3. Brightness jitter
            factor = 1.15 if (hash(stem) % 2 == 0) else 0.85
            bright_path = dst_dir / f"{stem}_aug_bright.jpg"
            ImageEnhance.Brightness(rgb).enhance(factor).save(
                bright_path, format="JPEG", quality=92
            )
            aug_paths.append(bright_path)
    except Exception:
        pass
    return aug_paths


def record_online_sample(
    image_path: str,
    ma_loai_cay: Optional[int],
    original_label: Optional[str],
    reward: int = 1,
    is_priority: Optional[bool] = None,
) -> Dict[str, Any]:
    """
    Deduplicate via MD5, copy into `dataset_pipeline/online_buffer/<original_label>/`,
    and when `is_priority` is True generate 3 lightweight augmented variants.
    """
    src = Path(image_path)
    if not src.exists() or not src.is_file():
        return {
            "recorded": False,
            "duplicate": False,
            "reason": f"Image file not found: {image_path}",
            "is_priority": bool(is_priority),
            "saved_path": None,
            "augmented_paths": [],
            "total_saved_files": 0,
        }

    by_ma_loai, by_label_lower = _load_labels_metadata()
    resolved_label = str(original_label or "").strip()
    resolved_ma = int(ma_loai_cay) if ma_loai_cay is not None else None

    if not resolved_label and resolved_ma is not None and resolved_ma in by_ma_loai:
        resolved_label = by_ma_loai[resolved_ma]["original_label"]
    elif resolved_ma is None and resolved_label and resolved_label.lower() in by_label_lower:
        resolved_ma = by_label_lower[resolved_label.lower()]["ma_loai_cay"]

    if not resolved_label:
        resolved_label = f"class_{resolved_ma}" if resolved_ma is not None else "unknown_species"

    if is_priority is None:
        is_priority_flag, _ = is_priority_species(ma_loai_cay=resolved_ma, original_label=resolved_label)
    else:
        is_priority_flag = bool(is_priority)

    file_md5 = _md5_file(src)
    safe_folder = _sanitize_folder_name(resolved_label)
    dst_dir = ONLINE_BUFFER_DIR / safe_folder

    with _BUFFER_LOCK:
        manifest = _load_manifest()
        seen_md5: Dict[str, str] = manifest.get("seen_md5", {})
        if file_md5 in seen_md5:
            status_prev = _load_status_file()
            raw_count = sum(1 for it in manifest.get("items", []) if not it.get("is_augmented", False))
            new_since_train = max(0, raw_count - int(status_prev.get("trained_raw_count") or 0))
            return {
                "recorded": False,
                "duplicate": True,
                "md5": file_md5,
                "is_priority": is_priority_flag,
                "saved_path": seen_md5[file_md5],
                "augmented_paths": [],
                "total_saved_files": 0,
                "new_samples_since_last_train": new_since_train,
                "should_auto_trigger": new_since_train >= AUTO_TRIGGER_THRESHOLD,
            }

        dst_dir.mkdir(parents=True, exist_ok=True)
        ext = src.suffix.lower() if src.suffix.lower() in VALID_EXTS else ".jpg"
        ts = int(datetime.now().timestamp() * 1000)
        stem = f"ol_{ts}_{file_md5[:10]}"
        dst_path = dst_dir / f"{stem}{ext}"
        shutil.copy2(src, dst_path)

        now_iso = datetime.now().isoformat()
        seen_md5[file_md5] = str(dst_path)
        manifest["seen_md5"] = seen_md5
        manifest["items"].append(
            {
                "file_path": str(dst_path),
                "md5": file_md5,
                "ma_loai_cay": resolved_ma,
                "original_label": resolved_label,
                "folder": safe_folder,
                "reward": int(reward),
                "is_priority": is_priority_flag,
                "is_augmented": False,
                "recorded_at": now_iso,
            }
        )

        aug_paths: List[Path] = []
        if is_priority_flag:
            aug_paths = _generate_priority_augmentations(dst_path, dst_dir, stem)
            for ap in aug_paths:
                manifest["items"].append(
                    {
                        "file_path": str(ap),
                        "md5": _md5_file(ap),
                        "source_md5": file_md5,
                        "ma_loai_cay": resolved_ma,
                        "original_label": resolved_label,
                        "folder": safe_folder,
                        "reward": int(reward),
                        "is_priority": True,
                        "is_augmented": True,
                        "recorded_at": now_iso,
                    }
                )

        _save_manifest(manifest)

        status_prev = _load_status_file()
        raw_count = sum(1 for it in manifest.get("items", []) if not it.get("is_augmented", False))
        new_since_train = max(0, raw_count - int(status_prev.get("trained_raw_count") or 0))

    return {
        "recorded": True,
        "duplicate": False,
        "md5": file_md5,
        "ma_loai_cay": resolved_ma,
        "original_label": resolved_label,
        "is_priority": is_priority_flag,
        "saved_path": str(dst_path),
        "augmented_paths": [str(p) for p in aug_paths],
        "total_saved_files": 1 + len(aug_paths),
        "new_samples_since_last_train": new_since_train,
        "should_auto_trigger": new_since_train >= AUTO_TRIGGER_THRESHOLD,
    }


def _load_keras_compat(tf_mod: Any, model_path: Path):
    """Safely load .keras models across Keras 3.x versions."""
    try:
        return tf_mod.keras.models.load_model(str(model_path), compile=False)
    except TypeError:
        fd, tmp_name = tempfile.mkstemp(suffix=".keras")
        os.close(fd)
        tmp_path = Path(tmp_name)
        try:
            with zipfile.ZipFile(str(model_path), "r") as zin, zipfile.ZipFile(
                str(tmp_path), "w", compression=zipfile.ZIP_DEFLATED
            ) as zout:
                for item in zin.infolist():
                    data = zin.read(item.filename)
                    if item.filename == "config.json":
                        cfg = json.loads(data.decode("utf-8"))

                        def _strip(obj):
                            if isinstance(obj, dict):
                                obj.pop("quantization_config", None)
                                for v in obj.values():
                                    _strip(v)
                            elif isinstance(obj, list):
                                for v in obj:
                                    _strip(v)

                        _strip(cfg)
                        data = json.dumps(cfg).encode("utf-8")
                    zout.writestr(item, data)
            return tf_mod.keras.models.load_model(str(tmp_path), compile=False)
        finally:
            tmp_path.unlink(missing_ok=True)


def _find_base_model_path() -> Optional[Path]:
    candidates = [
        ONLINE_MODEL_PATH,
        MODEL_DIR / "best_model.keras",
        MODEL_DIR / "mobilenetv2_tu_so_0_seed_999.keras",
        MODEL_DIR / "efficientnet_b0_tu_so_0.keras",
        Path(r"e:\dowload\ai-service\model\best_model.keras"),
        Path(r"e:\dowload\ai-service\model\mobilenetv2_tu_so_0_seed_999.keras"),
    ]
    return next((p for p in candidates if p.exists()), None)


def _load_image_tensor(path: Path, target_size: Tuple[int, int] = IMG_SIZE) -> np.ndarray:
    with Image.open(path) as img:
        rgb = _normalize_rgb(img).resize(target_size, Image.Resampling.BILINEAR)
        return np.asarray(rgb, dtype=np.float32)


def _collect_online_buffer_samples(
    by_label_lower: Dict[str, Dict[str, Any]],
) -> Tuple[List[Path], List[int], List[float], int, int]:
    """Return (paths, class_indices, reward_weights, priority_count, raw_count)."""
    paths: List[Path] = []
    labels: List[int] = []
    reward_weights: List[float] = []
    priority_count = 0
    raw_count = 0

    manifest = _load_manifest()
    meta_by_path: Dict[str, Dict[str, Any]] = {}
    for it in manifest.get("items", []):
        fp = it.get("file_path")
        if fp:
            meta_by_path[str(Path(fp).resolve())] = it

    if not ONLINE_BUFFER_DIR.exists():
        return paths, labels, reward_weights, priority_count, raw_count

    for folder in sorted(ONLINE_BUFFER_DIR.iterdir()):
        if not folder.is_dir():
            continue
        meta = by_label_lower.get(folder.name.lower())
        if meta is None:
            continue
        cls_idx = int(meta["class_index"])
        is_prio_cls, _ = is_priority_species(
            ma_loai_cay=meta["ma_loai_cay"], original_label=meta["original_label"]
        )

        for img_file in sorted(folder.iterdir()):
            if img_file.suffix.lower() not in VALID_EXTS:
                continue
            item_meta = meta_by_path.get(str(img_file.resolve()), {})
            reward = int(item_meta.get("reward", 1))
            is_aug = bool(item_meta.get("is_augmented", "_aug_" in img_file.stem))
            if not is_aug:
                raw_count += 1
            if is_prio_cls or item_meta.get("is_priority"):
                priority_count += 1

            rw = 1.5 if reward < 0 else 1.0
            if is_prio_cls or item_meta.get("is_priority"):
                rw *= 1.25
            paths.append(img_file)
            labels.append(cls_idx)
            reward_weights.append(rw)

    return paths, labels, reward_weights, priority_count, raw_count


def _collect_replay_samples(
    by_label_lower: Dict[str, Dict[str, Any]],
    max_per_class: int = 3,
    max_total: int = 90,
    seed: int = 42,
) -> Tuple[List[Path], List[int], List[float]]:
    """Collect a small Replay Buffer to guard against Catastrophic Forgetting."""
    replay_root = next((p for p in REPLAY_DIR_CANDIDATES if p.exists() and p.is_dir()), None)
    if replay_root is None:
        return [], [], []

    rng = random.Random(seed)
    paths: List[Path] = []
    labels: List[int] = []
    weights: List[float] = []

    for folder in sorted(replay_root.iterdir()):
        if not folder.is_dir():
            continue
        meta = by_label_lower.get(folder.name.lower())
        if meta is None:
            continue
        cls_idx = int(meta["class_index"])
        imgs = [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in VALID_EXTS]
        if not imgs:
            continue
        chosen = rng.sample(imgs, min(len(imgs), max_per_class))
        for p in chosen:
            paths.append(p)
            labels.append(cls_idx)
            weights.append(1.0)
            if len(paths) >= max_total:
                return paths, labels, weights

    return paths, labels, weights


def _compute_balanced_sample_weights(labels: List[int], reward_weights: List[float]) -> np.ndarray:
    """Balanced Class Weights (clipped to [0.5, 3.0]) x Reward Weight."""
    counts = Counter(labels)
    total = max(len(labels), 1)
    num_classes = max(len(counts), 1)
    out = []
    for lbl, rw in zip(labels, reward_weights):
        cls_w = total / (num_classes * max(counts[lbl], 1))
        cls_w = min(max(cls_w, 0.5), 3.0)
        out.append(cls_w * rw)
    return np.array(out, dtype=np.float32)


def run_online_incremental_update(
    epochs: int = 3,
    batch_size: int = 8,
    lr: float = 1e-5,
    replay_per_class: int = 2,
    unfreeze_last_layers: int = 6,
    force_save: bool = False,
    on_model_saved: Optional[Callable[[str], None]] = None,
) -> Dict[str, Any]:
    """
    Run a safe micro-batch incremental fine-tune in background:
    - Unfreezes only the final classification head / last few layers with low lr=1e-5.
    - Mixes online buffer samples with a small Replay Buffer + Balanced Class Weights x Reward Weight.
    - Quality-gates before saving `model/best_model_online.keras` and writing
      `dataset_pipeline/online_buffer/online_learning_status.json`.
    """
    global _IS_TRAINING

    if not _TRAIN_LOCK.acquire(blocking=False):
        return {
            "status": "already_running",
            "message": "Một phiên học tăng cường Online khác đang chạy. Vui lòng chờ hoàn tất.",
        }

    started_at = datetime.now().isoformat()
    _IS_TRAINING = True
    try:
        prev_status = _load_status_file()
        _save_status_file(
            {
                **prev_status,
                "status": "running",
                "started_at": started_at,
                "message": "Đang chạy học tăng cường Online (micro-batch incremental fine-tune)...",
            }
        )

        _, by_label_lower = _load_labels_metadata()
        ol_paths, ol_labels, ol_rweights, prio_cnt, raw_cnt = _collect_online_buffer_samples(by_label_lower)

        if not ol_paths:
            res = {
                **prev_status,
                "status": "skipped",
                "started_at": started_at,
                "finished_at": datetime.now().isoformat(),
                "samples_used": 0,
                "priority_samples_used": 0,
                "replay_samples_used": 0,
                "quality_gate_passed": False,
                "message": "Chưa có mẫu ảnh nào trong online_buffer để huấn luyện tăng cường.",
            }
            _save_status_file(res)
            return res

        if os.getenv("SKIP_AI_LOAD", "0") == "1":
            res = {
                **prev_status,
                "status": "skipped",
                "started_at": started_at,
                "finished_at": datetime.now().isoformat(),
                "samples_used": len(ol_paths),
                "priority_samples_used": prio_cnt,
                "replay_samples_used": 0,
                "quality_gate_passed": False,
                "message": "Bỏ qua huấn luyện vì SKIP_AI_LOAD=1 đang bật (chế độ test nhẹ).",
            }
            _save_status_file(res)
            return res

        try:
            import tensorflow as tf
        except ImportError:
            res = {
                **prev_status,
                "status": "error",
                "started_at": started_at,
                "finished_at": datetime.now().isoformat(),
                "quality_gate_passed": False,
                "message": "Không tìm thấy TensorFlow trong môi trường hiện tại.",
            }
            _save_status_file(res)
            return res

        base_model_path = _find_base_model_path()
        if base_model_path is None:
            res = {
                **prev_status,
                "status": "error",
                "started_at": started_at,
                "finished_at": datetime.now().isoformat(),
                "quality_gate_passed": False,
                "message": "Không tìm thấy file model .keras gốc trong thư mục model/.",
            }
            _save_status_file(res)
            return res

        rp_paths, rp_labels, rp_rweights = _collect_replay_samples(
            by_label_lower, max_per_class=replay_per_class
        )

        all_paths = ol_paths + rp_paths
        all_labels = ol_labels + rp_labels
        all_rweights = ol_rweights + rp_rweights
        all_weights = _compute_balanced_sample_weights(all_labels, all_rweights)

        model = _load_keras_compat(tf, base_model_path)
        input_shape = tuple(model.input_shape[1:3]) if model.input_shape and len(model.input_shape) >= 3 else IMG_SIZE

        x_list, y_list, w_list, grp_list = [], [], [], []
        for p, y_val, w_val in zip(all_paths, all_labels, all_weights):
            try:
                x_list.append(_load_image_tensor(p, target_size=input_shape))
                y_list.append(y_val)
                w_list.append(w_val)
                # Group raw image and all its augmented variants (_aug_flip/_aug_rot/_aug_bright) together
                base_stem = re.sub(r"_aug_(?:flip|rot|bright)$", "", p.stem)
                grp_list.append(f"{p.parent.name}::{base_stem}")
            except Exception:
                continue

        if not x_list:
            res = {
                **prev_status,
                "status": "error",
                "started_at": started_at,
                "finished_at": datetime.now().isoformat(),
                "quality_gate_passed": False,
                "message": "Không thể đọc hợp lệ các ảnh trong online_buffer.",
            }
            _save_status_file(res)
            return res

        x_data = np.stack(x_list, axis=0)
        y_data = np.array(y_list, dtype=np.int32)
        w_data = np.array(w_list, dtype=np.float32)

        # Group-based Train/Validation split by original source image to prevent augmentation leakage
        unique_groups = sorted(set(grp_list))
        if len(unique_groups) < 5 and not force_save:
            res = {
                **prev_status,
                "status": "skipped",
                "started_at": started_at,
                "finished_at": datetime.now().isoformat(),
                "samples_used": int(len(x_data)),
                "unique_source_groups": len(unique_groups),
                "quality_gate_passed": False,
                "message": (
                    f"Chưa đủ ảnh gốc độc lập để tách tập Validation chống rò rỉ dữ liệu "
                    f"(hiện có {len(unique_groups)} nhóm ảnh gốc, cần tối thiểu 5)."
                ),
            }
            _save_status_file(res)
            return res

        rng = np.random.default_rng(42)
        shuffled_groups = list(unique_groups)
        rng.shuffle(shuffled_groups)
        val_group_n = max(1, int(round(len(shuffled_groups) * 0.2)))
        val_groups = set(shuffled_groups[:val_group_n])

        train_idx = [i for i, g in enumerate(grp_list) if g not in val_groups]
        val_idx = [i for i, g in enumerate(grp_list) if g in val_groups]
        if not train_idx or not val_idx:
            # Fallback only when force_save=True and unique_groups == 1
            train_idx = list(range(len(x_data)))
            val_idx = list(range(len(x_data)))

        rng.shuffle(train_idx)
        x_train, y_train, w_train = x_data[train_idx], y_data[train_idx], w_data[train_idx]
        x_val, y_val, w_val = x_data[val_idx], y_data[val_idx], w_data[val_idx]

        # Freeze backbone; unfreeze only the final classification head / last few layers (keep BN frozen)
        for layer in model.layers:
            layer.trainable = False
        for layer in model.layers[-max(1, unfreeze_last_layers):]:
            if isinstance(layer, tf.keras.layers.BatchNormalization):
                layer.trainable = False
            else:
                layer.trainable = True

        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
            loss="sparse_categorical_crossentropy",
            metrics=["accuracy"],
        )

        eval_before = model.evaluate(x_val, y_val, sample_weight=w_val, batch_size=batch_size, verbose=0)
        val_loss_before = float(eval_before[0])
        val_acc_before = float(eval_before[1])

        model.fit(
            x_train,
            y_train,
            sample_weight=w_train,
            validation_data=(x_val, y_val, w_val),
            epochs=max(1, int(epochs)),
            batch_size=min(max(1, int(batch_size)), len(x_train)),
            verbose=0,
        )

        eval_after = model.evaluate(x_val, y_val, sample_weight=w_val, batch_size=batch_size, verbose=0)
        val_loss_after = float(eval_after[0])
        val_acc_after = float(eval_after[1])

        # Quality Gate: reject update if validation accuracy drops > 2% without loss improvement
        quality_gate_passed = bool(
            force_save
            or (val_acc_after >= val_acc_before - 0.02 and val_loss_after <= val_loss_before * 1.10)
            or (val_acc_after > val_acc_before)
        )

        saved_path_str = None
        if quality_gate_passed:
            MODEL_DIR.mkdir(parents=True, exist_ok=True)
            model.save(str(ONLINE_MODEL_PATH))
            saved_path_str = str(ONLINE_MODEL_PATH)
            if on_model_saved is not None:
                try:
                    on_model_saved(saved_path_str)
                except Exception as reload_err:
                    print(f"[OnlineLearning] Warning hot-reloading model: {reload_err}")

        res = {
            "status": "completed" if quality_gate_passed else "rejected_by_quality_gate",
            "started_at": started_at,
            "finished_at": datetime.now().isoformat(),
            "base_model": str(base_model_path.name),
            "samples_used": int(len(x_data)),
            "online_buffer_samples": int(len(ol_paths)),
            "priority_samples_used": int(prio_cnt),
            "replay_samples_used": int(len(rp_paths)),
            "epochs": int(epochs),
            "lr": float(lr),
            "val_acc_before": round(val_acc_before * 100.0, 2),
            "val_acc_after": round(val_acc_after * 100.0, 2),
            "val_loss_before": round(val_loss_before, 4),
            "val_loss_after": round(val_loss_after, 4),
            "quality_gate_passed": quality_gate_passed,
            "saved_model_path": saved_path_str,
            "trained_raw_count": int(raw_cnt) if quality_gate_passed else int(prev_status.get("trained_raw_count") or 0),
            "message": (
                f"Đã cập nhật model Online thành công! Val Acc: {val_acc_before*100:.2f}% -> {val_acc_after*100:.2f}%."
                if quality_gate_passed
                else f"Quality Gate từ chối bản cập nhật (Val Acc: {val_acc_before*100:.2f}% -> {val_acc_after*100:.2f}%). Giữ nguyên model hiện tại."
            ),
        }
        _save_status_file(res)
        return res
    except Exception as e:
        res = {
            **_load_status_file(),
            "status": "error",
            "started_at": started_at,
            "finished_at": datetime.now().isoformat(),
            "quality_gate_passed": False,
            "message": f"Lỗi khi chạy học tăng cường Online: {e}",
        }
        _save_status_file(res)
        return res
    finally:
        _IS_TRAINING = False
        _TRAIN_LOCK.release()


def get_online_learning_status() -> Dict[str, Any]:
    """
    Returns priority species list, buffered sample counts per priority species,
    auto-trigger threshold, and last online training run status/metrics.
    """
    priority_species = load_priority_species()
    manifest = _load_manifest()
    last_run = _load_status_file()

    # Count actual files on disk per folder + raw vs augmented from manifest
    folder_total_counts: Dict[str, int] = {}
    if ONLINE_BUFFER_DIR.exists():
        for folder in ONLINE_BUFFER_DIR.iterdir():
            if not folder.is_dir():
                continue
            cnt = sum(1 for p in folder.iterdir() if p.is_file() and p.suffix.lower() in VALID_EXTS)
            if cnt > 0:
                folder_total_counts[folder.name.lower()] = cnt

    raw_counts_by_folder: Dict[str, int] = Counter()
    total_raw_samples = 0
    for it in manifest.get("items", []):
        fp = it.get("file_path")
        if fp and not Path(fp).exists():
            continue
        if not it.get("is_augmented", False):
            total_raw_samples += 1
            folder_key = str(it.get("folder") or _sanitize_folder_name(it.get("original_label", ""))).lower()
            raw_counts_by_folder[folder_key] += 1

    enriched_priority: List[Dict[str, Any]] = []
    buffered_by_priority: Dict[str, int] = {}
    priority_buffered_total = 0

    for sp in priority_species:
        orig = str(sp.get("original_label") or "")
        fkey = _sanitize_folder_name(orig).lower()
        buf_cnt = folder_total_counts.get(fkey, 0)
        buf_raw = raw_counts_by_folder.get(fkey, 0)
        priority_buffered_total += buf_cnt
        buffered_by_priority[orig] = buf_cnt
        enriched_priority.append(
            {
                **sp,
                "buffered_count": buf_cnt,
                "buffered_raw_count": buf_raw,
            }
        )

    total_buffered_samples = sum(folder_total_counts.values())
    trained_raw_count = int(last_run.get("trained_raw_count") or 0)
    new_samples_since_last_train = max(0, total_raw_samples - trained_raw_count)

    return {
        "priority_species_count": len(enriched_priority),
        "priority_species": enriched_priority,
        "buffered_counts_by_priority_species": buffered_by_priority,
        "total_buffered_samples": total_buffered_samples,
        "total_buffered_raw_samples": total_raw_samples,
        "priority_buffered_samples": priority_buffered_total,
        "new_samples_since_last_train": new_samples_since_last_train,
        "auto_trigger_threshold": AUTO_TRIGGER_THRESHOLD,
        "ready_for_update": total_buffered_samples > 0 and new_samples_since_last_train >= AUTO_TRIGGER_THRESHOLD,
        "is_running": _IS_TRAINING or last_run.get("status") == "running",
        "online_model_exists": ONLINE_MODEL_PATH.exists(),
        "online_model_path": str(ONLINE_MODEL_PATH),
        "buffer_dir": str(ONLINE_BUFFER_DIR),
        "last_run": last_run,
    }
