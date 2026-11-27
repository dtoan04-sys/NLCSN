# BẢNG TỶ LỆ PHÂN CHIA DỮ LIỆU ĐA MÔ HÌNH & KẾT QUẢ THẬT HỌC TĂNG CƯỜNG 48 LOÀI

File Excel đầy đủ (4 sheet có tô màu): [Bang_Ti_Le_Phan_Chia_Va_Hoc_Tang_Cuong_Da_Mo_Hinh.xlsx](file:///e:/CNTT/NLCNHTTT/00_Tai_Lieu_Bao_Cao/Danh_Gia_Mo_Hinh/Bang_Ti_Le_Phan_Chia_Va_Hoc_Tang_Cuong_Da_Mo_Hinh.xlsx)

---

## 1. Bảng tỷ lệ & số liệu phân chia Train / Val / Test trên tất cả các mô hình

| STT | Mô hình / Pipeline | Tỷ lệ chia | Train | Val | Test | Tổng ảnh | Top-1 Acc | Top-3 Acc | F1-Score |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | **MobileNetV2 (Baseline cũ)** | `70% - 15% - 15%` | 16695 | 3577 | 3578 | 23850 | 70.29% | 85.79% | 69.92% |
| 2 | **MobileNetV2 (Chuẩn 80-10-10, Seed 42)** | `80% - 10% - 10%` | 19057 | 2388 | 2405 | 23850 | 73.76% | 88.11% | 73.76% |
| 3 | **Custom CNN (Benchmark 4 mô hình)** | `80% - 10% - 10%` | 19975 | 2461 | 2577 | 25013 | 68.57% | 85.76% | 67.86% |
| 4 | **ResNet50 (Benchmark 4 mô hình)** | `80% - 10% - 10%` | 19975 | 2461 | 2577 | 25013 | 74.93% | 88.63% | 74.71% |
| 5 | **EfficientNetB0 (Benchmark 4 mô hình)** | `80% - 10% - 10%` | 19975 | 2461 | 2577 | 25013 | 76.87% | 90.07% | 76.47% |
| 6 | **MobileNetV2 Mẫu (Benchmark 4 mô hình)** | `80% - 10% - 10%` | 19975 | 2461 | 2577 | 25013 | 70.39% | 85.99% | 70.20% |
| 7 | **MobileNetV2 (Tăng cường 48 loài — aug48) ★** | `80-10-10 + Aug Train` | 26057 | 2492 | 2534 | 31083 | 79.16% | 90.77% | 79.28% |
| 8 | **EfficientNetB0 (Tăng cường 48 loài — aug48) ★** | `80-10-10 + Aug Train` | 26057 | 2492 | 2534 | 31083 | 81.69% | 92.78% | 81.57% |
| 9 | **MobileNetV2 (Từ số 0 — Seed 999)** | `80% - 10% - 10%` | 20141 | 2483 | 2601 | 25225 | 80.51% | 91.27% | 80.36% |
| 10 | **EfficientNetB0 (Từ số 0 — Seed 999)** | `80% - 10% - 10%` | 20141 | 2483 | 2601 | 25225 | 84.47% | 93.89% | 84.36% |
| 11 | **MobileNetV2 (Bù thực tế 8 loài + Replay)** | `1.860 / 450 / 450` | 1860 | 450 | 450 | 2760 | 75.11% | 92.67% | — |
| 12 | **MobileNetV2 (Học tăng cường Online Active Learning)** | `85% Train / 15% Val (Online)` | Động (48 loài ưu tiên) | Động (15%) | Giữ nguyên Test gốc | Tăng dần online | — | — | — |

---

## 2. Kết quả ĐO THẬT Trước vs Sau tăng cường xoay góc & tăng/giảm sáng cho 48 loài yếu (`aug48`)

- **Tăng cường chỉ trên tập Train:** `19,919` → **`26,057` ảnh** (sinh thêm **`+6,138` ảnh** xoay ±25°, lật ngang, tăng/giảm sáng 0.70x–1.30x, tương phản, zoom nhẹ).
- **Tập Val (`2,492`) và Test (`2,534`):** giữ nguyên 100% ảnh gốc (chống Data Leakage).

| Mô hình | Top-1 Trước | Top-1 Sau | Δ Top-1 | Top-3 Sau | Weighted F1 | Macro F1 | Loài F1 < 60% | 48 loài ưu tiên |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **MobileNetV2 (`aug48`)** | 70.39% | **79.16%** | **+8.77%** | **90.77%** | **79.28%** | 78.02% | 28 → **11** | **40/48** tăng F1 (TB **+11.88%**) |
| **EfficientNetB0 (`aug48`)** | 76.87% | **81.69%** | **+4.82%** | **92.78%** | **81.57%** | **80.25%** | 28 → **5** | **42/48** tăng F1 (TB **+14.57%**) |
