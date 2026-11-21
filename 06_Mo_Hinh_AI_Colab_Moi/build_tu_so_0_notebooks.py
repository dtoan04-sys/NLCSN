"""Build clean, resume-safe Google Colab Free notebooks for from-scratch 90-class experiments."""

from __future__ import annotations

import ast
import base64
import json
import zlib
from pathlib import Path

import nbformat as nbf


ROOT = Path(r'e:\CNTT\NLCNHTTT\06_Mo_Hinh_AI_Colab_Moi')
CORE_PATH = ROOT / 'pipeline_tu_so_0_core.py'
BASELINE_PATH = ROOT / 'baseline_bao_cao_mau.json'

NB1_PATH = ROOT / 'Train_3_Seeds_Tu_So_0_99_123_999_Colab.ipynb'
NB2_PATH = ROOT / 'So_Sanh_4_Mo_Hinh_Tu_So_0_Colab.ipynb'


def encode_baseline_b64() -> str:
    raw = BASELINE_PATH.read_bytes()
    comp = zlib.compress(raw, level=9)
    return base64.b64encode(comp).decode('ascii')


def load_core_body() -> str:
    src = CORE_PATH.read_text(encoding='utf-8')
    # Strip module-level __future__ import because Colab executes inside an existing cell context
    lines = [
        ln for ln in src.splitlines()
        if not ln.startswith('from __future__ import')
    ]
    return '\n'.join(lines).strip()


SHARED_HELPERS_CODE = '''
# ==============================================================================
# === BỘ TRỢ GIÚP CHUNG: NẠP MODEL AN TOÀN, CONTROLLER BÃO HÒA & CHIA DỮ LIỆU ===
# ==============================================================================
EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}

def find_first_existing(candidates, rglob_pattern=None):
    for p in candidates:
        if p.is_file():
            return p
    if rglob_pattern:
        found = sorted(PROJECT.rglob(rglob_pattern))
        if found:
            return found[0]
    return None

def sanitize_keras_archive(model_path: Path) -> Path:
    """Loại bỏ quantization_config dư thừa trong config.json nếu chuyển phiên bản Keras."""
    clean_path = Path('/tmp') / f'_compat_{os.getpid()}_{model_path.name}'
    changed = False
    with zipfile.ZipFile(model_path, 'r') as zin:
        with zipfile.ZipFile(clean_path, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename == 'config.json':
                    cfg = json.loads(data.decode('utf-8'))
                    def _strip(obj):
                        nonlocal changed
                        if isinstance(obj, dict):
                            if 'quantization_config' in obj:
                                obj.pop('quantization_config')
                                changed = True
                            for v in obj.values():
                                _strip(v)
                        elif isinstance(obj, list):
                            for v in obj:
                                _strip(v)
                    _strip(cfg)
                    data = json.dumps(cfg).encode('utf-8')
                zout.writestr(item, data)
    return clean_path if changed else model_path

def compat_load_model(model_path: Path, compile: bool = False):
    clean_p = sanitize_keras_archive(model_path)
    try:
        try:
            return keras.models.load_model(str(clean_p), compile=compile, safe_mode=False)
        except TypeError:
            return keras.models.load_model(str(clean_p), compile=compile)
    finally:
        if clean_p != model_path and clean_p.exists():
            clean_p.unlink(missing_ok=True)

def safe_save_keras(model: keras.Model, target_path: Path, also_copy_to: Path | None = None) -> None:
    """Lưu .keras ra /tmp SSD trước rồi ghi trực tiếp vào Drive (tránh lỗi .tmp/trùng file của Drive FUSE)."""
    with tempfile.NamedTemporaryFile(suffix='.keras', delete=False) as tfp:
        local_tmp = Path(tfp.name)
    try:
        model.save(str(local_tmp), include_optimizer=False)
        safe_copy_file(local_tmp, target_path)
        if also_copy_to is not None:
            safe_copy_file(local_tmp, also_copy_to)
    finally:
        local_tmp.unlink(missing_ok=True)

def assign_optimizer_lr(optimizer, new_lr: float) -> None:
    lr_obj = getattr(optimizer, 'learning_rate', None)
    if lr_obj is None:
        return
    if hasattr(lr_obj, 'assign'):
        lr_obj.assign(float(new_lr))
    else:
        optimizer.learning_rate = float(new_lr)

class ResumableSaturationCallback(keras.callbacks.Callback):
    """Lưu checkpoint mỗi epoch vào SSD /content cục bộ + đồng bộ file .zip đơn nhất lên Drive."""
    def __init__(
        self,
        phase_dir: Path,
        tracker: SaturationTracker,
        local_run_dir: Path | None = None,
        ckpt_archive_dir: Path | None = None,
        run_key: str | None = None,
        stage_num: int = 1,
        sync_every: int = 3,
    ):
        super().__init__()
        self.phase_dir = Path(phase_dir)
        self.phase_dir.mkdir(parents=True, exist_ok=True)
        self.tracker = tracker
        self.local_run_dir = Path(local_run_dir) if local_run_dir is not None else self.phase_dir.parent
        self.ckpt_archive_dir = Path(ckpt_archive_dir) if ckpt_archive_dir is not None else None
        self.run_key = run_key
        self.stage_num = int(stage_num)
        self.sync_every = max(1, int(sync_every))
        self.state_path = self.phase_dir / 'progress.json'
        self.last_path = self.phase_dir / 'last_epoch.keras'
        self.best_path = self.phase_dir / 'best_model.keras'
        self.hist_path = self.phase_dir / 'history.csv'
        self.history_cols = [
            'epoch', 'loss', 'accuracy', 'top3_accuracy',
            'val_loss', 'val_accuracy', 'val_top3_accuracy', 'lr'
        ]

    def _append_history(self, epoch_idx: int, logs: dict, used_lr: float) -> None:
        ep1 = int(epoch_idx) + 1
        row = {
            'epoch': ep1,
            'loss': float(logs.get('loss', 0.0)),
            'accuracy': float(logs.get('accuracy', 0.0)),
            'top3_accuracy': float(logs.get('top3_accuracy', 0.0)),
            'val_loss': float(logs.get('val_loss', 0.0)),
            'val_accuracy': float(logs.get('val_accuracy', 0.0)),
            'val_top3_accuracy': float(logs.get('val_top3_accuracy', 0.0)),
            'lr': float(used_lr),
        }
        if self.hist_path.exists():
            df_old = pd.read_csv(self.hist_path)
            df_old = df_old[df_old['epoch'] != ep1]
            df_new = pd.concat([df_old, pd.DataFrame([row])], ignore_index=True)
        else:
            df_new = pd.DataFrame([row], columns=self.history_cols)
        safe_save_csv(df_new, self.hist_path, index=False, encoding='utf-8-sig')

    def on_epoch_end(self, epoch, logs=None):
        logs = logs or {}
        used_lr = float(self.tracker.current_lr)
        action = self.tracker.step(epoch, logs.get('val_loss', float('nan')), logs.get('val_accuracy', 0.0))
        self._append_history(epoch, logs, used_lr)

        copy_best = self.best_path if (action['save_best'] or not self.best_path.exists()) else None
        safe_save_keras(self.model, self.last_path, also_copy_to=copy_best)

        if action['new_lr'] is not None:
            assign_optimizer_lr(self.model.optimizer, action['new_lr'])
            print(f'\\n  📉 Plateau tại Epoch {epoch+1}: giảm LR -> {action["new_lr"]:.2e}')

        atomic_write_text(self.state_path, json.dumps(self.tracker.to_dict(), indent=2))
        ep1 = int(epoch) + 1
        sync_note = ''
        if self.ckpt_archive_dir is not None and self.run_key and (
            action['save_best'] or action['stop'] or (ep1 % self.sync_every == 0)
        ):
            zp = pack_dir_to_ckpt_zip(
                self.local_run_dir, self.ckpt_archive_dir, self.run_key,
                self.stage_num, self.tracker.phase, ep1,
            )
            sync_note = f' | Drive sync: {zp.name}'

        best_s = f'{self.tracker.best_val_loss:.4f}' if self.tracker.best_val_loss is not None else 'N/A'
        print(
            f'  💾 Lưu Epoch {ep1}/{self.tracker.max_epochs} | '
            f'val_loss={float(logs.get("val_loss", 0)):.4f} (best={best_s} @ Ep {self.tracker.best_epoch}) | '
            f'val_acc={float(logs.get("val_accuracy", 0))*100:.2f}% | '
            f'wait_es={self.tracker.wait_es}/{self.tracker.es_patience}{sync_note}'
        )
        if action['stop']:
            print(f'  ⏹️ Dừng huấn luyện ({self.tracker.stop_reason}) ở Epoch {ep1}!')
            self.model.stop_training = True

def locate_subdir(root_dir: Path, target_name: str) -> Path:
    direct = root_dir / target_name
    if direct.is_dir():
        return direct
    matches = [p for p in root_dir.rglob(target_name) if p.is_dir()]
    assert matches, f'Không tìm thấy thư mục {target_name} bên trong {root_dir}!'
    return matches[0]

def scan_base_90_images(raw_base_dir: Path, expected_labels: list[str]) -> dict[str, list[Path]]:
    found = {}
    for root, _, files in os.walk(str(raw_base_dir)):
        folder_name = os.path.basename(root)
        if folder_name.startswith('.'):
            continue
        imgs = sorted(
            [Path(root) / f for f in files if Path(f).suffix.lower() in EXTENSIONS],
            key=lambda p: p.name,
        )
        if imgs and Path(root) != raw_base_dir:
            found.setdefault(folder_name, []).extend(imgs)
    missing = [lbl for lbl in expected_labels if lbl not in found]
    assert not missing, f'Thiếu {len(missing)} lớp trong bộ gốc 90 loài: {missing[:5]}'
    return {lbl: sorted(set(found[lbl]), key=lambda p: p.name) for lbl in expected_labels}

def scan_supplemented_90_images(known_supp_dir: Path, expected_labels: list[str]) -> dict[str, list[Path]]:
    valid_set = set(expected_labels)
    supp = {}
    for d in sorted(known_supp_dir.iterdir()):
        if d.is_dir() and d.name in valid_set:
            imgs = sorted([p for p in d.iterdir() if p.is_file() and p.suffix.lower() in EXTENSIONS], key=lambda p: p.name)
            if imgs:
                supp[d.name] = imgs
    return supp

def _link_or_copy(src: Path, dst: Path) -> None:
    if dst.exists():
        return
    try:
        os.link(src, dst)
    except OSError:
        shutil.copy2(src, dst)

def materialize_split_to_ssd(
    base_map: dict[str, list[Path]],
    supp_map: dict[str, list[Path]],
    seed: int,
    split_dir: Path,
    report_dir: Path,
) -> tuple[pd.DataFrame, dict[str, list[str]]]:
    """Tạo thư mục train/val/test trên /content SSD theo chiến lược không rò rỉ dữ liệu."""
    plan, split_df = build_dataset_split_plan(base_map, supp_map, seed=seed)
    real_test_relpaths = {}
    done_marker = split_dir / f'_split_ready_seed_{seed}.json'

    if not done_marker.exists():
        if split_dir.exists():
            shutil.rmtree(split_dir)
        for cls_name, cls_plan in plan.items():
            tr_dir = split_dir / 'train' / cls_name
            va_dir = split_dir / 'val' / cls_name
            te_dir = split_dir / 'test' / cls_name
            tr_dir.mkdir(parents=True, exist_ok=True)
            va_dir.mkdir(parents=True, exist_ok=True)
            te_dir.mkdir(parents=True, exist_ok=True)

            for p in cls_plan['train_base']:
                _link_or_copy(p, tr_dir / p.name)
            for p, dup_name in build_real_train_oversample_entries(cls_plan['train_real'], max_total=48, max_repeat=8):
                _link_or_copy(p, tr_dir / dup_name)

            for p in cls_plan['val_base']:
                _link_or_copy(p, va_dir / p.name)
            for p in cls_plan['val_real']:
                _link_or_copy(p, va_dir / f'real_{p.name}')

            for p in cls_plan['test_base']:
                _link_or_copy(p, te_dir / p.name)
            cls_real_tests = []
            for p in cls_plan['test_real']:
                dst_name = f'real_{p.name}'
                _link_or_copy(p, te_dir / dst_name)
                cls_real_tests.append(dst_name)
            if cls_real_tests:
                real_test_relpaths[cls_name] = cls_real_tests

        atomic_write_text(done_marker, json.dumps({'seed': seed, 'real_test_relpaths': real_test_relpaths}, ensure_ascii=False, indent=2))
    else:
        meta = json.loads(done_marker.read_text(encoding='utf-8'))
        real_test_relpaths = meta.get('real_test_relpaths', {})

    report_dir.mkdir(parents=True, exist_ok=True)
    safe_save_csv(split_df, report_dir / f'split_counts_tu_so_0_seed_{seed}.csv', index=False, encoding='utf-8-sig')
    return split_df, real_test_relpaths

def make_datasets_bilinear(split_dir: Path, seed: int, batch_size: int = 32, image_size: tuple[int, int] = (224, 224)):
    """Khởi tạo train/val/test chuẩn Bilinear + crop_to_aspect_ratio + Damped Sample Weights."""
    def _load(sub, shuffle):
        return keras.utils.image_dataset_from_directory(
            str(split_dir / sub),
            image_size=image_size,
            interpolation='bilinear',
            crop_to_aspect_ratio=True,
            batch_size=batch_size,
            label_mode='categorical',
            shuffle=shuffle,
            seed=seed,
        )
    train_raw = _load('train', True)
    val_raw = _load('val', False)
    test_raw = _load('test', False)
    class_names = list(train_raw.class_names)
    assert len(class_names) == 90, f'Expected 90 classes, got {len(class_names)}'

    # Tính nhanh số lượng ảnh train từng lớp ngay từ file trên SSD (không cần decode 20.000 ảnh 2 lần)
    counts = np.array([
        sum(1 for f in (split_dir / 'train' / c).iterdir() if f.is_file() and f.suffix.lower() in EXTENSIONS)
        for c in class_names
    ], dtype=np.float32)
    cw_dict = compute_damped_class_weights(counts)
    w_vec = tf.constant([cw_dict[i] for i in range(len(class_names))], dtype=tf.float32)

    def _attach_weight(x, y):
        sw = tf.reduce_sum(tf.cast(y, tf.float32) * w_vec, axis=-1)
        return x, y, sw

    train_ds = train_raw.map(_attach_weight, num_parallel_calls=tf.data.AUTOTUNE).prefetch(tf.data.AUTOTUNE)
    val_ds = val_raw.prefetch(tf.data.AUTOTUNE)
    test_ds = test_raw.prefetch(tf.data.AUTOTUNE)
    return train_ds, val_ds, test_ds, test_raw, class_names, counts

def find_backbone_layer(model: keras.Model, backbone_key: str):
    key = backbone_key.lower().replace('_', '')
    for l in model.layers:
        lname = l.name.lower().replace('_', '')
        if isinstance(l, keras.Model) and (key in lname or any(k in lname for k in ('mobilenet', 'efficientnet', 'resnet'))):
            return l
    raise RuntimeError(f'Không tìm thấy tầng backbone {backbone_key} trong model!')

def set_backbone_finetune_trainable(model: keras.Model, backbone_key: str, unfreeze_last: int = 50) -> tuple[int, int]:
    base = find_backbone_layer(model, backbone_key)
    base.trainable = True
    total = len(base.layers)
    cutoff = max(0, total - int(unfreeze_last))
    for l in base.layers[:cutoff]:
        l.trainable = False
    n_unfrozen = 0
    for l in base.layers[cutoff:]:
        if isinstance(l, layers.BatchNormalization):
            l.trainable = False
        else:
            l.trainable = True
            n_unfrozen += 1
    return n_unfrozen, total

def evaluate_90_classes_complete(
    model: keras.Model,
    test_ds,
    test_raw,
    class_names: list[str],
    real_test_relpaths: dict[str, list[str]],
    eval_dir: Path,
    extra_meta: dict,
) -> dict:
    """Đánh giá đầy đủ trên tập Test + tập ảnh thực tế tách riêng + xuất report 90 loài."""
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report

    eval_dir.mkdir(parents=True, exist_ok=True)
    y_true_list, scores_list = [], []
    for imgs, lbls in test_ds:
        probs = model(imgs, training=False).numpy()
        y_true_list.append(np.argmax(lbls.numpy(), axis=1))
        scores_list.append(probs)

    y_true = np.concatenate(y_true_list)
    scores = np.concatenate(scores_list)
    y_pred = np.argmax(scores, axis=1)

    # Đánh giá thêm subset ảnh thực tế chưa thấy (real_test) nếu có
    real_correct, real_total = 0, 0
    cls_to_idx = {c: i for i, c in enumerate(class_names)}
    if hasattr(test_raw, 'file_paths') and len(test_raw.file_paths) == len(y_true):
        for i, fp in enumerate(test_raw.file_paths):
            p = Path(fp)
            cname = p.parent.name
            if p.name in set(real_test_relpaths.get(cname, [])):
                real_total += 1
                if int(y_pred[i]) == cls_to_idx[cname]:
                    real_correct += 1

    metrics_dict = {
        **extra_meta,
        'test_images': int(len(y_true)),
        'correct_predictions': int(np.sum(y_true == y_pred)),
        'incorrect_predictions': int(np.sum(y_true != y_pred)),
        'top1_accuracy': float(accuracy_score(y_true, y_pred)),
        'top3_accuracy': float(np.mean(np.any(np.argsort(scores, axis=1)[:, -3:] == y_true[:, None], axis=1))),
        'macro_precision': float(precision_score(y_true, y_pred, average='macro', zero_division=0)),
        'macro_recall': float(recall_score(y_true, y_pred, average='macro', zero_division=0)),
        'macro_f1': float(f1_score(y_true, y_pred, average='macro', zero_division=0)),
        'weighted_precision': float(precision_score(y_true, y_pred, average='weighted', zero_division=0)),
        'weighted_recall': float(recall_score(y_true, y_pred, average='weighted', zero_division=0)),
        'weighted_f1': float(f1_score(y_true, y_pred, average='weighted', zero_division=0)),
        'real_test_total': int(real_total),
        'real_test_correct': int(real_correct),
        'real_test_acc': float(real_correct / real_total) if real_total > 0 else None,
    }
    atomic_write_text(eval_dir / 'metrics.json', json.dumps(metrics_dict, ensure_ascii=False, indent=2))

    cm = confusion_matrix(y_true, y_pred, labels=np.arange(len(class_names)))
    safe_save_csv(pd.DataFrame(cm, index=class_names, columns=class_names), eval_dir / 'confusion_matrix.csv', encoding='utf-8-sig')

    rep_dict = classification_report(y_true, y_pred, target_names=class_names, output_dict=True, zero_division=0)
    safe_save_csv(pd.DataFrame(rep_dict).transpose(), eval_dir / 'classification_report.csv', encoding='utf-8-sig')
    return metrics_dict
'''


def build_nb1(baseline_b64: str, core_code: str) -> nbf.NotebookNode:
    nb = nbf.v4.new_notebook()
    nb.cells = [
        nbf.v4.new_markdown_cell(
            '# 🌿 HUẤN LUYỆN TỪ SỐ 0 — 3 RANDOM SEEDS TỰ ĐỘNG (`99, 123, 999`) | 90 LOÀI + BỔ SUNG THỰC TẾ\n\n'
            '**Dành cho Google Colab Free (T4 GPU):**\n'
            '1. Bật GPU (`Runtime -> Change runtime type -> T4 GPU`) rồi nhấn **Run all** (`Ctrl+F9`).\n'
            '2. Hệ thống **KHÔNG đọc bất kỳ model hay số liệu cũ nào**, khởi tạo hoàn toàn từ đầu (`weights=\'imagenet\'`) và **chạy tự động tuần tự 3 Seed `99 -> 123 -> 999`**.\n'
            '3. Gộp sạch **25.013 ảnh gốc + 212 ảnh bổ sung thực tế của 8 loài trong 90 loài = 25.225 ảnh duy nhất** (chia block/group không rò rỉ frame clip giữa Train/Val/Test).\n'
            '4. **Train tới khi bão hòa thật sự:** Pha Head (`max 50 epochs`, `EarlyStopping patience=7`) + Pha Fine-tuning sâu 50 lớp cuối (`max 80 epochs`, `ReduceLROnPlateau patience=3`, `EarlyStopping patience=8`, đóng băng BatchNorm).\n'
            '5. **Tự động lưu & nối tiếp từng Epoch lên Google Drive:** nếu Colab Free ngắt giữa chừng, chỉ cần bấm **Run all** lại để chạy tiếp đúng epoch đang dở.\n'
            '6. Cuối cùng tự động tổng hợp **Mean ± Std**, **đối chiếu trực tiếp với Báo cáo mẫu**, và xuất **bảng chi tiết từng loài cho đủ 90 loài cây**.'
        ),
        nbf.v4.new_code_cell(
            '# ==============================================================================\n'
            '# === BƯỚC 1: KẾT NỐI DRIVE, CẤU HÌNH 3 SEEDS [99, 123, 999] & MODULE LÕI ===\n'
            '# ==============================================================================\n'
            'import os, re, json, math, time, zlib, base64, random, shutil, zipfile, tempfile\n'
            'from pathlib import Path\n'
            'import numpy as np\n'
            'import pandas as pd\n'
            'import tensorflow as tf\n'
            'from tensorflow import keras\n'
            'from tensorflow.keras import layers\n'
            'from google.colab import drive\n\n'
            'if not Path(\'/content/drive/MyDrive\').exists():\n'
            '    drive.mount(\'/content/drive\')\n\n'
            '# --- CẤU HÌNH CHẠY TỰ ĐỘNG ---\n'
            'SEEDS_TO_RUN = [99, 123, 999]\n'
            'BATCH_SIZE = 32\n'
            'IMAGE_SIZE = (224, 224)\n'
            'LABEL_SMOOTHING = 0.05\n'
            'MAX_EPOCHS_HEAD = 50\n'
            'MAX_EPOCHS_FINE = 80\n'
            'UNFREEZE_LAYERS = 50\n'
            'LR_HEAD_INIT = 1e-3\n'
            'LR_FINE_INIT = 5e-5\n\n'
            'PROJECT = Path(\'/content/drive/MyDrive/KiengLa_AI\')\n'
            'assert PROJECT.exists(), f\'Không tìm thấy thư mục {PROJECT} trên Google Drive!\'\n'
            'EXP_ROOT = PROJECT / \'Thu_Nghiem_Tu_So_0_90_Loai\'\n'
            'SEEDS_OUT_ROOT = EXP_ROOT / \'seeds_mobilenetv2\'\n'
            'CKPT_ARCHIVE_DIR = EXP_ROOT / \'_live_ckpt\'\n'
            'COMPLETED_BUNDLES_DIR = EXP_ROOT / \'_completed_bundles\'\n'
            'for _d in (SEEDS_OUT_ROOT, CKPT_ARCHIVE_DIR, COMPLETED_BUNDLES_DIR):\n'
            '    _d.mkdir(parents=True, exist_ok=True)\n\n'
            f'BASELINE_B64 = {baseline_b64!r}\n'
            'baseline_ref_path = EXP_ROOT / \'baseline_bao_cao_mau.json\'\n'
            'if baseline_ref_path.is_file():\n'
            '    BASELINE_JSON = json.loads(baseline_ref_path.read_text(encoding=\'utf-8\'))\n'
            'else:\n'
            '    BASELINE_JSON = json.loads(zlib.decompress(base64.b64decode(BASELINE_B64)).decode(\'utf-8\'))\n'
            '    baseline_ref_path.write_text(json.dumps(BASELINE_JSON, ensure_ascii=False, indent=2), encoding=\'utf-8\')\n\n'
            'LABELS_90 = [x[\'original_label\'] for x in BASELINE_JSON[\'labels_vi\']]\n'
            'assert len(LABELS_90) == 90\n\n'
            + core_code
            + '\n\n'
            + SHARED_HELPERS_CODE
            + '\n'
            'ZIP_30K_PATH = find_first_existing([\n'
            '    PROJECT / \'01_Du_Lieu_Goc\' / \'merged_90_30k_chuan.zip\',\n'
            '    PROJECT / \'01_Du_Lieu_30k_Va_Labels\' / \'merged_v1\' / \'merged_90_30k_chuan.zip\',\n'
            '    PROJECT / \'merged_v1\' / \'merged_90_30k_chuan.zip\',\n'
            '], rglob_pattern=\'*merged_90_30k*.zip\')\n'
            'assert ZIP_30K_PATH is not None, \'Không tìm thấy merged_90_30k_chuan.zip trên Google Drive!\'\n\n'
            'ZIP_BOSUNG_PATH = find_first_existing([\n'
            '    PROJECT / \'bo_sung_thuc_te.zip\',\n'
            '    PROJECT / \'01_Du_Lieu_Goc\' / \'bo_sung_thuc_te.zip\',\n'
            '], rglob_pattern=\'*bo_sung_thuc_te*.zip\')\n'
            'assert ZIP_BOSUNG_PATH is not None, \'Không tìm thấy bo_sung_thuc_te.zip trên Google Drive!\'\n\n'
            'print(\'=\'*74)\n'
            'print(\'🚀 ĐÃ THIẾT LẬP PIPELINE TỪ SỐ 0 — 3 SEEDS TỰ ĐỘNG (99, 123, 999)\')\n'
            'print(f\'  • TensorFlow    : {tf.__version__} | GPU: {tf.config.list_physical_devices("GPU")}\')\n'
            'print(f\'  • Dữ liệu gốc   : {ZIP_30K_PATH}\')\n'
            'print(f\'  • Ảnh bổ sung   : {ZIP_BOSUNG_PATH}\')\n'
            'print(f\'  • Lưu kết quả ở : {SEEDS_OUT_ROOT}\')\n'
            'print(\'=\'*74)\n'
        ),
        nbf.v4.new_code_cell(
            '# ==============================================================================\n'
            '# === BƯỚC 2: GIẢI NÉN 1 LẦN VÀO SSD /content & KIỂM ĐẾM 90 LOÀI + BỔ SUNG  ===\n'
            '# ==============================================================================\n'
            'RAW_BASE_DIR = Path(\'/content/raw_90_base_30k\')\n'
            'RAW_SUPP_DIR = Path(\'/content/raw_bo_sung_thuc_te\')\n\n'
            'if not RAW_BASE_DIR.exists() or len(list(RAW_BASE_DIR.iterdir())) == 0:\n'
            '    RAW_BASE_DIR.mkdir(parents=True, exist_ok=True)\n'
            '    print(f\'📦 Đang giải nén {ZIP_30K_PATH.name} vào SSD /content (1-2 phút)...\')\n'
            '    !unzip -q "{ZIP_30K_PATH}" -d /content/raw_90_base_30k\n\n'
            'if not RAW_SUPP_DIR.exists() or len(list(RAW_SUPP_DIR.iterdir())) == 0:\n'
            '    RAW_SUPP_DIR.mkdir(parents=True, exist_ok=True)\n'
            '    print(f\'📦 Đang giải nén {ZIP_BOSUNG_PATH.name}...\')\n'
            '    !unzip -q "{ZIP_BOSUNG_PATH}" -d /content/raw_bo_sung_thuc_te\n\n'
            'BASE_MAP = scan_base_90_images(RAW_BASE_DIR, LABELS_90)\n'
            'KNOWN_SUPP_DIR = locate_subdir(RAW_SUPP_DIR, \'da_co_trong_90_loai\')\n'
            'SUPP_MAP = scan_supplemented_90_images(KNOWN_SUPP_DIR, LABELS_90)\n\n'
            'tot_base = sum(len(v) for v in BASE_MAP.values())\n'
            'tot_supp = sum(len(v) for v in SUPP_MAP.values())\n'
            'print(f\'✅ Dữ liệu sạch sẵn sàng: {len(BASE_MAP)} loài gốc ({tot_base:,} ảnh) + {len(SUPP_MAP)} loài bổ sung ({tot_supp:,} ảnh) = {tot_base + tot_supp:,} ảnh.\')\n'
            'for k, v in SUPP_MAP.items():\n'
            '    print(f\'   • {k}: +{len(v)} ảnh thực tế\')\n'
        ),
        nbf.v4.new_code_cell(
            '# ==============================================================================\n'
            '# === BƯỚC 3: ĐỊNH NGHĨA HÀM BUILD & TRAIN MOBILENETV2 CHO TỪNG SEED         ===\n'
            '# ==============================================================================\n'
            'def build_fresh_mobilenetv2(seed: int, num_classes: int = 90) -> tuple[keras.Model, keras.Model]:\n'
            '    inputs = keras.Input(shape=(224, 224, 3), name=\'image_input\')\n'
            '    x = layers.RandomFlip(\'horizontal_and_vertical\', seed=seed)(inputs)\n'
            '    x = layers.RandomRotation(0.12, seed=seed)(x)\n'
            '    x = layers.RandomZoom(0.15, seed=seed)(x)\n'
            '    x = layers.RandomContrast(0.12, seed=seed)(x)\n'
            '    x = layers.Rescaling(1.0 / 127.5, offset=-1.0, name=\'rescaling\')(x)\n'
            '    base = keras.applications.MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights=\'imagenet\')\n'
            '    base.trainable = False\n'
            '    feat = base(x, training=False)\n'
            '    gap = layers.GlobalAveragePooling2D(name=\'gap\')(feat)\n'
            '    drop = layers.Dropout(0.30, seed=seed, name=\'dropout\')(gap)\n'
            '    out = layers.Dense(num_classes, activation=\'softmax\', name=\'pred_90\')(drop)\n'
            '    return keras.Model(inputs, out, name=\'MobileNetV2_TuSo0_90\'), base\n\n'
            'def run_single_seed(seed: int) -> dict:\n'
            '    seed_dir = SEEDS_OUT_ROOT / f\'seed_{seed}\'\n'
            '    bundle_zip = COMPLETED_BUNDLES_DIR / f\'seed_{seed}_complete.zip\'\n'
            '    run_key = f\'seed_{seed}\'\n'
            '    existing_m, _ = read_eval_from_dir_or_bundle(seed_dir, bundle_zip)\n'
            '    if existing_m is not None and ((seed_dir / \'done.json\').is_file() or bundle_zip.is_file()):\n'
            '        print(f\'✅ [Seed {seed}] Đã hoàn tất trước đó, nạp kết quả từ Drive...\')\n'
            '        return existing_m\n\n'
            '    print(\'\\n\' + \'=\'*78)\n'
            '    print(f\'🚀 BẮT ĐẦU SEED {seed} (TỪ SỐ 0 -> TRAIN TỚI KHI BÃO HÒA)\')\n'
            '    print(\'=\'*78)\n'
            '    random.seed(seed); np.random.seed(seed); tf.random.set_seed(seed); keras.utils.set_random_seed(seed)\n'
            '    keras.backend.clear_session()\n\n'
            '    local_run = Path(f\'/content/local_runs/seed_{seed}\')\n'
            '    local_run.mkdir(parents=True, exist_ok=True)\n'
            '    restored_zip = restore_dir_from_latest_ckpt_zip(local_run, CKPT_ARCHIVE_DIR, run_key)\n'
            '    if restored_zip is not None:\n'
            '        print(f\'♻️ [Seed {seed}] Đã khôi phục checkpoint từ {restored_zip.name}!\')\n\n'
            '    split_dir = Path(f\'/content/split_tu_so_0_seed_{seed}\')\n'
            '    split_df, real_test_relpaths = materialize_split_to_ssd(BASE_MAP, SUPP_MAP, seed, split_dir, local_run)\n'
            '    train_ds, val_ds, test_ds, test_raw, class_names, _ = make_datasets_bilinear(split_dir, seed, BATCH_SIZE, IMAGE_SIZE)\n'
            '    atomic_write_text(local_run / \'class_names.json\', json.dumps(class_names, ensure_ascii=False, indent=2))\n\n'
            '    loss_fn = keras.losses.CategoricalCrossentropy(label_smoothing=LABEL_SMOOTHING)\n'
            '    metrics_list = [\n'
            '        keras.metrics.CategoricalAccuracy(name=\'accuracy\'),\n'
            '        keras.metrics.TopKCategoricalAccuracy(k=3, name=\'top3_accuracy\'),\n'
            '    ]\n\n'
            '    head_dir = local_run / \'head\'\n'
            '    fine_dir = local_run / \'finetune\'\n'
            '    local_eval_dir = local_run / \'evaluation_report\'\n'
            '    local_best_model = local_run / f\'best_mobilenetv2_tu_so_0_seed_{seed}.keras\'\n'
            '    drive_best_model = seed_dir / f\'best_mobilenetv2_tu_so_0_seed_{seed}.keras\'\n'
            '    head_state_path = head_dir / \'progress.json\'\n'
            '    fine_state_path = fine_dir / \'progress.json\'\n'
            '    tr_head = SaturationTracker.from_dict(json.loads(head_state_path.read_text(encoding=\'utf-8\'))) if head_state_path.is_file() else SaturationTracker(\n'
            '        \'head\', MAX_EPOCHS_HEAD, LR_HEAD_INIT, 1e-5, lr_factor=0.5, lr_patience=3, es_patience=7, min_delta=1e-4\n'
            '    )\n'
            '    tr_fine = SaturationTracker.from_dict(json.loads(fine_state_path.read_text(encoding=\'utf-8\'))) if fine_state_path.is_file() else SaturationTracker(\n'
            '        \'finetune\', MAX_EPOCHS_FINE, LR_FINE_INIT, 1e-6, lr_factor=0.5, lr_patience=3, es_patience=8, min_delta=1e-4\n'
            '    )\n\n'
            '    t0 = time.time()\n'
            '    if not local_best_model.is_file() and drive_best_model.is_file():\n'
            '        shutil.copy2(drive_best_model, local_best_model)\n\n'
            '    if local_best_model.is_file():\n'
            '        print(f\'♻️ [Seed {seed}] Phát hiện {local_best_model.name} đã train xong — chạy thẳng đánh giá!\')\n'
            '        best_model = compat_load_model(local_best_model, compile=False)\n'
            '    else:\n'
            '        # --- GIAI ĐOẠN 1: HEAD WARM-UP ---\n'
            '        head_dir.mkdir(parents=True, exist_ok=True)\n'
            '        if not (tr_head.stopped and (head_dir / \'best_model.keras\').is_file()):\n'
            '            if tr_head.next_epoch > 0 and (head_dir / \'last_epoch.keras\').is_file():\n'
            '                print(f\'🔄 Nối tiếp Pha Head từ Epoch {tr_head.next_epoch+1} (LR={tr_head.current_lr:.2e})...\')\n'
            '                model = compat_load_model(head_dir / \'last_epoch.keras\', compile=False)\n'
            '                find_backbone_layer(model, \'MobileNetV2\').trainable = False\n'
            '            else:\n'
            '                model, _ = build_fresh_mobilenetv2(seed, len(class_names))\n'
            '            model.compile(optimizer=keras.optimizers.Adam(learning_rate=tr_head.current_lr, clipnorm=1.0), loss=loss_fn, metrics=metrics_list)\n'
            '            cb_h = ResumableSaturationCallback(head_dir, tr_head, local_run, CKPT_ARCHIVE_DIR, run_key, stage_num=1, sync_every=3)\n'
            '            model.fit(train_ds, validation_data=val_ds, initial_epoch=tr_head.next_epoch, epochs=MAX_EPOCHS_HEAD, callbacks=[cb_h])\n'
            '        else:\n'
            '            print(f\'✅ Pha Head đã bão hòa ở Epoch {tr_head.best_epoch}/{tr_head.next_epoch}.\')\n\n'
            '        # --- GIAI ĐOẠN 2: FINE-TUNING SÂU TỚI BÃO HÒA ---\n'
            '        fine_dir.mkdir(parents=True, exist_ok=True)\n'
            '        if not (tr_fine.stopped and (fine_dir / \'best_model.keras\').is_file()):\n'
            '            if tr_fine.next_epoch > 0 and (fine_dir / \'last_epoch.keras\').is_file():\n'
            '                print(f\'🔄 Nối tiếp Pha Fine-tune từ Epoch {tr_fine.next_epoch+1} (LR={tr_fine.current_lr:.2e})...\')\n'
            '                model = compat_load_model(fine_dir / \'last_epoch.keras\', compile=False)\n'
            '            else:\n'
            '                model = compat_load_model(head_dir / \'best_model.keras\', compile=False)\n'
            '            n_unf, n_tot = set_backbone_finetune_trainable(model, \'MobileNetV2\', UNFREEZE_LAYERS)\n'
            '            print(f\'🔧 Fine-tune {n_unf}/{n_tot} tầng không phải BatchNorm (LR={tr_fine.current_lr:.2e}, max {MAX_EPOCHS_FINE} epochs)...\')\n'
            '            model.compile(optimizer=keras.optimizers.Adam(learning_rate=tr_fine.current_lr, clipnorm=1.0), loss=loss_fn, metrics=metrics_list)\n'
            '            cb_f = ResumableSaturationCallback(fine_dir, tr_fine, local_run, CKPT_ARCHIVE_DIR, run_key, stage_num=2, sync_every=3)\n'
            '            model.fit(train_ds, validation_data=val_ds, initial_epoch=tr_fine.next_epoch, epochs=MAX_EPOCHS_FINE, callbacks=[cb_f])\n'
            '        else:\n'
            '            print(f\'✅ Pha Fine-tune đã bão hòa ở Epoch {tr_fine.best_epoch}/{tr_fine.next_epoch}.\')\n\n'
            '        best_model = compat_load_model(fine_dir / \'best_model.keras\', compile=False)\n'
            '        safe_save_keras(best_model, local_best_model)\n\n'
            '    # --- ĐÁNH GIÁ & ĐÓNG GÓI KẾT QUẢ LÊN DRIVE ---\n'
            '    h_best, h_stop = read_phase_epoch_stats(head_dir, tr_head)\n'
            '    f_best, f_stop = read_phase_epoch_stats(fine_dir, tr_fine)\n'
            '    sample_batch = next(iter(test_ds))[0]\n'
            '    for _ in range(3): _ = best_model(sample_batch, training=False)\n'
            '    tl0 = time.time()\n'
            '    for _ in range(10): _ = best_model(sample_batch, training=False)\n'
            '    latency_ms = ((time.time() - tl0) / 10.0 / BATCH_SIZE) * 1000.0\n\n'
            '    res = evaluate_90_classes_complete(\n'
            '        best_model, test_ds, test_raw, class_names, real_test_relpaths, local_eval_dir,\n'
            '        extra_meta={\n'
            '            \'seed\': seed,\n'
            '            \'model_key\': \'mobilenet_v2\',\n'
            '            \'model_title\': \'MobileNetV2 (Từ số 0 + Bổ sung 8 loài)\',\n'
            '            \'params_m\': round(best_model.count_params() / 1e6, 2),\n'
            '            \'size_mb\': round(local_best_model.stat().st_size / (1024*1024), 2),\n'
            '            \'latency_ms\': round(latency_ms, 2),\n'
            '            \'head_best_epoch\': h_best,\n'
            '            \'head_stopped_epoch\': h_stop,\n'
            '            \'fine_best_epoch\': f_best,\n'
            '            \'fine_stopped_epoch\': f_stop,\n'
            '            \'train_session_min\': round((time.time() - t0) / 60.0, 1),\n'
            '        },\n'
            '    )\n'
            '    atomic_write_text(local_run / \'done.json\', json.dumps({\'seed\': seed, \'status\': \'completed\'}, indent=2))\n'
            '    save_dir_to_flat_zip(local_run, bundle_zip)\n'
            '    try:\n'
            '        (seed_dir / \'evaluation_report\').mkdir(parents=True, exist_ok=True)\n'
            '        safe_copy_file(local_best_model, drive_best_model)\n'
            '        for fn in (\'metrics.json\', \'classification_report.csv\', \'confusion_matrix.csv\'):\n'
            '            if (local_eval_dir / fn).is_file():\n'
            '                safe_copy_file(local_eval_dir / fn, seed_dir / \'evaluation_report\' / fn)\n'
            '        for fn in (\'class_names.json\', f\'split_counts_tu_so_0_seed_{seed}.csv\', \'done.json\'):\n'
            '            if (local_run / fn).is_file():\n'
            '                safe_copy_file(local_run / fn, seed_dir / fn)\n'
            '    except OSError as exc:\n'
            '        print(f\'  ⚠️ Lưu bản sao rời gặp trễ FUSE ({exc}), đã lưu đủ trong {bundle_zip.name}\')\n'
            '    shutil.rmtree(split_dir, ignore_errors=True)\n'
            '    ref = BASELINE_JSON[\'seeds_baseline\'].get(str(seed), {})\n'
            '    d_top1 = (res[\'top1_accuracy\'] - ref.get(\'top1_accuracy\', 0)) * 100.0\n'
            '    print(f\'🎉 HOÀN TẤT SEED {seed}: Top-1={res["top1_accuracy"]*100:.2f}% (Mẫu={ref.get("top1_accuracy",0)*100:.2f}%, Δ={d_top1:+.2f}%) | Top-3={res["top3_accuracy"]*100:.2f}% | Fine best/stop={f_best}/{f_stop}\')\n'
            '    return res\n'
        ),
        nbf.v4.new_code_cell(
            '# ==============================================================================\n'
            '# === BƯỚC 4: CHẠY TỰ ĐỘNG TUẦN TỰ 3 SEEDS [99, 123, 999] & LƯU BÁO CÁO    ===\n'
            '# ==============================================================================\n'
            'def export_seed_comparison_reports() -> tuple[pd.DataFrame, pd.DataFrame]:\n'
            '    seed_metrics, seed_reports = {}, {}\n'
            '    for s in SEEDS_TO_RUN:\n'
            '        m_obj, rep_df = read_eval_from_dir_or_bundle(\n'
            '            SEEDS_OUT_ROOT / f\'seed_{s}\',\n'
            '            COMPLETED_BUNDLES_DIR / f\'seed_{s}_complete.zip\',\n'
            '        )\n'
            '        if m_obj is not None and rep_df is not None:\n'
            '            seed_metrics[s] = m_obj\n'
            '            seed_reports[s] = rep_df\n'
            '    df_comp = build_3seed_comparison_table(seed_metrics, BASELINE_JSON, SEEDS_TO_RUN)\n'
            '    df_90 = build_90_species_comparison_table(seed_reports, BASELINE_JSON, SEEDS_TO_RUN)\n'
            '    report_out = EXP_ROOT / \'bao_cao_doi_chieu_tu_so_0\'\n'
            '    report_out.mkdir(parents=True, exist_ok=True)\n'
            '    if not df_comp.empty:\n'
            '        safe_save_csv(df_comp, report_out / \'Doi_Chieu_3_Seeds_99_123_999_vs_Mau.csv\', index=False, encoding=\'utf-8-sig\')\n'
            '    if not df_90.empty:\n'
            '        safe_save_csv(df_90, report_out / \'Doi_Chieu_90_Loai_99_123_999_vs_Mau.csv\', index=False, encoding=\'utf-8-sig\')\n'
            '    if not df_comp.empty and not df_90.empty:\n'
            '        safe_save_excel({\n'
            '            \'Doi_Chieu_3_Seeds\': (df_comp, False),\n'
            '            \'Chi_Tiet_90_Loai_vs_Mau\': (df_90, False),\n'
            '        }, report_out / \'Bao_Cao_3_Seeds_Tu_So_0_Doi_Chieu_Mau.xlsx\')\n'
            '    return df_comp, df_90\n\n'
            'all_seed_results = {}\n'
            'for s in SEEDS_TO_RUN:\n'
            '    all_seed_results[s] = run_single_seed(s)\n'
            '    export_seed_comparison_reports()\n'
        ),
        nbf.v4.new_code_cell(
            '# ==============================================================================\n'
            '# === BƯỚC 5: HIỂN THỊ TỔNG HỢP MEAN ± STD, ĐỐI CHIẾU MẪU & 90 LOÀI CHI TIẾT ===\n'
            '# ==============================================================================\n'
            'df_comp, df_90 = export_seed_comparison_reports()\n'
            'REPORT_OUT = EXP_ROOT / \'bao_cao_doi_chieu_tu_so_0\'\n\n'
            'print(\'\\n=== ĐỐI CHIẾU TỔNG HỢP 3 SEEDS (99, 123, 999) vs BÁO CÁO MẪU ===\')\n'
            'display(df_comp)\n'
            'print(\'\\n=== CHI TIẾT 8 LOÀI BỔ SUNG THỰC TẾ TRONG 90 LOÀI ===\')\n'
            'display(df_90[df_90[\'Nhóm bổ sung\'].str.contains(\'Bổ sung\')])\n'
            'print(\'\\n=== TOP 10 LOÀI CẢI THIỆN F1 CAO NHẤT SO VỚI MẪU ===\')\n'
            'if \'Chênh lệch F1 (Mới - Mẫu)\' in df_90.columns:\n'
            '    display(df_90.sort_values(\'Chênh lệch F1 (Mới - Mẫu)\', ascending=False).head(10))\n'
            'print(f\'\\n✅ Đã xuất báo cáo tại: {REPORT_OUT}\')\n'
        ),
    ]
    return nb


def build_nb2(baseline_b64: str, core_code: str) -> nbf.NotebookNode:
    nb = nbf.v4.new_notebook()
    nb.cells = [
        nbf.v4.new_markdown_cell(
            '# ⚖️ SO SÁNH 4 MÔ HÌNH TỪ SỐ 0 — TRAIN TỚI BÃO HÒA (`Custom CNN`, `MobileNetV2`, `EfficientNetB0`, `ResNet50`)\n\n'
            '**Dành cho Google Colab Free (T4 GPU):**\n'
            '1. Dùng **đúng bộ dữ liệu 90 loài + 212 ảnh bổ sung thực tế** (`25.225` ảnh) và **cùng Seed `999`** như thí nghiệm 3 Seeds.\n'
            '2. **Mọi mô hình đều train từ con số 0 đến bão hòa** (bỏ giới hạn 12+8 epoch cũ ở EfficientNetB0 & ResNet50): `EarlyStopping` + `ReduceLROnPlateau` + lưu checkpoint từng epoch lên Drive để tự nối tiếp khi Colab Free ngắt.\n'
            '3. Nếu bạn đã chạy xong **Seed 999** ở Notebook 1 (`Train_3_Seeds_Tu_So_0_99_123_999_Colab.ipynb`), Notebook này tự động **tái sử dụng kết quả sạch MobileNetV2 Seed 999** để tiết kiệm GPU Colab Free (chỉ mất vài giây đo latency & đối chiếu).\n'
            '4. Cuối cùng xuất bảng **4 mô hình Mới vs Báo cáo mẫu** và **chi tiết 90 loài từng mô hình**.'
        ),
        nbf.v4.new_code_cell(
            '# ==============================================================================\n'
            '# === BƯỚC 1: KẾT NỐI DRIVE, CẤU HÌNH BENCHMARK 4 MÔ HÌNH & MODULE LÕI     ===\n'
            '# ==============================================================================\n'
            'import os, re, json, math, time, zlib, base64, random, shutil, zipfile, tempfile\n'
            'from pathlib import Path\n'
            'import numpy as np\n'
            'import pandas as pd\n'
            'import tensorflow as tf\n'
            'from tensorflow import keras\n'
            'from tensorflow.keras import layers\n'
            'from google.colab import drive\n\n'
            'if not Path(\'/content/drive/MyDrive\').exists():\n'
            '    drive.mount(\'/content/drive\')\n\n'
            'BENCHMARK_SEED = 999\n'
            'MODELS_TO_RUN = [\'mobilenet_v2\', \'efficientnet_b0\', \'resnet50\', \'custom_cnn\']\n'
            'REUSE_MOBILENETV2_FROM_SEED_999 = True\n'
            'BATCH_SIZE = 32\n'
            'IMAGE_SIZE = (224, 224)\n'
            'LABEL_SMOOTHING = 0.05\n'
            'MAX_EPOCHS_CUSTOM = 120\n'
            'MAX_EPOCHS_HEAD = 50\n'
            'MAX_EPOCHS_FINE = 80\n'
            'UNFREEZE_LAYERS = 50\n\n'
            'PROJECT = Path(\'/content/drive/MyDrive/KiengLa_AI\')\n'
            'EXP_ROOT = PROJECT / \'Thu_Nghiem_Tu_So_0_90_Loai\'\n'
            'BENCH_ROOT = EXP_ROOT / \'benchmark_4_mo_hinh\'\n'
            'CKPT_ARCHIVE_DIR = EXP_ROOT / \'_live_ckpt\'\n'
            'COMPLETED_BUNDLES_DIR = EXP_ROOT / \'_completed_bundles\'\n'
            'for _d in (BENCH_ROOT, CKPT_ARCHIVE_DIR, COMPLETED_BUNDLES_DIR):\n'
            '    _d.mkdir(parents=True, exist_ok=True)\n'
            'SEED_999_DIR = EXP_ROOT / \'seeds_mobilenetv2\' / \'seed_999\'\n\n'
            f'BASELINE_B64 = {baseline_b64!r}\n'
            'baseline_ref_path = EXP_ROOT / \'baseline_bao_cao_mau.json\'\n'
            'if baseline_ref_path.is_file():\n'
            '    BASELINE_JSON = json.loads(baseline_ref_path.read_text(encoding=\'utf-8\'))\n'
            'else:\n'
            '    BASELINE_JSON = json.loads(zlib.decompress(base64.b64decode(BASELINE_B64)).decode(\'utf-8\'))\n'
            '    baseline_ref_path.write_text(json.dumps(BASELINE_JSON, ensure_ascii=False, indent=2), encoding=\'utf-8\')\n\n'
            'LABELS_90 = [x[\'original_label\'] for x in BASELINE_JSON[\'labels_vi\']]\n'
            + core_code
            + '\n\n'
            + SHARED_HELPERS_CODE
            + '\n'
            'ZIP_30K_PATH = find_first_existing([\n'
            '    PROJECT / \'01_Du_Lieu_Goc\' / \'merged_90_30k_chuan.zip\',\n'
            '    PROJECT / \'01_Du_Lieu_30k_Va_Labels\' / \'merged_v1\' / \'merged_90_30k_chuan.zip\',\n'
            '], rglob_pattern=\'*merged_90_30k*.zip\')\n'
            'ZIP_BOSUNG_PATH = find_first_existing([\n'
            '    PROJECT / \'bo_sung_thuc_te.zip\',\n'
            '    PROJECT / \'01_Du_Lieu_Goc\' / \'bo_sung_thuc_te.zip\',\n'
            '], rglob_pattern=\'*bo_sung_thuc_te*.zip\')\n'
            'assert ZIP_30K_PATH is not None and ZIP_BOSUNG_PATH is not None\n'
            'print(f\'🚀 Benchmark Từ Số 0 sẵn sàng (Seed={BENCHMARK_SEED}, GPU={tf.config.list_physical_devices("GPU")})\')\n'
        ),
        nbf.v4.new_code_cell(
            '# ==============================================================================\n'
            '# === BƯỚC 2: GIẢI NÉN & CHUẨN BỊ ĐÚNG TẬP DỮ LIỆU SEED 999 TRÊN SSD          ===\n'
            '# ==============================================================================\n'
            'RAW_BASE_DIR = Path(\'/content/raw_90_base_30k\')\n'
            'RAW_SUPP_DIR = Path(\'/content/raw_bo_sung_thuc_te\')\n'
            'if not RAW_BASE_DIR.exists() or len(list(RAW_BASE_DIR.iterdir())) == 0:\n'
            '    RAW_BASE_DIR.mkdir(parents=True, exist_ok=True)\n'
            '    !unzip -q "{ZIP_30K_PATH}" -d /content/raw_90_base_30k\n'
            'if not RAW_SUPP_DIR.exists() or len(list(RAW_SUPP_DIR.iterdir())) == 0:\n'
            '    RAW_SUPP_DIR.mkdir(parents=True, exist_ok=True)\n'
            '    !unzip -q "{ZIP_BOSUNG_PATH}" -d /content/raw_bo_sung_thuc_te\n\n'
            'BASE_MAP = scan_base_90_images(RAW_BASE_DIR, LABELS_90)\n'
            'SUPP_MAP = scan_supplemented_90_images(locate_subdir(RAW_SUPP_DIR, \'da_co_trong_90_loai\'), LABELS_90)\n'
            'SPLIT_DIR = Path(f\'/content/split_tu_so_0_seed_{BENCHMARK_SEED}\')\n'
            'split_df, REAL_TEST_RELPATHS = materialize_split_to_ssd(BASE_MAP, SUPP_MAP, BENCHMARK_SEED, SPLIT_DIR, BENCH_ROOT)\n'
            'train_ds, val_ds, test_ds, test_raw, class_names, _ = make_datasets_bilinear(SPLIT_DIR, BENCHMARK_SEED, BATCH_SIZE, IMAGE_SIZE)\n'
            'print(f\'✅ Tập Benchmark Seed {BENCHMARK_SEED}: Train={int(split_df["train_base"].sum()+split_df["train_real"].sum()):,} | Val={int(split_df["val_base"].sum()+split_df["val_real"].sum()):,} | Test={int(split_df["test_base"].sum()+split_df["test_real"].sum()):,}\')\n'
        ),
        nbf.v4.new_code_cell(
            '# ==============================================================================\n'
            '# === BƯỚC 3: XÂY DỰNG KIẾN TRÚC & HÀM TRAIN TỪ SỐ 0 CHO CẢ 4 MÔ HÌNH         ===\n'
            '# ==============================================================================\n'
            'MODEL_META = {\n'
            '    \'custom_cnn\': {\'title\': \'Custom CNN (From Scratch)\', \'fine_lr\': 1e-3},\n'
            '    \'mobilenet_v2\': {\'title\': \'MobileNetV2 (Đề tài đề xuất)\', \'fine_lr\': 5e-5},\n'
            '    \'efficientnet_b0\': {\'title\': \'EfficientNetB0 (Transfer Learning)\', \'fine_lr\': 8e-5},\n'
            '    \'resnet50\': {\'title\': \'ResNet50 (Transfer Learning)\', \'fine_lr\': 5e-5},\n'
            '}\n\n'
            'def build_architecture(model_key: str, seed: int, num_classes: int = 90) -> tuple[keras.Model, keras.Model | None]:\n'
            '    inputs = keras.Input(shape=(224, 224, 3), name=\'image_input\')\n'
            '    x = layers.RandomFlip(\'horizontal_and_vertical\', seed=seed)(inputs)\n'
            '    x = layers.RandomRotation(0.12, seed=seed)(x)\n'
            '    x = layers.RandomZoom(0.15, seed=seed)(x)\n'
            '    x = layers.RandomContrast(0.12, seed=seed)(x)\n\n'
            '    if model_key == \'custom_cnn\':\n'
            '        x = layers.Rescaling(1.0 / 255.0, name=\'rescale_01\')(x)\n'
            '        for idx, f in enumerate([32, 64, 128, 256, 512], 1):\n'
            '            x = layers.Conv2D(f, 3, padding=\'same\', activation=\'relu\', name=f\'conv_{idx}\')(x)\n'
            '            x = layers.BatchNormalization(momentum=0.9, name=f\'bn_{idx}\')(x)\n'
            '            x = layers.MaxPooling2D(name=f\'pool_{idx}\')(x)\n'
            '        x = layers.GlobalAveragePooling2D(name=\'gap\')(x)\n'
            '        x = layers.Dense(512, activation=\'relu\', name=\'fc_512\')(x)\n'
            '        x = layers.Dropout(0.30, seed=seed, name=\'dropout\')(x)\n'
            '        out = layers.Dense(num_classes, activation=\'softmax\', name=\'pred_90\')(x)\n'
            '        return keras.Model(inputs, out, name=\'CustomCNN_TuSo0_90\'), None\n\n'
            '    if model_key == \'mobilenet_v2\':\n'
            '        x = layers.Rescaling(1.0 / 127.5, offset=-1.0, name=\'rescaling\')(x)\n'
            '        base = keras.applications.MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights=\'imagenet\')\n'
            '    elif model_key == \'efficientnet_b0\':\n'
            '        base = keras.applications.EfficientNetB0(input_shape=(224, 224, 3), include_top=False, weights=\'imagenet\')\n'
            '    elif model_key == \'resnet50\':\n'
            '        # Tầng Conv2D 1x1 cố định chuyển RGB -> BGR trừ ImageNet mean: chuẩn Caffe ResNet50 & 100% không dùng Lambda!\n'
            '        conv_bgr = layers.Conv2D(3, kernel_size=1, padding=\'valid\', use_bias=True, trainable=False, name=\'rgb_to_bgr_center\')\n'
            '        x = conv_bgr(x)\n'
            '        w = np.zeros((1, 1, 3, 3), dtype=\'float32\')\n'
            '        w[0, 0, 2, 0] = 1.0; w[0, 0, 1, 1] = 1.0; w[0, 0, 0, 2] = 1.0\n'
            '        b = np.array([-103.939, -116.779, -123.68], dtype=\'float32\')\n'
            '        conv_bgr.set_weights([w, b])\n'
            '        base = keras.applications.ResNet50(input_shape=(224, 224, 3), include_top=False, weights=\'imagenet\')\n'
            '    else:\n'
            '        raise ValueError(model_key)\n\n'
            '    base.trainable = False\n'
            '    feat = base(x, training=False)\n'
            '    gap = layers.GlobalAveragePooling2D(name=\'gap\')(feat)\n'
            '    drop = layers.Dropout(0.30, seed=seed, name=\'dropout\')(gap)\n'
            '    out = layers.Dense(num_classes, activation=\'softmax\', name=\'pred_90\')(drop)\n'
            '    return keras.Model(inputs, out, name=f\'{model_key}_TuSo0_90\'), base\n\n'
            'def run_benchmark_model(model_key: str) -> dict:\n'
            '    out_dir = BENCH_ROOT / model_key\n'
            '    run_key = f\'bench_{model_key}\'\n'
            '    bundle_zip = COMPLETED_BUNDLES_DIR / f\'{run_key}_complete.zip\'\n'
            '    existing_m, _ = read_eval_from_dir_or_bundle(out_dir, bundle_zip)\n'
            '    if existing_m is not None and ((out_dir / \'done.json\').is_file() or bundle_zip.is_file()):\n'
            '        print(f\'✅ [{model_key}] Đã hoàn tất trước đó, nạp kết quả...\')\n'
            '        return existing_m\n\n'
            '    local_run = Path(f\'/content/local_runs/{run_key}\')\n'
            '    local_run.mkdir(parents=True, exist_ok=True)\n'
            '    local_eval_dir = local_run / \'evaluation_report\'\n'
            '    final_path = local_run / \'best_model.keras\'\n\n'
            '    # Nếu MobileNetV2 Seed 999 đã chạy sạch ở Notebook 1 -> tái sử dụng luôn (từ thư mục hoặc bundle zip)\n'
            '    s999_bundle = COMPLETED_BUNDLES_DIR / f\'seed_{BENCHMARK_SEED}_complete.zip\'\n'
            '    s999_m_dir, _ = read_eval_from_dir_or_bundle(SEED_999_DIR, s999_bundle)\n'
            '    s999_model_name = f\'best_mobilenetv2_tu_so_0_seed_{BENCHMARK_SEED}.keras\'\n'
            '    if model_key == \'mobilenet_v2\' and REUSE_MOBILENETV2_FROM_SEED_999 and s999_m_dir is not None:\n'
            '        copied_s999 = False\n'
            '        if s999_bundle.is_file():\n'
            '            with zipfile.ZipFile(s999_bundle, \'r\') as zf:\n'
            '                if s999_model_name in zf.namelist():\n'
            '                    zf.extractall(local_run)\n'
            '                    shutil.copy2(local_run / s999_model_name, final_path)\n'
            '                    copied_s999 = True\n'
            '        elif (SEED_999_DIR / s999_model_name).is_file():\n'
            '            shutil.copy2(SEED_999_DIR / s999_model_name, final_path)\n'
            '            local_eval_dir.mkdir(parents=True, exist_ok=True)\n'
            '            for fname in (\'metrics.json\', \'classification_report.csv\', \'confusion_matrix.csv\'):\n'
            '                src_f = SEED_999_DIR / \'evaluation_report\' / fname\n'
            '                if src_f.is_file(): shutil.copy2(src_f, local_eval_dir / fname)\n'
            '            copied_s999 = True\n'
            '        if copied_s999 and (local_eval_dir / \'metrics.json\').is_file():\n'
            '            print(\'♻️ Tái sử dụng kết quả MobileNetV2 (Seed 999) vừa chạy từ Notebook 1!\')\n'
            '            m = json.loads((local_eval_dir / \'metrics.json\').read_text(encoding=\'utf-8\'))\n'
            '            m.update({\n'
            '                \'model_key\': \'mobilenet_v2\',\n'
            '                \'model_title\': MODEL_META[\'mobilenet_v2\'][\'title\'],\n'
            '                \'top1_acc\': m[\'top1_accuracy\'], \'top3_acc\': m[\'top3_accuracy\'],\n'
            '                \'precision\': m[\'weighted_precision\'], \'recall\': m[\'weighted_recall\'], \'f1\': m[\'weighted_f1\'],\n'
            '                \'best_epoch\': m.get(\'fine_best_epoch\'), \'stopped_epoch\': m.get(\'fine_stopped_epoch\'),\n'
            '            })\n'
            '            atomic_write_text(local_eval_dir / \'metrics.json\', json.dumps(m, ensure_ascii=False, indent=2))\n'
            '            atomic_write_text(local_run / \'done.json\', json.dumps({\'reused_from\': str(SEED_999_DIR)}, indent=2))\n'
            '            save_dir_to_flat_zip(local_run, bundle_zip)\n'
            '            try:\n'
            '                (out_dir / \'evaluation_report\').mkdir(parents=True, exist_ok=True)\n'
            '                safe_copy_file(final_path, out_dir / \'best_model.keras\')\n'
            '                for fn in (\'metrics.json\', \'classification_report.csv\', \'confusion_matrix.csv\'):\n'
            '                    if (local_eval_dir / fn).is_file(): safe_copy_file(local_eval_dir / fn, out_dir / \'evaluation_report\' / fn)\n'
            '                safe_copy_file(local_run / \'done.json\', out_dir / \'done.json\')\n'
            '            except OSError:\n'
            '                pass\n'
            '            return m\n\n'
            '    print(\'\\n\' + \'=\'*78)\n'
            '    print(f\'🔬 TRAIN TỪ SỐ 0 ĐẾN BÃO HÒA: {MODEL_META[model_key]["title"]}\')\n'
            '    print(\'=\'*78)\n'
            '    random.seed(BENCHMARK_SEED); np.random.seed(BENCHMARK_SEED); tf.random.set_seed(BENCHMARK_SEED); keras.utils.set_random_seed(BENCHMARK_SEED)\n'
            '    keras.backend.clear_session()\n'
            '    restored_zip = restore_dir_from_latest_ckpt_zip(local_run, CKPT_ARCHIVE_DIR, run_key)\n'
            '    if restored_zip is not None:\n'
            '        print(f\'♻️ [{model_key}] Đã khôi phục checkpoint từ {restored_zip.name}!\')\n\n'
            '    loss_fn = keras.losses.CategoricalCrossentropy(label_smoothing=LABEL_SMOOTHING)\n'
            '    metrics_list = [\n'
            '        keras.metrics.CategoricalAccuracy(name=\'accuracy\'),\n'
            '        keras.metrics.TopKCategoricalAccuracy(k=3, name=\'top3_accuracy\'),\n'
            '    ]\n'
            '    drive_final_path = out_dir / \'best_model.keras\'\n'
            '    t0 = time.time()\n'
            '    if not final_path.is_file() and drive_final_path.is_file():\n'
            '        shutil.copy2(drive_final_path, final_path)\n\n'
            '    if final_path.is_file():\n'
            '        print(f\'♻️ [{model_key}] Phát hiện {final_path.name} đã train xong — chạy thẳng đánh giá!\')\n'
            '        best_model = compat_load_model(final_path, compile=False)\n'
            '        ph_check = (local_run / \'scratch\') if model_key == \'custom_cnn\' else (local_run / \'finetune\')\n'
            '        stp_chk = ph_check / \'progress.json\'\n'
            '        tr_chk = SaturationTracker.from_dict(json.loads(stp_chk.read_text(encoding=\'utf-8\'))) if stp_chk.is_file() else SaturationTracker(\n'
            '            \'check\', 1, 1e-3, 1e-5\n'
            '        )\n'
            '        best_ep, stopped_ep = read_phase_epoch_stats(ph_check, tr_chk)\n'
            '    else:\n'
            '        if model_key == \'custom_cnn\':\n'
            '            ph_dir = local_run / \'scratch\'\n'
            '            ph_dir.mkdir(parents=True, exist_ok=True)\n'
            '            st_p = ph_dir / \'progress.json\'\n'
            '            tr = SaturationTracker.from_dict(json.loads(st_p.read_text(encoding=\'utf-8\'))) if st_p.is_file() else SaturationTracker(\n'
            '                \'custom\', MAX_EPOCHS_CUSTOM, 1e-3, 1e-5, lr_factor=0.5, lr_patience=4, es_patience=10, min_delta=1e-4\n'
            '            )\n'
            '            if not (tr.stopped and (ph_dir / \'best_model.keras\').is_file()):\n'
            '                if tr.next_epoch > 0 and (ph_dir / \'last_epoch.keras\').is_file():\n'
            '                    model = compat_load_model(ph_dir / \'last_epoch.keras\', compile=False)\n'
            '                else:\n'
            '                    model, _ = build_architecture(model_key, BENCHMARK_SEED, len(class_names))\n'
            '                model.compile(optimizer=keras.optimizers.Adam(learning_rate=tr.current_lr, clipnorm=1.0), loss=loss_fn, metrics=metrics_list)\n'
            '                cb = ResumableSaturationCallback(ph_dir, tr, local_run, CKPT_ARCHIVE_DIR, run_key, stage_num=1, sync_every=3)\n'
            '                model.fit(train_ds, validation_data=val_ds, initial_epoch=tr.next_epoch, epochs=MAX_EPOCHS_CUSTOM, callbacks=[cb])\n'
            '            best_src = ph_dir / \'best_model.keras\'\n'
            '            best_ep, stopped_ep = read_phase_epoch_stats(ph_dir, tr)\n'
            '        else:\n'
            '            head_dir = local_run / \'head\'\n'
            '            head_dir.mkdir(parents=True, exist_ok=True)\n'
            '            hs_p = head_dir / \'progress.json\'\n'
            '            tr_h = SaturationTracker.from_dict(json.loads(hs_p.read_text(encoding=\'utf-8\'))) if hs_p.is_file() else SaturationTracker(\n'
            '                \'head\', MAX_EPOCHS_HEAD, 1e-3, 1e-5, lr_factor=0.5, lr_patience=3, es_patience=7, min_delta=1e-4\n'
            '            )\n'
            '            if not (tr_h.stopped and (head_dir / \'best_model.keras\').is_file()):\n'
            '                if tr_h.next_epoch > 0 and (head_dir / \'last_epoch.keras\').is_file():\n'
            '                    model = compat_load_model(head_dir / \'last_epoch.keras\', compile=False)\n'
            '                    find_backbone_layer(model, model_key).trainable = False\n'
            '                else:\n'
            '                    model, _ = build_architecture(model_key, BENCHMARK_SEED, len(class_names))\n'
            '                model.compile(optimizer=keras.optimizers.Adam(learning_rate=tr_h.current_lr, clipnorm=1.0), loss=loss_fn, metrics=metrics_list)\n'
            '                cb_h = ResumableSaturationCallback(head_dir, tr_h, local_run, CKPT_ARCHIVE_DIR, run_key, stage_num=1, sync_every=3)\n'
            '                model.fit(train_ds, validation_data=val_ds, initial_epoch=tr_h.next_epoch, epochs=MAX_EPOCHS_HEAD, callbacks=[cb_h])\n\n'
            '            fine_dir = local_run / \'finetune\'\n'
            '            fine_dir.mkdir(parents=True, exist_ok=True)\n'
            '            fs_p = fine_dir / \'progress.json\'\n'
            '            tr_f = SaturationTracker.from_dict(json.loads(fs_p.read_text(encoding=\'utf-8\'))) if fs_p.is_file() else SaturationTracker(\n'
            '                \'finetune\', MAX_EPOCHS_FINE, MODEL_META[model_key][\'fine_lr\'], 1e-6, lr_factor=0.5, lr_patience=3, es_patience=8, min_delta=1e-4\n'
            '            )\n'
            '            if not (tr_f.stopped and (fine_dir / \'best_model.keras\').is_file()):\n'
            '                model = compat_load_model((fine_dir / \'last_epoch.keras\') if (tr_f.next_epoch > 0 and (fine_dir / \'last_epoch.keras\').is_file()) else (head_dir / \'best_model.keras\'), compile=False)\n'
            '                set_backbone_finetune_trainable(model, model_key, UNFREEZE_LAYERS)\n'
            '                model.compile(optimizer=keras.optimizers.Adam(learning_rate=tr_f.current_lr, clipnorm=1.0), loss=loss_fn, metrics=metrics_list)\n'
            '                cb_f = ResumableSaturationCallback(fine_dir, tr_f, local_run, CKPT_ARCHIVE_DIR, run_key, stage_num=2, sync_every=3)\n'
            '                model.fit(train_ds, validation_data=val_ds, initial_epoch=tr_f.next_epoch, epochs=MAX_EPOCHS_FINE, callbacks=[cb_f])\n'
            '            best_src = fine_dir / \'best_model.keras\'\n'
            '            best_ep, stopped_ep = read_phase_epoch_stats(fine_dir, tr_f)\n\n'
            '        best_model = compat_load_model(best_src, compile=False)\n'
            '        safe_save_keras(best_model, final_path)\n'
            '    sample_batch = next(iter(test_ds))[0]\n'
            '    for _ in range(3): _ = best_model(sample_batch, training=False)\n'
            '    tl0 = time.time()\n'
            '    for _ in range(10): _ = best_model(sample_batch, training=False)\n'
            '    latency_ms = ((time.time() - tl0) / 10.0 / BATCH_SIZE) * 1000.0\n\n'
            '    res = evaluate_90_classes_complete(\n'
            '        best_model, test_ds, test_raw, class_names, REAL_TEST_RELPATHS, local_eval_dir,\n'
            '        extra_meta={\n'
            '            \'seed\': BENCHMARK_SEED,\n'
            '            \'model_key\': model_key,\n'
            '            \'model_title\': MODEL_META[model_key][\'title\'],\n'
            '            \'params_m\': round(best_model.count_params() / 1e6, 2),\n'
            '            \'size_mb\': round(final_path.stat().st_size / (1024*1024), 2),\n'
            '            \'latency_ms\': round(latency_ms, 2),\n'
            '            \'best_epoch\': best_ep,\n'
            '            \'stopped_epoch\': stopped_ep,\n'
            '            \'train_time_min\': round((time.time() - t0) / 60.0, 1),\n'
            '        },\n'
            '    )\n'
            '    res[\'top1_acc\'] = res[\'top1_accuracy\']; res[\'top3_acc\'] = res[\'top3_accuracy\']\n'
            '    res[\'precision\'] = res[\'weighted_precision\']; res[\'recall\'] = res[\'weighted_recall\']; res[\'f1\'] = res[\'weighted_f1\']\n'
            '    atomic_write_text(local_eval_dir / \'metrics.json\', json.dumps(res, ensure_ascii=False, indent=2))\n'
            '    atomic_write_text(local_run / \'done.json\', json.dumps({\'status\': \'completed\'}, indent=2))\n'
            '    save_dir_to_flat_zip(local_run, bundle_zip)\n'
            '    try:\n'
            '        (out_dir / \'evaluation_report\').mkdir(parents=True, exist_ok=True)\n'
            '        safe_copy_file(final_path, drive_final_path)\n'
            '        for fn in (\'metrics.json\', \'classification_report.csv\', \'confusion_matrix.csv\'):\n'
            '            if (local_eval_dir / fn).is_file(): safe_copy_file(local_eval_dir / fn, out_dir / \'evaluation_report\' / fn)\n'
            '        safe_copy_file(local_run / \'done.json\', out_dir / \'done.json\')\n'
            '    except OSError as exc:\n'
            '        print(f\'  ⚠️ Lưu bản sao rời gặp trễ FUSE ({exc}), đã lưu đủ trong {bundle_zip.name}\')\n'
            '    print(f\'🎉 Hoàn tất {model_key}: Top-1={res["top1_acc"]*100:.2f}% | Top-3={res["top3_acc"]*100:.2f}% | Best/Stop={best_ep}/{stopped_ep}\')\n'
            '    return res\n'
        ),
        nbf.v4.new_code_cell(
            '# ==============================================================================\n'
            '# === BƯỚC 4: CHẠY BENCHMARK CÁC MÔ HÌNH & ĐỐI CHIẾU VỚI BÁO CÁO MẪU        ===\n'
            '# ==============================================================================\n'
            'def export_benchmark_reports() -> pd.DataFrame:\n'
            '    cur_results = {}\n'
            '    cur_reports = {}\n'
            '    for mk in [\'custom_cnn\', \'mobilenet_v2\', \'resnet50\', \'efficientnet_b0\']:\n'
            '        m_obj, rep_df = read_eval_from_dir_or_bundle(\n'
            '            BENCH_ROOT / mk,\n'
            '            COMPLETED_BUNDLES_DIR / f\'bench_{mk}_complete.zip\',\n'
            '        )\n'
            '        if m_obj is not None and rep_df is not None:\n'
            '            cur_results[mk] = m_obj\n'
            '            cur_reports[mk] = rep_df\n'
            '    df_b = build_4model_comparison_table(cur_results, BASELINE_JSON)\n'
            '    report_out = EXP_ROOT / \'bao_cao_doi_chieu_tu_so_0\'\n'
            '    report_out.mkdir(parents=True, exist_ok=True)\n'
            '    if not df_b.empty:\n'
            '        safe_save_csv(df_b, report_out / \'Doi_Chieu_4_Mo_Hinh_Tu_So_0_vs_Mau.csv\', index=False, encoding=\'utf-8-sig\')\n'
            '        xl_sheets = {\'So_Sanh_4_Mo_Hinh\': (df_b, False)}\n'
            '        for mk, rep_df in cur_reports.items():\n'
            '            xl_sheets[f\'90_Loai_{mk[:15]}\'] = (rep_df, True)\n'
            '        safe_save_excel(xl_sheets, report_out / \'Bang_So_Sanh_4_Mo_Hinh_Tu_So_0_vs_Mau.xlsx\')\n'
            '    return df_b\n\n'
            'bench_results = {}\n'
            'for mk in MODELS_TO_RUN:\n'
            '    bench_results[mk] = run_benchmark_model(mk)\n'
            '    export_benchmark_reports()\n\n'
            'df_bench = export_benchmark_reports()\n'
            'REPORT_OUT = EXP_ROOT / \'bao_cao_doi_chieu_tu_so_0\'\n'
            'print(\'\\n=== ĐỐI CHIẾU 4 MÔ HÌNH TỪ SỐ 0 (BÃO HÒA) vs BÁO CÁO MẪU ===\')\n'
            'display(df_bench)\n'
            'print(f\'\\n✅ Đã xuất kết quả Benchmark tại: {REPORT_OUT}\')\n'
        ),
    ]
    return nb


def validate_notebook(nb_path: Path) -> None:
    nb = json.loads(nb_path.read_text(encoding='utf-8'))
    for i, cell in enumerate(nb['cells']):
        if cell['cell_type'] == 'code':
            src = ''.join(cell['source'])
            cleaned = '\n'.join(
                ln for ln in src.splitlines()
                if not ln.lstrip().startswith('!') and not ln.lstrip().startswith('%')
            )
            ast.parse(cleaned, filename=f'{nb_path.name}#cell{i}')
    print(f'VALIDATED: {nb_path.name} ({len(nb["cells"])} cells, {nb_path.stat().st_size:,} bytes)')


def main() -> None:
    b64 = encode_baseline_b64()
    core = load_core_body()
    nb1 = build_nb1(b64, core)
    nb2 = build_nb2(b64, core)
    nbf.write(nb1, NB1_PATH)
    nbf.write(nb2, NB2_PATH)
    validate_notebook(NB1_PATH)
    validate_notebook(NB2_PATH)


if __name__ == '__main__':
    main()
