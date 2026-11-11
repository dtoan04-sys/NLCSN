# -*- coding: utf-8 -*-
import json, os

nb_path = r"E:\CNTT\NLCNHTTT\06_Mo_Hinh_AI_Colab_Moi\Cay_Kieng_Chia_Seed_Train_Lai_Colab.ipynb"

with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Code mới cho Bước 7 để xuất chuẩn Mean ± Std và code LaTeX Overleaf
step7_code = """# ==============================================================================
# === BƯỚC 7: TỔNG HỢP MEAN ± STD VÀ XUẤT BẢNG LATEX CHO BÁO CÁO / OVERLEAF ===
# ==============================================================================
# Cell này tính toán Giá trị trung bình ± Độ lệch chuẩn (Mean ± Std)
# và tự động sinh mã bảng LaTeX (chuẩn Overleaf) y hệt như bài báo khoa học!

import numpy as np
import pandas as pd
import json
from pathlib import Path

seeds = [42, 99, 100]
metrics_data = {}
reports_data = {}

for s in seeds:
    m_file = PROJECT / f"train_90_lop_seed_{s}" / f"evaluation_report_seed_{s}" / "metrics.json"
    r_file = PROJECT / f"train_90_lop_seed_{s}" / f"evaluation_report_seed_{s}" / "classification_report.csv"
    if m_file.exists():
        metrics_data[s] = json.loads(m_file.read_text(encoding="utf-8"))
    if r_file.exists():
        reports_data[s] = pd.read_csv(r_file, index_col=0)

found_seeds = list(metrics_data.keys())
print(f"✅ Đã tìm thấy kết quả của {len(found_seeds)} seeds: {found_seeds}")

if len(found_seeds) == 0:
    print("⚠️ Chưa tìm thấy kết quả. Hãy chạy Bước 1-6 trước!")
else:
    # 1. TÍNH TOÁN MEAN ± STD CHO CÁC CHỈ SỐ TOÀN CỤC (OVERALL METRICS)
    def calc_mean_std(val_list, precision=3, to_latex=False):
        arr = np.array(val_list, dtype=float)
        m = np.mean(arr)
        s = np.std(arr, ddof=1) if len(arr) > 1 else 0.0
        if to_latex:
            return f"${m:.{precision}f} \\\\pm {s:.{precision}f}$"
        return f"{m:.{precision}f} ± {s:.{precision}f}"

    acc_list = [metrics_data[s]["top1_accuracy"] for s in found_seeds]
    top3_list = [metrics_data[s]["top3_accuracy"] for s in found_seeds]
    prec_list = [metrics_data[s]["weighted_precision"] for s in found_seeds]
    rec_list = [metrics_data[s]["weighted_recall"] for s in found_seeds]
    f1_list = [metrics_data[s]["weighted_f1"] for s in found_seeds]

    summary_df = pd.DataFrame([
        {"Độ đo (Metric)": "Top-1 Accuracy", "Kết quả (Mean ± Std)": calc_mean_std(acc_list), "LaTeX Code": calc_mean_std(acc_list, to_latex=True)},
        {"Độ đo (Metric)": "Top-3 Accuracy", "Kết quả (Mean ± Std)": calc_mean_std(top3_list), "LaTeX Code": calc_mean_std(top3_list, to_latex=True)},
        {"Độ đo (Metric)": "Precision (P)", "Kết quả (Mean ± Std)": calc_mean_std(prec_list), "LaTeX Code": calc_mean_std(prec_list, to_latex=True)},
        {"Độ đo (Metric)": "Recall (R)", "Kết quả (Mean ± Std)": calc_mean_std(rec_list), "LaTeX Code": calc_mean_std(rec_list, to_latex=True)},
        {"Độ đo (Metric)": "F1-Score (F1)", "Kết quả (Mean ± Std)": calc_mean_std(f1_list), "LaTeX Code": calc_mean_std(f1_list, to_latex=True)},
    ])

    print("\\n" + "=" * 70)
    print("📊 BẢNG TỔNG HỢP TOÀN CỤC THEO ĐỊNH DẠNG BÀI BÁO KHOA HỌC (MEAN ± STD):")
    print("=" * 70)
    display(summary_df[["Độ đo (Metric)", "Kết quả (Mean ± Std)"]])

    # 2. TÍNH TOÁN MEAN ± STD CHO TỪNG LOÀI CÂY (PER-CLASS P, R, F1)
    if len(reports_data) > 0:
        ref_df = list(reports_data.values())[0]
        class_list = [c for c in ref_df.index if c not in ["accuracy", "macro avg", "weighted avg"]]
        
        per_class_rows = []
        for c in class_list:
            p_vals = [reports_data[s].loc[c, "precision"] for s in found_seeds if c in reports_data[s].index]
            r_vals = [reports_data[s].loc[c, "recall"] for s in found_seeds if c in reports_data[s].index]
            f_vals = [reports_data[s].loc[c, "f1-score"] for s in found_seeds if c in reports_data[s].index]
            
            per_class_rows.append({
                "Class": c,
                "P": calc_mean_std(p_vals),
                "R": calc_mean_std(r_vals),
                "F1": calc_mean_std(f_vals),
                "P_latex": calc_mean_std(p_vals, to_latex=True),
                "R_latex": calc_mean_std(r_vals, to_latex=True),
                "F1_latex": calc_mean_std(f_vals, to_latex=True)
            })
            
        df_per_class = pd.DataFrame(per_class_rows)
        print("\\n" + "=" * 70)
        print("🌿 BẢNG ĐỘ ĐO P, R, F1 TỪNG LỚP THEO ĐỊNH DẠNG MEAN ± STD (10 lớp đầu):")
        print("=" * 70)
        display(df_per_class[["Class", "P", "R", "F1"]].head(10))

        # Lưu ra Excel & CSV
        out_excel = PROJECT / "Ket_Qua_Thuc_Nghiem_Mean_Std_Overleaf.xlsx"
        with pd.ExcelWriter(out_excel) as writer:
            summary_df.to_excel(writer, sheet_name="Tong_Quat", index=False)
            df_per_class.to_excel(writer, sheet_name="Tung_Loai_Cay", index=False)
        print(f"\\n📁 Đã lưu file Excel: {out_excel}")

        # 3. TẠO MÃ NGUỒN LATEX SẴN SÀNG COPY VÀO OVERLEAF
        latex_code = []
        latex_code.append("% === COPY ĐOẠN NÀY DÁN THẲNG VÀO OVERLEAF ===")
        latex_code.append("\\\\begin{table}[htbp]")
        latex_code.append("  \\\\centering")
        latex_code.append("  \\\\caption{Kết quả đánh giá mô hình phân loại qua các Random Seed (Mean $\\\\pm$ Std)}")
        latex_code.append("  \\\\label{tab:seed_results}")
        latex_code.append("  \\\\begin{tabular}{l c c c}")
        latex_code.append("    \\\\toprule")
        latex_code.append("    \\\\textbf{Class / Metric} & \\\\textbf{P} & \\\\textbf{R} & \\\\textbf{F1} \\\\\\\\")
        latex_code.append("    \\\\midrule")
        
        # Thêm các chỉ số chính trước
        latex_code.append(f"    \\\\textbf{{Overall (Macro Avg)}} & {calc_mean_std(prec_list, to_latex=True)} & {calc_mean_std(rec_list, to_latex=True)} & {calc_mean_std(f1_list, to_latex=True)} \\\\\\\\")
        latex_code.append(f"    \\\\textbf{{Overall Accuracy}} & \\\\multicolumn{{3}}{{c}}{{{calc_mean_std(acc_list, to_latex=True)}}} \\\\\\\\")
        latex_code.append("    \\\\midrule")
        
        # Thêm 15 lớp tiêu biểu hoặc toàn bộ lớp
        for _, row in df_per_class.head(15).iterrows():
            clean_name = row['Class'].replace('_', ' ').replace('&', '\\\\&')
            latex_code.append(f"    {clean_name} & {row['P_latex']} & {row['R_latex']} & {row['F1_latex']} \\\\\\\\")
            
        latex_code.append("    \\\\bottomrule")
        latex_code.append("  \\\\end{tabular}")
        latex_code.append("\\\\end{table}")
        
        latex_str = "\\n".join(latex_code)
        (PROJECT / "bang_ket_qua_overleaf.tex").write_text(latex_str, encoding="utf-8")
        
        print("\\n" + "=" * 70)
        print("📄 MÃ LATEX DÁN VÀO OVERLEAF (Xem mẫu bên dưới, đã lưu vào bang_ket_qua_overleaf.tex):")
        print("=" * 70)
        print(latex_str)
"""

# Cập nhật cell 7 của notebook
nb["cells"][-1]["source"] = [line + "\n" for line in step7_code.split("\n")]

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, ensure_ascii=False, indent=2)

print(f"Updated notebook successfully: {nb_path}")
