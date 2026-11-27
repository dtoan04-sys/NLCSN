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
  - **8-Crop Foliage ROI TTA** kết hợp Soft-Voting Ensemble và bộ lọc **OOD Lớp #91**: `conf < 0,55` hoặc `entropy > 0,55` (với Temperature Scaling `temp = 0,15`).
  - *Cấu hình chuẩn trong báo cáo:* Ensemble 4 model (`0,34 EfficientNetB0 + 3×0,22 MobileNetV2`).
  - *Cấu hình kiểm thử hiện tại trong `ai-service/main.py`:* chạy **thuần `MobileNetV2`** (`0,50 mobilenetv2_tu_so_0_seed_999.keras + 0,50 best_mobilenet_v2_aug48.keras`) để đồng nhất 100% kiến trúc `MobileNetV2` của đề tài (các trọng số `EfficientNetB0` vẫn được giữ sẵn trong `ai-service/model/`).

---

## 🔄 1B. Tiến độ Nâng cấp & Mở rộng theo Góp ý GVHD *(Cập nhật trên GitHub — nằm ngoài bảng số liệu gốc trong báo cáo Word)*

1. **Tăng cường dữ liệu chuyên sâu cho 48 loài yếu (`< 60%` / thiếu ảnh) — `aug48`:**
   - Notebook Colab: `06_Mo_Hinh_AI_Colab_Moi/Train_Tang_Cuong_48_Loai_Duoi_60_Colab.ipynb`.
   - Tăng cường **chỉ trên tập Train** (`19.919 → 26.057` ảnh, sinh thêm `+6.138` biến thể xoay `±25°`, lật ngang, giảm/tăng sáng `0,70x–1,30x`, tương phản, zoom nhẹ); giữ nguyên 100% tập **Val (`2.492`)** và **Test độc lập (`2.534`)** chống rò rỉ dữ liệu.
   - **Kết quả đo thực tế trên Colab GPU T4:**
     - `MobileNetV2 (aug48)`: **79,16% Top-1**, **90,77% Top-3**, **79,28% Weighted F1** (**+8,77%** so với bản Mẫu `70,39%`; giảm số loài F1 `< 60%` từ `28 → 11`; `40/48` loài ưu tiên tăng F1 trung bình `+11,88%`).
     - `EfficientNetB0 (aug48)`: **81,69% Top-1**, **92,78% Top-3**, **81,57% Weighted F1** (**+4,82%** so với bản Benchmark `76,87%`; giảm số loài F1 `< 60%` từ `28 → 5`; `42/48` loài ưu tiên tăng F1 trung bình `+14,57%`).
   - File Excel tổng hợp 7 sheet: `00_Tai_Lieu_Bao_Cao/Danh_Gia_Mo_Hinh/Bao_Cao_Tong_Hop_Mo_Hinh_AI_Day_Du.xlsx`.
2. **Học chủ động / Học tăng cường Online & Offline (`Human-in-the-Loop`):**
   - Người dùng chấm kết quả Đúng (`+1`) / Sai (`-1` + chọn lại loài đúng) ngay trên Web/App → lưu vào bảng `PHAN_HOI_NHAN_DIEN` qua `POST /api/nhan-dien/phan-hoi`.
   - Module `ai-service/online_learning.py` tự động lọc trùng MD5 và sinh thêm 3 biến thể (lật ngang, xoay `±8°`, sáng `±15%`) cho **48 loài ưu tiên** (`ai-service/model/priority_low_species.json`).
   - Quản trị viên duyệt nhãn và kích hoạt huấn luyện tăng cường luồng nền (có Replay Buffer + Balanced Class Weights × Reward Weight + Quality Gate) qua tab **Admin → AI Vision** (`POST /api/admin/online-learning/trigger`), hoặc chạy huấn luyện lại theo lô Offline bằng `ai-service/dataset_pipeline/retrain_from_feedback.py`.

---

## 🚀 2. Kiến trúc Công nghệ (Multi-tier Architecture)
1. **Frontend (Giao diện người dùng):**
   - Web: React 19 + Tailwind CSS + Lucide Icons + Vite.
   - Mobile: Capacitor Android (Hỗ trợ Camera AI, điều hướng phím cứng Back, tối ưu hóa bộ nhớ ảnh).
2. **Backend (Xử lý nghiệp vụ):**
   - FastAPI (Python), RESTful API, Uvicorn ASGI Server.
3. **AI Vision Service (Dịch vụ trí tuệ nhân tạo):**
   - Suy luận **Soft-Voting Ensemble** (hiện đang chạy thuần `MobileNetV2`: `TuSo0-Seed999 + Aug48`, có sẵn trọng số `EfficientNetB0` để bật lại Ensemble 4 model) kết hợp **8-Crop Foliage ROI TTA**, bộ lọc **OOD Lớp #91** (`conf < 0,55` hoặc `entropy > 0,55`) và module **Online/Offline Active Learning** (`online_learning.py`).
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
