# ĐẶC TẢ BÀI TOÁN & THIẾT KẾ MÔ HÌNH DỮ LIỆU QUAN NIỆM (CDM)
## HỆ THỐNG BÁN CÂY CẢNH TÍCH HỢP NHẬN DIỆN HÌNH ẢNH (AI VISION)
### KIẾN TRÚC: SINGLE-STORE & KNOWLEDGE BASE THỰC VẬT HỌC

> **Mô hình**: Cửa hàng đơn lẻ (Single-Store) có tích hợp AI Vision  
> **Trọng tâm đề tài**: AI nhận diện cây bằng hình ảnh + Tra cứu tri thức thực vật học + Bán hàng  
> **Chuẩn thiết kế**: Merise / Sybase PowerDesigner (Không chứa FK trong Entity)

---

## 1. ĐẶC TẢ PHÁT BIỂU BÀI TOÁN

### 1.1. Bối cảnh & Mục tiêu
Hệ thống là một website bán cây cảnh chuyên nghiệp do **một chủ cửa hàng duy nhất vận hành**, kết hợp dịch vụ **Trí tuệ nhân tạo (AI Vision)** nhận diện loài cây qua hình ảnh lá.

Mô hình **Single-Store** được lựa chọn thay thế cho mô hình sàn nhiều người bán (Marketplace) vì:
* Giữ đúng trọng tâm nghiên cứu của đề tài: Giải quyết bài toán **AI Vision + Tri thức thực vật học** kết hợp với luồng thương mại điện tử thực tế.
* Loại bỏ sự phức tạp không cần thiết về chia tách đơn hàng nhiều shop, quản lý hoa hồng, phân quyền đa người bán.

### 1.2. Các tác nhân tham gia (Actors)
* **Khách hàng (User):** Đăng ký/đăng nhập, chụp/tải ảnh nhận diện loài cây, xem hướng dẫn chăm sóc, thêm sản phẩm vào giỏ, đặt mua cây và đánh giá sản phẩm sau khi đơn hoàn tất. Cho phép khách vãng lai (chưa đăng nhập) được dùng thử tính năng chụp ảnh nhận diện.
* **Quản trị viên / Chủ cửa hàng (Admin):** Quản lý danh mục, loài cây (Knowledge Base cho AI), bài đăng sản phẩm, kho hàng, duyệt đơn hàng và theo dõi nhật ký nhận diện của AI.

---

## 2. LUỒNG GIÁ TRỊ CỐT LÕI (END-TO-END FLOW)

```text
  [ẢNH CHỤP LÁ CÂY]
         ↓
  [AI VISION SERVICE]
         ↓
  [TOP-K KẾT QUẢ DỰ ĐOÁN]
         ↓
  [LOÀI CÂY (KNOWLEDGE BASE)]  ───> [HƯỚNG DẪN CHĂM SÓC THỰC VẬT]
         ↓
  [DANH SÁCH CHẬU CÂY PHÙ HỢP ĐANG BÁN]
         ↓
  [GIỎ HÀNG] ───> [ĐƠN HÀNG] ───> [HOÀN THÀNH] ───> [ĐÁNH GIÁ THỰC TẾ]
```

---

## 3. CÁC ĐIỂM CHỈNH SỬA CHUẨN HÓA THEO YÊU CẦU

1. **Quan hệ NGUOI_DUNG và GIO_HANG (`0,1` : `1,1`):**  
   Một người dùng có thể chưa có giỏ hàng nếu chưa từng thêm sản phẩm (`0,1`). Mỗi giỏ hàng gắn liền với duy nhất một người dùng (`1,1`).
2. **Loại bỏ dữ liệu ảnh đại diện bị trùng:**  
   Xóa `HinhAnhDaiDien` khỏi thực thể `SAN_PHAM`. Toàn bộ ảnh sản phẩm được quản lý tập trung ở thực thể `HINH_ANH_SAN_PHAM`, trong đó cờ `LaAnhChinh = TRUE` dùng để chỉ định ảnh đại diện.
3. **Quy tắc tính ThanhTien trong CHI_TIET_DON_HANG:**  
   $$\text{ThanhTien} = \text{SoLuongMua} \times \text{DonGiaBan}$$  
   *Trong đó `DonGiaBan` là giá tại thời điểm đặt hàng, được lưu cố định để không bị ảnh hưởng khi giá `SAN_PHAM.GiaBan` thay đổi sau này.*
4. **Quy tắc tính TongTien trong DON_HANG:**  
   $$\text{TongTien} = \sum \text{ThanhTien của các CHI\_TIET\_DON\_HANG}$$
5. **Chuẩn hóa kiểu dữ liệu tiền tệ:**  
   Khi chuyển sang mô hình vật lý (PDM), các trường tiền (`GiaBan`, `GiaThamKhao`, `TongTien`, `DonGiaBan`, `ThanhTien`) sử dụng kiểu `DECIMAL(12,2)` hoặc `BIGINT` (tiền VNĐ), tuyệt đối không dùng `FLOAT`.

---

## 4. DANH SÁCH 12 THỰC THỂ & THUỘC TÍNH (CHUẨN CDM POWERDESIGNER)

> **Quy tắc CDM Merise:** Tuyệt đối không chứa cột Khóa ngoại (`*_id`) trong danh sách thuộc tính. Khóa ngoại sẽ được PowerDesigner tự động sinh ra khi chuyển sang PDM.

### 4.1. Phân hệ Người dùng
1. **`NGUOI_DUNG`**:
   * `MaNguoiDung` (Serial / Integer, **Primary Identifier `<pi>`**)
   * `TenDangNhap` (Variable characters 50, Mandatory)
   * `MatKhau` (Variable characters 255, Mandatory - Lưu Hash)
   * `HoTen` (Variable characters 100, Mandatory)
   * `Email` (Variable characters 100, Mandatory)
   * `SoDienThoai` (Variable characters 20)
   * `DiaChiMacDinh` (Variable characters 255)
   * `VaiTro` (Variable characters 20, Mandatory - ADMIN / USER)
   * `NgayTao` (Date & Time)

### 4.2. Phân hệ Tri thức AI & Danh mục
2. **`DANH_MUC`** (Phân loại cây: để bàn, phong thủy, lọc không khí...):
   * `MaDanhMuc` (Serial / Integer, **`<pi>`**)
   * `TenDanhMuc` (Variable characters 100, Mandatory)
   * `HinhAnhDanhMuc` (Variable characters 255)
   * `MoTa` (Text)

3. **`LOAI_CAY`** (Knowledge Base & Class Label chuẩn cho AI):
   * `MaLoaiCay` (Serial / Integer, **`<pi>`**)
   * `TenKhoaHoc` (Variable characters 150, Mandatory)
   * `TenThuongGoi` (Variable characters 150, Mandatory)
   * `DacDiemNhanDang` (Text)
   * `XuatXu` (Variable characters 100)
   * `HuongDanChamSoc` (Text)
   * `GiaThamKhao` (Decimal / Money, Mandatory)

4. **`LICH_SU_TIM_ANH`** (Lưu vết mỗi lượt chụp/tải ảnh nhận diện):
   * `MaTimKiem` (Serial / Integer, **`<pi>`**)
   * `HinhAnhUploadUrl` (Variable characters 255, Mandatory)
   * `ThoiGianTimKiem` (Date & Time, Mandatory)
   * `NenTang` (Variable characters 20 - WEB / MOBILE)

5. **`KET_QUA_NHAN_DIEN`** (Chi tiết Top-K dự đoán từ AI):
   * `MaKetQua` (Serial / Integer, **`<pi>`**)
   * `ThuHang` (Integer, Mandatory - Top 1, Top 2, Top 3)
   * `XacSuatChinhXac` (Float: 0.0 - 1.0, Mandatory)

### 4.3. Phân hệ Sản phẩm & Thư viện ảnh
6. **`SAN_PHAM`** (Từng chậu cây cụ thể cửa hàng đăng bán):
   * `MaSanPham` (Serial / Integer, **`<pi>`**)
   * `TenSanPham` (Variable characters 200, Mandatory)
   * `GiaBan` (Decimal / Money, Mandatory)
   * `SoLuongTonKho` (Integer, Mandatory)
   * `KichThuocCay` (Variable characters 50)
   * `TinhTrangSucKhoe` (Variable characters 100)
   * `MoTaChiTiet` (Text)
   * `TrangThaiBan` (Variable characters 20 - DANG_BAN / HET_HANG / TAM_AN)

7. **`HINH_ANH_SAN_PHAM`** (Bộ sưu tập ảnh chi tiết của chậu cây):
   * `MaAnh` (Serial / Integer, **`<pi>`**)
   * `UrlAnh` (Variable characters 255, Mandatory)
   * `LaAnhChinh` (Boolean - TRUE: Ảnh đại diện)

### 4.4. Phân hệ Giỏ hàng & Đơn hàng
8. **`GIO_HANG`**:
   * `MaGioHang` (Serial / Integer, **`<pi>`**)
   * `NgayCapNhat` (Date & Time)

9. **`CHI_TIET_GIO_HANG`**:
   * `MaChiTietGio` (Serial / Integer, **`<pi>`**)
   * `SoLuongChon` (Integer, Mandatory)

10. **`DON_HANG`**:
    * `MaDonHang` (Serial / Integer, **`<pi>`**)
    * `NgayDatHang` (Date & Time, Mandatory)
    * `TongTien` (Decimal / Money, Mandatory - Tổng tiền các chi tiết đơn)
    * `DiaChiNhanHang` (Variable characters 255, Mandatory)
    * `SoDienThoaiNhan` (Variable characters 20, Mandatory)
    * `PhuongThucThanhToan` (Variable characters 50, Mandatory - COD / VNPAY / MOMO)
    * `TrangThaiDonHang` (Variable characters 30, Mandatory - CHO_XAC_NHAN / DANG_GIAO / HOAN_THANH / DA_HUY)

11. **`CHI_TIET_DON_HANG`**:
    * `MaChiTietDon` (Serial / Integer, **`<pi>`**)
    * `SoLuongMua` (Integer, Mandatory)
    * `DonGiaBan` (Decimal / Money, Mandatory - Lưu giá tại thời điểm mua)
    * `ThanhTien` (Decimal / Money, Mandatory - SoLuongMua × DonGiaBan)

12. **`DANH_GIA_SAN_PHAM`** (Đánh giá chất lượng sau mua hàng):
    * `MaDanhGia` (Serial / Integer, **`<pi>`**)
    * `SoSao` (Integer, Mandatory: 1 - 5 sao)
    * `NoiDungBinhLuan` (Text)
    * `HinhAnhThucTe` (Variable characters 255)
    * `NgayDanhGia` (Date & Time)

---

## 5. MA TRẬN MỐI QUAN HỆ & BẢN SỐ (CARDINALITY)

| STT | Thực thể 1 | Thực thể 2 | Tên quan hệ | Bản số (1 - 2) | Bản số (2 - 1) | Ý nghĩa nghiệp vụ |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | `DANH_MUC` | `LOAI_CAY` | *Phan_Loai* | `0,n` | `1,1` | 1 danh mục có nhiều loài cây; 1 loài thuộc 1 danh mục. |
| 2 | `LOAI_CAY` | `SAN_PHAM` | *Cung_Cap_Cay* | `0,n` | `1,1` | 1 loài sinh học có thể có nhiều chậu cây bán; mỗi chậu cây thuộc 1 loài xác định. |
| 3 | `SAN_PHAM` | `HINH_ANH_SAN_PHAM` | *Co_Bo_Anh* | `0,n` | `1,1` | 1 sản phẩm có thể có nhiều ảnh chi tiết; mỗi ảnh thuộc 1 sản phẩm. |
| 4 | `NGUOI_DUNG` | `GIO_HANG` | *So_Huu_Gio* | `0,1` | `1,1` | **SỬA 1:** Người dùng có thể chưa có giỏ (`0,1`); mỗi giỏ thuộc 1 người dùng. |
| 5 | `GIO_HANG` | `CHI_TIET_GIO_HANG` | *Chua_Hang* | `0,n` | `1,1` | Giỏ hàng chứa nhiều mục sản phẩm. |
| 6 | `SAN_PHAM` | `CHI_TIET_GIO_HANG` | *Vao_Gio* | `0,n` | `1,1` | Sản phẩm được đưa vào các giỏ hàng. |
| 7 | `NGUOI_DUNG` | `DON_HANG` | *Dat_Don_Hang* | `0,n` | `1,1` | Người dùng đặt nhiều đơn hàng; 1 đơn hàng thuộc 1 người mua. |
| 8 | `DON_HANG` | `CHI_TIET_DON_HANG` | *Gom_Co* | `1,n` | `1,1` | Đơn hàng phải có ít nhất 1 sản phẩm. |
| 9 | `SAN_PHAM` | `CHI_TIET_DON_HANG` | *Duoc_Ban* | `0,n` | `1,1` | Sản phẩm xuất hiện trong các đơn hàng. |
| 10 | `CHI_TIET_DON_HANG` | `DANH_GIA_SAN_PHAM` | *Duoc_Danh_Gia* | `0,1` | `1,1` | 1 món hàng đã mua chỉ được đánh giá tối đa 1 lần (`0,1`). |
| 11 | `NGUOI_DUNG` | `LICH_SU_TIM_ANH` | *Tim_Kiem_Anh* | `0,n` | `0,1` | Khách chụp ảnh; cho phép khách chưa đăng nhập dùng thử (`0,1`). |
| 12 | `LICH_SU_TIM_ANH` | `KET_QUA_NHAN_DIEN` | *Tra_Ve_Ket_Qua* | `1,n` | `1,1` | 1 lần tìm kiếm trả về Top-K kết quả dự đoán. |
| 13 | `LOAI_CAY` | `KET_QUA_NHAN_DIEN` | *Chi_Dinh_Loai* | `0,n` | `1,1` | Kết quả nhận diện trỏ đúng vào loài cây trong từ điển. |
