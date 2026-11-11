# 🌿 FloraBotanic — Hệ Thống Nhận Diện & Thương Mại Cây Kiểng Lá (AI Vision E-Commerce)

Đề tài Niên luận Cơ sở ngành Hệ thống Thông tin (NLCNHTTT)  
Phát triển ứng dụng Web & Mobile tích hợp Trí tuệ Nhân tạo Deep Learning nhận diện 90 loài cây kiểng lá nhiệt đới.

---

## 📌 1. Giới thiệu Đề tài
- **Tên đề tài:** Hệ thống nhận diện 90 loài cây lá cảnh phục vụ quản lý & chăm sóc (*FloraBotanic AI*).
- **Mô hình kiến trúc:** Single-Store E-Commerce (Mô hình cửa hàng bán trực tiếp kết hợp AI Vision).
- **Dữ liệu huấn luyện:** 23.850 ảnh chất lượng cao sau khi lọc trùng lặp bằng Perceptual Hashing (pHash) và MD5.
- **Phân chia tập dữ liệu:** `80% Train` (19.080 ảnh) – `10% Validation` (2.365 ảnh) – `10% Test` (2.405 ảnh) độc lập.
- **Mô hình AI cốt lõi:** MobileNetV2 (Transfer Learning từ ImageNet + Fine-tuning 30 lớp đặc trưng).
- **Độ chính xác thực nghiệm:** **73.76% Top-1** và **88.11% Top-3** trên tập Test 2.405 ảnh độc lập.

---

## 🚀 2. Kiến trúc Công nghệ (Multi-tier Architecture)
1. **Frontend (Giao diện người dùng):**
   - Web: React 19 + Tailwind CSS + Lucide Icons + Vite.
   - Mobile: Capacitor Android (Hỗ trợ Camera AI, điều hướng phím cứng Back, tối ưu hóa bộ nhớ ảnh).
2. **Backend (Xử lý nghiệp vụ):**
   - FastAPI (Python), RESTful API, Uvicorn ASGI Server.
3. **AI Vision Service (Dịch vụ trí tuệ nhân tạo):**
   - Suy luận đa mô hình (Soft-voting Ensemble) kết hợp kỹ thuật Test-Time Augmentation (6-Crop TTA).
4. **Cơ sở dữ liệu:**
   - Microsoft SQL Server (`CayKiengLa` - 12 bảng thực thể chuẩn CDM).

---

## 📂 3. Cấu trúc Thư mục Dự án

```
NLCNHTTT/
├── 00_Tai_Lieu_Bao_Cao/          # Báo cáo đánh giá mô hình, ma trận nhầm lẫn 90x90, CDM
├── 01_Thiet_Ke_CSDL_PowerDesigner/# File thiết kế CDM / PDM chuẩn PowerDesigner
├── 02_CSDL_SQLServer/            # Script tạo CSDL 12 bảng và dữ liệu mẫu SQL Server
├── 03_Ung_Dung_Android_APK/      # File cài đặt ứng dụng Android (.apk)
├── 04_Cong_Cu_Ho_Tro/            # Tiện ích bổ trợ (Cloudflare Tunnel)
├── 06_Mo_Hinh_AI_Colab_Moi/      # Notebooks huấn luyện Google Colab GPU T4
├── frontend-kieng-la/            # Mã nguồn Web React & Capacitor Android
├── ai-service/                   # Mã nguồn Backend FastAPI & Trọng số AI MobileNetV2
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
© 2026 FloraBotanic AI Team — Niên luận Cơ sở ngành Hệ thống Thông tin.
