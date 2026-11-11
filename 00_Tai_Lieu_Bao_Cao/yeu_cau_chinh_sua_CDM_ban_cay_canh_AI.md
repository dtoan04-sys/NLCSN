# YÊU CẦU CHỈNH SỬA VÀ VẼ LẠI CDM

## Hệ thống bán cây cảnh tích hợp nhận diện bằng hình ảnh (AI Vision)

> **Mục tiêu:** Dùng nội dung này làm yêu cầu đầu vào cho AI vẽ lại
> CDM.\
> **Kiến trúc bắt buộc:** Single-Store (một cửa hàng duy nhất), không
> phải Marketplace nhiều người bán.\
> **Yêu cầu:** Giữ mô hình gọn, đúng nghiệp vụ, thể hiện rõ cardinality
> và không tự ý thêm các bảng ngoài phạm vi.

------------------------------------------------------------------------

## 1. Những phần của sơ đồ hiện tại được GIỮ NGUYÊN

Giữ 12 thực thể chính:

1.  `NGUOI_DUNG`
2.  `DANH_MUC`
3.  `LOAI_CAY`
4.  `LICH_SU_TIM_ANH`
5.  `KET_QUA_NHAN_DIEN`
6.  `SAN_PHAM`
7.  `HINH_ANH_SAN_PHAM`
8.  `GIO_HANG`
9.  `CHI_TIET_GIO_HANG`
10. `DON_HANG`
11. `CHI_TIET_DON_HANG`
12. `DANH_GIA_SAN_PHAM`

**Không thêm bảng `CUA_HANG`.**

------------------------------------------------------------------------

# 2. Các chỉnh sửa cần thực hiện

## SỬA 1 --- Quan hệ NGUOI_DUNG và GIO_HANG

### Hiện tại

Sơ đồ đang thể hiện gần như:

``` text
NGUOI_DUNG 1 ----- 1 GIO_HANG
```

### Chỉnh thành

``` text
NGUOI_DUNG 1 ----- 0..1 GIO_HANG
```

### Ý nghĩa

-   Một người dùng có thể chưa có giỏ hàng nếu chưa từng thêm sản phẩm.
-   Một người dùng có tối đa một giỏ hàng hoạt động.
-   Khi người dùng thêm sản phẩm lần đầu, hệ thống có thể tạo giỏ hàng.

Nếu hệ thống triển khai theo hướng tạo giỏ ngay khi đăng ký tài khoản
thì có thể dùng 1--1, nhưng **CDM đề xuất sử dụng 1--0..1** để linh hoạt
hơn.

------------------------------------------------------------------------

## SỬA 2 --- Loại bỏ dữ liệu ảnh đại diện bị trùng

Hiện tại:

`SAN_PHAM` có:

``` text
HinhAnhDaiDien
```

Trong khi `HINH_ANH_SAN_PHAM` đã có:

``` text
UrlAnh
LaAnhChinh
```

Hai cách này bị trùng chức năng.

### Chỉnh sửa

**Xóa `HinhAnhDaiDien` khỏi `SAN_PHAM`.**

Sử dụng:

``` text
HINH_ANH_SAN_PHAM.LaAnhChinh = TRUE
```

để xác định ảnh đại diện.

### Sau khi sửa

`SAN_PHAM`:

``` text
MaSanPham
TenSanPham
GiaBan
SoLuongTonKho
KichThuocCay
TinhTrangSucKhoe
MoTaChiTiet
TrangThaiBan
```

`HINH_ANH_SAN_PHAM`:

``` text
MaAnh
UrlAnh
LaAnhChinh
```

Quan hệ:

``` text
SAN_PHAM 1 ----- N HINH_ANH_SAN_PHAM
```

Một sản phẩm có thể có nhiều ảnh, trong đó một ảnh được chọn làm ảnh
chính.

------------------------------------------------------------------------

## SỬA 3 --- Làm rõ cách tính ThanhTien

Trong `CHI_TIET_DON_HANG` giữ:

``` text
SoLuongMua
DonGiaBan
ThanhTien
```

Nhưng phải thể hiện quy tắc nghiệp vụ:

``` text
ThanhTien = SoLuongMua × DonGiaBan
```

`DonGiaBan` là giá sản phẩm tại thời điểm khách đặt hàng và phải được
lưu lại để giá trị đơn hàng lịch sử không thay đổi khi `SAN_PHAM.GiaBan`
thay đổi.

------------------------------------------------------------------------

## SỬA 4 --- Làm rõ cách tính TongTien của DON_HANG

Giữ:

``` text
DON_HANG.TongTien
```

Quy tắc:

``` text
TongTien = tổng ThanhTien của tất cả CHI_TIET_DON_HANG thuộc đơn hàng
```

Không lấy `TongTien` do phía giao diện người dùng tự gửi lên làm giá trị
đáng tin cậy.

------------------------------------------------------------------------

## SỬA 5 --- Chuẩn hóa kiểu dữ liệu tiền khi chuyển sang PDM

CDM có thể tiếp tục thể hiện kiểu dữ liệu khái quát.

Khi chuyển sang PDM/database, các trường tiền:

``` text
SAN_PHAM.GiaBan
LOAI_CAY.GiaThamKhao
DON_HANG.TongTien
CHI_TIET_DON_HANG.DonGiaBan
CHI_TIET_DON_HANG.ThanhTien
```

nên sử dụng:

``` text
DECIMAL(12,2)
```

hoặc nếu hệ thống chỉ lưu tiền Việt Nam theo số nguyên:

``` text
BIGINT
```

**Không sử dụng FLOAT cho dữ liệu tiền tệ.**

------------------------------------------------------------------------

# 3. Module AI phải giữ đúng cấu trúc

Luồng:

``` text
NGUOI_DUNG
     |
     | 0..N
     v
LICH_SU_TIM_ANH
     |
     | 1..N
     v
KET_QUA_NHAN_DIEN
     |
     | N..1
     v
LOAI_CAY
```

### LICH_SU_TIM_ANH

Giữ:

``` text
MaTimKiem
HinhAnhUploadUrl
ThoiGianTimKiem
NenTang
```

Quan hệ với `NGUOI_DUNG` phải cho phép khách vãng lai.

Nghĩa là một bản ghi `LICH_SU_TIM_ANH` có thể:

``` text
0..1 NGUOI_DUNG
```

nhưng một người dùng có thể có:

``` text
0..N LICH_SU_TIM_ANH
```

------------------------------------------------------------------------

## KET_QUA_NHAN_DIEN

Giữ:

``` text
MaKetQua
ThuHang
XacSuatChinhXac
```

Một lần tìm ảnh có thể trả về nhiều kết quả:

``` text
Top 1 -> Loại cây A -> 94%
Top 2 -> Loại cây B -> 4%
Top 3 -> Loại cây C -> 2%
```

Quan hệ:

``` text
LICH_SU_TIM_ANH 1 ----- N KET_QUA_NHAN_DIEN
LOAI_CAY        1 ----- N KET_QUA_NHAN_DIEN
```

Không lưu tên loại cây trực tiếp trong `KET_QUA_NHAN_DIEN`.

Kết quả nhận diện phải tham chiếu đến `LOAI_CAY`.

------------------------------------------------------------------------

# 4. DANH_MUC và LOAI_CAY

Giữ:

``` text
DANH_MUC 1 ----- N LOAI_CAY
```

`DANH_MUC`:

``` text
MaDanhMuc
TenDanhMuc
HinhAnhDanhMuc
MoTa
```

`LOAI_CAY`:

``` text
MaLoaiCay
TenKhoaHoc
TenThuongGoi
DacDiemNhanDang
XuatXu
HuongDanChamSoc
GiaThamKhao
```

`LOAI_CAY` đóng vai trò:

-   Kho kiến thức thực vật.
-   Nhãn chuẩn/Class Label cho AI.
-   Cầu nối từ kết quả nhận diện sang sản phẩm đang bán.

------------------------------------------------------------------------

# 5. LOAI_CAY và SAN_PHAM

Giữ quan hệ:

``` text
LOAI_CAY 1 ----- N SAN_PHAM
```

Ý nghĩa:

-   Một loại cây có thể có nhiều sản phẩm cụ thể.
-   Mỗi sản phẩm thuộc một loại cây.

Ví dụ:

``` text
LOAI_CAY: Monstera

        |
        +--> Monstera chậu 15 cm
        +--> Monstera chậu sứ trắng
        +--> Monstera cao 80 cm
```

Không thêm `CUA_HANG` vào giữa quan hệ này.

------------------------------------------------------------------------

# 6. Giỏ hàng

Cấu trúc:

``` text
NGUOI_DUNG 1 ----- 0..1 GIO_HANG

GIO_HANG 1 ----- N CHI_TIET_GIO_HANG

SAN_PHAM 1 ----- N CHI_TIET_GIO_HANG
```

`GIO_HANG`:

``` text
MaGioHang
NgayCapNhat
```

`CHI_TIET_GIO_HANG`:

``` text
MaChiTietGio
SoLuongChon
```

Một chi tiết giỏ hàng phải thuộc:

-   một giỏ hàng;
-   một sản phẩm.

------------------------------------------------------------------------

# 7. Đơn hàng

Giữ:

``` text
NGUOI_DUNG 1 ----- N DON_HANG
```

`DON_HANG`:

``` text
MaDonHang
NgayDatHang
TongTien
DiaChiNhanHang
SoDienThoaiNhan
PhuongThucThanhToan
TrangThaiDonHang
```

Một người dùng có thể tạo nhiều đơn hàng.

------------------------------------------------------------------------

# 8. Chi tiết đơn hàng

Giữ:

``` text
DON_HANG 1 ----- N CHI_TIET_DON_HANG

SAN_PHAM 1 ----- N CHI_TIET_DON_HANG
```

`CHI_TIET_DON_HANG`:

``` text
MaChiTietDon
SoLuongMua
DonGiaBan
ThanhTien
```

Quy tắc:

``` text
ThanhTien = SoLuongMua × DonGiaBan
```

------------------------------------------------------------------------

# 9. Đánh giá sản phẩm

Giữ thiết kế hiện tại:

``` text
CHI_TIET_DON_HANG 1 ----- 0..1 DANH_GIA_SAN_PHAM
```

Không nối `DANH_GIA_SAN_PHAM` trực tiếp với `NGUOI_DUNG`.

Không nối `DANH_GIA_SAN_PHAM` trực tiếp với `SAN_PHAM` nếu mục tiêu là
xác minh đánh giá dựa trên sản phẩm thực sự đã mua.

`DANH_GIA_SAN_PHAM`:

``` text
MaDanhGia
SoSao
NoiDungBinhLuan
HinhAnhThucTe
NgayDanhGia
```

Quy tắc:

-   Chỉ sản phẩm thuộc đơn hàng hợp lệ/hoàn thành mới được đánh giá.
-   Một `CHI_TIET_DON_HANG` có tối đa một đánh giá.
-   `SoSao` nằm trong khoảng 1 đến 5.

------------------------------------------------------------------------

# 10. Cardinality cuối cùng cần thể hiện trên sơ đồ

AI khi vẽ lại phải thể hiện rõ:

``` text
NGUOI_DUNG 1 -------- 0..N LICH_SU_TIM_ANH

LICH_SU_TIM_ANH 1 --- 1..N KET_QUA_NHAN_DIEN

LOAI_CAY 1 ---------- 0..N KET_QUA_NHAN_DIEN

DANH_MUC 1 ---------- 0..N LOAI_CAY

LOAI_CAY 1 ---------- 0..N SAN_PHAM

SAN_PHAM 1 ---------- 0..N HINH_ANH_SAN_PHAM

NGUOI_DUNG 1 -------- 0..1 GIO_HANG

GIO_HANG 1 ---------- 0..N CHI_TIET_GIO_HANG

SAN_PHAM 1 ---------- 0..N CHI_TIET_GIO_HANG

NGUOI_DUNG 1 -------- 0..N DON_HANG

DON_HANG 1 ---------- 1..N CHI_TIET_DON_HANG

SAN_PHAM 1 ---------- 0..N CHI_TIET_DON_HANG

CHI_TIET_DON_HANG 1 - 0..1 DANH_GIA_SAN_PHAM
```

> Nếu công cụ vẽ sử dụng ký hiệu Merise/PowerDesigner khác, hãy chuyển
> đúng ý nghĩa cardinality tương ứng.

------------------------------------------------------------------------

# 11. Khi chuyển CDM sang PDM phải sinh đủ FK

CDM có thể thể hiện quan hệ bằng association nên không nhất thiết phải
hiển thị FK như thuộc tính.

Nhưng PDM phải có đầy đủ:

``` text
LOAI_CAY.MaDanhMuc

LICH_SU_TIM_ANH.MaNguoiDung

KET_QUA_NHAN_DIEN.MaTimKiem
KET_QUA_NHAN_DIEN.MaLoaiCay

SAN_PHAM.MaLoaiCay

HINH_ANH_SAN_PHAM.MaSanPham

GIO_HANG.MaNguoiDung

CHI_TIET_GIO_HANG.MaGioHang
CHI_TIET_GIO_HANG.MaSanPham

DON_HANG.MaNguoiDung

CHI_TIET_DON_HANG.MaDonHang
CHI_TIET_DON_HANG.MaSanPham

DANH_GIA_SAN_PHAM.MaChiTietDon
```

Các ràng buộc quan trọng:

``` text
GIO_HANG.MaNguoiDung
```

nên `UNIQUE` nếu mỗi User chỉ có tối đa một giỏ hàng hoạt động.

``` text
DANH_GIA_SAN_PHAM.MaChiTietDon
```

phải `UNIQUE` để một mục hàng đã mua chỉ được đánh giá tối đa một lần.

------------------------------------------------------------------------

# 12. Bố cục sơ đồ mong muốn

Vẽ sơ đồ theo 4 phân hệ để dễ nhìn.

## Phân hệ 1 --- AI Vision

``` text
LICH_SU_TIM_ANH
       |
       v
KET_QUA_NHAN_DIEN
```

Màu tím/xanh tím.

## Phân hệ 2 --- Danh mục và tri thức cây

``` text
DANH_MUC
   |
   v
LOAI_CAY
   |
   v
SAN_PHAM
   |
   v
HINH_ANH_SAN_PHAM
```

Màu xanh lá.

## Phân hệ 3 --- Người dùng

``` text
NGUOI_DUNG
```

Màu xanh dương.

## Phân hệ 4 --- Thương mại điện tử

``` text
GIO_HANG
CHI_TIET_GIO_HANG
DON_HANG
CHI_TIET_DON_HANG
DANH_GIA_SAN_PHAM
```

Màu cam.

Các đường quan hệ nên hạn chế giao nhau và phải dễ đọc.

------------------------------------------------------------------------

# 13. Luồng nghiệp vụ phải nhìn ra được từ CDM

Sơ đồ sau khi vẽ phải thể hiện được hai luồng chính.

## Luồng AI

``` text
Người dùng / khách vãng lai
          |
          v
Upload ảnh
          |
          v
LICH_SU_TIM_ANH
          |
          v
AI Vision
          |
          v
KET_QUA_NHAN_DIEN
          |
          v
LOAI_CAY
          |
          v
SAN_PHAM phù hợp
```

## Luồng mua hàng

``` text
NGUOI_DUNG
     |
     v
GIO_HANG
     |
     v
CHI_TIET_GIO_HANG
     |
     v
SAN_PHAM
     |
     v
DON_HANG
     |
     v
CHI_TIET_DON_HANG
     |
     v
DANH_GIA_SAN_PHAM
```

------------------------------------------------------------------------

# 14. Những điều KHÔNG được làm khi vẽ lại

Không thêm:

``` text
CUA_HANG
SHOP
NGUOI_BAN
HOA_HONG
VI_NGUOI_BAN
DON_HANG_CON_THEO_SHOP
```

vì hệ thống là **Single-Store**.

Không nối đánh giá trực tiếp User → Review nếu đã sử dụng cơ chế xác
minh qua `CHI_TIET_DON_HANG`.

Không lưu `TenLoaiCay` trực tiếp trong `KET_QUA_NHAN_DIEN`.

Không để đồng thời:

``` text
SAN_PHAM.HinhAnhDaiDien
```

và:

``` text
HINH_ANH_SAN_PHAM.LaAnhChinh
```

Sau khi chỉnh, chỉ dùng bảng `HINH_ANH_SAN_PHAM` để quản lý ảnh sản
phẩm.

------------------------------------------------------------------------

# 15. Prompt ngắn để giao cho AI vẽ lại

Hãy vẽ lại **CDM chuẩn Merise/PowerDesigner** cho hệ thống **Website bán
cây cảnh tích hợp AI Vision**, kiến trúc **Single-Store**.

Giữ đúng 12 thực thể:

`NGUOI_DUNG`, `DANH_MUC`, `LOAI_CAY`, `LICH_SU_TIM_ANH`,
`KET_QUA_NHAN_DIEN`, `SAN_PHAM`, `HINH_ANH_SAN_PHAM`, `GIO_HANG`,
`CHI_TIET_GIO_HANG`, `DON_HANG`, `CHI_TIET_DON_HANG`,
`DANH_GIA_SAN_PHAM`.

Yêu cầu quan trọng:

-   Không có `CUA_HANG`.
-   `NGUOI_DUNG` --- `GIO_HANG`: 1 --- 0..1.
-   `NGUOI_DUNG` --- `LICH_SU_TIM_ANH`: User có 0..N lịch sử; một lịch
    sử có thể không thuộc User để hỗ trợ khách vãng lai.
-   `LICH_SU_TIM_ANH` --- `KET_QUA_NHAN_DIEN`: 1 --- N.
-   `KET_QUA_NHAN_DIEN` liên kết `LOAI_CAY`, hỗ trợ Top-K bằng `ThuHang`
    và `XacSuatChinhXac`.
-   `DANH_MUC` --- `LOAI_CAY`: 1 --- N.
-   `LOAI_CAY` --- `SAN_PHAM`: 1 --- N.
-   `SAN_PHAM` --- `HINH_ANH_SAN_PHAM`: 1 --- N.
-   Xóa `HinhAnhDaiDien` khỏi `SAN_PHAM`; dùng
    `HINH_ANH_SAN_PHAM.LaAnhChinh`.
-   `GIO_HANG` --- `CHI_TIET_GIO_HANG`: 1 --- N.
-   `SAN_PHAM` --- `CHI_TIET_GIO_HANG`: 1 --- N.
-   `NGUOI_DUNG` --- `DON_HANG`: 1 --- N.
-   `DON_HANG` --- `CHI_TIET_DON_HANG`: 1 --- N.
-   `SAN_PHAM` --- `CHI_TIET_DON_HANG`: 1 --- N.
-   `CHI_TIET_DON_HANG` --- `DANH_GIA_SAN_PHAM`: 1 --- 0..1.
-   `ThanhTien = SoLuongMua × DonGiaBan`.
-   `TongTien` được tính từ tổng các chi tiết đơn hàng.
-   Không thêm các thực thể Marketplace.
-   Bố trí sơ đồ thành 4 nhóm màu: AI Vision, Knowledge Base/Danh mục,
    Người dùng, E-Commerce.
-   Hiển thị rõ tên association và cardinality tại hai đầu quan hệ.
-   Hạn chế tối đa đường nối chồng chéo.
-   Đây là **CDM**, vì vậy ưu tiên entity, attribute, identifier,
    association và cardinality; FK vật lý sẽ được sinh khi chuyển sang
    PDM.

------------------------------------------------------------------------

# 16. Kết quả mong muốn

CDM cuối cùng phải thể hiện rõ chuỗi giá trị:

``` text
ẢNH CÂY
   ↓
AI NHẬN DIỆN
   ↓
TOP-K + CONFIDENCE
   ↓
LOAI_CAY
   ↓
THÔNG TIN THỰC VẬT
   ↓
SAN_PHAM
   ↓
GIO_HANG
   ↓
DON_HANG
   ↓
DANH_GIA
```

Đây là luồng cốt lõi của đề tài **Hệ thống bán cây cảnh tích hợp nhận
diện bằng hình ảnh (AI Vision)**.
