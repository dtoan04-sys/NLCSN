# BÁO CÁO KẾT QUẢ ĐÁNH GIÁ MÔ HÌNH NHẬN DIỆN CÂY KIỂNG LÁ (TỶ LỆ 80% - 10% - 10%)

## I. TỔNG QUAN PHÂN CHIA BỘ DỮ LIỆU
Bộ dữ liệu gồm 90 loài cây kiểng lá được chuẩn hóa, loại bỏ ảnh trùng lặp và phân chia ngẫu nhiên có kiểm soát (`seed=42`) thành 3 tập dữ liệu độc lập hoàn toàn theo đúng tỷ lệ đề ra:

| Tập dữ liệu | Số lượng ảnh | Tỷ lệ phần trăm | Mục đích sử dụng |
| :--- | :---: | :---: | :--- |
| **Train (Huấn luyện)** | **19.057 ảnh** | **79.90% (~80%)** | Dùng để huấn luyện trọng số mô hình MobileNetV2 qua 2 giai đoạn |
| **Validation (Kiểm định)** | **2.388 ảnh** | **10.01% (~10%)** | Đánh giá sai số cuối mỗi epoch, điều khiển Early Stopping chống overfitting |
| **Test (Kiểm thử độc lập)**| **2.405 ảnh** | **10.08% (~10%)** | Đánh giá khách quan năng lực tổng quát hóa của mô hình |
| **Tổng cộng** | **23.850 ảnh** | **100%** | **Đầy đủ 90 loài cây kiểng lá** |

---

## II. KẾT QUẢ ĐÁNH GIÁ HỌC THUẬT TRÊN TẬP TEST ĐỘC LẬP (2.405 ẢNH)

* **Tổng số ảnh Test đưa vào kiểm thử:** **2.405 ảnh**
* **Số ảnh dự đoán ĐÚNG (True Positive):** **1.774 / 2.405 ảnh**
* **Số ảnh dự đoán SAI (Confused):** **631 / 2.405 ảnh**
* **Độ chính xác Top-1 (Test Accuracy):** **`73.76%`**
* **Độ chính xác Top-3 (Top-3 Accuracy):** **`88.11%`**
* **Macro Precision:** **`75.37%`** (Weighted Precision: **`76.70%`**)
* **Macro Recall:** **`71.97%`** (Weighted Recall: **`73.76%`**)
* **Macro F1-Score:** **`72.04%`** (Weighted F1-Score: **`73.76%`**)

---

## III. BẢNG SO SÁNH VỚI MÔ HÌNH CŨ (TỶ LỆ 70-15-15)

| Tiêu chí | Mô hình Cũ (70-15-15) | Mô hình MỚI (80-10-10) | Mức cải thiện |
| :--- | :---: | :---: | :---: |
| **Tỷ lệ phân chia** | 70% - 15% - 15% | **80% - 10% - 10%** | **Khớp yêu cầu GVHD** |
| **Test Accuracy (Top-1)** | 70.29% | **73.76%** | **+3.47%** |
| **Top-3 Accuracy** | 85.79% | **88.11%** | **+2.32%** |
| **Macro Precision** | 71.99% | **75.37%** | **+3.38%** |
| **Macro Recall** | 67.71% | **71.97%** | **+4.26%** |
| **Macro F1-Score** | 68.33% | **72.04%** | **+3.71%** |
| **Weighted F1-Score** | 69.92% | **73.76%** | **+3.84%** |

---

## IV. PHÂN TÍCH NGUYÊN NHÂN NHẦM LẪN (ERROR ANALYSIS)
Dựa trên Ma trận nhầm lẫn (Confusion Matrix), các trường hợp nhận diện sai tập trung vào 2 nhóm nguyên nhân có cơ sở sinh học rõ ràng:
1. **Các loài cùng Chi thực vật (Same Genus) có hình thái lá tương đồng cao:**
   * *Sanh bonsai $\rightarrow$ Si:* Cùng chi *Ficus*, cùng có lá nhỏ elip xanh bóng và thân gỗ rễ phụ.
   * *Chuối mỏ két $\rightarrow$ Thiên điểu:* Hoa hình mỏ chim màu cam-đỏ và dạng lá chuối tương đồng.
   * *Ráy khổng lồ $\rightarrow$ Ráy thơm:* Cùng chi *Alocasia*, phiến lá tim bản rộng.
   * *Cau vàng $\rightarrow$ Cau tiểu trâm:* Cùng họ Cau (*Arecaceae*), tán lá kép lông chim.
   * *Trúc bách hợp $\rightarrow$ Thiết mộc lan:* Cùng chi *Dracaena*.
2. **Cấu trúc thảm lá li ti khi chụp xa:**
   * *Cây nước mắt em bé $\rightarrow$ Vảy ốc:* Lá tròn li ti chỉ 2-4mm bò lan thành thảm phủ kín mặt chậu.
