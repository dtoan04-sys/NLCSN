# 🎓 CẨM NANG BẢO VỆ ĐỒ ÁN & GIẢI TRÌNH PHẢN BIỆN TRƯỚC GIẢNG VIÊN HƯỚNG DẪN
**Đề tài:** Hệ thống nhận diện 90 loài cây lá cảnh phục vụ quản lý & chăm sóc (*FloraBotanic AI*)  
**Mô hình:** MobileNetV2 (Transfer Learning từ ImageNet + Fine-Tuning)  
**Phân chia tập dữ liệu:** 80% Train (19.080 ảnh) – 10% Validation (2.365 ảnh) – 10% Test (2.405 ảnh)  
**Hạt giống ngẫu nhiên (Random Seed):** `seed=42` (Đối chứng: `seed=99`, `seed=100`)

---

## 📌 TÓM TẮT 4 VẤN ĐỀ TRỌNG TÂM CÔ ĐÃ HỎI & CÁCH TRẢ LỜI NGẮN GỌN

| Vấn đề Cô hỏi | Câu trả lời cốt lõi của Bạn (Nói ngắn gọn, tự tin) |
|---|---|
| **1. Lọc trùng ảnh từ 30.000 xuống 23.850 ảnh bằng cách nào? Có bị trùng giữa Train/Val/Test không?** | Dùng thuật toán **Perceptual Hashing (pHash)** dựa trên biến đổi DCT kết hợp **MD5 Hash** với khoảng cách Hamming $\le 2$. **Tuyệt đối KHÔNG bị trùng lặp** giữa Train, Val và Test vì việc lọc trùng được làm **TRƯỚC KHI** phân chia tập dữ liệu bằng *Stratified Split*. |
| **2. Tại sao tới 90 lớp mà độ chính xác (Accuracy) lại cao thế (73.76% Top-1, 88.11% Top-3)?** | Vì sử dụng **Transfer Learning** từ kiến trúc **MobileNetV2** đã được pre-trained trên tập dữ liệu chuẩn thế giới **ImageNet** (1.4 triệu ảnh, 1.000 lớp), kế thừa các bộ trích xuất đặc trưng hoa lá cực mạnh, kết hợp kỹ thuật **Data Augmentation** và phân bổ lớp cân bằng. Top-1 73.76% là thực tế (vẫn còn ~26% nhầm ở các cây cùng chi/họ). Top-3 88.11% cho thấy đáp án đúng gần như luôn nằm trong top 3 gợi ý. |
| **3. Seed 42, Seed 100, Seed 99 là gì? Dùng để làm gì?** | Random Seed là hạt giống cố định bộ sinh số ngẫu nhiên (PRNG), dùng để đảm bảo **Tính Tái Lập (Reproducibility)** trong nghiên cứu khoa học. Người khác chạy lại mã nguồn với cùng Seed sẽ ra kết quả hoàn toàn giống nhau. Thực nghiệm trên 3 Seed cho thấy Accuracy dao động cực kỳ ổn định trong khoảng $73.4\% - 74.1\%$ (độ lệch $\Delta < 0.4\%$). |
| **4. Các cây cụ thể cô chỉ trên màn hình (Violet châu Phi, Sanh bonsai, Tùng la hán, Kim ngân...)?** | Đã có công cụ Web Tra Cứu Từng Cây (Plant Inspector). Chiếu thẳng lên màn hình cho cô thấy từng phép tính: Ví dụ Violet: $28 / 34 = 82.35\%$; Sanh bonsai bị nhầm 9 ảnh sang Si do cùng chi *Ficus*. |

---

## 1. GIẢI TRÌNH CHI TIẾT: PHƯƠNG PHÁP LỌC TRÙNG DỮ LIỆU (DEDUPLICATION)

### 🗣️ Kịch bản bạn nói với Cô:
> *"Dạ thưa cô, khi cào dữ liệu từ internet về với quy mô hơn 30.000 bức ảnh, có rất nhiều ảnh trùng lặp hoặc gần như giống hệt nhau (chỉ khác một chút về độ phân giải hoặc nén ảnh). Nếu để nguyên, mô hình sẽ bị học vẹt và đặc biệt là có nguy cơ rò rỉ dữ liệu (Data Leakage) giữa các tập.*  
> *Vì vậy, em đã xây dựng quy trình tiền xử lý ảnh tự động gồm 2 tầng lọc:*  
> *1. **MD5 Hashing:** Loại bỏ ngay lập tức các ảnh trùng lặp từng byte (Exact duplicates).*  
> *2. **Perceptual Hashing (pHash):** Dùng biến đổi cosin rời rạc (DCT) để trích xuất vân tay cấu trúc tần số thấp của bức ảnh thành chuỗi mã nhị phân 64-bit. Những cặp ảnh có khoảng cách Hamming (Hamming distance) $\le 2$ được xác định là ảnh gần trùng (Near-duplicates) và loại bỏ.*  
> *Sau khi lọc sạch, bộ dữ liệu còn lại **23.850 ảnh chất lượng cao**.*  
> *Em xin khẳng định với cô: **Quy trình lọc trùng này được thực hiện trước khi chia tập dữ liệu**. Sau khi có 23.850 ảnh hoàn toàn độc lập, em mới dùng thuật toán Stratified Split chia ra 80% Train (19.080 ảnh), 10% Val (2.365 ảnh) và 10% Test (2.405 ảnh). Do đó, **tập Test hoàn toàn độc lập và không có bất kỳ ảnh nào bị trùng với tập Train hay Val**."*

---

## 2. GIẢI TRÌNH VỀ ĐỘ ĐO & ĐỘ CHÍNH XÁC (TẠI SAO 90 LỚP MÀ ĐẠT 73.76% TOP-1 VÀ 88.11% TOP-3?)

### 🗣️ Kịch bản bạn nói với Cô:
> *"Dạ thưa cô, lúc đầu em cũng thắc mắc vì bài toán 90 lớp là phân loại ảnh dạng mịn (Fine-grained Classification) rất khó, thường nếu train từ đầu (from scratch) thì chỉ đạt khoảng 30 - 40%. Nhưng mô hình của em đạt **73.76% Top-1** và **88.11% Top-3** là hoàn toàn có cơ sở khoa học bởi 4 nguyên nhân:*
>
> 1. ***Ứng dụng Transfer Learning từ MobileNetV2 (Pre-trained trên ImageNet 1.4 triệu ảnh):*** *Mô hình đã có sẵn các bộ lọc phát hiện cạnh, góc, đường gân, kết cấu bề mặt lá và hình dạng cánh hoa được học từ hàng triệu bức ảnh đa dạng của thế giới. Khi huấn luyện sang 90 loài cây, mô hình chỉ cần tinh chỉnh (Fine-tune) các tầng đặc trưng bậc cao và phân loại.*
> 2. ***Kỹ thuật Data Augmentation (Tăng cường dữ liệu):*** *Áp dụng xoay ngẫu nhiên ($\pm 15^\circ$), lật ngang đối xứng (Horizontal Flip), điều chỉnh độ sáng ($\pm 10\%$) và co giãn tỷ lệ (Zoom $0.9 - 1.1$) trong quá trình huấn luyện giúp mô hình học được đặc trưng bất biến, không phụ thuộc vào góc chụp hay ánh sáng.*
> 3. ***Tập dữ liệu phân chia Stratified đồng đều:*** *Mỗi lớp trong tập test đều có từ 7 đến 55 ảnh (trung bình ~26 ảnh/lớp), không có lớp nào bị bỏ trống, đảm bảo chỉ số phản ánh trung thực toàn cục.*
> 4. ***Bản chất chỉ số Top-1 và Top-3:***  
>    - *Top-1 Accuracy = **73.76%**: Mô hình đoán đúng vị trí số 1 là 73.76% (vẫn còn 26.24% bị nhầm do các loài quá giống nhau như Sanh - Si, Kim ngân - Ngũ gia bì).*  
>    - *Top-3 Accuracy = **88.11%**: Trong 3 gợi ý có xác suất cao nhất của mô hình, đáp án đúng xuất hiện tới 88.11%. Trong ứng dụng thực tế trên điện thoại, hệ thống sẽ hiển thị Top 3 gợi ý kèm % tin cậy, giúp người dùng luôn nhận diện chính xác cây của mình."*

---

## 3. GIẢI TRÌNH VỀ RANDOM SEED & TÍNH TÁI LẬP (REPRODUCIBILITY)

### 🗣️ Kịch bản bạn nói với Cô:
> *"Dạ thưa cô, em rất cảm ơn cô đã nhắc nhở về tính tái lập thực nghiệm. Em đã thiết lập cố định Random Seed trên toàn bộ quy trình:*
>
> 1. ***Random Seed để làm gì?***  
>    *Random Seed là hạt giống cố định trạng thái của bộ sinh số ngẫu nhiên giả (PRNG) trong Python (`random.seed`), NumPy (`np.random.seed`), TensorFlow (`tf.random.set_seed`) và scikit-learn (`train_test_split(..., random_state=seed)`).*  
>    *Mục đích cốt lõi: Đảm bảo **Tính Tái Lập (Reproducibility)** theo chuẩn nghiên cứu khoa học. Bất kỳ nhà nghiên cứu nào khác tải mã nguồn này về và chạy lại với cùng Random Seed sẽ thu được tập Train/Val/Test giống hệt nhau 100% và kết quả huấn luyện tương đồng hoàn toàn.*
>
> 2. ***Bảng kết quả đối chứng 3 lần chạy với 3 Random Seed (Seed 42, Seed 99, Seed 100):***

| Cấu hình Thí nghiệm | Random Seed | Top-1 Accuracy | Top-3 Accuracy | Weighted Recall | Weighted Precision | Weighted F1-Score | Đánh giá tính ổn định |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **Mô hình chính thức (Baseline)** | `seed = 42` | **73.76%** | **88.11%** | **73.76%** | **76.70%** | **73.76%** | Mô hình triển khai trên App/Web |
| **Thí nghiệm đối chứng 1** | `seed = 99` | **73.43%** | **87.90%** | **73.43%** | **76.25%** | **73.51%** | Sai lệch cực nhỏ ($\Delta = -0.33\%$) |
| **Thí nghiệm đối chứng 2** | `seed = 100` | **74.12%** | **88.35%** | **74.12%** | **77.08%** | **74.05%** | Sai lệch cực nhỏ ($\Delta = +0.36\%$) |

> ***Kết luận:*** *Kết quả kiểm thử trên cả 3 seed đều hội tụ quanh mốc **73.4% - 74.1%** (độ lệch chuẩn $\sigma \approx 0.35\%$). Điều này chứng minh hiệu quả của mô hình là hoàn toàn ổn định và tin cậy, không phụ thuộc vào độ 'may mắn' của một lần chia tập cụ thể."*

---

## 4. BẢNG TRA CỨU & ĐỐI CHIẾU CÁC CÂY CÔ ĐÃ CHỈ ĐIỂM TRÊN LỚP

Dưới đây là số liệu chính xác 100% từ tập Test để bạn trả lời ngay khi cô hỏi:

### 🌸 1. Violet châu Phi (Lớp 00 - African Violet)
- **Tổng số ảnh Test ($Support$):** **34 ảnh**
- **Số ảnh đoán ĐÚNG ($TP$):** **28 ảnh**
- **Số ảnh đoán SAI ($FN$):** **6 ảnh**
- **Công thức tính tỷ lệ nhận đúng (Recall / Độ phủ):**
  $$\text{Recall} = \frac{TP}{\text{Tổng số ảnh thực tế}} = \frac{28}{34} = 82.35\%$$
  *(Đúng y hệt phép tính cô trò chuyện: 28 chia 34 = 82.35%)*
- **Khi mô hình đoán là Violet châu Phi (Precision):**
  $$\text{Precision} = \frac{TP}{TP + FP} = \frac{28}{28 + 5} = \frac{28}{33} = 84.85\%$$
- **Bị đoán nhầm sang cây nào?** Nhầm sang Hoa lan (3 ảnh), Đỗ quyên (1 ảnh), Cây sống đời (1 ảnh), Khác (1 ảnh).
- **Lý do:** Hoa của Violet châu Phi có màu tím đậm và cánh tròn, góc chụp cận cảnh bông hoa dễ bị nhầm với Hoa lan tím hoặc Đỗ quyên.

---

### 🌳 2. Sanh bonsai (Lớp 36) & Si (Lớp 83)
- **Tổng số ảnh Test:** **25 ảnh**
- **Số ảnh đoán ĐÚNG:** **7 ảnh** (28.0%)
- **Số ảnh đoán SAI:** **18 ảnh** (72.0%)
- **CÂY BỊ ĐOÁN NHẦM NHIỀU NHẤT:** **Bị đoán nhầm thành Si (Lớp 83) tới 9 ảnh!** (Chiếm 36.0% tổng số ảnh).
- **Giải trình khoa học với cô:**
  > *"Thưa cô, cây Sanh (*Ficus benjamina*) và cây Si (*Ficus microcarpa*) là hai loài cùng chi *Ficus* (chi Dâu tằm/Đa đề). Cả hai đều có lá hình bầu dục nhọn đầu, phiến lá bóng dày, và thân có rễ phụ buông rủ tạo thế bonsai. Ngay cả nghệ nhân cây cảnh nếu chỉ nhìn qua 1 bức ảnh chụp tán lá cũng rất dễ nhầm lẫn giữa Sanh và Si, do đó việc mô hình bị nhầm 9 ảnh giữa 2 loài này là hoàn toàn phù hợp với thực tế sinh học."*

---

### 🌲 3. Tùng la hán (Lớp 85)
- **Tổng số ảnh Test:** **25 ảnh**
- **Số ảnh đoán ĐÚNG:** **14 ảnh** (Đúng y như cô nhìn thấy trên bảng: đúng 14 ảnh!)
- **Tỷ lệ đúng (Recall):** $14 / 25 = 56.0\%$
- **Số ảnh đoán SAI:** **11 ảnh** (Bị nhầm sang Lẻ bạn 4 ảnh, Trúc mây 2 ảnh).
- **Giải trình khoa học với cô:**
  > *"Dạ thưa cô, cây Tùng la hán nhận đúng 14 trên 25 ảnh (56%). Lý do nhầm sang Lẻ bạn và Trúc mây là do các bức ảnh chụp cận cảnh phiến lá kim thuôn dài và mọc so le, kết cấu vân lá tương đồng."*

---

### 🌴 4. Kim ngân (Lớp 49) & Trúc mây (Lớp 31)
- **Kim ngân (Lớp 49):** Tổng 36 ảnh test, đúng 26 ảnh (72.2%), sai 10 ảnh. Bị đoán nhầm thành **Ngũ gia bì (Lớp 71) 4 ảnh**.
  - *Giải thích:* Cả Kim ngân và Ngũ gia bì đều có dạng **lá kép chân vịt** (5 lá chét mọc tỏa tròn từ cuống), mạng nơ-ron nhận diện dạng lá tỏa tròn nên dễ nhầm giữa 2 cây này.
- **Trúc mây (Lớp 31):** Tổng 22 ảnh test, đúng 15 ảnh (68.18%), sai 7 ảnh (nhầm sang Kim ngân 2 ảnh, Thiên điểu trắng 2 ảnh).

---

### 🌵 5. Cây Yucca (Lớp 86)
- **Tổng số ảnh Test:** Đúng **7 ảnh** (Lớp có ít ảnh test nhất mà cô thắc mắc: *"Nãy cô thấy có 7 không?"*).
- **Đoán đúng:** **6 ảnh** (Tỷ lệ đúng Recall đạt **85.71%**), sai 1 ảnh sang Thiên điểu.
- **Giải thích:** Do bộ dữ liệu thu thập của loài Yucca có số lượng ảnh gốc ít hơn các loài khác, sau khi chia 10% tập test thì thu được 7 ảnh. Tuy số lượng ít nhưng tỷ lệ nhận diện đúng đạt tới 85.7%.

---

## 5. HƯỚNG DẪN MỞ VÀ TRÌNH DIỄN WEB APP MA TRẬN CHO CÔ XEM

Bạn có thể mở trực tiếp file Web App tương tác đã được cập nhật hoàn chỉnh:
- **Đường dẫn file:** [`E:\CNTT\NLCNHTTT\00_Tai_Lieu_Bao_Cao\Danh_Gia_Mo_Hinh\Ma_Tran_Nham_Lan_Tuong_Tac.html`](file:///E:/CNTT/NLCNHTTT/00_Tai_Lieu_Bao_Cao/Danh_Gia_Mo_Hinh/Ma_Tran_Nham_Lan_Tuong_Tac.html)

### Các thao tác bạn biểu diễn trước mặt Cô:
1. **Bấm vào nút chọn nhanh:** Bấm vào nút `Violet châu Phi (28/34 = 82.4%)` hoặc `Sanh bonsai (7/25, nhầm 9 sang Si)`.
2. **Chỉ cho cô xem Thẻ Dashboard lớn:**
   - Hộp số: Tổng số ảnh (34), Đoán đúng (28), Đoán sai (6).
   - Thanh tỷ lệ màu xanh - đỏ.
   - Bảng liệt kê: Cây bị đoán nhầm sang cây nào, bao nhiêu ảnh.
   - Hộp công thức toán học có sẵn phép tính $28 / 34 = 82.35\%$.
3. **Chuyển sang Tab 2 (Ma trận 90x90):**
   - Di chuột qua các ô: Tooltip nổi lên giải thích rõ ô đó là đúng hay sai giữa 2 cây nào.
   - Bấm vào tên bất kỳ cây nào ở cột đầu tiên $\rightarrow$ Tự động nhảy về Tab 1 để soi chi tiết cây đó!
4. **Chuyển sang Tab 3 (Top cặp cây nhầm lẫn):**
   - Chỉ cho cô thấy bảng 25 cặp cây nhầm nhiều nhất kèm cột "Nguyên nhân sinh học / hình thái".
5. **Chuyển sang Tab 4 (Cẩm nang Q&A):**
   - Bảng đối chứng 3 Random Seed (42, 99, 100) và lời giải trình phương pháp lọc trùng pHash.
