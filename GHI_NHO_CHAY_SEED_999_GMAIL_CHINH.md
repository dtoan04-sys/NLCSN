# 📌 GHI NHỚ HƯỚNG DẪN CHẠY TIẾP SEED 999 TRÊN GMAIL CHÍNH (NGÀY MAI)

Tất cả dữ liệu hiện tại đã nằm gọn gàng 100% trong thư mục **`KiengLa_AI`** (như hình ảnh bạn vừa gửi có thêm thư mục `KiengLa_AI_KetQua`).

Ngày mai khi mở **Gmail chính** lên (đã được Google hồi phục đầy đủ GPU T4), bạn chỉ cần làm đúng các bước cực kỳ đơn giản sau:

---

### BƯỚC 1: MỞ FILE COLAB TRÊN GMAIL CHÍNH
1. Vào [colab.research.google.com](https://colab.research.google.com) bằng **Gmail chính**.
2. Mở file notebook huấn luyện, chọn **Runtime -> Change runtime type -> T4 GPU** rồi bấm **Save**.

---

### BƯỚC 2: CẤU HÌNH ĐÚNG 1 DÒNG DUY NHẤT Ở Ô BƯỚC 1
Ở ô **BƯỚC 1**, bạn đặt cấu hình:

```python
RANDOM_SEED = 999   # Chạy nốt Seed 999 để đủ bộ 3 Seed [42, 123, 999]

PROJECT = Path('/content/drive/MyDrive/KiengLa_AI')
ZIP_30K_PATH = PROJECT / 'merged_v1/merged_90_30k_chuan.zip'
RAW_30K_DIR = Path('/content/raw_30k_extracted')
DATA_30K_SPLIT = Path('/content/data_30k_split_80_10_10')

# Lưu thẳng vào KiengLa_AI vì đây là Gmail chính (chủ sở hữu), không bao giờ bị lỗi quyền ghi:
SAVE_30K_ROOT = PROJECT / f'train_90_lop_30k_seed_{RANDOM_SEED}'
SAVE_30K_ROOT.mkdir(parents=True, exist_ok=True)

print(f'📁 Dữ liệu đọc từ : {ZIP_30K_PATH}')
print(f'📁 Kết quả lưu vào: {SAVE_30K_ROOT}')
```

---

### BƯỚC 3: BẤM CHẠY TỪ BƯỚC 1 ĐẾN BƯỚC 6
Bấm **Runtime -> Run all** (hoặc chạy lần lượt từ Bước 1 đến Bước 6).
* Mô hình sẽ tự động chia 80-10-10 theo `Seed 999`.
* Tự động train và lưu kết quả vào `KiengLa_AI/train_90_lop_30k_seed_999`.

---

### BƯỚC 4: CHẠY BƯỚC 7 ĐỂ XUẤT TRỌN VẸN BẢNG [42, 123, 999] CHO CÔ GIÁO
Sau khi Bước 6 xong, bạn dán đoạn code chuẩn này vào **Bước 7** và bấm chạy:

```python
import json, os
import numpy as np
import pandas as pd
from pathlib import Path

seeds = [42, 123, 999]
PROJECT = Path('/content/drive/MyDrive/KiengLa_AI')

metrics_data = {}
reports_data = {}

for s in seeds:
    possible_dirs = [
        PROJECT / f"train_90_lop_30k_seed_{s}" / "evaluation_report_30k_80_10_10",
        PROJECT / f"train_90_lop_30k_seed_{s}",
        PROJECT / "KiengLa_AI_KetQua" / f"Seed_{s}" / "evaluation_report_30k_80_10_10",
        PROJECT / "KiengLa_AI_KetQua" / f"Seed_{s}",
        PROJECT / f"train_90_lop_seed_{s}" / f"evaluation_report_seed_{s}",
        PROJECT / "train_90_lop_30k_anh" / "evaluation_report_30k_80_10_10" if s == 42 else Path("/non_existent")
    ]
    for d in possible_dirs:
        m_file = d / "metrics.json"
        r_file = d / "classification_report.csv"
        if m_file.exists():
            metrics_data[s] = json.loads(m_file.read_text(encoding="utf-8"))
            if r_file.exists():
                reports_data[s] = pd.read_csv(r_file, index_col=0)
            print(f"✅ Đã nhận diện Seed {s} từ: {d.name}")
            break

found_seeds = list(metrics_data.keys())
print(f"\n🎯 ĐÃ GOM ĐỦ {len(found_seeds)} SEEDS: {found_seeds}")

# 1. BẢNG SO SÁNH 3 SEED
comparison_rows = []
for s in found_seeds:
    m = metrics_data[s]
    comparison_rows.append({
        "Thí nghiệm": f"Seed {s}" if s != 42 else "Seed 42 (Mô hình chính)",
        "Seed": s,
        "Số ảnh Test": m.get("test_images", 0),
        "Top-1 Acc (%)": f"{m['top1_accuracy'] * 100:.2f}%",
        "Top-3 Acc (%)": f"{m['top3_accuracy'] * 100:.2f}%",
        "Weighted Recall (%)": f"{m['weighted_recall'] * 100:.2f}%",
        "Weighted Precision (%)": f"{m['weighted_precision'] * 100:.2f}%",
        "Weighted F1 (%)": f"{m['weighted_f1'] * 100:.2f}%"
    })
df_compare = pd.DataFrame(comparison_rows)
display(df_compare)

# 2. TÍNH MEAN ± STD (CHUẨN OVERLEAF)
def calc_mean_std(val_list, precision=3, to_latex=False):
    arr = np.array(val_list, dtype=float)
    m = np.mean(arr)
    s = np.std(arr, ddof=1) if len(arr) > 1 else 0.0
    if to_latex:
        return f"${m:.{precision}f} \\pm {s:.{precision}f}$"
    return f"{m:.{precision}f} ± {s:.{precision}f}"

acc_list  = [metrics_data[s]["top1_accuracy"] for s in found_seeds]
top3_list = [metrics_data[s]["top3_accuracy"] for s in found_seeds]
prec_list = [metrics_data[s]["weighted_precision"] for s in found_seeds]
rec_list  = [metrics_data[s]["weighted_recall"] for s in found_seeds]
f1_list   = [metrics_data[s]["weighted_f1"] for s in found_seeds]

summary_df = pd.DataFrame([
    {"Độ đo": "Top-1 Accuracy", "Mean ± Std (0-1)": calc_mean_std(acc_list), "LaTeX": calc_mean_std(acc_list, to_latex=True)},
    {"Độ đo": "Top-3 Accuracy", "Mean ± Std (0-1)": calc_mean_std(top3_list), "LaTeX": calc_mean_std(top3_list, to_latex=True)},
    {"Độ đo": "Precision (P)",  "Mean ± Std (0-1)": calc_mean_std(prec_list), "LaTeX": calc_mean_std(prec_list, to_latex=True)},
    {"Độ đo": "Recall (R)",     "Mean ± Std (0-1)": calc_mean_std(rec_list), "LaTeX": calc_mean_std(rec_list, to_latex=True)},
    {"Độ đo": "F1-Score (F1)",  "Mean ± Std (0-1)": calc_mean_std(f1_list), "LaTeX": calc_mean_std(f1_list, to_latex=True)},
])
display(summary_df)

# LƯU FILE TỔNG HỢP VÀO KiengLa_AI
out_excel = PROJECT / "Bao_Cao_Tong_Hop_Seeds_42_123_999.xlsx"
with pd.ExcelWriter(out_excel) as writer:
    df_compare.to_excel(writer, sheet_name="So_Sanh_Seeds", index=False)
    summary_df.to_excel(writer, sheet_name="Tong_Quat_Mean_Std", index=False)

print(f"🎉 ĐÃ LƯU TOÀN BỘ FILE BÁO CÁO VÀO: {PROJECT}")
```
