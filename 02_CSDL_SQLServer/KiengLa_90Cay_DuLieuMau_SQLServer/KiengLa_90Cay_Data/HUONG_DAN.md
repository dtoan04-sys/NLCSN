# Dữ liệu mẫu 90 lớp cây — ChuanPDM

Gói được tạo từ `ChuanPDM.pdm`, đích Microsoft SQL Server 2017. Có 15 bảng, 1.438 dòng. Mọi bảng ít nhất 50 dòng, riêng NGUOI_DUNG có 10 dòng (1 admin, 9 khách hàng).

## Cách chạy trong SQL Server Management Studio (SSMS)

1. Giải nén gói này. Mở SSMS và kết nối SQL Server.
2. Tạo/chọn một database bài tập mới, ví dụ `KiengLa_Demo90`. Chọn đúng database trong thanh công cụ trước khi bấm Execute/F5; không dùng master.
3. Nếu database **chưa có bảng**: chạy `00_TaoBang_TheoPDM_Unicode.sql`, rồi `02_DuLieuMau_90Cay.sql`. Bỏ qua file 01 vì file 00 đã dùng Unicode.
4. Nếu database **đã có đủ 15 bảng sinh từ PDM nhưng các bảng còn rỗng**: chạy `01_ChuyenCotChu_Unicode.sql`, rồi `02_DuLieuMau_90Cay.sql`. Bỏ qua file 00.
5. Chạy `03_KiemTra_SauNhap.sql`: kết quả đầu là số dòng từng bảng; các truy vấn tìm lỗi tiếp theo phải trả 0 dòng.

Mỗi file mở bằng File > Open > File trong SSMS; chọn database rồi F5. Các script chạy trong transaction và báo lỗi nếu nhập vào các bảng đã có dữ liệu, không xóa dữ liệu cũ. Khi cần thử lại, dùng database bài tập mới; không bấm lại file 02 trên database đã nhập.

Nếu báo thiếu bảng/cột, đối chiếu database có đúng bản `ChuanPDM.pdm` này không. Các script dùng schema `dbo`. Nếu báo thiếu quyền ALTER, cần dùng tài khoản có quyền chỉnh các bảng trong database bài tập. File SQL là UTF-8 có BOM để hỗ trợ tên tiếng Việt khi mở bằng SSMS.

## Thông tin cây và nhãn mô hình

- Đủ tên khoa học, tên Việt gợi ý, đặc điểm nhận dạng, vùng xuất xứ, hướng dẫn chăm sóc và giá tham khảo cho 90 dòng LOAI_CAY.
- Giữ thứ tự 90 nhãn bạn đã gửi: **MALOAICAY = CLASS_ID + 1**. Ví dụ class 0 -> MALOAICAY 1; class 37 Trúc đốm -> MALOAICAY 38; class 89 -> MALOAICAY 90.
- `AnhXa_Model_90Lop.json` nối nhãn tiếng Anh trong model với MaLoaiCay và tên Việt. Trước khi dùng trong ứng dụng, so sánh original_label với đúng class_names.json của model đang tải; không sắp xếp lại theo tên Việt.
- 90 dòng là **90 lớp của mô hình**, không khẳng định là 90 loài sinh học độc lập. Orchid, Ctenanthe, Chrysanthemum, Kalanchoe, Schefflera, Snake plant, Peace lily, Tulip, Yucca và Narcissus có nhãn nhóm; chưa đủ thông tin để gán một loài. Các tên cũ như Saintpaulia, Calathea, Senecio được giữ để tương thích, kèm ghi chú.
- Nhãn Heartleaf Philodendron (Philodendron cordatum) có nguy cơ chồng lấn P. hederaceum; Siam là tên giống/thương mại cần kiểm tra ảnh. Không tự thay nhãn training dựa vào bảng thông tin này.
- `ThongTin_90Cay_VaNguon.json` và `ThongTin_90Cay.html` có nguồn từng hồ sơ. Nguồn dùng NC State Extension Plant Toolbox, Kew Plants of the World Online và Flora of China. Một số nguồn ở cấp chi hoặc loài đại diện, phạm vi đó được ghi rõ. Nội dung là bản tóm tắt, không phải xác nhận toàn bộ ảnh training.
- Chăm sóc cần điều chỉnh theo loài/giống thực tế, khí hậu và giá thể. Tên Việt là tên gợi ý, có thể khác theo địa phương.

## Phần dữ liệu giả lập

Giá (VNĐ), tồn kho, tài khoản, địa chỉ, số điện thoại, giảm giá, đơn hàng, bình luận và điểm nhận diện là dữ liệu mẫu. Giá không phải giá thị trường được khảo sát. Tất cả đường dẫn `assets/demo/...` là chỗ giữ ảnh; **gói không chứa ảnh cây thật**, không dùng để train nhận diện.

Tài khoản dùng email example.com, số điện thoại mẫu bắt đầu 000, trạng thái Khoa. MATKHAU là placeholder không đăng nhập được; muốn thử đăng nhập phải tạo mật khẩu băm bằng cơ chế của ứng dụng và mở khóa tài khoản mẫu tương ứng. Những đơn đã có là lịch sử giả lập.

50 danh mục là phân nhóm thử nghiệm để đáp ứng yêu cầu ít nhất 50 dòng, không phải hệ thống phân loại thực vật chính thức. Có thể tinh gọn khi xây cửa hàng thật.

## Logic được giữ đúng PDM

- Giữ tên cột `TENMAGIAMGIA`, `SOLUONGPHIEU`, `XACSUATCHINHXAC` hiện có; không tự đổi tên trong file PDM.
- Giữ 3 khóa ghép của CHI_TIET_GIO_HANG, KET_QUA_NHAN_DIEN và LICH_SU_GIA_SAN_PHAM. Tất cả 17 khóa ngoại có dữ liệu cha trước dữ liệu con.
- Mỗi đơn dùng đúng một giỏ đã chốt và đúng chủ giỏ; có tối đa một chương trình giảm giá. DON_HANG.MAGIOHANG không lặp lại.
- Theo quan hệ CoDanhGia 0..1 trong PDM, mỗi đơn mẫu có một đánh giá cho một sản phẩm thực sự nằm trong đơn. Nếu sau này cho đánh giá từng sản phẩm trong cùng đơn, cần đổi quan hệ này trước.
- Mỗi sản phẩm có hai ảnh mẫu và hai khoảng giá tháng 9/tháng 10, chỉ một ảnh chính. Giá dùng khoảng **[bắt đầu, kết thúc)**; NULL ngày kết thúc nghĩa là còn hiệu lực, không chồng lấn trong dữ liệu mẫu.
- DonGiaBan lưu giá khi chốt; tổng tiền bằng tổng số lượng nhân đơn giá, trừ tiền giảm, cộng phí giao. Địa chỉ và số điện thoại nhận hàng là bản chép tại thời điểm đặt.
- Giỏ DaChot phải được ứng dụng khóa chỉnh sửa. Không có bảng CHI_TIET_DON_HANG vì thiết kế hiện dùng chi tiết giỏ để lưu hàng đã mua.

File 00 dựng lại 15 bảng và PK/FK theo thông tin PDM, thêm UNIQUE cho hai quan hệ 0..1; dùng nvarchar cho Unicode và decimal(18,0) đúng mặc định decimal của SQL Server. Đây là script tạo nhanh database mẫu, không thay thế một lần sinh DDL đầy đủ trong PowerDesigner (ví dụ index/trigger/thiết lập riêng ngoài PK/FK).

## Kiểm tra đã thực hiện

Đã kiểm tra bằng Python và bản mô phỏng quan hệ SQLite: khóa chính/khóa ngoại, khóa ghép, số dòng, độ dài cột, giỏ của người đặt, sản phẩm được đánh giá nằm trong đơn, đơn giá đúng khoảng hiệu lực, tổng tiền, điều kiện giảm giá, số lượt dùng, top-3 hợp lệ, ảnh chính và địa chỉ mặc định. Các câu lệnh CREATE/ALTER/INSERT còn được phân tích cú pháp T-SQL bằng SQLGlot.

Chưa chạy toàn bộ script trên một SQL Server thật trong môi trường này. File 03 giúp kiểm tra sau khi bạn nhập vào SQL Server. Báo cáo chi tiết: `BaoCao_KiemTra.json`.

## Số dòng từng bảng

| Bảng | Số dòng |
|---|---:|
| NGUOI_DUNG | 10 |
| DANH_MUC | 50 |
| CHUONG_TRINH_GIAM_GIA | 50 |
| THOI_DIEM | 180 |
| TIM_ANH | 60 |
| LOAI_CAY | 90 |
| GIO_HANG | 69 |
| DIA_CHI_NGUOI_DUNG | 50 |
| SAN_PHAM | 90 |
| KET_QUA_NHAN_DIEN | 180 |
| DON_HANG | 60 |
| CHI_TIET_GIO_HANG | 129 |
| HINH_ANH_SAN_PHAM | 180 |
| DANH_GIA_SAN_PHAM | 60 |
| LICH_SU_GIA_SAN_PHAM | 180 |

Tổng cộng: **1.438 dòng**. `DuLieu_15Bang.json` chứa cùng dữ liệu để đọc hoặc sử dụng bằng chương trình, không cần nhập JSON để chạy SQL.
