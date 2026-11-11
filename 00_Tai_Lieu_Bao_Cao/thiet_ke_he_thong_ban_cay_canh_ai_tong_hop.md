# TỔNG HỢP THIẾT KẾ HỆ THỐNG BÁN CÂY CẢNH TÍCH HỢP NHẬN DIỆN BẰNG HÌNH ẢNH (AI Vision)

## 1. Mô hình được chọn: Single-Store

Hệ thống là website bán cây cảnh do một chủ cửa hàng duy nhất vận hành.

-   **Admin:** quản trị danh mục, loại cây, sản phẩm/kho, đơn hàng và
    theo dõi kết quả AI.
-   **User:** mua cây, nhận diện cây bằng hình ảnh, quản lý giỏ hàng,
    đặt hàng và đánh giá sản phẩm.

Không sử dụng mô hình Marketplace nhiều người bán vì trọng tâm của đề
tài là **AI Vision + tra cứu kiến thức thực vật học**. Việc bỏ mô hình
nhiều shop giúp giảm độ phức tạp về phân quyền, tách đơn, hoa hồng,
logistics và quản lý dữ liệu.

## 2. Các thay đổi so với mô hình cũ

  -----------------------------------------------------------------------
  Thành phần              Mô hình cũ              Mô hình mới
  ----------------------- ----------------------- -----------------------
  `CUA HANG`              Có                      **Xóa hoàn toàn**

  Mô hình bán hàng        Multi-Store             **Single-Store**

  `NGUOI DUNG`            Chưa đầy đủ             Authentication + RBAC

  `LICH SU TIM ANH`       User bắt buộc           `MaNguoiDung` có thể
                                                  NULL

  `DANH GIA SAN PHAM`     Nối trực tiếp           Nối qua
                          User/Product            `CHI TIET DON HANG`

  Hình ảnh sản phẩm       Một ảnh đại diện        Thêm
                                                  `HINH ANH SAN PHAM`

  AI                      Nhận diện cơ bản        Top-K + Confidence

  `LOAI CAY`              Phân loại cây           Knowledge Base + Class
                                                  Label

  `SAN PHAM`              Có liên quan cửa hàng   Liên kết trực tiếp
                                                  `LOAI CAY`
  -----------------------------------------------------------------------

## 3. Danh sách bảng chính

Hệ thống gồm 12 bảng:

1.  `NGUOI DUNG`
2.  `DANH MUC`
3.  `LOAI CAY`
4.  `LICH SU TIM ANH`
5.  `KET QUA NHAN DIEN`
6.  `SAN PHAM`
7.  `HINH ANH SAN PHAM`
8.  `GIO HANG`
9.  `CHI TIET GIO HANG`
10. `DON HANG`
11. `CHI TIET DON HANG`
12. `DANH GIA SAN PHAM`

Không sử dụng bảng `CUA HANG`.

## 4. NGUOI DUNG

``` text
MaNguoiDung       PK, Auto Increment
TenDangNhap       UNIQUE, NOT NULL
MatKhau           VARCHAR(255), NOT NULL, lưu Hash
HoTen             VARCHAR(100), NOT NULL
Email             UNIQUE, NOT NULL
SoDienThoai       Nullable
DiaChiMacDinh     Nullable
VaiTro            ADMIN / USER
NgayTao           Default NOW()
```

## 5. DANH MUC

``` text
MaDanhMuc         PK
TenDanhMuc
HinhAnhDanhMuc
MoTa
```

Ví dụ: cây để bàn, cây phong thủy, cây lọc không khí, cây ngoài trời.

## 6. LOAI CAY

Đây là **Knowledge Base / Ground Truth** của module AI.

``` text
MaLoaiCay              PK
MaDanhMuc              FK -> DANH_MUC
TenThuongGoi
TenKhoaHoc
DacDiemNhanDang
XuatXu
HuongDanChamSoc
GiaThamKhao
```

`LOAI CAY` vừa cung cấp thông tin thực vật cho người dùng, vừa là nhãn
chuẩn/Class Label để AI phân loại, đồng thời là cầu nối đến sản phẩm.

## 7. LICH SU TIM ANH

``` text
MaTimKiem              PK
MaNguoiDung            FK -> NGUOI_DUNG, Nullable
HinhAnhUploadUrl
ThoiGianTimKiem
NenTang                WEB / MOBILE
```

`MaNguoiDung` cho phép NULL để khách vãng lai chưa đăng nhập vẫn dùng
được chức năng AI.

## 8. KET QUA NHAN DIEN

``` text
MaKetQua               PK
MaTimKiem              FK -> LICH_SU_TIM_ANH
MaLoaiCay              FK -> LOAI_CAY
ThuHang
XacSuatChinhXac
```

Ví dụ:

``` text
Top 1 -> Cây mai       -> 94%
Top 2 -> Cây đào       ->  4%
Top 3 -> Hoa giấy      ->  2%
```

Quan hệ:

``` text
LICH SU TIM ANH 1 ---- N KET QUA NHAN DIEN N ---- 1 LOAI CAY
```

## 9. SAN PHAM

``` text
MaSanPham             PK
MaLoaiCay             FK -> LOAI_CAY
TenSanPham
GiaBan
SoLuongTonKho
KichThuocCay
TinhTrangSucKhoe
MoTaChiTiet
HinhAnhDaiDien
TrangThaiBan
```

`TrangThaiBan`: `DANG_BAN`, `HET_HANG`, `TAM_AN`.

Quan hệ:

``` text
LOAI CAY 1 ---- N SAN PHAM
```

## 10. HINH ANH SAN PHAM

Một sản phẩm có nhiều ảnh.

``` text
MaAnh                  PK
MaSanPham              FK -> SAN_PHAM
UrlAnh
LaAnhChinh
```

Quan hệ:

``` text
SAN PHAM 1 ---- N HINH ANH SAN PHAM
```

## 11. GIO HANG

``` text
MaGioHang              PK
MaNguoiDung            FK, UNIQUE
NgayCapNhat
```

Quan hệ:

``` text
NGUOI DUNG 1 ---- 1 GIO HANG
```

### CHI TIET GIO HANG

``` text
MaChiTietGio           PK
MaGioHang              FK -> GIO_HANG
MaSanPham              FK -> SAN_PHAM
SoLuongChon
```

## 12. DON HANG

``` text
MaDonHang              PK
MaNguoiDung            FK -> NGUOI_DUNG
NgayDatHang
TongTien
DiaChiNhanHang
SoDienThoaiNhan
PhuongThucThanhToan
TrangThaiDonHang
```

Thanh toán có thể gồm `COD`, `VNPAY`, `MOMO`...

Trạng thái có thể gồm:

``` text
CHO_XAC_NHAN
DANG_GIAO
HOAN_THANH
DA_HUY
```

## 13. CHI TIET DON HANG

``` text
MaChiTietDon           PK
MaDonHang              FK -> DON_HANG
MaSanPham              FK -> SAN_PHAM
SoLuongMua
DonGiaBan
ThanhTien
```

`DonGiaBan` phải lưu giá tại thời điểm mua để đơn hàng cũ không bị thay
đổi khi giá sản phẩm thay đổi.

## 14. DANH GIA SAN PHAM

Đánh giá được liên kết với `CHI TIET DON HANG`, không nối trực tiếp với
User/Product.

``` text
MaDanhGia              PK
MaChiTietDon            FK, UNIQUE
SoSao                   1 - 5
NoiDungBinhLuan
HinhAnhThucTe
NgayDanhGia
```

Quan hệ:

``` text
CHI TIET DON HANG 1 ---- 0..1 DANH GIA SAN PHAM
```

Như vậy một mục hàng đã mua chỉ được đánh giá một lần.

## 15. Quan hệ tổng thể

``` text
DANH MUC
    |
    | 1-N
    v
LOAI CAY <---------------- KET QUA NHAN DIEN
    |                           ^
    | 1-N                       |
    v                           |
SAN PHAM                 LICH SU TIM ANH
    |                           ^
    | 1-N                       |
    v                           |
HINH ANH SAN PHAM        NGUOI DUNG

NGUOI DUNG 1-N DON HANG 1-N CHI TIET DON HANG 1-0..1 DANH GIA

NGUOI DUNG 1-1 GIO HANG 1-N CHI TIET GIO HANG N-1 SAN PHAM
```

## 16. Luồng AI End-to-End

``` text
[Khách hàng]
     |
     | Chụp / tải ảnh
     v
[WEB / API BACKEND]
     |
     | Lưu LICH_SU_TIM_ANH
     v
[AI VISION]
     |
     | Phân loại dựa trên LOAI CAY
     v
[KET QUA NHAN DIEN]
     |
     | Top-1 / Top-2 / Top-3 + Confidence
     v
[GIAO DIỆN KẾT QUẢ]
     |
     +--> Thông tin thực vật học từ LOAI CAY
     |
     +--> Tìm SAN PHAM có cùng MaLoaiCay
                 |
                 v
          [Chọn sản phẩm]
                 |
                 v
            [GIO HANG]
                 |
                 v
             [DON HANG]
                 |
                 v
           [HOAN_THANH]
                 |
                 v
              [DANH GIA]
```

## 17. Luồng mua hàng

``` text
User
 -> Xem sản phẩm
 -> Thêm vào giỏ
 -> GIO HANG
 -> CHI TIET GIO HANG
 -> Đặt hàng
 -> DON HANG
 -> CHI TIET DON HANG
 -> Admin xử lý
 -> HOAN_THANH
 -> User đánh giá
```

## 18. Luồng giá trị cốt lõi của đề tài

``` text
ẢNH CÂY
   ↓
AI NHẬN DIỆN
   ↓
KẾT QUẢ TOP-K
   ↓
LOAI CAY
   ↓
THÔNG TIN THỰC VẬT
   ↓
SAN PHAM PHÙ HỢP
   ↓
GIỎ HÀNG
   ↓
ĐƠN HÀNG
   ↓
ĐÁNH GIÁ
```

Đây là điểm kết nối quan trọng nhất giữa module AI và module bán hàng.

## 19. Vai trò Admin

``` text
ADMIN
 ├── Quản lý DANH MUC
 ├── Quản lý LOAI CAY
 ├── Quản lý SAN PHAM
 ├── Quản lý HINH ANH SAN PHAM
 ├── Quản lý kho / số lượng tồn
 ├── Quản lý DON HANG
 └── Theo dõi kết quả AI
```

## 20. Vai trò User

``` text
USER
 ├── Đăng ký / đăng nhập
 ├── Xem danh mục
 ├── Xem loại cây
 ├── Tìm kiếm sản phẩm
 ├── Upload ảnh nhận diện
 ├── Xem Top-K kết quả
 ├── Xem thông tin chăm sóc cây
 ├── Xem sản phẩm phù hợp
 ├── Thêm giỏ hàng
 ├── Đặt hàng
 └── Đánh giá sản phẩm đã mua
```

## 21. Checklist ERD chính thức

-   [x] Single-Store.
-   [x] Xóa `CUA HANG`.
-   [x] `NGUOI DUNG` có PK.
-   [x] Có `TenDangNhap`, `MatKhau`, `VaiTro`.
-   [x] Mật khẩu lưu Hash.
-   [x] `LICH SU TIM ANH.MaNguoiDung` Nullable.
-   [x] `KET QUA NHAN DIEN` có `MaLoaiCay`.
-   [x] Có `ThuHang` và `XacSuatChinhXac`.
-   [x] `SAN PHAM` liên kết trực tiếp `LOAI CAY`.
-   [x] Thêm `HINH ANH SAN PHAM`.
-   [x] User có một giỏ hàng hoạt động.
-   [x] Đơn hàng thuộc trực tiếp User.
-   [x] Chi tiết đơn lưu `DonGiaBan`.
-   [x] Đánh giá liên kết qua `CHI TIET DON HANG`.
-   [x] Một mục hàng chỉ được đánh giá tối đa một lần.
-   [x] Có luồng AI Upload -\> AI -\> Top-K -\> LOAI CAY -\> SAN PHAM.
-   [x] Có luồng mua hàng từ SAN PHAM -\> GIO HANG -\> DON HANG -\> DANH
    GIA.

## 22. Kết luận

Kiến trúc chính thức nên sử dụng **Single-Store**.

Ba khối trọng tâm:

1.  **AI Vision:** nhận diện cây từ hình ảnh, trả về Top-K và Confidence
    Score.
2.  **Knowledge Base:** `LOAI CAY` chứa kiến thức thực vật và nhãn chuẩn
    cho AI.
3.  **E-Commerce:** kết nối loại cây được nhận diện với sản phẩm thực
    tế, sau đó xử lý giỏ hàng, đơn hàng và đánh giá.

Luồng chính:

**Ảnh cây -\> AI nhận diện -\> Loại cây -\> Thông tin thực vật -\> Sản
phẩm đang bán -\> Giỏ hàng -\> Đơn hàng -\> Đánh giá.**
