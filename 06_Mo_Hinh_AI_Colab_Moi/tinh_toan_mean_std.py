# -*- coding: utf-8 -*-
"""
Script tính toán kết quả thực nghiệm đa Seed (Seed 42, Seed 99, Seed 100)
và định dạng theo chuẩn bài báo khoa học / Overleaf: Mean ± Std (P, R, F1).
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path

def aggregate_seeds(seeds=[42, 99, 100], project_dir="."):
    project = Path(project_dir)
    
    # Giả sử ta đọc metrics.json và classification_report từ các thư mục seed
    metrics_list = []
    reports = {}
    
    for s in seeds:
        m_file = project / f"train_90_lop_seed_{s}" / f"evaluation_report_seed_{s}" / "metrics.json"
        rep_file = project / f"train_90_lop_seed_{s}" / f"evaluation_report_seed_{s}" / "classification_report.csv"
        
        if m_file.exists():
            metrics_list.append(json.loads(m_file.read_text(encoding="utf-8")))
        if rep_file.exists():
            reports[s] = pd.read_csv(rep_file, index_col=0)
            
    print(f"Tìm thấy kết quả của {len(metrics_list)} seeds.")
    return metrics_list, reports

def format_mean_std(values, precision=3, to_latex=False):
    """Tính Mean ± Std và định dạng chuỗi"""
    arr = np.array(values, dtype=float)
    mean = np.mean(arr)
    std = np.std(arr, ddof=1) if len(arr) > 1 else 0.0
    
    if to_latex:
        return f"${mean:.{precision}f} \\pm {std:.{precision}f}$"
    return f"{mean:.{precision}f} ± {std:.{precision}f}"

print("Script format_mean_std ready.")
