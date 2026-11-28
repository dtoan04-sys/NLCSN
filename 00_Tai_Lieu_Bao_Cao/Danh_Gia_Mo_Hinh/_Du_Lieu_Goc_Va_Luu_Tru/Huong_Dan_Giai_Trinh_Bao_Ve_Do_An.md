# 🎓 CẨM NANG BẢO VỆ ĐỒ ÁN & GIẢI TRÌNH PHẢN BIỆN TRƯỚC HỘI ĐỒNG / GVHD

**Đề tài:** Hệ thống nhận diện 90 loài cây lá cảnh phục vụ quản lý & chăm sóc (*FloraBotanic AI*)  
**Dữ liệu chuẩn hóa (Phiên bản 2 — "Từ số 0"):** **25.225 ảnh độc bản** (sau lọc trùng 2 tầng MD5 + Perceptual Hash trước khi chia Stratified Split `80% Train – 10% Val – 10% Test`; tại Seed 999: `20.141 Train / 2.483 Val / 2.601 Test`).  
**Hạt giống ngẫu nhiên (Random Seeds):** `99`, `123`, `999`.  
**Đồng bộ 100% với:** Báo cáo chính thức `Bao_Cao_Nien_Luan_Nganh_HTTT_FloraBotanic_AI.docx` và phiên bản mã nguồn triển khai `ai-service/main.py`.

---

## ⚠️ NGUYÊN TẮC VÀNG KHI TRÌNH BÀY: PHÂN BIỆT RÕ MÔ HÌNH THỰC NGHIỆM VS MÔ HÌNH TRIỂN KHAI

> **Đây là câu hỏi dễ bị hội đồng xoáy sâu nhất — tuyệt đối KHÔNG nói nhập nhằng!**

| Tiêu chí | 🧪 Mô hình Thực nghiệm (Trong báo cáo đánh giá & ngoại tuyến) | 🚀 Mô hình Triển khai thực tế (Hệ thống Demo `ai-service/main.py`) |
|---|---|---|
| **Kiến trúc** | So sánh 4 kiến trúc (`Custom CNN`, `MobileNetV2`, `ResNet50`, `EfficientNetB0`) + cấu hình **Soft-Voting Ensemble 4 mô hình** (`0,34 EfficientNetB0 + 3×0,22 MobileNetV2`) + thực nghiệm ngoại tuyến tăng cường 48 loài yếu (`aug48`) | **Thuần `MobileNetV2-TuSo0-Seed999` (1 mô hình lõi)**: `mobilenetv2_tu_so_0_seed_999.keras` (`9,62 MB`, huấn luyện trên bộ **25.225 ảnh độc bản** gồm 212 ảnh chụp thực tế) + **8-Crop Foliage ROI TTA** + **OOD Lớp #91** + **YOLOv8n** + tự động **Online Active Learning hot-reload** (`best_model_online.keras`) khi Admin kích hoạt |
| **Vai trò** | Đánh giá học thuật, đối chứng đa kiến trúc, đo chuẩn hiệu năng CPU (`5,13 giây` lõi / `5,78 giây` HTTP), kiểm chứng OOD Lớp #91 (`75,19%`) và đánh giá ngoại tuyến phương án `aug48` | Phục vụ suy luận trực tiếp trên Web/APK demo với độ trễ CPU nhanh, dung lượng gọn nhẹ (`9,62 MB`), đạt độ tin cậy cao (`93–97%`) trên ảnh chụp điện thoại thực tế nhờ bộ dữ liệu 25.225 ảnh có kèm ảnh thật |
| **Cách nói chuẩn với hội đồng** | *"Trong thực nghiệm, em đánh giá 4 kiến trúc, cấu hình tổ hợp 4 mô hình Ensemble để phân tích đánh đổi độ chính xác–độ trễ và chạy thực nghiệm ngoại tuyến `aug48` trên Colab."* | *"Trên bản demo thực tế, em triển khai thuần mô hình lõi `MobileNetV2-TuSo0-Seed999` (`9,62 MB`, huấn luyện trên bộ 25.225 ảnh có kèm ảnh chụp thực tế), kết hợp 8-Crop Foliage ROI TTA, bộ lọc OOD Lớp #91, YOLOv8n đa cây và Online Active Learning hot-reload để đạt tốc độ nhanh trên CPU không GPU và ổn định trên ảnh điện thoại thật."* |
| **Bằng chứng kiểm chứng ngay lúc demo** | Bảng 3.5, Bảng 3.6, Bảng 3.10 trong báo cáo Word & Excel 7 sheet (`aug48`) | Mở trực tiếp endpoint `GET /health` trả về `ensemble_count: 1` và `ensemble_members: ["MobileNetV2-TuSo0-Seed999-80.5"]` |

---

## 📌 1. TÓM TẮT 7 CÂU HỎI TRỌNG TÂM & CÁCH TRẢ LỜI NGẮN GỌN, TỰ TIN

| Câu hỏi Hội đồng / GVHD | Câu trả lời cốt lõi (Khớp 100% báo cáo) |
|---|---|
| **1. Vì sao báo cáo có Ensemble 4 model (`EfficientNetB0 + 3×MNV2`) nhưng demo chạy thuần `MobileNetV2-TuSo0-Seed999`?** | Em phân tách rõ **cấu hình thực nghiệm** và **cấu hình triển khai**. Ensemble 4 model được dùng để đánh giá trần hiệu năng và đo độ trễ CPU (`5,78s`/ảnh đơn cây — hơi nặng trên CPU không GPU). Khi triển khai demo, em chọn **thuần `MobileNetV2-TuSo0-Seed999`** (`mobilenetv2_tu_so_0_seed_999.keras`, `9,62 MB`, huấn luyện trên bộ 25.225 ảnh) kèm **8-Crop Foliage ROI TTA + OOD Lớp #91 + YOLOv8n + Online Active Learning hot-reload** vì nhẹ, nhanh trên CPU và đồng nhất với mô hình lõi của đề tài. |
| **2. Vì sao demo trực tiếp dùng thuần `MobileNetV2-TuSo0-Seed999` mà không trộn 50/50 với bản `aug48`?** | Có 2 lý do kỹ thuật rõ ràng: **(1) Domain gap trên ảnh điện thoại thật:** bản `aug48` là thực nghiệm ngoại tuyến huấn luyện trên tập nền **25.013 ảnh web** (không có 212 ảnh chụp thực tế từ điện thoại). Khi thử trộn 50/50 trên ảnh điện thoại thật, `aug48` kéo độ tin cậy xuống dưới ngưỡng OOD `0,55` gây từ chối nhầm sang Lớp #91; trong khi `MobileNetV2-TuSo0-Seed999` (học trên 25.225 ảnh có kèm ảnh thật) tự đạt **`93–97%`** trên ảnh điện thoại thật. **(2) Tốc độ CPU:** chạy 1 mô hình `9,62 MB` nhanh hơn hẳn chạy song song 2 mô hình trên CPU không GPU, còn các loài yếu ngoài thực tế được cải thiện tiếp qua vòng lặp **Online Active Learning** (`best_model_online.keras`). |
| **3. Lọc trùng ảnh từ >30.000 xuống 25.225 ảnh bằng cách nào? Có rò rỉ dữ liệu (Data Leakage) không?** | Dùng quy trình lọc trùng **2 tầng**: (1) **MD5 Hash** loại ảnh trùng byte tuyệt đối; (2) **Perceptual Hash (pHash / DCT 64-bit)** loại ảnh gần trùng (khác nén/độ phân giải). Toàn bộ quá trình lọc trùng chạy **TRƯỚC KHI** chia `Stratified Split 80% – 10% – 10%`, đảm bảo tập Test (`2.601` ảnh tại Seed 999) không trùng lặp ảnh với Train/Val. |
| **4. Kết quả chính xác nhất của các mô hình trên 25.225 ảnh là bao nhiêu?** | Trên tập Test độc lập (`2.601` ảnh), **MobileNetV2** đạt **80,86 ± 0,31% Top-1** và **91,22 ± 0,58% Top-3** qua 3 seeds (`99`, `123`, `999`), tăng **+9,84 điểm %** so với Phiên bản 1 (`71,02 ± 0,81%`). Đối chứng tại Seed 999: **EfficientNetB0** đạt **84,47% Top-1 / 93,89% Top-3**, **ResNet50** đạt **83,35%**, vượt xa **Custom CNN** huấn luyện từ đầu (**60,32%**). |
| **5. Tại sao chạy 3 Random Seeds (`99`, `123`, `999`)? Ý nghĩa của `± 0,31%`?** | Cố định PRNG (`random`, `numpy`, `tensorflow`, `train_test_split`) để đảm bảo **tính tái lập (Reproducibility)** và chứng minh kết quả không phụ thuộc "may mắn" của một lần chia dữ liệu. Độ lệch chuẩn `± 0,31%` (`81,04%`, `81,04%`, `80,51%`) cho thấy MobileNetV2 hội tụ rất ổn định. |
| **6. Giải pháp nâng cấp cho các loài yếu (`aug48`) và Active Learning hoạt động ra sao?** | Theo góp ý GVHD, em thực hiện **thực nghiệm ngoại tuyến tăng cường có mục tiêu cho 48 loài yếu — chỉ trên tập Train** (`19.919 → 26.057`, `+6.138` ảnh xoay `±25°`, lật, đổi sáng `0,70x–1,30x`, tương phản, zoom), giữ nguyên 100% Val (`2.492`) & Test (`2.534`). Kết quả thật trên Colab T4: **MobileNetV2 (`aug48`) đạt 79,16% Top-1 / 90,77% Top-3 / 79,28% Weighted F1** (**+8,77%** so với bản Mẫu `70,39%`, giảm loài F1 `< 60%` từ `28 → 11`, `40/48` loài ưu tiên tăng TB `+11,88%`); **EfficientNetB0 (`aug48`) đạt 81,69% Top-1 / 92,78% Top-3** (**+4,82%**, giảm loài `< 60%` từ `28 → 5`). Kèm vòng lặp **Human-in-the-Loop** trên hệ thống thật: người dùng chấm Đúng/Sai → Admin duyệt nhãn → huấn luyện tăng cường có Replay Buffer & Quality Gate và hot-reload `best_model_online.keras`. |
| **7. Cơ chế phát hiện cây ngoài danh mục (Lớp #91 / OOD) đo được bao nhiêu? Hạn chế là gì?** | Áp dụng đồng thời ngưỡng `P_max < 0,55` hoặc Entropy chuẩn hóa `H_norm > 0,55` (`temp = 0,15`). Trên **129 ảnh độc lập thuộc 8 loài lạ**, hệ thống từ chối đúng **97/129 = 75,19%** (Hoa chiều tím `95,83%`, Hoa giấy `88,89%`, Trầu bà vàng `88,24%`). Tuy nhiên vẫn còn hạn chế ở các loài lá gần họ như **Cây lược vàng (`12/26 = 46,15%`)**, Cây nguyệt quế (`0/5`), Trầu tỉ phú Burle Marx (`0/3`), và tỷ lệ từ chối nhầm `FRR = 5/212 (2,36%)` hiện mới đo in-sample trên tập cục bộ. |

---

## 📊 2. BẢNG SỐ LIỆU CHUẨN (ĐỐI CHIẾU TRỰC TIẾP VỚI BÁO CÁO WORD)

### 2.1. Độ ổn định MobileNetV2 qua 3 Random Seeds (Phiên bản 2 — 25.225 ảnh độc bản)

| Chỉ số | Seed 99 (`2.600` test) | Seed 123 (`2.600` test) | Seed 999 (`2.601` test) | **Mean ± Std** |
|---|---:|---:|---:|---:|
| **Top-1 Accuracy (Weighted Recall)** | 81,04% | 81,04% | 80,51% | **80,86 ± 0,31%** |
| **Top-3 Accuracy** | 91,77% | 90,62% | 91,27% | **91,22 ± 0,58%** |
| **Weighted Precision** | 82,19% | 82,29% | 81,56% | **82,01 ± 0,40%** |
| **Weighted F1-Score** | 80,84% | 80,98% | 80,36% | **80,73 ± 0,33%** |
| **Macro F1-Score** | 80,02% | 80,40% | 79,60% | **80,01 ± 0,40%** |
| **Ảnh thực tế độc lập (Real test)** | 23/23 (100,00%) | 22/23 (95,65%) | 21/24 (87,50%) | **94,38 ± 6,35%** |

*(So với Phiên bản 1 — 3 seeds 99/123/999 đạt Top-1 `71,02 ± 0,81%`, Phiên bản 2 cải thiện **+9,84 điểm %**).*

### 2.2. Đối chứng 4 kiến trúc tại Seed 999 (Tập Test độc lập `2.601` ảnh — Bảng 3.5)

| Mô hình | Tham số | Dung lượng | Độ trễ GPU T4 | Top-1 | Top-3 | Weighted F1 | Đúng / Sai (`2.601`) |
|---|---:|---:|---:|---:|---:|---:|---:|
| **Custom CNN (Scratch)** | 1,88M | 7,26 MB | 0,98 ms | 60,32% | 78,74% | 59,45% | — |
| **MobileNetV2 (Lõi)** | **2,37M** | **9,62 MB** | **5,04 ms** | **80,51%** | **91,27%** | **80,36%** | **2.094 / 507** |
| **ResNet50 (Transfer)** | 23,77M | 91,31 MB | 7,10 ms | 83,35% | 93,19% | 83,21% | — |
| **EfficientNetB0 (Bổ trợ)** | **4,16M** | **16,69 MB** | **9,61 ms** | **84,47%** | **93,89%** | **84,36%** | **2.197 / 404** |

> **Lý do chọn MobileNetV2 làm mô hình lõi:** Đạt trên 80% Top-1 và 91% Top-3 nhưng chỉ nặng `9,62 MB` (nhỏ hơn `9,5×` so với ResNet50 và nhanh hơn `~1,79×` trên CPU 1-Crop so với EfficientNetB0: `605,62 ms` vs `1.081,38 ms`).

### 2.3. Nâng cấp thực nghiệm ngoại tuyến theo góp ý GVHD: Tăng cường 48 loài yếu (`aug48` — Colab T4)

*(Số liệu thực nghiệm ngoại tuyến nằm ở phần mở rộng GitHub / Excel tổng hợp 7 sheet `Bao_Cao_Tong_Hop_Mo_Hinh_AI_Day_Du.xlsx`, ngoài bảng gốc báo cáo Word; không trộn 50/50 vào luồng suy luận trực tiếp trên điện thoại)*

| Mô hình | Top-1 Trước | Top-1 Sau | Δ Top-1 | Top-3 Sau | Weighted F1 | Loài F1 < 60% | 48 loài ưu tiên |
|---|---:|---:|---:|---:|---:|---:|---|
| **MobileNetV2 (`aug48`)** | 70,39% | **79,16%** | **+8,77%** | **90,77%** | **79,28%** | 28 → **11** | **40/48** tăng F1 (TB **+11,88%**) |
| **EfficientNetB0 (`aug48`)** | 76,87% | **81,69%** | **+4,82%** | **92,78%** | **81,57%** | 28 → **5** | **42/48** tăng F1 (TB **+14,57%**) |

---

## 🔍 3. TRA CỨU NHANH CÁC LOÀI ĐỈNH & LOÀI DỄ NHẦM (BẢNG 3.7 — SEED 999, 2.601 ẢNH)

### Nhóm nhận diện rất cao (Top F1)
- **Hoa thủy tiên (*Daffodils*):** `41/43` (Recall `95,35%`, F1 **`96,47%`**) — hoa vàng hình kèn rất đặc trưng.
- **Trường sinh dưa hấu (*Peperomia argyreia*):** `23/24` (F1 **`95,83%`**) — vân sọc bạc trên lá tròn ổn định.
- **Trạng nguyên (*Poinsettia*):** `33/33` (Recall **`100,00%`**, F1 **`95,65%`**) — lá bắc đỏ nổi bật.
- **Linh lan (*Lily of the valley*):** `41/42` (Recall `97,62%`, F1 **`95,35%`**).

### Nhóm dễ nhầm lẫn hình thái (Loài yếu — cần biết cách giải thích sinh học)
1. **Cây sống đời (*Kalanchoe*):** `7/16` đúng (Recall `43,75%`, F1 `51,85%`) — nhầm sang Ngọc bích (`2`), Hoa lan (`2`), Xương rồng Giáng sinh (`2`) do cùng đặc trưng lá mọng nước/cụm hoa nhỏ. *(Trên EfficientNetB0 cải thiện mạnh `+0,3847` F1).*
2. **Sanh bonsai (*Ficus microcarpa*):** `13/26` đúng (Recall `50,00%`, F1 `57,78%`) — nhầm nhiều nhất sang **Si (`5`)**, Ngũ gia bì (`3`), Đa búp đỏ (`1`) vì Sanh và Si cùng chi *Ficus*, lá bầu dục bóng và thân bonsai rất giống nhau.
3. **Ngân hậu Siam (*Aglaonema*):** `16/28` đúng (Recall `57,14%`, F1 `58,18%`) — nhầm sang Vạn niên thanh *Dieffenbachia* (`3`), Bàng Singapore (`2`) do họa tiết đốm lá tương đồng.
4. **Trầu bà lỗ (*Monstera adansonii*):** `15/29` đúng (Recall `51,72%`, F1 `58,82%`) — nhầm nhiều nhất sang **Trầu bà đuôi rồng (`7`)** và *Monstera deliciosa* (`2`) do cùng họ Ráy (*Araceae*) có lá xẻ/đục lỗ.
5. **Trúc đốm (*Dracaena surculosa*):** `12/23` đúng (Recall `52,17%`, F1 `61,54%`) — nhầm sang Ngũ gia bì (`3`), Si (`2`), Vạn niên thanh (`2`).

---

## 🛡️ 4. TRẢ LỜI TRUNG THỰC VỀ HẠN CHẾ (KHỚP MỤC 4.1.2 BÁO CÁO)

Khi hội đồng hỏi *"Đề tài em còn hạn chế gì?"*, trả lời thẳng thắn 4 điểm đúng như Mục 4.1.2 (tạo ấn tượng khoa học rất tốt):
1. **Đa seed & đánh giá Ensemble trên tập Test chuẩn:** Do giới hạn GPU Colab và mỗi seed chia tập Train/Val/Test khác nhau, `EfficientNetB0`, `ResNet50` và `Custom CNN` mới chạy 1 lần tại Seed 999; tổ hợp Ensemble 3 seed MobileNetV2 chưa đánh giá sạch trên cùng một tập Test độc lập 2.601 ảnh (phép kiểm định McNemar và FRR `2,36%` hiện đo in-sample trên 212 ảnh cục bộ).
2. **Phát hiện OOD Lớp #91 còn bỏ sót loài gần họ:** Tỷ lệ từ chối 129 ảnh lạ đạt `75,19%`, nhưng các loài có tán lá gần họ như **Cây lược vàng (`12/26 = 46,15%`)**, Cây nguyệt quế (`0/5`) hay Trầu tỉ phú Burle Marx (`0/3`) vẫn dễ rơi vào lớp gần nhất; ngưỡng `0,55` chọn theo khảo sát thực nghiệm chứ chưa tối ưu trên tập validation OOD tách biệt.
3. **Độ trễ trên CPU & thiết bị thật:** Trên CPU không GPU, 4-Model Ensemble + 8-Crop TTA tốn `5,78 giây` (đơn cây) và `9,21 giây` (đa cây); đề tài chưa đo định lượng độ trễ end-to-end trực tiếp trên nhiều mẫu điện thoại Android (đó cũng là lý do bản demo triển khai thuần 1 mô hình lõi `MobileNetV2-TuSo0-Seed999` gọn nhẹ hơn trên CPU).
4. **CSDL & triển khai thực tế:** Thiết kế chuẩn hóa **15 bảng PDM** (PowerDesigner / SQL Server 2017 — 1.438 dòng mẫu, 17 khóa ngoại) và runtime SQLite **16 bảng** (bổ sung bảng/cột cho Active Learning và vận hành ứng dụng); các phương thức thanh toán trực tuyến (MoMo/VietQR) ở mức mô phỏng quy trình nghiệp vụ.

---

## 🎬 5. KỊCH BẢN DEMO AN TOÀN (5 PHÚT)

1. **Mở terminal / `/health` trước (30 giây):** Chứng minh Backend FastAPI sống và minh bạch mô hình triển khai (`ensemble_count: 1`, `MobileNetV2-TuSo0-Seed999-80.5`, hỗ trợ hot-reload `best_model_online.keras`).
2. **Demo nhận diện Đơn cây (1 phút):** Chụp/tải ảnh 1 loài rõ nét (ví dụ Trạng nguyên, Trường sinh dưa hấu hoặc Lưỡi hổ) → cho thấy Top-3 gợi ý, độ tin cậy, đặc điểm nhận dạng & link mua chậu cây tương ứng.
3. **Demo nhận diện Ngoài danh mục — Lớp #91 (45 giây):** Tải ảnh 1 vật/loài lạ (ví dụ Hoa chiều tím / vật dụng ngoài cây) → hệ thống cảnh báo ngoài 90 loài.
4. **Demo Nhận diện Đa cây + Active Learning (1 phút 30 giây):** Tách nhiều chậu bằng `YOLOv8n + OpenCV`; nhấn chấm Đúng/Sai trên kết quả → chuyển sang tab **Admin → AI Vision** xem phản hồi vừa ghi nhận.
5. **Demo Luồng E-Commerce + CSDL (1 phút 15 giây):** Đặt hàng (hỗ trợ cả khách vãng lai & tài khoản đăng nhập có xác thực JWT, kiểm tra tồn kho transaction rollback), quản trị đơn hàng & thống kê doanh thu.
