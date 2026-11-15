import os
import sys
import json
import shutil
from collections import defaultdict
from datetime import datetime
from typing import Optional, List, Dict, Any
import numpy as np
try:
    import pyodbc
except ImportError:
    pyodbc = None
from PIL import Image, ImageOps
try:
    import cv2
except ImportError:
    cv2 = None
try:
    import tensorflow as tf
except ImportError:
    tf = None
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

app = FastAPI(title="Hệ Thống Thương Mại & Nhận Diện Cây Kiểng Lá AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

PLANTS_DIR = r"E:\CNTT\NLCNHTTT\frontend-kieng-la\public\plants"
if os.path.exists(PLANTS_DIR):
    app.mount("/plants", StaticFiles(directory=PLANTS_DIR), name="plants")

@app.post("/api/upload")
async def upload_image_file(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"prod_{int(datetime.now().timestamp() * 1000)}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"url": f"/uploads/{filename}", "filename": filename}

# =====================================================================
# 1. KẾT NỐI SQL SERVER (DESKTOP-KTO6D9A\SQLEXPRESS)
# =====================================================================
SERVER_NAME = r"DESKTOP-KTO6D9A\SQLEXPRESS"
DATABASE_NAME = "CayKiengLa"

# Từ điển chuẩn hóa tên cột IN HOA từ SQL sang CamelCase cho Frontend
KEY_MAP = {
    "madanhmuc": "MaDanhMuc", "tendanhmuc": "TenDanhMuc", "hinhanhdanhmuc": "HinhAnhDanhMuc",
    "maloaicay": "MaLoaiCay", "tenkhoahoc": "TenKhoaHoc", "tenthuonggoi": "TenThuongGoi",
    "dacdiemnhandang": "DacDiemNhanDang", "xuatxu": "XuatXu", "huongdanchamsoc": "HuongDanChamSoc",
    "giathamkhao": "GiaThamKhao", "masanpham": "MaSanPham", "tensanpham": "TenSanPham",
    "soluongtonkho": "SoLuongTonKho", "kichthuoccay": "KichThuocCay", "tinhtrangcay": "TinhTrangCay",
    "urlanh": "UrlAnh", "giaban": "GiaBan", "maanh": "MaAnh", "laanhchinh": "LaAnhChinh",
    "manguoidung": "MaNguoiDung", "taikhoan": "TaiKhoan", "hoten": "HoTen", "email": "Email",
    "vaitro": "VaiTro", "magiohang": "MaGioHang", "machitietgiohang": "MaChiTietGioHang",
    "soluongchon": "SoLuongChon", "dongiaban": "DonGiaBan", "madonhang": "MaDonHang",
    "khachhang": "KhachHang", "sdtnhanhang": "SdtNhanHang", "diachinhanhang": "DiaChiNhanHang",
    "phuongthucthanhtoan": "PhuongThucThanhToan", "trangthaidonhang": "TrangThaiDonHang",
    "trangthaithanhtoan": "TrangThaiThanhToan", "tongtien": "TongTien", "tamtinh": "TamTinh",
    "phivanchuyen": "PhiVanChuyen", "ngaydathang": "NgayDatHang",
    "machitietdonhang": "MaChiTietDonHang", "soluongmua": "SoLuongMua", "dongiamua": "DonGiaMua",
    "thanhtien": "ThanhTien",
    "trangthaitaikhoan": "TrangThaiTaiKhoan", "ngaydangky": "NgayDangKy",
    "sotruongdonhang": "SoLuongDonHang", "tongchitieu": "TongChiTieu",
    "madanhgia": "MaDanhGia", "sosao": "SoSao", "noidungbinhluan": "NoiDungBinhLuan",
    "ngaydanhgia": "NgayDanhGia", "hinhanhthucte": "HinhAnhThucTe",
    "machuongtrinhgiamgia": "MaChuongTrinhGiamGia", "tenmagiamgia": "TenMaGiamGia",
    "tenchuongtrinhgiamgia": "TenChuongTrinhGiamGia", "loaigiamgia": "LoaiGiamGia",
    "giatrigiam": "GiaTriGiam", "toida": "ToiDa", "toithieu": "ToiThieu",
    "soluongphieu": "SoLuongPhieu", "soluongdadung": "SoLuongDaDung",
    "mota": "MoTa", "ngaybatdau": "NgayBatDau", "ngayketthuc": "NgayKetThuc",
    "sotiengiam": "SoTienGiam", "trangthainhandien": "TrangThaiNhanDien",
    "anhsang": "AnhSang", "doam": "DoAm", "nhietdo": "NhietDo",
    "doctinh": "DocTinh", "phongthuy": "PhongThuy", "ngaynhap": "NgayNhap"
}

def normalize_row(cols, row):
    res = {}
    for c, val in zip(cols, row):
        c_low = c.lower()
        clean_key = KEY_MAP.get(c_low, c)
        res[clean_key] = val
        res[c_low] = val
        res[c] = val
    return res

from sqlite_adapter import get_sqlite_connection

def get_db_connection():
    if os.getenv("USE_SQLITE", "0") == "1":
        return get_sqlite_connection()
    if pyodbc is not None:
        for driver in ["{SQL Server}", "{ODBC Driver 17 for SQL Server}", "{ODBC Driver 18 for SQL Server}"]:
            try:
                conn_str = (
                    f"DRIVER={driver};"
                    f"SERVER={SERVER_NAME};"
                    f"DATABASE={DATABASE_NAME};"
                    f"Trusted_Connection=yes;"
                    f"TrustServerCertificate=yes;"
                )
                return pyodbc.connect(conn_str, autocommit=True, timeout=2)
            except Exception:
                continue
    sqlite_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "caykiengla.db")
    if os.path.exists(sqlite_file):
        return get_sqlite_connection(sqlite_file)
    raise Exception("Không thể kết nối SQL Server hoặc SQLite dự phòng.")

def query_db(sql: str, params: tuple = (), fetch_one=False, commit=False):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        result = None
        if cursor.description:
            columns = [column[0] for column in cursor.description]
            if fetch_one:
                row = cursor.fetchone()
                result = normalize_row(columns, row) if row else None
            else:
                result = [normalize_row(columns, row) for row in cursor.fetchall()]
        if commit:
            conn.commit()
        return result
    finally:
        conn.close()

# =====================================================================
# 2. TẢI MODEL AI KERAS & FILE ÁNH XẠ 90 LỚP
# =====================================================================
MODEL_PATH = os.path.join("model", "best_model.keras")
if not os.path.exists(MODEL_PATH) and os.path.exists("../best_model.keras"):
    MODEL_PATH = "../best_model.keras"

MAPPING_PATH = "AnhXa_Model_90Lop.json"
if not os.path.exists(MAPPING_PATH) and os.path.exists("../KiengLa_90Cay_Data/AnhXa_Model_90Lop.json"):
    MAPPING_PATH = "../KiengLa_90Cay_Data/AnhXa_Model_90Lop.json"

model = None
ensemble_models = []
class_mapping = {}
yolo_detector = None
yolo_load_attempted = False

def get_yolo_detector():
    """Tải lười (lazy-load) và cache mô hình YOLOv8n nếu có sẵn trên đĩa."""
    global yolo_detector, yolo_load_attempted
    if yolo_detector is not None:
        return yolo_detector
    if yolo_load_attempted:
        return None
    yolo_load_attempted = True

    yolo_candidates = [
        "yolov8n.pt",
        "../yolov8n.pt",
        r"e:\CNTT\NLCNHTTT\yolov8n.pt",
    ]
    yolo_path = next((p for p in yolo_candidates if os.path.exists(p)), None)
    if not yolo_path:
        print("[AI] Notice: yolov8n.pt not found, multi-plant will use OpenCV foliage segmentation + fallback.")
        return None

    try:
        from ultralytics import YOLO
        yolo_detector = YOLO(yolo_path)
        print(f"[AI] Loaded YOLOv8n detector from {yolo_path}")
    except Exception as e:
        print(f"[AI] Warning loading YOLOv8n ({yolo_path}): {e}")
        yolo_detector = None
    return yolo_detector

# Trọng số hiệu chỉnh Prior / Logit Adjustment (Menon et al., ICLR 2021) khắc phục hiện tượng
# thiên vị (false-positive attractor) của class_weight='balanced' trên nền phức tạp ngoài vườn
PRIOR_CALIB = np.ones(90, dtype=np.float32)
PRIOR_CALIB[6] = 0.42   # Peperomia obtusifolia (Trường sinh lá tròn)
PRIOR_CALIB[18] = 0.55  # Pilea peperomioides (Cỏ đồng tiền Pilea)
PRIOR_CALIB[29] = 0.72  # Dieffenbachia (Vạn niên thanh)
PRIOR_CALIB[71] = 0.82  # Schefflera arboricola (Ngũ gia bì)

def normalize_pil_rgb(img: Image.Image) -> Image.Image:
    """Chuẩn hóa hướng ảnh EXIF từ điện thoại và xử lý nền trong suốt RGBA của ảnh .webp/.png."""
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        rgba = img.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        img = Image.alpha_composite(bg, rgba).convert("RGB")
    else:
        img = img.convert("RGB")
    return img

def find_foliage_centroid(img: Image.Image):
    """Tìm trọng tâm vùng thực vật (Excess Green + Độ bão hòa màu) để tự động cắt bỏ nền gạch/bê tông."""
    thumb = img.resize((128, 128), Image.Resampling.BILINEAR)
    arr = np.array(thumb, dtype=np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    exg = np.clip(2.0 * g - r - b, 0, None)
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    sat = (max_c - min_c) / (max_c + 1e-5)
    score_map = exg * (sat > 0.18) + (sat * 80.0) * ((max_c > 45) & (max_c < 240))
    total = np.sum(score_map)
    if total < 1e-3:
        return 0.5, 0.5
    ys, xs = np.indices(score_map.shape)
    cy = float(np.sum(ys * score_map) / total) / 128.0
    cx = float(np.sum(xs * score_map) / total) / 128.0
    return float(np.clip(cx, 0.25, 0.75)), float(np.clip(cy, 0.25, 0.75))

def vegetation_score(arr_rgb: np.ndarray) -> float:
    """Tính tỷ lệ diện tích lá/hoa thực vật trong khung cắt (224x224) để giảm trọng số khung toàn nền gạch."""
    r, g, b = arr_rgb[:, :, 0], arr_rgb[:, :, 1], arr_rgb[:, :, 2]
    exg = (2.0 * g - r - b) > 18.0
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    sat = (max_c - min_c) / (max_c + 1e-5)
    colorful = (sat > 0.22) & (max_c > 40) & (max_c < 245)
    return float(np.mean(exg | colorful))

def extract_multi_scale_tta_batch(img: Image.Image, input_shape=(224, 224)) -> np.ndarray:
    """
    Chuẩn hóa hướng ảnh EXIF, xử lý RGBA và trích xuất 8 khung nhìn đa tỷ lệ + tự động bám tâm vùng lá
    (Multi-Scale Crop + Foliage-Centroid ROI TTA) giúp bảo toàn chi tiết gân lá và loại bỏ nền gạch ngoài trời.
    """
    img = normalize_pil_rgb(img)
    w, h = img.size
    m = min(w, h)
    # 1. Toàn khung hình & Khung vuông trung tâm 100%
    c_full = img.resize(input_shape, Image.Resampling.BILINEAR)
    sq100 = img.crop(((w - m) // 2, (h - m) // 2, (w + m) // 2, (h + m) // 2)).resize(input_shape, Image.Resampling.BILINEAR)
    # 2. Khung vuông ROI 80% và 60% tâm ảnh
    m80 = int(m * 0.80)
    sq80 = img.crop(((w - m80) // 2, (h - m80) // 2, (w + m80) // 2, (h + m80) // 2)).resize(input_shape, Image.Resampling.BILINEAR)
    m60 = int(m * 0.60)
    sq60 = img.crop(((w - m60) // 2, (h - m60) // 2, (w + m60) // 2, (h + m60) // 2)).resize(input_shape, Image.Resampling.BILINEAR)
    # 3. Khung vuông tự động bám trọng tâm vùng lá (Foliage-Centroid ROI 70%, 52%, cận dưới, cận trên)
    fx, fy = find_foliage_centroid(img)
    fcx, fcy = int(fx * w), int(fy * h)

    def crop_around(cx_px, cy_px, side):
        x1 = max(0, min(w - side, cx_px - side // 2))
        y1 = max(0, min(h - side, cy_px - side // 2))
        return img.crop((x1, y1, x1 + side, y1 + side)).resize(input_shape, Image.Resampling.BILINEAR)

    f_roi70 = crop_around(fcx, fcy, int(m * 0.70))
    f_roi52 = crop_around(fcx, fcy, int(m * 0.52))
    f_low = crop_around(fcx, int(min(h * 0.75, fcy + m * 0.15)), int(m * 0.62))
    f_high = crop_around(fcx, int(max(h * 0.25, fcy - m * 0.15)), int(m * 0.62))

    crops = [c_full, sq100, sq80, sq60, f_roi70, f_roi52, f_low, f_high]
    return np.stack([np.array(c, dtype=np.float32) for c in crops], axis=0)

def entropy_weighted_pool(prob_matrix: np.ndarray, tta_batch: Optional[np.ndarray] = None, temp: float = 0.15) -> np.ndarray:
    """
    Gộp dự đoán từ các khung cắt TTA theo trọng số sắc nét (Shannon Entropy thấp + Đỉnh xác suất cao + Tỷ lệ lá thực vật):
    Khung cắt nào bắt trúng vùng lá rõ nét sẽ quyết định kết quả thay vì bị pha loãng bởi các khung nền gạch.
    """
    clipped = np.clip(prob_matrix, 1e-9, 1.0)
    ent = -np.sum(clipped * np.log(clipped), axis=1) / np.log(prob_matrix.shape[1])
    max_p = np.max(clipped, axis=1)
    weights = np.exp(-(ent / temp)) * (max_p ** 1.8)
    if tta_batch is not None and len(tta_batch) == len(weights):
        veg = np.array([max(0.25, vegetation_score(arr)) for arr in tta_batch], dtype=np.float32)
        weights = weights * (veg ** 0.85)
    view_boost = np.array([1.10, 1.20, 1.20, 1.10, 1.25, 1.15, 1.05, 1.00], dtype=np.float32)[:len(weights)]
    weights = weights * view_boost
    weights = weights / np.sum(weights)
    return np.sum(prob_matrix * weights[:, None], axis=0)

def calibrate_predictions(raw_preds: np.ndarray) -> np.ndarray:
    """
    Hiệu chỉnh Prior (Logit Adjustment - Menon et al., 2021), khử nhiễu đồng kích hoạt lá đốm nhỏ
    (#29 Dieffenbachia vs #37 Trúc đốm) và Temperature Scaling (Guo et al., 2017).
    """
    preds = raw_preds * PRIOR_CALIB
    if int(np.argmax(preds)) == 29:
        spotted_small_leaf_signal = raw_preds[37] + raw_preds[60]
        araceae_large_leaf_signal = raw_preds[16]
        if raw_preds[37] >= 0.0025 and spotted_small_leaf_signal > araceae_large_leaf_signal * 2.5:
            preds[37] = preds[29] * 1.35
            preds[29] = preds[29] * 0.25

    preds = np.clip(preds, 1e-9, 1.0)
    logits_calibrated = np.log(preds) / 0.35
    logits_calibrated -= np.max(logits_calibrated)
    exp_logits = np.exp(logits_calibrated)
    return exp_logits / np.sum(exp_logits)

@app.on_event("startup")
def load_ai_resources():
    global model, ensemble_models, class_mapping
    ensemble_models = []
    candidate_models = [
        (MODEL_PATH, 0.25, "MobileNetV2-30k-Seed123"),
        (os.path.join("model", "best_model_seed_999_fixed.keras"), 0.20, "MobileNetV2-Seed999"),
        (os.path.join("model", "efficientnet_b0_30k.keras"), 0.45, "EfficientNetB0-30k"),
        (os.path.join("model", "best_model_80_10_10_clean.keras"), 0.10, "MobileNetV2-80-10-10"),
    ]
    for m_path, m_weight, m_name in candidate_models:
        if os.path.exists(m_path):
            try:
                loaded_m = tf.keras.models.load_model(m_path, compile=False)
                if loaded_m.output_shape[-1] == 90:
                    ensemble_models.append((loaded_m, m_weight, m_name))
                    if model is None:
                        model = loaded_m
                    print(f"[AI] Loaded ensemble member: {m_name} ({m_path}, weight={m_weight})")
            except Exception as e:
                print(f"[AI] Warning loading {m_path}: {e}")

    labels_vi_path = os.path.join("model", "labels_vi.json")
    class_names_path = os.path.join("model", "class_names.json")

    if os.path.exists(labels_vi_path):
        with open(labels_vi_path, "r", encoding="utf-8") as f:
            items = json.load(f)
            for it in items:
                cid = int(it.get("class_id", 0))
                class_mapping[cid] = {
                    "class_index": cid,
                    "MaLoaiCay": cid + 1,
                    "original_label": it.get("original_label", ""),
                    "vietnamese_name": it.get("vietnamese_name", "")
                }
    elif os.path.exists(class_names_path):
        with open(class_names_path, "r", encoding="utf-8") as f:
            names = json.load(f)
            for idx, name in enumerate(names):
                class_mapping[idx] = {
                    "class_index": idx,
                    "MaLoaiCay": idx + 1,
                    "original_label": name,
                    "vietnamese_name": name
                }
    # Lớp thứ 91: Lớp khác (Chưa có trong kho dữ liệu - Out-of-Distribution Class)
    UNKNOWN_CLASS_ID = 91
    class_mapping[90] = {
        "class_index": 90,
        "MaLoaiCay": UNKNOWN_CLASS_ID,
        "original_label": "Out-of-Dataset / Unregistered Flora",
        "vietnamese_name": "Lớp khác (Chưa có trong kho dữ liệu)"
    }
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM DANH_MUC WHERE MADANHMUC = 51")
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO DANH_MUC (MADANHMUC, TENDANHMUC, HINHANHDANHMUC) VALUES (51, N'Lớp khác (Ngoài kho dữ liệu)', N'/plants/1.jpg')"
            )
        cur.execute("SELECT 1 FROM LOAI_CAY WHERE MALOAICAY = ?", (UNKNOWN_CLASS_ID,))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO LOAI_CAY (MALOAICAY, MADANHMUC, MASANPHAM, TENKHOAHOC, TENTHUONGGOI, DACDIEMNHANDANG, XUATXU, HUONGDANCHAMSOC, GIATHAMKHAO)
                VALUES (
                    ?, 51, NULL,
                    N'Out-of-Dataset / Unregistered Flora',
                    N'Lớp khác (Chưa có trong kho dữ liệu)',
                    N'Đặc trưng hình thái lá không khớp với 90 loài kiểng lá hiện có trong CSDL (độ tin cậy dưới ngưỡng chuẩn 55% hoặc độ phân tán Entropy cao).',
                    N'Ngoài kho dữ liệu (Out-of-Distribution)',
                    N'Đặt cây nơi ánh sáng tán xạ vừa phải, kiểm tra độ ẩm giá thể trước khi tưới và gửi phản hồi để quản trị viên bổ sung loài mới vào CSDL.',
                    0
                )
            """, (UNKNOWN_CLASS_ID,))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[AI] Notice ensuring Unknown Class #{UNKNOWN_CLASS_ID} in DB: {e}")

    print(f"[AI] Loaded {len(class_mapping)} plant classes (90 known + 1 Unknown Class #91) successfully.")

# =====================================================================
# 3. CÁC API CỬA HÀNG, GIỎ HÀNG, ĐƠN HÀNG & AI
# =====================================================================
class AddToCartRequest(BaseModel):
    MaNguoiDung: int
    MaSanPham: int
    SoLuongChon: int = 1

class CheckoutRequest(BaseModel):
    MaNguoiDung: int
    DiaChiNhanHang: str
    SDTNhanHang: str
    PhuongThucThanhToan: str = "COD"
    MaChuongTrinhGiamGia: Optional[int] = None

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "FloraBotanic AI Service"}

@app.get("/api/danh-muc")
def get_danh_muc():
    return query_db("SELECT * FROM DANH_MUC")

@app.get("/api/loai-cay")
def get_loai_cay():
    return query_db("""
        SELECT lc.MALOAICAY, lc.TENKHOAHOC, lc.TENTHUONGGOI, lc.GIATHAMKHAO, 
               lc.HUONGDANCHAMSOC, lc.DACDIEMNHANDANG AS DACDIEM, lc.XUATXU,
               lc.ANHSANG, lc.DOAM, lc.NHIETDO, lc.DOCTINH, lc.PHONGTHUY,
               (SELECT TOP 1 URLANH FROM HINH_ANH_SAN_PHAM ha 
                JOIN SAN_PHAM sp ON ha.MASANPHAM = sp.MASANPHAM 
                WHERE sp.MALOAICAY = lc.MALOAICAY ORDER BY LAANHCHINH DESC) AS URLANH
        FROM LOAI_CAY lc
        ORDER BY lc.MALOAICAY
    """)

@app.get("/api/san-pham")
def get_san_pham(ma_danh_muc: Optional[int] = None, search: Optional[str] = None):
    sql = """
        SELECT sp.MASANPHAM, sp.TENSANPHAM, sp.SOLUONGTONKHO, sp.KICHTHUOCCAY, sp.TINHTRANGCAY, sp.NGAYNHAP,
               lc.MALOAICAY, lc.TENKHOAHOC, lc.TENTHUONGGOI, lc.GIATHAMKHAO, lc.HUONGDANCHAMSOC,
               lc.DACDIEMNHANDANG, lc.XUATXU, dm.MADANHMUC, dm.TENDANHMUC,
               (SELECT TOP 1 URLANH FROM HINH_ANH_SAN_PHAM ha WHERE ha.MASANPHAM = sp.MASANPHAM ORDER BY LAANHCHINH DESC, MAANH ASC) AS URLANH,
               ISNULL((SELECT TOP 1 GIABAN FROM LICH_SU_GIA_SAN_PHAM lsg WHERE lsg.MASANPHAM = sp.MASANPHAM ORDER BY MALICHSUGIA DESC), lc.GIATHAMKHAO) AS GIABAN
        FROM SAN_PHAM sp
        JOIN LOAI_CAY lc ON sp.MALOAICAY = lc.MALOAICAY
        JOIN DANH_MUC dm ON lc.MADANHMUC = dm.MADANHMUC
        WHERE 1=1
    """
    params = []
    if ma_danh_muc:
        sql += " AND dm.MADANHMUC = ?"
        params.append(ma_danh_muc)
    if search:
        sql += " AND (sp.TENSANPHAM LIKE ? OR lc.TENTHUONGGOI LIKE ? OR lc.TENKHOAHOC LIKE ?)"
        kw = f"%{search}%"
        params.extend([kw, kw, kw])
    prods = query_db(sql, tuple(params))

    # Lấy toàn bộ album ảnh thực tế cho từng sản phẩm
    try:
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT MAANH, MASANPHAM, URLANH, LAANHCHINH FROM HINH_ANH_SAN_PHAM ORDER BY LAANHCHINH DESC, MAANH ASC")
            img_dict = defaultdict(list)
            for r in cur.fetchall():
                img_dict[r[1]].append({
                    "MaAnh": r[0],
                    "MaSanPham": r[1],
                    "UrlAnh": r[2],
                    "LaAnhChinh": bool(r[3]),
                    "url": r[2],
                    "isMain": bool(r[3])
                })
        finally:
            conn.close()
        for p in prods:
            sp_id = p.get("MASANPHAM") or p.get("masanpham") or p.get("MaSanPham")
            p["DanhSachAnh"] = img_dict.get(sp_id, [])
    except Exception as e:
        print("Lỗi nạp danh sách ảnh phụ sản phẩm:", e)

    return prods

@app.post("/nhan-dien")
@app.post("/api/nhan-dien-anh")
async def nhan_dien_cay(
    file: UploadFile = File(...),
    user_id: Optional[int] = None,
    ma_nguoi_dung: Optional[int] = Form(None)
):
    if model is None:
        raise HTTPException(status_code=500, detail="Model AI chưa được tải")

    user_id_val = user_id or ma_nguoi_dung

    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"search_{int(datetime.now().timestamp() * 1000)}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    input_shape = model.input_shape[1:3] if model.input_shape else (224, 224)
    with Image.open(filepath) as raw_img:
        tta_batch = extract_multi_scale_tta_batch(raw_img, input_shape=input_shape)

    # Suy luận kết hợp đa mô hình (Soft-Voting Ensemble: MobileNetV2 + EfficientNetB0) + Multi-Crop TTA
    if ensemble_models:
        combined_probs = np.zeros(90, dtype=np.float32)
        total_w = 0.0
        for ens_m, ens_w, _ in ensemble_models:
            batch_preds = ens_m(tta_batch, training=False).numpy()
            pooled_p = entropy_weighted_pool(batch_preds, tta_batch)
            combined_probs += ens_w * pooled_p
            total_w += ens_w
        raw_preds = combined_probs / max(total_w, 1e-6)
    else:
        batch_preds = model(tta_batch, training=False).numpy()
        raw_preds = entropy_weighted_pool(batch_preds, tta_batch)

    # Hiệu chỉnh Prior (Logit Adjustment - Menon et al., 2021) & Temperature Scaling (Guo et al., 2017)
    preds = calibrate_predictions(raw_preds)
    top_indices = np.argsort(preds)[::-1][:3]

    top1_idx = int(top_indices[0])
    top2_idx = int(top_indices[1]) if len(top_indices) > 1 else top1_idx
    top1_info = class_mapping.get(top1_idx, {})
    top1_ma_loai = top1_info.get("MaLoaiCay", top1_idx + 1)
    top1_vi = top1_info.get("vietnamese_name", f"Loài cây #{top1_ma_loai}")
    top1_en = top1_info.get("original_label", f"Class #{top1_idx}")
    top1_prob = float(preds[top1_idx])
    top2_prob = float(preds[top2_idx])
    prob_margin = top1_prob - top2_prob

    # Tính độ phân tán Normalized Shannon Entropy trên 90 lớp (0 = rất chắc chắn, 1 = đoán mò đồng đều)
    clipped_preds = np.clip(preds, 1e-12, 1.0)
    norm_entropy = float(-np.sum(clipped_preds * np.log(clipped_preds)) / np.log(len(preds)))

    conn = get_db_connection()
    cursor = conn.cursor()

    # Lấy thông tin chi tiết của loài top 1 trong 90 loài
    cursor.execute("""
        SELECT MALOAICAY, TENKHOAHOC, TENTHUONGGOI, XUATXU, GIATHAMKHAO, DACDIEMNHANDANG, HUONGDANCHAMSOC,
               ANHSANG, DOAM, NHIETDO, DOCTINH, PHONGTHUY
        FROM LOAI_CAY WHERE MALOAICAY = ?
    """, (top1_ma_loai,))
    crow = cursor.fetchone()

    # =====================================================================
    # PHÂN LỚP "LỚP KHÁC / NGOÀI KHO DỮ LIỆU" (CLASS #91 - OUT-OF-DISTRIBUTION)
    # 1. Độ tin cậy Top-1 < 55% (CONFIDENCE_THRESHOLD)
    # 2. Hoặc độ phân tán Normalized Entropy > 0.45 (mô hình không chắc chắn, xác suất bị dàn trải)
    # 3. Hoặc mô hình phân vân giữa 2 loài (Top1 < 65% & chênh lệch Top1 - Top2 < 15%)
    # 4. Hoặc mã loài không tồn tại trong bảng LOAI_CAY
    # =====================================================================
    UNKNOWN_CLASS_ID = 91
    CONFIDENCE_THRESHOLD = 0.16
    ENTROPY_THRESHOLD = 0.88
    is_unknown_species = (
        top1_prob < CONFIDENCE_THRESHOLD
        or norm_entropy > ENTROPY_THRESHOLD
        or (crow is None)
    )

    cursor.execute("SELECT ISNULL(MAX(MATIMKIEM), 0) + 1 FROM TIM_ANH")
    ma_tim_kiem = cursor.fetchone()[0]

    trang_thai_nhan_dien = N_STATUS = (
        "Lớp khác (Ngoài kho dữ liệu)" if is_unknown_species else "Thành công"
    )
    cursor.execute("""
        INSERT INTO TIM_ANH (MATIMKIEM, MANGUOIDUNG, HINHANHURL, THOIGIAN, NENTANG, PHIENBANMODEL, TRANGTHAINHANDIEN)
        VALUES (?, ?, ?, GETDATE(), N'Web', N'v1.0', ?)
    """, (ma_tim_kiem, user_id_val, f"/uploads/{filename}", trang_thai_nhan_dien))

    ket_qua_tra_ve = []
    top_k_results = []

    for rank_idx, idx in enumerate(top_indices, start=1):
        prob = float(preds[idx])
        mapped_info = class_mapping.get(int(idx), {})
        ma_loai_cay = mapped_info.get("MaLoaiCay", int(idx) + 1)
        vi_name = mapped_info.get("vietnamese_name", f"Loài cây #{ma_loai_cay}")
        en_name = mapped_info.get("original_label", f"Class #{idx}")

        top_k_results.append({
            "maloaicay": ma_loai_cay,
            "loai": vi_name,
            "loai_goc": en_name,
            "xac_suat": prob
        })

        # Luôn lưu đúng loài cây có xác suất Top 1, Top 2, Top 3 vào THUHANG = 1, 2, 3
        cursor.execute("SELECT ISNULL(MAX(MAKETQUA), 0) + 1 FROM KET_QUA_NHAN_DIEN")
        ma_ket_qua = cursor.fetchone()[0]
        cursor.execute("""
            INSERT INTO KET_QUA_NHAN_DIEN (MALOAICAY, MATIMKIEM, MAKETQUA, THUHANG, XACSUATCHINHXAC)
            VALUES (?, ?, ?, ?, ?)
        """, (ma_loai_cay, ma_tim_kiem, ma_ket_qua, rank_idx, round(prob * 100, 2)))

        cursor.execute("""
            SELECT lc.*, sp.MASANPHAM, sp.TENSANPHAM, sp.SOLUONGTONKHO,
                   (SELECT TOP 1 URLANH FROM HINH_ANH_SAN_PHAM ha WHERE ha.MASANPHAM = sp.MASANPHAM ORDER BY LAANHCHINH DESC) AS URLANH,
                   ISNULL((SELECT TOP 1 GIABAN FROM LICH_SU_GIA_SAN_PHAM lsg WHERE lsg.MASANPHAM = sp.MASANPHAM ORDER BY MALICHSUGIA DESC), lc.GIATHAMKHAO) AS GIABAN
            FROM LOAI_CAY lc
            LEFT JOIN SAN_PHAM sp ON lc.MALOAICAY = sp.MALOAICAY
            WHERE lc.MALOAICAY = ?
        """, (ma_loai_cay,))
        row = cursor.fetchone()
        if row:
            cols = [c[0] for c in cursor.description]
            plant_data = normalize_row(cols, row)
            plant_data["ThuHang"] = rank_idx
            plant_data["XacSuatChinhXac"] = round(prob * 100, 2)
            ket_qua_tra_ve.append(plant_data)

    if is_unknown_species:
        thong_tin_chi_tiet = {
            "maloaicay": UNKNOWN_CLASS_ID,
            "tenkhoahoc": "Out-of-Dataset / Unregistered Flora (Class #91)",
            "tenthuonggoi": "Lớp khác (Chưa có trong kho dữ liệu)",
            "xuatxu": "Ngoài danh mục 90 loài hiện tại",
            "giathamkhao": 0.0,
            "dacdiem": (
                f"Đặc trưng hình thái trong ảnh chỉ khớp tối đa {top1_prob * 100:.1f}% với 90 loài trong kho dữ liệu "
                f"(thấp hơn ngưỡng chuẩn {CONFIDENCE_THRESHOLD * 100:.0f}%, độ phân tán Entropy = {norm_entropy:.2f}). "
                f"Hệ thống tự động xếp vào Lớp Khác (#91)."
            ),
            "huongdanchamsoc": (
                "Đối với loài cây mới chưa có trong kho dữ liệu: Nên đặt ở nơi ánh sáng tán xạ vừa phải, "
                "kiểm tra độ ẩm giá thể trước khi tưới và gửi phản hồi để quản trị viên bổ sung loài này vào CSDL."
            ),
            "anhsang": "Ánh sáng tán xạ vừa phải 50% - 65%, tránh nắng gắt trực tiếp.",
            "doam": "Trung bình 60% - 70%.",
            "nhietdo": "20°C - 28°C.",
            "doctinh": "Chưa xác định trong CSDL. Khuyến nghị để xa tầm với thú cưng và trẻ nhỏ.",
            "phongthuy": "Tượng trưng cho sự độc bản, cơ duyên khám phá điều mới mẻ và sự giao hòa tự nhiên đa dạng.",
            "urlanh": f"/uploads/{filename}"
        }
    elif crow:
        thong_tin_chi_tiet = {
            "maloaicay": crow[0],
            "tenkhoahoc": crow[1],
            "tenthuonggoi": crow[2],
            "xuatxu": crow[3] or "Nhiệt đới",
            "giathamkhao": float(crow[4] or 0),
            "dacdiem": crow[5] or "Cây sinh trưởng tốt, lá mướt khỏe.",
            "huongdanchamsoc": crow[6] or "Ánh sáng tán xạ, tưới 1-2 lần/tuần.",
            "anhsang": crow[7] or "Ánh sáng tán xạ gián tiếp 55% - 70%",
            "doam": crow[8] or "Trung bình (60% - 75%)",
            "nhietdo": crow[9] or "18°C - 30°C",
            "doctinh": crow[10] or "An toàn khi ngắm, tránh để thú cưng cắn lá",
            "phongthuy": crow[11] or "Hợp mệnh Mộc, Hỏa; đem lại sinh khí và may mắn",
            "urlanh": f"/plants/{crow[0]}.jpg"
        }
    else:
        thong_tin_chi_tiet = {
            "maloaicay": top1_ma_loai,
            "tenkhoahoc": top1_en,
            "tenthuonggoi": top1_vi,
            "xuatxu": "Nhiệt đới",
            "giathamkhao": 150000.0,
            "dacdiem": "Cây sinh trưởng tốt, lá mướt khỏe.",
            "huongdanchamsoc": "Ánh sáng tán xạ, tưới 1-2 lần/tuần.",
            "anhsang": "Ánh sáng tán xạ gián tiếp 60% - 70%",
            "doam": "Trung bình 65% - 75%",
            "nhietdo": "18°C - 30°C",
            "doctinh": "Tránh để thú cưng cắn lá",
            "phongthuy": "Đem lại sinh khí tươi mát cho không gian sống",
            "urlanh": f"/plants/{top1_ma_loai}.jpg"
        }

    # Lấy các chậu cây liên quan thuộc loài này (hoặc loài có hình thái gần nhất nếu là Lớp Khác)
    cursor.execute("""
        SELECT TOP 4 sp.MASANPHAM, sp.TENSANPHAM, sp.SOLUONGTONKHO, sp.KICHTHUOCCAY,
               (SELECT TOP 1 URLANH FROM HINH_ANH_SAN_PHAM ha WHERE ha.MASANPHAM = sp.MASANPHAM ORDER BY LAANHCHINH DESC) AS URLANH,
               ISNULL((SELECT TOP 1 GIABAN FROM LICH_SU_GIA_SAN_PHAM lsg WHERE lsg.MASANPHAM = sp.MASANPHAM ORDER BY MALICHSUGIA DESC), lc.GIATHAMKHAO) AS GIABAN
        FROM SAN_PHAM sp
        JOIN LOAI_CAY lc ON sp.MALOAICAY = lc.MALOAICAY
        WHERE sp.MALOAICAY = ?
    """, (top1_ma_loai,))
    sp_rows = cursor.fetchall()
    san_pham_lien_quan = []
    for sp in sp_rows:
        san_pham_lien_quan.append({
            "id": sp[0],
            "name": sp[1],
            "stock": sp[2],
            "size": sp[3],
            "image": sp[4] or f"/plants/{top1_ma_loai}.jpg",
            "price": float(sp[5] or 0)
        })

    conn.commit()
    conn.close()

    return {
        "loai_du_doan": "Lớp khác (Chưa có trong kho dữ liệu)" if is_unknown_species else top1_vi,
        "loai_goc": "Out-of-Dataset / Unregistered Flora (Class #91)" if is_unknown_species else top1_en,
        "ma_loai_cay": UNKNOWN_CLASS_ID if is_unknown_species else top1_ma_loai,
        "do_chinh_xac": top1_prob,
        "do_phan_tan_entropy": round(norm_entropy, 3),
        "la_loai_khac": is_unknown_species,
        "nguong_tin_cay": CONFIDENCE_THRESHOLD,
        "loai_gan_nhat": top1_vi,
        "loai_goc_gan_nhat": top1_en,
        "ma_loai_gan_nhat": top1_ma_loai,
        "ly_do_loai_khac": (
            f"Độ khớp cao nhất với 90 loài trong kho chỉ đạt {top1_prob * 100:.1f}% (< ngưỡng {CONFIDENCE_THRESHOLD * 100:.0f}%, "
            f"độ phân tán Entropy = {norm_entropy:.2f}). Hệ thống đã tự động xếp ảnh này vào Lớp #91: 'Lớp khác (Chưa có trong kho dữ liệu)'."
        ) if is_unknown_species else None,
        "thong_tin_chi_tiet": thong_tin_chi_tiet,
        "top_k": top_k_results,
        "san_pham_lien_quan": san_pham_lien_quan,
        "matimkiem": ma_tim_kiem,
        "hinhanhurl": f"/uploads/{filename}",
        "MaTimKiem": ma_tim_kiem,
        "HinhAnhUrl": f"/uploads/{filename}",
        "KetQua": ket_qua_tra_ve
    }

# =====================================================================
# 2B. NHẬN DIỆN ĐA CÂY TRÊN 1 KHUNG HÌNH (MULTI-PLANT DETECTION & NMS)
# Tách vùng đa tín hiệu: Signal A (YOLOv8n) + Signal B (OpenCV HSV/LAB Foliage)
# + Signal C (Fallback multi-scale windows khi <2 vùng lá), sau đó suy luận Ensemble 4 model
# =====================================================================
def _calc_box_iou(b1, b2) -> float:
    x1 = max(b1[0], b2[0])
    y1 = max(b1[1], b2[1])
    x2 = min(b1[2], b2[2])
    y2 = min(b1[3], b2[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    area1 = max(1, b1[2] - b1[0]) * max(1, b1[3] - b1[1])
    area2 = max(1, b2[2] - b2[0]) * max(1, b2[3] - b2[1])
    union = area1 + area2 - inter
    return inter / max(union, 1e-6)


def _calc_box_containment(inner, outer) -> float:
    x1 = max(inner[0], outer[0])
    y1 = max(inner[1], outer[1])
    x2 = min(inner[2], outer[2])
    y2 = min(inner[3], outer[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    area_inner = max(1, inner[2] - inner[0]) * max(1, inner[3] - inner[1])
    return inter / area_inner


def _pad_clamp_box(x1: int, y1: int, x2: int, y2: int, w: int, h: int, pad_ratio: float = 0.06):
    bw = max(1, x2 - x1)
    bh = max(1, y2 - y1)
    px = int(bw * pad_ratio)
    py = int(bh * pad_ratio)
    nx1 = max(0, x1 - px)
    ny1 = max(0, y1 - py)
    nx2 = min(w, x2 + px)
    ny2 = min(h, y2 + py)
    if nx2 <= nx1 + 4 or ny2 <= ny1 + 4:
        return None
    return (int(nx1), int(ny1), int(nx2), int(ny2))


def _crop_veg_score(orig_im: Image.Image, box) -> float:
    crop = orig_im.crop(box).resize((128, 128), Image.Resampling.BILINEAR)
    return vegetation_score(np.array(crop, dtype=np.float32))


def propose_plant_regions(orig_im: Image.Image) -> List[Dict[str, Any]]:
    """
    Tách vùng thực vật đa tín hiệu trên ảnh gốc RGB:
    - Signal A: YOLOv8n (COCO 58=potted plant, 75=vase mở rộng lên trên, hoặc box có mật độ lá cao)
    - Signal B: Phân đoạn vùng lá OpenCV (HSV + LAB cho lá xanh, lá đốm vàng, lá đỏ/tím) + hình thái học + contours
    - Signal C: Cửa sổ đa tỷ lệ dự phòng (chỉ kích hoạt khi Signal A + B < 2 vùng tách biệt)
    Trả về danh sách ứng viên đã khử trùng lặp IoU trước khi chạy Ensemble 4 model.
    """
    w, h = orig_im.size
    img_area = max(1, w * h)
    proposals: List[Dict[str, Any]] = []

    # --- Signal A: YOLOv8n ---
    detector = get_yolo_detector()
    if detector is not None:
        try:
            yolo_results = detector.predict(orig_im, conf=0.20, iou=0.50, verbose=False)
            for res in yolo_results:
                if res.boxes is None:
                    continue
                for b in res.boxes:
                    cls_id = int(b.cls[0].item())
                    conf = float(b.conf[0].item())
                    x1, y1, x2, y2 = [int(round(v)) for v in b.xyxy[0].tolist()]
                    bw = max(1, x2 - x1)
                    bh = max(1, y2 - y1)

                    if cls_id == 58:  # potted plant
                        box = _pad_clamp_box(x1, y1, x2, y2, w, h, pad_ratio=0.05)
                        if box and _crop_veg_score(orig_im, box) >= 0.06:
                            proposals.append({"box": box, "source": "yolo_potted_plant", "priority": 3, "score": conf})
                    elif cls_id == 75:  # vase -> mở rộng lên trên để lấy tán lá/hoa
                        exp_y1 = max(0, int(y1 - bh * 0.90))
                        exp_x1 = max(0, int(x1 - bw * 0.28))
                        exp_x2 = min(w, int(x2 + bw * 0.28))
                        box = _pad_clamp_box(exp_x1, exp_y1, exp_x2, y2, w, h, pad_ratio=0.04)
                        if box and _crop_veg_score(orig_im, box) >= 0.08:
                            proposals.append({"box": box, "source": "yolo_vase_expanded", "priority": 2, "score": conf * 0.9})
                    else:
                        area_ratio = (bw * bh) / img_area
                        if 0.03 <= area_ratio <= 0.85:
                            box = _pad_clamp_box(x1, y1, x2, y2, w, h, pad_ratio=0.04)
                            if box and _crop_veg_score(orig_im, box) >= 0.25:
                                proposals.append({"box": box, "source": f"yolo_cls_{cls_id}", "priority": 1, "score": conf * 0.8})
        except Exception as e:
            print(f"[AI] YOLOv8n inference warning: {e}")

    # --- Signal B: OpenCV HSV/LAB Foliage Segmentation ---
    if cv2 is not None:
        try:
            max_side = 640.0
            scale = min(1.0, max_side / max(w, h))
            ww = max(32, int(round(w * scale)))
            wh = max(32, int(round(h * scale)))
            rgb_small = np.array(orig_im.resize((ww, wh), Image.Resampling.BILINEAR), dtype=np.uint8)
            hsv = cv2.cvtColor(rgb_small, cv2.COLOR_RGB2HSV)
            lab = cv2.cvtColor(rgb_small, cv2.COLOR_RGB2LAB)

            h_ch, s_ch, v_ch = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
            a_ch = lab[:, :, 1]

            # Lá xanh, xanh vàng, lá non
            green_mask = (h_ch >= 22) & (h_ch <= 95) & (s_ch >= 32) & (v_ch >= 28)

            # Excess Green & kênh a* của LAB (nhạy với lá đốm trắng/vàng/xanh nhạt)
            r_f = rgb_small[:, :, 0].astype(np.float32)
            g_f = rgb_small[:, :, 1].astype(np.float32)
            b_f = rgb_small[:, :, 2].astype(np.float32)
            exg_mask = ((2.0 * g_f - r_f - b_f) > 16.0) & (s_ch >= 22) & (v_ch >= 30)
            lab_green_mask = (a_ch < 120) & (s_ch >= 24) & (v_ch >= 30)

            # Lá đỏ, hồng, tím (Hồng môn, Đuôi công tím, Huyết dụ, Thu hải đường...)
            red_purple_mask = (
                ((h_ch <= 12) | (h_ch >= 152))
                & (s_ch >= 52)
                & (v_ch >= 35)
                & (a_ch > 140)
            )

            foliage_mask = (green_mask | exg_mask | lab_green_mask | red_purple_mask).astype(np.uint8) * 255

            k_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            k_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
            cleaned = cv2.morphologyEx(foliage_mask, cv2.MORPH_OPEN, k_open)
            cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, k_close)

            contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            work_area = max(1, ww * wh)
            inv_x = w / float(ww)
            inv_y = h / float(wh)

            for cnt in contours:
                c_area = cv2.contourArea(cnt)
                if c_area < 0.015 * work_area:
                    continue
                cx, cy, cw, ch_box = cv2.boundingRect(cnt)
                if cw < 0.06 * ww or ch_box < 0.06 * wh:
                    continue
                ox1 = int(round(cx * inv_x))
                oy1 = int(round(cy * inv_y))
                ox2 = int(round((cx + cw) * inv_x))
                oy2 = int(round((cy + ch_box) * inv_y))
                box = _pad_clamp_box(ox1, oy1, ox2, oy2, w, h, pad_ratio=0.08)
                if box and _crop_veg_score(orig_im, box) >= 0.14:
                    area_norm = min(1.0, (c_area / work_area) * 4.0)
                    proposals.append({
                        "box": box,
                        "source": "opencv_foliage",
                        "priority": 2,
                        "score": 0.55 + 0.35 * area_norm
                    })
        except Exception as e:
            print(f"[AI] OpenCV foliage segmentation warning: {e}")

    # Khử trùng lặp sơ bộ theo IoU trước khi kiểm tra ngưỡng Signal C
    def _dedup_boxes(cands: List[Dict[str, Any]], iou_thresh: float = 0.72) -> List[Dict[str, Any]]:
        ordered = sorted(cands, key=lambda x: (x["priority"], x["score"]), reverse=True)
        unique: List[Dict[str, Any]] = []
        for c in ordered:
            if any(_calc_box_iou(c["box"], u["box"]) > iou_thresh for u in unique):
                continue
            unique.append(c)
        return unique

    unique_ab = _dedup_boxes(proposals, iou_thresh=0.72)

    # --- Signal C: Fallback multi-scale windows (chỉ chạy khi < 2 vùng lá tách biệt) ---
    if len(unique_ab) < 2:
        fx, fy = find_foliage_centroid(orig_im)
        fcx, fcy = int(fx * w), int(fy * h)
        m_side = int(min(w, h) * 0.62)
        fx1 = max(0, min(w - m_side, fcx - m_side // 2))
        fy1 = max(0, min(h - m_side, fcy - m_side // 2))

        fallback_boxes = [
            (fx1, fy1, fx1 + m_side, fy1 + m_side),
            (int(w * 0.10), int(h * 0.10), int(w * 0.90), int(h * 0.90)),
            (0, 0, int(w * 0.55), h),
            (int(w * 0.45), 0, w, h),
            (0, 0, int(w * 0.65), int(h * 0.65)),
            (int(w * 0.35), 0, w, int(h * 0.65)),
            (0, int(h * 0.35), int(w * 0.65), h),
            (int(w * 0.35), int(h * 0.35), w, h),
        ]
        for fb in fallback_boxes:
            box = _pad_clamp_box(fb[0], fb[1], fb[2], fb[3], w, h, pad_ratio=0.0)
            if box and _crop_veg_score(orig_im, box) >= 0.18:
                proposals.append({"box": box, "source": "fallback_window", "priority": 0, "score": 0.40})

        unique_ab = _dedup_boxes(proposals, iou_thresh=0.72)

    # Nếu ảnh quá ít sắc xanh (nền đặc biệt), đảm bảo luôn có ít nhất vùng tâm lá
    if not unique_ab:
        fx, fy = find_foliage_centroid(orig_im)
        fcx, fcy = int(fx * w), int(fy * h)
        m_side = max(16, int(min(w, h) * 0.70))
        fx1 = max(0, min(w - m_side, fcx - m_side // 2))
        fy1 = max(0, min(h - m_side, fcy - m_side // 2))
        unique_ab = [{
            "box": (fx1, fy1, min(w, fx1 + m_side), min(h, fy1 + m_side)),
            "source": "fallback_centroid",
            "priority": 0,
            "score": 0.30
        }]

    return unique_ab[:16]


def classify_multi_plant_regions(orig_im: Image.Image, max_plants: int = 6) -> List[Dict[str, Any]]:
    """
    Chạy pipeline tách vùng đa tín hiệu + Ensemble 4 model ([0, 255], RGB, BILINEAR)
    + PRIOR_CALIB + lọc confidence/entropy + Smart NMS/gộp loài trùng lặp.
    """
    if model is None and not ensemble_models:
        raise RuntimeError("Model AI chưa được tải")

    w, h = orig_im.size
    img_area = max(1, w * h)
    proposals = propose_plant_regions(orig_im)
    patches = [p["box"] for p in proposals]

    patch_arrays = [
        np.array(orig_im.crop(b).resize((224, 224), Image.Resampling.BILINEAR), dtype=np.float32)
        for b in patches
    ]
    patch_batch = np.stack(patch_arrays, axis=0)

    if ensemble_models:
        combined_batch = np.zeros((len(patches), 90), dtype=np.float32)
        tot_w = 0.0
        for ens_m, ens_w, _ in ensemble_models:
            combined_batch += ens_w * ens_m(patch_batch, training=False).numpy()
            tot_w += ens_w
        raw_batch_preds = combined_batch / max(tot_w, 1e-6)
    else:
        raw_batch_preds = model(patch_batch, training=False).numpy()

    def get_patch_prediction(idx_patch: int):
        preds = calibrate_predictions(raw_batch_preds[idx_patch])
        top_i = int(np.argmax(preds))
        conf_val = float(preds[top_i])
        clipped = np.clip(preds, 1e-12, 1.0)
        ent = float(-np.sum(clipped * np.log(clipped)) / np.log(len(preds)))
        return top_i, conf_val, ent

    all_evaluated = []
    raw_candidates = []
    for idx_patch, prop in enumerate(proposals):
        box = prop["box"]
        top_i, conf_val, ent = get_patch_prediction(idx_patch)
        mapped_info = class_mapping.get(top_i, {})
        area_ratio = ((box[2] - box[0]) * (box[3] - box[1])) / img_area
        item = {
            "box": box,
            "class_id": top_i,
            "ma_loai_cay": mapped_info.get("MaLoaiCay", top_i + 1),
            "ten_vn": mapped_info.get("vietnamese_name", f"Loài cây #{top_i + 1}"),
            "ten_khoa_hoc": mapped_info.get("original_label", f"Class #{top_i}"),
            "conf": conf_val,
            "entropy": ent,
            "area_ratio": area_ratio,
            "source": prop["source"]
        }
        all_evaluated.append(item)
        if conf_val >= 0.30 and ent <= 0.82:
            raw_candidates.append(item)

    # Smart NMS & Merging: gộp box chồng lấn cùng loài, giữ các loài khác biệt
    raw_candidates.sort(key=lambda x: (x["conf"], x["area_ratio"]), reverse=True)
    kept_plants: List[Dict[str, Any]] = []

    for cand in raw_candidates:
        merged_or_suppressed = False
        for k in kept_plants:
            ov = _calc_box_iou(cand["box"], k["box"])
            cont_cand = _calc_box_containment(cand["box"], k["box"])
            cont_k = _calc_box_containment(k["box"], cand["box"])

            if cand["class_id"] == k["class_id"]:
                if ov > 0.30 or max(cont_cand, cont_k) > 0.55:
                    # Gộp box cùng loài nếu cả hai có độ tin cậy tốt
                    if ov > 0.30 and cand["conf"] >= 0.40 and k["conf"] >= 0.40:
                        k["box"] = (
                            min(k["box"][0], cand["box"][0]),
                            min(k["box"][1], cand["box"][1]),
                            max(k["box"][2], cand["box"][2]),
                            max(k["box"][3], cand["box"][3]),
                        )
                        k["area_ratio"] = ((k["box"][2] - k["box"][0]) * (k["box"][3] - k["box"][1])) / img_area
                    if cand["conf"] > k["conf"]:
                        k["conf"] = cand["conf"]
                        k["entropy"] = cand["entropy"]
                    merged_or_suppressed = True
                    break
            else:
                if ov > 0.68:
                    merged_or_suppressed = True
                    break

        if not merged_or_suppressed:
            kept_plants.append(cand)

    # Sắp xếp danh sách cuối theo độ tin cậy và diện tích vùng cây
    kept_plants.sort(
        key=lambda x: (x["conf"] * 0.8 + min(1.0, x["area_ratio"] * 2.0) * 0.2),
        reverse=True
    )
    kept_plants = kept_plants[:max_plants]

    # Fallback nếu không có ứng viên nào đạt ngưỡng
    if not kept_plants and all_evaluated:
        best_fallback = max(all_evaluated, key=lambda x: x["conf"])
        kept_plants.append(best_fallback)

    return kept_plants


@app.post("/nhan-dien-da-cay")
@app.post("/api/nhan-dien-da-cay")
async def nhan_dien_da_cay(
    file: UploadFile = File(...),
    user_id: Optional[int] = None,
    ma_nguoi_dung: Optional[int] = Form(None)
):
    if model is None:
        raise HTTPException(status_code=500, detail="Model AI chưa được tải")

    user_id_val = user_id or ma_nguoi_dung
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    ts = int(datetime.now().timestamp() * 1000)
    raw_filename = f"multi_raw_{ts}{ext}"
    raw_filepath = os.path.join(UPLOAD_DIR, raw_filename)

    with open(raw_filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        orig_im = Image.open(raw_filepath)
        orig_im = normalize_pil_rgb(orig_im)
        w, h = orig_im.size
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Không thể đọc file ảnh: {e}")

    kept_plants = classify_multi_plant_regions(orig_im, max_plants=6)

    # Vẽ bounding boxes trực quan chuẩn ảnh cô giáo
    annotated_im = orig_im.copy()
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(annotated_im)
    colors = ["#00FF66", "#00E5FF", "#FFB300", "#FF3D00", "#D500F9", "#76FF03"]

    try:
        font = ImageFont.truetype("arial.ttf", max(24, int(w * 0.022)))
    except Exception:
        font = ImageFont.load_default()

    conn = get_db_connection()
    cursor = conn.cursor()

    # Lưu lịch sử tìm kiếm vào TIM_ANH
    cursor.execute("SELECT ISNULL(MAX(MATIMKIEM), 0) + 1 FROM TIM_ANH")
    ma_tim_kiem = cursor.fetchone()[0]
    cursor.execute("""
        INSERT INTO TIM_ANH (MATIMKIEM, MANGUOIDUNG, HINHANHURL, THOIGIAN, NENTANG, PHIENBANMODEL, TRANGTHAINHANDIEN)
        VALUES (?, ?, ?, GETDATE(), N'Web', N'v2.0-MultiPlant', N'Đa cây thành công')
    """, (ma_tim_kiem, user_id_val, f"/uploads/{raw_filename}"))

    danh_sach_cay = []
    for i, p in enumerate(kept_plants):
        c = colors[i % len(colors)]
        box = p["box"]
        draw.rectangle(box, outline=c, width=max(4, int(w * 0.005)))
        label_text = f"{p['ten_vn']} {p['conf']*100:.1f}%"
        text_w = int(len(label_text) * max(14, int(w * 0.013)))
        text_h = max(36, int(w * 0.028))
        draw.rectangle((box[0], box[1], box[0] + text_w, box[1] + text_h), fill="#000000")
        draw.text((box[0] + 8, box[1] + 6), label_text, fill=c, font=font)

        # Lấy thông tin loài & sản phẩm liên quan từ CSDL
        cursor.execute("""
            SELECT MALOAICAY, TENKHOAHOC, TENTHUONGGOI, XUATXU, GIATHAMKHAO, DACDIEMNHANDANG, HUONGDANCHAMSOC,
                   ANHSANG, DOAM, NHIETDO, DOCTINH, PHONGTHUY
            FROM LOAI_CAY WHERE MALOAICAY = ?
        """, (p["ma_loai_cay"],))
        crow = cursor.fetchone()

        thong_tin = {
            "maloaicay": p["ma_loai_cay"],
            "tenkhoahoc": crow[1] if crow else p["ten_khoa_hoc"],
            "tenthuonggoi": crow[2] if crow else p["ten_vn"],
            "xuatxu": crow[3] if crow else "Nhiệt đới",
            "giathamkhao": float(crow[4] or 0) if crow else 150000.0,
            "dacdiem": crow[5] if crow else "Cây sinh trưởng tốt ngoài tự nhiên và chậu kiểng.",
            "huongdanchamsoc": crow[6] if crow else "Ánh sáng tán xạ 60-70%, tưới khi mặt đất se khô.",
            "anhsang": crow[7] if crow else "Ánh sáng tán xạ gián tiếp",
            "doam": crow[8] if crow else "60% - 75%",
            "nhietdo": crow[9] if crow else "18°C - 32°C",
            "doctinh": crow[10] if crow else "An toàn khi ngắm, tránh để thú cưng cắn lá",
            "phongthuy": crow[11] if crow else "Mang lại sinh khí may mắn và hài hòa tự nhiên",
            "urlanh": f"/plants/{p['ma_loai_cay']}.jpg"
        }

        # Lưu vào KET_QUA_NHAN_DIEN
        cursor.execute("SELECT ISNULL(MAX(MAKETQUA), 0) + 1 FROM KET_QUA_NHAN_DIEN")
        ma_kq = cursor.fetchone()[0]
        cursor.execute("""
            INSERT INTO KET_QUA_NHAN_DIEN (MALOAICAY, MATIMKIEM, MAKETQUA, THUHANG, XACSUATCHINHXAC)
            VALUES (?, ?, ?, ?, ?)
        """, (p["ma_loai_cay"], ma_tim_kiem, ma_kq, i + 1, round(p["conf"] * 100, 2)))

        # Sản phẩm liên quan
        cursor.execute("""
            SELECT TOP 3 sp.MASANPHAM, sp.TENSANPHAM, sp.SOLUONGTONKHO, sp.KICHTHUOCCAY,
                   (SELECT TOP 1 URLANH FROM HINH_ANH_SAN_PHAM ha WHERE ha.MASANPHAM = sp.MASANPHAM ORDER BY LAANHCHINH DESC) AS URLANH,
                   ISNULL((SELECT TOP 1 GIABAN FROM LICH_SU_GIA_SAN_PHAM lsg WHERE lsg.MASANPHAM = sp.MASANPHAM ORDER BY MALICHSUGIA DESC), lc.GIATHAMKHAO) AS GIABAN
            FROM SAN_PHAM sp
            JOIN LOAI_CAY lc ON sp.MALOAICAY = lc.MALOAICAY
            WHERE sp.MALOAICAY = ?
        """, (p["ma_loai_cay"],))
        rel_products = []
        for sp in cursor.fetchall():
            rel_products.append({
                "id": sp[0],
                "name": sp[1],
                "stock": sp[2],
                "size": sp[3],
                "image": sp[4] or f"/plants/{p['ma_loai_cay']}.jpg",
                "price": float(sp[5] or 0)
            })

        crop_filename = f"multi_crop_{ts}_{i + 1}.jpg"
        crop_filepath = os.path.join(UPLOAD_DIR, crop_filename)
        try:
            orig_im.crop(box).save(crop_filepath, quality=88)
            crop_url = f"/uploads/{crop_filename}"
        except Exception:
            crop_url = f"/uploads/{raw_filename}"

        danh_sach_cay.append({
            "stt": i + 1,
            "maloaicay": p["ma_loai_cay"],
            "tenthuonggoi": p["ten_vn"],
            "tenkhoahoc": p["ten_khoa_hoc"],
            "do_chinh_xac": round(p["conf"] * 100, 1),
            "mau_sac": c,
            "crop_image": crop_url,
            "box_px": list(box),
            "box_normalized": [
                round(box[1] / h, 4), # ymin
                round(box[0] / w, 4), # xmin
                round(box[3] / h, 4), # ymax
                round(box[2] / w, 4)  # xmax
            ],
            "thong_tin_chi_tiet": thong_tin,
            "san_pham_lien_quan": rel_products
        })

    conn.commit()
    conn.close()

    annotated_filename = f"multi_annotated_{ts}.jpg"
    annotated_filepath = os.path.join(UPLOAD_DIR, annotated_filename)
    annotated_im.save(annotated_filepath, quality=90)

    return {
        "thanh_cong": True,
        "tong_so_cay": len(danh_sach_cay),
        "matimkiem": ma_tim_kiem,
        "anh_goc_url": f"/uploads/{raw_filename}",
        "anh_ve_box_url": f"/uploads/{annotated_filename}",
        "danh_sach_cay": danh_sach_cay
    }

@app.get("/api/gio-hang/{ma_nguoi_dung}")
def get_gio_hang(ma_nguoi_dung: int):
    gio = query_db(
        "SELECT * FROM GIO_HANG WHERE MANGUOIDUNG = ? AND TRANGTHAIGIOHANG = N'Đang chọn hàng'",
        (ma_nguoi_dung,), fetch_one=True
    )
    if not gio:
        return {"MaGioHang": None, "DanhSachSanPham": [], "TamTinh": 0}

    items = query_db("""
        SELECT ct.*, sp.TENSANPHAM, sp.KICHTHUOCCAY,
               (SELECT TOP 1 URLANH FROM HINH_ANH_SAN_PHAM ha WHERE ha.MASANPHAM = sp.MASANPHAM) AS URLANH
        FROM CHI_TIET_GIO_HANG ct
        JOIN SAN_PHAM sp ON ct.MASANPHAM = sp.MASANPHAM
        WHERE ct.MAGIOHANG = ?
    """, (gio["MaGioHang"],))
    
    tam_tinh = sum(float(i["SoLuongChon"]) * float(i["DonGiaBan"]) for i in items)
    return {"MaGioHang": gio["MaGioHang"], "DanhSachSanPham": items, "TamTinh": tam_tinh}

@app.post("/api/gio-hang/them")
def them_vao_gio(req: AddToCartRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT MAGIOHANG FROM GIO_HANG WHERE MANGUOIDUNG = ? AND TRANGTHAIGIOHANG = N'Đang chọn hàng'",
        (req.MaNguoiDung,)
    )
    row = cursor.fetchone()
    if row:
        ma_gio_hang = row[0]
    else:
        cursor.execute("SELECT ISNULL(MAX(MAGIOHANG), 0) + 1 FROM GIO_HANG")
        ma_gio_hang = cursor.fetchone()[0]
        cursor.execute("""
            INSERT INTO GIO_HANG (MAGIOHANG, MANGUOIDUNG, NGAYCAPNHAT, NGAYTAO, TRANGTHAIGIOHANG)
            VALUES (?, ?, GETDATE(), CONVERT(NVARCHAR(50), GETDATE(), 120), N'Đang chọn hàng')
        """, (ma_gio_hang, req.MaNguoiDung))

    cursor.execute("""
        SELECT ISNULL(
            (SELECT TOP 1 GIABAN FROM LICH_SU_GIA_SAN_PHAM WHERE MASANPHAM = ? ORDER BY MALICHSUGIA DESC),
            (SELECT GIATHAMKHAO FROM LOAI_CAY lc JOIN SAN_PHAM sp ON lc.MALOAICAY = sp.MALOAICAY WHERE sp.MASANPHAM = ?)
        )
    """, (req.MaSanPham, req.MaSanPham))
    don_gia = cursor.fetchone()[0] or 150000

    cursor.execute(
        "SELECT MACHITIETGIOHANG FROM CHI_TIET_GIO_HANG WHERE MAGIOHANG = ? AND MASANPHAM = ?",
        (ma_gio_hang, req.MaSanPham)
    )
    existing = cursor.fetchone()
    if existing:
        cursor.execute("""
            UPDATE CHI_TIET_GIO_HANG 
            SET SOLUONGCHON = SOLUONGCHON + ?, DONGIABAN = ?
            WHERE MAGIOHANG = ? AND MASANPHAM = ? AND MACHITIETGIOHANG = ?
        """, (req.SoLuongChon, don_gia, ma_gio_hang, req.MaSanPham, existing[0]))
    else:
        cursor.execute("SELECT ISNULL(MAX(MACHITIETGIOHANG), 0) + 1 FROM CHI_TIET_GIO_HANG")
        ma_ct = cursor.fetchone()[0]
        cursor.execute("""
            INSERT INTO CHI_TIET_GIO_HANG (MAGIOHANG, MASANPHAM, MACHITIETGIOHANG, SOLUONGCHON, DONGIABAN)
            VALUES (?, ?, ?, ?, ?)
        """, (ma_gio_hang, req.MaSanPham, ma_ct, req.SoLuongChon, don_gia))

    conn.commit()
    conn.close()
    return {"message": "Đã thêm vào giỏ hàng", "MaGioHang": ma_gio_hang}

@app.post("/api/dat-hang")
def dat_hang(req: CheckoutRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT MAGIOHANG FROM GIO_HANG WHERE MANGUOIDUNG = ? AND TRANGTHAIGIOHANG = N'Đang chọn hàng'",
        (req.MaNguoiDung,)
    )
    gio = cursor.fetchone()
    if not gio:
        conn.close()
        raise HTTPException(status_code=400, detail="Giỏ hàng trống!")
    ma_gio_hang = gio[0]

    cursor.execute("SELECT SUM(SOLUONGCHON * DONGIABAN) FROM CHI_TIET_GIO_HANG WHERE MAGIOHANG = ?", (ma_gio_hang,))
    tam_tinh = float(cursor.fetchone()[0] or 0)
    phi_van_chuyen = 30000.0
    tong_tien = tam_tinh + phi_van_chuyen

    cursor.execute("SELECT ISNULL(MAX(MADONHANG), 0) + 1 FROM DON_HANG")
    ma_don_hang = cursor.fetchone()[0]

    cursor.execute("""
        INSERT INTO DON_HANG (
            MADONHANG, MACHUONGTRINHGIAMGIA, MANGUOIDUNG, MAGIOHANG,
            NGAYDATHANG, TAMTINH, SOTIENGIAM, PHIVANCHUYEN, TONGTIEN,
            DIACHINHANHANG, SDTNHANHANG, PHUONGTHUCTHANHTOAN, TRANGTHAITHANHTOAN, TRANGTHAIDONHANG
        ) VALUES (?, ?, ?, ?, GETDATE(), ?, 0, ?, ?, ?, ?, ?, N'Chưa thanh toán', N'Chờ xử lý')
    """, (
        ma_don_hang, req.MaChuongTrinhGiamGia, req.MaNguoiDung, ma_gio_hang,
        tam_tinh, phi_van_chuyen, tong_tien,
        req.DiaChiNhanHang, req.SDTNhanHang, req.PhuongThucThanhToan
    ))

    cursor.execute("UPDATE GIO_HANG SET TRANGTHAIGIOHANG = N'Đã đặt hàng', NGAYCAPNHAT = GETDATE() WHERE MAGIOHANG = ?", (ma_gio_hang,))
    conn.commit()
    conn.close()
    return {"message": "Đặt hàng thành công!", "MaDonHang": ma_don_hang, "TongTien": tong_tien}

# =====================================================================
# 4. CÁC API DÀNH RIÊNG CHO QUẢN TRỊ VIÊN (ADMIN DASHBOARD)
# =====================================================================
class UpdateProductRequest(BaseModel):
    TenSanPham: Optional[str] = None
    GiaBan: Optional[float] = None
    SoLuongTonKho: Optional[int] = None
    KichThuocCay: Optional[str] = None
    TinhTrangCay: Optional[str] = None
    UrlAnh: Optional[str] = None
    NgayNhap: Optional[str] = None
    DanhSachAnh: Optional[List[Dict[str, Any]]] = None

class CreateProductRequest(BaseModel):
    MaLoaiCay: int
    TenSanPham: str
    GiaBan: float
    SoLuongTonKho: int = 10
    KichThuocCay: Optional[str] = "Chậu tiêu chuẩn Ø16cm"
    TinhTrangCay: Optional[str] = "Cây khỏe mạnh, rễ ổn định"
    UrlAnh: Optional[str] = None
    NgayNhap: Optional[str] = None
    DanhSachAnh: Optional[List[Dict[str, Any]]] = None

class CreateSpeciesRequest(BaseModel):
    TenThuongGoi: str
    TenKhoaHoc: str
    MaDanhMuc: Optional[int] = 1
    GiaThamKhao: Optional[float] = 180000
    HuongDanChamSoc: Optional[str] = "Tưới nước 2-3 lần/tuần, ánh sáng tán xạ"
    DacDiemNhanDang: Optional[str] = "Lá đẹp khỏe mạnh, phát triển tốt"
    XuatXu: Optional[str] = "Nhiệt đới"
    AnhSang: Optional[str] = "Tán xạ 60-70%"
    DoAm: Optional[str] = "60-80%"
    NhietDo: Optional[str] = "20-30°C"
    DocTinh: Optional[str] = "An toàn hoặc để xa tầm tay trẻ"
    PhongThuy: Optional[str] = "Hút tài lộc, thanh lọc không gian"
    UrlAnh: Optional[str] = None

class UpdateOrderStatusRequest(BaseModel):
    TrangThaiDonHang: str

@app.get("/api/admin/thong-ke")
def get_admin_thong_ke():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Tổng doanh thu
    cursor.execute("SELECT ISNULL(SUM(TONGTIEN), 0) FROM DON_HANG WHERE TRANGTHAIDONHANG != N'Đã hủy'")
    tong_doanh_thu = float(cursor.fetchone()[0] or 0)

    # 2. Tổng đơn hàng
    cursor.execute("SELECT COUNT(*) FROM DON_HANG")
    tong_don_hang = int(cursor.fetchone()[0] or 0)

    # 3. Tổng số chậu cây và tồn kho
    cursor.execute("SELECT COUNT(*), ISNULL(SUM(SOLUONGTONKHO), 0) FROM SAN_PHAM")
    sp_row = cursor.fetchone()
    so_san_pham = int(sp_row[0] or 0)
    tong_ton_kho = int(sp_row[1] or 0)

    # 4. Tổng lượt tìm kiếm ảnh AI
    cursor.execute("SELECT COUNT(*) FROM TIM_ANH")
    tong_luot_quet = int(cursor.fetchone()[0] or 0)

    # 5. Đơn hàng gần đây
    cursor.execute("""
        SELECT TOP 5 dh.MADONHANG, dh.NGAYDATHANG, dh.TONGTIEN, dh.TRANGTHAIDONHANG,
                     dh.DIACHINHANHANG, dh.SDTNHANHANG, ISNULL(nd.HOTEN, nd.TAIKHOAN) AS KHACHHANG
        FROM DON_HANG dh
        LEFT JOIN NGUOI_DUNG nd ON dh.MANGUOIDUNG = nd.MANGUOIDUNG
        ORDER BY dh.MADONHANG DESC
    """)
    recent_orders = [
        {
            "MaDonHang": r[0],
            "NgayDatHang": str(r[1])[:19] if r[1] else "",
            "TongTien": float(r[2] or 0),
            "TrangThai": r[3],
            "DiaChi": r[4],
            "SDT": r[5],
            "KhachHang": r[6] or "Khách mua lẻ"
        }
        for r in cursor.fetchall()
    ]

    # 6. Nhật ký quét AI gần đây
    cursor.execute("""
        SELECT TOP 6 ta.MATIMKIEM, ta.THOIGIAN, ta.HINHANHURL,
                     lc.TENTHUONGGOI, kq.XACSUATCHINHXAC, lc.MALOAICAY, ta.TRANGTHAINHANDIEN
        FROM TIM_ANH ta
        LEFT JOIN KET_QUA_NHAN_DIEN kq ON ta.MATIMKIEM = kq.MATIMKIEM AND kq.THUHANG = 1
        LEFT JOIN LOAI_CAY lc ON kq.MALOAICAY = lc.MALOAICAY
        ORDER BY ta.MATIMKIEM DESC
    """)
    recent_scans = [
        {
            "MaTimKiem": r[0],
            "ThoiGian": str(r[1])[:19] if r[1] else "",
            "HinhAnh": r[2],
            "LoaiDuDoan": r[3] or "Cây kiểng lá",
            "DoChinhXac": float(r[4] or 90.0),
            "MaLoaiCay": r[5] or 1,
            "TrangThaiNhanDien": r[6] or "Thành công",
            "LaLoaiKhac": (r[5] == 91) or ("lớp khác" in str(r[6] or "").lower())
        }
        for r in cursor.fetchall()
    ]

    conn.close()
    return {
        "tong_doanh_thu": tong_doanh_thu,
        "tong_don_hang": tong_don_hang,
        "so_san_pham": so_san_pham,
        "tong_ton_kho": tong_ton_kho,
        "tong_luot_quet": tong_luot_quet,
        "don_hang_gan_day": recent_orders,
        "quet_ai_gan_day": recent_scans
    }

class UpdateUserStatusRequest(BaseModel):
    trangThai: str

class UpdateUserRoleRequest(BaseModel):
    vaiTro: str

class CreateUserAdminRequest(BaseModel):
    taiKhoan: str
    matKhau: str
    hoTen: str
    email: Optional[str] = ""
    diaChi: Optional[str] = ""
    vaiTro: str = "KhachHang"
    trangThaiTaiKhoan: str = "HoatDong"

class UpdateUserAdminRequest(BaseModel):
    hoTen: Optional[str] = None
    email: Optional[str] = None
    diaChi: Optional[str] = None
    vaiTro: Optional[str] = None
    trangThaiTaiKhoan: Optional[str] = None
    matKhau: Optional[str] = None

@app.get("/api/admin/nguoi-dung")
def get_admin_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT nd.MANGUOIDUNG, nd.TAIKHOAN, nd.HOTEN, nd.EMAIL, nd.DIACHI,
               nd.VAITRO, nd.NGAYDANGKY, nd.TRANGTHAITAIKHOAN,
               COUNT(dh.MADONHANG) AS SOTRUONGDONHANG,
               ISNULL(SUM(dh.TONGTIEN), 0) AS TONGCHITIEU
        FROM NGUOI_DUNG nd
        LEFT JOIN DON_HANG dh ON nd.MANGUOIDUNG = dh.MANGUOIDUNG
        GROUP BY nd.MANGUOIDUNG, nd.TAIKHOAN, nd.HOTEN, nd.EMAIL, nd.DIACHI,
                 nd.VAITRO, nd.NGAYDANGKY, nd.TRANGTHAITAIKHOAN
        ORDER BY nd.MANGUOIDUNG ASC
    """)
    users = []
    cols = [c[0] for c in cursor.description]
    for r in cursor.fetchall():
        users.append(normalize_row(cols, r))
    conn.close()
    return users

@app.put("/api/admin/nguoi-dung/{ma_nguoi_dung}/trang-thai")
def update_user_status(ma_nguoi_dung: int, req: UpdateUserStatusRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE NGUOI_DUNG SET TRANGTHAITAIKHOAN = ? WHERE MANGUOIDUNG = ?", (req.trangThai, ma_nguoi_dung))
    conn.commit()
    conn.close()
    return {"message": f"Đã chuyển trạng thái tài khoản thành {req.trangThai}", "MaNguoiDung": ma_nguoi_dung, "TrangThaiMoi": req.trangThai}

@app.put("/api/admin/nguoi-dung/{ma_nguoi_dung}/vai-tro")
def update_user_role(ma_nguoi_dung: int, req: UpdateUserRoleRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE NGUOI_DUNG SET VAITRO = ? WHERE MANGUOIDUNG = ?", (req.vaiTro, ma_nguoi_dung))
    conn.commit()
    conn.close()
    return {"message": f"Đã đổi vai trò người dùng thành {req.vaiTro}", "MaNguoiDung": ma_nguoi_dung, "VaiTroMoi": req.vaiTro}

@app.post("/api/admin/nguoi-dung")
def create_admin_user(req: CreateUserAdminRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT MANGUOIDUNG FROM NGUOI_DUNG WHERE LOWER(TAIKHOAN) = LOWER(?)", (req.taiKhoan.strip(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Tên tài khoản này đã tồn tại, vui lòng chọn tên khác!")

    cursor.execute("SELECT ISNULL(MAX(MANGUOIDUNG), 0) + 1 FROM NGUOI_DUNG")
    next_id = cursor.fetchone()[0]

    cursor.execute("""
        INSERT INTO NGUOI_DUNG (MANGUOIDUNG, TAIKHOAN, MATKHAU, HOTEN, EMAIL, DIACHI, VAITRO, TRANGTHAITAIKHOAN, NGAYDANGKY)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
    """, (next_id, req.taiKhoan.strip(), req.matKhau.strip(), req.hoTen.strip(), req.email.strip() if req.email else "", req.diaChi.strip() if req.diaChi else "", req.vaiTro, req.trangThaiTaiKhoan))
    conn.commit()
    conn.close()
    return {"message": "Tạo tài khoản / nhân sự mới thành công!", "MaNguoiDung": next_id, "TaiKhoan": req.taiKhoan}

@app.put("/api/admin/nguoi-dung/{ma_nguoi_dung}")
def update_admin_user(ma_nguoi_dung: int, req: UpdateUserAdminRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT MANGUOIDUNG FROM NGUOI_DUNG WHERE MANGUOIDUNG = ?", (ma_nguoi_dung,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    if req.hoTen is not None:
        cursor.execute("UPDATE NGUOI_DUNG SET HOTEN = ? WHERE MANGUOIDUNG = ?", (req.hoTen, ma_nguoi_dung))
    if req.email is not None:
        cursor.execute("UPDATE NGUOI_DUNG SET EMAIL = ? WHERE MANGUOIDUNG = ?", (req.email, ma_nguoi_dung))
    if req.diaChi is not None:
        cursor.execute("UPDATE NGUOI_DUNG SET DIACHI = ? WHERE MANGUOIDUNG = ?", (req.diaChi, ma_nguoi_dung))
    if req.vaiTro is not None:
        cursor.execute("UPDATE NGUOI_DUNG SET VAITRO = ? WHERE MANGUOIDUNG = ?", (req.vaiTro, ma_nguoi_dung))
    if req.trangThaiTaiKhoan is not None:
        cursor.execute("UPDATE NGUOI_DUNG SET TRANGTHAITAIKHOAN = ? WHERE MANGUOIDUNG = ?", (req.trangThaiTaiKhoan, ma_nguoi_dung))
    if req.matKhau is not None and req.matKhau.strip():
        cursor.execute("UPDATE NGUOI_DUNG SET MATKHAU = ? WHERE MANGUOIDUNG = ?", (req.matKhau.strip(), ma_nguoi_dung))

    conn.commit()
    conn.close()
    return {"message": "Cập nhật tài khoản thành công!", "MaNguoiDung": ma_nguoi_dung}

@app.delete("/api/admin/nguoi-dung/{ma_nguoi_dung}")
def delete_admin_user(ma_nguoi_dung: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM DON_HANG WHERE MANGUOIDUNG = ?", (ma_nguoi_dung,))
    order_count = cursor.fetchone()[0]
    if order_count > 0:
        cursor.execute("UPDATE NGUOI_DUNG SET TRANGTHAITAIKHOAN = N'BiKhoa' WHERE MANGUOIDUNG = ?", (ma_nguoi_dung,))
        conn.commit()
        conn.close()
        return {"message": "Người dùng đã có đơn hàng trong hệ thống nên được chuyển sang trạng thái 'Bị khóa' để bảo toàn dữ liệu!", "action": "locked"}

    cursor.execute("DELETE FROM GIO_HANG WHERE MANGUOIDUNG = ?", (ma_nguoi_dung,))
    cursor.execute("DELETE FROM NGUOI_DUNG WHERE MANGUOIDUNG = ?", (ma_nguoi_dung,))
    conn.commit()
    conn.close()
    return {"message": "Đã xóa tài khoản thành công!", "action": "deleted"}

@app.get("/api/admin/don-hang")
def get_admin_don_hang():
    return query_db("""
        SELECT dh.MADONHANG, dh.NGAYDATHANG, dh.TONGTIEN, dh.TAMTINH, dh.SOTIENGIAM, dh.PHIVANCHUYEN,
               dh.TRANGTHAIDONHANG, dh.TRANGTHAITHANHTOAN, dh.PHUONGTHUCTHANHTOAN,
               dh.DIACHINHANHANG, dh.SDTNHANHANG, ISNULL(nd.HOTEN, nd.TAIKHOAN) AS KHACHHANG,
               km.TENMAGIAMGIA
        FROM DON_HANG dh
        LEFT JOIN NGUOI_DUNG nd ON dh.MANGUOIDUNG = nd.MANGUOIDUNG
        LEFT JOIN CHUONG_TRINH_GIAM_GIA km ON dh.MACHUONGTRINHGIAMGIA = km.MACHUONGTRINHGIAMGIA
        ORDER BY dh.MADONHANG DESC
    """)

@app.get("/api/admin/don-hang/{ma_don_hang}/chi-tiet")
def get_admin_don_hang_chi_tiet(ma_don_hang: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT dh.MADONHANG, dh.NGAYDATHANG, dh.TONGTIEN, dh.TAMTINH, dh.SOTIENGIAM, dh.PHIVANCHUYEN,
               dh.TRANGTHAIDONHANG, dh.TRANGTHAITHANHTOAN, dh.PHUONGTHUCTHANHTOAN,
               dh.DIACHINHANHANG, dh.SDTNHANHANG, ISNULL(nd.HOTEN, nd.TAIKHOAN) AS KHACHHANG,
               nd.EMAIL, nd.TAIKHOAN, km.TENMAGIAMGIA, km.TENCHUONGTRINHGIAMGIA
        FROM DON_HANG dh
        LEFT JOIN NGUOI_DUNG nd ON dh.MANGUOIDUNG = nd.MANGUOIDUNG
        LEFT JOIN CHUONG_TRINH_GIAM_GIA km ON dh.MACHUONGTRINHGIAMGIA = km.MACHUONGTRINHGIAMGIA
        WHERE dh.MADONHANG = ?
    """, (ma_don_hang,))
    order_row = cursor.fetchone()
    if not order_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng!")

    cols = [c[0] for c in cursor.description]
    order_info = normalize_row(cols, order_row)

    cursor.execute("""
        SELECT ct.MACHITIETDONHANG, ct.SOLUONGMUA, ct.DONGIAMUA,
               (ct.SOLUONGMUA * ct.DONGIAMUA) AS THANHTIEN,
               sp.MASANPHAM, sp.TENSANPHAM, sp.KICHTHUOCCAY, sp.TINHTRANGCAY,
               lc.MALOAICAY, lc.TENTHUONGGOI, lc.TENKHOAHOC,
               (SELECT TOP 1 URLANH FROM HINH_ANH_SAN_PHAM ha WHERE ha.MASANPHAM = sp.MASANPHAM ORDER BY LAANHCHINH DESC) AS URLANH
        FROM CHI_TIET_DON_HANG ct
        JOIN SAN_PHAM sp ON ct.MASANPHAM = sp.MASANPHAM
        LEFT JOIN LOAI_CAY lc ON sp.MALOAICAY = lc.MALOAICAY
        WHERE ct.MADONHANG = ?
    """, (ma_don_hang,))

    items = []
    item_cols = [c[0] for c in cursor.description]
    for r in cursor.fetchall():
        items.append(normalize_row(item_cols, r))

    conn.close()
    return {
        "don_hang": order_info,
        "chi_tiet": items
    }

@app.put("/api/admin/don-hang/{ma_don_hang}/trang-thai")
def update_trang_thai_don_hang(ma_don_hang: int, req: UpdateOrderStatusRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT TRANGTHAIDONHANG, MACHUONGTRINHGIAMGIA FROM DON_HANG WHERE MADONHANG = ?", (ma_don_hang,))
    curr_row = cursor.fetchone()
    old_status = curr_row[0] if curr_row else None
    voucher_id = curr_row[1] if curr_row else None

    cursor.execute("UPDATE DON_HANG SET TRANGTHAIDONHANG = ? WHERE MADONHANG = ?", (req.TrangThaiDonHang, ma_don_hang))

    # Nếu hoàn thành đơn hàng -> Tự động cập nhật đã thanh toán
    if req.TrangThaiDonHang in ['Đã hoàn thành', 'HOAN_THANH']:
        cursor.execute("UPDATE DON_HANG SET TRANGTHAITHANHTOAN = N'Đã thanh toán' WHERE MADONHANG = ?", (ma_don_hang,))

    # Nếu chuyển sang Đã hủy và trước đó chưa hủy -> Hoàn lại tồn kho và số lượt dùng voucher
    if req.TrangThaiDonHang in ['Đã hủy', 'DA_HUY', 'HỦY'] and old_status not in ['Đã hủy', 'DA_HUY', 'HỦY']:
        cursor.execute("SELECT MASANPHAM, SOLUONGMUA FROM CHI_TIET_DON_HANG WHERE MADONHANG = ?", (ma_don_hang,))
        for sp_id, qty in cursor.fetchall():
            cursor.execute("UPDATE SAN_PHAM SET SOLUONGTONKHO = SOLUONGTONKHO + ? WHERE MASANPHAM = ?", (qty, sp_id))
        if voucher_id:
            cursor.execute("""
                UPDATE CHUONG_TRINH_GIAM_GIA 
                SET SOLUONGDADUNG = CASE WHEN SOLUONGDADUNG > 0 THEN SOLUONGDADUNG - 1 ELSE 0 END 
                WHERE MACHUONGTRINHGIAMGIA = ?
            """, (voucher_id,))

    conn.commit()
    conn.close()
    return {"message": "Đã cập nhật trạng thái đơn hàng thành công", "MaDonHang": ma_don_hang, "TrangThaiMoi": req.TrangThaiDonHang}

# =====================================================================
# VOUCHER & CHƯƠNG TRÌNH GIẢM GIÁ (CDM: CHUONG_TRINH_GIAM_GIA)
# =====================================================================
class CheckVoucherRequest(BaseModel):
    MaGiamGia: str
    TamTinh: float

class AdminVoucherRequest(BaseModel):
    TenMaGiamGia: str
    TenChuongTrinhGiamGia: str
    LoaiGiamGia: str = "PhanTram"  # PhanTram | SoTien
    GiaTriGiam: float
    ToiDa: Optional[float] = None
    ToiThieu: Optional[float] = 0.0
    SoLuongPhieu: Optional[int] = 100
    MoTa: Optional[str] = None

@app.get("/api/giam-gia")
def get_danh_sach_giam_gia():
    return query_db("""
        SELECT MACHUONGTRINHGIAMGIA, TENMAGIAMGIA, TENCHUONGTRINHGIAMGIA,
               LOAIGIAMGIA, GIATRIGIAM, TOIDA, TOITHIEU, SOLUONGPHIEU,
               SOLUONGDADUNG, MOTA, NGAYBATDAU, NGAYKETTHUC
        FROM CHUONG_TRINH_GIAM_GIA
        WHERE (SOLUONGPHIEU IS NULL OR SOLUONGDADUNG < SOLUONGPHIEU)
        ORDER BY MACHUONGTRINHGIAMGIA ASC
    """)

@app.post("/api/giam-gia/kiem-tra")
def check_voucher(req: CheckVoucherRequest):
    code = req.MaGiamGia.strip().upper()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT MACHUONGTRINHGIAMGIA, TENMAGIAMGIA, TENCHUONGTRINHGIAMGIA,
               LOAIGIAMGIA, GIATRIGIAM, TOIDA, TOITHIEU, SOLUONGPHIEU,
               SOLUONGDADUNG, MOTA, NGAYBATDAU, NGAYKETTHUC
        FROM CHUONG_TRINH_GIAM_GIA
        WHERE UPPER(LTRIM(RTRIM(TENMAGIAMGIA))) = ?
    """, (code,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Mã giảm giá '{code}' không tồn tại hoặc đã hết hạn!")

    cols = [c[0] for c in cursor.description]
    v = normalize_row(cols, row)

    qty = v.get("SoLuongPhieu") or 0
    used = v.get("SoLuongDaDung") or 0
    if qty > 0 and used >= qty:
        raise HTTPException(status_code=400, detail=f"Mã giảm giá '{code}' đã hết lượt sử dụng!")

    min_order = float(v.get("ToiThieu") or 0)
    if req.TamTinh < min_order:
        raise HTTPException(
            status_code=400,
            detail=f"Mã '{code}' chỉ áp dụng cho đơn hàng từ {min_order:,.0f} ₫ (Tạm tính hiện tại: {req.TamTinh:,.0f} ₫)!"
        )

    v_type = str(v.get("LoaiGiamGia") or '').strip().lower()
    val = float(v.get("GiaTriGiam") or 0)
    max_discount = float(v.get("ToiDa") or 0)

    if "phantram" in v_type:
        discount = (req.TamTinh * val) / 100.0
        if max_discount > 0 and discount > max_discount:
            discount = max_discount
    else:
        discount = val
        if discount > req.TamTinh:
            discount = req.TamTinh

    return {
        "hopLe": True,
        "voucher": v,
        "soTienGiam": discount,
        "thongBao": f"Áp dụng thành công mã {code}! Giảm {discount:,.0f} ₫ cho đơn hàng."
    }

class CreateAdminVoucherRequest(BaseModel):
    TenMaGiamGia: str
    TenChuongTrinhGiamGia: Optional[str] = None
    LoaiGiamGia: str = "PhanTram"  # PhanTram | SoTien
    GiaTriGiam: float
    ToiDa: Optional[float] = None
    ToiThieu: Optional[float] = 0.0
    SoLuongPhieu: Optional[int] = 100
    MoTa: Optional[str] = None
    NgayBatDau: Optional[str] = None
    NgayKetThuc: Optional[str] = None

class UpdateAdminVoucherRequest(BaseModel):
    TenMaGiamGia: Optional[str] = None
    TenChuongTrinhGiamGia: Optional[str] = None
    LoaiGiamGia: Optional[str] = None
    GiaTriGiam: Optional[float] = None
    ToiDa: Optional[float] = None
    ToiThieu: Optional[float] = None
    SoLuongPhieu: Optional[int] = None
    MoTa: Optional[str] = None
    NgayKetThuc: Optional[str] = None

@app.get("/api/admin/giam-gia")
def get_admin_danh_sach_giam_gia():
    return query_db("""
        SELECT MACHUONGTRINHGIAMGIA, TENMAGIAMGIA, TENCHUONGTRINHGIAMGIA,
               LOAIGIAMGIA, GIATRIGIAM, TOIDA, TOITHIEU, SOLUONGPHIEU,
               SOLUONGDADUNG, MOTA, NGAYBATDAU, NGAYKETTHUC
        FROM CHUONG_TRINH_GIAM_GIA
        ORDER BY MACHUONGTRINHGIAMGIA DESC
    """)

@app.post("/api/admin/giam-gia")
def create_admin_voucher(req: CreateAdminVoucherRequest):
    code = req.TenMaGiamGia.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Mã giảm giá không được để trống!")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT MACHUONGTRINHGIAMGIA FROM CHUONG_TRINH_GIAM_GIA WHERE UPPER(LTRIM(RTRIM(TENMAGIAMGIA))) = ?", (code,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"Mã giảm giá '{code}' đã tồn tại trong hệ thống!")

    cursor.execute("SELECT ISNULL(MAX(MACHUONGTRINHGIAMGIA), 0) + 1 FROM CHUONG_TRINH_GIAM_GIA")
    next_id = cursor.fetchone()[0]

    title = req.TenChuongTrinhGiamGia or f"Ưu đãi {code}"
    loai = "SoTien" if "sotien" in req.LoaiGiamGia.lower() else "PhanTram"
    gia_tri = float(req.GiaTriGiam)
    toi_da = float(req.ToiDa) if req.ToiDa is not None else (gia_tri if loai == "SoTien" else 50000.0)
    toi_thieu = float(req.ToiThieu or 0.0)
    so_luong = int(req.SoLuongPhieu or 100)
    mo_ta = req.MoTa or f"Giảm {gia_tri:,.0f}{'%' if loai == 'PhanTram' else ' ₫'} cho đơn từ {toi_thieu:,.0f} ₫"
    ngay_bd = datetime.now()
    ngay_kt = datetime(2027, 12, 31)

    cursor.execute("""
        INSERT INTO CHUONG_TRINH_GIAM_GIA (
            MACHUONGTRINHGIAMGIA, TENMAGIAMGIA, TENCHUONGTRINHGIAMGIA,
            LOAIGIAMGIA, GIATRIGIAM, TOIDA, TOITHIEU, SOLUONGPHIEU,
            SOLUONGDADUNG, MOTA, NGAYBATDAU, NGAYKETTHUC
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    """, (next_id, code, title, loai, gia_tri, toi_da, toi_thieu, so_luong, mo_ta, ngay_bd, ngay_kt))

    conn.commit()
    conn.close()

    return {
        "message": f"Tạo mã giảm giá '{code}' thành công!",
        "MaChuongTrinhGiamGia": next_id,
        "TenMaGiamGia": code,
        "TenChuongTrinhGiamGia": title,
        "LoaiGiamGia": loai,
        "GiaTriGiam": gia_tri,
        "ToiDa": toi_da,
        "ToiThieu": toi_thieu,
        "SoLuongPhieu": so_luong,
        "SoLuongDaDung": 0,
        "MoTa": mo_ta
    }

@app.put("/api/admin/giam-gia/{ma_chuong_trinh}")
def update_admin_voucher(ma_chuong_trinh: int, req: UpdateAdminVoucherRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT MACHUONGTRINHGIAMGIA FROM CHUONG_TRINH_GIAM_GIA WHERE MACHUONGTRINHGIAMGIA = ?", (ma_chuong_trinh,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy mã giảm giá cần cập nhật!")

    if req.TenMaGiamGia:
        code = req.TenMaGiamGia.strip().upper()
        cursor.execute("UPDATE CHUONG_TRINH_GIAM_GIA SET TENMAGIAMGIA = ? WHERE MACHUONGTRINHGIAMGIA = ?", (code, ma_chuong_trinh))
    if req.TenChuongTrinhGiamGia is not None:
        cursor.execute("UPDATE CHUONG_TRINH_GIAM_GIA SET TENCHUONGTRINHGIAMGIA = ? WHERE MACHUONGTRINHGIAMGIA = ?", (req.TenChuongTrinhGiamGia, ma_chuong_trinh))
    if req.LoaiGiamGia is not None:
        loai = "SoTien" if "sotien" in req.LoaiGiamGia.lower() else "PhanTram"
        cursor.execute("UPDATE CHUONG_TRINH_GIAM_GIA SET LOAIGIAMGIA = ? WHERE MACHUONGTRINHGIAMGIA = ?", (loai, ma_chuong_trinh))
    if req.GiaTriGiam is not None:
        cursor.execute("UPDATE CHUONG_TRINH_GIAM_GIA SET GIATRIGIAM = ? WHERE MACHUONGTRINHGIAMGIA = ?", (float(req.GiaTriGiam), ma_chuong_trinh))
    if req.ToiDa is not None:
        cursor.execute("UPDATE CHUONG_TRINH_GIAM_GIA SET TOIDA = ? WHERE MACHUONGTRINHGIAMGIA = ?", (float(req.ToiDa), ma_chuong_trinh))
    if req.ToiThieu is not None:
        cursor.execute("UPDATE CHUONG_TRINH_GIAM_GIA SET TOITHIEU = ? WHERE MACHUONGTRINHGIAMGIA = ?", (float(req.ToiThieu), ma_chuong_trinh))
    if req.SoLuongPhieu is not None:
        cursor.execute("UPDATE CHUONG_TRINH_GIAM_GIA SET SOLUONGPHIEU = ? WHERE MACHUONGTRINHGIAMGIA = ?", (int(req.SoLuongPhieu), ma_chuong_trinh))
    if req.MoTa is not None:
        cursor.execute("UPDATE CHUONG_TRINH_GIAM_GIA SET MOTA = ? WHERE MACHUONGTRINHGIAMGIA = ?", (req.MoTa, ma_chuong_trinh))

    conn.commit()
    conn.close()
    return {"message": "Cập nhật mã giảm giá thành công!", "MaChuongTrinhGiamGia": ma_chuong_trinh}

@app.delete("/api/admin/giam-gia/{ma_chuong_trinh}")
def delete_admin_voucher(ma_chuong_trinh: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(1) FROM DON_HANG WHERE MACHUONGTRINHGIAMGIA = ?", (ma_chuong_trinh,))
    count_dh = cursor.fetchone()[0]

    if count_dh > 0:
        cursor.execute("UPDATE CHUONG_TRINH_GIAM_GIA SET SOLUONGPHIEU = SOLUONGDADUNG WHERE MACHUONGTRINHGIAMGIA = ?", (ma_chuong_trinh,))
        conn.commit()
        conn.close()
        return {"message": f"Mã đã có {count_dh} đơn hàng áp dụng nên đã được chuyển sang trạng thái Đóng/Hết lượt để bảo toàn lịch sử đơn.", "MaChuongTrinhGiamGia": ma_chuong_trinh}
    else:
        cursor.execute("DELETE FROM CHUONG_TRINH_GIAM_GIA WHERE MACHUONGTRINHGIAMGIA = ?", (ma_chuong_trinh,))
        conn.commit()
        conn.close()
        return {"message": "Đã xóa mã giảm giá thành công!", "MaChuongTrinhGiamGia": ma_chuong_trinh}

class CreateOrderItem(BaseModel):
    MaSanPham: int
    SoLuongMua: int
    DonGiaMua: float

class CreateOrderRequest(BaseModel):
    MaNguoiDung: Optional[int] = None
    TenKhachHang: Optional[str] = None
    SdtNhanHang: str
    DiaChiNhanHang: str
    PhuongThucThanhToan: Optional[str] = "COD"
    TamTinh: float
    SoTienGiam: Optional[float] = 0.0
    MaChuongTrinhGiamGia: Optional[int] = None
    PhiVanChuyen: Optional[float] = 30000.0
    TongTien: float
    GhiChu: Optional[str] = None
    Items: List[CreateOrderItem]

@app.post("/api/don-hang")
def create_customer_order(req: CreateOrderRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Lấy ID đơn hàng mới
        cursor.execute("SELECT ISNULL(MAX(MADONHANG), 0) + 1 FROM DON_HANG")
        next_dh = cursor.fetchone()[0]

        payment_status = "Chưa thanh toán"
        if req.PhuongThucThanhToan in ["BANK_QR", "MOMO"]:
            payment_status = "Đã thanh toán (Mô phỏng QR)"

        cursor.execute("""
            INSERT INTO DON_HANG (
                MADONHANG, MANGUOIDUNG, NGAYDATHANG, TAMTINH, SOTIENGIAM,
                PHIVANCHUYEN, TONGTIEN, DIACHINHANHANG, SDTNHANHANG,
                PHUONGTHUCTHANHTOAN, TRANGTHAITHANHTOAN, TRANGTHAIDONHANG,
                MACHUONGTRINHGIAMGIA
            )
            VALUES (?, ?, GETDATE(), ?, ?, ?, ?, ?, ?, ?, ?, N'Chờ xử lý', ?)
        """, (
            next_dh, req.MaNguoiDung, req.TamTinh, req.SoTienGiam or 0, req.PhiVanChuyen,
            req.TongTien, req.DiaChiNhanHang, req.SdtNhanHang,
            req.PhuongThucThanhToan, payment_status, req.MaChuongTrinhGiamGia
        ))

        # Cập nhật số lượt sử dụng voucher nếu có
        if req.MaChuongTrinhGiamGia:
            cursor.execute("""
                UPDATE CHUONG_TRINH_GIAM_GIA
                SET SOLUONGDADUNG = ISNULL(SOLUONGDADUNG, 0) + 1
                WHERE MACHUONGTRINHGIAMGIA = ?
            """, (req.MaChuongTrinhGiamGia,))

        # Lấy ID chi tiết đơn hàng bắt đầu
        cursor.execute("SELECT ISNULL(MAX(MACHITIETDONHANG), 0) FROM CHI_TIET_DON_HANG")
        curr_ct_id = cursor.fetchone()[0]

        for item in req.Items:
            curr_ct_id += 1
            cursor.execute("""
                INSERT INTO CHI_TIET_DON_HANG (
                    MADONHANG, MASANPHAM, MACHITIETDONHANG, SOLUONGMUA, DONGIAMUA
                )
                VALUES (?, ?, ?, ?, ?)
            """, (next_dh, item.MaSanPham, curr_ct_id, item.SoLuongMua, item.DonGiaMua))

            # Trừ tồn kho sản phẩm nếu còn
            cursor.execute("""
                UPDATE SAN_PHAM 
                SET SOLUONGTONKHO = CASE WHEN SOLUONGTONKHO >= ? THEN SOLUONGTONKHO - ? ELSE 0 END
                WHERE MASANPHAM = ?
            """, (item.SoLuongMua, item.SoLuongMua, item.MaSanPham))

        conn.commit()
        conn.close()
        return {
            "message": "Đặt hàng thành công!",
            "MaDonHang": next_dh,
            "TongTien": req.TongTien,
            "TrangThai": "Chờ xử lý"
        }
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu đơn hàng: {str(e)}")

@app.get("/api/nguoi-dung/{ma_nguoi_dung}/don-hang")
def get_user_orders(ma_nguoi_dung: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT dh.MADONHANG, dh.NGAYDATHANG, dh.TONGTIEN, dh.TAMTINH, dh.SOTIENGIAM, dh.PHIVANCHUYEN,
               dh.TRANGTHAIDONHANG, dh.TRANGTHAITHANHTOAN, dh.PHUONGTHUCTHANHTOAN,
               dh.DIACHINHANHANG, dh.SDTNHANHANG, km.TENMAGIAMGIA
        FROM DON_HANG dh
        LEFT JOIN CHUONG_TRINH_GIAM_GIA km ON dh.MACHUONGTRINHGIAMGIA = km.MACHUONGTRINHGIAMGIA
        WHERE dh.MANGUOIDUNG = ?
        ORDER BY dh.MADONHANG DESC
    """, (ma_nguoi_dung,))
    orders = []
    cols = [c[0] for c in cursor.description]
    for r in cursor.fetchall():
        orders.append(normalize_row(cols, r))

    for order in orders:
        m_dh = order.get("MaDonHang") or order.get("MADONHANG")
        cursor.execute("""
            SELECT ct.MACHITIETDONHANG, ct.SOLUONGMUA, ct.DONGIAMUA,
                   (ct.SOLUONGMUA * ct.DONGIAMUA) AS THANHTIEN,
                   sp.MASANPHAM, sp.TENSANPHAM, sp.KICHTHUOCCAY,
                   (SELECT TOP 1 URLANH FROM HINH_ANH_SAN_PHAM ha WHERE ha.MASANPHAM = sp.MASANPHAM ORDER BY LAANHCHINH DESC) AS URLANH
            FROM CHI_TIET_DON_HANG ct
            JOIN SAN_PHAM sp ON ct.MASANPHAM = sp.MASANPHAM
            WHERE ct.MADONHANG = ?
        """, (m_dh,))
        item_cols = [c[0] for c in cursor.description]
        order["ChiTiet"] = [normalize_row(item_cols, ir) for ir in cursor.fetchall()]

    conn.close()
    return orders

@app.put("/api/don-hang/{ma_don_hang}/huy")
def cancel_user_order(ma_don_hang: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT TRANGTHAIDONHANG, MACHUONGTRINHGIAMGIA FROM DON_HANG WHERE MADONHANG = ?", (ma_don_hang,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng!")
    if row[0] not in ['Chờ xử lý', 'CHO_XAC_NHAN']:
        conn.close()
        raise HTTPException(status_code=400, detail="Chỉ có thể hủy đơn hàng khi shop chưa bắt đầu giao!")

    cursor.execute("UPDATE DON_HANG SET TRANGTHAIDONHANG = N'Đã hủy' WHERE MADONHANG = ?", (ma_don_hang,))

    # Hoàn lại số lượng tồn kho cho các sản phẩm trong đơn
    cursor.execute("SELECT MASANPHAM, SOLUONGMUA FROM CHI_TIET_DON_HANG WHERE MADONHANG = ?", (ma_don_hang,))
    for sp_id, qty in cursor.fetchall():
        cursor.execute("UPDATE SAN_PHAM SET SOLUONGTONKHO = SOLUONGTONKHO + ? WHERE MASANPHAM = ?", (qty, sp_id))

    # Hoàn lại lượt dùng voucher nếu có
    if row[1]:
        cursor.execute("""
            UPDATE CHUONG_TRINH_GIAM_GIA 
            SET SOLUONGDADUNG = CASE WHEN SOLUONGDADUNG > 0 THEN SOLUONGDADUNG - 1 ELSE 0 END 
            WHERE MACHUONGTRINHGIAMGIA = ?
        """, (row[1],))

    conn.commit()
    conn.close()
    return {"message": "Đã hủy đơn hàng thành công!", "MaDonHang": ma_don_hang}

# =====================================================================
# ĐÁNH GIÁ SẢN PHẨM (CDM: DANH_GIA_SAN_PHAM)
# =====================================================================
class CreateReviewRequest(BaseModel):
    MaSanPham: int
    MaDonHang: Optional[int] = None
    SoSao: int = 5
    NoiDungBinhLuan: str
    HinhAnhThucTe: Optional[str] = None
    TenNguoiDanhGia: Optional[str] = None
    MaNguoiDung: Optional[int] = None

@app.get("/api/san-pham/{ma_san_pham}/danh-gia")
def get_san_pham_danh_gia(ma_san_pham: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT dg.MADANHGIA, dg.MADONHANG, dg.MASANPHAM, dg.SOSAO, dg.NOIDUNGBINHLUAN,
               dg.HINHANHTHUCTE, dg.NGAYDANHGIA,
               ISNULL(nd.HOTEN, nd.TAIKHOAN) AS NGUOIDANHGIA,
               sp.TENSANPHAM
        FROM DANH_GIA_SAN_PHAM dg
        LEFT JOIN DON_HANG dh ON dg.MADONHANG = dh.MADONHANG
        LEFT JOIN NGUOI_DUNG nd ON dh.MANGUOIDUNG = nd.MANGUOIDUNG
        LEFT JOIN SAN_PHAM sp ON dg.MASANPHAM = sp.MASANPHAM
        WHERE dg.MASANPHAM = ?
        ORDER BY dg.MADANHGIA DESC
    """, (ma_san_pham,))
    cols = [c[0] for c in cursor.description]
    reviews = []
    total_stars = 0
    for r in cursor.fetchall():
        row_dict = normalize_row(cols, r)
        row_dict["NgayDanhGia"] = str(row_dict.get("NgayDanhGia") or '')[:10]
        if not row_dict.get("NguoiDanhGia"):
            row_dict["NguoiDanhGia"] = "Khách hàng thân thiết"
        total_stars += int(row_dict.get("SoSao") or 5)
        reviews.append(row_dict)
    conn.close()

    count = len(reviews)
    avg_rating = round(total_stars / count, 1) if count > 0 else 5.0
    return {
        "tong_danh_gia": count,
        "diem_trung_binh": avg_rating,
        "danh_sach": reviews
    }

@app.get("/api/danh-gia/noi-bat")
def get_danh_gia_noi_bat():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT TOP 8 dg.MADANHGIA, dg.MADONHANG, dg.MASANPHAM, dg.SOSAO, dg.NOIDUNGBINHLUAN,
               dg.HINHANHTHUCTE, dg.NGAYDANHGIA,
               ISNULL(nd.HOTEN, nd.TAIKHOAN) AS NGUOIDANHGIA,
               sp.TENSANPHAM
        FROM DANH_GIA_SAN_PHAM dg
        LEFT JOIN DON_HANG dh ON dg.MADONHANG = dh.MADONHANG
        LEFT JOIN NGUOI_DUNG nd ON dh.MANGUOIDUNG = nd.MANGUOIDUNG
        LEFT JOIN SAN_PHAM sp ON dg.MASANPHAM = sp.MASANPHAM
        WHERE dg.SOSAO >= 4
        ORDER BY dg.MADANHGIA DESC
    """)
    cols = [c[0] for c in cursor.description]
    results = []
    for r in cursor.fetchall():
        row_dict = normalize_row(cols, r)
        row_dict["NgayDanhGia"] = str(row_dict.get("NgayDanhGia") or '')[:10]
        if not row_dict.get("NguoiDanhGia"):
            row_dict["NguoiDanhGia"] = "Khách hàng yêu cây"
        results.append(row_dict)
    conn.close()
    return results

@app.post("/api/danh-gia")
def create_danh_gia(req: CreateReviewRequest):
    if not req.NoiDungBinhLuan or not req.NoiDungBinhLuan.strip():
        raise HTTPException(status_code=400, detail="Vui lòng nhập nội dung đánh giá sản phẩm!")
    if req.SoSao < 1 or req.SoSao > 5:
        raise HTTPException(status_code=400, detail="Số sao đánh giá phải từ 1 đến 5 sao!")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT ISNULL(MAX(MADANHGIA), 0) + 1 FROM DANH_GIA_SAN_PHAM")
    next_id = cursor.fetchone()[0]

    m_dh = req.MaDonHang
    if not m_dh:
        if req.MaNguoiDung:
            cursor.execute("""
                SELECT TOP 1 dh.MADONHANG
                FROM DON_HANG dh
                JOIN CHI_TIET_DON_HANG ct ON dh.MADONHANG = ct.MADONHANG
                WHERE dh.MANGUOIDUNG = ? AND ct.MASANPHAM = ?
                ORDER BY dh.MADONHANG DESC
            """, (req.MaNguoiDung, req.MaSanPham))
            row_dh = cursor.fetchone()
            if row_dh:
                m_dh = row_dh[0]
        if not m_dh:
            cursor.execute("SELECT TOP 1 MADONHANG FROM DON_HANG")
            r_dh = cursor.fetchone()
            m_dh = r_dh[0] if r_dh else 1

    now = datetime.now()
    cursor.execute("""
        INSERT INTO DANH_GIA_SAN_PHAM (
            MADANHGIA, MADONHANG, MASANPHAM, SOSAO,
            HINHANHTHUCTE, NOIDUNGBINHLUAN, NGAYDANHGIA
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        next_id,
        m_dh,
        req.MaSanPham,
        req.SoSao,
        req.HinhAnhThucTe or "",
        req.NoiDungBinhLuan.strip(),
        now
    ))

    conn.commit()
    conn.close()

    return {
        "message": "Cảm ơn bạn đã gửi đánh giá sản phẩm!",
        "MaDanhGia": next_id,
        "MaSanPham": req.MaSanPham,
        "SoSao": req.SoSao,
        "NoiDungBinhLuan": req.NoiDungBinhLuan.strip(),
        "NgayDanhGia": str(now)[:10]
    }

@app.get("/api/admin/ai-logs")
def get_admin_ai_logs():
    return query_db("""
        SELECT TOP 50 ta.MATIMKIEM, ta.THOIGIAN, ta.HINHANHURL, ta.NENTANG, ta.TRANGTHAINHANDIEN,
               kq.THUHANG, kq.XACSUATCHINHXAC, lc.MALOAICAY, lc.TENTHUONGGOI, lc.TENKHOAHOC
        FROM TIM_ANH ta
        LEFT JOIN KET_QUA_NHAN_DIEN kq ON ta.MATIMKIEM = kq.MATIMKIEM AND kq.THUHANG = 1
        LEFT JOIN LOAI_CAY lc ON kq.MALOAICAY = lc.MALOAICAY
        ORDER BY ta.MATIMKIEM DESC
    """)

@app.put("/api/admin/san-pham/{ma_san_pham}")
def update_san_pham(ma_san_pham: int, req: UpdateProductRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    if req.TenSanPham is not None:
        cursor.execute("UPDATE SAN_PHAM SET TENSANPHAM = ? WHERE MASANPHAM = ?", (req.TenSanPham, ma_san_pham))
    if req.SoLuongTonKho is not None:
        cursor.execute("UPDATE SAN_PHAM SET SOLUONGTONKHO = ? WHERE MASANPHAM = ?", (req.SoLuongTonKho, ma_san_pham))
    if req.KichThuocCay is not None:
        cursor.execute("UPDATE SAN_PHAM SET KICHTHUOCCAY = ? WHERE MASANPHAM = ?", (req.KichThuocCay, ma_san_pham))
    if req.TinhTrangCay is not None:
        cursor.execute("UPDATE SAN_PHAM SET TINHTRANGCAY = ? WHERE MASANPHAM = ?", (req.TinhTrangCay, ma_san_pham))
    if req.NgayNhap is not None:
        cursor.execute("UPDATE SAN_PHAM SET NGAYNHAP = ? WHERE MASANPHAM = ?", (req.NgayNhap, ma_san_pham))
    if req.GiaBan is not None:
        cursor.execute("SELECT ISNULL(MAX(MALICHSUGIA), 0) + 1, ISNULL(MAX(MATHOIDIEM), 1) FROM LICH_SU_GIA_SAN_PHAM")
        row_gia = cursor.fetchone()
        ma_gia, ma_td = row_gia[0], row_gia[1]
        cursor.execute("""
            INSERT INTO LICH_SU_GIA_SAN_PHAM (MASANPHAM, MATHOIDIEM, MALICHSUGIA, LYDOTHAIDOI, GIABAN)
            VALUES (?, ?, ?, N'Cập nhật giá từ Admin', ?)
        """, (ma_san_pham, ma_td, ma_gia, req.GiaBan))

    # Cập nhật danh sách album nhiều ảnh & ảnh chính
    if req.DanhSachAnh is not None and len(req.DanhSachAnh) > 0:
        cursor.execute("DELETE FROM HINH_ANH_SAN_PHAM WHERE MASANPHAM = ?", (ma_san_pham,))
        has_main = any(bool(img.get("LaAnhChinh") or img.get("isMain")) for img in req.DanhSachAnh)
        if not has_main and req.DanhSachAnh:
            req.DanhSachAnh[0]["LaAnhChinh"] = True

        for item in req.DanhSachAnh:
            u = item.get("UrlAnh") or item.get("url")
            if not u:
                continue
            is_main = bool(item.get("LaAnhChinh") or item.get("isMain"))
            cursor.execute("SELECT ISNULL(MAX(MAANH), 0) + 1 FROM HINH_ANH_SAN_PHAM")
            ma_anh = cursor.fetchone()[0]
            cursor.execute("""
                INSERT INTO HINH_ANH_SAN_PHAM (MAANH, MASANPHAM, URLANH, LAANHCHINH)
                VALUES (?, ?, ?, ?)
            """, (ma_anh, ma_san_pham, u, 1 if is_main else 0))
    elif req.UrlAnh is not None:
        cursor.execute("SELECT 1 FROM HINH_ANH_SAN_PHAM WHERE MASANPHAM = ? AND LAANHCHINH = 1", (ma_san_pham,))
        if cursor.fetchone():
            cursor.execute("UPDATE HINH_ANH_SAN_PHAM SET URLANH = ? WHERE MASANPHAM = ? AND LAANHCHINH = 1", (req.UrlAnh, ma_san_pham))
        else:
            cursor.execute("SELECT ISNULL(MAX(MAANH), 0) + 1 FROM HINH_ANH_SAN_PHAM")
            ma_anh = cursor.fetchone()[0]
            cursor.execute("INSERT INTO HINH_ANH_SAN_PHAM (MAANH, MASANPHAM, URLANH, LAANHCHINH) VALUES (?, ?, ?, 1)", (ma_anh, ma_san_pham, req.UrlAnh))

    conn.commit()
    conn.close()
    return {"message": "Đã cập nhật sản phẩm thành công", "MaSanPham": ma_san_pham}

@app.post("/api/admin/san-pham")
def create_san_pham(req: CreateProductRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT ISNULL(MAX(MASANPHAM), 0) + 1 FROM SAN_PHAM")
    ma_sp = cursor.fetchone()[0]

    cursor.execute("""
        INSERT INTO SAN_PHAM (MASANPHAM, MALOAICAY, TENSANPHAM, SOLUONGTONKHO, KICHTHUOCCAY, TINHTRANGCAY, NGAYNHAP)
        VALUES (?, ?, ?, ?, ?, ?, ISNULL(?, GETDATE()))
    """, (ma_sp, req.MaLoaiCay, req.TenSanPham, req.SoLuongTonKho, req.KichThuocCay, req.TinhTrangCay, req.NgayNhap))

    # Cập nhật lịch sử giá
    cursor.execute("SELECT ISNULL(MAX(MALICHSUGIA), 0) + 1, ISNULL(MAX(MATHOIDIEM), 1) FROM LICH_SU_GIA_SAN_PHAM")
    row_gia = cursor.fetchone()
    ma_gia, ma_td = row_gia[0], row_gia[1]
    cursor.execute("""
        INSERT INTO LICH_SU_GIA_SAN_PHAM (MASANPHAM, MATHOIDIEM, MALICHSUGIA, LYDOTHAIDOI, GIABAN)
        VALUES (?, ?, ?, N'Giá khởi tạo chậu mới', ?)
    """, (ma_sp, ma_td, ma_gia, req.GiaBan))

    # Cập nhật nhiều hình ảnh & chọn ảnh chính
    danh_sach_anh = req.DanhSachAnh or []
    if not danh_sach_anh:
        primary_url = req.UrlAnh or f"/plants/{req.MaLoaiCay}.jpg"
        danh_sach_anh = [{"UrlAnh": primary_url, "LaAnhChinh": True}]

    has_main = any(bool(img.get("LaAnhChinh") or img.get("isMain")) for img in danh_sach_anh)
    if not has_main and danh_sach_anh:
        danh_sach_anh[0]["LaAnhChinh"] = True

    for item in danh_sach_anh:
        u = item.get("UrlAnh") or item.get("url") or req.UrlAnh or f"/plants/{req.MaLoaiCay}.jpg"
        if not u:
            continue
        is_main = bool(item.get("LaAnhChinh") or item.get("isMain"))
        cursor.execute("SELECT ISNULL(MAX(MAANH), 0) + 1 FROM HINH_ANH_SAN_PHAM")
        ma_anh = cursor.fetchone()[0]
        cursor.execute("""
            INSERT INTO HINH_ANH_SAN_PHAM (MAANH, MASANPHAM, URLANH, LAANHCHINH)
            VALUES (?, ?, ?, ?)
        """, (ma_anh, ma_sp, u, 1 if is_main else 0))

    conn.commit()
    conn.close()
    return {"message": "Thêm chậu cây mới thành công", "MaSanPham": ma_sp}

@app.post("/api/admin/loai-cay")
def create_loai_cay(req: CreateSpeciesRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Tìm ID loài cây sinh học tiếp theo (không tính lớp khác #91)
    cursor.execute("""
        SELECT ISNULL(MAX(MALOAICAY), 90) FROM LOAI_CAY 
        WHERE MALOAICAY != 91 AND TENTHUONGGOI NOT LIKE N'%Lớp khác%'
    """)
    current_max = cursor.fetchone()[0]
    next_id = current_max + 1

    # Nếu Lớp khác có ID trùng hoặc nhỏ hơn next_id, tịnh tiến Lớp khác lên next_id + 1
    cursor.execute("SELECT MALOAICAY FROM LOAI_CAY WHERE TENTHUONGGOI LIKE N'%Lớp khác%'")
    row_khac = cursor.fetchone()
    if row_khac:
        old_khac_id = row_khac[0]
        if old_khac_id <= next_id:
            new_khac_id = next_id + 1
            cursor.execute("UPDATE LOAI_CAY SET MALOAICAY = ? WHERE MALOAICAY = ?", (new_khac_id, old_khac_id))

    cursor.execute("""
        INSERT INTO LOAI_CAY (MALOAICAY, MADANHMUC, TENKHOAHOC, TENTHUONGGOI, GIATHAMKHAO, HUONGDANCHAMSOC, DACDIEMNHANDANG, XUATXU, ANHSANG, DOAM, NHIETDO, DOCTINH, PHONGTHUY)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        next_id,
        req.MaDanhMuc or 1,
        req.TenKhoaHoc,
        req.TenThuongGoi,
        req.GiaThamKhao or 180000,
        req.HuongDanChamSoc or "Tưới nước 2-3 lần/tuần, ánh sáng tán xạ 60%",
        req.DacDiemNhanDang or "Lá đẹp khỏe mạnh",
        req.XuatXu or "Nhiệt đới",
        req.AnhSang or "Tán xạ 60%",
        req.DoAm or "70%",
        req.NhietDo or "25°C",
        req.DocTinh or "Không ăn được",
        req.PhongThuy or "Hút tài lộc, may mắn"
    ))

    # Cập nhật bộ nhớ class_mapping
    if "class_mapping" in globals() and isinstance(class_mapping, dict):
        class_mapping[next_id - 1] = {
            "class_index": next_id - 1,
            "MaLoaiCay": next_id,
            "scientific_name": req.TenKhoaHoc,
            "vietnamese_name": req.TenThuongGoi
        }

    conn.commit()
    conn.close()
    return {
        "message": f"Đã thêm loài cây #{next_id} ({req.TenThuongGoi}) thành công! Lớp Out-of-Distribution (Khác) tự động tịnh tiến lên #{next_id + 1}.",
        "MaLoaiCay": next_id,
        "TenThuongGoi": req.TenThuongGoi,
        "TenKhoaHoc": req.TenKhoaHoc
    }

@app.delete("/api/admin/san-pham/{ma_san_pham}")
def delete_san_pham(ma_san_pham: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(1) FROM CHI_TIET_DON_HANG WHERE MASANPHAM = ?", (ma_san_pham,))
    order_count = cursor.fetchone()[0]

    if order_count > 0:
        cursor.execute("UPDATE SAN_PHAM SET SOLUONGTONKHO = 0 WHERE MASANPHAM = ?", (ma_san_pham,))
        conn.commit()
        conn.close()
        return {
            "message": f"Chậu cây #{ma_san_pham} đã có trong {order_count} đơn hàng của khách! Hệ thống đã tự động chuyển tồn kho về 0 (Ngưng bán) để bảo toàn dữ liệu lịch sử hóa đơn.",
            "MaSanPham": ma_san_pham,
            "daNgungBan": True
        }

    cursor.execute("DELETE FROM DANH_GIA_SAN_PHAM WHERE MASANPHAM = ?", (ma_san_pham,))
    cursor.execute("DELETE FROM HINH_ANH_SAN_PHAM WHERE MASANPHAM = ?", (ma_san_pham,))
    cursor.execute("DELETE FROM LICH_SU_GIA_SAN_PHAM WHERE MASANPHAM = ?", (ma_san_pham,))
    cursor.execute("DELETE FROM SAN_PHAM WHERE MASANPHAM = ?", (ma_san_pham,))
    conn.commit()
    conn.close()
    return {"message": "Đã xóa chậu cây thành công khỏi hệ thống", "MaSanPham": ma_san_pham}

# =====================================================================
# 5. XÁC THỰC NGƯỜI DÙNG (NGUOI_DUNG)
# =====================================================================
class LoginRequest(BaseModel):
    taiKhoan: str
    matKhau: str

class RegisterRequest(BaseModel):
    taiKhoan: str
    matKhau: str
    hoTen: Optional[str] = None
    email: Optional[str] = None
    diaChi: Optional[str] = None

@app.post("/api/auth/dang-nhap")
def login_user(req: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT MANGUOIDUNG, TAIKHOAN, MATKHAU, HOTEN, EMAIL, DIACHI, VAITRO, TRANGTHAITAIKHOAN
        FROM NGUOI_DUNG
        WHERE LOWER(TAIKHOAN) = LOWER(?)
    """, (req.taiKhoan.strip(),))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Tài khoản không tồn tại trên hệ thống!")

    manguoidung, taikhoan, matkhau, hoten, email, diachi, vaitro, trangthai = row

    if trangthai and str(trangthai).strip().lower() == 'khoa':
        raise HTTPException(status_code=403, detail="Tài khoản này hiện đang bị khóa! Vui lòng liên hệ quản trị viên.")

    if str(matkhau) != req.matKhau:
        raise HTTPException(status_code=401, detail="Mật khẩu không chính xác!")

    role = "ADMIN" if (vaitro and str(vaitro).strip().lower() == "admin") else "USER"

    return {
        "id": manguoidung,
        "username": taikhoan,
        "fullName": hoten or taikhoan,
        "email": email or "",
        "address": diachi or "",
        "role": role,
        "status": trangthai
    }

@app.post("/api/auth/dang-ky")
def register_user(req: RegisterRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT MANGUOIDUNG FROM NGUOI_DUNG WHERE LOWER(TAIKHOAN) = LOWER(?)", (req.taiKhoan.strip(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Tên tài khoản đã tồn tại, vui lòng chọn tên khác!")

    cursor.execute("SELECT ISNULL(MAX(MANGUOIDUNG), 0) + 1 FROM NGUOI_DUNG")
    next_id = cursor.fetchone()[0]

    cursor.execute("""
        INSERT INTO NGUOI_DUNG (MANGUOIDUNG, TAIKHOAN, MATKHAU, HOTEN, EMAIL, DIACHI, VAITRO, TRANGTHAITAIKHOAN, NGAYDANGKY)
        VALUES (?, ?, ?, ?, ?, ?, 'KhachHang', N'HoatDong', GETDATE())
    """, (next_id, req.taiKhoan.strip(), req.matKhau, req.hoTen or req.taiKhoan.strip(), req.email or "", req.diaChi or ""))

    conn.commit()
    conn.close()

    return {
        "id": next_id,
        "username": req.taiKhoan.strip(),
        "fullName": req.hoTen or req.taiKhoan.strip(),
        "email": req.email or "",
        "address": req.diaChi or "",
        "role": "USER",
        "status": "HoatDong"
    }

class UpdateUserRequest(BaseModel):
    hoTen: Optional[str] = None
    email: Optional[str] = None
    diaChi: Optional[str] = None
    matKhau: Optional[str] = None

@app.put("/api/nguoi-dung/{user_identifier}")
def update_user_profile(user_identifier: str, req: UpdateUserRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    if user_identifier.isdigit():
        cursor.execute("SELECT MANGUOIDUNG FROM NGUOI_DUNG WHERE MANGUOIDUNG = ?", (int(user_identifier),))
    else:
        cursor.execute("SELECT MANGUOIDUNG FROM NGUOI_DUNG WHERE LOWER(TAIKHOAN) = LOWER(?)", (user_identifier.strip(),))

    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng trong CSDL!")

    uid = row[0]
    if req.hoTen is not None:
        cursor.execute("UPDATE NGUOI_DUNG SET HOTEN = ? WHERE MANGUOIDUNG = ?", (req.hoTen, uid))
    if req.email is not None:
        cursor.execute("UPDATE NGUOI_DUNG SET EMAIL = ? WHERE MANGUOIDUNG = ?", (req.email, uid))
    if req.diaChi is not None:
        cursor.execute("UPDATE NGUOI_DUNG SET DIACHI = ? WHERE MANGUOIDUNG = ?", (req.diaChi, uid))
    if req.matKhau is not None and req.matKhau.strip():
        cursor.execute("UPDATE NGUOI_DUNG SET MATKHAU = ? WHERE MANGUOIDUNG = ?", (req.matKhau.strip(), uid))

    conn.commit()
    conn.close()
    return {"message": "Cập nhật thông tin thành công!", "id": uid}

# =====================================================================
# 5. TẢI TRỰC TIẾP ANDROID APK & PHỤC VỤ GIAO DIỆN WEB TRÊN CÙNG TUNNEL
# =====================================================================
from fastapi.responses import FileResponse

APK_FILE_PATH = r"E:\CNTT\NLCNHTTT\03_Ung_Dung_Android_APK\KiengLaAI_app-debug.apk"
FRONTEND_DIST_DIR = r"E:\CNTT\NLCNHTTT\frontend-kieng-la\dist"

@app.get("/tai-apk")
def download_android_apk():
    if os.path.exists(APK_FILE_PATH):
        return FileResponse(
            APK_FILE_PATH,
            media_type="application/vnd.android.package-archive",
            filename="KiengLaAI.apk"
        )
    raise HTTPException(status_code=404, detail="Chưa tìm thấy file APK")

if os.path.exists(FRONTEND_DIST_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST_DIR, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)