"""Shared pure-Python pipeline helpers for from-scratch 90-class experiments."""

from __future__ import annotations

import json
import math
import os
import random
import re
import shutil
import tempfile
import time
import zipfile
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


def is_drive_fuse_path(path: Path) -> bool:
    return '/content/drive' in str(path).replace('\\', '/')


def safe_write_bytes(path: Path, data: bytes, retries: int = 5) -> None:
    """Write file safely: in-place with retries on Colab Drive FUSE, atomic replace locally."""
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            if is_drive_fuse_path(path):
                with open(path, 'wb') as f:
                    f.write(data)
                    f.flush()
                    os.fsync(f.fileno())
            else:
                tmp = path.with_name(f'.tmp_{os.getpid()}_{path.name}')
                with open(tmp, 'wb') as f:
                    f.write(data)
                    f.flush()
                os.replace(tmp, path)
            return
        except OSError as exc:
            last_err = exc
            time.sleep(0.4 * (attempt + 1))
    assert last_err is not None
    raise last_err


def atomic_write_text(path: Path, text: str) -> None:
    safe_write_bytes(path, text.encode('utf-8'))


def safe_copy_file(src: Path, dst: Path, retries: int = 5) -> None:
    """Copy bytes from local staged file into destination without Drive FUSE .tmp rename."""
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            dst.parent.mkdir(parents=True, exist_ok=True)
            if is_drive_fuse_path(dst):
                with open(src, 'rb') as rf, open(dst, 'wb') as wf:
                    shutil.copyfileobj(rf, wf, length=1024 * 1024)
                    wf.flush()
                    os.fsync(wf.fileno())
            else:
                tmp = dst.with_name(f'.tmp_{os.getpid()}_{dst.name}')
                shutil.copy2(src, tmp)
                os.replace(tmp, dst)
            return
        except OSError as exc:
            last_err = exc
            time.sleep(0.5 * (attempt + 1))
    assert last_err is not None
    raise last_err


def safe_save_csv(df: pd.DataFrame, dst: Path, **to_csv_kwargs: Any) -> None:
    with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as tfp:
        tmp_path = Path(tfp.name)
    try:
        df.to_csv(tmp_path, **to_csv_kwargs)
        safe_copy_file(tmp_path, dst)
    finally:
        tmp_path.unlink(missing_ok=True)


def safe_save_excel(sheets: dict[str, tuple[pd.DataFrame, bool]], dst: Path) -> None:
    with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tfp:
        tmp_path = Path(tfp.name)
    try:
        with pd.ExcelWriter(tmp_path) as writer:
            for sh_name, (df, keep_index) in sheets.items():
                df.to_excel(writer, sheet_name=sh_name, index=keep_index)
        safe_copy_file(tmp_path, dst)
    finally:
        tmp_path.unlink(missing_ok=True)


def read_phase_epoch_stats(phase_dir: Path, tracker: 'SaturationTracker') -> tuple[int | None, int | None]:
    """Recover best_epoch and stopped_epoch from tracker with history.csv fallback."""
    best_ep = tracker.best_epoch
    stopped_ep = tracker.next_epoch or None
    hist_path = phase_dir / 'history.csv'
    if hist_path.is_file():
        try:
            df_h = pd.read_csv(hist_path)
            if not df_h.empty and 'epoch' in df_h.columns:
                max_ep = int(df_h['epoch'].max())
                if stopped_ep is None or max_ep > stopped_ep:
                    stopped_ep = max_ep
                if 'val_loss' in df_h.columns and df_h['val_loss'].notna().any():
                    best_ep_h = int(df_h.loc[df_h['val_loss'].idxmin(), 'epoch'])
                    if best_ep is None or max_ep > (tracker.next_epoch or 0):
                        best_ep = best_ep_h
        except Exception:
            pass
    return best_ep, stopped_ep


def build_ckpt_zip_name(run_key: str, stage_num: int, phase: str, ep1: int) -> str:
    return f'ckpt_{run_key}_{int(stage_num):02d}_{phase}_ep{int(ep1):03d}.zip'


def pack_dir_to_ckpt_zip(
    local_dir: Path,
    ckpt_dir: Path,
    run_key: str,
    stage_num: int,
    phase: str,
    ep1: int,
) -> Path:
    """Bundle local training state into a unique monotonic zip inside ckpt_dir without FUSE overwrites."""
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    zip_name = build_ckpt_zip_name(run_key, stage_num, phase, ep1)
    dst_zip = ckpt_dir / zip_name
    with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as tfp:
        tmp_zip = Path(tfp.name)
    try:
        with zipfile.ZipFile(tmp_zip, 'w', compression=zipfile.ZIP_STORED) as zf:
            for item in sorted(local_dir.rglob('*')):
                if item.is_file():
                    rel = item.relative_to(local_dir).as_posix()
                    zf.write(item, arcname=rel)
        safe_copy_file(tmp_zip, dst_zip)
    finally:
        tmp_zip.unlink(missing_ok=True)

    for old in sorted(ckpt_dir.glob(f'ckpt_{run_key}_*.zip')):
        if old.name != zip_name:
            try:
                old.unlink()
            except OSError:
                pass
    return dst_zip


def restore_dir_from_latest_ckpt_zip(local_dir: Path, ckpt_dir: Path, run_key: str) -> Path | None:
    """Restore local_dir from the newest non-corrupt checkpoint zip in ckpt_dir."""
    if not ckpt_dir.exists():
        return None
    candidates = sorted(ckpt_dir.glob(f'ckpt_{run_key}_*.zip'), reverse=True)
    for zp in candidates:
        try:
            with zipfile.ZipFile(zp, 'r') as zf:
                if zf.testzip() is not None:
                    continue
                local_dir.mkdir(parents=True, exist_ok=True)
                zf.extractall(local_dir)
                return zp
        except (OSError, zipfile.BadZipFile):
            continue
    return None


def save_dir_to_flat_zip(src_dir: Path, dst_zip: Path, exclude_prefixes: tuple[str, ...] = ()) -> Path:
    """Pack a completed local run directory into a single flat zip archive on Drive."""
    dst_zip.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as tfp:
        tmp_zip = Path(tfp.name)
    try:
        with zipfile.ZipFile(tmp_zip, 'w', compression=zipfile.ZIP_STORED) as zf:
            for item in sorted(src_dir.rglob('*')):
                if not item.is_file():
                    continue
                rel = item.relative_to(src_dir).as_posix()
                if any(rel.startswith(pfx) for pfx in exclude_prefixes):
                    continue
                zf.write(item, arcname=rel)
        safe_copy_file(tmp_zip, dst_zip)
    finally:
        tmp_zip.unlink(missing_ok=True)
    return dst_zip


def read_eval_from_dir_or_bundle(
    run_dir: Path, bundle_zip: Path
) -> tuple[dict[str, Any] | None, pd.DataFrame | None]:
    """Load metrics.json and classification_report.csv from run_dir or fallback complete zip."""
    ev = run_dir / 'evaluation_report'
    m_file = ev / 'metrics.json'
    r_file = ev / 'classification_report.csv'
    if m_file.is_file() and r_file.is_file():
        return json.loads(m_file.read_text(encoding='utf-8')), pd.read_csv(r_file, index_col=0)
    if bundle_zip.is_file():
        try:
            with zipfile.ZipFile(bundle_zip, 'r') as zf:
                names = set(zf.namelist())
                m_arc = 'evaluation_report/metrics.json'
                r_arc = 'evaluation_report/classification_report.csv'
                if m_arc in names and r_arc in names:
                    metrics = json.loads(zf.read(m_arc).decode('utf-8'))
                    with zf.open(r_arc) as fp:
                        rep = pd.read_csv(fp, index_col=0)
                    return metrics, rep
        except (OSError, zipfile.BadZipFile):
            pass
    return None, None


CLIP_NAME_RE = re.compile(r'^(clip\d+)_', re.IGNORECASE)
EXCEL_METRIC_MAP = [
    ('Top-1 Accuracy', 'top1_accuracy'),
    ('Top-3 Accuracy', 'top3_accuracy'),
    ('Weighted Precision', 'weighted_precision'),
    ('Weighted Recall', 'weighted_recall'),
    ('Weighted F1-Score', 'weighted_f1'),
    ('Macro Precision', 'macro_precision'),
    ('Macro Recall', 'macro_recall'),
    ('Macro F1-Score', 'macro_f1'),
]


def split_real_images_leak_free(
    paths: list[Path], cls_name: str, seed: int
) -> dict[str, list[Path]]:
    """Split supplemented real images into train/val/test without frame or crop leakage."""
    ordered = sorted(set(paths), key=lambda p: p.name)
    n = len(ordered)
    if n == 0:
        return {'train': [], 'val': [], 'test': []}
    if n <= 4:
        return {'train': ordered, 'val': [], 'test': []}

    rng = random.Random(int(seed) + sum(ord(ch) for ch in cls_name) * 31 + 7)
    clip_count = sum(1 for p in ordered if CLIP_NAME_RE.match(p.name))

    # Chronological video frames: partition into ~10 contiguous temporal chunks and select
    # non-adjacent val/test chunks so consecutive frames never cross split boundaries.
    if clip_count >= max(8, int(n * 0.6)):
        n_blocks = min(10, max(5, n // 3))
        blocks: list[list[Path]] = [[] for _ in range(n_blocks)]
        for idx, p in enumerate(ordered):
            blk = min(n_blocks - 1, (idx * n_blocks) // n)
            blocks[blk].append(p)
        blocks = [b for b in blocks if b]
        nb = len(blocks)
        if nb >= 5:
            val_idx = rng.randrange(nb)
            candidates = [i for i in range(nb) if abs(i - val_idx) >= 2]
            if not candidates:
                candidates = [i for i in range(nb) if i != val_idx]
            test_idx = rng.choice(candidates)
            tr, va, te = [], [], []
            for idx, grp in enumerate(blocks):
                if idx == val_idx:
                    va.extend(grp)
                elif idx == test_idx:
                    te.extend(grp)
                else:
                    tr.extend(grp)
            return {'train': tr, 'val': va, 'test': te}

    # Standalone photos: group base photo + *_center crop together before splitting.
    groups_map: dict[str, list[Path]] = {}
    for p in ordered:
        stem = p.stem[:-7] if p.stem.endswith('_center') else p.stem
        groups_map.setdefault(stem, []).append(p)

    groups = [groups_map[k] for k in sorted(groups_map)]
    rng.shuffle(groups)
    if len(groups) < 3:
        return {'train': [p for g in groups for p in g], 'val': [], 'test': []}

    val_grp = groups[0]
    test_grp = groups[1]
    train_grps = groups[2:]
    return {
        'train': [p for g in train_grps for p in g],
        'val': list(val_grp),
        'test': list(test_grp),
    }


def build_dataset_split_plan(
    base_map: dict[str, list[Path]],
    supp_map: dict[str, list[Path]],
    seed: int,
) -> tuple[dict[str, dict[str, list[Path]]], pd.DataFrame]:
    """Create a reproducible stratified 80/10/10 plan combining base + supplemented 90 classes."""
    class_folders = sorted(base_map.keys())
    plan: dict[str, dict[str, list[Path]]] = {}
    rows: list[dict[str, Any]] = []
    rng = random.Random(int(seed))

    for cls_name in class_folders:
        base_imgs = sorted(set(base_map[cls_name]), key=lambda p: p.name)
        rng.shuffle(base_imgs)
        n_base = len(base_imgs)
        n_tr = int(n_base * 0.80)
        n_va = int(n_base * 0.10)
        if n_va == 0 and n_base >= 3:
            n_va = 1

        real_imgs = supp_map.get(cls_name, [])
        real_split = split_real_images_leak_free(real_imgs, cls_name, int(seed))

        cls_plan = {
            'train_base': base_imgs[:n_tr],
            'val_base': base_imgs[n_tr:n_tr + n_va],
            'test_base': base_imgs[n_tr + n_va:],
            'train_real': real_split['train'],
            'val_real': real_split['val'],
            'test_real': real_split['test'],
        }
        plan[cls_name] = cls_plan

        rows.append({
            'label': cls_name,
            'train_base': len(cls_plan['train_base']),
            'train_real': len(cls_plan['train_real']),
            'val_base': len(cls_plan['val_base']),
            'val_real': len(cls_plan['val_real']),
            'test_base': len(cls_plan['test_base']),
            'test_real': len(cls_plan['test_real']),
            'total_unique': n_base + len(real_imgs),
        })

    return plan, pd.DataFrame(rows)


def build_real_train_oversample_entries(
    real_train_paths: list[Path],
    max_total: int = 48,
    max_repeat: int = 8,
) -> list[tuple[Path, str]]:
    """Build bounded oversampling copies of real images strictly for the Train split."""
    ordered = sorted(real_train_paths, key=lambda p: p.name)
    n = len(ordered)
    if n == 0:
        return []
    repeat = max(1, min(max_repeat, max_total // n if max_total >= n else 1))
    entries: list[tuple[Path, str]] = []
    for rep in range(repeat):
        for idx, src in enumerate(ordered):
            if len(entries) >= max_total and rep > 0:
                break
            dest_name = f'real_r{rep:02d}_{idx:03d}_{src.name}'
            entries.append((src, dest_name))
    return entries


def compute_damped_class_weights(counts: np.ndarray) -> dict[int, float]:
    """Compute square-root damped balanced class weights clipped to [0.65, 2.20]."""
    arr = np.asarray(counts, dtype=np.float64)
    mean_c = float(np.mean(arr)) if len(arr) > 0 else 1.0
    damped = np.clip((mean_c / np.maximum(arr, 1.0)) ** 0.5, 0.65, 2.20)
    return {i: float(w) for i, w in enumerate(damped)}


class SaturationTracker:
    """Resumable EarlyStopping + ReduceLROnPlateau state tracker on val_loss."""

    def __init__(
        self,
        phase: str,
        max_epochs: int,
        init_lr: float,
        min_lr: float,
        lr_factor: float = 0.5,
        lr_patience: int = 3,
        es_patience: int = 8,
        min_delta: float = 1e-4,
    ) -> None:
        self.phase = phase
        self.max_epochs = int(max_epochs)
        self.init_lr = float(init_lr)
        self.min_lr = float(min_lr)
        self.lr_factor = float(lr_factor)
        self.lr_patience = int(lr_patience)
        self.es_patience = int(es_patience)
        self.min_delta = float(min_delta)

        self.current_lr = float(init_lr)
        self.next_epoch = 0
        self.best_val_loss: float | None = None
        self.ref_val_loss: float | None = None
        self.best_val_acc: float | None = None
        self.best_epoch: int | None = None
        self.wait_es = 0
        self.wait_lr = 0
        self.lr_reductions = 0
        self.stopped = False
        self.stop_reason: str | None = None

    def step(self, epoch_idx: int, val_loss: float, val_acc: float) -> dict[str, Any]:
        val_loss = float(val_loss)
        val_acc = float(val_acc)
        if not math.isfinite(val_loss):
            self.stopped = True
            self.stop_reason = 'non_finite_loss'
            return {'save_best': False, 'new_lr': None, 'stop': True}

        save_best = False
        if self.best_val_loss is None or val_loss < self.best_val_loss:
            self.best_val_loss = val_loss
            self.best_val_acc = val_acc
            self.best_epoch = int(epoch_idx) + 1
            save_best = True

        new_lr = None
        if self.ref_val_loss is None or (self.ref_val_loss - val_loss) > self.min_delta:
            self.ref_val_loss = val_loss
            self.wait_es = 0
            self.wait_lr = 0
        else:
            self.wait_es += 1
            self.wait_lr += 1
            if self.wait_lr >= self.lr_patience and self.current_lr > self.min_lr + 1e-12:
                next_lr = max(self.min_lr, self.current_lr * self.lr_factor)
                if next_lr < self.current_lr - 1e-12:
                    self.current_lr = next_lr
                    self.lr_reductions += 1
                    new_lr = next_lr
                self.wait_lr = 0

        self.next_epoch = int(epoch_idx) + 1
        if self.wait_es >= self.es_patience:
            self.stopped = True
            self.stop_reason = 'early_stopping_saturated'
        elif self.next_epoch >= self.max_epochs:
            self.stopped = True
            self.stop_reason = 'max_epochs_reached'

        return {
            'save_best': save_best,
            'new_lr': new_lr,
            'stop': self.stopped,
        }

    def to_dict(self) -> dict[str, Any]:
        return {
            'phase': self.phase,
            'max_epochs': self.max_epochs,
            'init_lr': self.init_lr,
            'min_lr': self.min_lr,
            'lr_factor': self.lr_factor,
            'lr_patience': self.lr_patience,
            'es_patience': self.es_patience,
            'min_delta': self.min_delta,
            'current_lr': self.current_lr,
            'next_epoch': self.next_epoch,
            'best_val_loss': self.best_val_loss,
            'ref_val_loss': self.ref_val_loss,
            'best_val_acc': self.best_val_acc,
            'best_epoch': self.best_epoch,
            'wait_es': self.wait_es,
            'wait_lr': self.wait_lr,
            'lr_reductions': self.lr_reductions,
            'stopped': self.stopped,
            'stop_reason': self.stop_reason,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> 'SaturationTracker':
        obj = cls(
            phase=data['phase'],
            max_epochs=data['max_epochs'],
            init_lr=data['init_lr'],
            min_lr=data['min_lr'],
            lr_factor=data['lr_factor'],
            lr_patience=data['lr_patience'],
            es_patience=data['es_patience'],
            min_delta=data['min_delta'],
        )
        for attr in (
            'current_lr',
            'next_epoch',
            'best_val_loss',
            'ref_val_loss',
            'best_val_acc',
            'best_epoch',
            'wait_es',
            'wait_lr',
            'lr_reductions',
            'stopped',
            'stop_reason',
        ):
            setattr(obj, attr, data.get(attr))
        return obj


def _fmt_pct_mean_std(vals: list[float]) -> tuple[float, float, str, str]:
    arr = np.asarray(vals, dtype=float) * 100.0
    m = float(np.mean(arr))
    s = float(np.std(arr, ddof=1)) if len(arr) > 1 else 0.0
    return m, s, f'{m:.2f} ± {s:.2f}%', f'${m:.2f} \\pm {s:.2f}\\%$'


def build_3seed_comparison_table(
    seed_metrics: dict[int, dict[str, Any]],
    baseline_json: dict[str, Any],
    seeds: list[int] | None = None,
) -> pd.DataFrame:
    """Compare new from-scratch 3-seed metrics (99, 123, 999) against reference baseline reports."""
    seeds = list(seeds or [99, 123, 999])
    available = [s for s in seeds if s in seed_metrics]
    if not available:
        return pd.DataFrame()

    ref_seeds = baseline_json.get('seeds_baseline', {})
    ref_42_123_999 = baseline_json.get('reported_seed_groups', {}).get('42_123_999', {})

    rows = []
    for label, key in EXCEL_METRIC_MAP:
        vals_new = [float(seed_metrics[s][key]) for s in available]
        m_new, _, str_new, latex_new = _fmt_pct_mean_std(vals_new)

        vals_ref_same = [
            float(ref_seeds[str(s)][key]) for s in available if str(s) in ref_seeds and key in ref_seeds[str(s)]
        ]
        if vals_ref_same:
            m_ref_same, _, str_ref_same, _ = _fmt_pct_mean_std(vals_ref_same)
            delta_same = m_new - m_ref_same
        else:
            str_ref_same = '—'
            delta_same = None

        ref_excel = ref_42_123_999.get(label, {})
        str_excel_42_123_999 = ref_excel.get('mean_std_str', '—')

        row: dict[str, Any] = {'Chỉ số đánh giá': label}
        for s in seeds:
            if s in seed_metrics:
                row[f'Seed {s} Mới (%)'] = round(float(seed_metrics[s][key]) * 100.0, 2)
            else:
                row[f'Seed {s} Mới (%)'] = None
            if str(s) in ref_seeds and key in ref_seeds[str(s)]:
                row[f'Seed {s} Mẫu (%)'] = round(float(ref_seeds[str(s)][key]) * 100.0, 2)
            else:
                row[f'Seed {s} Mẫu (%)'] = None
        row['Mean ± Std (Từ số 0)'] = str_new
        row['Mean ± Std (Mẫu cùng Seed)'] = str_ref_same
        row['Mean ± Std (Báo cáo mẫu 42/123/999)'] = str_excel_42_123_999
        row['Chênh lệch Top-1/Metric (Mới - Mẫu)'] = round(delta_same, 2) if delta_same is not None else None
        row['Mã LaTeX (Overleaf)'] = latex_new
        rows.append(row)

    return pd.DataFrame(rows)


def build_90_species_comparison_table(
    seed_reports: dict[int, pd.DataFrame],
    baseline_json: dict[str, Any],
    seeds: list[int] | None = None,
) -> pd.DataFrame:
    """Build full 90-species side-by-side table comparing new from-scratch runs vs baseline report."""
    seeds = list(seeds or [99, 123, 999])
    available = [s for s in seeds if s in seed_reports]
    labels_vi = {x['original_label']: x['vietnamese_name'] for x in baseline_json['labels_vi']}
    supp_set = set(baseline_json.get('supplemented_8_classes', []))
    per_cls_base = baseline_json.get('per_class_baseline', {})

    rows = []
    for idx, item in enumerate(baseline_json['labels_vi'], 1):
        lbl = item['original_label']
        vi = labels_vi.get(lbl, lbl)
        is_supp = lbl in supp_set
        base_cls = per_cls_base.get(lbl, {})

        new_f1s = []
        new_ps = []
        new_rs = []
        new_sups = []
        row: dict[str, Any] = {
            'STT': idx,
            'Tên tiếng Anh / Khoa học': lbl,
            'Tên tiếng Việt': vi,
            'Nhóm bổ sung': 'Bổ sung thực tế (8 loài)' if is_supp else 'Lớp nền (90 loài)',
        }
        for s in seeds:
            if s in seed_reports and lbl in seed_reports[s].index:
                r = seed_reports[s].loc[lbl]
                p_val = float(r['precision'])
                rec_val = float(r['recall'])
                f1_val = float(r['f1-score'])
                sup_val = int(round(float(r['support'])))
                row[f'P Mới ({s})'] = round(p_val * 100.0, 2)
                row[f'R Mới ({s})'] = round(rec_val * 100.0, 2)
                row[f'F1 Mới ({s})'] = round(f1_val * 100.0, 2)
                row[f'Test ({s})'] = sup_val
                new_ps.append(p_val)
                new_rs.append(rec_val)
                new_f1s.append(f1_val)
                new_sups.append(sup_val)
            else:
                row[f'P Mới ({s})'] = None
                row[f'R Mới ({s})'] = None
                row[f'F1 Mới ({s})'] = None
                row[f'Test ({s})'] = None

        f1_ref_mean = float(base_cls.get('mean_f1', 0.0)) * 100.0
        row['F1 TB Mẫu (99/123/999) %'] = round(f1_ref_mean, 2)
        if new_f1s:
            m_f1 = float(np.mean(new_f1s) * 100.0)
            sd_f1 = float(np.std(new_f1s, ddof=1) * 100.0) if len(new_f1s) > 1 else 0.0
            row['F1 TB Mới (%)'] = round(m_f1, 2)
            row['Std F1 Mới (%)'] = round(sd_f1, 2)
            row['Chênh lệch F1 (Mới - Mẫu)'] = round(m_f1 - f1_ref_mean, 2)
        else:
            row['F1 TB Mới (%)'] = None
            row['Std F1 Mới (%)'] = None
            row['Chênh lệch F1 (Mới - Mẫu)'] = None
        rows.append(row)

    return pd.DataFrame(rows)


def build_4model_comparison_table(
    model_metrics: dict[str, dict[str, Any]],
    baseline_json: dict[str, Any],
) -> pd.DataFrame:
    """Compare 4 freshly trained saturation models against baseline benchmark report."""
    ref_models = baseline_json.get('benchmark_4_models_baseline', {})
    order = ['custom_cnn', 'mobilenet_v2', 'resnet50', 'efficientnet_b0']
    rows = []
    for mk in order:
        if mk not in model_metrics:
            continue
        cur = model_metrics[mk]
        ref = ref_models.get(mk, {})
        top1_cur = float(cur['top1_acc']) * 100.0
        top3_cur = float(cur['top3_acc']) * 100.0
        f1_cur = float(cur['f1']) * 100.0
        top1_ref = float(ref.get('top1_acc', 0.0)) * 100.0 if 'top1_acc' in ref else None
        f1_ref = float(ref.get('f1', 0.0)) * 100.0 if 'f1' in ref else None

        rows.append({
            'model_key': mk,
            'Mô hình': cur.get('model_title', mk),
            'Tham số (M)': cur.get('params_m'),
            'File .keras (MB)': cur.get('size_mb'),
            'Latency T4 (ms)': cur.get('latency_ms'),
            'Epoch tốt nhất / Dừng': f"{cur.get('best_epoch', '—')}/{cur.get('stopped_epoch', '—')}",
            'Top-1 Mới (%)': round(top1_cur, 2),
            'Top-3 Mới (%)': round(top3_cur, 2),
            'Precision Mới (%)': round(float(cur['precision']) * 100.0, 2),
            'Recall Mới (%)': round(float(cur['recall']) * 100.0, 2),
            'F1 Mới (%)': round(f1_cur, 2),
            'Top-1 Mẫu (%)': round(top1_ref, 2) if top1_ref is not None else None,
            'Chênh lệch Top-1 vs Mẫu': round(top1_cur - top1_ref, 2) if top1_ref is not None else None,
            'Chênh lệch F1 vs Mẫu': round(f1_cur - f1_ref, 2) if f1_ref is not None else None,
        })
    return pd.DataFrame(rows)
