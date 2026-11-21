"""Extract verified baseline metrics from existing project reports into baseline_bao_cao_mau.json."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import openpyxl
import pandas as pd


ROOT = Path(r'e:\CNTT\NLCNHTTT')
SCRATCH_DRIVE = Path(
    r'C:\Users\doanxuanthinh\.gemini\antigravity\brain\dc5d314d-f6b8-4827-83ef-e5be15e61751\scratch\drive_results'
)
LABELS_VI_PATH = ROOT / '00_Tai_Lieu_Bao_Cao' / 'Danh_Gia_Mo_Hinh' / 'Ket_Qua_Moi_80_10_10' / 'labels_vi.json'
EXCEL_3_SEEDS = ROOT / '00_Tai_Lieu_Bao_Cao' / 'Danh_Gia_Mo_Hinh' / 'Ket_Qua_Thuc_Nghiem_3_Seeds_Drive.xlsx'
EXCEL_4_MODELS = ROOT / '00_Tai_Lieu_Bao_Cao' / 'Danh_Gia_Mo_Hinh' / 'Bang_So_Sanh_4_Mo_Hinh_Do_That_Drive.xlsx'
OUT_JSON = ROOT / '06_Mo_Hinh_AI_Colab_Moi' / 'baseline_bao_cao_mau.json'


def load_per_class_from_cm(cm_csv: Path) -> dict[str, dict[str, float]]:
    df = pd.read_csv(cm_csv, index_col=0)
    cm = df.values.astype(np.int64)
    labels = list(df.index)
    tp = np.diag(cm)
    support = cm.sum(axis=1)
    pred_tot = cm.sum(axis=0)
    prec = np.divide(tp, pred_tot, out=np.zeros_like(tp, dtype=float), where=pred_tot > 0)
    rec = np.divide(tp, support, out=np.zeros_like(tp, dtype=float), where=support > 0)
    f1 = np.divide(2 * prec * rec, prec + rec, out=np.zeros_like(tp, dtype=float), where=(prec + rec) > 0)
    return {
        lbl: {
            'precision': float(prec[i]),
            'recall': float(rec[i]),
            'f1': float(f1[i]),
            'support': int(support[i]),
            'correct': int(tp[i]),
        }
        for i, lbl in enumerate(labels)
    }


def load_per_class_from_report(report_csv: Path, labels_90: list[str]) -> dict[str, dict[str, float]]:
    df = pd.read_csv(report_csv, index_col=0)
    out = {}
    for lbl in labels_90:
        row = df.loc[lbl]
        sup = int(round(float(row['support'])))
        rec = float(row['recall'])
        out[lbl] = {
            'precision': float(row['precision']),
            'recall': rec,
            'f1': float(row['f1-score']),
            'support': sup,
            'correct': int(round(rec * sup)),
        }
    return out


def main() -> None:
    labels_vi = json.loads(LABELS_VI_PATH.read_text(encoding='utf-8'))
    labels_90 = [item['original_label'] for item in labels_vi]
    assert len(labels_90) == 90, f'Expected 90 labels, got {len(labels_90)}'

    supplemented_8 = sorted([
        'Anthurium (Anthurium andraeanum)',
        'Asparagus Fern (Asparagus setaceus)',
        'Corn Plant (Dracaena fragrans)',
        'Moses in the Cradle (Tradescantia spathacea)',
        'Snake plant (Sanseviera)',
        'Song of India (Dracaena reflexa)',
        'Spider Plant (Chlorophytum comosum)',
        'Weeping Fig (Ficus benjamina)',
    ])
    for s in supplemented_8:
        assert s in labels_90, f'Missing supplemented class: {s}'

    seed_99_m = json.loads(
        (SCRATCH_DRIVE / '02_Ket_Qua_Thuc_Nghiem_Cac_Seeds/train_90_lop_seed_99/evaluation_report_seed_99/metrics.json')
        .read_text(encoding='utf-8')
    )
    seed_123_m = json.loads(
        (SCRATCH_DRIVE / '02_Ket_Qua_Thuc_Nghiem_3_Seeds/Seed_123/KiengLa_KetQua_Seed_123/evaluation_report_30k_80_10_10/metrics.json')
        .read_text(encoding='utf-8')
    )
    seed_999_m = json.loads(
        (SCRATCH_DRIVE / 'train_90_lop_30k_seed_999/evaluation_report_30k_80_10_10/metrics.json')
        .read_text(encoding='utf-8')
    )
    seed_42_m = json.loads(
        (SCRATCH_DRIVE / '02_Ket_Qua_Thuc_Nghiem_3_Seeds/Seed_42/evaluation_report_seed_42/metrics.json')
        .read_text(encoding='utf-8')
    )
    seed_100_m = json.loads(
        (SCRATCH_DRIVE / '02_Ket_Qua_Thuc_Nghiem_Cac_Seeds/train_90_lop_seed_100/evaluation_report_seed_100/metrics.json')
        .read_text(encoding='utf-8')
    )

    per_class_99 = load_per_class_from_cm(
        SCRATCH_DRIVE / '02_Ket_Qua_Thuc_Nghiem_Cac_Seeds/train_90_lop_seed_99/evaluation_report_seed_99/confusion_matrix.csv'
    )
    per_class_123 = load_per_class_from_report(
        SCRATCH_DRIVE / '02_Ket_Qua_Thuc_Nghiem_3_Seeds/Seed_123/KiengLa_KetQua_Seed_123/evaluation_report_30k_80_10_10/classification_report.csv',
        labels_90,
    )
    per_class_999 = load_per_class_from_report(
        SCRATCH_DRIVE / 'train_90_lop_30k_seed_999/evaluation_report_30k_80_10_10/classification_report.csv',
        labels_90,
    )

    benchmark_models = {}
    for mk in ['custom_cnn', 'mobilenet_v2', 'resnet50', 'efficientnet_b0']:
        benchmark_models[mk] = json.loads(
            (SCRATCH_DRIVE / 'benchmark_so_sanh_da_mo_hinh' / mk / 'metrics.json').read_text(encoding='utf-8')
        )

    # Read exact reported summary rows from 3-seed Excel (Ket_Qua_Thuc_Nghiem_3_Seeds_Drive.xlsx)
    wb3 = openpyxl.load_workbook(EXCEL_3_SEEDS, data_only=True)
    ws_s1 = wb3['Sheet1']
    ws_42_99_100 = wb3['Doi_Chung_Seed_42_99_100']
    excel_summary_42_123_999 = {}
    for r in range(5, 10):
        metric_name = ws_s1.cell(r, 1).value
        if metric_name:
            excel_summary_42_123_999[str(metric_name)] = {
                'seed_42': float(ws_s1.cell(r, 2).value),
                'seed_123': float(ws_s1.cell(r, 3).value),
                'seed_999': float(ws_s1.cell(r, 4).value),
                'mean': float(ws_s1.cell(r, 5).value),
                'std': float(ws_s1.cell(r, 6).value),
                'mean_std_str': str(ws_s1.cell(r, 7).value),
            }
    excel_summary_42_99_100 = {}
    for r in range(5, 10):
        metric_name = ws_42_99_100.cell(r, 1).value
        if metric_name:
            excel_summary_42_99_100[str(metric_name)] = {
                'seed_42': float(ws_42_99_100.cell(r, 2).value),
                'seed_99': float(ws_42_99_100.cell(r, 3).value),
                'seed_100': float(ws_42_99_100.cell(r, 4).value),
                'mean': float(ws_42_99_100.cell(r, 5).value),
                'std': float(ws_42_99_100.cell(r, 6).value),
                'mean_std_str': str(ws_42_99_100.cell(r, 7).value),
            }

    payload = {
        'description': 'So lieu doi chieu tu cac bao cao mau hien co trong du an FloraBotanic AI (truoc khi train lai tu so 0)',
        'labels_vi': labels_vi,
        'supplemented_8_classes': supplemented_8,
        'seeds_baseline': {
            '99': {**seed_99_m, 'dataset_total': 23850, 'note': 'Bo cu 23.850 anh (chua co bo sung thuc te)'},
            '123': {**seed_123_m, 'dataset_total': 25013, 'note': 'Bo 25.013 anh pHash (chua co 212 anh bo sung thuc te)'},
            '999': {**seed_999_m, 'dataset_total': 25013, 'note': 'Bo 25.013 anh pHash (chua co 212 anh bo sung thuc te)'},
            '42': {**seed_42_m, 'dataset_total': 23850, 'note': 'Bo cu 23.850 anh'},
            '100': {**seed_100_m, 'dataset_total': 23850, 'note': 'Bo cu 23.850 anh'},
        },
        'reported_seed_groups': {
            '42_123_999': excel_summary_42_123_999,
            '42_99_100': excel_summary_42_99_100,
        },
        'benchmark_4_models_baseline': benchmark_models,
        'per_class_baseline': {
            lbl: {
                '99': per_class_99[lbl],
                '123': per_class_123[lbl],
                '999': per_class_999[lbl],
                'mean_f1': float(np.mean([per_class_99[lbl]['f1'], per_class_123[lbl]['f1'], per_class_999[lbl]['f1']])),
            }
            for lbl in labels_90
        },
    }

    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Wrote {OUT_JSON} ({OUT_JSON.stat().st_size:,} bytes)')
    for s in ['99', '123', '999']:
        m = payload['seeds_baseline'][s]
        print(f"  Seed {s:>3s}: Top1={m['top1_accuracy']*100:.2f}%, Top3={m['top3_accuracy']*100:.2f}%, wF1={m['weighted_f1']*100:.2f}% (test={m['test_images']})")
    print('  4 models baseline:', {k: f"{v['top1_acc']*100:.2f}%" for k, v in benchmark_models.items()})


if __name__ == '__main__':
    main()
