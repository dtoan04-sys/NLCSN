# 📚 Thư Mục Bài Báo Khoa Học Tham Khảo (FloraBotanic AI)

Thư mục này chứa toàn bộ **6 bài báo khoa học gốc (bản PDF đầy đủ)** làm nền tảng lý thuyết, kiến trúc mô hình và thuật toán hiệu chỉnh xác suất cho hệ thống nhận diện 90 loài kiểng lá.

## Danh sách file PDF đã tải về:

1. **`01_MobileNetV2_CVPR2018_Sandler.pdf`**  
   * **Tên bài báo:** *MobileNetV2: Inverted Residuals and Linear Bottlenecks* (IEEE CVPR 2018)  
   * **Nội dung cần đọc:** Phần *Inverted Residuals* và *Linear Bottlenecks* (Section 3) giải thích vì sao mô hình chỉ nặng **9.05 MB (2.37M tham số)** nhưng chạy cực nhanh trên web/mobile.

2. **`02_PlantVillage_Hughes_Salathe_2015.pdf`**  
   * **Tên bài báo:** *An open access repository of images on plant health to enable the development of mobile disease diagnostics* (arXiv:1511.08060)  
   * **Nội dung cần đọc:** Quy chuẩn thu thập dữ liệu lá cây, chụp cận cảnh, phân chia dữ liệu và chống trùng lặp mẫu.

3. **`03_ResNet_CVPR2016_He.pdf`**  
   * **Tên bài báo:** *Deep Residual Learning for Image Recognition* (IEEE CVPR 2016)  
   * **Nội dung cần đọc:** Cơ sở kiến trúc **ResNet50** dùng để chạy so sánh đối chứng trong thí nghiệm Benchmark (23.77M tham số, ~98.4 MB).

4. **`04_EfficientNet_ICML2019_Tan_Le.pdf`**  
   * **Tên bài báo:** *EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks* (ICML 2019)  
   * **Nội dung cần đọc:** Cơ sở kiến trúc **EfficientNetB0** dùng để so sánh đối chứng (4.16M tham số, ~16.8 MB) và kết hợp Soft-Voting Ensemble trong `main.py`.

5. **`05_Temperature_Scaling_ICML2017_Guo.pdf`**  
   * **Tên bài báo:** *On Calibration of Modern Neural Networks* (ICML 2017)  
   * **Nội dung cần đọc:** Thuật toán **Temperature Scaling** (chia logits cho nhiệt độ $T$) đang được áp dụng trực tiếp trong hàm suy luận của `ai-service/main.py` để chuẩn hóa độ tin cậy sau khi gộp TTA.

6. **`06_Logit_Adjustment_ICLR2021_Menon.pdf`**  
   * **Tên bài báo:** *Long-Tail Learning via Logit Adjustment* (ICLR 2021)  
   * **Nội dung cần đọc:** Thuật toán hiệu chỉnh phân phối mất cân bằng lớp (**Prior Calibration**) đang được áp dụng trong `ai-service/main.py` để các loài cây ít ảnh không bị lép vế trước các loài nhiều ảnh.
