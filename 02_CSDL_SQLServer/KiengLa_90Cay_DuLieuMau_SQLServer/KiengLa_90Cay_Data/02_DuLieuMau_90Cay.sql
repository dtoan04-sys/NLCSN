-- DU LIEU MAU KIENG LA / SQL SERVER 2017 / ChuanPDM.pdm
-- Generated 2026-10-14. Chon database bai tap rong truoc khi chay.
-- Ten cot, PK ghep va 17 FK doc tu PDM. Khong DROP/DELETE du lieu cu.


-- Gia, tai khoan, don, review, diem nhan dien va duong dan anh la GIA LAP.
-- Thong tin cay tom tat de tham khao; khong la bo anh train.
-- Tat ca tai khoan bi khoa, MATKHAU la placeholder khong dang nhap duoc.
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET DATEFORMAT ymd;
DECLARE @IdentityTable sysname = NULL;
BEGIN TRY
BEGIN TRANSACTION;
IF DB_NAME() IN (N'master',N'model',N'msdb',N'tempdb') THROW 51000, N'Chon database bai tap truoc.', 1;

IF OBJECT_ID(N'dbo.TIM_ANH',N'U') IS NULL THROW 51002,N'Thieu bang TIM_ANH; chay file 00 hoac sinh bang tu PDM.',1;

IF COL_LENGTH(N'dbo.TIM_ANH',N'MATIMKIEM') IS NULL THROW 51003,N'Thieu cot TIM_ANH.MATIMKIEM.',1;

IF COL_LENGTH(N'dbo.TIM_ANH',N'MANGUOIDUNG') IS NULL THROW 51003,N'Thieu cot TIM_ANH.MANGUOIDUNG.',1;

IF COL_LENGTH(N'dbo.TIM_ANH',N'HINHANHURL') IS NULL THROW 51003,N'Thieu cot TIM_ANH.HINHANHURL.',1;

IF COL_LENGTH(N'dbo.TIM_ANH',N'THOIGIAN') IS NULL THROW 51003,N'Thieu cot TIM_ANH.THOIGIAN.',1;

IF COL_LENGTH(N'dbo.TIM_ANH',N'NENTANG') IS NULL THROW 51003,N'Thieu cot TIM_ANH.NENTANG.',1;

IF COL_LENGTH(N'dbo.TIM_ANH',N'PHIENBANMODEL') IS NULL THROW 51003,N'Thieu cot TIM_ANH.PHIENBANMODEL.',1;

IF COL_LENGTH(N'dbo.TIM_ANH',N'TRANGTHAINHANDIEN') IS NULL THROW 51003,N'Thieu cot TIM_ANH.TRANGTHAINHANDIEN.',1;

IF EXISTS (SELECT 1 FROM [dbo].[TIM_ANH]) THROW 51004,N'Bang TIM_ANH co du lieu. Dung database bai tap rong; script khong xoa du lieu cu.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.TIM_ANH') AND name=N'HINHANHURL' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot TIM_ANH.HINHANHURL chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.TIM_ANH') AND name=N'NENTANG' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot TIM_ANH.NENTANG chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.TIM_ANH') AND name=N'PHIENBANMODEL' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot TIM_ANH.PHIENBANMODEL chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.TIM_ANH') AND name=N'TRANGTHAINHANDIEN' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot TIM_ANH.TRANGTHAINHANDIEN chua ho tro Unicode. Chay file 01 truoc.',1;

IF OBJECT_ID(N'dbo.NGUOI_DUNG',N'U') IS NULL THROW 51002,N'Thieu bang NGUOI_DUNG; chay file 00 hoac sinh bang tu PDM.',1;

IF COL_LENGTH(N'dbo.NGUOI_DUNG',N'MANGUOIDUNG') IS NULL THROW 51003,N'Thieu cot NGUOI_DUNG.MANGUOIDUNG.',1;

IF COL_LENGTH(N'dbo.NGUOI_DUNG',N'TAIKHOAN') IS NULL THROW 51003,N'Thieu cot NGUOI_DUNG.TAIKHOAN.',1;

IF COL_LENGTH(N'dbo.NGUOI_DUNG',N'MATKHAU') IS NULL THROW 51003,N'Thieu cot NGUOI_DUNG.MATKHAU.',1;

IF COL_LENGTH(N'dbo.NGUOI_DUNG',N'HOTEN') IS NULL THROW 51003,N'Thieu cot NGUOI_DUNG.HOTEN.',1;

IF COL_LENGTH(N'dbo.NGUOI_DUNG',N'EMAIL') IS NULL THROW 51003,N'Thieu cot NGUOI_DUNG.EMAIL.',1;

IF COL_LENGTH(N'dbo.NGUOI_DUNG',N'VAITRO') IS NULL THROW 51003,N'Thieu cot NGUOI_DUNG.VAITRO.',1;

IF COL_LENGTH(N'dbo.NGUOI_DUNG',N'NGAYDANGKY') IS NULL THROW 51003,N'Thieu cot NGUOI_DUNG.NGAYDANGKY.',1;

IF COL_LENGTH(N'dbo.NGUOI_DUNG',N'TRANGTHAITAIKHOAN') IS NULL THROW 51003,N'Thieu cot NGUOI_DUNG.TRANGTHAITAIKHOAN.',1;

IF EXISTS (SELECT 1 FROM [dbo].[NGUOI_DUNG]) THROW 51004,N'Bang NGUOI_DUNG co du lieu. Dung database bai tap rong; script khong xoa du lieu cu.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.NGUOI_DUNG') AND name=N'TAIKHOAN' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot NGUOI_DUNG.TAIKHOAN chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.NGUOI_DUNG') AND name=N'MATKHAU' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot NGUOI_DUNG.MATKHAU chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.NGUOI_DUNG') AND name=N'HOTEN' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot NGUOI_DUNG.HOTEN chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.NGUOI_DUNG') AND name=N'EMAIL' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot NGUOI_DUNG.EMAIL chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.NGUOI_DUNG') AND name=N'VAITRO' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot NGUOI_DUNG.VAITRO chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.NGUOI_DUNG') AND name=N'TRANGTHAITAIKHOAN' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot NGUOI_DUNG.TRANGTHAITAIKHOAN chua ho tro Unicode. Chay file 01 truoc.',1;

IF OBJECT_ID(N'dbo.CHI_TIET_GIO_HANG',N'U') IS NULL THROW 51002,N'Thieu bang CHI_TIET_GIO_HANG; chay file 00 hoac sinh bang tu PDM.',1;

IF COL_LENGTH(N'dbo.CHI_TIET_GIO_HANG',N'MAGIOHANG') IS NULL THROW 51003,N'Thieu cot CHI_TIET_GIO_HANG.MAGIOHANG.',1;

IF COL_LENGTH(N'dbo.CHI_TIET_GIO_HANG',N'MASANPHAM') IS NULL THROW 51003,N'Thieu cot CHI_TIET_GIO_HANG.MASANPHAM.',1;

IF COL_LENGTH(N'dbo.CHI_TIET_GIO_HANG',N'MACHITIETGIOHANG') IS NULL THROW 51003,N'Thieu cot CHI_TIET_GIO_HANG.MACHITIETGIOHANG.',1;

IF COL_LENGTH(N'dbo.CHI_TIET_GIO_HANG',N'SOLUONGCHON') IS NULL THROW 51003,N'Thieu cot CHI_TIET_GIO_HANG.SOLUONGCHON.',1;

IF COL_LENGTH(N'dbo.CHI_TIET_GIO_HANG',N'DONGIABAN') IS NULL THROW 51003,N'Thieu cot CHI_TIET_GIO_HANG.DONGIABAN.',1;

IF EXISTS (SELECT 1 FROM [dbo].[CHI_TIET_GIO_HANG]) THROW 51004,N'Bang CHI_TIET_GIO_HANG co du lieu. Dung database bai tap rong; script khong xoa du lieu cu.',1;

IF OBJECT_ID(N'dbo.SAN_PHAM',N'U') IS NULL THROW 51002,N'Thieu bang SAN_PHAM; chay file 00 hoac sinh bang tu PDM.',1;

IF COL_LENGTH(N'dbo.SAN_PHAM',N'MASANPHAM') IS NULL THROW 51003,N'Thieu cot SAN_PHAM.MASANPHAM.',1;

IF COL_LENGTH(N'dbo.SAN_PHAM',N'MALOAICAY') IS NULL THROW 51003,N'Thieu cot SAN_PHAM.MALOAICAY.',1;

IF COL_LENGTH(N'dbo.SAN_PHAM',N'TENSANPHAM') IS NULL THROW 51003,N'Thieu cot SAN_PHAM.TENSANPHAM.',1;

IF COL_LENGTH(N'dbo.SAN_PHAM',N'SOLUONGTONKHO') IS NULL THROW 51003,N'Thieu cot SAN_PHAM.SOLUONGTONKHO.',1;

IF COL_LENGTH(N'dbo.SAN_PHAM',N'KICHTHUOCCAY') IS NULL THROW 51003,N'Thieu cot SAN_PHAM.KICHTHUOCCAY.',1;

IF COL_LENGTH(N'dbo.SAN_PHAM',N'TINHTRANGCAY') IS NULL THROW 51003,N'Thieu cot SAN_PHAM.TINHTRANGCAY.',1;

IF EXISTS (SELECT 1 FROM [dbo].[SAN_PHAM]) THROW 51004,N'Bang SAN_PHAM co du lieu. Dung database bai tap rong; script khong xoa du lieu cu.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.SAN_PHAM') AND name=N'TENSANPHAM' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot SAN_PHAM.TENSANPHAM chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.SAN_PHAM') AND name=N'KICHTHUOCCAY' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot SAN_PHAM.KICHTHUOCCAY chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.SAN_PHAM') AND name=N'TINHTRANGCAY' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot SAN_PHAM.TINHTRANGCAY chua ho tro Unicode. Chay file 01 truoc.',1;

IF OBJECT_ID(N'dbo.KET_QUA_NHAN_DIEN',N'U') IS NULL THROW 51002,N'Thieu bang KET_QUA_NHAN_DIEN; chay file 00 hoac sinh bang tu PDM.',1;

IF COL_LENGTH(N'dbo.KET_QUA_NHAN_DIEN',N'MALOAICAY') IS NULL THROW 51003,N'Thieu cot KET_QUA_NHAN_DIEN.MALOAICAY.',1;

IF COL_LENGTH(N'dbo.KET_QUA_NHAN_DIEN',N'MATIMKIEM') IS NULL THROW 51003,N'Thieu cot KET_QUA_NHAN_DIEN.MATIMKIEM.',1;

IF COL_LENGTH(N'dbo.KET_QUA_NHAN_DIEN',N'MAKETQUA') IS NULL THROW 51003,N'Thieu cot KET_QUA_NHAN_DIEN.MAKETQUA.',1;

IF COL_LENGTH(N'dbo.KET_QUA_NHAN_DIEN',N'THUHANG') IS NULL THROW 51003,N'Thieu cot KET_QUA_NHAN_DIEN.THUHANG.',1;

IF COL_LENGTH(N'dbo.KET_QUA_NHAN_DIEN',N'XACSUATCHINHXAC') IS NULL THROW 51003,N'Thieu cot KET_QUA_NHAN_DIEN.XACSUATCHINHXAC.',1;

IF EXISTS (SELECT 1 FROM [dbo].[KET_QUA_NHAN_DIEN]) THROW 51004,N'Bang KET_QUA_NHAN_DIEN co du lieu. Dung database bai tap rong; script khong xoa du lieu cu.',1;

IF OBJECT_ID(N'dbo.DANH_MUC',N'U') IS NULL THROW 51002,N'Thieu bang DANH_MUC; chay file 00 hoac sinh bang tu PDM.',1;

IF COL_LENGTH(N'dbo.DANH_MUC',N'MADANHMUC') IS NULL THROW 51003,N'Thieu cot DANH_MUC.MADANHMUC.',1;

IF COL_LENGTH(N'dbo.DANH_MUC',N'TENDANHMUC') IS NULL THROW 51003,N'Thieu cot DANH_MUC.TENDANHMUC.',1;

IF COL_LENGTH(N'dbo.DANH_MUC',N'HINHANHDANHMUC') IS NULL THROW 51003,N'Thieu cot DANH_MUC.HINHANHDANHMUC.',1;

IF EXISTS (SELECT 1 FROM [dbo].[DANH_MUC]) THROW 51004,N'Bang DANH_MUC co du lieu. Dung database bai tap rong; script khong xoa du lieu cu.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.DANH_MUC') AND name=N'TENDANHMUC' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot DANH_MUC.TENDANHMUC chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.DANH_MUC') AND name=N'HINHANHDANHMUC' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot DANH_MUC.HINHANHDANHMUC chua ho tro Unicode. Chay file 01 truoc.',1;

IF OBJECT_ID(N'dbo.DON_HANG',N'U') IS NULL THROW 51002,N'Thieu bang DON_HANG; chay file 00 hoac sinh bang tu PDM.',1;

IF COL_LENGTH(N'dbo.DON_HANG',N'MADONHANG') IS NULL THROW 51003,N'Thieu cot DON_HANG.MADONHANG.',1;

IF COL_LENGTH(N'dbo.DON_HANG',N'MACHUONGTRINHGIAMGIA') IS NULL THROW 51003,N'Thieu cot DON_HANG.MACHUONGTRINHGIAMGIA.',1;

IF COL_LENGTH(N'dbo.DON_HANG',N'MANGUOIDUNG') IS NULL THROW 51003,N'Thieu cot DON_HANG.MANGUOIDUNG.',1;

IF COL_LENGTH(N'dbo.DON_HANG',N'MAGIOHANG') IS NULL THROW 51003,N'Thieu cot DON_HANG.MAGIOHANG.',1;

IF COL_LENGTH(N'dbo.DON_HANG',N'NGAYDATHANG') IS NULL THROW 51003,N'Thieu cot DON_HANG.NGAYDATHANG.',1;

IF COL_LENGTH(N'dbo.DON_HANG',N'TAMTINH') IS NULL THROW 51003,N'Thieu cot DON_HANG.TAMTINH.',1;

IF COL_LENGTH(N'dbo.DON_HANG',N'SOTIENGIAM') IS NULL THROW 51003,N'Thieu cot DON_HANG.SOTIENGIAM.',1;

IF COL_LENGTH(N'dbo.DON_HANG',N'PHIVANCHUYEN') IS NULL THROW 51003,N'Thieu cot DON_HANG.PHIVANCHUYEN.',1;

IF COL_LENGTH(N'dbo.DON_HANG',N'TONGTIEN') IS NULL THROW 51003,N'Thieu cot DON_HANG.TONGTIEN.',1;

IF COL_LENGTH(N'dbo.DON_HANG',N'DIACHINHANHANG') IS NULL THROW 51003,N'Thieu cot DON_HANG.DIACHINHANHANG.',1;

IF COL_LENGTH(N'dbo.DON_HANG',N'SDTNHANHANG') IS NULL THROW 51003,N'Thieu cot DON_HANG.SDTNHANHANG.',1;

IF COL_LENGTH(N'dbo.DON_HANG',N'PHUONGTHUCTHANHTOAN') IS NULL THROW 51003,N'Thieu cot DON_HANG.PHUONGTHUCTHANHTOAN.',1;

IF COL_LENGTH(N'dbo.DON_HANG',N'TRANGTHAITHANHTOAN') IS NULL THROW 51003,N'Thieu cot DON_HANG.TRANGTHAITHANHTOAN.',1;

IF COL_LENGTH(N'dbo.DON_HANG',N'TRANGTHAIDONHANG') IS NULL THROW 51003,N'Thieu cot DON_HANG.TRANGTHAIDONHANG.',1;

IF EXISTS (SELECT 1 FROM [dbo].[DON_HANG]) THROW 51004,N'Bang DON_HANG co du lieu. Dung database bai tap rong; script khong xoa du lieu cu.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.DON_HANG') AND name=N'DIACHINHANHANG' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot DON_HANG.DIACHINHANHANG chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.DON_HANG') AND name=N'SDTNHANHANG' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot DON_HANG.SDTNHANHANG chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.DON_HANG') AND name=N'PHUONGTHUCTHANHTOAN' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot DON_HANG.PHUONGTHUCTHANHTOAN chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.DON_HANG') AND name=N'TRANGTHAITHANHTOAN' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot DON_HANG.TRANGTHAITHANHTOAN chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.DON_HANG') AND name=N'TRANGTHAIDONHANG' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot DON_HANG.TRANGTHAIDONHANG chua ho tro Unicode. Chay file 01 truoc.',1;

IF OBJECT_ID(N'dbo.HINH_ANH_SAN_PHAM',N'U') IS NULL THROW 51002,N'Thieu bang HINH_ANH_SAN_PHAM; chay file 00 hoac sinh bang tu PDM.',1;

IF COL_LENGTH(N'dbo.HINH_ANH_SAN_PHAM',N'MAANH') IS NULL THROW 51003,N'Thieu cot HINH_ANH_SAN_PHAM.MAANH.',1;

IF COL_LENGTH(N'dbo.HINH_ANH_SAN_PHAM',N'MASANPHAM') IS NULL THROW 51003,N'Thieu cot HINH_ANH_SAN_PHAM.MASANPHAM.',1;

IF COL_LENGTH(N'dbo.HINH_ANH_SAN_PHAM',N'URLANH') IS NULL THROW 51003,N'Thieu cot HINH_ANH_SAN_PHAM.URLANH.',1;

IF COL_LENGTH(N'dbo.HINH_ANH_SAN_PHAM',N'LAANHCHINH') IS NULL THROW 51003,N'Thieu cot HINH_ANH_SAN_PHAM.LAANHCHINH.',1;

IF EXISTS (SELECT 1 FROM [dbo].[HINH_ANH_SAN_PHAM]) THROW 51004,N'Bang HINH_ANH_SAN_PHAM co du lieu. Dung database bai tap rong; script khong xoa du lieu cu.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.HINH_ANH_SAN_PHAM') AND name=N'URLANH' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot HINH_ANH_SAN_PHAM.URLANH chua ho tro Unicode. Chay file 01 truoc.',1;

IF OBJECT_ID(N'dbo.LOAI_CAY',N'U') IS NULL THROW 51002,N'Thieu bang LOAI_CAY; chay file 00 hoac sinh bang tu PDM.',1;

IF COL_LENGTH(N'dbo.LOAI_CAY',N'MALOAICAY') IS NULL THROW 51003,N'Thieu cot LOAI_CAY.MALOAICAY.',1;

IF COL_LENGTH(N'dbo.LOAI_CAY',N'MADANHMUC') IS NULL THROW 51003,N'Thieu cot LOAI_CAY.MADANHMUC.',1;

IF COL_LENGTH(N'dbo.LOAI_CAY',N'TENKHOAHOC') IS NULL THROW 51003,N'Thieu cot LOAI_CAY.TENKHOAHOC.',1;

IF COL_LENGTH(N'dbo.LOAI_CAY',N'TENTHUONGGOI') IS NULL THROW 51003,N'Thieu cot LOAI_CAY.TENTHUONGGOI.',1;

IF COL_LENGTH(N'dbo.LOAI_CAY',N'DACDIEMNHANDANG') IS NULL THROW 51003,N'Thieu cot LOAI_CAY.DACDIEMNHANDANG.',1;

IF COL_LENGTH(N'dbo.LOAI_CAY',N'XUATXU') IS NULL THROW 51003,N'Thieu cot LOAI_CAY.XUATXU.',1;

IF COL_LENGTH(N'dbo.LOAI_CAY',N'HUONGDANCHAMSOC') IS NULL THROW 51003,N'Thieu cot LOAI_CAY.HUONGDANCHAMSOC.',1;

IF COL_LENGTH(N'dbo.LOAI_CAY',N'GIATHAMKHAO') IS NULL THROW 51003,N'Thieu cot LOAI_CAY.GIATHAMKHAO.',1;

IF EXISTS (SELECT 1 FROM [dbo].[LOAI_CAY]) THROW 51004,N'Bang LOAI_CAY co du lieu. Dung database bai tap rong; script khong xoa du lieu cu.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.LOAI_CAY') AND name=N'TENKHOAHOC' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot LOAI_CAY.TENKHOAHOC chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.LOAI_CAY') AND name=N'TENTHUONGGOI' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot LOAI_CAY.TENTHUONGGOI chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.LOAI_CAY') AND name=N'DACDIEMNHANDANG' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot LOAI_CAY.DACDIEMNHANDANG chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.LOAI_CAY') AND name=N'XUATXU' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot LOAI_CAY.XUATXU chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.LOAI_CAY') AND name=N'HUONGDANCHAMSOC' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot LOAI_CAY.HUONGDANCHAMSOC chua ho tro Unicode. Chay file 01 truoc.',1;

IF OBJECT_ID(N'dbo.DANH_GIA_SAN_PHAM',N'U') IS NULL THROW 51002,N'Thieu bang DANH_GIA_SAN_PHAM; chay file 00 hoac sinh bang tu PDM.',1;

IF COL_LENGTH(N'dbo.DANH_GIA_SAN_PHAM',N'MADANHGIA') IS NULL THROW 51003,N'Thieu cot DANH_GIA_SAN_PHAM.MADANHGIA.',1;

IF COL_LENGTH(N'dbo.DANH_GIA_SAN_PHAM',N'MADONHANG') IS NULL THROW 51003,N'Thieu cot DANH_GIA_SAN_PHAM.MADONHANG.',1;

IF COL_LENGTH(N'dbo.DANH_GIA_SAN_PHAM',N'MASANPHAM') IS NULL THROW 51003,N'Thieu cot DANH_GIA_SAN_PHAM.MASANPHAM.',1;

IF COL_LENGTH(N'dbo.DANH_GIA_SAN_PHAM',N'SOSAO') IS NULL THROW 51003,N'Thieu cot DANH_GIA_SAN_PHAM.SOSAO.',1;

IF COL_LENGTH(N'dbo.DANH_GIA_SAN_PHAM',N'HINHANHTHUCTE') IS NULL THROW 51003,N'Thieu cot DANH_GIA_SAN_PHAM.HINHANHTHUCTE.',1;

IF COL_LENGTH(N'dbo.DANH_GIA_SAN_PHAM',N'NOIDUNGBINHLUAN') IS NULL THROW 51003,N'Thieu cot DANH_GIA_SAN_PHAM.NOIDUNGBINHLUAN.',1;

IF COL_LENGTH(N'dbo.DANH_GIA_SAN_PHAM',N'NGAYDANHGIA') IS NULL THROW 51003,N'Thieu cot DANH_GIA_SAN_PHAM.NGAYDANHGIA.',1;

IF EXISTS (SELECT 1 FROM [dbo].[DANH_GIA_SAN_PHAM]) THROW 51004,N'Bang DANH_GIA_SAN_PHAM co du lieu. Dung database bai tap rong; script khong xoa du lieu cu.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.DANH_GIA_SAN_PHAM') AND name=N'HINHANHTHUCTE' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot DANH_GIA_SAN_PHAM.HINHANHTHUCTE chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.DANH_GIA_SAN_PHAM') AND name=N'NOIDUNGBINHLUAN' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot DANH_GIA_SAN_PHAM.NOIDUNGBINHLUAN chua ho tro Unicode. Chay file 01 truoc.',1;

IF OBJECT_ID(N'dbo.GIO_HANG',N'U') IS NULL THROW 51002,N'Thieu bang GIO_HANG; chay file 00 hoac sinh bang tu PDM.',1;

IF COL_LENGTH(N'dbo.GIO_HANG',N'MAGIOHANG') IS NULL THROW 51003,N'Thieu cot GIO_HANG.MAGIOHANG.',1;

IF COL_LENGTH(N'dbo.GIO_HANG',N'MANGUOIDUNG') IS NULL THROW 51003,N'Thieu cot GIO_HANG.MANGUOIDUNG.',1;

IF COL_LENGTH(N'dbo.GIO_HANG',N'NGAYCAPNHAT') IS NULL THROW 51003,N'Thieu cot GIO_HANG.NGAYCAPNHAT.',1;

IF COL_LENGTH(N'dbo.GIO_HANG',N'NGAYTAO') IS NULL THROW 51003,N'Thieu cot GIO_HANG.NGAYTAO.',1;

IF COL_LENGTH(N'dbo.GIO_HANG',N'TRANGTHAIGIOHANG') IS NULL THROW 51003,N'Thieu cot GIO_HANG.TRANGTHAIGIOHANG.',1;

IF EXISTS (SELECT 1 FROM [dbo].[GIO_HANG]) THROW 51004,N'Bang GIO_HANG co du lieu. Dung database bai tap rong; script khong xoa du lieu cu.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.GIO_HANG') AND name=N'TRANGTHAIGIOHANG' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot GIO_HANG.TRANGTHAIGIOHANG chua ho tro Unicode. Chay file 01 truoc.',1;

IF OBJECT_ID(N'dbo.CHUONG_TRINH_GIAM_GIA',N'U') IS NULL THROW 51002,N'Thieu bang CHUONG_TRINH_GIAM_GIA; chay file 00 hoac sinh bang tu PDM.',1;

IF COL_LENGTH(N'dbo.CHUONG_TRINH_GIAM_GIA',N'MACHUONGTRINHGIAMGIA') IS NULL THROW 51003,N'Thieu cot CHUONG_TRINH_GIAM_GIA.MACHUONGTRINHGIAMGIA.',1;

IF COL_LENGTH(N'dbo.CHUONG_TRINH_GIAM_GIA',N'TENMAGIAMGIA') IS NULL THROW 51003,N'Thieu cot CHUONG_TRINH_GIAM_GIA.TENMAGIAMGIA.',1;

IF COL_LENGTH(N'dbo.CHUONG_TRINH_GIAM_GIA',N'LOAIGIAMGIA') IS NULL THROW 51003,N'Thieu cot CHUONG_TRINH_GIAM_GIA.LOAIGIAMGIA.',1;

IF COL_LENGTH(N'dbo.CHUONG_TRINH_GIAM_GIA',N'GIATRIGIAM') IS NULL THROW 51003,N'Thieu cot CHUONG_TRINH_GIAM_GIA.GIATRIGIAM.',1;

IF COL_LENGTH(N'dbo.CHUONG_TRINH_GIAM_GIA',N'TOIDA') IS NULL THROW 51003,N'Thieu cot CHUONG_TRINH_GIAM_GIA.TOIDA.',1;

IF COL_LENGTH(N'dbo.CHUONG_TRINH_GIAM_GIA',N'TOITHIEU') IS NULL THROW 51003,N'Thieu cot CHUONG_TRINH_GIAM_GIA.TOITHIEU.',1;

IF COL_LENGTH(N'dbo.CHUONG_TRINH_GIAM_GIA',N'SOLUONGPHIEU') IS NULL THROW 51003,N'Thieu cot CHUONG_TRINH_GIAM_GIA.SOLUONGPHIEU.',1;

IF COL_LENGTH(N'dbo.CHUONG_TRINH_GIAM_GIA',N'NGAYBATDAU') IS NULL THROW 51003,N'Thieu cot CHUONG_TRINH_GIAM_GIA.NGAYBATDAU.',1;

IF COL_LENGTH(N'dbo.CHUONG_TRINH_GIAM_GIA',N'NGAYKETTHUC') IS NULL THROW 51003,N'Thieu cot CHUONG_TRINH_GIAM_GIA.NGAYKETTHUC.',1;

IF COL_LENGTH(N'dbo.CHUONG_TRINH_GIAM_GIA',N'SOLUONGDADUNG') IS NULL THROW 51003,N'Thieu cot CHUONG_TRINH_GIAM_GIA.SOLUONGDADUNG.',1;

IF COL_LENGTH(N'dbo.CHUONG_TRINH_GIAM_GIA',N'MOTA') IS NULL THROW 51003,N'Thieu cot CHUONG_TRINH_GIAM_GIA.MOTA.',1;

IF EXISTS (SELECT 1 FROM [dbo].[CHUONG_TRINH_GIAM_GIA]) THROW 51004,N'Bang CHUONG_TRINH_GIAM_GIA co du lieu. Dung database bai tap rong; script khong xoa du lieu cu.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.CHUONG_TRINH_GIAM_GIA') AND name=N'TENMAGIAMGIA' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot CHUONG_TRINH_GIAM_GIA.TENMAGIAMGIA chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.CHUONG_TRINH_GIAM_GIA') AND name=N'LOAIGIAMGIA' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot CHUONG_TRINH_GIAM_GIA.LOAIGIAMGIA chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.CHUONG_TRINH_GIAM_GIA') AND name=N'MOTA' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot CHUONG_TRINH_GIAM_GIA.MOTA chua ho tro Unicode. Chay file 01 truoc.',1;

IF OBJECT_ID(N'dbo.LICH_SU_GIA_SAN_PHAM',N'U') IS NULL THROW 51002,N'Thieu bang LICH_SU_GIA_SAN_PHAM; chay file 00 hoac sinh bang tu PDM.',1;

IF COL_LENGTH(N'dbo.LICH_SU_GIA_SAN_PHAM',N'MASANPHAM') IS NULL THROW 51003,N'Thieu cot LICH_SU_GIA_SAN_PHAM.MASANPHAM.',1;

IF COL_LENGTH(N'dbo.LICH_SU_GIA_SAN_PHAM',N'MATHOIDIEM') IS NULL THROW 51003,N'Thieu cot LICH_SU_GIA_SAN_PHAM.MATHOIDIEM.',1;

IF COL_LENGTH(N'dbo.LICH_SU_GIA_SAN_PHAM',N'MALICHSUGIA') IS NULL THROW 51003,N'Thieu cot LICH_SU_GIA_SAN_PHAM.MALICHSUGIA.',1;

IF COL_LENGTH(N'dbo.LICH_SU_GIA_SAN_PHAM',N'LYDOTHAIDOI') IS NULL THROW 51003,N'Thieu cot LICH_SU_GIA_SAN_PHAM.LYDOTHAIDOI.',1;

IF COL_LENGTH(N'dbo.LICH_SU_GIA_SAN_PHAM',N'GIABAN') IS NULL THROW 51003,N'Thieu cot LICH_SU_GIA_SAN_PHAM.GIABAN.',1;

IF EXISTS (SELECT 1 FROM [dbo].[LICH_SU_GIA_SAN_PHAM]) THROW 51004,N'Bang LICH_SU_GIA_SAN_PHAM co du lieu. Dung database bai tap rong; script khong xoa du lieu cu.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.LICH_SU_GIA_SAN_PHAM') AND name=N'LYDOTHAIDOI' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot LICH_SU_GIA_SAN_PHAM.LYDOTHAIDOI chua ho tro Unicode. Chay file 01 truoc.',1;

IF OBJECT_ID(N'dbo.DIA_CHI_NGUOI_DUNG',N'U') IS NULL THROW 51002,N'Thieu bang DIA_CHI_NGUOI_DUNG; chay file 00 hoac sinh bang tu PDM.',1;

IF COL_LENGTH(N'dbo.DIA_CHI_NGUOI_DUNG',N'MADIACHI') IS NULL THROW 51003,N'Thieu cot DIA_CHI_NGUOI_DUNG.MADIACHI.',1;

IF COL_LENGTH(N'dbo.DIA_CHI_NGUOI_DUNG',N'MANGUOIDUNG') IS NULL THROW 51003,N'Thieu cot DIA_CHI_NGUOI_DUNG.MANGUOIDUNG.',1;

IF COL_LENGTH(N'dbo.DIA_CHI_NGUOI_DUNG',N'TENNGUOINHAN') IS NULL THROW 51003,N'Thieu cot DIA_CHI_NGUOI_DUNG.TENNGUOINHAN.',1;

IF COL_LENGTH(N'dbo.DIA_CHI_NGUOI_DUNG',N'DIACHICHITIET') IS NULL THROW 51003,N'Thieu cot DIA_CHI_NGUOI_DUNG.DIACHICHITIET.',1;

IF COL_LENGTH(N'dbo.DIA_CHI_NGUOI_DUNG',N'DATMACDINH') IS NULL THROW 51003,N'Thieu cot DIA_CHI_NGUOI_DUNG.DATMACDINH.',1;

IF COL_LENGTH(N'dbo.DIA_CHI_NGUOI_DUNG',N'SDTNGUOINHAN') IS NULL THROW 51003,N'Thieu cot DIA_CHI_NGUOI_DUNG.SDTNGUOINHAN.',1;

IF EXISTS (SELECT 1 FROM [dbo].[DIA_CHI_NGUOI_DUNG]) THROW 51004,N'Bang DIA_CHI_NGUOI_DUNG co du lieu. Dung database bai tap rong; script khong xoa du lieu cu.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.DIA_CHI_NGUOI_DUNG') AND name=N'TENNGUOINHAN' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot DIA_CHI_NGUOI_DUNG.TENNGUOINHAN chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.DIA_CHI_NGUOI_DUNG') AND name=N'DIACHICHITIET' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot DIA_CHI_NGUOI_DUNG.DIACHICHITIET chua ho tro Unicode. Chay file 01 truoc.',1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.DIA_CHI_NGUOI_DUNG') AND name=N'SDTNGUOINHAN' AND system_type_id NOT IN (231,239,99)) THROW 51005,N'Cot DIA_CHI_NGUOI_DUNG.SDTNGUOINHAN chua ho tro Unicode. Chay file 01 truoc.',1;

IF OBJECT_ID(N'dbo.THOI_DIEM',N'U') IS NULL THROW 51002,N'Thieu bang THOI_DIEM; chay file 00 hoac sinh bang tu PDM.',1;

IF COL_LENGTH(N'dbo.THOI_DIEM',N'MATHOIDIEM') IS NULL THROW 51003,N'Thieu cot THOI_DIEM.MATHOIDIEM.',1;

IF COL_LENGTH(N'dbo.THOI_DIEM',N'NGAYBATDAU') IS NULL THROW 51003,N'Thieu cot THOI_DIEM.NGAYBATDAU.',1;

IF COL_LENGTH(N'dbo.THOI_DIEM',N'NGAYKETTHUC') IS NULL THROW 51003,N'Thieu cot THOI_DIEM.NGAYKETTHUC.',1;

IF EXISTS (SELECT 1 FROM [dbo].[THOI_DIEM]) THROW 51004,N'Bang THOI_DIEM co du lieu. Dung database bai tap rong; script khong xoa du lieu cu.',1;


-- NGUOI_DUNG: 10 dong
IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id=OBJECT_ID(N'dbo.NGUOI_DUNG'))
BEGIN
SET IDENTITY_INSERT [dbo].[NGUOI_DUNG] ON;
SET @IdentityTable=N'NGUOI_DUNG';
END;

INSERT INTO [dbo].[NGUOI_DUNG] ([MANGUOIDUNG], [TAIKHOAN], [MATKHAU], [HOTEN], [EMAIL], [VAITRO], [NGAYDANGKY], [TRANGTHAITAIKHOAN])
VALUES
(1, N'demo_admin', N'$2y$10$DEMO_ACCOUNT_DISABLED_NOT_A_LOGIN_HASHXXXXXXXXXXXXXXX', N'Quản trị mẫu', N'demo.user01@example.com', N'Admin', N'2026-09-01T09:00:00', N'Khoa'),
(2, N'demo_khach_01', N'$2y$10$DEMO_ACCOUNT_DISABLED_NOT_A_LOGIN_HASHXXXXXXXXXXXXXXX', N'Khách hàng mẫu 01', N'demo.user02@example.com', N'KhachHang', N'2026-09-01T09:00:00', N'Khoa'),
(3, N'demo_khach_02', N'$2y$10$DEMO_ACCOUNT_DISABLED_NOT_A_LOGIN_HASHXXXXXXXXXXXXXXX', N'Khách hàng mẫu 02', N'demo.user03@example.com', N'KhachHang', N'2026-09-01T09:00:00', N'Khoa'),
(4, N'demo_khach_03', N'$2y$10$DEMO_ACCOUNT_DISABLED_NOT_A_LOGIN_HASHXXXXXXXXXXXXXXX', N'Khách hàng mẫu 03', N'demo.user04@example.com', N'KhachHang', N'2026-09-01T09:00:00', N'Khoa'),
(5, N'demo_khach_04', N'$2y$10$DEMO_ACCOUNT_DISABLED_NOT_A_LOGIN_HASHXXXXXXXXXXXXXXX', N'Khách hàng mẫu 04', N'demo.user05@example.com', N'KhachHang', N'2026-09-01T09:00:00', N'Khoa'),
(6, N'demo_khach_05', N'$2y$10$DEMO_ACCOUNT_DISABLED_NOT_A_LOGIN_HASHXXXXXXXXXXXXXXX', N'Khách hàng mẫu 05', N'demo.user06@example.com', N'KhachHang', N'2026-09-01T09:00:00', N'Khoa'),
(7, N'demo_khach_06', N'$2y$10$DEMO_ACCOUNT_DISABLED_NOT_A_LOGIN_HASHXXXXXXXXXXXXXXX', N'Khách hàng mẫu 06', N'demo.user07@example.com', N'KhachHang', N'2026-09-01T09:00:00', N'Khoa'),
(8, N'demo_khach_07', N'$2y$10$DEMO_ACCOUNT_DISABLED_NOT_A_LOGIN_HASHXXXXXXXXXXXXXXX', N'Khách hàng mẫu 07', N'demo.user08@example.com', N'KhachHang', N'2026-09-01T09:00:00', N'Khoa'),
(9, N'demo_khach_08', N'$2y$10$DEMO_ACCOUNT_DISABLED_NOT_A_LOGIN_HASHXXXXXXXXXXXXXXX', N'Khách hàng mẫu 08', N'demo.user09@example.com', N'KhachHang', N'2026-09-01T09:00:00', N'Khoa'),
(10, N'demo_khach_09', N'$2y$10$DEMO_ACCOUNT_DISABLED_NOT_A_LOGIN_HASHXXXXXXXXXXXXXXX', N'Khách hàng mẫu 09', N'demo.user10@example.com', N'KhachHang', N'2026-09-01T09:00:00', N'Khoa');

IF @IdentityTable=N'NGUOI_DUNG'
BEGIN
SET IDENTITY_INSERT [dbo].[NGUOI_DUNG] OFF;
SET @IdentityTable=NULL;
END;


-- DANH_MUC: 50 dong
IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id=OBJECT_ID(N'dbo.DANH_MUC'))
BEGIN
SET IDENTITY_INSERT [dbo].[DANH_MUC] ON;
SET @IdentityTable=N'DANH_MUC';
END;

INSERT INTO [dbo].[DANH_MUC] ([MADANHMUC], [TENDANHMUC], [HINHANHDANHMUC])
VALUES
(1, N'Violet châu Phi', N'assets/demo/categories/01.jpg'),
(2, N'Cây mọng nước và sen đá', N'assets/demo/categories/02.jpg'),
(3, N'Hồng môn', N'assets/demo/categories/03.jpg'),
(4, N'Cau cảnh', N'assets/demo/categories/04.jpg'),
(5, N'Trầu bà dây leo', N'assets/demo/categories/05.jpg'),
(6, N'Cây cảnh thảo lâu năm', N'assets/demo/categories/06.jpg'),
(7, N'Trường sinh Peperomia', N'assets/demo/categories/07.jpg'),
(8, N'Cây thảm Soleirolia', N'assets/demo/categories/08.jpg'),
(9, N'Thiên điểu', N'assets/demo/categories/09.jpg'),
(10, N'Dương xỉ cảnh', N'assets/demo/categories/10.jpg'),
(11, N'Môn Alocasia', N'assets/demo/categories/11.jpg'),
(12, N'Dứa cảnh Neoregelia', N'assets/demo/categories/12.jpg'),
(13, N'Cây hoa thân hành và thân rễ', N'assets/demo/categories/13.jpg'),
(14, N'Cây hạnh phúc', N'assets/demo/categories/14.jpg'),
(15, N'Aglaonema lá màu', N'assets/demo/categories/15.jpg'),
(16, N'Dâm bụt', N'assets/demo/categories/16.jpg'),
(17, N'Pilea cảnh', N'assets/demo/categories/17.jpg'),
(18, N'Xương rồng rủ Schlumbergera', N'assets/demo/categories/18.jpg'),
(19, N'Hoa cúc', N'assets/demo/categories/19.jpg'),
(20, N'Tía tô cảnh', N'assets/demo/categories/20.jpg'),
(21, N'Cây quả cảnh Ardisia', N'assets/demo/categories/21.jpg'),
(22, N'Phất dụ và thiết mộc lan', N'assets/demo/categories/22.jpg'),
(23, N'Sanh, si và đa Ficus', N'assets/demo/categories/23.jpg'),
(24, N'Cây cảnh Euphorbia', N'assets/demo/categories/24.jpg'),
(25, N'Dong cảnh và đuôi công', N'assets/demo/categories/25.jpg'),
(26, N'Vạn niên thanh Dieffenbachia', N'assets/demo/categories/26.jpg'),
(27, N'Thường xuân', N'assets/demo/categories/27.jpg'),
(28, N'Cẩm tú cầu', N'assets/demo/categories/28.jpg'),
(29, N'Cô tòng', N'assets/demo/categories/29.jpg'),
(30, N'Trầu bà Philodendron', N'assets/demo/categories/30.jpg'),
(31, N'Môn lá màu Caladium', N'assets/demo/categories/31.jpg'),
(32, N'Đỗ quyên', N'assets/demo/categories/32.jpg'),
(33, N'Thu hải đường', N'assets/demo/categories/33.jpg'),
(34, N'Kim ngân Pachira', N'assets/demo/categories/34.jpg'),
(35, N'Trầu bà Monstera', N'assets/demo/categories/35.jpg'),
(36, N'Lẻ bạn Tradescantia', N'assets/demo/categories/36.jpg'),
(37, N'Cây lá nhỏ nhiều màu', N'assets/demo/categories/37.jpg'),
(38, N'Hoa lan', N'assets/demo/categories/38.jpg'),
(39, N'Chuối cảnh Heliconia', N'assets/demo/categories/39.jpg'),
(40, N'Lan ý', N'assets/demo/categories/40.jpg'),
(41, N'Bạc hà', N'assets/demo/categories/41.jpg'),
(42, N'Cây chân voi', N'assets/demo/categories/42.jpg'),
(43, N'Cây tuế', N'assets/demo/categories/43.jpg'),
(44, N'Ngũ gia bì theo nhóm', N'assets/demo/categories/44.jpg'),
(45, N'Lưỡi hổ theo nhóm', N'assets/demo/categories/45.jpg'),
(46, N'Cây bẫy kẹp', N'assets/demo/categories/46.jpg'),
(47, N'Tùng la hán', N'assets/demo/categories/47.jpg'),
(48, N'Yucca cảnh', N'assets/demo/categories/48.jpg'),
(49, N'Kim tiền', N'assets/demo/categories/49.jpg'),
(50, N'Cây ngựa vằn Aphelandra', N'assets/demo/categories/50.jpg');

IF @IdentityTable=N'DANH_MUC'
BEGIN
SET IDENTITY_INSERT [dbo].[DANH_MUC] OFF;
SET @IdentityTable=NULL;
END;


-- CHUONG_TRINH_GIAM_GIA: 50 dong
IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id=OBJECT_ID(N'dbo.CHUONG_TRINH_GIAM_GIA'))
BEGIN
SET IDENTITY_INSERT [dbo].[CHUONG_TRINH_GIAM_GIA] ON;
SET @IdentityTable=N'CHUONG_TRINH_GIAM_GIA';
END;

INSERT INTO [dbo].[CHUONG_TRINH_GIAM_GIA] ([MACHUONGTRINHGIAMGIA], [TENMAGIAMGIA], [LOAIGIAMGIA], [GIATRIGIAM], [TOIDA], [TOITHIEU], [SOLUONGPHIEU], [NGAYBATDAU], [NGAYKETTHUC], [SOLUONGDADUNG], [MOTA])
VALUES
(1, N'Ưu đãi mẫu 01', N'PhanTram', 10, 50000, 100000, 101, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(2, N'Ưu đãi mẫu 02', N'SoTien', 20000, 50000, 100000, 102, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(3, N'Ưu đãi mẫu 03', N'PhanTram', 20, 50000, 100000, 103, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(4, N'Ưu đãi mẫu 04', N'SoTien', 10000, 50000, 100000, 104, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(5, N'Ưu đãi mẫu 05', N'PhanTram', 10, 50000, 100000, 105, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(6, N'Ưu đãi mẫu 06', N'SoTien', 20000, 50000, 100000, 106, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(7, N'Ưu đãi mẫu 07', N'PhanTram', 20, 50000, 100000, 107, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(8, N'Ưu đãi mẫu 08', N'SoTien', 10000, 50000, 100000, 108, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(9, N'Ưu đãi mẫu 09', N'PhanTram', 10, 50000, 100000, 109, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(10, N'Ưu đãi mẫu 10', N'SoTien', 20000, 50000, 100000, 110, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(11, N'Ưu đãi mẫu 11', N'PhanTram', 20, 50000, 100000, 111, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(12, N'Ưu đãi mẫu 12', N'SoTien', 10000, 50000, 100000, 112, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(13, N'Ưu đãi mẫu 13', N'PhanTram', 10, 50000, 100000, 113, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(14, N'Ưu đãi mẫu 14', N'SoTien', 20000, 50000, 100000, 114, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(15, N'Ưu đãi mẫu 15', N'PhanTram', 20, 50000, 100000, 115, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(16, N'Ưu đãi mẫu 16', N'SoTien', 10000, 50000, 100000, 116, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(17, N'Ưu đãi mẫu 17', N'PhanTram', 10, 50000, 100000, 117, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(18, N'Ưu đãi mẫu 18', N'SoTien', 20000, 50000, 100000, 118, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(19, N'Ưu đãi mẫu 19', N'PhanTram', 20, 50000, 100000, 119, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(20, N'Ưu đãi mẫu 20', N'SoTien', 10000, 50000, 100000, 120, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(21, N'Ưu đãi mẫu 21', N'PhanTram', 10, 50000, 100000, 121, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(22, N'Ưu đãi mẫu 22', N'SoTien', 20000, 50000, 100000, 122, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(23, N'Ưu đãi mẫu 23', N'PhanTram', 20, 50000, 100000, 123, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(24, N'Ưu đãi mẫu 24', N'SoTien', 10000, 50000, 100000, 124, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(25, N'Ưu đãi mẫu 25', N'PhanTram', 10, 50000, 100000, 125, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(26, N'Ưu đãi mẫu 26', N'SoTien', 20000, 50000, 100000, 126, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(27, N'Ưu đãi mẫu 27', N'PhanTram', 20, 50000, 100000, 127, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(28, N'Ưu đãi mẫu 28', N'SoTien', 10000, 50000, 100000, 128, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(29, N'Ưu đãi mẫu 29', N'PhanTram', 10, 50000, 100000, 129, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(30, N'Ưu đãi mẫu 30', N'SoTien', 20000, 50000, 100000, 130, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(31, N'Ưu đãi mẫu 31', N'PhanTram', 20, 50000, 100000, 131, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(32, N'Ưu đãi mẫu 32', N'SoTien', 10000, 50000, 100000, 132, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(33, N'Ưu đãi mẫu 33', N'PhanTram', 10, 50000, 100000, 133, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(34, N'Ưu đãi mẫu 34', N'SoTien', 20000, 50000, 100000, 134, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(35, N'Ưu đãi mẫu 35', N'PhanTram', 20, 50000, 100000, 135, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(36, N'Ưu đãi mẫu 36', N'SoTien', 10000, 50000, 100000, 136, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(37, N'Ưu đãi mẫu 37', N'PhanTram', 10, 50000, 100000, 137, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(38, N'Ưu đãi mẫu 38', N'SoTien', 20000, 50000, 100000, 138, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(39, N'Ưu đãi mẫu 39', N'PhanTram', 20, 50000, 100000, 139, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(40, N'Ưu đãi mẫu 40', N'SoTien', 10000, 50000, 100000, 140, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(41, N'Ưu đãi mẫu 41', N'PhanTram', 10, 50000, 100000, 141, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(42, N'Ưu đãi mẫu 42', N'SoTien', 20000, 50000, 100000, 142, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(43, N'Ưu đãi mẫu 43', N'PhanTram', 20, 50000, 100000, 143, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(44, N'Ưu đãi mẫu 44', N'SoTien', 10000, 50000, 100000, 144, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(45, N'Ưu đãi mẫu 45', N'PhanTram', 10, 50000, 100000, 145, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(46, N'Ưu đãi mẫu 46', N'SoTien', 20000, 50000, 100000, 146, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(47, N'Ưu đãi mẫu 47', N'PhanTram', 20, 50000, 100000, 147, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(48, N'Ưu đãi mẫu 48', N'SoTien', 10000, 50000, 100000, 148, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(49, N'Ưu đãi mẫu 49', N'PhanTram', 10, 50000, 100000, 149, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.'),
(50, N'Ưu đãi mẫu 50', N'SoTien', 20000, 50000, 100000, 150, N'2026-10-01T00:00:00', N'2026-11-01T00:00:00', 1, N'Chương trình giả lập áp dụng cho toàn đơn; không phải ưu đãi thật.');

IF @IdentityTable=N'CHUONG_TRINH_GIAM_GIA'
BEGIN
SET IDENTITY_INSERT [dbo].[CHUONG_TRINH_GIAM_GIA] OFF;
SET @IdentityTable=NULL;
END;


-- THOI_DIEM: 180 dong
IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id=OBJECT_ID(N'dbo.THOI_DIEM'))
BEGIN
SET IDENTITY_INSERT [dbo].[THOI_DIEM] ON;
SET @IdentityTable=N'THOI_DIEM';
END;

INSERT INTO [dbo].[THOI_DIEM] ([MATHOIDIEM], [NGAYBATDAU], [NGAYKETTHUC])
VALUES
(1, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(2, N'2026-10-01T00:00:00', NULL),
(3, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(4, N'2026-10-01T00:00:00', NULL),
(5, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(6, N'2026-10-01T00:00:00', NULL),
(7, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(8, N'2026-10-01T00:00:00', NULL),
(9, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(10, N'2026-10-01T00:00:00', NULL),
(11, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(12, N'2026-10-01T00:00:00', NULL),
(13, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(14, N'2026-10-01T00:00:00', NULL),
(15, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(16, N'2026-10-01T00:00:00', NULL),
(17, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(18, N'2026-10-01T00:00:00', NULL),
(19, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(20, N'2026-10-01T00:00:00', NULL),
(21, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(22, N'2026-10-01T00:00:00', NULL),
(23, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(24, N'2026-10-01T00:00:00', NULL),
(25, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(26, N'2026-10-01T00:00:00', NULL),
(27, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(28, N'2026-10-01T00:00:00', NULL),
(29, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(30, N'2026-10-01T00:00:00', NULL),
(31, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(32, N'2026-10-01T00:00:00', NULL),
(33, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(34, N'2026-10-01T00:00:00', NULL),
(35, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(36, N'2026-10-01T00:00:00', NULL),
(37, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(38, N'2026-10-01T00:00:00', NULL),
(39, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(40, N'2026-10-01T00:00:00', NULL),
(41, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(42, N'2026-10-01T00:00:00', NULL),
(43, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(44, N'2026-10-01T00:00:00', NULL),
(45, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(46, N'2026-10-01T00:00:00', NULL),
(47, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(48, N'2026-10-01T00:00:00', NULL),
(49, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(50, N'2026-10-01T00:00:00', NULL),
(51, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(52, N'2026-10-01T00:00:00', NULL),
(53, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(54, N'2026-10-01T00:00:00', NULL),
(55, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(56, N'2026-10-01T00:00:00', NULL),
(57, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(58, N'2026-10-01T00:00:00', NULL),
(59, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(60, N'2026-10-01T00:00:00', NULL),
(61, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(62, N'2026-10-01T00:00:00', NULL),
(63, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(64, N'2026-10-01T00:00:00', NULL),
(65, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(66, N'2026-10-01T00:00:00', NULL),
(67, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(68, N'2026-10-01T00:00:00', NULL),
(69, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(70, N'2026-10-01T00:00:00', NULL),
(71, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(72, N'2026-10-01T00:00:00', NULL),
(73, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(74, N'2026-10-01T00:00:00', NULL),
(75, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(76, N'2026-10-01T00:00:00', NULL),
(77, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(78, N'2026-10-01T00:00:00', NULL),
(79, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(80, N'2026-10-01T00:00:00', NULL),
(81, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(82, N'2026-10-01T00:00:00', NULL),
(83, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(84, N'2026-10-01T00:00:00', NULL),
(85, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(86, N'2026-10-01T00:00:00', NULL),
(87, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(88, N'2026-10-01T00:00:00', NULL),
(89, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(90, N'2026-10-01T00:00:00', NULL),
(91, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(92, N'2026-10-01T00:00:00', NULL),
(93, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(94, N'2026-10-01T00:00:00', NULL),
(95, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(96, N'2026-10-01T00:00:00', NULL),
(97, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(98, N'2026-10-01T00:00:00', NULL),
(99, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(100, N'2026-10-01T00:00:00', NULL),
(101, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(102, N'2026-10-01T00:00:00', NULL),
(103, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(104, N'2026-10-01T00:00:00', NULL),
(105, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(106, N'2026-10-01T00:00:00', NULL),
(107, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(108, N'2026-10-01T00:00:00', NULL),
(109, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(110, N'2026-10-01T00:00:00', NULL),
(111, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(112, N'2026-10-01T00:00:00', NULL),
(113, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(114, N'2026-10-01T00:00:00', NULL),
(115, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(116, N'2026-10-01T00:00:00', NULL),
(117, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(118, N'2026-10-01T00:00:00', NULL),
(119, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(120, N'2026-10-01T00:00:00', NULL),
(121, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(122, N'2026-10-01T00:00:00', NULL),
(123, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(124, N'2026-10-01T00:00:00', NULL),
(125, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(126, N'2026-10-01T00:00:00', NULL),
(127, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(128, N'2026-10-01T00:00:00', NULL),
(129, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(130, N'2026-10-01T00:00:00', NULL),
(131, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(132, N'2026-10-01T00:00:00', NULL),
(133, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(134, N'2026-10-01T00:00:00', NULL),
(135, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(136, N'2026-10-01T00:00:00', NULL),
(137, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(138, N'2026-10-01T00:00:00', NULL),
(139, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(140, N'2026-10-01T00:00:00', NULL),
(141, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(142, N'2026-10-01T00:00:00', NULL),
(143, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(144, N'2026-10-01T00:00:00', NULL),
(145, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(146, N'2026-10-01T00:00:00', NULL),
(147, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(148, N'2026-10-01T00:00:00', NULL),
(149, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(150, N'2026-10-01T00:00:00', NULL),
(151, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(152, N'2026-10-01T00:00:00', NULL),
(153, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(154, N'2026-10-01T00:00:00', NULL),
(155, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(156, N'2026-10-01T00:00:00', NULL),
(157, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(158, N'2026-10-01T00:00:00', NULL),
(159, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(160, N'2026-10-01T00:00:00', NULL),
(161, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(162, N'2026-10-01T00:00:00', NULL),
(163, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(164, N'2026-10-01T00:00:00', NULL),
(165, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(166, N'2026-10-01T00:00:00', NULL),
(167, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(168, N'2026-10-01T00:00:00', NULL),
(169, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(170, N'2026-10-01T00:00:00', NULL),
(171, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(172, N'2026-10-01T00:00:00', NULL),
(173, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(174, N'2026-10-01T00:00:00', NULL),
(175, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(176, N'2026-10-01T00:00:00', NULL),
(177, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(178, N'2026-10-01T00:00:00', NULL),
(179, N'2026-09-01T00:00:00', N'2026-10-01T00:00:00'),
(180, N'2026-10-01T00:00:00', NULL);

IF @IdentityTable=N'THOI_DIEM'
BEGIN
SET IDENTITY_INSERT [dbo].[THOI_DIEM] OFF;
SET @IdentityTable=NULL;
END;


-- TIM_ANH: 60 dong
IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id=OBJECT_ID(N'dbo.TIM_ANH'))
BEGIN
SET IDENTITY_INSERT [dbo].[TIM_ANH] ON;
SET @IdentityTable=N'TIM_ANH';
END;

INSERT INTO [dbo].[TIM_ANH] ([MATIMKIEM], [MANGUOIDUNG], [HINHANHURL], [THOIGIAN], [NENTANG], [PHIENBANMODEL], [TRANGTHAINHANDIEN])
VALUES
(1, 2, N'assets/demo/searches/001.jpg', N'2026-10-08T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(2, 3, N'assets/demo/searches/002.jpg', N'2026-10-09T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(3, 4, N'assets/demo/searches/003.jpg', N'2026-10-07T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(4, 5, N'assets/demo/searches/004.jpg', N'2026-10-08T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(5, 6, N'assets/demo/searches/005.jpg', N'2026-10-09T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(6, 7, N'assets/demo/searches/006.jpg', N'2026-10-07T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(7, 8, N'assets/demo/searches/007.jpg', N'2026-10-08T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(8, 9, N'assets/demo/searches/008.jpg', N'2026-10-09T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(9, 10, N'assets/demo/searches/009.jpg', N'2026-10-07T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(10, 2, N'assets/demo/searches/010.jpg', N'2026-10-08T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(11, 3, N'assets/demo/searches/011.jpg', N'2026-10-09T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(12, 4, N'assets/demo/searches/012.jpg', N'2026-10-07T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(13, 5, N'assets/demo/searches/013.jpg', N'2026-10-08T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(14, 6, N'assets/demo/searches/014.jpg', N'2026-10-09T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(15, 7, N'assets/demo/searches/015.jpg', N'2026-10-07T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(16, 8, N'assets/demo/searches/016.jpg', N'2026-10-08T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(17, 9, N'assets/demo/searches/017.jpg', N'2026-10-09T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(18, 10, N'assets/demo/searches/018.jpg', N'2026-10-07T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(19, 2, N'assets/demo/searches/019.jpg', N'2026-10-08T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(20, 3, N'assets/demo/searches/020.jpg', N'2026-10-09T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(21, 4, N'assets/demo/searches/021.jpg', N'2026-10-07T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(22, 5, N'assets/demo/searches/022.jpg', N'2026-10-08T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(23, 6, N'assets/demo/searches/023.jpg', N'2026-10-09T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(24, 7, N'assets/demo/searches/024.jpg', N'2026-10-07T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(25, 8, N'assets/demo/searches/025.jpg', N'2026-10-08T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(26, 9, N'assets/demo/searches/026.jpg', N'2026-10-09T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(27, 10, N'assets/demo/searches/027.jpg', N'2026-10-07T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(28, 2, N'assets/demo/searches/028.jpg', N'2026-10-08T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(29, 3, N'assets/demo/searches/029.jpg', N'2026-10-09T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(30, 4, N'assets/demo/searches/030.jpg', N'2026-10-07T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(31, 5, N'assets/demo/searches/031.jpg', N'2026-10-08T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(32, 6, N'assets/demo/searches/032.jpg', N'2026-10-09T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(33, 7, N'assets/demo/searches/033.jpg', N'2026-10-07T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(34, 8, N'assets/demo/searches/034.jpg', N'2026-10-08T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(35, 9, N'assets/demo/searches/035.jpg', N'2026-10-09T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(36, 10, N'assets/demo/searches/036.jpg', N'2026-10-07T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(37, 2, N'assets/demo/searches/037.jpg', N'2026-10-08T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(38, 3, N'assets/demo/searches/038.jpg', N'2026-10-09T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(39, 4, N'assets/demo/searches/039.jpg', N'2026-10-07T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(40, 5, N'assets/demo/searches/040.jpg', N'2026-10-08T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(41, 6, N'assets/demo/searches/041.jpg', N'2026-10-09T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(42, 7, N'assets/demo/searches/042.jpg', N'2026-10-07T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(43, 8, N'assets/demo/searches/043.jpg', N'2026-10-08T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(44, 9, N'assets/demo/searches/044.jpg', N'2026-10-09T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(45, 10, N'assets/demo/searches/045.jpg', N'2026-10-07T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(46, 2, N'assets/demo/searches/046.jpg', N'2026-10-08T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(47, 3, N'assets/demo/searches/047.jpg', N'2026-10-09T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(48, 4, N'assets/demo/searches/048.jpg', N'2026-10-07T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(49, 5, N'assets/demo/searches/049.jpg', N'2026-10-08T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(50, 6, N'assets/demo/searches/050.jpg', N'2026-10-09T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(51, 7, N'assets/demo/searches/051.jpg', N'2026-10-07T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(52, 8, N'assets/demo/searches/052.jpg', N'2026-10-08T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(53, 9, N'assets/demo/searches/053.jpg', N'2026-10-09T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(54, 10, N'assets/demo/searches/054.jpg', N'2026-10-07T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(55, 2, N'assets/demo/searches/055.jpg', N'2026-10-08T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(56, 3, N'assets/demo/searches/056.jpg', N'2026-10-09T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(57, 4, N'assets/demo/searches/057.jpg', N'2026-10-07T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(58, 5, N'assets/demo/searches/058.jpg', N'2026-10-08T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong'),
(59, 6, N'assets/demo/searches/059.jpg', N'2026-10-09T11:00:00', N'Web', N'demo_90_v1', N'ThanhCong'),
(60, 7, N'assets/demo/searches/060.jpg', N'2026-10-07T11:00:00', N'Mobile', N'demo_90_v1', N'ThanhCong');

IF @IdentityTable=N'TIM_ANH'
BEGIN
SET IDENTITY_INSERT [dbo].[TIM_ANH] OFF;
SET @IdentityTable=NULL;
END;


-- LOAI_CAY: 90 dong
IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id=OBJECT_ID(N'dbo.LOAI_CAY'))
BEGIN
SET IDENTITY_INSERT [dbo].[LOAI_CAY] ON;
SET @IdentityTable=N'LOAI_CAY';
END;

INSERT INTO [dbo].[LOAI_CAY] ([MALOAICAY], [MADANHMUC], [TENKHOAHOC], [TENTHUONGGOI], [DACDIEMNHANDANG], [XUATXU], [HUONGDANCHAMSOC], [GIATHAMKHAO])
VALUES
(1, 1, N'Saintpaulia ionantha', N'Violet châu Phi', N'Lá mọc thành hoa thị, mềm và có lông; hoa nhỏ thường tím, hồng hoặc trắng. Lưu ý nhãn: Tên Saintpaulia trong nhãn là tên cũ; giữ nguyên liên kết mô hình.', N'Đông Phi', N'Ánh sáng tán xạ; giá thể thoát nước; giữ ẩm vừa, tránh đọng nước trên ngọn.', 85000),
(2, 2, N'Aloe vera', N'Nha đam', N'Lá mọng nước dài, mép có răng nhỏ, mọc thành hoa thị; gel trong lá.', N'Bán đảo Ả Rập; được trồng rộng rãi', N'Nơi sáng, tăng nắng từ từ; đất thoát nước nhanh; để đất khô giữa các lần tưới.', 60000),
(3, 3, N'Anthurium andraeanum', N'Hồng môn', N'Lá xanh hình tim; mo hoa có màu bao quanh trục hoa dạng bông dài.', N'Colombia và Ecuador', N'Ánh sáng tán xạ; giữ ẩm nhẹ và thông thoáng; tránh nắng trưa, không để úng.', 150000),
(4, 4, N'Dypsis lutescens', N'Cau vàng', N'Mọc thành bụi nhiều thân vàng; lá kép lông chim cong, nhiều lá chét hẹp. Lưu ý nhãn: Tên chi Dypsis được giữ theo nhãn mô hình.', N'Madagascar', N'Nơi sáng tán xạ; tưới khi mặt đất se khô; chậu thoát nước, độ ẩm không khí vừa.', 180000),
(5, 5, N'Syngonium podophyllum', N'Trầu bà mũi tên (tróc bạc)', N'Cây leo; lá non hình mũi tên, lá trưởng thành có thể chia nhiều thùy. Lưu ý nhãn: Tên Việt có thể khác theo địa phương; giữ liên kết Syngonium podophyllum.', N'Mexico và vùng nhiệt đới châu Mỹ', N'Ánh sáng tán xạ; tưới khi lớp mặt đất khô; có thể làm trụ leo.', 70000),
(6, 6, N'Asparagus setaceus', N'Măng tây cảnh', N'Cành mảnh phân nhiều nhánh; các cành lá giả nhỏ tạo tán mềm như lông chim. Lưu ý nhãn: Không phải dương xỉ thực sự.', N'Miền nam châu Phi', N'Ánh sáng tán xạ; giữ đất ẩm vừa; tránh để khô kéo dài và tránh úng.', 70000),
(7, 7, N'Peperomia obtusifolia', N'Trường sinh lá tròn', N'Thân thấp, lá dày bóng hình bầu dục đầu tù; có dạng lá xanh hoặc loang màu.', N'Vùng nhiệt đới châu Mỹ', N'Ánh sáng tán xạ; đất thoáng; để lớp mặt khô trước khi tưới, tránh dư nước.', 85000),
(8, 8, N'Soleirolia soleirolii', N'Thảm nước mắt', N'Cây bò sát đất tạo thảm; lá rất nhỏ, tròn, màu xanh trên thân mảnh. Lưu ý nhãn: Tên Việt mô tả, chưa coi là tên địa phương thống nhất.', N'Khu vực Địa Trung Hải', N'Ánh sáng dịu; duy trì ẩm đều nhưng không ngập nước; tránh nắng nóng trực tiếp.', 65000),
(9, 9, N'Strelitzia reginae', N'Thiên điểu hoa cam', N'Lá dài cứng dạng mái chèo; hoa cam và xanh mọc từ mo hoa giống đầu chim.', N'Nam Phi', N'Nơi nhiều sáng hoặc nắng thích nghi; đất thoát nước; tưới khi mặt đất khô.', 200000),
(10, 10, N'Asplenium nidus', N'Dương xỉ tổ chim', N'Lá nguyên dài, bóng, gân giữa rõ; lá mọc tỏa từ tâm tạo dạng tổ chim.', N'Vùng nhiệt đới Cựu Thế giới', N'Ánh sáng tán xạ; giá thể ẩm và thoáng; tưới quanh gốc, tránh đọng nước ở tâm.', 120000),
(11, 11, N'Alocasia reginula', N'Môn nhung đen', N'Lá nhỏ hình tim, mặt lá rất sẫm và mịn như nhung; gân sáng tương phản.', N'Có khả năng từ Borneo; theo Kew', N'Ánh sáng tán xạ; giá thể thoáng; giữ ẩm vừa, tránh úng và không khí quá khô.', 220000),
(12, 12, N'Neoregelia carolinae', N'Dứa cảnh tâm đỏ', N'Lá dài mọc hoa thị; vùng tâm chuyển đỏ khi ra hoa; hoa nhỏ ở giữa hoa thị.', N'Brazil', N'Ánh sáng tán xạ mạnh; giá thể thoáng; dùng nước sạch và thay nước trong bẹ định kỳ.', 130000),
(13, 10, N'Nephrolepis exaltata', N'Dương xỉ Boston', N'Tàu lá cong dài gồm nhiều lá chét nhỏ; cây tạo bụi xanh mềm rủ xuống. Lưu ý nhãn: Boston fern thường là giống trồng trong phạm vi loài này.', N'Châu Mỹ nhiệt đới và cận nhiệt đới', N'Ánh sáng tán xạ; giữ ẩm đều, tăng độ ẩm không khí; không để rễ ngập nước.', 90000),
(14, 13, N'Zantedeschia aethiopica', N'Hoa rum trắng', N'Lá lớn dạng mũi tên; mo hoa trắng hình phễu bao quanh trục hoa vàng.', N'Miền nam châu Phi', N'Ánh sáng tốt; đất giàu hữu cơ và ẩm trong thời kỳ sinh trưởng; giảm tưới khi nghỉ.', 140000),
(15, 6, N'Aspidistra elatior', N'Tỏi rừng', N'Lá dài hình mác, xanh sẫm, cuống mọc từ thân rễ; phát triển chậm.', N'Nhật Bản', N'Bóng sáng hoặc ánh sáng tán xạ; đất thoát nước; để lớp mặt khô trước khi tưới.', 130000),
(16, 14, N'Radermachera sinica', N'Hạnh phúc', N'Cây thân gỗ, lá kép xanh bóng; nhiều lá chét nhỏ tạo tán dày.', N'Đông Himalaya đến nam Trung Quốc, bắc Đông Dương và Đài Loan', N'Nơi sáng tán xạ; giữ đất ẩm vừa; tránh thay đổi môi trường đột ngột và tránh úng.', 160000),
(17, 15, N'Aglaonema commutatum', N'Phú quý Siam', N'Lá bầu dục thuôn, có thể có viền hoặc mảng đỏ ở giống trồng; thân dạng bụi. Lưu ý nhãn: Siam là tên thương mại; cần xác minh giống cụ thể trước khi công bố loài/giống.', N'Philippines và Sulawesi', N'Ánh sáng tán xạ; đất thoáng; tưới khi lớp mặt khô, tránh nắng trưa.', 110000),
(18, 16, N'Hibiscus rosa-sinensis', N'Dâm bụt', N'Cây bụi lá bóng mép răng cưa; hoa lớn năm cánh, cột nhị nhô dài. Lưu ý nhãn: Không khẳng định một quốc gia xuất xứ duy nhất.', N'Cây trồng lâu đời; nguồn gốc tự nhiên còn được thảo luận', N'Nơi có nắng; đất thoát nước; giữ ẩm khi sinh trưởng, cắt tỉa sau đợt hoa.', 90000),
(19, 17, N'Pilea peperomioides', N'Cỏ đồng tiền Trung Quốc', N'Lá tròn gần như đồng xu; cuống lá gắn gần tâm phiến; thân đứng và dễ ra cây con.', N'Trung Quốc', N'Ánh sáng tán xạ; xoay chậu để tán đều; tưới khi lớp mặt đất khô.', 120000),
(20, 18, N'Schlumbergera bridgesii', N'Xương rồng Giáng sinh', N'Thân dẹt nối thành đốt, mọc rủ; hoa hình ống ở đầu các đốt thân. Lưu ý nhãn: Thường ghi Schlumbergera x bridgesii; nhãn mô hình bỏ ký hiệu lai.', N'Giống lai trồng; tổ tiên từ Brazil', N'Ánh sáng tán xạ; giá thể thoáng và ẩm vừa; cần chu kỳ đêm dài phù hợp để ra nụ.', 130000),
(21, 19, N'Chrysanthemum spp.', N'Hoa cúc', N'Lá thường có thùy và mép răng; cụm hoa đầu với nhiều hoa nhỏ, hình dạng tùy giống. Lưu ý nhãn: Nhãn cấp chi/nhóm, không đủ để xác định một loài.', N'Phụ thuộc loài hoặc giống; nhiều giống trồng có nguồn gốc Đông Á', N'Nơi sáng và có nắng phù hợp; đất thoát nước; tưới vào gốc, tránh để chậu khô kéo dài.', 60000),
(22, 20, N'Coleus scutellarioides', N'Tía tô cảnh', N'Lá đối, mép răng cưa; nhiều giống phối màu đỏ, tím, vàng và xanh.', N'Vùng nhiệt đới châu Á đến châu Đại Dương', N'Ánh sáng tốt, tránh nắng quá gắt với giống mỏng lá; giữ ẩm vừa; bấm ngọn tạo bụi.', 45000),
(23, 21, N'Ardisia crenata', N'Kim ngân lượng', N'Cây bụi lá bóng, mép lượn hoặc khía; chùm quả đỏ nhỏ thường ở dưới tán lá.', N'Đông Á và Đông Nam Á', N'Ánh sáng tán xạ; đất thoát nước giàu hữu cơ; giữ ẩm vừa, tránh úng.', 180000),
(24, 22, N'Dracaena fragrans', N'Thiết mộc lan', N'Thân gỗ dạng đốt; lá dài dạng dải, xanh hoặc có sọc sáng tùy giống.', N'Châu Phi nhiệt đới', N'Ánh sáng tán xạ; tưới khi lớp đất mặt khô; tránh tích nước trong chậu.', 200000),
(25, 23, N'Ficus pumila', N'Vảy ốc', N'Cây leo bám bằng rễ; lá non nhỏ hình tim hoặc bầu dục, lá trưởng thành lớn hơn.', N'Đông Á', N'Ánh sáng tán xạ đến nắng thích nghi; giữ ẩm vừa; cắt tỉa để kiểm soát dây leo.', 60000),
(26, 24, N'Euphorbia milii', N'Xương rồng bát tiên', N'Thân mọng có gai; lá tập trung ở ngọn; lá bắc màu bao quanh hoa nhỏ. Lưu ý nhãn: Có nhựa mủ gây kích ứng; không phải họ Xương rồng.', N'Madagascar', N'Nơi nhiều sáng và nắng thích nghi; đất thoát nước nhanh; để đất khô giữa các lần tưới.', 90000),
(27, 25, N'Ctenanthe spp.', N'Dong cảnh Ctenanthe', N'Lá bầu dục thường có sọc hoặc mảng sáng; mặt dưới nhiều dạng có màu tím. Lưu ý nhãn: Nhãn cấp chi; không đủ xác định một loài.', N'Châu Mỹ nhiệt đới', N'Ánh sáng tán xạ; ẩm không khí khá cao; giữ giá thể ẩm nhẹ, tránh nắng trực tiếp.', 130000),
(28, 13, N'Narcissus spp.', N'Thủy tiên Narcissus', N'Cây thân hành, lá dạng dải; hoa có vành bao hoa và phần tràng phụ ở giữa. Lưu ý nhãn: Nhãn cấp chi; không mặc định là thủy tiên ta.', N'Phụ thuộc loài; chủ yếu châu Âu và vùng Địa Trung Hải', N'Nơi sáng; đất thoát nước; tưới trong thời kỳ sinh trưởng, giảm tưới khi lá tàn.', 85000),
(29, 5, N'Epipremnum pinnatum', N'Trầu bà đuôi rồng', N'Dây leo; lá non nguyên, lá trưởng thành lớn và xẻ dọc theo hai bên gân chính.', N'Châu Á nhiệt đới và khu vực Thái Bình Dương', N'Ánh sáng tán xạ; giá thể thoáng; tưới khi mặt đất khô; trụ leo giúp phát triển lá lớn.', 130000),
(30, 26, N'Dieffenbachia spp.', N'Vạn niên thanh Dieffenbachia', N'Thân dạng đốt; lá lớn bầu dục, thường có mảng trắng hoặc vàng ở giữa. Lưu ý nhãn: Nhãn cấp chi; tên vạn niên thanh có thể dùng cho cây khác.', N'Châu Mỹ nhiệt đới', N'Ánh sáng tán xạ; giữ ẩm vừa; đất thoát nước; tránh tiếp xúc nhựa cây.', 100000),
(31, 27, N'Hedera helix', N'Thường xuân', N'Dây leo có rễ bám; lá non thường chia ba đến năm thùy; lá trưởng thành có thể nguyên.', N'Châu Âu và vùng lân cận Tây Á, Bắc Phi', N'Nơi sáng dịu và thông thoáng; tưới khi mặt đất se khô; tránh nóng ẩm bí kéo dài.', 75000),
(32, 4, N'Rhapis excelsa', N'Mật cật', N'Cau dạng bụi, thân có sợi; lá hình quạt chia nhiều đoạn, đầu đoạn thường cụt.', N'Trung Quốc và Việt Nam', N'Ánh sáng tán xạ; chậu thoát nước; tưới khi lớp mặt đất se khô.', 230000),
(33, 23, N'Ficus lyrata', N'Bàng Singapore', N'Cây thân gỗ; lá lớn dày, đầu rộng, dáng như đàn vĩ cầm, gân nổi rõ. Lưu ý nhãn: Tên thương mại không phản ánh xuất xứ Singapore.', N'Tây châu Phi nhiệt đới', N'Ánh sáng tán xạ mạnh; tưới khi lớp mặt đất khô; tránh đổi vị trí và úng rễ.', 250000),
(34, 28, N'Hydrangea macrophylla', N'Cẩm tú cầu', N'Lá đối lớn, mép răng cưa; cụm hoa tròn hoặc phẳng với hoa trang trí nổi bật. Lưu ý nhãn: Màu hoa một số giống chịu ảnh hưởng của pH và nhôm, không áp dụng mọi giống.', N'Nhật Bản', N'Ánh sáng sáng nhưng tránh nắng chiều nóng; giữ ẩm đều; giá thể thoát nước.', 150000),
(35, 29, N'Codiaeum variegatum', N'Cô tòng', N'Lá dai, đa dạng hình dạng; nhiều giống có mảng xanh, vàng, đỏ, cam nổi bật.', N'Đông Nam Á và các đảo phía tây Thái Bình Dương', N'Ánh sáng mạnh, thích nghi dần với nắng; giữ ẩm vừa; môi trường ấm, tránh úng.', 100000),
(36, 11, N'Alocasia macrorrhizos', N'Môn khổng lồ', N'Lá rất lớn dạng mũi tên, cuống dày; thân và tán phát triển lớn khi đủ điều kiện. Lưu ý nhãn: Dễ nhầm Alocasia odora; không phân biệt chỉ bằng kích thước lá.', N'Trung Malesia đến nhóm đảo Murray ở Queensland, Australia', N'Ánh sáng tán xạ mạnh; đất giàu hữu cơ và thoáng; giữ ẩm trong thời kỳ sinh trưởng.', 180000),
(37, 23, N'Ficus microcarpa', N'Sanh bonsai', N'Lá nhỏ, bóng, bầu dục; dạng ginseng có gốc hoặc rễ phình nổi trong chậu bonsai. Lưu ý nhãn: Ginseng là dạng tạo hình thương mại, không phải loài riêng.', N'Châu Á nhiệt đới và cận nhiệt đới đến Tây Thái Bình Dương', N'Nhiều sáng; đất bonsai thoát nước; tưới khi mặt đất se khô, tỉa để giữ dáng.', 220000),
(38, 22, N'Dracaena surculosa', N'Trúc đốm', N'Thân mảnh phân nhánh; lá bầu dục xanh với đốm trắng kem hoặc vàng.', N'Tây châu Phi nhiệt đới', N'Ánh sáng tán xạ; giữ đất ẩm vừa, không để nước đọng; tránh nắng gắt làm cháy lá.', 100000),
(39, 30, N'Philodendron squamiferum', N'Trầu bà cuống lông', N'Dây leo; lá trưởng thành có thùy; cuống lá nổi bật bởi lớp lông hoặc vảy đỏ nâu.', N'Miền bắc Nam Mỹ', N'Ánh sáng tán xạ; giá thể thoáng; độ ẩm khá cao; có trụ leo, tránh úng.', 280000),
(40, 31, N'Caladium bicolor', N'Môn lá màu', N'Lá mỏng hình tim hoặc mũi tên; các giống có mảng đỏ, hồng, trắng và xanh. Lưu ý nhãn: Tên loài không đảm bảo mọi ảnh là Caladium bicolor thuần chủng.', N'Châu Mỹ nhiệt đới', N'Ánh sáng tán xạ; giữ ẩm khi có lá; giảm tưới khi cây ngủ nghỉ và lá tàn.', 95000),
(41, 30, N'Philodendron cordatum', N'Trầu bà lá tim theo nhãn', N'Dây leo có lá dạng tim; nhóm cây bán dưới tên này dễ chồng lấn các Philodendron khác. Lưu ý nhãn: Nhãn Heartleaf thường được dùng cho P. hederaceum; cần xác minh ảnh, không tự đổi nhãn mô hình.', N'Đông nam và miền nam Brazil, nếu đúng P. cordatum', N'Ánh sáng tán xạ; giá thể thoáng; tưới khi lớp mặt khô; cho leo hoặc trồng rủ.', 85000),
(42, 13, N'Hyacinthus orientalis', N'Dạ lan hương', N'Cây thân hành, lá dày dạng dải; nhiều hoa thơm tụ dày thành chùm trên trục đứng.', N'Đông Địa Trung Hải và Tây Á', N'Nơi sáng và mát; giá thể thoát nước; tưới vừa ở gốc; giảm tưới sau khi lá tàn.', 95000),
(43, 32, N'Rhododendron simsii', N'Đỗ quyên Simsii', N'Cây bụi lá nhỏ; hoa dạng phễu có nhiều màu tùy giống, thường ra thành cụm.', N'Đông Á và vùng lân cận châu Á', N'Ánh sáng dịu; giá thể có tính acid và thoát nước; giữ ẩm đều, tránh nóng gắt.', 180000),
(44, 33, N'Begonia masoniana', N'Thu hải đường chữ thập', N'Lá lệch, bề mặt nhăn hoặc ráp; mảng sẫm gần giữa lá thường giống chữ thập.', N'Miền nam Trung Quốc và khu vực lân cận', N'Ánh sáng tán xạ; giá thể thoáng; giữ ẩm nhẹ; tránh nước đọng trên lá và ngọn.', 160000),
(45, 2, N'Crassula ovata', N'Ngọc bích', N'Cây mọng nước dạng bụi; lá dày bầu dục mọc đối, đôi khi viền đỏ khi đủ sáng.', N'Miền nam châu Phi', N'Nhiều sáng, nắng thích nghi; đất thoát nước nhanh; để đất khô giữa các lần tưới.', 85000),
(46, 2, N'Kalanchoe spp.', N'Sống đời Kalanchoe', N'Nhóm cây mọng nước; lá dày, hình dạng và mép lá đa dạng; nhiều loài có hoa thành chùm. Lưu ý nhãn: Nhãn cấp chi; không mặc định toàn bộ là K. blossfeldiana.', N'Phụ thuộc loài; nhiều loài từ Madagascar và châu Phi', N'Nơi sáng; giá thể thoát nước nhanh; tưới sau khi đất khô; nhu cầu ra hoa tùy loài.', 60000),
(47, 13, N'Convallaria majalis', N'Linh lan', N'Thân rễ; lá rộng có gân song song; chùm hoa trắng nhỏ rủ dạng chuông.', N'Âu-Á', N'Nơi sáng dịu, mát; đất hữu cơ ẩm và thoát nước; không phù hợp nơi nóng quanh năm.', 160000),
(48, 22, N'Dracaena marginata', N'Phất dụ mảnh', N'Thân gỗ mảnh; lá rất hẹp và dài tụ ở đầu cành, thường có viền đỏ. Lưu ý nhãn: Giữ tên Dracaena marginata theo nhãn; có xử lý phân loại khác trong các nguồn.', N'Madagascar', N'Ánh sáng tán xạ; để lớp mặt khô trước khi tưới; tránh úng và nước nhiều muối.', 150000),
(49, 2, N'Echeveria elegans', N'Sen đá bông hồng trắng', N'Lá mọng màu xanh nhạt phủ phấn, xếp hoa thị chặt; dễ tạo cây con quanh gốc.', N'Mexico', N'Nhiều sáng và nắng thích nghi; giá thể thoát nước nhanh; tưới khi đất khô, tránh đọng nước ở tâm.', 55000),
(50, 34, N'Pachira aquatica', N'Kim ngân', N'Lá kép chân vịt thường gồm năm đến bảy lá chét; thân có thể được tết khi bán.', N'Trung Mỹ và miền bắc Nam Mỹ', N'Ánh sáng tán xạ; đất thoát nước; tưới khi lớp mặt se khô; tránh úng trong chậu trang trí.', 180000),
(51, 35, N'Monstera deliciosa', N'Trầu bà Nam Mỹ', N'Lá trưởng thành lớn, có đường xẻ từ mép và có thể có lỗ trong phiến; có rễ khí sinh. Lưu ý nhãn: Lá non có thể chưa có lỗ hoặc đường xẻ.', N'Mexico và Trung Mỹ', N'Ánh sáng tán xạ; giá thể thoáng; tưới khi lớp mặt khô; làm trụ cho cây leo.', 250000),
(52, 36, N'Tradescantia spathacea', N'Lẻ bạn', N'Lá dài hình mác xếp hoa thị, mặt dưới thường tím; hoa nhỏ trong lá bắc dạng thuyền.', N'Mexico và Trung Mỹ', N'Ánh sáng tốt; giá thể thoát nước; tưới khi lớp mặt khô; tránh úng gốc.', 55000),
(53, 37, N'Fittonia albivenis', N'Cẩm nhung', N'Cây thấp; lá bầu dục với mạng gân trắng, hồng hoặc đỏ nổi rõ trên nền xanh.', N'Nam Mỹ nhiệt đới', N'Ánh sáng tán xạ; giữ ẩm đều và độ ẩm không khí khá cao; không để úng hoặc nắng gắt.', 60000),
(54, 11, N'Alocasia odora', N'Môn thơm', N'Lá lớn dạng mũi tên trên cuống đứng; cụm hoa gồm mo và trục hoa, có thể có mùi thơm. Lưu ý nhãn: Khó tách khỏi A. macrorrhizos từ ảnh xa; cần kiểm tra đặc điểm lá và hoa.', N'Đông Ấn Độ đến nam Nhật Bản và Borneo', N'Ánh sáng tán xạ; đất thoáng, giàu hữu cơ; giữ ẩm vừa; không để chậu đọng nước.', 150000),
(55, 38, N'Orchidaceae (nhóm chưa xác định)', N'Hoa lan', N'Họ thực vật đa dạng; hoa thường đối xứng hai bên và có cánh môi; kiểu lá tùy nhóm. Lưu ý nhãn: Nhãn ở cấp họ/nhóm; không tự gán thành Phalaenopsis.', N'Phụ thuộc chi và loài; phân bố ở nhiều vùng trên thế giới', N'Xác định nhóm lan trước; với lan biểu sinh cần rễ thoáng và thoát nước, ánh sáng tùy nhóm.', 180000),
(56, 4, N'Chamaedorea elegans', N'Cau tiểu trâm', N'Cau nhỏ thân mảnh; lá kép lông chim, lá chét hẹp màu xanh.', N'Mexico đến Honduras', N'Ánh sáng tán xạ; giữ ẩm vừa; chậu thoát nước; tránh nắng trực tiếp kéo dài.', 80000),
(57, 39, N'Heliconia psittacorum', N'Chuối mỏ két', N'Lá dài giống lá chuối; cụm hoa có lá bắc đứng màu cam hoặc đỏ và hoa nhỏ.', N'Châu Mỹ nhiệt đới', N'Ánh sáng mạnh; đất hữu cơ và thoát nước; giữ ẩm trong thời kỳ sinh trưởng.', 140000),
(58, 40, N'Spathiphyllum spp.', N'Lan ý', N'Lá xanh hình mác, gân nổi; mo hoa thường trắng bao quanh trục hoa thẳng. Lưu ý nhãn: Nhãn không nêu loài; không tự mặc định S. wallisii.', N'Châu Mỹ nhiệt đới và một số vùng châu Á, tùy loài', N'Ánh sáng tán xạ; giữ ẩm vừa; chậu thoát nước; tránh nắng gắt và khô kéo dài.', 100000),
(59, 41, N'Mentha x piperita', N'Bạc hà', N'Thân thường vuông; lá mọc đối, mép răng cưa; lá có mùi bạc hà khi vò nhẹ. Lưu ý nhãn: Giữ liên kết nhãn Mentha piperita; tên thực vật có ký hiệu lai.', N'Cây lai giữa bạc hà nước và bạc hà lục; được trồng rộng rãi', N'Nơi sáng, nắng nhẹ; giữ đất ẩm và thoát nước; cắt tỉa, trồng chậu để hạn chế lan.', 45000),
(60, 24, N'Euphorbia pulcherrima', N'Trạng nguyên', N'Cây bụi; lá bắc quanh cụm hoa đổi đỏ hoặc màu khác; hoa thật nhỏ ở giữa. Lưu ý nhãn: Phần đỏ thường thấy là lá bắc, không phải cánh hoa.', N'Mexico và Trung Mỹ', N'Ánh sáng tán xạ mạnh; tưới khi mặt đất se khô; tránh úng; ra màu cần quang chu kỳ phù hợp.', 120000),
(61, 37, N'Hypoestes phyllostachya', N'Mặt nám', N'Lá bầu dục, nền xanh có nhiều đốm hồng, trắng hoặc đỏ tùy giống.', N'Madagascar', N'Ánh sáng tán xạ; giữ ẩm vừa; bấm ngọn cho cây gọn, tránh nắng nóng trực tiếp.', 60000),
(62, 42, N'Beaucarnea recurvata', N'Chân voi', N'Gốc thân phình lớn; lá rất dài, hẹp, cong rủ thành chùm trên ngọn. Lưu ý nhãn: Không phải cây cau thực sự.', N'Mexico', N'Nhiều sáng; đất thoát nước nhanh; tưới thưa khi đất khô, tránh úng phần gốc.', 240000),
(63, 25, N'Maranta leuconeura', N'Đuôi công Maranta', N'Lá bầu dục có họa tiết gân và mảng màu; lá có thể nâng hoặc khép vào ban đêm.', N'Brazil', N'Ánh sáng tán xạ; độ ẩm khá cao; giữ đất ẩm nhẹ và thoát nước; tránh nắng gắt.', 130000),
(64, 10, N'Davallia fejeensis', N'Dương xỉ chân thỏ', N'Thân rễ bò ngoài mặt chậu, phủ lông nâu sáng; lá xẻ nhỏ, tán nhẹ. Lưu ý nhãn: Nhãn không phải Dracaena dù mô hình từng nhầm.', N'Fiji và khu vực Caroline', N'Ánh sáng tán xạ; giá thể thoáng và ẩm nhẹ; không chôn kín thân rễ phủ lông.', 120000),
(65, 7, N'Peperomia polybotrya', N'Trường sinh giọt nước', N'Lá dày bóng, hình giọt nước với đầu nhọn; tán nhỏ gọn, mọc từ thân đứng.', N'Colombia và Peru', N'Ánh sáng tán xạ; đất thoáng; để lớp mặt khô trước khi tưới, tránh úng.', 110000),
(66, 25, N'Calathea lancifolia', N'Đuôi công lá dài', N'Lá dài hẹp, mép lượn, nền sáng có các đốm sẫm dọc gân; mặt dưới thường tím. Lưu ý nhãn: Tên Calathea lancifolia giữ theo nhãn; thường được chuyển sang Goeppertia insignis.', N'Brazil', N'Ánh sáng tán xạ; độ ẩm khá cao; giữ đất ẩm nhẹ và thoát nước; hạn chế nước nhiều muối.', 150000),
(67, 30, N'Philodendron erubescens', N'Trầu bà đỏ', N'Dây leo; lá thuôn hình tim hoặc mũi tên; cuống và bẹ có sắc đỏ ở nhiều dạng. Lưu ý nhãn: Giống lai mang tên thương mại có thể không tương ứng loài thuần.', N'Colombia', N'Ánh sáng tán xạ; giá thể thoáng; tưới khi lớp mặt khô; cung cấp trụ leo.', 160000),
(68, 25, N'Calathea roseopicta', N'Đuôi công hồng', N'Lá bầu dục rộng, có vòng hoặc mảng hoa văn sáng; một số giống có sắc hồng, mặt dưới tím. Lưu ý nhãn: Tên Calathea giữ theo nhãn mô hình; thường được chuyển sang Goeppertia.', N'Miền tây Nam Mỹ đến miền tây Brazil', N'Ánh sáng tán xạ; giữ ẩm nhẹ và độ ẩm không khí khá cao; tránh nắng trực tiếp, không úng.', 160000),
(69, 25, N'Calathea orbifolia', N'Đuôi công lá tròn', N'Lá lớn gần tròn, có các dải xanh và bạc song song theo gân, cuống dài. Lưu ý nhãn: Tên Calathea giữ theo nhãn mô hình; thường được chuyển sang Goeppertia.', N'Miền đông Brazil', N'Ánh sáng tán xạ; ẩm không khí khá cao; đất ẩm nhẹ, thoát nước; tránh nắng và nước nhiều muối.', 200000),
(70, 23, N'Ficus elastica', N'Đa búp đỏ', N'Lá lớn, dày, bóng; chồi non thường được bao bởi bẹ đỏ; có nhựa mủ trắng.', N'Nam Á và Đông Nam Á', N'Ánh sáng tán xạ mạnh; để lớp mặt đất khô trước khi tưới; lau lá, tránh úng.', 180000),
(71, 43, N'Cycas revoluta', N'Vạn tuế', N'Thân cứng; lá kép lông chim cứng, mọc thành vòng; lá chét hẹp, mép hơi cuộn. Lưu ý nhãn: Thuộc nhóm tuế, không phải cau; không ăn các bộ phận cây.', N'Nhật Bản và khu vực lân cận', N'Nhiều sáng; đất thoát nước; tưới khi lớp mặt khô; tránh giữ tâm ngọn ướt kéo dài.', 300000),
(72, 44, N'Schefflera spp. (nhãn mô hình)', N'Ngũ gia bì theo nhóm', N'Lá kép chân vịt, nhiều lá chét tỏa từ một điểm; kiểu tán và kích thước tùy loài. Lưu ý nhãn: Không tự gán thành Heptapleurum arboricola nếu chưa xem ảnh và nguồn.', N'Phụ thuộc loài; nhãn chưa đủ xác định vùng bản địa', N'Ánh sáng tán xạ; đất thoát nước; tưới khi lớp mặt khô; tỉa để giữ tán gọn.', 130000),
(73, 5, N'Scindapsus pictus', N'Trầu bà bạc', N'Dây leo; lá dạng tim xanh với mảng hoặc đốm bạc, bề mặt thường hơi mịn.', N'Đông Nam Á', N'Ánh sáng tán xạ; giá thể thoáng; tưới khi lớp mặt khô; cho leo hoặc trồng rủ.', 95000),
(74, 45, N'Sansevieria spp. (nhãn viết Sanseviera)', N'Lưỡi hổ theo nhóm', N'Lá mọng thường mọc thẳng từ gốc; nhiều dạng có vân ngang hoặc viền vàng. Lưu ý nhãn: Nhãn sai chính tả và chỉ ở cấp chi; nhiều loài được xếp trong Dracaena.', N'Phụ thuộc loài; nhiều loài từ châu Phi', N'Nơi sáng tán xạ; đất thoát nước nhanh; để đất khô giữa các lần tưới, tránh úng.', 100000),
(75, 22, N'Dracaena reflexa', N'Trúc bách hợp', N'Lá hẹp thuôn, mọc dày ở đầu cành; dạng Song of India thường có viền vàng. Lưu ý nhãn: Song of India là dạng giống trồng, không đại diện mọi Dracaena reflexa.', N'Madagascar, Mozambique và các đảo tây Ấn Độ Dương', N'Ánh sáng tán xạ mạnh; đất thoát nước; để lớp mặt se khô trước khi tưới.', 150000),
(76, 6, N'Chlorophytum comosum', N'Lan chi', N'Lá dài hẹp mọc thành bụi; có dạng sọc trắng; cuống dài mang hoa nhỏ và cây con.', N'Các vùng châu Phi nhiệt đới và miền nam châu Phi', N'Ánh sáng tán xạ; tưới khi lớp mặt đất se khô; thoát nước tốt, tách cây con để nhân giống.', 55000),
(77, 10, N'Platycerium bifurcatum', N'Dương xỉ sừng hươu', N'Có lá nền áp sát giá đỡ và lá hữu thụ phân nhánh như sừng hươu. Lưu ý nhãn: Không bóc lá nền nâu chỉ vì chúng đã đổi màu.', N'Java đến New Caledonia', N'Ánh sáng tán xạ; giá thể hoặc giá đỡ thoáng; tưới đẫm rồi để bề mặt se khô.', 180000),
(78, 2, N'Senecio rowleyanus', N'Sen đá chuỗi ngọc', N'Thân nhỏ rủ; lá mọng gần hình cầu xếp như chuỗi hạt, có đường cửa sổ trên lá. Lưu ý nhãn: Tên cũ trong nhãn; thường dùng Curio rowleyanus.', N'Miền nam châu Phi', N'Nơi sáng, nắng nhẹ thích nghi; đất thoát nước nhanh; để đất khô giữa các lần tưới.', 80000),
(79, 35, N'Monstera adansonii', N'Trầu bà lỗ', N'Dây leo; lá có lỗ nằm trong phiến khi phát triển, mép thường còn nguyên. Lưu ý nhãn: Lá non hoặc thiếu sáng có thể ít lỗ; không tự kết luận sai nhãn chỉ vì không thấy lỗ.', N'Trung Mỹ và Nam Mỹ nhiệt đới', N'Ánh sáng tán xạ; đất thoáng; tưới khi lớp mặt khô; có thể leo trụ hoặc trồng rủ.', 100000),
(80, 30, N'Philodendron bipinnatifidum', N'Trầu bà thanh xuân', N'Lá rất lớn, xẻ nhiều thùy sâu; cây trưởng thành phát triển thân và tán rộng. Lưu ý nhãn: Tên cũ trong nhãn; thường dùng Thaumatophyllum bipinnatifidum.', N'Nam Mỹ', N'Ánh sáng tán xạ mạnh; đất thoáng; giữ ẩm vừa; chừa không gian cho tán lớn.', 240000),
(81, 13, N'Tulipa spp.', N'Hoa tulip', N'Cây thân hành, lá rộng hoặc dạng dải; hoa thường dạng chén ở đầu cuống. Lưu ý nhãn: Nhãn cấp chi/nhóm; không tự gán một loài.', N'Phụ thuộc loài; nhiều loài ở Trung Á và khu vực lân cận', N'Nơi sáng, khí hậu mát; giá thể thoát nước; tưới trong mùa sinh trưởng; cần xử lý lạnh tùy giống.', 100000),
(82, 46, N'Dionaea muscipula', N'Cây bẫy kẹp', N'Lá có hai thùy tạo bẫy, mép có răng dài; lông cảm ứng kích hoạt đóng bẫy. Lưu ý nhãn: Không dùng đất giàu phân hoặc cho ăn thịt; không chạm bẫy để chơi.', N'Vùng ven biển Bắc Carolina và Nam Carolina, Hoa Kỳ', N'Nắng tốt sau thích nghi; dùng nước mưa hoặc nước ít khoáng, giá thể nghèo dinh dưỡng; cần mùa nghỉ.', 120000),
(83, 7, N'Peperomia argyreia', N'Trường sinh dưa hấu', N'Lá bầu dục gần tròn, có sọc bạc và xanh như vỏ dưa hấu; cuống thường đỏ. Lưu ý nhãn: Kew chấp nhận Peperomia argyraea; giữ Peperomia argyreia theo nhãn mô hình.', N'Brazil', N'Ánh sáng tán xạ; giá thể thoáng; để lớp mặt khô trước khi tưới; tránh úng.', 110000),
(84, 23, N'Ficus benjamina', N'Si cảnh', N'Cây thân gỗ, cành mảnh hơi rủ; lá nhỏ bóng, bầu dục có đầu nhọn dài.', N'Châu Á nhiệt đới đến Bắc Australia', N'Ánh sáng tán xạ mạnh; tưới khi mặt đất se khô; tránh đổi vị trí hoặc nhiệt độ đột ngột.', 160000),
(85, 9, N'Strelitzia nicolai', N'Thiên điểu trắng', N'Tán lớn, lá dài rộng giống lá chuối; hoa có phần trắng và xanh, mo sẫm. Lưu ý nhãn: Lá có thể rách tự nhiên dọc gân; khó phân biệt cây non chỉ từ lá xa.', N'Miền nam châu Phi', N'Nhiều sáng; đất thoát nước; tưới khi mặt đất se khô; chừa không gian cho tán lớn.', 300000),
(86, 47, N'Podocarpus macrophyllus', N'Tùng la hán', N'Cây gỗ thường xanh; lá hẹp hình dải, dai, gân giữa rõ; cây trưởng thành có cấu trúc hạt đặc trưng.', N'Đông Á', N'Nơi sáng và nắng thích nghi; đất thoát nước; tưới khi lớp mặt se khô; tỉa tạo dáng.', 250000),
(87, 48, N'Yucca spp.', N'Yucca cảnh', N'Lá cứng dài dạng kiếm xếp hoa thị; một số dạng có thân gỗ, hình dáng tùy loài. Lưu ý nhãn: Nhãn cấp chi; không tự gán thành Yucca gigantea.', N'Châu Mỹ, tùy loài', N'Nhiều sáng; giá thể thoát nước nhanh; tưới sau khi đất se khô; tránh úng.', 200000),
(88, 49, N'Zamioculcas zamiifolia', N'Kim tiền', N'Cuống lá dày mọc từ thân rễ; nhiều lá chét dày bóng xếp dọc cuống.', N'Đông châu Phi', N'Ánh sáng tán xạ; giá thể thoát nước; để đất khô giữa các lần tưới; tránh úng thân rễ.', 150000),
(89, 2, N'Haworthiopsis attenuata', N'Sen đá móng rồng', N'Lá mọng nhọn xếp hoa thị; bề mặt có các hàng u trắng nổi như vằn. Lưu ý nhãn: Dễ nhầm H. fasciata; cần xem bề mặt hai phía lá.', N'Nam Phi', N'Nơi sáng dịu; đất thoát nước nhanh; tưới khi đất khô, tránh nắng trưa và nước đọng tâm.', 60000),
(90, 50, N'Aphelandra squarrosa', N'Cây ngựa vằn Aphelandra', N'Lá xanh sẫm, gân trắng nổi rõ; cụm lá bắc vàng có thể xuất hiện ở ngọn. Lưu ý nhãn: Không phải sen đá móng rồng dù cùng tên tiếng Anh Zebra.', N'Brazil', N'Ánh sáng tán xạ; giữ ẩm vừa và độ ẩm không khí khá cao; không để úng hoặc nắng gắt.', 150000);

IF @IdentityTable=N'LOAI_CAY'
BEGIN
SET IDENTITY_INSERT [dbo].[LOAI_CAY] OFF;
SET @IdentityTable=NULL;
END;


-- GIO_HANG: 69 dong
IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id=OBJECT_ID(N'dbo.GIO_HANG'))
BEGIN
SET IDENTITY_INSERT [dbo].[GIO_HANG] ON;
SET @IdentityTable=N'GIO_HANG';
END;

INSERT INTO [dbo].[GIO_HANG] ([MAGIOHANG], [MANGUOIDUNG], [NGAYCAPNHAT], [NGAYTAO], [TRANGTHAIGIOHANG])
VALUES
(1, 2, N'2026-10-02T10:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(2, 3, N'2026-10-03T11:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(3, 4, N'2026-10-04T12:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(4, 5, N'2026-10-05T13:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(5, 6, N'2026-10-06T14:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(6, 7, N'2026-10-02T09:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(7, 8, N'2026-10-03T10:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(8, 9, N'2026-10-04T11:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(9, 10, N'2026-10-05T12:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(10, 2, N'2026-10-06T13:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(11, 3, N'2026-10-02T14:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(12, 4, N'2026-10-03T09:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(13, 5, N'2026-10-04T10:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(14, 6, N'2026-10-05T11:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(15, 7, N'2026-10-06T12:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(16, 8, N'2026-10-02T13:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(17, 9, N'2026-10-03T14:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(18, 10, N'2026-10-04T09:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(19, 2, N'2026-10-05T10:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(20, 3, N'2026-10-06T11:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(21, 4, N'2026-10-02T12:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(22, 5, N'2026-10-03T13:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(23, 6, N'2026-10-04T14:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(24, 7, N'2026-10-05T09:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(25, 8, N'2026-10-06T10:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(26, 9, N'2026-10-02T11:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(27, 10, N'2026-10-03T12:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(28, 2, N'2026-10-04T13:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(29, 3, N'2026-10-05T14:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(30, 4, N'2026-10-06T09:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(31, 5, N'2026-10-02T10:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(32, 6, N'2026-10-03T11:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(33, 7, N'2026-10-04T12:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(34, 8, N'2026-10-05T13:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(35, 9, N'2026-10-06T14:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(36, 10, N'2026-10-02T09:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(37, 2, N'2026-10-03T10:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(38, 3, N'2026-10-04T11:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(39, 4, N'2026-10-05T12:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(40, 5, N'2026-10-06T13:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(41, 6, N'2026-10-02T14:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(42, 7, N'2026-10-03T09:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(43, 8, N'2026-10-04T10:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(44, 9, N'2026-10-05T11:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(45, 10, N'2026-10-06T12:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(46, 2, N'2026-10-02T13:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(47, 3, N'2026-10-03T14:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(48, 4, N'2026-10-04T09:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(49, 5, N'2026-10-05T10:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(50, 6, N'2026-10-06T11:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(51, 7, N'2026-10-02T12:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(52, 8, N'2026-10-03T13:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(53, 9, N'2026-10-04T14:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(54, 10, N'2026-10-05T09:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(55, 2, N'2026-10-06T10:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(56, 3, N'2026-10-02T11:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(57, 4, N'2026-10-03T12:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(58, 5, N'2026-10-04T13:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(59, 6, N'2026-10-05T14:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(60, 7, N'2026-10-06T09:00:00', N'2026-10-01T08:00:00', N'DaChot'),
(61, 2, N'2026-10-14T08:00:00', N'2026-10-14T08:00:00', N'DangMua'),
(62, 3, N'2026-10-14T08:00:00', N'2026-10-14T08:00:00', N'DangMua'),
(63, 4, N'2026-10-14T08:00:00', N'2026-10-14T08:00:00', N'DangMua'),
(64, 5, N'2026-10-14T08:00:00', N'2026-10-14T08:00:00', N'DangMua'),
(65, 6, N'2026-10-14T08:00:00', N'2026-10-14T08:00:00', N'DangMua'),
(66, 7, N'2026-10-14T08:00:00', N'2026-10-14T08:00:00', N'DangMua'),
(67, 8, N'2026-10-14T08:00:00', N'2026-10-14T08:00:00', N'DangMua'),
(68, 9, N'2026-10-14T08:00:00', N'2026-10-14T08:00:00', N'DangMua'),
(69, 10, N'2026-10-14T08:00:00', N'2026-10-14T08:00:00', N'DangMua');

IF @IdentityTable=N'GIO_HANG'
BEGIN
SET IDENTITY_INSERT [dbo].[GIO_HANG] OFF;
SET @IdentityTable=NULL;
END;


-- DIA_CHI_NGUOI_DUNG: 50 dong
IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id=OBJECT_ID(N'dbo.DIA_CHI_NGUOI_DUNG'))
BEGIN
SET IDENTITY_INSERT [dbo].[DIA_CHI_NGUOI_DUNG] ON;
SET @IdentityTable=N'DIA_CHI_NGUOI_DUNG';
END;

INSERT INTO [dbo].[DIA_CHI_NGUOI_DUNG] ([MADIACHI], [MANGUOIDUNG], [TENNGUOINHAN], [DIACHICHITIET], [DATMACDINH], [SDTNGUOINHAN])
VALUES
(1, 1, N'Người nhận mẫu 01-1', N'Số 11, Đường Mẫu 1, Khu dân cư giả lập', 1, N'0000010001'),
(2, 1, N'Người nhận mẫu 01-2', N'Số 12, Đường Mẫu 2, Khu dân cư giả lập', 0, N'0000010002'),
(3, 1, N'Người nhận mẫu 01-3', N'Số 13, Đường Mẫu 3, Khu dân cư giả lập', 0, N'0000010003'),
(4, 1, N'Người nhận mẫu 01-4', N'Số 14, Đường Mẫu 4, Khu dân cư giả lập', 0, N'0000010004'),
(5, 1, N'Người nhận mẫu 01-5', N'Số 15, Đường Mẫu 5, Khu dân cư giả lập', 0, N'0000010005'),
(6, 2, N'Người nhận mẫu 02-1', N'Số 21, Đường Mẫu 1, Khu dân cư giả lập', 1, N'0000020001'),
(7, 2, N'Người nhận mẫu 02-2', N'Số 22, Đường Mẫu 2, Khu dân cư giả lập', 0, N'0000020002'),
(8, 2, N'Người nhận mẫu 02-3', N'Số 23, Đường Mẫu 3, Khu dân cư giả lập', 0, N'0000020003'),
(9, 2, N'Người nhận mẫu 02-4', N'Số 24, Đường Mẫu 4, Khu dân cư giả lập', 0, N'0000020004'),
(10, 2, N'Người nhận mẫu 02-5', N'Số 25, Đường Mẫu 5, Khu dân cư giả lập', 0, N'0000020005'),
(11, 3, N'Người nhận mẫu 03-1', N'Số 31, Đường Mẫu 1, Khu dân cư giả lập', 1, N'0000030001'),
(12, 3, N'Người nhận mẫu 03-2', N'Số 32, Đường Mẫu 2, Khu dân cư giả lập', 0, N'0000030002'),
(13, 3, N'Người nhận mẫu 03-3', N'Số 33, Đường Mẫu 3, Khu dân cư giả lập', 0, N'0000030003'),
(14, 3, N'Người nhận mẫu 03-4', N'Số 34, Đường Mẫu 4, Khu dân cư giả lập', 0, N'0000030004'),
(15, 3, N'Người nhận mẫu 03-5', N'Số 35, Đường Mẫu 5, Khu dân cư giả lập', 0, N'0000030005'),
(16, 4, N'Người nhận mẫu 04-1', N'Số 41, Đường Mẫu 1, Khu dân cư giả lập', 1, N'0000040001'),
(17, 4, N'Người nhận mẫu 04-2', N'Số 42, Đường Mẫu 2, Khu dân cư giả lập', 0, N'0000040002'),
(18, 4, N'Người nhận mẫu 04-3', N'Số 43, Đường Mẫu 3, Khu dân cư giả lập', 0, N'0000040003'),
(19, 4, N'Người nhận mẫu 04-4', N'Số 44, Đường Mẫu 4, Khu dân cư giả lập', 0, N'0000040004'),
(20, 4, N'Người nhận mẫu 04-5', N'Số 45, Đường Mẫu 5, Khu dân cư giả lập', 0, N'0000040005'),
(21, 5, N'Người nhận mẫu 05-1', N'Số 51, Đường Mẫu 1, Khu dân cư giả lập', 1, N'0000050001'),
(22, 5, N'Người nhận mẫu 05-2', N'Số 52, Đường Mẫu 2, Khu dân cư giả lập', 0, N'0000050002'),
(23, 5, N'Người nhận mẫu 05-3', N'Số 53, Đường Mẫu 3, Khu dân cư giả lập', 0, N'0000050003'),
(24, 5, N'Người nhận mẫu 05-4', N'Số 54, Đường Mẫu 4, Khu dân cư giả lập', 0, N'0000050004'),
(25, 5, N'Người nhận mẫu 05-5', N'Số 55, Đường Mẫu 5, Khu dân cư giả lập', 0, N'0000050005'),
(26, 6, N'Người nhận mẫu 06-1', N'Số 61, Đường Mẫu 1, Khu dân cư giả lập', 1, N'0000060001'),
(27, 6, N'Người nhận mẫu 06-2', N'Số 62, Đường Mẫu 2, Khu dân cư giả lập', 0, N'0000060002'),
(28, 6, N'Người nhận mẫu 06-3', N'Số 63, Đường Mẫu 3, Khu dân cư giả lập', 0, N'0000060003'),
(29, 6, N'Người nhận mẫu 06-4', N'Số 64, Đường Mẫu 4, Khu dân cư giả lập', 0, N'0000060004'),
(30, 6, N'Người nhận mẫu 06-5', N'Số 65, Đường Mẫu 5, Khu dân cư giả lập', 0, N'0000060005'),
(31, 7, N'Người nhận mẫu 07-1', N'Số 71, Đường Mẫu 1, Khu dân cư giả lập', 1, N'0000070001'),
(32, 7, N'Người nhận mẫu 07-2', N'Số 72, Đường Mẫu 2, Khu dân cư giả lập', 0, N'0000070002'),
(33, 7, N'Người nhận mẫu 07-3', N'Số 73, Đường Mẫu 3, Khu dân cư giả lập', 0, N'0000070003'),
(34, 7, N'Người nhận mẫu 07-4', N'Số 74, Đường Mẫu 4, Khu dân cư giả lập', 0, N'0000070004'),
(35, 7, N'Người nhận mẫu 07-5', N'Số 75, Đường Mẫu 5, Khu dân cư giả lập', 0, N'0000070005'),
(36, 8, N'Người nhận mẫu 08-1', N'Số 81, Đường Mẫu 1, Khu dân cư giả lập', 1, N'0000080001'),
(37, 8, N'Người nhận mẫu 08-2', N'Số 82, Đường Mẫu 2, Khu dân cư giả lập', 0, N'0000080002'),
(38, 8, N'Người nhận mẫu 08-3', N'Số 83, Đường Mẫu 3, Khu dân cư giả lập', 0, N'0000080003'),
(39, 8, N'Người nhận mẫu 08-4', N'Số 84, Đường Mẫu 4, Khu dân cư giả lập', 0, N'0000080004'),
(40, 8, N'Người nhận mẫu 08-5', N'Số 85, Đường Mẫu 5, Khu dân cư giả lập', 0, N'0000080005'),
(41, 9, N'Người nhận mẫu 09-1', N'Số 91, Đường Mẫu 1, Khu dân cư giả lập', 1, N'0000090001'),
(42, 9, N'Người nhận mẫu 09-2', N'Số 92, Đường Mẫu 2, Khu dân cư giả lập', 0, N'0000090002'),
(43, 9, N'Người nhận mẫu 09-3', N'Số 93, Đường Mẫu 3, Khu dân cư giả lập', 0, N'0000090003'),
(44, 9, N'Người nhận mẫu 09-4', N'Số 94, Đường Mẫu 4, Khu dân cư giả lập', 0, N'0000090004'),
(45, 9, N'Người nhận mẫu 09-5', N'Số 95, Đường Mẫu 5, Khu dân cư giả lập', 0, N'0000090005'),
(46, 10, N'Người nhận mẫu 10-1', N'Số 101, Đường Mẫu 1, Khu dân cư giả lập', 1, N'0000100001'),
(47, 10, N'Người nhận mẫu 10-2', N'Số 102, Đường Mẫu 2, Khu dân cư giả lập', 0, N'0000100002'),
(48, 10, N'Người nhận mẫu 10-3', N'Số 103, Đường Mẫu 3, Khu dân cư giả lập', 0, N'0000100003'),
(49, 10, N'Người nhận mẫu 10-4', N'Số 104, Đường Mẫu 4, Khu dân cư giả lập', 0, N'0000100004'),
(50, 10, N'Người nhận mẫu 10-5', N'Số 105, Đường Mẫu 5, Khu dân cư giả lập', 0, N'0000100005');

IF @IdentityTable=N'DIA_CHI_NGUOI_DUNG'
BEGIN
SET IDENTITY_INSERT [dbo].[DIA_CHI_NGUOI_DUNG] OFF;
SET @IdentityTable=NULL;
END;


-- SAN_PHAM: 90 dong
IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id=OBJECT_ID(N'dbo.SAN_PHAM'))
BEGIN
SET IDENTITY_INSERT [dbo].[SAN_PHAM] ON;
SET @IdentityTable=N'SAN_PHAM';
END;

INSERT INTO [dbo].[SAN_PHAM] ([MASANPHAM], [MALOAICAY], [TENSANPHAM], [SOLUONGTONKHO], [KICHTHUOCCAY], [TINHTRANGCAY])
VALUES
(1, 1, N'Violet châu Phi — chậu giống mẫu', 22, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(2, 2, N'Nha đam — chậu giống mẫu', 29, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(3, 3, N'Hồng môn — chậu giống mẫu', 36, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(4, 4, N'Cau vàng — chậu giống mẫu', 43, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(5, 5, N'Trầu bà mũi tên (tróc bạc) — chậu giống mẫu', 50, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(6, 6, N'Măng tây cảnh — chậu giống mẫu', 57, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(7, 7, N'Trường sinh lá tròn — chậu giống mẫu', 64, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(8, 8, N'Thảm nước mắt — chậu giống mẫu', 21, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(9, 9, N'Thiên điểu hoa cam — chậu giống mẫu', 28, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(10, 10, N'Dương xỉ tổ chim — chậu giống mẫu', 35, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(11, 11, N'Môn nhung đen — chậu giống mẫu', 42, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(12, 12, N'Dứa cảnh tâm đỏ — chậu giống mẫu', 49, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(13, 13, N'Dương xỉ Boston — chậu giống mẫu', 56, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(14, 14, N'Hoa rum trắng — chậu giống mẫu', 63, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(15, 15, N'Tỏi rừng — chậu giống mẫu', 20, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(16, 16, N'Hạnh phúc — chậu giống mẫu', 27, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(17, 17, N'Phú quý Siam — chậu giống mẫu', 34, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(18, 18, N'Dâm bụt — chậu giống mẫu', 41, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(19, 19, N'Cỏ đồng tiền Trung Quốc — chậu giống mẫu', 48, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(20, 20, N'Xương rồng Giáng sinh — chậu giống mẫu', 55, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(21, 21, N'Hoa cúc — chậu giống mẫu', 62, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(22, 22, N'Tía tô cảnh — chậu giống mẫu', 19, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(23, 23, N'Kim ngân lượng — chậu giống mẫu', 26, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(24, 24, N'Thiết mộc lan — chậu giống mẫu', 33, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(25, 25, N'Vảy ốc — chậu giống mẫu', 40, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(26, 26, N'Xương rồng bát tiên — chậu giống mẫu', 47, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(27, 27, N'Dong cảnh Ctenanthe — chậu giống mẫu', 54, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(28, 28, N'Thủy tiên Narcissus — chậu giống mẫu', 61, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(29, 29, N'Trầu bà đuôi rồng — chậu giống mẫu', 18, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(30, 30, N'Vạn niên thanh Dieffenbachia — chậu giống mẫu', 25, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(31, 31, N'Thường xuân — chậu giống mẫu', 32, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(32, 32, N'Mật cật — chậu giống mẫu', 39, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(33, 33, N'Bàng Singapore — chậu giống mẫu', 46, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(34, 34, N'Cẩm tú cầu — chậu giống mẫu', 53, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(35, 35, N'Cô tòng — chậu giống mẫu', 60, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(36, 36, N'Môn khổng lồ — chậu giống mẫu', 17, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(37, 37, N'Sanh bonsai — chậu giống mẫu', 24, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(38, 38, N'Trúc đốm — chậu giống mẫu', 31, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(39, 39, N'Trầu bà cuống lông — chậu giống mẫu', 38, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(40, 40, N'Môn lá màu — chậu giống mẫu', 45, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(41, 41, N'Trầu bà lá tim theo nhãn — chậu giống mẫu', 52, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(42, 42, N'Dạ lan hương — chậu giống mẫu', 59, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(43, 43, N'Đỗ quyên Simsii — chậu giống mẫu', 16, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(44, 44, N'Thu hải đường chữ thập — chậu giống mẫu', 23, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(45, 45, N'Ngọc bích — chậu giống mẫu', 30, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(46, 46, N'Sống đời Kalanchoe — chậu giống mẫu', 37, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(47, 47, N'Linh lan — chậu giống mẫu', 44, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(48, 48, N'Phất dụ mảnh — chậu giống mẫu', 51, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(49, 49, N'Sen đá bông hồng trắng — chậu giống mẫu', 58, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(50, 50, N'Kim ngân — chậu giống mẫu', 15, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(51, 51, N'Trầu bà Nam Mỹ — chậu giống mẫu', 22, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(52, 52, N'Lẻ bạn — chậu giống mẫu', 29, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(53, 53, N'Cẩm nhung — chậu giống mẫu', 36, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(54, 54, N'Môn thơm — chậu giống mẫu', 43, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(55, 55, N'Hoa lan — chậu giống mẫu', 50, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(56, 56, N'Cau tiểu trâm — chậu giống mẫu', 57, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(57, 57, N'Chuối mỏ két — chậu giống mẫu', 64, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(58, 58, N'Lan ý — chậu giống mẫu', 21, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(59, 59, N'Bạc hà — chậu giống mẫu', 28, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(60, 60, N'Trạng nguyên — chậu giống mẫu', 35, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(61, 61, N'Mặt nám — chậu giống mẫu', 42, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(62, 62, N'Chân voi — chậu giống mẫu', 49, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(63, 63, N'Đuôi công Maranta — chậu giống mẫu', 56, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(64, 64, N'Dương xỉ chân thỏ — chậu giống mẫu', 63, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(65, 65, N'Trường sinh giọt nước — chậu giống mẫu', 20, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(66, 66, N'Đuôi công lá dài — chậu giống mẫu', 27, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(67, 67, N'Trầu bà đỏ — chậu giống mẫu', 34, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(68, 68, N'Đuôi công hồng — chậu giống mẫu', 41, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(69, 69, N'Đuôi công lá tròn — chậu giống mẫu', 48, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(70, 70, N'Đa búp đỏ — chậu giống mẫu', 55, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(71, 71, N'Vạn tuế — chậu giống mẫu', 62, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(72, 72, N'Ngũ gia bì theo nhóm — chậu giống mẫu', 19, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(73, 73, N'Trầu bà bạc — chậu giống mẫu', 26, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(74, 74, N'Lưỡi hổ theo nhóm — chậu giống mẫu', 33, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(75, 75, N'Trúc bách hợp — chậu giống mẫu', 40, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(76, 76, N'Lan chi — chậu giống mẫu', 47, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(77, 77, N'Dương xỉ sừng hươu — chậu giống mẫu', 54, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(78, 78, N'Sen đá chuỗi ngọc — chậu giống mẫu', 61, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(79, 79, N'Trầu bà lỗ — chậu giống mẫu', 18, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(80, 80, N'Trầu bà thanh xuân — chậu giống mẫu', 25, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(81, 81, N'Hoa tulip — chậu giống mẫu', 32, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(82, 82, N'Cây bẫy kẹp — chậu giống mẫu', 39, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(83, 83, N'Trường sinh dưa hấu — chậu giống mẫu', 46, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(84, 84, N'Si cảnh — chậu giống mẫu', 53, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(85, 85, N'Thiên điểu trắng — chậu giống mẫu', 60, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(86, 86, N'Tùng la hán — chậu giống mẫu', 17, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(87, 87, N'Yucca cảnh — chậu giống mẫu', 24, N'Chậu đường kính 18 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(88, 88, N'Kim tiền — chậu giống mẫu', 31, N'Chậu đường kính 12 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(89, 89, N'Sen đá móng rồng — chậu giống mẫu', 38, N'Chậu đường kính 14 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật'),
(90, 90, N'Cây ngựa vằn Aphelandra — chậu giống mẫu', 45, N'Chậu đường kính 16 cm', N'Cây giống mẫu, chưa có ảnh sản phẩm thật');

IF @IdentityTable=N'SAN_PHAM'
BEGIN
SET IDENTITY_INSERT [dbo].[SAN_PHAM] OFF;
SET @IdentityTable=NULL;
END;


-- KET_QUA_NHAN_DIEN: 180 dong
IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id=OBJECT_ID(N'dbo.KET_QUA_NHAN_DIEN'))
BEGIN
SET IDENTITY_INSERT [dbo].[KET_QUA_NHAN_DIEN] ON;
SET @IdentityTable=N'KET_QUA_NHAN_DIEN';
END;

INSERT INTO [dbo].[KET_QUA_NHAN_DIEN] ([MALOAICAY], [MATIMKIEM], [MAKETQUA], [THUHANG], [XACSUATCHINHXAC])
VALUES
(21, 1, 1, 1, 0.62),
(34, 1, 2, 2, 0.24),
(47, 1, 3, 3, 0.09),
(28, 2, 4, 1, 0.74),
(41, 2, 5, 2, 0.15),
(54, 2, 6, 3, 0.06),
(35, 3, 7, 1, 0.62),
(48, 3, 8, 2, 0.24),
(61, 3, 9, 3, 0.09),
(42, 4, 10, 1, 0.74),
(55, 4, 11, 2, 0.15),
(68, 4, 12, 3, 0.06),
(49, 5, 13, 1, 0.62),
(62, 5, 14, 2, 0.24),
(75, 5, 15, 3, 0.09),
(56, 6, 16, 1, 0.74),
(69, 6, 17, 2, 0.15),
(82, 6, 18, 3, 0.06),
(63, 7, 19, 1, 0.62),
(76, 7, 20, 2, 0.24),
(89, 7, 21, 3, 0.09),
(70, 8, 22, 1, 0.74),
(83, 8, 23, 2, 0.15),
(6, 8, 24, 3, 0.06),
(77, 9, 25, 1, 0.62),
(90, 9, 26, 2, 0.24),
(13, 9, 27, 3, 0.09),
(84, 10, 28, 1, 0.74),
(7, 10, 29, 2, 0.15),
(20, 10, 30, 3, 0.06),
(1, 11, 31, 1, 0.62),
(14, 11, 32, 2, 0.24),
(27, 11, 33, 3, 0.09),
(8, 12, 34, 1, 0.74),
(21, 12, 35, 2, 0.15),
(34, 12, 36, 3, 0.06),
(15, 13, 37, 1, 0.62),
(28, 13, 38, 2, 0.24),
(41, 13, 39, 3, 0.09),
(22, 14, 40, 1, 0.74),
(35, 14, 41, 2, 0.15),
(48, 14, 42, 3, 0.06),
(29, 15, 43, 1, 0.62),
(42, 15, 44, 2, 0.24),
(55, 15, 45, 3, 0.09),
(36, 16, 46, 1, 0.74),
(49, 16, 47, 2, 0.15),
(62, 16, 48, 3, 0.06),
(43, 17, 49, 1, 0.62),
(56, 17, 50, 2, 0.24),
(69, 17, 51, 3, 0.09),
(50, 18, 52, 1, 0.74),
(63, 18, 53, 2, 0.15),
(76, 18, 54, 3, 0.06),
(57, 19, 55, 1, 0.62),
(70, 19, 56, 2, 0.24),
(83, 19, 57, 3, 0.09),
(64, 20, 58, 1, 0.74),
(77, 20, 59, 2, 0.15),
(90, 20, 60, 3, 0.06),
(71, 21, 61, 1, 0.62),
(84, 21, 62, 2, 0.24),
(7, 21, 63, 3, 0.09),
(78, 22, 64, 1, 0.74),
(1, 22, 65, 2, 0.15),
(14, 22, 66, 3, 0.06),
(85, 23, 67, 1, 0.62),
(8, 23, 68, 2, 0.24),
(21, 23, 69, 3, 0.09),
(2, 24, 70, 1, 0.74),
(15, 24, 71, 2, 0.15),
(28, 24, 72, 3, 0.06),
(9, 25, 73, 1, 0.62),
(22, 25, 74, 2, 0.24),
(35, 25, 75, 3, 0.09),
(16, 26, 76, 1, 0.74),
(29, 26, 77, 2, 0.15),
(42, 26, 78, 3, 0.06),
(23, 27, 79, 1, 0.62),
(36, 27, 80, 2, 0.24),
(49, 27, 81, 3, 0.09),
(30, 28, 82, 1, 0.74),
(43, 28, 83, 2, 0.15),
(56, 28, 84, 3, 0.06),
(37, 29, 85, 1, 0.62),
(50, 29, 86, 2, 0.24),
(63, 29, 87, 3, 0.09),
(44, 30, 88, 1, 0.74),
(57, 30, 89, 2, 0.15),
(70, 30, 90, 3, 0.06),
(51, 31, 91, 1, 0.62),
(64, 31, 92, 2, 0.24),
(77, 31, 93, 3, 0.09),
(58, 32, 94, 1, 0.74),
(71, 32, 95, 2, 0.15),
(84, 32, 96, 3, 0.06),
(65, 33, 97, 1, 0.62),
(78, 33, 98, 2, 0.24),
(1, 33, 99, 3, 0.09),
(72, 34, 100, 1, 0.74),
(85, 34, 101, 2, 0.15),
(8, 34, 102, 3, 0.06),
(79, 35, 103, 1, 0.62),
(2, 35, 104, 2, 0.24),
(15, 35, 105, 3, 0.09),
(86, 36, 106, 1, 0.74),
(9, 36, 107, 2, 0.15),
(22, 36, 108, 3, 0.06),
(3, 37, 109, 1, 0.62),
(16, 37, 110, 2, 0.24),
(29, 37, 111, 3, 0.09),
(10, 38, 112, 1, 0.74),
(23, 38, 113, 2, 0.15),
(36, 38, 114, 3, 0.06),
(17, 39, 115, 1, 0.62),
(30, 39, 116, 2, 0.24),
(43, 39, 117, 3, 0.09),
(24, 40, 118, 1, 0.74),
(37, 40, 119, 2, 0.15),
(50, 40, 120, 3, 0.06),
(31, 41, 121, 1, 0.62),
(44, 41, 122, 2, 0.24),
(57, 41, 123, 3, 0.09),
(38, 42, 124, 1, 0.74),
(51, 42, 125, 2, 0.15),
(64, 42, 126, 3, 0.06),
(45, 43, 127, 1, 0.62),
(58, 43, 128, 2, 0.24),
(71, 43, 129, 3, 0.09),
(52, 44, 130, 1, 0.74),
(65, 44, 131, 2, 0.15),
(78, 44, 132, 3, 0.06),
(59, 45, 133, 1, 0.62),
(72, 45, 134, 2, 0.24),
(85, 45, 135, 3, 0.09),
(66, 46, 136, 1, 0.74),
(79, 46, 137, 2, 0.15),
(2, 46, 138, 3, 0.06),
(73, 47, 139, 1, 0.62),
(86, 47, 140, 2, 0.24),
(9, 47, 141, 3, 0.09),
(80, 48, 142, 1, 0.74),
(3, 48, 143, 2, 0.15),
(16, 48, 144, 3, 0.06),
(87, 49, 145, 1, 0.62),
(10, 49, 146, 2, 0.24),
(23, 49, 147, 3, 0.09),
(4, 50, 148, 1, 0.74),
(17, 50, 149, 2, 0.15),
(30, 50, 150, 3, 0.06),
(11, 51, 151, 1, 0.62),
(24, 51, 152, 2, 0.24),
(37, 51, 153, 3, 0.09),
(18, 52, 154, 1, 0.74),
(31, 52, 155, 2, 0.15),
(44, 52, 156, 3, 0.06),
(25, 53, 157, 1, 0.62),
(38, 53, 158, 2, 0.24),
(51, 53, 159, 3, 0.09),
(32, 54, 160, 1, 0.74),
(45, 54, 161, 2, 0.15),
(58, 54, 162, 3, 0.06),
(39, 55, 163, 1, 0.62),
(52, 55, 164, 2, 0.24),
(65, 55, 165, 3, 0.09),
(46, 56, 166, 1, 0.74),
(59, 56, 167, 2, 0.15),
(72, 56, 168, 3, 0.06),
(53, 57, 169, 1, 0.62),
(66, 57, 170, 2, 0.24),
(79, 57, 171, 3, 0.09),
(60, 58, 172, 1, 0.74),
(73, 58, 173, 2, 0.15),
(86, 58, 174, 3, 0.06),
(67, 59, 175, 1, 0.62),
(80, 59, 176, 2, 0.24),
(3, 59, 177, 3, 0.09),
(74, 60, 178, 1, 0.74),
(87, 60, 179, 2, 0.15),
(10, 60, 180, 3, 0.06);

IF @IdentityTable=N'KET_QUA_NHAN_DIEN'
BEGIN
SET IDENTITY_INSERT [dbo].[KET_QUA_NHAN_DIEN] OFF;
SET @IdentityTable=NULL;
END;


-- DON_HANG: 60 dong
IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id=OBJECT_ID(N'dbo.DON_HANG'))
BEGIN
SET IDENTITY_INSERT [dbo].[DON_HANG] ON;
SET @IdentityTable=N'DON_HANG';
END;

INSERT INTO [dbo].[DON_HANG] ([MADONHANG], [MACHUONGTRINHGIAMGIA], [MANGUOIDUNG], [MAGIOHANG], [NGAYDATHANG], [TAMTINH], [SOTIENGIAM], [PHIVANCHUYEN], [TONGTIEN], [DIACHINHANHANG], [SDTNHANHANG], [PHUONGTHUCTHANHTOAN], [TRANGTHAITHANHTOAN], [TRANGTHAIDONHANG])
VALUES
(1, 1, 2, 1, N'2026-10-02T10:00:00', 245000, 24500, 25000, 245500, N'Số 21, Đường Mẫu 1, Khu dân cư giả lập', N'0000020001', N'COD', N'DaThanhToan', N'DaGiao'),
(2, 2, 3, 2, N'2026-10-03T11:00:00', 290000, 20000, 30000, 300000, N'Số 31, Đường Mẫu 1, Khu dân cư giả lập', N'0000030001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(3, 3, 4, 3, N'2026-10-04T12:00:00', 550000, 50000, 20000, 520000, N'Số 41, Đường Mẫu 1, Khu dân cư giả lập', N'0000040001', N'COD', N'DaThanhToan', N'DaGiao'),
(4, 4, 5, 4, N'2026-10-05T13:00:00', 330000, 10000, 25000, 345000, N'Số 51, Đường Mẫu 1, Khu dân cư giả lập', N'0000050001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(5, 5, 6, 5, N'2026-10-06T14:00:00', 240000, 24000, 30000, 246000, N'Số 61, Đường Mẫu 1, Khu dân cư giả lập', N'0000060001', N'COD', N'DaThanhToan', N'DaGiao'),
(6, 6, 7, 6, N'2026-10-02T09:00:00', 250000, 20000, 20000, 250000, N'Số 71, Đường Mẫu 1, Khu dân cư giả lập', N'0000070001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(7, 7, 8, 7, N'2026-10-03T10:00:00', 390000, 50000, 25000, 365000, N'Số 81, Đường Mẫu 1, Khu dân cư giả lập', N'0000080001', N'COD', N'DaThanhToan', N'DaGiao'),
(8, 8, 9, 8, N'2026-10-04T11:00:00', 165000, 10000, 30000, 185000, N'Số 91, Đường Mẫu 1, Khu dân cư giả lập', N'0000090001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(9, 9, 10, 9, N'2026-10-05T12:00:00', 680000, 50000, 20000, 650000, N'Số 101, Đường Mẫu 1, Khu dân cư giả lập', N'0000100001', N'COD', N'DaThanhToan', N'DaGiao'),
(10, 10, 2, 10, N'2026-10-06T13:00:00', 215000, 20000, 25000, 220000, N'Số 21, Đường Mẫu 1, Khu dân cư giả lập', N'0000020001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(11, 11, 3, 11, N'2026-10-02T14:00:00', 525000, 50000, 30000, 505000, N'Số 31, Đường Mẫu 1, Khu dân cư giả lập', N'0000030001', N'COD', N'DaThanhToan', N'DaGiao'),
(12, 12, 4, 12, N'2026-10-03T09:00:00', 225000, 10000, 20000, 235000, N'Số 41, Đường Mẫu 1, Khu dân cư giả lập', N'0000040001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(13, 13, 5, 13, N'2026-10-04T10:00:00', 360000, 36000, 25000, 349000, N'Số 51, Đường Mẫu 1, Khu dân cư giả lập', N'0000050001', N'COD', N'DaThanhToan', N'DaGiao'),
(14, 14, 6, 14, N'2026-10-05T11:00:00', 300000, 20000, 30000, 310000, N'Số 61, Đường Mẫu 1, Khu dân cư giả lập', N'0000060001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(15, 15, 7, 15, N'2026-10-06T12:00:00', 345000, 50000, 20000, 315000, N'Số 71, Đường Mẫu 1, Khu dân cư giả lập', N'0000070001', N'COD', N'DaThanhToan', N'DaGiao'),
(16, 16, 8, 16, N'2026-10-02T13:00:00', 220000, 10000, 25000, 235000, N'Số 81, Đường Mẫu 1, Khu dân cư giả lập', N'0000080001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(17, 17, 9, 17, N'2026-10-03T14:00:00', 380000, 38000, 30000, 372000, N'Số 91, Đường Mẫu 1, Khu dân cư giả lập', N'0000090001', N'COD', N'DaThanhToan', N'DaGiao'),
(18, 18, 10, 18, N'2026-10-04T09:00:00', 240000, 20000, 20000, 240000, N'Số 101, Đường Mẫu 1, Khu dân cư giả lập', N'0000100001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(19, 19, 2, 19, N'2026-10-05T10:00:00', 295000, 50000, 25000, 270000, N'Số 21, Đường Mẫu 1, Khu dân cư giả lập', N'0000020001', N'COD', N'DaThanhToan', N'DaGiao'),
(20, 20, 3, 20, N'2026-10-06T11:00:00', 310000, 10000, 30000, 330000, N'Số 31, Đường Mẫu 1, Khu dân cư giả lập', N'0000030001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(21, 21, 4, 21, N'2026-10-02T12:00:00', 370000, 37000, 20000, 353000, N'Số 41, Đường Mẫu 1, Khu dân cư giả lập', N'0000040001', N'COD', N'DaThanhToan', N'DaGiao'),
(22, 22, 5, 22, N'2026-10-03T13:00:00', 100000, 20000, 25000, 105000, N'Số 51, Đường Mẫu 1, Khu dân cư giả lập', N'0000050001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(23, 23, 6, 23, N'2026-10-04T14:00:00', 420000, 50000, 30000, 400000, N'Số 61, Đường Mẫu 1, Khu dân cư giả lập', N'0000060001', N'COD', N'DaThanhToan', N'DaGiao'),
(24, 24, 7, 24, N'2026-10-05T09:00:00', 350000, 10000, 20000, 360000, N'Số 71, Đường Mẫu 1, Khu dân cư giả lập', N'0000070001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(25, 25, 8, 25, N'2026-10-06T10:00:00', 300000, 30000, 25000, 295000, N'Số 81, Đường Mẫu 1, Khu dân cư giả lập', N'0000080001', N'COD', N'DaThanhToan', N'DaGiao'),
(26, 26, 9, 26, N'2026-10-02T11:00:00', 170000, 20000, 30000, 180000, N'Số 91, Đường Mẫu 1, Khu dân cư giả lập', N'0000090001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(27, 27, 10, 27, N'2026-10-03T12:00:00', 400000, 50000, 20000, 370000, N'Số 101, Đường Mẫu 1, Khu dân cư giả lập', N'0000100001', N'COD', N'DaThanhToan', N'DaGiao'),
(28, 28, 2, 28, N'2026-10-04T13:00:00', 185000, 10000, 25000, 200000, N'Số 21, Đường Mẫu 1, Khu dân cư giả lập', N'0000020001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(29, 29, 3, 29, N'2026-10-05T14:00:00', 305000, 30500, 30000, 304500, N'Số 31, Đường Mẫu 1, Khu dân cư giả lập', N'0000030001', N'COD', N'DaThanhToan', N'DaGiao'),
(30, 30, 4, 30, N'2026-10-06T09:00:00', 220000, 20000, 20000, 220000, N'Số 41, Đường Mẫu 1, Khu dân cư giả lập', N'0000040001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(31, 31, 5, 31, N'2026-10-02T10:00:00', 210000, 42000, 25000, 193000, N'Số 51, Đường Mẫu 1, Khu dân cư giả lập', N'0000050001', N'COD', N'DaThanhToan', N'DaGiao'),
(32, 32, 6, 32, N'2026-10-03T11:00:00', 470000, 10000, 30000, 490000, N'Số 61, Đường Mẫu 1, Khu dân cư giả lập', N'0000060001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(33, 33, 7, 33, N'2026-10-04T12:00:00', 630000, 50000, 20000, 600000, N'Số 71, Đường Mẫu 1, Khu dân cư giả lập', N'0000070001', N'COD', N'DaThanhToan', N'DaGiao'),
(34, 34, 8, 34, N'2026-10-05T13:00:00', 270000, 20000, 25000, 275000, N'Số 81, Đường Mẫu 1, Khu dân cư giả lập', N'0000080001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(35, 35, 9, 35, N'2026-10-06T14:00:00', 310000, 50000, 30000, 290000, N'Số 91, Đường Mẫu 1, Khu dân cư giả lập', N'0000090001', N'COD', N'DaThanhToan', N'DaGiao'),
(36, 36, 10, 36, N'2026-10-02T09:00:00', 330000, 10000, 20000, 340000, N'Số 101, Đường Mẫu 1, Khu dân cư giả lập', N'0000100001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(37, 37, 2, 37, N'2026-10-03T10:00:00', 600000, 50000, 25000, 575000, N'Số 21, Đường Mẫu 1, Khu dân cư giả lập', N'0000020001', N'COD', N'DaThanhToan', N'DaGiao'),
(38, 38, 3, 38, N'2026-10-04T11:00:00', 260000, 20000, 30000, 270000, N'Số 31, Đường Mẫu 1, Khu dân cư giả lập', N'0000030001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(39, 39, 4, 39, N'2026-10-05T12:00:00', 760000, 50000, 20000, 730000, N'Số 41, Đường Mẫu 1, Khu dân cư giả lập', N'0000040001', N'COD', N'DaThanhToan', N'DaGiao'),
(40, 40, 5, 40, N'2026-10-06T13:00:00', 275000, 10000, 25000, 290000, N'Số 51, Đường Mẫu 1, Khu dân cư giả lập', N'0000050001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(41, 41, 6, 41, N'2026-10-02T14:00:00', 470000, 47000, 30000, 453000, N'Số 61, Đường Mẫu 1, Khu dân cư giả lập', N'0000060001', N'COD', N'DaThanhToan', N'DaGiao'),
(42, 42, 7, 42, N'2026-10-03T09:00:00', 225000, 20000, 20000, 225000, N'Số 71, Đường Mẫu 1, Khu dân cư giả lập', N'0000070001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(43, 43, 8, 43, N'2026-10-04T10:00:00', 455000, 50000, 25000, 430000, N'Số 81, Đường Mẫu 1, Khu dân cư giả lập', N'0000080001', N'COD', N'DaThanhToan', N'DaGiao'),
(44, 44, 9, 44, N'2026-10-05T11:00:00', 260000, 10000, 30000, 280000, N'Số 91, Đường Mẫu 1, Khu dân cư giả lập', N'0000090001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(45, 45, 10, 45, N'2026-10-06T12:00:00', 320000, 32000, 20000, 308000, N'Số 101, Đường Mẫu 1, Khu dân cư giả lập', N'0000100001', N'COD', N'DaThanhToan', N'DaGiao'),
(46, 46, 2, 46, N'2026-10-02T13:00:00', 115000, 20000, 25000, 120000, N'Số 21, Đường Mẫu 1, Khu dân cư giả lập', N'0000020001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(47, 47, 3, 47, N'2026-10-03T14:00:00', 500000, 50000, 30000, 480000, N'Số 31, Đường Mẫu 1, Khu dân cư giả lập', N'0000030001', N'COD', N'DaThanhToan', N'DaGiao'),
(48, 48, 4, 48, N'2026-10-04T09:00:00', 230000, 10000, 20000, 240000, N'Số 41, Đường Mẫu 1, Khu dân cư giả lập', N'0000040001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(49, 49, 5, 49, N'2026-10-05T10:00:00', 210000, 21000, 25000, 214000, N'Số 51, Đường Mẫu 1, Khu dân cư giả lập', N'0000050001', N'COD', N'DaThanhToan', N'DaGiao'),
(50, 50, 6, 50, N'2026-10-06T11:00:00', 420000, 20000, 30000, 430000, N'Số 61, Đường Mẫu 1, Khu dân cư giả lập', N'0000060001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(51, NULL, 7, 51, N'2026-10-02T12:00:00', 600000, 0, 20000, 620000, N'Số 71, Đường Mẫu 1, Khu dân cư giả lập', N'0000070001', N'COD', N'DaThanhToan', N'DaGiao'),
(52, NULL, 8, 52, N'2026-10-03T13:00:00', 175000, 0, 25000, 200000, N'Số 81, Đường Mẫu 1, Khu dân cư giả lập', N'0000080001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(53, NULL, 9, 53, N'2026-10-04T14:00:00', 230000, 0, 30000, 260000, N'Số 91, Đường Mẫu 1, Khu dân cư giả lập', N'0000090001', N'COD', N'DaThanhToan', N'DaGiao'),
(54, NULL, 10, 54, N'2026-10-05T09:00:00', 310000, 0, 20000, 330000, N'Số 101, Đường Mẫu 1, Khu dân cư giả lập', N'0000100001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(55, NULL, 2, 55, N'2026-10-06T10:00:00', 660000, 0, 25000, 685000, N'Số 21, Đường Mẫu 1, Khu dân cư giả lập', N'0000020001', N'COD', N'DaThanhToan', N'DaGiao'),
(56, NULL, 3, 56, N'2026-10-02T11:00:00', 330000, 0, 30000, 360000, N'Số 31, Đường Mẫu 1, Khu dân cư giả lập', N'0000030001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(57, NULL, 4, 57, N'2026-10-03T12:00:00', 480000, 0, 20000, 500000, N'Số 41, Đường Mẫu 1, Khu dân cư giả lập', N'0000040001', N'COD', N'DaThanhToan', N'DaGiao'),
(58, NULL, 5, 58, N'2026-10-04T13:00:00', 250000, 0, 25000, 275000, N'Số 51, Đường Mẫu 1, Khu dân cư giả lập', N'0000050001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao'),
(59, NULL, 6, 59, N'2026-10-05T14:00:00', 150000, 0, 30000, 180000, N'Số 61, Đường Mẫu 1, Khu dân cư giả lập', N'0000060001', N'COD', N'DaThanhToan', N'DaGiao'),
(60, NULL, 7, 60, N'2026-10-06T09:00:00', 270000, 0, 20000, 290000, N'Số 71, Đường Mẫu 1, Khu dân cư giả lập', N'0000070001', N'ChuyenKhoan', N'DaThanhToan', N'DaGiao');

IF @IdentityTable=N'DON_HANG'
BEGIN
SET IDENTITY_INSERT [dbo].[DON_HANG] OFF;
SET @IdentityTable=NULL;
END;


-- CHI_TIET_GIO_HANG: 129 dong
IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id=OBJECT_ID(N'dbo.CHI_TIET_GIO_HANG'))
BEGIN
SET IDENTITY_INSERT [dbo].[CHI_TIET_GIO_HANG] ON;
SET @IdentityTable=N'CHI_TIET_GIO_HANG';
END;

INSERT INTO [dbo].[CHI_TIET_GIO_HANG] ([MAGIOHANG], [MASANPHAM], [MACHITIETGIOHANG], [SOLUONGCHON], [DONGIABAN])
VALUES
(1, 1, 1, 2, 85000),
(1, 31, 2, 1, 75000),
(2, 2, 3, 1, 60000),
(2, 32, 4, 1, 230000),
(3, 3, 5, 2, 150000),
(3, 33, 6, 1, 250000),
(4, 4, 7, 1, 180000),
(4, 34, 8, 1, 150000),
(5, 5, 9, 2, 70000),
(5, 35, 10, 1, 100000),
(6, 6, 11, 1, 70000),
(6, 36, 12, 1, 180000),
(7, 7, 13, 2, 85000),
(7, 37, 14, 1, 220000),
(8, 8, 15, 1, 65000),
(8, 38, 16, 1, 100000),
(9, 9, 17, 2, 200000),
(9, 39, 18, 1, 280000),
(10, 10, 19, 1, 120000),
(10, 40, 20, 1, 95000),
(11, 11, 21, 2, 220000),
(11, 41, 22, 1, 85000),
(12, 12, 23, 1, 130000),
(12, 42, 24, 1, 95000),
(13, 13, 25, 2, 90000),
(13, 43, 26, 1, 180000),
(14, 14, 27, 1, 140000),
(14, 44, 28, 1, 160000),
(15, 15, 29, 2, 130000),
(15, 45, 30, 1, 85000),
(16, 16, 31, 1, 160000),
(16, 46, 32, 1, 60000),
(17, 17, 33, 2, 110000),
(17, 47, 34, 1, 160000),
(18, 18, 35, 1, 90000),
(18, 48, 36, 1, 150000),
(19, 19, 37, 2, 120000),
(19, 49, 38, 1, 55000),
(20, 20, 39, 1, 130000),
(20, 50, 40, 1, 180000),
(21, 21, 41, 2, 60000),
(21, 51, 42, 1, 250000),
(22, 22, 43, 1, 45000),
(22, 52, 44, 1, 55000),
(23, 23, 45, 2, 180000),
(23, 53, 46, 1, 60000),
(24, 24, 47, 1, 200000),
(24, 54, 48, 1, 150000),
(25, 25, 49, 2, 60000),
(25, 55, 50, 1, 180000),
(26, 26, 51, 1, 90000),
(26, 56, 52, 1, 80000),
(27, 27, 53, 2, 130000),
(27, 57, 54, 1, 140000),
(28, 28, 55, 1, 85000),
(28, 58, 56, 1, 100000),
(29, 29, 57, 2, 130000),
(29, 59, 58, 1, 45000),
(30, 30, 59, 1, 100000),
(30, 60, 60, 1, 120000),
(31, 31, 61, 2, 75000),
(31, 61, 62, 1, 60000),
(32, 32, 63, 1, 230000),
(32, 62, 64, 1, 240000),
(33, 33, 65, 2, 250000),
(33, 63, 66, 1, 130000),
(34, 34, 67, 1, 150000),
(34, 64, 68, 1, 120000),
(35, 35, 69, 2, 100000),
(35, 65, 70, 1, 110000),
(36, 36, 71, 1, 180000),
(36, 66, 72, 1, 150000),
(37, 37, 73, 2, 220000),
(37, 67, 74, 1, 160000),
(38, 38, 75, 1, 100000),
(38, 68, 76, 1, 160000),
(39, 39, 77, 2, 280000),
(39, 69, 78, 1, 200000),
(40, 40, 79, 1, 95000),
(40, 70, 80, 1, 180000),
(41, 41, 81, 2, 85000),
(41, 71, 82, 1, 300000),
(42, 42, 83, 1, 95000),
(42, 72, 84, 1, 130000),
(43, 43, 85, 2, 180000),
(43, 73, 86, 1, 95000),
(44, 44, 87, 1, 160000),
(44, 74, 88, 1, 100000),
(45, 45, 89, 2, 85000),
(45, 75, 90, 1, 150000),
(46, 46, 91, 1, 60000),
(46, 76, 92, 1, 55000),
(47, 47, 93, 2, 160000),
(47, 77, 94, 1, 180000),
(48, 48, 95, 1, 150000),
(48, 78, 96, 1, 80000),
(49, 49, 97, 2, 55000),
(49, 79, 98, 1, 100000),
(50, 50, 99, 1, 180000),
(50, 80, 100, 1, 240000),
(51, 51, 101, 2, 250000),
(51, 81, 102, 1, 100000),
(52, 52, 103, 1, 55000),
(52, 82, 104, 1, 120000),
(53, 53, 105, 2, 60000),
(53, 83, 106, 1, 110000),
(54, 54, 107, 1, 150000),
(54, 84, 108, 1, 160000),
(55, 55, 109, 2, 180000),
(55, 85, 110, 1, 300000),
(56, 56, 111, 1, 80000),
(56, 86, 112, 1, 250000),
(57, 57, 113, 2, 140000),
(57, 87, 114, 1, 200000),
(58, 58, 115, 1, 100000),
(58, 88, 116, 1, 150000),
(59, 59, 117, 2, 45000),
(59, 89, 118, 1, 60000),
(60, 60, 119, 1, 120000),
(60, 90, 120, 1, 150000),
(61, 72, 121, 1, 130000),
(62, 73, 122, 1, 95000),
(63, 74, 123, 1, 100000),
(64, 75, 124, 1, 150000),
(65, 76, 125, 1, 55000),
(66, 77, 126, 1, 180000),
(67, 78, 127, 1, 80000),
(68, 79, 128, 1, 100000),
(69, 80, 129, 1, 240000);

IF @IdentityTable=N'CHI_TIET_GIO_HANG'
BEGIN
SET IDENTITY_INSERT [dbo].[CHI_TIET_GIO_HANG] OFF;
SET @IdentityTable=NULL;
END;


-- HINH_ANH_SAN_PHAM: 180 dong
IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id=OBJECT_ID(N'dbo.HINH_ANH_SAN_PHAM'))
BEGIN
SET IDENTITY_INSERT [dbo].[HINH_ANH_SAN_PHAM] ON;
SET @IdentityTable=N'HINH_ANH_SAN_PHAM';
END;

INSERT INTO [dbo].[HINH_ANH_SAN_PHAM] ([MAANH], [MASANPHAM], [URLANH], [LAANHCHINH])
VALUES
(1, 1, N'assets/demo/products/001_1.jpg', 1),
(2, 1, N'assets/demo/products/001_2.jpg', 0),
(3, 2, N'assets/demo/products/002_1.jpg', 1),
(4, 2, N'assets/demo/products/002_2.jpg', 0),
(5, 3, N'assets/demo/products/003_1.jpg', 1),
(6, 3, N'assets/demo/products/003_2.jpg', 0),
(7, 4, N'assets/demo/products/004_1.jpg', 1),
(8, 4, N'assets/demo/products/004_2.jpg', 0),
(9, 5, N'assets/demo/products/005_1.jpg', 1),
(10, 5, N'assets/demo/products/005_2.jpg', 0),
(11, 6, N'assets/demo/products/006_1.jpg', 1),
(12, 6, N'assets/demo/products/006_2.jpg', 0),
(13, 7, N'assets/demo/products/007_1.jpg', 1),
(14, 7, N'assets/demo/products/007_2.jpg', 0),
(15, 8, N'assets/demo/products/008_1.jpg', 1),
(16, 8, N'assets/demo/products/008_2.jpg', 0),
(17, 9, N'assets/demo/products/009_1.jpg', 1),
(18, 9, N'assets/demo/products/009_2.jpg', 0),
(19, 10, N'assets/demo/products/010_1.jpg', 1),
(20, 10, N'assets/demo/products/010_2.jpg', 0),
(21, 11, N'assets/demo/products/011_1.jpg', 1),
(22, 11, N'assets/demo/products/011_2.jpg', 0),
(23, 12, N'assets/demo/products/012_1.jpg', 1),
(24, 12, N'assets/demo/products/012_2.jpg', 0),
(25, 13, N'assets/demo/products/013_1.jpg', 1),
(26, 13, N'assets/demo/products/013_2.jpg', 0),
(27, 14, N'assets/demo/products/014_1.jpg', 1),
(28, 14, N'assets/demo/products/014_2.jpg', 0),
(29, 15, N'assets/demo/products/015_1.jpg', 1),
(30, 15, N'assets/demo/products/015_2.jpg', 0),
(31, 16, N'assets/demo/products/016_1.jpg', 1),
(32, 16, N'assets/demo/products/016_2.jpg', 0),
(33, 17, N'assets/demo/products/017_1.jpg', 1),
(34, 17, N'assets/demo/products/017_2.jpg', 0),
(35, 18, N'assets/demo/products/018_1.jpg', 1),
(36, 18, N'assets/demo/products/018_2.jpg', 0),
(37, 19, N'assets/demo/products/019_1.jpg', 1),
(38, 19, N'assets/demo/products/019_2.jpg', 0),
(39, 20, N'assets/demo/products/020_1.jpg', 1),
(40, 20, N'assets/demo/products/020_2.jpg', 0),
(41, 21, N'assets/demo/products/021_1.jpg', 1),
(42, 21, N'assets/demo/products/021_2.jpg', 0),
(43, 22, N'assets/demo/products/022_1.jpg', 1),
(44, 22, N'assets/demo/products/022_2.jpg', 0),
(45, 23, N'assets/demo/products/023_1.jpg', 1),
(46, 23, N'assets/demo/products/023_2.jpg', 0),
(47, 24, N'assets/demo/products/024_1.jpg', 1),
(48, 24, N'assets/demo/products/024_2.jpg', 0),
(49, 25, N'assets/demo/products/025_1.jpg', 1),
(50, 25, N'assets/demo/products/025_2.jpg', 0),
(51, 26, N'assets/demo/products/026_1.jpg', 1),
(52, 26, N'assets/demo/products/026_2.jpg', 0),
(53, 27, N'assets/demo/products/027_1.jpg', 1),
(54, 27, N'assets/demo/products/027_2.jpg', 0),
(55, 28, N'assets/demo/products/028_1.jpg', 1),
(56, 28, N'assets/demo/products/028_2.jpg', 0),
(57, 29, N'assets/demo/products/029_1.jpg', 1),
(58, 29, N'assets/demo/products/029_2.jpg', 0),
(59, 30, N'assets/demo/products/030_1.jpg', 1),
(60, 30, N'assets/demo/products/030_2.jpg', 0),
(61, 31, N'assets/demo/products/031_1.jpg', 1),
(62, 31, N'assets/demo/products/031_2.jpg', 0),
(63, 32, N'assets/demo/products/032_1.jpg', 1),
(64, 32, N'assets/demo/products/032_2.jpg', 0),
(65, 33, N'assets/demo/products/033_1.jpg', 1),
(66, 33, N'assets/demo/products/033_2.jpg', 0),
(67, 34, N'assets/demo/products/034_1.jpg', 1),
(68, 34, N'assets/demo/products/034_2.jpg', 0),
(69, 35, N'assets/demo/products/035_1.jpg', 1),
(70, 35, N'assets/demo/products/035_2.jpg', 0),
(71, 36, N'assets/demo/products/036_1.jpg', 1),
(72, 36, N'assets/demo/products/036_2.jpg', 0),
(73, 37, N'assets/demo/products/037_1.jpg', 1),
(74, 37, N'assets/demo/products/037_2.jpg', 0),
(75, 38, N'assets/demo/products/038_1.jpg', 1),
(76, 38, N'assets/demo/products/038_2.jpg', 0),
(77, 39, N'assets/demo/products/039_1.jpg', 1),
(78, 39, N'assets/demo/products/039_2.jpg', 0),
(79, 40, N'assets/demo/products/040_1.jpg', 1),
(80, 40, N'assets/demo/products/040_2.jpg', 0),
(81, 41, N'assets/demo/products/041_1.jpg', 1),
(82, 41, N'assets/demo/products/041_2.jpg', 0),
(83, 42, N'assets/demo/products/042_1.jpg', 1),
(84, 42, N'assets/demo/products/042_2.jpg', 0),
(85, 43, N'assets/demo/products/043_1.jpg', 1),
(86, 43, N'assets/demo/products/043_2.jpg', 0),
(87, 44, N'assets/demo/products/044_1.jpg', 1),
(88, 44, N'assets/demo/products/044_2.jpg', 0),
(89, 45, N'assets/demo/products/045_1.jpg', 1),
(90, 45, N'assets/demo/products/045_2.jpg', 0),
(91, 46, N'assets/demo/products/046_1.jpg', 1),
(92, 46, N'assets/demo/products/046_2.jpg', 0),
(93, 47, N'assets/demo/products/047_1.jpg', 1),
(94, 47, N'assets/demo/products/047_2.jpg', 0),
(95, 48, N'assets/demo/products/048_1.jpg', 1),
(96, 48, N'assets/demo/products/048_2.jpg', 0),
(97, 49, N'assets/demo/products/049_1.jpg', 1),
(98, 49, N'assets/demo/products/049_2.jpg', 0),
(99, 50, N'assets/demo/products/050_1.jpg', 1),
(100, 50, N'assets/demo/products/050_2.jpg', 0),
(101, 51, N'assets/demo/products/051_1.jpg', 1),
(102, 51, N'assets/demo/products/051_2.jpg', 0),
(103, 52, N'assets/demo/products/052_1.jpg', 1),
(104, 52, N'assets/demo/products/052_2.jpg', 0),
(105, 53, N'assets/demo/products/053_1.jpg', 1),
(106, 53, N'assets/demo/products/053_2.jpg', 0),
(107, 54, N'assets/demo/products/054_1.jpg', 1),
(108, 54, N'assets/demo/products/054_2.jpg', 0),
(109, 55, N'assets/demo/products/055_1.jpg', 1),
(110, 55, N'assets/demo/products/055_2.jpg', 0),
(111, 56, N'assets/demo/products/056_1.jpg', 1),
(112, 56, N'assets/demo/products/056_2.jpg', 0),
(113, 57, N'assets/demo/products/057_1.jpg', 1),
(114, 57, N'assets/demo/products/057_2.jpg', 0),
(115, 58, N'assets/demo/products/058_1.jpg', 1),
(116, 58, N'assets/demo/products/058_2.jpg', 0),
(117, 59, N'assets/demo/products/059_1.jpg', 1),
(118, 59, N'assets/demo/products/059_2.jpg', 0),
(119, 60, N'assets/demo/products/060_1.jpg', 1),
(120, 60, N'assets/demo/products/060_2.jpg', 0),
(121, 61, N'assets/demo/products/061_1.jpg', 1),
(122, 61, N'assets/demo/products/061_2.jpg', 0),
(123, 62, N'assets/demo/products/062_1.jpg', 1),
(124, 62, N'assets/demo/products/062_2.jpg', 0),
(125, 63, N'assets/demo/products/063_1.jpg', 1),
(126, 63, N'assets/demo/products/063_2.jpg', 0),
(127, 64, N'assets/demo/products/064_1.jpg', 1),
(128, 64, N'assets/demo/products/064_2.jpg', 0),
(129, 65, N'assets/demo/products/065_1.jpg', 1),
(130, 65, N'assets/demo/products/065_2.jpg', 0),
(131, 66, N'assets/demo/products/066_1.jpg', 1),
(132, 66, N'assets/demo/products/066_2.jpg', 0),
(133, 67, N'assets/demo/products/067_1.jpg', 1),
(134, 67, N'assets/demo/products/067_2.jpg', 0),
(135, 68, N'assets/demo/products/068_1.jpg', 1),
(136, 68, N'assets/demo/products/068_2.jpg', 0),
(137, 69, N'assets/demo/products/069_1.jpg', 1),
(138, 69, N'assets/demo/products/069_2.jpg', 0),
(139, 70, N'assets/demo/products/070_1.jpg', 1),
(140, 70, N'assets/demo/products/070_2.jpg', 0),
(141, 71, N'assets/demo/products/071_1.jpg', 1),
(142, 71, N'assets/demo/products/071_2.jpg', 0),
(143, 72, N'assets/demo/products/072_1.jpg', 1),
(144, 72, N'assets/demo/products/072_2.jpg', 0),
(145, 73, N'assets/demo/products/073_1.jpg', 1),
(146, 73, N'assets/demo/products/073_2.jpg', 0),
(147, 74, N'assets/demo/products/074_1.jpg', 1),
(148, 74, N'assets/demo/products/074_2.jpg', 0),
(149, 75, N'assets/demo/products/075_1.jpg', 1),
(150, 75, N'assets/demo/products/075_2.jpg', 0),
(151, 76, N'assets/demo/products/076_1.jpg', 1),
(152, 76, N'assets/demo/products/076_2.jpg', 0),
(153, 77, N'assets/demo/products/077_1.jpg', 1),
(154, 77, N'assets/demo/products/077_2.jpg', 0),
(155, 78, N'assets/demo/products/078_1.jpg', 1),
(156, 78, N'assets/demo/products/078_2.jpg', 0),
(157, 79, N'assets/demo/products/079_1.jpg', 1),
(158, 79, N'assets/demo/products/079_2.jpg', 0),
(159, 80, N'assets/demo/products/080_1.jpg', 1),
(160, 80, N'assets/demo/products/080_2.jpg', 0),
(161, 81, N'assets/demo/products/081_1.jpg', 1),
(162, 81, N'assets/demo/products/081_2.jpg', 0),
(163, 82, N'assets/demo/products/082_1.jpg', 1),
(164, 82, N'assets/demo/products/082_2.jpg', 0),
(165, 83, N'assets/demo/products/083_1.jpg', 1),
(166, 83, N'assets/demo/products/083_2.jpg', 0),
(167, 84, N'assets/demo/products/084_1.jpg', 1),
(168, 84, N'assets/demo/products/084_2.jpg', 0),
(169, 85, N'assets/demo/products/085_1.jpg', 1),
(170, 85, N'assets/demo/products/085_2.jpg', 0),
(171, 86, N'assets/demo/products/086_1.jpg', 1),
(172, 86, N'assets/demo/products/086_2.jpg', 0),
(173, 87, N'assets/demo/products/087_1.jpg', 1),
(174, 87, N'assets/demo/products/087_2.jpg', 0),
(175, 88, N'assets/demo/products/088_1.jpg', 1),
(176, 88, N'assets/demo/products/088_2.jpg', 0),
(177, 89, N'assets/demo/products/089_1.jpg', 1),
(178, 89, N'assets/demo/products/089_2.jpg', 0),
(179, 90, N'assets/demo/products/090_1.jpg', 1),
(180, 90, N'assets/demo/products/090_2.jpg', 0);

IF @IdentityTable=N'HINH_ANH_SAN_PHAM'
BEGIN
SET IDENTITY_INSERT [dbo].[HINH_ANH_SAN_PHAM] OFF;
SET @IdentityTable=NULL;
END;


-- DANH_GIA_SAN_PHAM: 60 dong
IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id=OBJECT_ID(N'dbo.DANH_GIA_SAN_PHAM'))
BEGIN
SET IDENTITY_INSERT [dbo].[DANH_GIA_SAN_PHAM] ON;
SET @IdentityTable=N'DANH_GIA_SAN_PHAM';
END;

INSERT INTO [dbo].[DANH_GIA_SAN_PHAM] ([MADANHGIA], [MADONHANG], [MASANPHAM], [SOSAO], [HINHANHTHUCTE], [NOIDUNGBINHLUAN], [NGAYDANHGIA])
VALUES
(1, 1, 1, 4, N'assets/demo/reviews/001.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-11T10:00:00'),
(2, 2, 2, 5, N'assets/demo/reviews/002.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-12T10:00:00'),
(3, 3, 3, 3, N'assets/demo/reviews/003.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-13T10:00:00'),
(4, 4, 4, 4, N'assets/demo/reviews/004.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-10T10:00:00'),
(5, 5, 5, 5, N'assets/demo/reviews/005.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-11T10:00:00'),
(6, 6, 6, 3, N'assets/demo/reviews/006.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-12T10:00:00'),
(7, 7, 7, 4, N'assets/demo/reviews/007.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-13T10:00:00'),
(8, 8, 8, 5, N'assets/demo/reviews/008.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-10T10:00:00'),
(9, 9, 9, 3, N'assets/demo/reviews/009.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-11T10:00:00'),
(10, 10, 10, 4, N'assets/demo/reviews/010.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-12T10:00:00'),
(11, 11, 11, 5, N'assets/demo/reviews/011.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-13T10:00:00'),
(12, 12, 12, 3, N'assets/demo/reviews/012.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-10T10:00:00'),
(13, 13, 13, 4, N'assets/demo/reviews/013.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-11T10:00:00'),
(14, 14, 14, 5, N'assets/demo/reviews/014.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-12T10:00:00'),
(15, 15, 15, 3, N'assets/demo/reviews/015.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-13T10:00:00'),
(16, 16, 16, 4, N'assets/demo/reviews/016.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-10T10:00:00'),
(17, 17, 17, 5, N'assets/demo/reviews/017.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-11T10:00:00'),
(18, 18, 18, 3, N'assets/demo/reviews/018.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-12T10:00:00'),
(19, 19, 19, 4, N'assets/demo/reviews/019.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-13T10:00:00'),
(20, 20, 20, 5, N'assets/demo/reviews/020.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-10T10:00:00'),
(21, 21, 21, 3, N'assets/demo/reviews/021.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-11T10:00:00'),
(22, 22, 22, 4, N'assets/demo/reviews/022.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-12T10:00:00'),
(23, 23, 23, 5, N'assets/demo/reviews/023.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-13T10:00:00'),
(24, 24, 24, 3, N'assets/demo/reviews/024.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-10T10:00:00'),
(25, 25, 25, 4, N'assets/demo/reviews/025.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-11T10:00:00'),
(26, 26, 26, 5, N'assets/demo/reviews/026.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-12T10:00:00'),
(27, 27, 27, 3, N'assets/demo/reviews/027.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-13T10:00:00'),
(28, 28, 28, 4, N'assets/demo/reviews/028.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-10T10:00:00'),
(29, 29, 29, 5, N'assets/demo/reviews/029.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-11T10:00:00'),
(30, 30, 30, 3, N'assets/demo/reviews/030.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-12T10:00:00'),
(31, 31, 31, 4, N'assets/demo/reviews/031.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-13T10:00:00'),
(32, 32, 32, 5, N'assets/demo/reviews/032.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-10T10:00:00'),
(33, 33, 33, 3, N'assets/demo/reviews/033.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-11T10:00:00'),
(34, 34, 34, 4, N'assets/demo/reviews/034.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-12T10:00:00'),
(35, 35, 35, 5, N'assets/demo/reviews/035.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-13T10:00:00'),
(36, 36, 36, 3, N'assets/demo/reviews/036.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-10T10:00:00'),
(37, 37, 37, 4, N'assets/demo/reviews/037.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-11T10:00:00'),
(38, 38, 38, 5, N'assets/demo/reviews/038.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-12T10:00:00'),
(39, 39, 39, 3, N'assets/demo/reviews/039.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-13T10:00:00'),
(40, 40, 40, 4, N'assets/demo/reviews/040.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-10T10:00:00'),
(41, 41, 41, 5, N'assets/demo/reviews/041.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-11T10:00:00'),
(42, 42, 42, 3, N'assets/demo/reviews/042.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-12T10:00:00'),
(43, 43, 43, 4, N'assets/demo/reviews/043.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-13T10:00:00'),
(44, 44, 44, 5, N'assets/demo/reviews/044.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-10T10:00:00'),
(45, 45, 45, 3, N'assets/demo/reviews/045.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-11T10:00:00'),
(46, 46, 46, 4, N'assets/demo/reviews/046.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-12T10:00:00'),
(47, 47, 47, 5, N'assets/demo/reviews/047.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-13T10:00:00'),
(48, 48, 48, 3, N'assets/demo/reviews/048.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-10T10:00:00'),
(49, 49, 49, 4, N'assets/demo/reviews/049.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-11T10:00:00'),
(50, 50, 50, 5, N'assets/demo/reviews/050.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-12T10:00:00'),
(51, 51, 51, 3, N'assets/demo/reviews/051.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-13T10:00:00'),
(52, 52, 52, 4, N'assets/demo/reviews/052.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-10T10:00:00'),
(53, 53, 53, 5, N'assets/demo/reviews/053.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-11T10:00:00'),
(54, 54, 54, 3, N'assets/demo/reviews/054.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-12T10:00:00'),
(55, 55, 55, 4, N'assets/demo/reviews/055.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-13T10:00:00'),
(56, 56, 56, 5, N'assets/demo/reviews/056.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-10T10:00:00'),
(57, 57, 57, 3, N'assets/demo/reviews/057.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-11T10:00:00'),
(58, 58, 58, 4, N'assets/demo/reviews/058.jpg', N'Đánh giá giả lập: cây khỏe, cần thêm hướng dẫn chăm sóc.', N'2026-10-12T10:00:00'),
(59, 59, 59, 5, N'assets/demo/reviews/059.jpg', N'Đánh giá giả lập: sản phẩm đúng thông tin trong đơn hàng.', N'2026-10-13T10:00:00'),
(60, 60, 60, 3, N'assets/demo/reviews/060.jpg', N'Đánh giá giả lập: cây được đóng gói gọn, giao đúng sản phẩm.', N'2026-10-10T10:00:00');

IF @IdentityTable=N'DANH_GIA_SAN_PHAM'
BEGIN
SET IDENTITY_INSERT [dbo].[DANH_GIA_SAN_PHAM] OFF;
SET @IdentityTable=NULL;
END;


-- LICH_SU_GIA_SAN_PHAM: 180 dong
IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id=OBJECT_ID(N'dbo.LICH_SU_GIA_SAN_PHAM'))
BEGIN
SET IDENTITY_INSERT [dbo].[LICH_SU_GIA_SAN_PHAM] ON;
SET @IdentityTable=N'LICH_SU_GIA_SAN_PHAM';
END;

INSERT INTO [dbo].[LICH_SU_GIA_SAN_PHAM] ([MASANPHAM], [MATHOIDIEM], [MALICHSUGIA], [LYDOTHAIDOI], [GIABAN])
VALUES
(1, 1, 1, N'Giá giả lập tháng 9', 80000),
(1, 2, 2, N'Giá giả lập tháng 10', 85000),
(2, 3, 3, N'Giá giả lập tháng 9', 55000),
(2, 4, 4, N'Giá giả lập tháng 10', 60000),
(3, 5, 5, N'Giá giả lập tháng 9', 145000),
(3, 6, 6, N'Giá giả lập tháng 10', 150000),
(4, 7, 7, N'Giá giả lập tháng 9', 175000),
(4, 8, 8, N'Giá giả lập tháng 10', 180000),
(5, 9, 9, N'Giá giả lập tháng 9', 65000),
(5, 10, 10, N'Giá giả lập tháng 10', 70000),
(6, 11, 11, N'Giá giả lập tháng 9', 65000),
(6, 12, 12, N'Giá giả lập tháng 10', 70000),
(7, 13, 13, N'Giá giả lập tháng 9', 80000),
(7, 14, 14, N'Giá giả lập tháng 10', 85000),
(8, 15, 15, N'Giá giả lập tháng 9', 60000),
(8, 16, 16, N'Giá giả lập tháng 10', 65000),
(9, 17, 17, N'Giá giả lập tháng 9', 195000),
(9, 18, 18, N'Giá giả lập tháng 10', 200000),
(10, 19, 19, N'Giá giả lập tháng 9', 115000),
(10, 20, 20, N'Giá giả lập tháng 10', 120000),
(11, 21, 21, N'Giá giả lập tháng 9', 215000),
(11, 22, 22, N'Giá giả lập tháng 10', 220000),
(12, 23, 23, N'Giá giả lập tháng 9', 125000),
(12, 24, 24, N'Giá giả lập tháng 10', 130000),
(13, 25, 25, N'Giá giả lập tháng 9', 85000),
(13, 26, 26, N'Giá giả lập tháng 10', 90000),
(14, 27, 27, N'Giá giả lập tháng 9', 135000),
(14, 28, 28, N'Giá giả lập tháng 10', 140000),
(15, 29, 29, N'Giá giả lập tháng 9', 125000),
(15, 30, 30, N'Giá giả lập tháng 10', 130000),
(16, 31, 31, N'Giá giả lập tháng 9', 155000),
(16, 32, 32, N'Giá giả lập tháng 10', 160000),
(17, 33, 33, N'Giá giả lập tháng 9', 105000),
(17, 34, 34, N'Giá giả lập tháng 10', 110000),
(18, 35, 35, N'Giá giả lập tháng 9', 85000),
(18, 36, 36, N'Giá giả lập tháng 10', 90000),
(19, 37, 37, N'Giá giả lập tháng 9', 115000),
(19, 38, 38, N'Giá giả lập tháng 10', 120000),
(20, 39, 39, N'Giá giả lập tháng 9', 125000),
(20, 40, 40, N'Giá giả lập tháng 10', 130000),
(21, 41, 41, N'Giá giả lập tháng 9', 55000),
(21, 42, 42, N'Giá giả lập tháng 10', 60000),
(22, 43, 43, N'Giá giả lập tháng 9', 40000),
(22, 44, 44, N'Giá giả lập tháng 10', 45000),
(23, 45, 45, N'Giá giả lập tháng 9', 175000),
(23, 46, 46, N'Giá giả lập tháng 10', 180000),
(24, 47, 47, N'Giá giả lập tháng 9', 195000),
(24, 48, 48, N'Giá giả lập tháng 10', 200000),
(25, 49, 49, N'Giá giả lập tháng 9', 55000),
(25, 50, 50, N'Giá giả lập tháng 10', 60000),
(26, 51, 51, N'Giá giả lập tháng 9', 85000),
(26, 52, 52, N'Giá giả lập tháng 10', 90000),
(27, 53, 53, N'Giá giả lập tháng 9', 125000),
(27, 54, 54, N'Giá giả lập tháng 10', 130000),
(28, 55, 55, N'Giá giả lập tháng 9', 80000),
(28, 56, 56, N'Giá giả lập tháng 10', 85000),
(29, 57, 57, N'Giá giả lập tháng 9', 125000),
(29, 58, 58, N'Giá giả lập tháng 10', 130000),
(30, 59, 59, N'Giá giả lập tháng 9', 95000),
(30, 60, 60, N'Giá giả lập tháng 10', 100000),
(31, 61, 61, N'Giá giả lập tháng 9', 70000),
(31, 62, 62, N'Giá giả lập tháng 10', 75000),
(32, 63, 63, N'Giá giả lập tháng 9', 225000),
(32, 64, 64, N'Giá giả lập tháng 10', 230000),
(33, 65, 65, N'Giá giả lập tháng 9', 245000),
(33, 66, 66, N'Giá giả lập tháng 10', 250000),
(34, 67, 67, N'Giá giả lập tháng 9', 145000),
(34, 68, 68, N'Giá giả lập tháng 10', 150000),
(35, 69, 69, N'Giá giả lập tháng 9', 95000),
(35, 70, 70, N'Giá giả lập tháng 10', 100000),
(36, 71, 71, N'Giá giả lập tháng 9', 175000),
(36, 72, 72, N'Giá giả lập tháng 10', 180000),
(37, 73, 73, N'Giá giả lập tháng 9', 215000),
(37, 74, 74, N'Giá giả lập tháng 10', 220000),
(38, 75, 75, N'Giá giả lập tháng 9', 95000),
(38, 76, 76, N'Giá giả lập tháng 10', 100000),
(39, 77, 77, N'Giá giả lập tháng 9', 275000),
(39, 78, 78, N'Giá giả lập tháng 10', 280000),
(40, 79, 79, N'Giá giả lập tháng 9', 90000),
(40, 80, 80, N'Giá giả lập tháng 10', 95000),
(41, 81, 81, N'Giá giả lập tháng 9', 80000),
(41, 82, 82, N'Giá giả lập tháng 10', 85000),
(42, 83, 83, N'Giá giả lập tháng 9', 90000),
(42, 84, 84, N'Giá giả lập tháng 10', 95000),
(43, 85, 85, N'Giá giả lập tháng 9', 175000),
(43, 86, 86, N'Giá giả lập tháng 10', 180000),
(44, 87, 87, N'Giá giả lập tháng 9', 155000),
(44, 88, 88, N'Giá giả lập tháng 10', 160000),
(45, 89, 89, N'Giá giả lập tháng 9', 80000),
(45, 90, 90, N'Giá giả lập tháng 10', 85000),
(46, 91, 91, N'Giá giả lập tháng 9', 55000),
(46, 92, 92, N'Giá giả lập tháng 10', 60000),
(47, 93, 93, N'Giá giả lập tháng 9', 155000),
(47, 94, 94, N'Giá giả lập tháng 10', 160000),
(48, 95, 95, N'Giá giả lập tháng 9', 145000),
(48, 96, 96, N'Giá giả lập tháng 10', 150000),
(49, 97, 97, N'Giá giả lập tháng 9', 50000),
(49, 98, 98, N'Giá giả lập tháng 10', 55000),
(50, 99, 99, N'Giá giả lập tháng 9', 175000),
(50, 100, 100, N'Giá giả lập tháng 10', 180000),
(51, 101, 101, N'Giá giả lập tháng 9', 245000),
(51, 102, 102, N'Giá giả lập tháng 10', 250000),
(52, 103, 103, N'Giá giả lập tháng 9', 50000),
(52, 104, 104, N'Giá giả lập tháng 10', 55000),
(53, 105, 105, N'Giá giả lập tháng 9', 55000),
(53, 106, 106, N'Giá giả lập tháng 10', 60000),
(54, 107, 107, N'Giá giả lập tháng 9', 145000),
(54, 108, 108, N'Giá giả lập tháng 10', 150000),
(55, 109, 109, N'Giá giả lập tháng 9', 175000),
(55, 110, 110, N'Giá giả lập tháng 10', 180000),
(56, 111, 111, N'Giá giả lập tháng 9', 75000),
(56, 112, 112, N'Giá giả lập tháng 10', 80000),
(57, 113, 113, N'Giá giả lập tháng 9', 135000),
(57, 114, 114, N'Giá giả lập tháng 10', 140000),
(58, 115, 115, N'Giá giả lập tháng 9', 95000),
(58, 116, 116, N'Giá giả lập tháng 10', 100000),
(59, 117, 117, N'Giá giả lập tháng 9', 40000),
(59, 118, 118, N'Giá giả lập tháng 10', 45000),
(60, 119, 119, N'Giá giả lập tháng 9', 115000),
(60, 120, 120, N'Giá giả lập tháng 10', 120000),
(61, 121, 121, N'Giá giả lập tháng 9', 55000),
(61, 122, 122, N'Giá giả lập tháng 10', 60000),
(62, 123, 123, N'Giá giả lập tháng 9', 235000),
(62, 124, 124, N'Giá giả lập tháng 10', 240000),
(63, 125, 125, N'Giá giả lập tháng 9', 125000),
(63, 126, 126, N'Giá giả lập tháng 10', 130000),
(64, 127, 127, N'Giá giả lập tháng 9', 115000),
(64, 128, 128, N'Giá giả lập tháng 10', 120000),
(65, 129, 129, N'Giá giả lập tháng 9', 105000),
(65, 130, 130, N'Giá giả lập tháng 10', 110000),
(66, 131, 131, N'Giá giả lập tháng 9', 145000),
(66, 132, 132, N'Giá giả lập tháng 10', 150000),
(67, 133, 133, N'Giá giả lập tháng 9', 155000),
(67, 134, 134, N'Giá giả lập tháng 10', 160000),
(68, 135, 135, N'Giá giả lập tháng 9', 155000),
(68, 136, 136, N'Giá giả lập tháng 10', 160000),
(69, 137, 137, N'Giá giả lập tháng 9', 195000),
(69, 138, 138, N'Giá giả lập tháng 10', 200000),
(70, 139, 139, N'Giá giả lập tháng 9', 175000),
(70, 140, 140, N'Giá giả lập tháng 10', 180000),
(71, 141, 141, N'Giá giả lập tháng 9', 295000),
(71, 142, 142, N'Giá giả lập tháng 10', 300000),
(72, 143, 143, N'Giá giả lập tháng 9', 125000),
(72, 144, 144, N'Giá giả lập tháng 10', 130000),
(73, 145, 145, N'Giá giả lập tháng 9', 90000),
(73, 146, 146, N'Giá giả lập tháng 10', 95000),
(74, 147, 147, N'Giá giả lập tháng 9', 95000),
(74, 148, 148, N'Giá giả lập tháng 10', 100000),
(75, 149, 149, N'Giá giả lập tháng 9', 145000),
(75, 150, 150, N'Giá giả lập tháng 10', 150000),
(76, 151, 151, N'Giá giả lập tháng 9', 50000),
(76, 152, 152, N'Giá giả lập tháng 10', 55000),
(77, 153, 153, N'Giá giả lập tháng 9', 175000),
(77, 154, 154, N'Giá giả lập tháng 10', 180000),
(78, 155, 155, N'Giá giả lập tháng 9', 75000),
(78, 156, 156, N'Giá giả lập tháng 10', 80000),
(79, 157, 157, N'Giá giả lập tháng 9', 95000),
(79, 158, 158, N'Giá giả lập tháng 10', 100000),
(80, 159, 159, N'Giá giả lập tháng 9', 235000),
(80, 160, 160, N'Giá giả lập tháng 10', 240000),
(81, 161, 161, N'Giá giả lập tháng 9', 95000),
(81, 162, 162, N'Giá giả lập tháng 10', 100000),
(82, 163, 163, N'Giá giả lập tháng 9', 115000),
(82, 164, 164, N'Giá giả lập tháng 10', 120000),
(83, 165, 165, N'Giá giả lập tháng 9', 105000),
(83, 166, 166, N'Giá giả lập tháng 10', 110000),
(84, 167, 167, N'Giá giả lập tháng 9', 155000),
(84, 168, 168, N'Giá giả lập tháng 10', 160000),
(85, 169, 169, N'Giá giả lập tháng 9', 295000),
(85, 170, 170, N'Giá giả lập tháng 10', 300000),
(86, 171, 171, N'Giá giả lập tháng 9', 245000),
(86, 172, 172, N'Giá giả lập tháng 10', 250000),
(87, 173, 173, N'Giá giả lập tháng 9', 195000),
(87, 174, 174, N'Giá giả lập tháng 10', 200000),
(88, 175, 175, N'Giá giả lập tháng 9', 145000),
(88, 176, 176, N'Giá giả lập tháng 10', 150000),
(89, 177, 177, N'Giá giả lập tháng 9', 55000),
(89, 178, 178, N'Giá giả lập tháng 10', 60000),
(90, 179, 179, N'Giá giả lập tháng 9', 145000),
(90, 180, 180, N'Giá giả lập tháng 10', 150000);

IF @IdentityTable=N'LICH_SU_GIA_SAN_PHAM'
BEGIN
SET IDENTITY_INSERT [dbo].[LICH_SU_GIA_SAN_PHAM] OFF;
SET @IdentityTable=NULL;
END;

IF EXISTS (SELECT 1 FROM dbo.DON_HANG o JOIN dbo.GIO_HANG g ON g.MAGIOHANG=o.MAGIOHANG WHERE o.MANGUOIDUNG<>g.MANGUOIDUNG) THROW 51006,N'Sai chu gio hang.',1;

IF EXISTS (SELECT 1 FROM dbo.DON_HANG o CROSS APPLY(SELECT SUM(c.SOLUONGCHON*c.DONGIABAN) s FROM dbo.CHI_TIET_GIO_HANG c WHERE c.MAGIOHANG=o.MAGIOHANG) v WHERE o.TAMTINH<>v.s OR o.TONGTIEN<>o.TAMTINH-o.SOTIENGIAM+o.PHIVANCHUYEN) THROW 51007,N'Sai tong tien.',1;

COMMIT;
PRINT N'Nhap thanh cong 90 nhan cay va du lieu mau 15 bang.';

END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK;
IF @IdentityTable IS NOT NULL
BEGIN
DECLARE @DisableIdentity nvarchar(500)=N'SET IDENTITY_INSERT [dbo].'+QUOTENAME(@IdentityTable)+N' OFF;';
EXEC sys.sp_executesql @DisableIdentity;
END;
THROW;
END CATCH;