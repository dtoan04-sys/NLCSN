# Tóm tắt quá trình thực hiện đề tài niên luận
## Hệ thống nhận diện cây kiểng lá (Web + Android)

---

## 1. Đề tài & định hướng

- **Tên đề tài**: Xây dựng hệ thống nhận diện và quản lý cây kiểng lá ứng dụng Machine Learning trên nền tảng Web và Android
- **Quyết định quan trọng**: Cả Web và Android đều có chức năng nhận diện cho người dùng (không chỉ Web-admin), dùng chung 1 backend/API
- **Định hướng dài hạn**: Phát triển tiếp đề tài này lên **luận văn tốt nghiệp** nếu niên luận suôn sẻ — nên thiết kế có tính mở rộng ngay từ đầu
- **Quyết định phạm vi**: Giữ nguyên CDM đầy đủ (không cắt bớt module), gồm 4 mảng nghiệp vụ: nhận diện loài, chẩn đoán bệnh hại, marketplace/vườn cây, vườn cá nhân

## 2. Kiến trúc hệ thống

| Thành phần | Công nghệ |
|---|---|
| Backend API | NestJS |
| CSDL | PostgreSQL/MySQL |
| Web frontend | ReactJS |
| Android | Kotlin + Jetpack Compose |
| AI service (tách riêng) | Python FastAPI + TensorFlow/Keras |
| Lưu trữ ảnh | Firebase Storage / AWS S3 |

*Nguyên tắc*: AI service tách biệt hoàn toàn khỏi Backend chính, giao tiếp qua HTTP API — dễ nâng cấp/retrain model độc lập.

## 3. CDM — đã chốt (12 thực thể)

File chi tiết: `cdm-final-nhan-dien-kieng-la.md` / `NhanDienCay.cdm`

- **Pha 1 (bắt buộc)**: `NGUOI_DUNG`, `DANH_MUC`, `LOAI_CAY`, `ANH_MAU_TRAIN`, `LICH_SU_NHAN_DIEN`, `KET_QUA_DU_DOAN_CHI_TIET`, `PHAN_HOI_NHAN_DIEN`
- **Pha 2**: `BENH_HAI`, `LICH_SU_SOI_BENH`
- **Pha 3**: `VUON_CAY`, `BAI_DANG_BAN`, `CAY_CUA_TOI`
- Kiểu dữ liệu đã quy đổi chuẩn PowerDesigner (Variable characters, Text, Serial, Float, Date & time...)
- Bảng `KET_QUA_DU_DOAN_CHI_TIET` được thêm mới để chuẩn hóa top-k kết quả dự đoán (thay vì lưu JSON string)

## 4. Công cụ thiết kế đã thống nhất

| Việc | Công cụ |
|---|---|
| CDM/PDM | PowerDesigner |
| UC/Class/Sequence Diagram | StarUML hoặc Visual Paradigm |
| Wireframe/UI | Figma |
| Sơ đồ kiến trúc/luồng dữ liệu | draw.io |

## 5. Dataset huấn luyện AI

- **Nguồn**: Dataset công khai **House Plant Species** trên Kaggle (tác giả kacpergregorowicz) — 47 loài, 14.790 ảnh, license **CC-BY-NC-SA-4.0** (phi thương mại, cần ghi nguồn — phù hợp niên luận)
- **Quyết định**: Giữ nguyên toàn bộ 47 loài, không lọc riêng 5 loài ban đầu dự định
- Tải qua Kaggle API token trực tiếp trong Colab, giải nén vào `/content/house_plants/house_plant_species/`

### Kết quả kiểm tra chất lượng dữ liệu (theo yêu cầu của GVHD)
- Ảnh trùng tuyệt đối (MD5): **0 ảnh**
- Ảnh lỗi/hỏng: **0 ảnh**
- Ảnh gần giống nhau (perceptual hash): **60/14.790 ảnh (~0.4%)** — không đáng lo
- **Vấn đề chính phát hiện được: mất cân bằng dữ liệu giữa các loài** — Yucca chỉ 66 ảnh, Monstera Deliciosa 547 ảnh (chênh lệch ~8.3 lần)
- Hướng xử lý đã thống nhất: Dùng `class_weight='balanced'` khi train (ưu tiên) thay vì tìm thêm dữ liệu

## 6. Quá trình train model

- Kiến trúc: Transfer Learning với **MobileNetV2** (pretrained ImageNet)
- 2 giai đoạn: (1) freeze toàn bộ base model, chỉ train lớp phân loại mới; (2) fine-tune 30 lớp cuối với learning rate nhỏ
- Notebook Colab đầy đủ đã cung cấp: `train_kiengla_model.ipynb`
- **Sự cố gặp phải**: Chạy nhầm bằng CPU thay vì GPU (mất ~3h30 cho 15 epoch) — đã xác định nguyên nhân và hướng dẫn đổi sang GPU T4
- Model đã train xong 2 giai đoạn, lưu trên Google Drive (`MyDrive/kiengla/model/`)

## 7. AI Service (FastAPI)

- Code đầy đủ: `main.py`, `requirements.txt`, `README.md` (đã cung cấp tại `e:\dowload\ai-service`)
- Endpoint chính: `POST /nhan-dien` — nhận ảnh, trả về JSON (loài dự đoán, độ chính xác, top-3)

### Sự cố kỹ thuật đã xử lý
- Lỗi tương thích phiên bản Keras giữa Colab (3.13.2) và máy local (Python 3.10, tối đa Keras 3.12.4) khi load model `.h5`/`.keras` nguyên khối
- **Giải pháp**: Tách lưu **weights riêng** (`model.save_weights()`) thay vì lưu nguyên model, rồi dựng lại kiến trúc bằng code + `model.load_weights()` — tránh phụ thuộc vào serialization giữa các phiên bản Keras
- Kết quả: AI service chạy thành công trên `http://localhost:8000`

## 8. Giao diện test

- Đã tạo `test-ui.html` — giao diện kéo-thả ảnh, preview, hiển thị kết quả đẹp (thanh % độ chính xác, top-3 loài)
- Chỉ dùng để test local trong giai đoạn phát triển, không phải Web chính thức của đề tài
- Có thể dùng làm bằng chứng kiểm thử trong báo cáo (chụp màn hình)

## 9. Cấu trúc thư mục dự án

File chi tiết: `cau-truc-thu-muc-du-an.md` — gồm `ai-service/`, `backend/`, `web/`, `android/`, `design/`, `docs/`

## 10. Việc cần làm tiếp theo

- [ ] Áp dụng `class_weight` và train lại model, so sánh accuracy theo từng loài
- [ ] Viết Backend NestJS (kết nối CSDL theo CDM, gọi sang AI service)
- [ ] Xây Web (ReactJS) và Android gọi chung API từ Backend
- [ ] Dựng CDM trong PowerDesigner, vẽ UC diagram trong StarUML/Visual Paradigm
- [ ] Bổ sung ảnh Trúc đốm (và các loài đặc trưng VN khác nếu muốn) vào dataset
- [ ] Viết phần báo cáo "Tiền xử lý & kiểm tra chất lượng dữ liệu" dựa trên kết quả audit đã có
