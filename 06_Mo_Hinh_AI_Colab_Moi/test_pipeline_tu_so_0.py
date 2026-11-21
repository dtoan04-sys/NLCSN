"""Unit tests for from-scratch 90-class training pipeline core logic."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

import pipeline_tu_so_0_core as core


def test_group_supplemented_prevents_center_crop_and_clip_frame_leakage(tmp_path: Path) -> None:
    # Mix standalone + center crop + multi-frame clip
    anthurium = []
    for i in range(1, 6):
        p1 = tmp_path / f'hm_{i:02d}.jpg'
        p2 = tmp_path / f'hm_{i:02d}_center.jpg'
        p1.write_bytes(b'x')
        p2.write_bytes(b'x')
        anthurium.extend([p1, p2])

    split1 = core.split_real_images_leak_free(anthurium, 'Anthurium (Anthurium andraeanum)', seed=99)
    # Verify no center-crop and original land in different splits
    stem_splits = {}
    for sp, plist in split1.items():
        for p in plist:
            base_stem = p.stem[:-7] if p.stem.endswith('_center') else p.stem
            stem_splits.setdefault(base_stem, set()).add(sp)
    assert all(len(sps) == 1 for sps in stem_splits.values()), f'Leak detected: {stem_splits}'
    assert sum(len(v) for v in split1.values()) == len(anthurium)

    # Clip sequence of 52 consecutive frames: val and test must each be contiguous slices, disjoint from train
    clip_imgs = []
    for i in range(1, 53):
        p = tmp_path / f'clip01_{i:02d}_f{i*10:04d}.jpg'
        p.write_bytes(b'x')
        clip_imgs.append(p)

    clip_split = core.split_real_images_leak_free(clip_imgs, 'Song of India (Dracaena reflexa)', seed=123)
    assert sum(len(v) for v in clip_split.values()) == 52
    assert len(clip_split['train']) >= 40
    assert len(clip_split['val']) >= 4
    assert len(clip_split['test']) >= 4
    # Deterministic across identical calls
    clip_split_repeat = core.split_real_images_leak_free(clip_imgs, 'Song of India (Dracaena reflexa)', seed=123)
    assert clip_split == clip_split_repeat
    # Tiny real class (<= 4 files) goes cleanly into train without crashing
    tiny = [tmp_path / 's1.jpg', tmp_path / 's2.jpg']
    for p in tiny:
        p.write_bytes(b'x')
    tiny_split = core.split_real_images_leak_free(tiny, 'Snake plant (Sanseviera)', seed=999)
    assert tiny_split == {'train': tiny, 'val': [], 'test': []}


def test_split_90_classes_reproducible_and_handles_missing_folders(tmp_path: Path) -> None:
    labels_json = json.loads(
        Path(r'e:\CNTT\NLCNHTTT\06_Mo_Hinh_AI_Colab_Moi\baseline_bao_cao_mau.json').read_text(encoding='utf-8')
    )
    cls_names = [x['original_label'] for x in labels_json['labels_vi']]

    base_map = {}
    for c in cls_names:
        cdir = tmp_path / 'base' / c
        cdir.mkdir(parents=True)
        files = []
        for i in range(20):
            fp = cdir / f'img_{i:03d}.jpg'
            fp.write_bytes(b'b')
            files.append(fp)
        base_map[c] = files

    supp_map = {
        'Song of India (Dracaena reflexa)': [],
        'Snake plant (Sanseviera)': [],
    }
    for i in range(50):
        fp = tmp_path / 'supp_song' / f'clip01_{i:02d}_f{i:04d}.jpg'
        fp.parent.mkdir(parents=True, exist_ok=True)
        fp.write_bytes(b's')
        supp_map['Song of India (Dracaena reflexa)'].append(fp)
    for i in range(2):
        fp = tmp_path / 'supp_snake' / f'real_{i}.jpg'
        fp.parent.mkdir(parents=True, exist_ok=True)
        fp.write_bytes(b's')
        supp_map['Snake plant (Sanseviera)'].append(fp)

    plan_a, df_a = core.build_dataset_split_plan(base_map, supp_map, seed=999)
    plan_b, _ = core.build_dataset_split_plan(base_map, supp_map, seed=999)
    assert plan_a == plan_b
    assert len(df_a) == 90
    # Ensure train/val/test disjoint per class
    for c in cls_names:
        tr = set(plan_a[c]['train_base'] + plan_a[c]['train_real'])
        va = set(plan_a[c]['val_base'] + plan_a[c]['val_real'])
        te = set(plan_a[c]['test_base'] + plan_a[c]['test_real'])
        assert tr.isdisjoint(va) and tr.isdisjoint(te) and va.isdisjoint(te)
    # Real oversample plan only touches train real images and respects bounds
    oversampled = core.build_real_train_oversample_entries(plan_a['Snake plant (Sanseviera)']['train_real'], max_total=48, max_repeat=8)
    assert len(oversampled) == 16  # 2 * 8 = 16


def test_saturation_tracker_plateau_lr_drop_early_stop_and_resume() -> None:
    st = core.SaturationTracker(
        phase='finetune',
        max_epochs=80,
        init_lr=5e-5,
        min_lr=1e-6,
        lr_factor=0.5,
        lr_patience=2,
        es_patience=5,
        min_delta=1e-3,
    )
    # Epoch 0, 1 improve
    a0 = st.step(0, val_loss=1.50, val_acc=0.60)
    assert a0['save_best'] and not a0['stop'] and a0['new_lr'] is None
    a1 = st.step(1, val_loss=1.20, val_acc=0.70)
    assert a1['save_best'] and st.wait_es == 0 and st.wait_lr == 0

    # Epoch 2, 3 plateau -> wait_lr=2 triggers LR drop on epoch 3
    a2 = st.step(2, val_loss=1.2005, val_acc=0.70)
    assert not a2['save_best'] and a2['new_lr'] is None and st.wait_es == 1
    a3 = st.step(3, val_loss=1.201, val_acc=0.69)
    assert a3['new_lr'] == pytest.approx(2.5e-5)
    assert st.lr_reductions == 1
    assert st.wait_es == 2 and not a3['stop']

    # Round-trip serialize/deserialize simulating Colab disconnect recovery
    saved_json = json.dumps(st.to_dict())
    resumed = core.SaturationTracker.from_dict(json.loads(saved_json))
    assert resumed.next_epoch == 4
    assert resumed.current_lr == pytest.approx(2.5e-5)
    assert resumed.wait_es == 2

    # Tiny noise < best_val_loss still saves weights if lower, but resets only when > min_delta,
    # and wait_es == 5 stops training cleanly
    resumed.step(4, val_loss=1.202, val_acc=0.69)
    resumed.step(5, val_loss=1.203, val_acc=0.68)
    a6 = resumed.step(6, val_loss=1.204, val_acc=0.68)
    assert a6['stop'] is True
    assert resumed.stopped is True
    assert resumed.stop_reason == 'early_stopping_saturated'
    assert resumed.best_epoch == 2  # 1-based epoch for val_loss=1.20

    # Non-finite loss stops cleanly without overwriting best weights
    st_nan = core.SaturationTracker(phase='head', max_epochs=50, init_lr=1e-3, min_lr=1e-5, lr_factor=0.5, lr_patience=3, es_patience=7)
    st_nan.step(0, val_loss=1.4, val_acc=0.6)
    a_nan = st_nan.step(1, val_loss=float('nan'), val_acc=0.0)
    assert a_nan['stop'] is True and not a_nan['save_best']
    assert st_nan.stop_reason == 'non_finite_loss'


def test_damped_class_weights_and_baseline_comparison_tables() -> None:
    counts = np.array([10, 100, 1000], dtype=float)
    cw = core.compute_damped_class_weights(counts)
    assert set(cw.keys()) == {0, 1, 2}
    assert cw[0] == pytest.approx(2.20)
    assert cw[2] == pytest.approx(0.65)
    assert cw[0] > cw[1] > cw[2]

    baseline = json.loads(
        Path(r'e:\CNTT\NLCNHTTT\06_Mo_Hinh_AI_Colab_Moi\baseline_bao_cao_mau.json').read_text(encoding='utf-8')
    )
    labels_90 = [x['original_label'] for x in baseline['labels_vi']]

    fake_seed_metrics = {}
    fake_seed_reports = {}
    for s, boost in [(99, 0.02), (123, 0.03), (999, 0.025)]:
        base_m = baseline['seeds_baseline'][str(s)]
        fake_seed_metrics[s] = {
            'seed': s,
            'test_images': 2598,
            'top1_accuracy': base_m['top1_accuracy'] + boost,
            'top3_accuracy': min(0.99, base_m['top3_accuracy'] + 0.01),
            'weighted_precision': base_m['weighted_precision'] + boost,
            'weighted_recall': base_m['weighted_recall'] + boost,
            'weighted_f1': base_m['weighted_f1'] + boost,
            'macro_precision': base_m['macro_precision'] + boost,
            'macro_recall': base_m['macro_recall'] + boost,
            'macro_f1': base_m['macro_f1'] + boost,
            'head_epochs': 18,
            'fine_epochs': 32,
            'best_fine_epoch': 24,
        }
        rows = {}
        for lbl in labels_90:
            old_cls = baseline['per_class_baseline'][lbl][str(s)]
            rows[lbl] = {
                'precision': min(1.0, old_cls['precision'] + boost),
                'recall': min(1.0, old_cls['recall'] + boost),
                'f1-score': min(1.0, old_cls['f1'] + boost),
                'support': old_cls['support'] + (2 if lbl in baseline['supplemented_8_classes'] else 0),
            }
        fake_seed_reports[s] = pd.DataFrame(rows).transpose()

    df_3seed = core.build_3seed_comparison_table(fake_seed_metrics, baseline, seeds=[99, 123, 999])
    assert len(df_3seed) >= 5
    assert 'Mean ± Std (Từ số 0)' in df_3seed.columns
    assert 'Mean ± Std (Báo cáo mẫu 42/123/999)' in df_3seed.columns
    assert 'Chênh lệch Top-1/Metric (Mới - Mẫu)' in df_3seed.columns

    df_90 = core.build_90_species_comparison_table(fake_seed_reports, baseline, seeds=[99, 123, 999])
    assert len(df_90) == 90
    assert df_90['Nhóm bổ sung'].str.contains('Bổ sung').sum() == 8
    assert (df_90['Chênh lệch F1 (Mới - Mẫu)'] > 0).all()

    fake_4m = {
        'custom_cnn': {**baseline['benchmark_4_models_baseline']['custom_cnn'], 'stopped_epoch': 82, 'best_epoch': 74, 'top1_acc': 0.701},
        'mobilenet_v2': {**baseline['benchmark_4_models_baseline']['mobilenet_v2'], 'stopped_epoch': 46, 'best_epoch': 38, 'top1_acc': 0.742},
        'resnet50': {**baseline['benchmark_4_models_baseline']['resnet50'], 'stopped_epoch': 41, 'best_epoch': 33, 'top1_acc': 0.768},
        'efficientnet_b0': {**baseline['benchmark_4_models_baseline']['efficientnet_b0'], 'stopped_epoch': 39, 'best_epoch': 31, 'top1_acc': 0.785},
    }
    df_4m = core.build_4model_comparison_table(fake_4m, baseline)
    assert len(df_4m) == 4
    assert 'Chênh lệch Top-1 vs Mẫu' in df_4m.columns


def test_generated_notebooks_valid_and_synced() -> None:
    import ast
    import base64
    import re
    import zlib

    base_dir = Path(r'e:\CNTT\NLCNHTTT\06_Mo_Hinh_AI_Colab_Moi')
    baseline_expected = json.loads((base_dir / 'baseline_bao_cao_mau.json').read_text(encoding='utf-8'))

    nb1_path = base_dir / 'Train_3_Seeds_Tu_So_0_99_123_999_Colab.ipynb'
    nb2_path = base_dir / 'So_Sanh_4_Mo_Hinh_Tu_So_0_Colab.ipynb'
    for nb_path in (nb1_path, nb2_path):
        assert nb_path.is_file()
        nb = json.loads(nb_path.read_text(encoding='utf-8'))
        full_code = []
        for idx, cell in enumerate(nb['cells']):
            if cell['cell_type'] == 'code':
                src = ''.join(cell['source'])
                full_code.append(src)
                cleaned = '\n'.join(
                    ln for ln in src.splitlines()
                    if not ln.lstrip().startswith('!') and not ln.lstrip().startswith('%')
                )
                ast.parse(cleaned, filename=f'{nb_path.name}#cell{idx}')
        joined = '\n'.join(full_code)
        assert 'Thu_Nghiem_Tu_So_0_90_Loai' in joined
        assert 'da_co_trong_90_loai' in joined
        assert 'MAX_EPOCHS_HEAD = 50' in joined
        assert 'MAX_EPOCHS_FINE = 80' in joined
        m = re.search(r"BASELINE_B64 = '([^']+)'", joined)
        assert m, f'Missing BASELINE_B64 in {nb_path.name}'
        decoded = json.loads(zlib.decompress(base64.b64decode(m.group(1))).decode('utf-8'))
        assert decoded['seeds_baseline']['999']['top1_accuracy'] == baseline_expected['seeds_baseline']['999']['top1_accuracy']

    nb1_src = '\n'.join(''.join(c['source']) for c in json.loads(nb1_path.read_text(encoding='utf-8'))['cells'])
    nb2_src = '\n'.join(''.join(c['source']) for c in json.loads(nb2_path.read_text(encoding='utf-8'))['cells'])
    assert 'SEEDS_TO_RUN = [99, 123, 999]' in nb1_src
    assert 'SEED_999_DIR = EXP_ROOT / \'seeds_mobilenetv2\' / \'seed_999\'' in nb2_src
    assert 'SEEDS_OUT_ROOT = EXP_ROOT / \'seeds_mobilenetv2\'' in nb1_src
    assert 'MAX_EPOCHS_CUSTOM = 120' in nb2_src
    assert 'rgb_to_bgr_center' in nb2_src
    assert 'is_drive_fuse_path' in nb1_src and 'is_drive_fuse_path' in nb2_src
    assert '/content/local_runs/' in nb1_src and '/content/local_runs/' in nb2_src
    assert 'restore_dir_from_latest_ckpt_zip' in nb1_src and 'pack_dir_to_ckpt_zip' in nb2_src
    assert 'COMPLETED_BUNDLES_DIR' in nb1_src and 'COMPLETED_BUNDLES_DIR' in nb2_src


def test_ckpt_zip_pack_restore_and_complete_bundle_fallback(tmp_path: Path) -> None:
    import zipfile

    local_run = tmp_path / 'local_seed_999'
    (local_run / 'head').mkdir(parents=True)
    (local_run / 'head' / 'progress.json').write_text('{"next_epoch": 46, "stopped": true}', encoding='utf-8')
    (local_run / 'head' / 'best_model.keras').write_bytes(b'headweights')

    ckpt_dir = tmp_path / '_live_ckpt'
    z_head = core.pack_dir_to_ckpt_zip(local_run, ckpt_dir, 'seed_999', 1, 'head', 46)
    assert z_head.name == 'ckpt_seed_999_01_head_ep046.zip'

    (local_run / 'finetune').mkdir(parents=True)
    (local_run / 'finetune' / 'progress.json').write_text('{"next_epoch": 3, "stopped": false}', encoding='utf-8')
    z_fine = core.pack_dir_to_ckpt_zip(local_run, ckpt_dir, 'seed_999', 2, 'finetune', 3)
    assert z_fine.name == 'ckpt_seed_999_02_finetune_ep003.zip'
    assert not z_head.exists()  # old zip cleaned locally

    # Add a corrupted newer zip; restore must gracefully fall back to z_fine
    corrupt = ckpt_dir / 'ckpt_seed_999_02_finetune_ep006.zip'
    corrupt.write_bytes(b'not a valid zip')

    restored_dir = tmp_path / 'restored'
    picked = core.restore_dir_from_latest_ckpt_zip(restored_dir, ckpt_dir, 'seed_999')
    assert picked == z_fine
    assert (restored_dir / 'head' / 'best_model.keras').read_bytes() == b'headweights'
    assert json.loads((restored_dir / 'finetune' / 'progress.json').read_text(encoding='utf-8'))['next_epoch'] == 3

    # Verify complete bundle fallback when loose Drive directory is empty/missing
    ev = local_run / 'evaluation_report'
    ev.mkdir()
    (ev / 'metrics.json').write_text('{"top1_accuracy": 0.815}', encoding='utf-8')
    pd.DataFrame([{'precision': 0.8, 'recall': 0.8, 'f1-score': 0.8, 'support': 10}], index=['Aloe Vera']).to_csv(
        ev / 'classification_report.csv'
    )
    bundle = tmp_path / 'seed_999_complete.zip'
    core.save_dir_to_flat_zip(local_run, bundle)
    assert zipfile.ZipFile(bundle).testzip() is None

    empty_drive_dir = tmp_path / 'empty_seed_999_duplicate'
    empty_drive_dir.mkdir()
    m_obj, rep_df = core.read_eval_from_dir_or_bundle(empty_drive_dir, bundle)
    assert m_obj == {'top1_accuracy': 0.815}
    assert 'Aloe Vera' in rep_df.index


def test_drive_fuse_safe_writers_and_history_fallback(tmp_path: Path) -> None:
    # Drive path detection skips .tmp rename and uses in-place write
    assert core.is_drive_fuse_path(Path('/content/drive/MyDrive/foo/metrics.json'))
    assert not core.is_drive_fuse_path(tmp_path / 'metrics.json')

    out_json = tmp_path / 'sub' / 'metrics.json'
    core.atomic_write_text(out_json, '{"ok": true}')
    assert json.loads(out_json.read_text(encoding='utf-8')) == {'ok': True}

    df = pd.DataFrame([{'a': 1, 'b': 2}])
    csv_p = tmp_path / 'sub' / 'rep.csv'
    xlsx_p = tmp_path / 'sub' / 'rep.xlsx'
    core.safe_save_csv(df, csv_p, index=False)
    core.safe_save_excel({'S1': (df, False)}, xlsx_p)
    assert pd.read_csv(csv_p).to_dict('records') == [{'a': 1, 'b': 2}]
    assert pd.read_excel(xlsx_p, sheet_name='S1').to_dict('records') == [{'a': 1, 'b': 2}]

    # Phase epoch recovery from history.csv when tracker metadata lagged behind
    ph = tmp_path / 'finetune'
    ph.mkdir()
    pd.DataFrame([
        {'epoch': 1, 'val_loss': 1.50},
        {'epoch': 25, 'val_loss': 1.15},
        {'epoch': 33, 'val_loss': 1.1526},
    ]).to_csv(ph / 'history.csv', index=False)
    stale = core.SaturationTracker('finetune', 80, 5e-5, 1e-6)
    stale.next_epoch = 10
    stale.best_epoch = 8
    b_ep, s_ep = core.read_phase_epoch_stats(ph, stale)
    assert b_ep == 25 and s_ep == 33

