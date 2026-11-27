# 🌿 FloraBotanic — Hệ Thống Nhận Diện & Thương Mại Cây Kiểng Lá (AI Vision E-Commerce)

Đề tài Niên luận Ngành Hệ thống Thông tin (NLCNHTTT)  
Phát triển ứng dụng Web & Mobile tích hợp Trí tuệ Nhân tạo Deep Learning nhận diện 90 loài cây kiểng lá nhiệt đới (+ Lớp #91 Ngoài phân phối / OOD).

---

## 📌 1. Giới thiệu Đề tài
- **Tên đề tài:** Hệ thống nhận diện 90 loài cây lá cảnh phục vụ quản lý & chăm sóc (*FloraBotanic AI*).
- **Mô hình kiến trúc:** Single-Store E-Commerce (Mô hình cửa hàng bán trực tiếp kết hợp AI Vision).
- **Dữ liệu huấn luyện (Bộ 'Từ số 0' / Phiên bản 2 chuẩn hóa):** **25.225 ảnh độc bản** sau khi làm sạch và lọc trùng lặp bằng Perceptual Hashing (pHash) và MD5.
- **Phân chia tập dữ liệu:** `80% Train` – `10% Validation` – `10% Test` độc lập.
- **Mô hình AI cốt lõi & bổ trợ:**
  - **MobileNetV2** (9,62 MB, fine-tune 50 tầng cuối): đạt **80,86 ± 0,31%** Top-1 qua 3 seeds (`99`, `123`, `999`) trên bộ 25.225 ảnh độc bản.
  - **EfficientNetB0**: đạt **84,47% Top-1** và **93,89% Top-3** tại seed `999`.
- **Suy luận & Ngưỡng OOD:**
  - **8-Crop Foliage ROI TTA** kết hợp **Soft-Voting Ensemble 4 model** (`0,34 EfficientNetB0 + 3×0,22 MobileNetV2`).
  - **Ngưỡng phát hiện ngoài phân phối (OOD — Lớp #91):** `conf < 0,55` hoặc `entropy > 0,55` (với Temperature Scaling `temp = 0,15`).

---

## 🚀 2. Kiến trúc Công nghệ (Multi-tier Architecture)
1. **Frontend (Giao diện người dùng):**
   - Web: React 19 + Tailwind CSS + Lucide Icons + Vite.
   - Mobile: Capacitor Android (Hỗ trợ Camera AI, điều hướng phím cứng Back, tối ưu hóa bộ nhớ ảnh).
2. **Backend (Xử lý nghiệp vụ):**
   - FastAPI (Python), RESTful API, Uvicorn ASGI Server.
3. **AI Vision Service (Dịch vụ trí tuệ nhân tạo):**
   - Suy luận đa mô hình **Soft-Voting Ensemble 4 model** (`0,34 EfficientNetB0 + 3×0,22 MobileNetV2`) kết hợp **8-Crop Foliage ROI TTA** và bộ lọc **OOD Lớp #91** (`conf < 0,55` hoặc `entropy > 0,55`).
4. **Cơ sở dữ liệu:**
   - **15 bảng chuẩn PDM** (thiết kế PowerDesigner / SQL Server) và **16 bảng ở tầng SQLite runtime** (bổ sung bảng lịch sử/phiên và 5 thuộc tính mở rộng của `LOAI_CAY` ở tầng ứng dụng).

---

## 📂 3. Cấu trúc Thư mục Dự án

```text
NLCNHTTT/
├── 00_Tai_Lieu_Bao_Cao/          # Báo cáo đánh giá mô hình, ma trận nhầm lẫn 90x90, tài liệu tham khảo
├── 01_Thiet_Ke_CSDL_PowerDesigner/# File thiết kế CDM / PDM chuẩn PowerDesigner (15 bảng PDM)
├── 02_CSDL_SQLServer/            # Script tạo CSDL 15 bảng chuẩn PDM và dữ liệu mẫu 90 loài cây
├── 03_Ung_Dung_Android_APK/      # File cài đặt ứng dụng Android (.apk)
├── 04_Cong_Cu_Ho_Tro/            # Tiện ích bổ trợ (Cloudflare Tunnel)
├── 06_Mo_Hinh_AI_Colab_Moi/      # Notebooks huấn luyện Google Colab GPU T4
├── MAU BAO CAO/                  # Tài liệu báo cáo Niên luận (.docx)
├── frontend-kieng-la/            # Mã nguồn Web React & Capacitor Android
├── ai-service/                   # Mã nguồn Backend FastAPI, SQLite runtime (16 bảng) & Trọng số Ensemble (MobileNetV2 + EfficientNetB0)
├── CHAY_TOAN_BO_DO_AN.bat        # Script khởi động tự động toàn bộ hệ thống
└── README.md
```

---

## ⚡ 4. Hướng dẫn Khởi động Nhanh

### Bước 1: Khởi động hệ thống
Chạy file script tự động:
```bat
CHAY_TOAN_BO_DO_AN.bat
```
Hệ thống sẽ tự động kích hoạt:
- Backend AI Service: `http://localhost:8000`
- Swagger API Docs: `http://localhost:8000/docs`
- Web Frontend: `http://localhost:5173`

---
© 2026 FloraBotanic AI Team — Niên luận Ngành Hệ thống Thông tin.
