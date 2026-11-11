# Đề tài niên luận: Hệ thống nhận diện cây kiểng lá (Web + Android)

> Định hướng: phát triển tiếp lên **luận văn tốt nghiệp** sau này → thiết kế có tính mở rộng ngay từ đầu.

---

## 1. Tên đề tài

**Xây dựng hệ thống nhận diện và quản lý cây kiểng lá ứng dụng Machine Learning trên nền tảng Web và Android**

## 2. Ý tưởng tổng quan

- Cả **Web** và **Android** đều cho phép người dùng upload/chụp ảnh lá cây → AI nhận diện loài → hiển thị thông tin.
- Web không chỉ là trang quản trị (Admin) mà còn phục vụ **người dùng thường** (upload ảnh từ máy tính, xem lịch sử).
- Android phục vụ nhận diện di động (chụp ảnh trực tiếp).
- Cả 2 nền tảng dùng **chung 1 backend/API** — thể hiện kiến trúc đa nền tảng thực sự.
- Có thể gắn dữ liệu thật từ kênh bán kiểng lá cá nhân (trúc đốm, ổi lê, vườn Sáu Niêm/Bé Bảy) để tăng tính thực tiễn khi bảo vệ.

## 3. Actor & vai trò

| Actor | Nền tảng | Ghi chú |
|---|---|---|
| Admin | Web | Quản lý dữ liệu loài cây, người dùng, mô hình AI, thống kê |
| Người dùng | Web + Android | Upload/chụp ảnh, nhận diện, xem lịch sử, đánh giá kết quả |
| (Tương lai – luận văn) Chủ vườn | Web | Đăng bán cây, quản lý đơn hàng |

## 4. Kiến trúc & công nghệ đề xuất

| Thành phần | Công nghệ | Ghi chú |
|---|---|---|
| Backend API | NestJS hoặc Spring Boot | Dùng chung cho Web & Android |
| CSDL | PostgreSQL/MySQL | |
| Web frontend | ReactJS | |
| Android | Kotlin + Jetpack Compose | Đã có kinh nghiệm (Room, Retrofit) |
| AI nhận diện ảnh | Service riêng: Python FastAPI + TensorFlow/PyTorch (transfer learning MobileNetV2) | Tách riêng khỏi backend chính để dễ retrain/nâng cấp sau này |
| Lưu trữ ảnh | Firebase Storage / AWS S3 | |

**Nguyên tắc kiến trúc:** tách AI service độc lập, backend chính chỉ gọi API sang AI service — không nhúng model trực tiếp, để luận văn dễ mở rộng (đổi model, thêm pipeline retrain) mà không đụng code Web/Android.

## 5. Thiết kế CSDL (CDM) — CHỐT BẢN CUỐI (12 bảng)

### 5.1. Danh sách thực thể

1. **NGUOI_DUNG**: `id` (PK), `ten_dang_nhap`, `mat_khau` (hash), `ho_ten`, `email` (unique), `vai_tro` (enum: admin / user / chu_vuon), `ngay_tao`
2. **DANH_MUC**: `id` (PK), `ten_danh_muc`, `mo_ta`
3. **LOAI_CAY**: `id` (PK), `danh_muc_id` (FK → DANH_MUC), `ten_khoa_hoc`, `ten_thuong_goi`, `xuat_xu`, `mo_ta_chi_tiet`, `cach_cham_soc`, `gia_tri_thi_truong_uoc_tinh`
4. **ANH_MAU_TRAIN**: `id` (PK), `loai_cay_id` (FK → LOAI_CAY), `duong_dan_anh`, `goc_chup`, `nguoi_dong_gop_id` (FK → NGUOI_DUNG)
5. **LICH_SU_NHAN_DIEN**: `id` (PK), `nguoi_dung_id` (FK → NGUOI_DUNG), `anh_upload_url`, `loai_cay_du_doan_id` (FK → LOAI_CAY), `do_chinh_xac` (float 0-1), `nguon` (enum: web / android), `thoi_gian_tao`
6. **KET_QUA_DU_DOAN_CHI_TIET**: `id` (PK), `nhan_dien_id` (FK → LICH_SU_NHAN_DIEN), `loai_cay_id` (FK → LOAI_CAY), `xac_suat` (float 0-1) *(Chuẩn 1NF cho top-k dự đoán)*
7. **PHAN_HOI_NHAN_DIEN**: `id` (PK), `lich_su_id` (FK → LICH_SU_NHAN_DIEN), `loai_cay_thuc_te_id` (FK → LOAI_CAY), `is_correct` (boolean), `ghi_chu`, `trang_thai_xu_ly` (enum: chua_xu_ly / da_dua_vao_train)
8. **BENH_HAI**: `id` (PK), `ten_benh`, `tac_nhan`, `bieu_hien`, `cach_dieu_tri`
9. **LICH_SU_SOI_BENH**: `id` (PK), `nguoi_dung_id` (FK → NGUOI_DUNG), `anh_la_benh_url`, `benh_hai_id` (FK → BENH_HAI), `do_chinh_xac` (float 0-1)
10. **VUON_CAY**: `id` (PK), `chu_vuon_id` (FK → NGUOI_DUNG), `ten_vuon`, `dia_chi`, `so_dien_thoai`
11. **BAI_DANG_BAN**: `id` (PK), `vuon_cay_id` (FK → VUON_CAY), `loai_cay_id` (FK → LOAI_CAY), `tieu_de`, `gia_ban`, `tinh_trang_la`, `hinh_anh`, `trang_thai` (enum: dang_ban / da_ban)
12. **CAY_CUA_TOI**: `id` (PK), `nguoi_dung_id` (FK → NGUOI_DUNG), `loai_cay_id` (FK → LOAI_CAY), `ten_rieng_cua_cay`, `ngay_trong`, `nhat_ky_trang_thai`

### 5.2. Quan hệ chính
- `DANH_MUC` (1) ── (n) `LOAI_CAY` (chứa)
- `LOAI_CAY` (1) ── (n) `ANH_MAU_TRAIN` (có dữ liệu train)
- `NGUOI_DUNG` (1) ── (n) `ANH_MAU_TRAIN` (đóng góp)
- `NGUOI_DUNG` (1) ── (n) `LICH_SU_NHAN_DIEN` (thực hiện)
- `LOAI_CAY` (1) ── (n) `LICH_SU_NHAN_DIEN` (được dự đoán)
- `LICH_SU_NHAN_DIEN` (1) ── (n) `KET_QUA_DU_DOAN_CHI_TIET` (có top-k kết quả)
- `LOAI_CAY` (1) ── (n) `KET_QUA_DU_DOAN_CHI_TIET` (xuất hiện trong dự đoán)
- `LICH_SU_NHAN_DIEN` (1) ── (1) `PHAN_HOI_NHAN_DIEN` (có feedback)
- `LOAI_CAY` (1) ── (n) `PHAN_HOI_NHAN_DIEN` (xác nhận đúng loài)
- `BENH_HAI` (1) ── (n) `LICH_SU_SOI_BENH` (chẩn đoán)
- `NGUOI_DUNG` (1) ── (n) `LICH_SU_SOI_BENH` (chụp soi bệnh)
- `NGUOI_DUNG` (1) ── (n) `VUON_CAY` (quản lý vườn, chỉ role `chu_vuon`)
- `VUON_CAY` (1) ── (n) `BAI_DANG_BAN` (đăng bán)
- `LOAI_CAY` (1) ── (n) `BAI_DANG_BAN` (thuộc loại)
- `NGUOI_DUNG` (1) ── (n) `CAY_CUA_TOI` (sở hữu)
- `LOAI_CAY` (1) ── (n) `CAY_CUA_TOI` (thuộc loại)

### 5.3. Ràng buộc nghiệp vụ & Công cụ
- **Công cụ**: PowerDesigner (File gốc `.pdm`).
- **Ràng buộc**:
  1. Chỉ `NGUOI_DUNG.vai_tro = 'chu_vuon'` mới được tạo `VUON_CAY`.
  2. `PHAN_HOI_NHAN_DIEN.loai_cay_thuc_te_id` bắt buộc khi `is_correct = false`, để trống khi `true`.
  3. `do_chinh_xac` & `xac_suat` thống nhất kiểu `float` (0–1).
  4. Duyệt ảnh feedback thủ công cho Niên luận (chuyển sang `ANH_MAU_TRAIN` khi `trang_thai_xu_ly = 'da_dua_vao_train'`).

### 5.4. Lộ trình cài đặt CSDL
- **Pha 1 (Bắt buộc Niên luận)**: `NGUOI_DUNG`, `DANH_MUC`, `LOAI_CAY`, `ANH_MAU_TRAIN`, `LICH_SU_NHAN_DIEN`, `KET_QUA_DU_DOAN_CHI_TIET`, `PHAN_HOI_NHAN_DIEN`.
- **Pha 2 (Luận văn - Chẩn đoán)**: `BENH_HAI`, `LICH_SU_SOI_BENH`.
- **Pha 3 (Luận văn - Thương mại & Quản lý)**: `VUON_CAY`, `BAI_DANG_BAN`, `CAY_CUA_TOI`.

## 6. Use Case chính

### Nhóm Admin (Web)
- Đăng nhập/phân quyền
- Quản lý loài cây (thêm/sửa/xóa, ảnh mẫu)
- Quản lý người dùng
- Xem thống kê lượt nhận diện, loài phổ biến
- *(Luận văn)* Quản lý mô hình AI — niên luận: upload model thủ công; luận văn: pipeline retrain tự động

### Nhóm Người dùng (Web + Android — dùng chung UC, khác actor thực thi)
- Đăng ký/đăng nhập
- Upload ảnh (Web) / Chụp ảnh (Android) → gọi chung 1 API `/nhan-dien`
- Xem kết quả nhận diện (tên loài, % chính xác, thông tin chi tiết)
- Xem lịch sử nhận diện
- **Đánh giá kết quả nhận diện** (đúng/sai) — niên luận làm đơn giản, luận văn phát triển thành active learning

### Công cụ vẽ UC/Class/Sequence Diagram
**StarUML** hoặc **Visual Paradigm** — lưu dạng project file (không chỉ export ảnh) để luận văn mở rộng actor/UC dễ dàng, không phải vẽ lại từ đầu.

### Công cụ khác
- **Figma**: wireframe/UI cho Web + Android
- **draw.io**: sơ đồ kiến trúc hệ thống, luồng dữ liệu (nhanh, dễ chèn Word)

## 7. Ghi chú thiết kế cho tương lai (luận văn)

1. Tách AI thành service riêng ngay từ niên luận — không nhúng vào backend chính.
2. CDM chừa sẵn cột/bảng mở rộng (feedback, chủ vườn, đơn hàng) dù niên luận chưa dùng hết.
3. UC "Đánh giá kết quả nhận diện" là hook quan trọng nhất — nền tảng cho chương AI nâng cao ở luận văn.
4. Lưu file gốc PowerDesigner (.pdm) và StarUML/Visual Paradigm (project file), không chỉ ảnh export.
5. API endpoint dùng chung cho Web & Android — không viết 2 API riêng cho cùng chức năng.

---
*File này để tiện nhắc lại ngữ cảnh đề tài trong các buổi làm việc sau.*
