# 📊 TỔNG HỢP TOÀN BỘ DỮ LIỆU ĐÃ THU THẬP, XỬ LÝ VÀ LƯU TRỮ — DỰ ÁN FLORABOTANIC AI

**Đề tài:** Xây dựng hệ thống nhận diện cây kiểng lá tích hợp thương mại điện tử ứng dụng học sâu trên nền tảng Web và Android (*FloraBotanic AI* — NLCNHTTT)  
**Kho mã nguồn chuẩn:** `E:\CNTT\NLCNHTTT`  
**Mục đích tài liệu:** Hồ sơ đối chiếu số liệu 100% đã kiểm chứng từ báo cáo Word chính thức (`Bao_Cao_Nien_Luan_Nganh_HTTT_FloraBotanic_AI.docx`), hệ thống báo cáo Excel (`Bao_Cao_Tong_Hop_Mo_Hinh_AI_Day_Du.xlsx`), cơ sở dữ liệu SQL Server / SQLite và các thư mục dữ liệu thực tế trên đĩa phục vụ bảo vệ trước Hội đồng / GVHD.

---

## 🎯 TÓM TẮT NHANH CÁC CON SỐ MỐC CHÍNH

| Hạng mục | Con số đã kiểm chứng | Ghi chú / Nguồn đối chiếu |
|---|---:|---|
| **Kho ảnh thô thu thập ban đầu** | **> 30.000 ảnh** | Kaggle *House Plant Species* (`47` loài / `14.790` ảnh, CC-BY-NC-SA-4.0) + `icrawler` mở rộng đủ `90` loài |
| **Bộ dữ liệu chuẩn Phiên bản 2 ("Từ số 0")** | **25.225 ảnh độc bản** | `25.013` ảnh sạch sau lọc trùng MD5 + pHash + `212` ảnh chụp thực tế tại vườn (90 loài) |
| **Ảnh thực tế tự thu thập (`bo_sung_thuc_te/`)** | **341 ảnh `.jpg`** | `212` ảnh trong 90 loài (8 loài) + `129` ảnh ngoài danh mục OOD Lớp #91 (8 loài lạ) |
| **Tăng cường mục tiêu 48 loài yếu (`aug48` — ngoại tuyến)** | **+6.138 ảnh Train** | Tập Train tăng `19.919 → 26.057`; giữ nguyên Val (`2.492`) và Test (`2.534`), tổng `31.083` ảnh |
| **Dữ liệu chụp thực địa bổ trợ khác** | **550 ảnh + 23 video** | `school_plants_dataset/` (`288` ảnh), `anh test/` (`38` ảnh + `23` `.mp4` + `1` `.zip` chứa 6 ảnh), `clip_frames/` (`224` ảnh) |
| **Cơ sở dữ liệu SQL Server (Chuẩn PDM)** | **15 bảng / 17 FK / 1.438 dòng** | `02_CSDL_SQLServer/` — `90` loài cây, `90` sản phẩm, `50` danh mục |
| **Cơ sở dữ liệu SQLite Runtime (`caykiengla.db`)** | **16 bảng / 3.417 dòng** | `ai-service/caykiengla.db` (`404,00 KB`) — 15 bảng PDM + `CHI_TIET_DON_HANG` |
| **Ảnh sản phẩm & tải lên hệ thống** | **414 ảnh** | `public/plants/` (`361` ảnh = 91 gốc + 270 ảnh góc), `ai-service/uploads/` (`50` ảnh), `uploads/` (`3` ảnh) |
| **Mô hình triển khai trực tiếp (`ai-service/main.py`)** | **1 mô hình lõi (`9,62 MB`)** | Thuần **`MobileNetV2-TuSo0-Seed999`** (`mobilenetv2_tu_so_0_seed_999.keras`) + `yolov8n.pt` (`6,25 MB`) + hot-reload `best_model_online.keras` |

---

## 📦 PHẦN 1: TỔNG QUAN TIẾN TRÌNH & SO SÁNH TOÀN BỘ CÁC PHIÊN BẢN BỘ DỮ LIỆU AI

### 1.1. Lộ trình thu thập và làm sạch chống rò rỉ dữ liệu (Data Leakage)
1. **Nguồn thu thập thô (`> 30.000` ảnh):** Kết hợp bộ dữ liệu công khai *House Plant Species* trên Kaggle (tác giả Kacper Gregorowicz, giấy phép CC-BY-NC-SA-4.0, gồm **`47` loài cơ bản / `14.790` ảnh**) với bộ công cụ thu thập tự động **`icrawler`** (`Tu_Dong_Thu_Thap_Va_Loc_Trung_30k_Anh.ipynb`) để mở rộng đủ **`90` loài cây kiểng lá**.
2. **Quy trình lọc trùng hai tầng thực hiện TRƯỚC KHI chia tập (chống Data Leakage):**
   - **Tầng 1 — MD5 Hash:** Loại bỏ ảnh trùng lặp tuyệt đối theo từng byte.
   - **Tầng 2 — Perceptual Hash (`pHash`, DCT 64-bit, khoảng cách Hamming `≤ 2`):** Loại bỏ ảnh gần trùng (khác tỷ lệ nén, độ phân giải hoặc cắt viền nhẹ).
3. **Tiến trình phát triển qua các mốc dữ liệu:**
   `> 30.000 ảnh thô` → **`23.850` ảnh độc bản (Phiên bản 1)** → **`25.013` ảnh sạch mở rộng (Benchmark 4 mô hình)** → **`25.225` ảnh độc bản (Phiên bản 2 "Từ số 0", bổ sung `+212` ảnh chụp thực tế tại vườn)**.

### 1.2. Bảng so sánh toàn bộ 7 phiên bản / giai đoạn dữ liệu huấn luyện

| STT | Phiên bản / Giai đoạn bộ dữ liệu | Tỷ lệ chia | Train | Val | Test | Tổng ảnh | Min / Max / TB / Trung vị (ảnh/loài) | Kết quả thực nghiệm cốt lõi (Top-1 / Top-3 / Weighted F1) |
|---:|---|---|---:|---:|---:|---:|---|---|
| 1 | **Phiên bản 1 — Baseline 70/15/15** (`MobileNetV2`) | `70/15/15` | 16.695 | 3.577 | 3.578 | **23.850** | `66` (Yucca) / `547` (Monstera) / `265,00` / `249,0` | `70,29%` / `85,79%` / `69,92%` |
| 2 | **Phiên bản 1 — Chuẩn 80/10/10** (Seed `42`, `MobileNetV2`) | `80/10/10` | 19.057 | 2.388 | 2.405 | **23.850** | `66` (Yucca) / `547` (Monstera) / `265,00` / `249,0` | `73,76%` (`1.774/2.405`) / `88,11%` / `73,76%` (Macro F1 `72,04%`); 3-seed (`42/99/100`): `72,86 ± 0,84%` |
| 3 | **Benchmark mở rộng pHash — 4 mô hình** (Seed `999`) | `80/10/10` | 19.975 | 2.461 | 2.577 | **25.013** | `78` (Yucca) / `544` (Monstera) / `277,92` / `263,0` | Custom CNN `68,57%` · ResNet50 `74,93%` · EfficientNetB0 `76,87%` · MobileNetV2 `70,39%` *(Seed `123`, Test `2.540`: `70,75%`; PB1 3-seed `99/123/999`: `71,02 ± 0,81%`)* |
| 4 | **Thực nghiệm ngoại tuyến `aug48`** (Tăng cường 48 loài yếu **chỉ trên Train**, Seed `999`) | `80/10/10` + Aug Train | `19.919` → **26.057** (`+6.138`) | **2.492** | **2.534** | `24.945` → **31.083** | Trước: `78–544` (TB `277,17`, TV `262,0`) → Sau: `223` (Baby Tears)–`624` (Monstera) (TB `345,37`, TV `364,0`) | **MNV2 (`aug48`):** `79,16%` / `90,77%` / `79,28%` (Macro F1 `78,02%`, loài F1 `<60%`: `28→11`, `40/48` ↑ TB `+11,88%`). **EffB0 (`aug48`):** `81,69%` / `92,78%` / `81,57%` (Macro F1 `80,25%`, loài F1 `<60%`: `28→5`, `42/48` ↑ TB `+14,57%`) |
| 5 | **Phiên bản 2 — "Từ số 0" chuẩn hóa** (`25.013` + `212` ảnh thực tế, Seed `999`) | `80/10/10` | **20.141** (`19.975` + `166`) | **2.483** (`2.461` + `22`) | **2.601** (`2.577` + `24`) | **25.225** | `78` (Yucca) / `544` (Monstera) / **`280,28`** / **`264,5`** | **MNV2 Seed 999:** `80,51%` (`2.094/2.601`) / `91,27%` / `80,36%` (Macro F1 `79,60%`, 4 loài F1 `<60%`). **3-seed (`99/123/999`):** **`80,86 ± 0,31%`** Top-1, **`91,22 ± 0,58%`** Top-3. **4 mô hình Seed 999:** Custom CNN `60,32%` · MNV2 `80,51%` · ResNet50 `83,35%` · **EffB0 `84,47%`** (`2.197/2.601`; `0/90` loài F1 `<60%`) |
| 6 | **Bộ bù thực tế Replay Fine-Tuning** (8 loài thực tế + 15 ảnh replay/lớp) | `1.860 / 450 / 450` | 1.860 | 450 | 450 | **2.760** | Tập con replay đủ 90 lớp | MNV2: Test 90 lớp `76,67% → 75,11%` (`-1,56%`), Top-3 `92,44% → 92,67%`; Test 8 loài thực tế `70,0% → 75,0%` (`+5,0%`); 212 ảnh thật in-sample `33,96% → 99,53%` *(Bảng 3.7 báo cáo Word; Excel Sheet 2 ghi `35,83% → 99,6%`)* |
| 7 | **Học chủ động trực tuyến — Online Active Learning** (`online_learning.py`) | `85% Train / 15% Val` (động) | Động (tăng dần) | Động (`15%`) | Cố định Test gốc | Tăng trưởng liên tục | Lọc trùng MD5 + sinh 3 biến thể tự động (lật ngang, xoay `±8°`, sáng `±15%` = `4×`) cho 48 loài ưu tiên | Replay Buffer 90 lớp gốc + Balanced Class Weights `[0,5; 3,0]` × Reward `1,5` (ca sai), `lr = 1e-5`, Quality Gate (độ sụt `≤ 2%`) trước khi hot-reload `best_model_online.keras` |

> **Giải thích chênh lệch `24.945` vs `25.013` ở thực nghiệm `aug48`:** Notebook `Train_Tang_Cuong_48_Loai_Duoi_60_Colab.ipynb` chạy lại bước lọc trùng MD5 trực tiếp trên kho nén 30k trước khi chia phân tầng `80/10/10` (Seed `999`), cho ra nền `19.919 / 2.492 / 2.534 = 24.945` ảnh trước khi tăng cường `+6.138` ảnh trên tập Train.

### 1.3. Chi tiết độ ổn định qua 3 Random Seeds của Phiên bản 2 ("Từ số 0" — `25.225` ảnh)

| Chỉ số đánh giá (`MobileNetV2`) | Seed `99` (`2.600` test) | Seed `123` (`2.600` test) | Seed `999` (`2.601` test) | **Trung bình ± Độ lệch chuẩn** |
|---|---:|---:|---:|---:|
| **Top-1 Accuracy** | `81,04%` (`2.107/2.600`) | `81,04%` (`2.107/2.600`) | `80,51%` (`2.094/2.601`) | **`80,86 ± 0,31%`** *(tăng `+9,84` điểm % so với PB1 `71,02 ± 0,81%`)* |
| **Top-3 Accuracy** | `91,77%` | `90,62%` | `91,27%` | **`91,22 ± 0,58%`** |
| **Weighted Precision** | `82,19%` | `82,29%` | `81,56%` | **`82,01 ± 0,40%`** |
| **Weighted F1-Score** | `80,84%` | `80,98%` | `80,36%` | **`80,73 ± 0,33%`** |
| **Macro F1-Score** | `80,02%` | `80,40%` | `79,60%` | **`80,01 ± 0,40%`** |
| **Ảnh thực tế độc lập (Real Test)** | `23/23` (`100,00%`) | `22/23` (`95,65%`) | `21/24` (`87,50%`) | **`94,38 ± 6,35%`** |

---

## 📷 PHẦN 2: DỮ LIỆU ẢNH THỰC TẾ TỰ THU THẬP & KIỂM THỬ NGOÀI PHÂN PHỐI (OOD LỚP #91)

### 2.1. Thư mục `bo_sung_thuc_te/` và bản nén `bo_sung_thuc_te.zip` (`341` ảnh `.jpg`)
- **Đường dẫn:** `E:\CNTT\NLCNHTTT\bo_sung_thuc_te\` (tổng **`341` ảnh `.jpg`** thuộc `16` thư mục loài).
- **Bản nén đối ứng:** `E:\CNTT\NLCNHTTT\bo_sung_thuc_te.zip` (`34.606.187` bytes ≈ **`33,00 MB`**) — bản sao khớp 100% gồm đúng **`341` ảnh `.jpg`** (`212` + `129`).

#### A. Nhóm 1 — `212` ảnh thực tế thuộc 90 loài (In-Distribution): `bo_sung_thuc_te\da_co_trong_90_loai\`

| STT | Thư mục / Tên khoa học | Tên tiếng Việt | Số ảnh `.jpg` | Ghi chú sử dụng |
|---:|---|---|---:|---|
| 1 | `Song of India (Dracaena reflexa)` | Trúc bách hợp | **52** | Hòa vào Phiên bản 2 ("Từ số 0") |
| 2 | `Spider Plant (Chlorophytum comosum)` | Dây nhện | **48** | Hòa vào Phiên bản 2 ("Từ số 0") |
| 3 | `Weeping Fig (Ficus benjamina)` | Cây Si | **45** | Hòa vào Phiên bản 2 ("Từ số 0") |
| 4 | `Asparagus Fern (Asparagus setaceus)` | Thiên môn đông cảnh | **31** | Hòa vào Phiên bản 2 ("Từ số 0") |
| 5 | `Moses in the Cradle (Tradescantia spathacea)` | Cây lẻ bạn | **20** | Hòa vào Phiên bản 2 ("Từ số 0") |
| 6 | `Anthurium (Anthurium andraeanum)` | Hồng môn | **11** | Hòa vào Phiên bản 2 ("Từ số 0") |
| 7 | `Corn Plant (Dracaena fragrans)` | Thiết mộc lan | **3** | Hòa vào Phiên bản 2 ("Từ số 0") |
| 8 | `Snake plant (Sanseviera)` | Lưỡi hổ | **2** | Hòa vào Phiên bản 2 ("Từ số 0") |
| | **Tổng cộng (8 loài)** | | **212** | Tại Seed 999 chia **`166` Train / `22` Val / `24` Test**; FRR in-sample `5/212 = 2,36%` (`conf TB = 0,9171`, `entropy TB = 0,1146`) |

#### B. Nhóm 2 — `129` ảnh thực tế ngoài 90 loài (OOD — Lớp #91): `bo_sung_thuc_te\loai_moi_bo_sung\`
*(Kiểm thử ngưỡng từ chối `P_max < 0,55` hoặc Entropy chuẩn hóa `H_norm > 0,55` trên cấu hình thực nghiệm 4-Model Ensemble + 8-Crop TTA, `temp = 0,15`; `conf TB = 0,4343`, `entropy TB = 0,5223`)*

| STT | Thư mục / Tên khoa học | Tên tiếng Việt | Tổng ảnh `.jpg` | Từ chối đúng (Lớp #91) | Tỷ lệ từ chối đúng |
|---:|---|---|---:|---:|---:|
| 1 | `Hoa chieu tim (Ruellia simplex)` | Hoa chiều tím | 24 | 23 | **95,83%** |
| 2 | `Hoa giay (Bougainvillea)` | Hoa giấy | 9 | 8 | **88,89%** |
| 3 | `Trau ba vang - Trau Thai (Epipremnum aureum)` | Trầu bà vàng (Trầu Thái) | 17 | 15 | **88,24%** |
| 4 | `Cay thuoc dau - Hong tuoc (Euphorbia tithymaloides)` | Cây thuốc dấu (Hồng tước) | 24 | 21 | **87,50%** |
| 5 | `Hoa hong (Rosa spp.)` | Hoa hồng | 21 | 18 | **85,71%** |
| 6 | `Cay luoc vang (Callisia fragrans)` | Cây lược vàng | 26 | 12 | **46,15%** *(dễ nhầm loài gần họ)* |
| 7 | `Cay nguyet que (Murraya paniculata)` | Cây nguyệt quế | 5 | 0 | **0,00%** *(tán lá gần họ)* |
| 8 | `Trau ti phu (Philodendron Burle Marx Variegata)` | Trầu tỉ phú Burle Marx | 3 | 0 | **0,00%** *(cùng họ Ráy Araceae)* |
| | **Tổng cộng (8 loài ngoài danh mục)** | | **129** | **97** | **75,19%** *(97/97 có `P_max < 0,55`; 56/97 đồng thời có `H_norm > 0,55`)* |

### 2.2. Các thư mục ảnh thực địa & kiểm thử bổ trợ khác trên đĩa
1. **Tập ảnh cắt thực địa sân trường (`E:\CNTT\NLCNHTTT\06_Mo_Hinh_AI_Colab_Moi\school_plants_dataset\`):**
   - Tổng cộng **`288` ảnh `.jpg`** trên **`9` thư mục lớp** + `1` tệp `manifest.json` (`287` bytes, ghi nhận ban đầu `total_crops: 27` = 216 ảnh cắt trước khi nhân bản tăng cường một số thư mục lên 2× thành 288 ảnh trên đĩa):
     - `02_hong_mon`: **40** | `12_duong_xi`: **16** | `23_thiet_moc_lan`: **32** | `38_trau_ti_phu_philodendron`: **24** | `40_trau_ba_la_tim`: **48** | `51_le_ban`: **32** | `73_luoi_ho`: **16** | `74_truc_bach_hop`: **32** | `83_cay_si`: **48**.
2. **Thư mục ảnh & video kiểm thử thực tế (`E:\CNTT\NLCNHTTT\anh test\`):**
   - Tổng **`62` tệp** gồm **`38` ảnh**, **`23` video `.mp4`** và **`1` tệp `.zip`**:
     - Thư mục gốc `anh test\`: **`16` ảnh** (`11 .jpg`, `5 .webp`), **`23` video `.mp4`**, **`1` tệp nén** `IMG_20261111_130406.jpg.zip` (`33.864.617` bytes ≈ `32,30 MB`, bên trong chứa `6` ảnh `.jpg`).
     - `anh test\Hồng Môn, Trầu Tỉ Phú, Trầu Thái\`: **`11` ảnh `.jpg`**.
     - `anh test\anh_co_giao\`: **`11` ảnh `.jpg`**.
3. **Khung hình trích xuất từ video (`E:\CNTT\NLCNHTTT\06_Mo_Hinh_AI_Colab_Moi\clip_frames\`):**
   - Từ `23` tệp `.mp4` trong `anh test\`, script khử trùng xác định **`9` clip độc bản** (loại `14` video trùng), trích xuất tổng cộng **`224` ảnh `.jpg`** (24 khung hình + 1 ảnh ghép `preview.jpg` mỗi clip; riêng `clip_06` có 23 khung hình + 1 `preview.jpg`) cùng `1` tệp `clips_manifest.json`.

---

## 🌱 PHẦN 3: PHÂN BỐ 90 LOÀI CÂY, NHÓM LOÀI ÍT DỮ LIỆU & TĂNG CƯỜNG `aug48`

### 3.1. Thống kê phân bố ảnh trên 90 loài qua các mốc
- **Phiên bản 1 (`23.850` ảnh):** Nhỏ nhất **`66`** (*Cây Yucca*) — Lớn nhất **`547`** (*Monstera Deliciosa*) — Trung bình **`265,00`** — Trung vị **`249,0`**.
- **Bộ Benchmark pHash (`25.013` ảnh):** Nhỏ nhất **`78`** (*Cây Yucca*) — Lớn nhất **`544`** (*Monstera Deliciosa*) — Trung bình **`277,92`** — Trung vị **`263,0`**.
- **Phiên bản 2 "Từ số 0" (`25.225` ảnh):** Nhỏ nhất **`78`** (*Cây Yucca*) — Lớn nhất **`544`** (*Monstera Deliciosa*) — Trung bình **`280,28`** — Trung vị **`264,5`**.
- **Sau tăng cường ngoại tuyến `aug48` (`31.083` ảnh):** Nhỏ nhất **`223`** (*Baby Tears*) — Lớn nhất **`624`** (*Monstera Deliciosa*) — Trung bình **`345,37`** — Trung vị **`364,0`**.

### 3.2. Cách hình thành nhóm 48 loài ưu tiên (`priority_low_species.json`) & Kỹ thuật tăng cường `aug48`
- **Tiêu chí chọn `48` loài ưu tiên:** Hợp của **`39` loài có ít nhất 1 chỉ số `< 60%`** trên MobileNetV2 Baseline Seed 999 (`28` loài F1 `< 60%`, `29` loài Recall `< 60%`, `20` loài Precision `< 60%`) **∪ `17` loài có tập Train `< 180` ảnh** trong bộ `25.013` (trùng nhau `8` loài → `39 + 17 − 8 = 48` loài).
- **Quy tắc tăng cường CHỈ TRÊN TẬP TRAIN (chống rò rỉ dữ liệu):**
  - Thiết lập `TARGET_TRAIN_PER_PRIORITY_CLASS = 320`, `MIN_EXTRA_AUG_FOR_PRIORITY = 80`, công thức `n_needed = max(320 − n_orig, 80)` → sinh thêm chính xác **`+6.138` ảnh** (tập Train tăng **`19.919 → 26.057`**).
  - Các phép biến đổi ngẫu nhiên: xoay `[-25°, +25°]`, lật ngang, đổi độ sáng `[0,70–0,88]` hoặc `[1,12–1,30]`, tương phản `[0,80–1,25]`, độ bão hòa màu `[0,85–1,20]`.
  - Tập **Validation (`2.492` ảnh)** và **Test độc lập (`2.534` ảnh)** được **giữ nguyên 100%**.
- **Lưu ý triển khai:** Trên mô hình lõi **MobileNetV2 Phiên bản 2 ("Từ số 0" — Seed 999)**, chỉ còn **4 loài** có `F1 < 60%` trên tập Test `2.601` ảnh: *Cây sống đời* (`51,85%`), *Sanh bonsai* (`57,78%`), *Ngân hậu Siam* (`58,18%`) và *Trầu bà lỗ* (`58,82%`). Kết quả `aug48` được giữ làm thực nghiệm ngoại tuyến (không trộn 50/50 vào luồng suy luận trực tiếp trên điện thoại vì tập nền web `24.945/25.013` ảnh chưa có 212 ảnh điện thoại thật).

### 3.3. Danh sách đầy đủ 17 loài ít dữ liệu nhất (`Train < 180` trong bộ `25.013` — Sheet 6 Excel)

*(So với trung bình toàn bộ 90 loài là `222` ảnh Train / `278` ảnh Tổng)*

| STT | Mã lớp | Tên tiếng Việt (*Tên tiếng Anh*) | Train / Val / Test = Tổng (bộ `25.013`) | Chênh lệch so với TB (`278`) | Tăng cường `aug48` (Train sau) | Mức ưu tiên |
|---:|---:|---|---:|---:|---:|:---:|
| 1 | #87 | Cây Yucca (*Yucca*) | `62 / 7 / 9 = 78` | `-200` | `+258` → `320` | **HIGH** |
| 2 | #46 | Cây sống đời (*Kalanchoe*) | `116 / 14 / 16 = 146` | `-132` | `+204` → `320` | **HIGH** |
| 3 | #65 | Trường sinh giọt nước (*Raindrop Peperomia*) | `142 / 17 / 19 = 178` | `-100` | `+178` → `320` | **HIGH** |
| 4 | #4 | Cau vàng (*Areca Palm*) | `150 / 18 / 20 = 188` | `-90` | `+170` → `320` | **HIGH** |
| 5 | #6 | Thiên môn đông cảnh (*Asparagus Fern*) | `156 / 19 / 21 = 196` *(v2: `181/22/24 = 227`)* | `-82` | `+164` → `320` | Medium |
| 6 | #11 | Môn nhung đen (*Black Velvet Alocasia*) | `158 / 19 / 21 = 198` | `-80` | `+162` → `320` | Medium |
| 7 | #71 | Vạn tuế (*Sago Palm*) | `160 / 20 / 20 = 200` | `-78` | `+160` → `320` | Medium |
| 8 | #68 | Đuôi công hồng (*Rose-painted Calathea*) | `164 / 20 / 22 = 206` | `-72` | `+156` → `320` | Medium |
| 9 | #16 | Cây hạnh phúc (*China Doll Plant*) | `169 / 21 / 22 = 212` | `-66` | `+151` → `320` | **HIGH** |
| 10 | #90 | Cây ngựa vằn Aphelandra (*Zebra Plant*) | `171 / 21 / 22 = 214` | `-64` | `+162` → `320` *(từ `158`)* | **HIGH** |
| 11 | #69 | Đuôi công lá tròn (*Round-leaf Calathea*) | `171 / 21 / 22 = 214` | `-64` | `+149` → `320` | Medium |
| 12 | #23 | Kim ngân lượng (*Coralberry*) | `174 / 21 / 23 = 218` | `-60` | `+146` → `320` | Medium |
| 13 | #73 | Trầu bà bạc (*Silver Pothos*) | `175 / 21 / 23 = 219` | `-59` | `+146` → `320` *(từ `174`)* | **HIGH** |
| 14 | #62 | Cây chân voi (*Ponytail Palm*) | `175 / 21 / 23 = 219` | `-59` | `+145` → `320` | Medium |
| 15 | #12 | Dứa cảnh Neoregelia (*Blushing Bromeliad*) | `176 / 22 / 22 = 220` | `-58` | `+144` → `320` | Medium |
| 16 | #38 | Trúc đốm (*Gold Dust Dracaena*) | `176 / 22 / 23 = 221` | `-57` | `+144` → `320` | **HIGH** |
| 17 | #9 | Thiên điểu (*Bird of Paradise*) | `178 / 22 / 23 = 223` | `-55` | `+142` → `320` | Medium |

---

## 🗄️ PHẦN 4: DỮ LIỆU CƠ SỞ DỮ LIỆU & KHO ẢNH SẢN PHẨM / TẢI LÊN

### 4.1. Đối chiếu Cơ sở dữ liệu SQL Server (Chuẩn PDM) và SQLite Runtime (`caykiengla.db`)
- **Thiết kế SQL Server (`E:\CNTT\NLCNHTTT\02_CSDL_SQLServer\`):**
  - Chuẩn PowerDesigner `ChuanPDM.pdm` (Microsoft SQL Server 2017): **`15` bảng**, **`17` khóa ngoại**, **`1.438` dòng mẫu** (`90` loài cây, `90` sản phẩm, `50` danh mục).
  - Các tệp script & xuất dữ liệu: `00_TaoBang_TheoPDM_Unicode.sql` (`10.320` B), `01_ChuyenCotChu_Unicode.sql` (`4.730` B), `02_DuLieuMau_90Cay.sql` (`164.844` B, trùng byte với bản nằm ở gốc `02_CSDL_SQLServer\`), `03_KiemTra_SauNhap.sql` (`3.291` B), gói nén `KiengLa_90Cay_DuLieuMau_SQLServer.zip` (`99.707` B), cùng các tệp JSON/HTML đối chiếu (`DuLieu_15Bang.json`, `BaoCao_KiemTra.json`, `AnhXa_Model_90Lop.json`, `ThongTin_90Cay_VaNguon.json`, `ThongTin_90Cay.html`, `HUONG_DAN.md`).
- **CSDL SQLite Runtime (`E:\CNTT\NLCNHTTT\ai-service\caykiengla.db`, dung lượng `413.696` bytes = `404,00 KB`):**
  - Gồm **`16` bảng** (`15` bảng PDM + bảng chi tiết đơn hàng **`CHI_TIET_DON_HANG`**), tổng cộng **`3.417` bản ghi thực tế** đã kiểm đếm trực tiếp bằng `SELECT COUNT(*)`:

| STT | Tên bảng | SQL Server mẫu (15 bảng PDM) | SQLite runtime (`caykiengla.db`, 16 bảng) | Ghi chú nghiệp vụ |
|---:|---|---:|---:|---|
| 1 | `NGUOI_DUNG` | 10 | 13 | Tài khoản quản trị & khách hàng |
| 2 | `DANH_MUC` | 50 | 51 | ID `1..50` + ID `51` (*Lớp khác — Ngoài kho dữ liệu*) |
| 3 | `CHUONG_TRINH_GIAM_GIA` | 50 | 52 | Mã giảm giá / Voucher |
| 4 | `DIA_CHI_NGUOI_DUNG` | 50 | 50 | Địa chỉ giao hàng |
| 5 | `LOAI_CAY` | 90 | 92 | ID `1..90` chuẩn + ID `91` (*Trầu bà Billietiae*) + ID `92` (*Lớp khác / OOD*) |
| 6 | `SAN_PHAM` | 90 | 92 | `90` sản phẩm gốc + `2` sản phẩm demo/test (ID `93`, `94`) |
| 7 | `HINH_ANH_SAN_PHAM` | 180 | 368 | Ảnh sản phẩm đa góc chụp (4 góc/chậu trong runtime) |
| 8 | `LICH_SU_GIA_SAN_PHAM` | 180 | 268 | Lịch sử biến động giá bán |
| 9 | `THOI_DIEM` | 180 | 181 | Mốc thời gian tham chiếu giá |
| 10 | `GIO_HANG` | 69 | 69 | Phiên giỏ hàng |
| 11 | `CHI_TIET_GIO_HANG` | 129 | 129 | Dòng sản phẩm trong giỏ |
| 12 | `DON_HANG` | 60 | 71 | Đơn hàng (thành viên & khách vãng lai) |
| 13 | `CHI_TIET_DON_HANG` | *(không có trong PDM 15 bảng)* | **136** | Bảng bổ sung ở tầng runtime lưu chi tiết từng mặt hàng trong đơn |
| 14 | `DANH_GIA_SAN_PHAM` | 60 | 62 | Đánh giá 1–5 sao của khách hàng |
| 15 | `TIM_ANH` | 60 | 504 | Nhật ký phiên chụp/tải ảnh nhận diện AI (Web & Android) |
| 16 | `KET_QUA_NHAN_DIEN` | 180 | 1.279 | Kết quả Top-K dự đoán cho từng phiên `TIM_ANH` (chuẩn 1NF) |
| | **TỔNG CỘNG** | **1.438 dòng** (`15` bảng) | **3.417 dòng** (`16` bảng) | *(Bảng phản hồi `PHAN_HOI_NHAN_DIEN` được `online_learning.py` khởi tạo động khi ghi nhận feedback Active Learning)* |

### 4.2. Kho ảnh sản phẩm & ảnh tải lên hệ thống (`414` tệp ảnh)
- **`E:\CNTT\NLCNHTTT\frontend-kieng-la\public\plants\`:** Tổng **`361` ảnh `.jpg`**, gồm:
  - Thư mục gốc: **`91` ảnh `.jpg`** (`1.jpg` đến `90.jpg` cho 90 loài + `default.jpg`).
  - Thư mục con `angles\`: **`270` ảnh `.jpg`** (`3` góc chụp bổ sung × `90` loài).
- **`E:\CNTT\NLCNHTTT\ai-service\uploads\`:** **`50` ảnh `.jpg`** (ảnh thực tế người dùng tải lên / quét đơn cây & đa cây khi chạy thử nghiệm Backend).
- **`E:\CNTT\NLCNHTTT\uploads\`:** **`3` tệp ảnh** (`1 .jpg`, `2 .png`).

---

## 🗂️ PHẦN 5: DANH MỤC KHO LƯU TRỮ, NOTEBOOK COLAB, BÁO CÁO EXCEL/CSV & TRỌNG SỐ `.keras`

### 5.1. Trọng số mô hình AI (`.keras`, `.pt`) & Metadata JSON
> **Phân biệt rõ ràng:** Hệ thống triển khai trực tiếp (`ai-service/main.py`) chỉ nạp **1 mô hình lõi duy nhất** là **`mobilenetv2_tu_so_0_seed_999.keras` (`9,62 MB`)** (kèm `yolov8n.pt` `6,25 MB` cho chế độ đa cây và cơ chế tự động hot-reload `best_model_online.keras` khi Admin chạy Online Active Learning). Toàn bộ các tệp `.keras` còn lại được lưu giữ để phục vụ đối chứng học thuật, tái lập thực nghiệm và dự phòng.

#### A. Thư mục `E:\CNTT\NLCNHTTT\ai-service\model\` (`11` tệp `.keras` + `4` tệp JSON + `1` thư mục báo cáo)

| Tên tệp | Dung lượng | Phân loại & Vai trò |
|---|---:|---|
| **`mobilenetv2_tu_so_0_seed_999.keras`** | **`9,62 MB`** (`10.084.294` B) | **🚀 MÔ HÌNH TRIỂN KHAI TRỰC TIẾP (`ai-service/main.py`)** — MobileNetV2 Phiên bản 2 ("Từ số 0", Seed 999, `2.373.274` tham số, bộ `25.225` ảnh) |
| `mobilenetv2_tu_so_0_seed_123.keras` | `9,62 MB` (`10.084.294` B) | 🧪 Thực nghiệm — MobileNetV2 Phiên bản 2, Seed `123` (kiểm chứng độ ổn định 3 seeds) |
| `mobilenetv2_tu_so_0_seed_99.keras` | `9,62 MB` (`10.084.289` B) | 🧪 Thực nghiệm — MobileNetV2 Phiên bản 2, Seed `99` (kiểm chứng độ ổn định 3 seeds) |
| `efficientnet_b0_tu_so_0.keras` | `16,69 MB` (`17.502.480` B) | 🧪 Thực nghiệm — EfficientNetB0 Phiên bản 2 Seed `999` (`84,47%` Top-1; thành phần Ensemble 4 mô hình trong báo cáo) |
| `best_model.keras` | `16,69 MB` (`17.502.480` B) | 🔁 Dự phòng (`MODEL_PATH` fallback, cùng kích thước `efficientnet_b0_tu_so_0.keras`) |
| `efficientnet_b0_30k.keras` | `16,69 MB` (`17.499.786` B) | 🧪 Thực nghiệm — EfficientNetB0 bộ mở rộng 30k |
| `best_model_old_backup.keras` | `9,61 MB` (`10.081.690` B) | 📦 Lưu trữ dự phòng bản cũ *(bản trong `E:\dowload\ai-service\model\` có dung lượng `10,50 MB`)* |
| `best_model_80_10_10_clean.keras` | `19,86 MB` (`20.822.692` B) | 🧪 Thực nghiệm — Bản chuẩn hóa chia `80/10/10` |
| `best_model_seed_999_fixed.keras` | `22,03 MB` (`23.101.691` B) | 🧪 Thực nghiệm — Bản Seed `999` cấu hình cố định |
| `best_mobilenet_v2_aug48.keras` | `23,19 MB` (`24.318.399` B) | 🧪 Thực nghiệm ngoại tuyến — MobileNetV2 `aug48` (`79,16%` Top-1; không trộn 50/50 vào runtime) |
| `best_efficientnet_b0_aug48.keras` | `33,13 MB` (`34.737.306` B) | 🧪 Thực nghiệm ngoại tuyến — EfficientNetB0 `aug48` (`81,69%` Top-1) |

- **Mô hình phát hiện đa cây:** `E:\CNTT\NLCNHTTT\ai-service\yolov8n.pt` (`6.549.796` B = **`6,25 MB`**).
- **Tệp Metadata & báo cáo trong `ai-service\model\`:**
  - `class_names.json` (`3.496` B): danh sách 90 tên lớp tiếng Anh / khoa học.
  - `labels_vi.json` (`11.720` B): ánh xạ 90 lớp (`class_id`, `original_label`, `vietnamese_name`).
  - `priority_low_species.json` (`23.110` B): thông số chi tiết 48 loài ưu tiên cho Active Learning & `aug48`.
  - `environment.json` (`49` B): `{"tensorflow": "2.21.0", "keras": "3.13.2"}`.
  - `seed_999_report\`: `classification_report.csv` (`8.179` B), `confusion_matrix.csv` (`22.372` B).
  - Tệp bổ trợ tại `ai-service\`: `sample_products.json` (`5.078` B) và `dataset_pipeline\retrain_from_feedback.py` (`12.701` B).
- **Các checkpoint cục bộ lưu trữ bổ sung ngoài `ai-service\model\`:**
  - `06_Mo_Hinh_AI_Colab_Moi\`: `best_model_fixed.keras` (`9,85 MB`), `best_model_school_finetuned.keras` (`10,75 MB`).
  - `06_Mo_Hinh_AI_Colab_Moi\_Archive_Model_Cu\`: `best_model.keras` (`26,02 MB`), `best_model_before_school_finetune.keras` (`9,85 MB`), `kiengla_weights.weights.h5` (`25,87 MB`).
  - `00_Tai_Lieu_Bao_Cao\Danh_Gia_Mo_Hinh\_Du_Lieu_Goc_Va_Luu_Tru\Ket_Qua_Moi_80_10_10\`: `best_model.keras` (`22,56 MB`), `KiengLa_Model_Va_BaoCao_80_10_10.zip` (`20,48 MB`).

### 5.2. Thư mục Notebook Colab & Mã nguồn Huấn luyện (`E:\CNTT\NLCNHTTT\06_Mo_Hinh_AI_Colab_Moi\` — `556` tệp)
- **12 Notebook Google Colab (`.ipynb`):**
  1. `Tu_Dong_Thu_Thap_Va_Loc_Trung_30k_Anh.ipynb` (`12,4 KB`) — Thu thập `icrawler` & lọc trùng 2 tầng MD5/pHash.
  2. `Cay_Kieng_Chia_Lai_80_10_10_Colab.ipynb` (`29,6 KB`) — Chia lại tỷ lệ `80/10/10` (`23.850` ảnh).
  3. `Cay_Kieng_Chia_Seed_Train_Lai_Colab.ipynb` (`29,7 KB`) — Huấn luyện đa seed cố định PRNG.
  4. `Train_Lai_30k_Anh_80_10_10_Colab.ipynb` (`26,8 KB`) — Huấn luyện trên tập mở rộng pHash.
  5. `KiengLa_Train_30k_Seed999_Chuan_100.ipynb` (`26,8 KB`) — Chuẩn hóa huấn luyện Seed `999`.
  6. `So_Sanh_Da_Mo_Hinh_Cung_Cau_Hinh_Colab.ipynb` (`19,8 KB`) — Đối chứng 4 kiến trúc trên bộ `25.013` ảnh.
  7. `Train_Theo_Bai_Bao_Mau_Chuan_Quoc_Te_Colab.ipynb` (`18,0 KB`) — Huấn luyện đối chiếu quy chuẩn học thuật.
  8. `Train_Bo_Sung_Thuc_Te_Colab.ipynb` (`47,3 KB`) — Fine-tuning bổ sung ảnh thực tế với Replay Buffer (`2.760` ảnh).
  9. `Train_3_Seeds_Tu_So_0_99_123_999_Colab.ipynb` (`88,6 KB`) — **Huấn luyện chính Phiên bản 2 ("Từ số 0", `25.225` ảnh) qua 3 Seeds `99`, `123`, `999`.**
  10. `So_Sanh_4_Mo_Hinh_Tu_So_0_Colab.ipynb` (`92,2 KB`) — **Đối chứng 4 mô hình (Custom CNN, MobileNetV2, ResNet50, EfficientNetB0) tại Seed `999` trên bộ `25.225` ảnh.**
  11. `Train_Tang_Cuong_48_Loai_Duoi_60_Colab.ipynb` (`38,9 KB`) — Thực nghiệm ngoại tuyến tăng cường `aug48` (`+6.138` ảnh Train).
  12. `Kiem_Tra_Anh_90_Loai_Colab.ipynb` (`8,0 KB`) — Kiểm tra tính toàn vẹn kho ảnh 90 loài.
- **14 Script Python hỗ trợ & 1 tệp JSON gốc:** `pipeline_tu_so_0_core.py`, `build_tu_so_0_notebooks.py`, `build_baseline_bao_cao_mau.py`, `create_fixed_colab.py`, `make_benchmark_nb.py`, `make_crawler_nb.py`, `make_seed_notebook.py`, `make_train_30k_nb.py`, `update_benchmark_nb.py`, `update_nb_step7.py`, `kiem_tra_anh_bat_ky.py`, `test_model_moi.py`, `test_pipeline_tu_so_0.py`, `tinh_toan_mean_std.py`, cùng `baseline_bao_cao_mau.json` (`75,7 KB`).

### 5.3. Kho Báo cáo Đánh giá, Excel & CSV (`E:\CNTT\NLCNHTTT\00_Tai_Lieu_Bao_Cao\Danh_Gia_Mo_Hinh\` — `41` tệp)
- **5 tệp sản phẩm tổng hợp ở cấp gốc:**
  1. `Bao_Cao_Tong_Hop_Mo_Hinh_AI_Day_Du.xlsx` (`48,3 KB`, **7 sheet**: tỷ lệ chia, học tăng cường, thống kê 90 loài, so sánh loài `<60%`, chi tiết `aug48`, 17 loài ít dữ liệu, tổng hợp kết quả).
  2. `Bang_Ti_Le_Phan_Chia_Va_Hoc_Tang_Cuong_Da_Mo_Hinh.xlsx` (`27,5 KB`, 4 sheet tương ứng Sheet 1–4).
  3. `Ket_Qua_Train_Tang_Cuong_48_Loai.xlsx` (`21,8 KB`).
  4. `So_Sanh_Cac_Loai_Cay_Duoi_60_Phan_Tram_Da_Mo_Hinh.xlsx` (`43,6 KB`).
  5. `Ma_Tran_Nham_Lan_Tuong_Tac.html` (`142,5 KB` — công cụ Web tương tác tra cứu 90 loài).
- **36 tệp nguồn và lưu trữ trong `_Du_Lieu_Goc_Va_Luu_Tru\`:**
  - `7` tệp Excel gốc/sao lưu (`Bang_So_Sanh_4_Mo_Hinh_Do_That_Drive.xlsx`, `Bang_Ti_Le_Phan_Chia_Va_Hoc_Tang_Cuong_Da_Mo_Hinh.xlsx`, `Bao_Cao_Chi_Tiet_90_Loai_Cay_MobileNetV2.xlsx`, `Bao_Cao_Mo_Hinh_80_10_10_Tieng_Viet.xlsx`, `Ket_Qua_Thuc_Nghiem_3_Seeds_Drive.xlsx`, `Ket_Qua_Train_Tang_Cuong_48_Loai.xlsx`, `So_Sanh_Cac_Loai_Cay_Duoi_60_Phan_Tram_Da_Mo_Hinh.xlsx`).
  - `6` tệp tài liệu Markdown / Text (`Bang_Ti_Le_Phan_Chia_Va_Hoc_Tang_Cuong_Da_Mo_Hinh.md`, `BAO_CAO_DANH_GIA_MO_HINH_80_10_10.md`, `Huong_Dan_Giai_Trinh_Bao_Ve_Do_An.md`, `So_Sanh_Cac_Loai_Cay_Duoi_60_Phan_Tram_Da_Mo_Hinh.md`, `TOM_TAT_TOAN_BO_NIEN_LUAN_VA_THUC_NGHIEM.md`, `low_count_plants.txt`).
  - `2` script Python (`build_web_app.py`, `find_low_plants.py`) + `1` JSON (`seed_999_metrics.json`).
  - `Ket_Qua_Moi_80_10_10\` (`15` tệp): `best_model.keras`, `KiengLa_Model_Va_BaoCao_80_10_10.zip`, `class_names.json`, `labels_vi.json`, `split_counts_80_10_10.csv`, `split_counts_tieng_viet.csv`, cùng thư mục `evaluation_report_80_10_10\` (`classification_report.csv`, `classification_report_tieng_viet.csv`, `confused_pairs_vi.csv` [470 cặp nhầm lẫn], `confusion_matrix.csv`, `confusion_matrix_tieng_viet.csv`, `confusion_matrix_vi.csv`, `confusion_matrix.png`, `evaluation_summary_vi.txt`, `metrics.json`).
  - `Ket_Qua_Train_Tang_Cuong_48_Loai\` (`5` tệp): `classification_report_mobilenet_v2_aug48.csv`, `classification_report_efficientnet_b0_aug48.csv`, `metrics_summary.json` (thời gian huấn luyện Colab T4: MNV2 `57,29` phút / EffB0 `93,86` phút), `split_counts_before_aug.csv`, `split_counts_after_aug.csv`.

---
*Tài liệu được tổng hợp và kiểm chứng chéo 100% giữa mã nguồn thực thi, CSDL SQL Server / SQLite, báo cáo Word chính thức và hệ thống tệp trên đĩa.*
