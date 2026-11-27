# Báo cáo So sánh Đa mô hình: Các loài cây có độ chính xác < 60% và Nhóm ít dữ liệu

**Nguồn dữ liệu đo thực tế:**
- `Bao_Cao_Chi_Tiet_90_Loai_Cay_MobileNetV2.xlsx` (MobileNetV2 Seed 999 — 2.577 ảnh Test; 3 Seeds 42/123/999; Phân bổ 30k sạch 25.013 ảnh; Sau bổ sung thực tế Replay Test 450 ảnh).
- `Bang_So_Sanh_4_Mo_Hinh_Do_That_Drive.xlsx` (So sánh tổng thể 4 mô hình: Custom CNN, ResNet50, EfficientNetB0, MobileNetV2 trên cùng tập 2.577 ảnh Test).
- `Ket_Qua_Tu_So_0_99_123_999/` (Per-class `classification_report.csv` đo thực tế trên 2.601 ảnh Test cho MobileNetV2 Từ số 0 Seeds 99/123/999 và EfficientNetB0 Từ số 0 Seed 999).

> **Minh bạch số liệu:** Toàn bộ chỉ số từng loài dưới đây là số đo thực tế từ file báo cáo Colab. Hai mô hình **ResNet50** và **Custom CNN** chỉ lưu kết quả tổng thể 90 loài trong `Bang_So_Sanh_4_Mo_Hinh_Do_That_Drive.xlsx` (không lưu file `classification_report.csv` từng loài trên đĩa), do đó báo cáo phân tách rõ **chỉ số tổng thể 4 mô hình** và **chỉ số từng loài đo thực tế** — tuyệt đối không suy đoán hay giả lập số liệu từng loài.

## 1. Tóm tắt phát hiện chính

- Trên **MobileNetV2 Mẫu (Seed 999, 2.577 ảnh Test)**: có **28 loài** có `F1-Score < 60%`, **29 loài** có `Recall < 60%`, **20 loài** có `Precision < 60%` — gộp lại có **34 loài** có `Recall < 60% hoặc F1 < 60%` và **39 loài** có ít nhất một chỉ số `(P / R / F1) < 60%`.
- Khi huấn luyện lại theo pipeline sạch (**MobileNetV2 Từ số 0 — Seed 999, 2.601 ảnh Test**): số loài `F1 < 60%` giảm mạnh từ **28 → 4 loài**, số loài `Recall < 60%` giảm từ **29 → 8 loài**. F1 trung bình của nhóm 39 loài tăng **+17.07%** (từ **54.52%** lên **71.59%**), với **38/39** loài cải thiện.
- Trên **EfficientNetB0 Từ số 0 (Seed 999, 2.601 ảnh Test)**: số loài `F1 < 60%` giảm từ **28 → 0 loài (xóa sổ hoàn toàn nhóm F1 < 60%)**, số loài `Recall < 60%` chỉ còn **4 loài**. **100% (39/39)** loài trong nhóm yếu đều cải thiện F1 so với MobileNetV2 Mẫu, với mức tăng trung bình **+22.69%** (từ **54.52%** lên **77.21%**).
- Về dữ liệu (bộ 30k sạch 25.013 ảnh, trung bình 221,9 Train / 27,3 Val / 28,6 Test / 277,9 Tổng): có **17 loài** có `Train < 180` (tổng ≤ 223 ảnh), đặc biệt **Cây Yucca** (62 Train / 7 Val / 9 Test = 78 ảnh) và **Cây sống đời** (116 Train / 14 Val / 16 Test = 146 ảnh). Kết hợp nhóm `< 60%` và nhóm ít dữ liệu tạo thành **48 loài ưu tiên** trong `priority_low_species.json`.

## 2. Bảng đối chứng tổng thể các mô hình (90 loài, tỷ lệ 80-10-10)

| Mô hình | Tập Test | Tham số (M) | File .keras (MB) | Độ trễ T4 (ms) | Top-1 Acc | Top-3 Acc | Precision | Recall | F1-Score | Dữ liệu từng loài |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Custom CNN (From Scratch)** | Benchmark 4 mô hình (2.577 ảnh) | 1.88 | 21.60 | 2.40 | 68.57% | 85.76% | 70.87% | 68.57% | **67.86%** | Chỉ lưu tổng thể (không có CSV 90 loài) |
| **ResNet50 (Transfer Learning)** | Benchmark 4 mô hình (2.577 ảnh) | 23.77 | 202.80 | 9.90 | 74.93% | 88.63% | 76.51% | 74.93% | **74.71%** | Chỉ lưu tổng thể (không có CSV 90 loài) |
| **EfficientNetB0 (Benchmark cũ)** | Benchmark 4 mô hình (2.577 ảnh) | 4.16 | 28.90 | 10.00 | 76.87% | 90.07% | 77.40% | 76.87% | **76.47%** | Chỉ lưu tổng thể + Replay 450 sau bù |
| **MobileNetV2 (Mẫu — Seed 999)** | Benchmark 4 mô hình (2.577 ảnh) | 2.37 | 22.00 | 5.40 | 70.39% | 85.99% | 72.44% | 70.39% | **70.20%** | Có đủ 90 loài (Seed 42, 123, 999) |
| **MobileNetV2 (TB 3 Seeds 42/123/999)** | 3 Seeds Mẫu (2.405–2.577 ảnh) | 2.37 | 22.00 | 5.40 | 71.41% | 86.88% | 73.86% | 71.41% | **71.43%** | Có đủ 90 loài (Mean ± Std 3 Seeds) |
| **MobileNetV2 (Từ số 0 — Seed 999)** | Pipeline mới sạch (2.601 ảnh) | 2.37 | 9.62 | 5.04 | 80.51% | 91.27% | 81.56% | 80.51% | **80.36%** | Có đủ 90 loài (Seeds 99, 123, 999) |
| **EfficientNetB0 (Từ số 0 — Seed 999)** | Pipeline mới sạch (2.601 ảnh) | 4.16 | 16.69 | 9.61 | 84.47% | 93.89% | 85.08% | 84.47% | **84.36%** | Có đủ 90 loài (classification_report.csv) |

## 3. So sánh chi tiết 39 loài cây có chỉ số < 60% (MobileNetV2 Mẫu vs MobileNetV2 Từ số 0 vs EfficientNetB0 Từ số 0)

| STT | Mã | Tên tiếng Việt | Train / Val / Test | MNV2 Mẫu P / R / F1 | MNV2 3-Seeds F1 | MNV2 Từ số 0 R / F1 (Δ F1) | EffB0 Từ số 0 R / F1 (Δ F1 vs Mẫu) | So sánh EffB0 vs MNV2 Mẫu | Hay nhầm nhất (MNV2 Mẫu) |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| 1 | 16 | Cây hạnh phúc | 169 / 21 / 22 | 43.8% / 31.8% / **36.8%** | 45.5% | 59.1% / 66.7% (+29.8%) | 54.5% / **64.9%** (+28.0%) | Cao hơn (+28.0%) | — |
| 2 | 84 | Si | 199 / 24 / 26 | 50.0% / 30.8% / **38.1%** | 37.8% | 64.5% / 62.5% (+24.4%) | 61.3% / **67.9%** (+29.8%) | Cao hơn (+29.8%) | Sanh bonsai (5/26 = 19.2%) |
| 3 | 46 | Cây sống đời | 116 / 14 / 16 | 55.6% / 31.2% / **40.0%** | 63.6% | 43.8% / 51.9% (+11.9%) | 87.5% / **90.3%** (+50.3%) | Cao hơn (+50.3%) | — |
| 4 | 38 | Trúc đốm | 176 / 22 / 23 | 50.0% / 39.1% / **43.9%** | 50.2% | 52.2% / 61.5% (+17.6%) | 73.9% / **73.9%** (+30.0%) | Cao hơn (+30.0%) | Kim ngân (3/23 = 13.0%) |
| 5 | 33 | Bàng Singapore | 202 / 25 / 26 | 43.3% / 50.0% / **46.4%** | 57.1% | 80.8% / 73.7% (+27.3%) | 69.2% / **69.2%** (+22.8%) | Cao hơn (+22.8%) | Đa búp đỏ (4/26 = 15.4%) |
| 6 | 85 | Thiên điểu trắng | 219 / 27 / 28 | 31.6% / 89.3% / **46.7%** | 51.9% | 85.7% / 76.2% (+29.5%) | 92.9% / **78.8%** (+32.1%) | Cao hơn (+32.1%) | — |
| 7 | 67 | Trầu bà đỏ | 218 / 27 / 28 | 38.6% / 60.7% / **47.2%** | 47.6% | 78.6% / 74.6% (+27.4%) | 85.7% / **85.7%** (+38.5%) | Cao hơn (+38.5%) | — |
| 8 | 73 | Trầu bà bạc | 175 / 21 / 23 | 64.3% / 39.1% / **48.6%** | 57.2% | 60.9% / 65.1% (+16.5%) | 73.9% / **82.9%** (+34.3%) | Cao hơn (+34.3%) | — |
| 9 | 50 | Kim ngân | 285 / 35 / 37 | 34.9% / 81.1% / **48.8%** | 59.7% | 86.5% / 74.4% (+25.6%) | 81.1% / **83.3%** (+34.6%) | Cao hơn (+34.6%) | — |
| 10 | 59 | Bạc hà | 217 / 27 / 28 | 64.7% / 39.3% / **48.9%** | 57.8% | 60.7% / 69.4% (+20.5%) | 71.4% / **75.5%** (+26.6%) | Cao hơn (+26.6%) | Hoa rum (3/28 = 10.7%) |
| 11 | 43 | Đỗ quyên | 216 / 27 / 27 | 61.1% / 40.7% / **48.9%** | 55.8% | 70.4% / 76.0% (+27.1%) | 70.4% / **71.7%** (+22.8%) | Cao hơn (+22.8%) | — |
| 12 | 17 | Ngân hậu Siam | 218 / 27 / 28 | 57.1% / 42.9% / **49.0%** | 63.3% | 57.1% / 58.2% (+9.2%) | 53.6% / **60.0%** (+11.0%) | Cao hơn (+11.0%) | Vạn niên thanh Dieffenbachia (3/28 = 10.7%) |
| 13 | 79 | Trầu bà lỗ | 222 / 27 / 29 | 50.0% / 48.3% / **49.1%** | 45.6% | 51.7% / 58.8% (+9.7%) | 51.7% / **60.0%** (+10.9%) | Cao hơn (+10.9%) | Trầu bà đuôi rồng (5/29 = 17.2%); Thiên điểu trắng (3/29 = 10.3%) |
| 14 | 77 | Dương xỉ sừng hươu | 198 / 24 / 26 | 54.5% / 46.2% / **50.0%** | 59.0% | 88.5% / 83.6% (+33.6%) | 96.2% / **86.2%** (+36.2%) | Cao hơn (+36.2%) | Thiên điểu trắng (4/26 = 15.4%) |
| 15 | 75 | Trúc bách hợp | 190 / 23 / 25 | 52.2% / 48.0% / **50.0%** | 41.9% | 71.0% / 72.1% (+22.1%) | 77.4% / **76.2%** (+26.2%) | Cao hơn (+26.2%) | Phất dụ mảnh (3/25 = 12.0%) |
| 16 | 35 | Cô tòng | 220 / 27 / 29 | 61.9% / 44.8% / **52.0%** | 60.3% | 62.1% / 70.6% (+18.6%) | 65.5% / **73.1%** (+21.1%) | Cao hơn (+21.1%) | — |
| 17 | 37 | Sanh bonsai | 200 / 25 / 26 | 51.9% / 53.8% / **52.8%** | 42.2% | 50.0% / 57.8% (+4.9%) | 57.7% / **61.2%** (+8.4%) | Cao hơn (+8.4%) | Thiên điểu trắng (3/26 = 11.5%) |
| 18 | 76 | Dây nhện | 215 / 26 / 28 | 60.9% / 50.0% / **54.9%** | 53.2% | 78.1% / 80.6% (+25.7%) | 68.8% / **75.9%** (+21.0%) | Cao hơn (+21.0%) | Trúc mây (3/28 = 10.7%); Trúc bách hợp (3/28 = 10.7%) |
| 19 | 24 | Thiết mộc lan | 198 / 24 / 26 | 61.9% / 50.0% / **55.3%** | 47.7% | 57.7% / 65.2% (+9.9%) | 61.5% / **69.6%** (+14.2%) | Cao hơn (+14.2%) | Tỏi rừng (5/26 = 19.2%) |
| 20 | 64 | Dương xỉ chân thỏ | 180 / 22 / 23 | 76.9% / 43.5% / **55.6%** | 59.0% | 73.9% / 82.9% (+27.4%) | 78.3% / **85.7%** (+30.2%) | Cao hơn (+30.2%) | — |
| 21 | 29 | Trầu bà đuôi rồng | 192 / 24 / 24 | 48.5% / 66.7% / **56.1%** | 54.1% | 79.2% / 67.9% (+11.7%) | 83.3% / **65.6%** (+9.4%) | Cao hơn (+9.4%) | Thiên điểu trắng (3/24 = 12.5%) |
| 22 | 90 | Cây ngựa vằn Aphelandra | 171 / 21 / 22 | 90.0% / 40.9% / **56.2%** | 69.4% | 68.2% / 78.9% (+22.7%) | 81.8% / **87.8%** (+31.6%) | Cao hơn (+31.6%) | — |
| 23 | 4 | Cau vàng | 150 / 18 / 20 | 75.0% / 45.0% / **56.2%** | 63.2% | 75.0% / 73.2% (+16.9%) | 80.0% / **84.2%** (+28.0%) | Cao hơn (+28.0%) | Cau tiểu trâm (7/20 = 35.0%) |
| 24 | 39 | Trầu bà cuống lông | 216 / 27 / 27 | 91.7% / 40.7% / **56.4%** | 55.7% | 81.5% / 84.6% (+28.2%) | 88.9% / **88.9%** (+32.5%) | Cao hơn (+32.5%) | — |
| 25 | 72 | Ngũ gia bì | 260 / 32 / 33 | 68.0% / 51.5% / **58.6%** | 65.4% | 81.8% / 74.0% (+15.4%) | 81.8% / **76.1%** (+17.4%) | Cao hơn (+17.4%) | Kim ngân (10/33 = 30.3%) |
| 26 | 7 | Trường sinh lá tròn | 216 / 27 / 28 | 54.5% / 64.3% / **59.0%** | 52.7% | 67.9% / 67.9% (+8.8%) | 78.6% / **73.3%** (+14.3%) | Cao hơn (+14.3%) | Đa búp đỏ (3/28 = 10.7%) |
| 27 | 80 | Trầu bà thanh xuân | 229 / 28 / 30 | 66.7% / 53.3% / **59.3%** | 67.2% | 70.0% / 76.4% (+17.1%) | 83.3% / **86.2%** (+26.9%) | Cao hơn (+26.9%) | Trúc mây (3/30 = 10.0%); Tùng la hán (3/30 = 10.0%) |
| 28 | 26 | Xương rồng bát tiên | 216 / 27 / 28 | 73.7% / 50.0% / **59.6%** | 64.6% | 75.0% / 75.0% (+15.4%) | 85.7% / **88.9%** (+29.3%) | Cao hơn (+29.3%) | Trầu bà đỏ (3/28 = 10.7%) |
| 29 | 86 | Tùng la hán | 207 / 25 / 27 | 65.2% / 55.6% / **60.0%** | 56.4% | 66.7% / 72.0% (+12.0%) | 74.1% / **81.6%** (+21.6%) | Cao hơn (+21.6%) | Trúc mây (3/27 = 11.1%) |
| 30 | 15 | Tỏi rừng | 228 / 28 / 29 | 51.2% / 72.4% / **60.0%** | 64.3% | 82.8% / 64.9% (+4.9%) | 79.3% / **75.4%** (+15.4%) | Cao hơn (+15.4%) | — |
| 31 | 5 | Trầu bà chân vịt | 199 / 24 / 26 | 65.2% / 57.7% / **61.2%** | 50.9% | 65.4% / 66.7% (+5.4%) | 73.1% / **70.4%** (+9.1%) | Cao hơn (+9.1%) | Trầu bà đỏ (5/26 = 19.2%) |
| 32 | 32 | Trúc mây | 196 / 24 / 26 | 50.0% / 80.8% / **61.8%** | 63.7% | 88.5% / 80.7% (+18.9%) | 84.6% / **78.6%** (+16.8%) | Cao hơn (+16.8%) | — |
| 33 | 70 | Đa búp đỏ | 232 / 29 / 30 | 46.7% / 93.3% / **62.2%** | 74.0% | 90.0% / 75.0% (+12.8%) | 83.3% / **76.9%** (+14.7%) | Cao hơn (+14.7%) | — |
| 34 | 36 | Ráy khổng lồ | 196 / 24 / 25 | 73.7% / 56.0% / **63.6%** | 61.4% | 60.0% / 69.8% (+6.1%) | 68.0% / **68.0%** (+4.4%) | Cao hơn (+4.4%) | Thiên điểu trắng (6/25 = 24.0%); Ráy thơm (3/25 = 12.0%) |
| 35 | 22 | Tía tô cảnh | 196 / 24 / 26 | 71.4% / 57.7% / **63.8%** | 70.8% | 61.5% / 74.4% (+10.6%) | 76.9% / **83.3%** (+19.5%) | Cao hơn (+19.5%) | — |
| 36 | 57 | Chuối mỏ két | 208 / 26 / 27 | 83.3% / 55.6% / **66.7%** | 72.2% | 77.8% / 82.4% (+15.7%) | 85.2% / **85.2%** (+18.5%) | Cao hơn (+18.5%) | Thiên điểu (5/27 = 18.5%) |
| 37 | 9 | Thiên điểu | 178 / 22 / 23 | 55.9% / 82.6% / **66.7%** | 73.4% | 87.0% / 85.1% (+18.4%) | 82.6% / **84.4%** (+17.8%) | Cao hơn (+17.8%) | — |
| 38 | 51 | Trầu bà lá xẻ Monstera | 435 / 54 / 55 | 55.3% / 85.5% / **67.1%** | 66.2% | 96.4% / 78.5% (+11.4%) | 98.2% / **84.4%** (+17.2%) | Cao hơn (+17.2%) | — |
| 39 | 23 | Kim ngân lượng | 174 / 21 / 23 | 86.7% / 56.5% / **68.4%** | 75.9% | 47.8% / 62.9% (-5.6%) | 69.6% / **80.0%** (+11.6%) | Cao hơn (+11.6%) | — |

### Các loài vẫn còn Recall < 60% ngay cả trên EfficientNetB0 Từ số 0

| Mã | Tên tiếng Việt | Tên tiếng Anh | Train / Val / Test | MNV2 Mẫu R / F1 | MNV2 Từ số 0 R / F1 | EffB0 Từ số 0 R / F1 |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| 79 | Trầu bà lỗ | Swiss Cheese Vine (Monstera adansonii) | 222 / 27 / 29 | 48.3% / 49.1% | 51.7% / 58.8% | 51.7% / 60.0% |
| 17 | Ngân hậu Siam | Chinese Evergreen Siam (Aglaonema commutatum) | 218 / 27 / 28 | 42.9% / 49.0% | 57.1% / 58.2% | 53.6% / 60.0% |
| 16 | Cây hạnh phúc | China Doll Plant (Radermachera sinica) | 169 / 21 / 22 | 31.8% / 36.8% | 59.1% / 66.7% | 54.5% / 64.9% |
| 37 | Sanh bonsai | Ginseng Ficus (Ficus microcarpa) | 200 / 25 / 26 | 53.8% / 52.8% | 50.0% / 57.8% | 57.7% / 61.2% |

## 4. Danh sách 17 loài cây có số lượng ảnh Train/Val/Test thấp nhất (Train < 180)

| STT | Mã | Tên tiếng Việt | Tên tiếng Anh | Train | Val | Test | Tổng ảnh | MNV2 Mẫu R / F1 | MNV2 Từ số 0 F1 | EffB0 Từ số 0 F1 |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | 87 | Cây Yucca | Yucca | 62 | 7 | 9 | **78** | 66.7% / 66.7% | 77.8% | 80.0% |
| 2 | 46 | Cây sống đời | Kalanchoe | 116 | 14 | 16 | **146** | 31.2% / 40.0% | 51.9% | 90.3% |
| 3 | 65 | Trường sinh giọt nước | Raindrop Peperomia (Peperomia polybotrya) | 142 | 17 | 19 | **178** | 68.4% / 70.3% | 81.1% | 78.8% |
| 4 | 4 | Cau vàng | Areca Palm (Dypsis lutescens) | 150 | 18 | 20 | **188** | 45.0% / 56.2% | 73.2% | 84.2% |
| 5 | 6 | Thiên môn đông cảnh | Asparagus Fern (Asparagus setaceus) | 156 | 19 | 21 | **196** | 76.2% / 78.0% | 91.3% | 93.3% |
| 6 | 11 | Môn nhung đen | Black Velvet Alocasia (Alocasia reginula) | 158 | 19 | 21 | **198** | 71.4% / 78.9% | 90.0% | 90.9% |
| 7 | 71 | Vạn tuế | Sago Palm (Cycas revoluta) | 160 | 20 | 20 | **200** | 100.0% / 95.2% | 90.5% | 88.9% |
| 8 | 68 | Đuôi công hồng | Rose-painted Calathea (Calathea roseopicta) | 164 | 20 | 22 | **206** | 68.2% / 75.0% | 81.0% | 81.0% |
| 9 | 16 | Cây hạnh phúc | China Doll Plant (Radermachera sinica) | 169 | 21 | 22 | **212** | 31.8% / 36.8% | 66.7% | 64.9% |
| 10 | 90 | Cây ngựa vằn Aphelandra | Zebra Plant (Aphelandra squarrosa) | 171 | 21 | 22 | **214** | 40.9% / 56.2% | 78.9% | 87.8% |
| 11 | 69 | Đuôi công lá tròn | Round-leaf Calathea (Calathea orbifolia) | 171 | 21 | 22 | **214** | 90.9% / 90.9% | 92.7% | 95.5% |
| 12 | 23 | Kim ngân lượng | Coralberry (Ardisia crenata) | 174 | 21 | 23 | **218** | 56.5% / 68.4% | 62.9% | 80.0% |
| 13 | 73 | Trầu bà bạc | Silver Pothos (Scindapsus pictus) | 175 | 21 | 23 | **219** | 39.1% / 48.6% | 65.1% | 82.9% |
| 14 | 62 | Cây chân voi | Ponytail Palm (Beaucarnea recurvata) | 175 | 21 | 23 | **219** | 95.7% / 89.8% | 93.9% | 93.6% |
| 15 | 12 | Dứa cảnh Neoregelia | Blushing Bromeliad (Neoregelia carolinae) | 176 | 22 | 22 | **220** | 86.4% / 80.9% | 80.0% | 85.7% |
| 16 | 38 | Trúc đốm | Gold Dust Dracaena (Dracaena surculosa) | 176 | 22 | 23 | **221** | 39.1% / 43.9% | 61.5% | 73.9% |
| 17 | 9 | Thiên điểu | Bird of Paradise (Strelitzia reginae) | 178 | 22 | 23 | **223** | 82.6% / 66.7% | 85.1% | 84.4% |

## 5. Đề xuất hành động

1. **Ưu tiên cao nhất cho thu thập ảnh thực tế:** Nhóm vừa ít dữ liệu vừa có độ chính xác thấp gồm **Cây sống đời** (146 ảnh, F1 40,0%), **Cây Yucca** (78 ảnh — ít ảnh nhất hệ thống), **Cau vàng** (188 ảnh, F1 56,3%), **Cây hạnh phúc** (212 ảnh, F1 36,8%), **Trầu bà bạc** (219 ảnh, F1 48,6%), **Trúc đốm** (221 ảnh, F1 43,9%), **Cây ngựa vằn Aphelandra** (214 ảnh, F1 56,3%).
2. **Xử lý nhóm nhầm lẫn hình thái mạnh (khó trên cả MobileNetV2 & EfficientNetB0):** **Ngân hậu Siam**, **Trầu bà lỗ**, **Sanh bonsai**, **Si**, **Trầu bà đuôi rồng**, **Ráy khổng lồ** — cần chụp thêm ảnh cận cảnh gân lá, cuống lá và mặt sau lá dưới nhiều điều kiện ánh sáng.
3. **Chiến lược mô hình triển khai:** **EfficientNetB0 Từ số 0** (Top-1 84,47%, Top-3 93,89%, 0 loài F1 < 60%, độ trễ 9,61 ms, 16,69 MB) vượt trội rõ rệt trên nhóm loài khó (+22,69% F1 trung bình so với MobileNetV2 Mẫu và +5,62% so với MobileNetV2 Từ số 0), rất phù hợp làm mô hình chính hoặc mô hình đối chiếu trên server AI.
