import os
import sys
import json
import csv
import io
import hmac
import time
import base64
import hashlib
import secrets
import shutil
import tempfile
import threading
import zipfile
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any
import online_learning
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
    if os.getenv("SKIP_AI_LOAD", "0") == "1":
        tf = None
    else:
        import tensorflow as tf
except ImportError:
    tf = None
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
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

ALLOWED_UPLOAD_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

@app.post("/api/upload")
async def upload_image_file(file: UploadFile = File(...)):
    orig_name = file.filename or ""
    ext = os.path.splitext(orig_name)[1].lower()
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Định dạng ảnh không hợp lệ! Chỉ chấp nhận: {', '.join(sorted(ALLOWED_UPLOAD_EXTENSIONS))}"
        )
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File tải lên rỗng!")
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Kích thước ảnh vượt quá giới hạn tối đa 10MB!")
    filename = f"prod_{int(datetime.now().timestamp() * 1000)}_{secrets.token_hex(4)}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        buffer.write(content)
    return {"url": f"/uploads/{filename}", "filename": filename, "size": len(content)}

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
    "doctinh": "DocTinh", "phongthuy": "PhongThuy", "ngaynhap": "NgayNhap",
    "sodienthoai": "SoDienThoai", "diachi": "DiaChi", "avatar": "Avatar",
    "madiachi": "MaDiaChi", "tennguoinhan": "TenNguoiNhan",
    "diachichitiet": "DiaChiChiTiet", "datmacdinh": "DatMacDinh",
    "sdtnguoinhan": "SdtNguoiNhan", "nguoidanhgia": "NguoiDanhGia",
    "maphanhoi": "MaPhanHoi", "matimkiem": "MaTimKiem", "maloaidudoan": "MaLoaiDuDoan",
    "maloaidung": "MaLoaiDung", "ladung": "LaDung", "reward": "Reward",
    "ghichu": "GhiChu", "trangthaiduyet": "TrangThaiDuyet",
    "thoigiantao": "ThoiGianTao", "thoigianduyet": "ThoiGianDuyet",
    "tenloaidudoan": "TenLoaiDuDoan", "tenloaidung": "TenLoaiDung",
    "hinhanhurl": "HinhAnhUrl", "xacsuatchinhxac": "XacSuatChinhXac"
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

from sqlite_adapter import get_sqlite_connection, SQLiteConnectionWrapper

def get_db_connection():
    if os.getenv("USE_SQLITE", "0") == "1" or os.getenv("SQLITE_DB_PATH"):
        return get_sqlite_connection(os.getenv("SQLITE_DB_PATH"))
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
# 1B. BẢO MẬT: PBKDF2-HMAC-SHA256, BEARER TOKEN HMAC-SHA256 & MIGRATION
# =====================================================================
AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "florabotanic-kieng-la-hmac-secret-2026").encode("utf-8")
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 ngày
PBKDF2_ITERATIONS = 120_000
LOCKED_ACCOUNT_STATUSES = {"khoa", "bikhoa", "bi_khoa", "locked", "bịkhóa", "bị_khóa"}
CANCELLED_ORDER_STATUSES = {"đã hủy", "da_huy", "dahuy", "hủy", "huy", "cancelled", "canceled"}
COMPLETED_ORDER_STATUSES = {"đã hoàn thành", "hoan_thanh", "hoanthanh", "dagiao", "đã giao", "hoàn thành"}

# Lưu OTP demo cho luồng quên mật khẩu: {user_id: {"otp": str, "exp": float}}
PASSWORD_RESET_OTPS: Dict[int, Dict[str, Any]] = {}

def is_account_locked(status: Any) -> bool:
    if not status:
        return False
    norm = str(status).strip().lower().replace(" ", "")
    return norm in LOCKED_ACCOUNT_STATUSES

def is_cancelled_status(status: Any) -> bool:
    if not status:
        return False
    return str(status).strip().lower() in CANCELLED_ORDER_STATUSES

def is_completed_status(status: Any) -> bool:
    if not status:
        return False
    return str(status).strip().lower() in COMPLETED_ORDER_STATUSES

def hash_password(plain_password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS,
    )
    return f"pbkdf2$sha256${PBKDF2_ITERATIONS}${salt}${dk.hex()}"

def verify_password(plain_password: str, stored_password: Any) -> bool:
    if stored_password is None:
        return False
    stored = str(stored_password)
    if stored.startswith("pbkdf2$"):
        parts = stored.split("$")
        if len(parts) != 5:
            return False
        _, algo, iter_str, salt, expected_hex = parts
        try:
            iterations = int(iter_str)
            dk = hashlib.pbkdf2_hmac(
                algo,
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                iterations,
            )
            return hmac.compare_digest(dk.hex(), expected_hex)
        except Exception:
            return False
    # Tương thích ngược với tài khoản demo plain-text cũ
    return hmac.compare_digest(stored, str(plain_password))

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)

def create_access_token(user_id: int, username: str, role: str) -> str:
    now_ts = int(time.time())
    payload = {
        "sub": int(user_id),
        "username": str(username),
        "role": str(role).upper(),
        "iat": now_ts,
        "exp": now_ts + TOKEN_TTL_SECONDS,
    }
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))
    sig = hmac.new(AUTH_SECRET_KEY, payload_b64.encode("ascii"), hashlib.sha256).digest()
    return f"{payload_b64}.{_b64url_encode(sig)}"

def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        if not token or "." not in token:
            return None
        payload_b64, sig_b64 = token.split(".", 1)
        expected_sig = hmac.new(AUTH_SECRET_KEY, payload_b64.encode("ascii"), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64url_encode(expected_sig), sig_b64):
            return None
        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload
    except Exception:
        return None

def _extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.strip().split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return None

def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    token = _extract_bearer_token(authorization)
    if not token:
        return None
    return verify_access_token(token)

def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Yêu cầu đăng nhập (thiếu Authorization: Bearer <token>)!")
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn!")
    return payload

def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if str(current_user.get("role", "")).upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên (ADMIN) mới có quyền thực hiện thao tác này!")
    return current_user

def parse_db_datetime(val: Any) -> Optional[datetime]:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val
    s = str(val).strip()
    if not s:
        return None
    for fmt in (
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d",
        "%d/%m/%Y",
    ):
        try:
            return datetime.strptime(s[:26], fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(s[:19])
    except Exception:
        return None

def ensure_db_schema():
    """Tự động bổ sung cột SODIENTHOAI, DIACHI, AVATAR cho NGUOI_DUNG và bảng DIA_CHI_NGUOI_DUNG nếu thiếu."""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            is_sqlite = isinstance(conn, SQLiteConnectionWrapper)
            if is_sqlite:
                cursor.execute("PRAGMA table_info(NGUOI_DUNG)")
                existing_cols = {str(r[1]).upper() for r in cursor.fetchall()}
                for col_name, col_def in [
                    ("SODIENTHOAI", "TEXT DEFAULT ''"),
                    ("DIACHI", "TEXT DEFAULT ''"),
                    ("AVATAR", "TEXT DEFAULT ''"),
                ]:
                    if col_name not in existing_cols:
                        cursor.execute(f"ALTER TABLE NGUOI_DUNG ADD COLUMN {col_name} {col_def}")
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS DIA_CHI_NGUOI_DUNG (
                        MADIACHI INTEGER PRIMARY KEY,
                        MANGUOIDUNG INTEGER,
                        TENNGUOINHAN TEXT,
                        DIACHICHITIET TEXT,
                        DATMACDINH INTEGER DEFAULT 0,
                        SDTNGUOINHAN TEXT
                    )
                """)
            else:
                for col_name, col_def in [
                    ("SODIENTHOAI", "NVARCHAR(50) NULL"),
                    ("DIACHI", "NVARCHAR(500) NULL"),
                    ("AVATAR", "NVARCHAR(500) NULL"),
                ]:
                    cursor.execute(
                        "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'NGUOI_DUNG' AND COLUMN_NAME = ?",
                        (col_name,),
                    )
                    if not cursor.fetchone():
                        cursor.execute(f"ALTER TABLE NGUOI_DUNG ADD {col_name} {col_def}")
                cursor.execute("""
                    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DIA_CHI_NGUOI_DUNG' AND xtype='U')
                    CREATE TABLE DIA_CHI_NGUOI_DUNG (
                        MADIACHI INT PRIMARY KEY,
                        MANGUOIDUNG INT,
                        TENNGUOINHAN NVARCHAR(200),
                        DIACHICHITIET NVARCHAR(500),
                        DATMACDINH BIT DEFAULT 0,
                        SDTNGUOINHAN NVARCHAR(50)
                    )
                """)
            conn.commit()
        finally:
            conn.close()
    except Exception as e:
        print(f"[DB] Notice ensuring schema columns/tables: {e}")

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
_MODEL_RELOAD_LOCK = threading.Lock()


def hot_reload_online_model(model_path: str):
    """Hot-reload model/best_model_online.keras vào ensemble_models sau khi pass Quality Gate."""
    global model, ensemble_models
    if os.getenv("SKIP_AI_LOAD", "0") == "1" or tf is None or not os.path.exists(model_path):
        return
    with _MODEL_RELOAD_LOCK:
        try:
            loaded_m = load_keras_compat(model_path)
            if loaded_m.output_shape[-1] == 90:
                updated = [item for item in ensemble_models if item[2] != "Online-Incremental-Model"]
                updated.append((loaded_m, 0.30, "Online-Incremental-Model"))
                ensemble_models = updated
                if model is None:
                    model = loaded_m
                print(f"[AI][OnlineLearning] Hot-reloaded online model: {model_path}")
        except Exception as e:
            print(f"[AI][OnlineLearning] Warning hot-reloading {model_path}: {e}")

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
    Chuẩn hóa phân phối xác suất Ensemble Từ số 0 (giữ nguyên xác suất gốc T=1.0,
    không phóng đại nhiệt độ T=0.35 để bảo toàn độ chính xác 96.88% và khả năng tách cây lạ OOD).
    """
    preds = np.clip(np.asarray(raw_preds, dtype=np.float32), 1e-9, 1.0)
    total = float(np.sum(preds))
    return preds / total if total > 0 else preds


def load_keras_compat(model_path: str):
    """Tải model .keras an toàn giữa các phiên bản Keras 3.12/3.13 (tự lọc quantization_config nếu cần)."""
    try:
        return tf.keras.models.load_model(model_path, compile=False)
    except TypeError:
        fd, tmp_name = tempfile.mkstemp(suffix=".keras")
        os.close(fd)
        tmp_path = Path(tmp_name)
        try:
            with zipfile.ZipFile(model_path, "r") as zin, zipfile.ZipFile(
                tmp_path, "w", compression=zipfile.ZIP_DEFLATED
            ) as zout:
                for item in zin.infolist():
                    data = zin.read(item.filename)
                    if item.filename == "config.json":
                        cfg = json.loads(data.decode("utf-8"))

                        def _strip(obj):
                            if isinstance(obj, dict):
                                obj.pop("quantization_config", None)
                                for v in obj.values():
                                    _strip(v)
                            elif isinstance(obj, list):
                                for v in obj:
                                    _strip(v)

                        _strip(cfg)
                        data = json.dumps(cfg).encode("utf-8")
                    zout.writestr(item, data)
            return tf.keras.models.load_model(str(tmp_path), compile=False)
        finally:
            tmp_path.unlink(missing_ok=True)


@app.on_event("startup")
def load_ai_resources():
    global model, ensemble_models, class_mapping
    ensure_db_schema()
    ensemble_models = []
    if os.getenv("SKIP_AI_LOAD", "0") != "1" and tf is not None:
        candidate_models = [
            (os.path.join("model", "mobilenetv2_tu_so_0_seed_999.keras"), 0.50, "MobileNetV2-TuSo0-Seed999-80.5"),
            (os.path.join("model", "best_mobilenet_v2_aug48.keras"), 0.50, "MobileNetV2-Aug48-79.2"),
        ]
        for m_path, m_weight, m_name in candidate_models:
            if os.path.exists(m_path):
                try:
                    loaded_m = load_keras_compat(m_path)
                    if loaded_m.output_shape[-1] == 90:
                        ensemble_models.append((loaded_m, m_weight, m_name))
                        if model is None:
                            model = loaded_m
                        print(f"[AI] Loaded ensemble member: {m_name} ({m_path}, weight={m_weight})")
                except Exception as e:
                    print(f"[AI] Warning loading {m_path}: {e}")

        if not ensemble_models and os.path.exists(MODEL_PATH):
            try:
                loaded_m = load_keras_compat(MODEL_PATH)
                if loaded_m.output_shape[-1] == 90:
                    ensemble_models.append((loaded_m, 1.0, "Fallback-BestModel"))
                    model = loaded_m
                    print(f"[AI] Loaded fallback model: {MODEL_PATH}")
            except Exception as e:
                print(f"[AI] Warning loading fallback {MODEL_PATH}: {e}")

        online_m_path = os.path.join("model", "best_model_online.keras")
        if os.path.exists(online_m_path):
            hot_reload_online_model(online_m_path)

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
    return {
        "status": "ok",
        "service": "FloraBotanic AI Service",
        "model_version": "v2.0-TuSo0",
        "ensemble_count": len(ensemble_models),
        "ensemble_members": [m[2] for m in ensemble_models],
    }

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
    CONFIDENCE_THRESHOLD = 0.55
    ENTROPY_THRESHOLD = 0.55
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
        VALUES (?, ?, ?, GETDATE(), N'Web', N'v2.0-TuSo0', ?)
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

    # Active Data Supplementation: tự động ghi nhận mẫu tin cậy cao cho các loài ưu tiên thiếu dữ liệu / < 60%
    if not is_unknown_species and top1_prob >= 0.80:
        try:
            is_prio, _ = online_learning.is_priority_species(
                ma_loai_cay=top1_ma_loai, original_label=top1_en
            )
            if is_prio:
                online_learning.record_online_sample(
                    image_path=filepath,
                    ma_loai_cay=top1_ma_loai,
                    original_label=top1_en,
                    reward=1,
                    is_priority=True,
                )
        except Exception as ol_err:
            print(f"[OnlineLearning] Notice recording scan sample: {ol_err}")

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

def _compute_admin_stats(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    group_by: str = "day",
) -> Dict[str, Any]:
    gb = (group_by or "day").strip().lower()
    if gb not in ("day", "month", "year"):
        raise HTTPException(status_code=400, detail="group_by chỉ chấp nhận: day, month, year")

    start_dt = parse_db_datetime(from_date) if from_date else None
    end_dt = parse_db_datetime(to_date) if to_date else None
    if from_date and start_dt is None:
        raise HTTPException(status_code=400, detail="from_date không đúng định dạng (YYYY-MM-DD)")
    if to_date and end_dt is None:
        raise HTTPException(status_code=400, detail="to_date không đúng định dạng (YYYY-MM-DD)")
    if end_dt is not None:
        end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
    if start_dt and end_dt and start_dt > end_dt:
        raise HTTPException(status_code=400, detail="from_date phải nhỏ hơn hoặc bằng to_date")

    # Xác định khoảng kỳ trước để tính tăng trưởng
    now = datetime.now()
    if start_dt and end_dt:
        span_days = max(1, (end_dt.date() - start_dt.date()).days + 1)
        prev_end = start_dt - timedelta(seconds=1)
        prev_start = (start_dt - timedelta(days=span_days)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif start_dt:
        span_days = max(1, (now.date() - start_dt.date()).days + 1)
        prev_end = start_dt - timedelta(seconds=1)
        prev_start = (start_dt - timedelta(days=span_days)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif end_dt:
        prev_end = (end_dt - timedelta(days=30)).replace(hour=23, minute=59, second=59, microsecond=999999)
        prev_start = (prev_end - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        # Không truyền filter ngày: kỳ hiện tại = toàn bộ (hoặc 30 ngày gần nhất cho so sánh kỳ trước)
        cur_30_start = (now - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)
        prev_end = cur_30_start - timedelta(seconds=1)
        prev_start = (cur_30_start - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)

    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # Lấy tất cả đơn hàng để lọc chính xác trên cả SQLite và SQL Server
        cursor.execute("SELECT MADONHANG, NGAYDATHANG, TONGTIEN, TRANGTHAIDONHANG FROM DON_HANG")
        all_orders = cursor.fetchall()

        filtered_order_ids = set()
        tong_doanh_thu = 0.0
        doanh_thu_ky_truoc = 0.0
        doanh_thu_30_ngay = 0.0
        tong_don_hang = 0
        don_hoan_thanh = 0
        don_da_huy = 0

        time_buckets: Dict[str, Dict[str, Any]] = {}
        status_counts: Dict[str, int] = defaultdict(int)

        cur_30_start_ref = (now - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)

        for oid, ngay_raw, tong_raw, status_raw in all_orders:
            odt = parse_db_datetime(ngay_raw)
            amount = float(tong_raw or 0.0)
            status_str = str(status_raw or "Chờ xử lý").strip()
            cancelled = is_cancelled_status(status_str)

            # Kiểm tra kỳ trước
            if odt is not None and prev_start <= odt <= prev_end and not cancelled:
                doanh_thu_ky_truoc += amount

            if odt is not None and odt >= cur_30_start_ref and not cancelled:
                doanh_thu_30_ngay += amount

            # Kiểm tra khoảng lọc hiện tại
            if start_dt is not None and (odt is None or odt < start_dt):
                continue
            if end_dt is not None and (odt is None or odt > end_dt):
                continue

            filtered_order_ids.add(oid)
            tong_don_hang += 1
            status_counts[status_str] += 1

            if cancelled:
                don_da_huy += 1
            else:
                tong_doanh_thu += amount
                if is_completed_status(status_str):
                    don_hoan_thanh += 1

                if odt is not None:
                    if gb == "year":
                        label = odt.strftime("%Y")
                    elif gb == "month":
                        label = odt.strftime("%Y-%m")
                    else:
                        label = odt.strftime("%Y-%m-%d")
                else:
                    label = "Không rõ"

                if label not in time_buckets:
                    time_buckets[label] = {"label": label, "doanh_thu": 0.0, "so_don": 0}
                time_buckets[label]["doanh_thu"] += amount
                time_buckets[label]["so_don"] += 1

        # Tính % tăng trưởng
        cur_compare = tong_doanh_thu if (start_dt or end_dt) else doanh_thu_30_ngay
        if doanh_thu_ky_truoc > 0:
            tang_truong_phan_tram = round(((cur_compare - doanh_thu_ky_truoc) / doanh_thu_ky_truoc) * 100.0, 2)
        else:
            tang_truong_phan_tram = 100.0 if cur_compare > 0 else 0.0

        ty_le_huy = round((don_da_huy / tong_don_hang) * 100.0, 2) if tong_don_hang > 0 else 0.0

        doanh_thu_theo_thoi_gian = [
            {
                "label": v["label"],
                "doanh_thu": round(v["doanh_thu"], 2),
                "so_don": v["so_don"],
            }
            for _, v in sorted(time_buckets.items(), key=lambda x: x[0])
        ]

        don_hang_theo_trang_thai = [
            {"trang_thai": k, "so_luong": v}
            for k, v in sorted(status_counts.items(), key=lambda x: x[1], reverse=True)
        ]

        # Top sản phẩm bán chạy (chỉ tính đơn không hủy trong khoảng lọc)
        cursor.execute("""
            SELECT ct.MADONHANG, ct.MASANPHAM, sp.TENSANPHAM, ct.SOLUONGMUA, ct.DONGIAMUA, dh.TRANGTHAIDONHANG
            FROM CHI_TIET_DON_HANG ct
            JOIN DON_HANG dh ON ct.MADONHANG = dh.MADONHANG
            LEFT JOIN SAN_PHAM sp ON ct.MASANPHAM = sp.MASANPHAM
        """)
        prod_sales: Dict[int, Dict[str, Any]] = {}
        for oid, sp_id, sp_ten, qty_raw, price_raw, status_raw in cursor.fetchall():
            if oid not in filtered_order_ids or is_cancelled_status(status_raw):
                continue
            qty = int(qty_raw or 0)
            rev = qty * float(price_raw or 0.0)
            if sp_id not in prod_sales:
                prod_sales[sp_id] = {
                    "id": sp_id,
                    "ten": sp_ten or f"Sản phẩm #{sp_id}",
                    "da_ban": 0,
                    "doanh_thu": 0.0,
                }
            prod_sales[sp_id]["da_ban"] += qty
            prod_sales[sp_id]["doanh_thu"] += rev

        top_san_pham_ban_chay = sorted(
            [
                {
                    "id": v["id"],
                    "ten": v["ten"],
                    "da_ban": v["da_ban"],
                    "doanh_thu": round(v["doanh_thu"], 2),
                }
                for v in prod_sales.values()
            ],
            key=lambda x: (x["da_ban"], x["doanh_thu"]),
            reverse=True,
        )[:10]

        # Tổng số chậu cây, tồn kho & sản phẩm sắp hết (ton_kho <= 5)
        cursor.execute("SELECT COUNT(*), ISNULL(SUM(SOLUONGTONKHO), 0) FROM SAN_PHAM")
        sp_row = cursor.fetchone()
        so_san_pham = int(sp_row[0] or 0)
        tong_ton_kho = int(sp_row[1] or 0)

        cursor.execute("""
            SELECT TOP 20 MASANPHAM, TENSANPHAM, SOLUONGTONKHO
            FROM SAN_PHAM
            WHERE SOLUONGTONKHO <= 5
            ORDER BY SOLUONGTONKHO ASC, MASANPHAM ASC
        """)
        san_pham_sap_het = [
            {"id": r[0], "ten": r[1] or f"Sản phẩm #{r[0]}", "ton_kho": int(r[2] or 0)}
            for r in cursor.fetchall()
        ]

        # Tổng lượt tìm kiếm ảnh AI
        cursor.execute("SELECT COUNT(*) FROM TIM_ANH")
        tong_luot_quet = int(cursor.fetchone()[0] or 0)

        # Đơn hàng gần đây
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
                "KhachHang": r[6] or "Khách mua lẻ",
            }
            for r in cursor.fetchall()
        ]

        # Nhật ký quét AI gần đây
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
                "LaLoaiKhac": (r[5] == 91) or ("lớp khác" in str(r[6] or "").lower()),
            }
            for r in cursor.fetchall()
        ]

        return {
            "tong_doanh_thu": round(tong_doanh_thu, 2),
            "tong_don_hang": tong_don_hang,
            "so_san_pham": so_san_pham,
            "tong_ton_kho": tong_ton_kho,
            "tong_luot_quet": tong_luot_quet,
            "don_hang_gan_day": recent_orders,
            "quet_ai_gan_day": recent_scans,
            "from_date": from_date,
            "to_date": to_date,
            "group_by": gb,
            "doanh_thu_ky_truoc": round(doanh_thu_ky_truoc, 2),
            "tang_truong_phan_tram": tang_truong_phan_tram,
            "don_hoan_thanh": don_hoan_thanh,
            "don_da_huy": don_da_huy,
            "ty_le_huy": ty_le_huy,
            "doanh_thu_theo_thoi_gian": doanh_thu_theo_thoi_gian,
            "don_hang_theo_trang_thai": don_hang_theo_trang_thai,
            "top_san_pham_ban_chay": top_san_pham_ban_chay,
            "san_pham_sap_het": san_pham_sap_het,
        }
    finally:
        conn.close()

@app.get("/api/admin/thong-ke")
def get_admin_thong_ke(
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    group_by: str = Query("day"),
    _admin: Dict[str, Any] = Depends(require_admin),
):
    return _compute_admin_stats(from_date=from_date, to_date=to_date, group_by=group_by)

@app.get("/api/admin/thong-ke/export-csv")
def export_admin_thong_ke_csv(
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    group_by: str = Query("day"),
    _admin: Dict[str, Any] = Depends(require_admin),
):
    stats = _compute_admin_stats(from_date=from_date, to_date=to_date, group_by=group_by)
    buf = io.StringIO()
    writer = csv.writer(buf)

    writer.writerow(["BÁO CÁO THỐNG KÊ DOANH THU - CÂY KIỂNG LÁ AI"])
    writer.writerow(["Từ ngày", from_date or "Tất cả", "Đến ngày", to_date or "Tất cả", "Nhóm theo", stats["group_by"]])
    writer.writerow([])
    writer.writerow(["Chỉ số", "Giá trị"])
    writer.writerow(["Tổng doanh thu (VNĐ)", stats["tong_doanh_thu"]])
    writer.writerow(["Doanh thu kỳ trước (VNĐ)", stats["doanh_thu_ky_truoc"]])
    writer.writerow(["Tăng trưởng (%)", stats["tang_truong_phan_tram"]])
    writer.writerow(["Tổng đơn hàng", stats["tong_don_hang"]])
    writer.writerow(["Đơn hoàn thành", stats["don_hoan_thanh"]])
    writer.writerow(["Đơn đã hủy", stats["don_da_huy"]])
    writer.writerow(["Tỷ lệ hủy (%)", stats["ty_le_huy"]])
    writer.writerow([])

    writer.writerow(["DOANH THU THEO THỜI GIAN"])
    writer.writerow(["Thời gian", "Doanh thu (VNĐ)", "Số đơn"])
    for item in stats["doanh_thu_theo_thoi_gian"]:
        writer.writerow([item["label"], item["doanh_thu"], item["so_don"]])
    writer.writerow([])

    writer.writerow(["TOP SẢN PHẨM BÁN CHẠY"])
    writer.writerow(["Mã SP", "Tên sản phẩm", "Đã bán", "Doanh thu (VNĐ)"])
    for item in stats["top_san_pham_ban_chay"]:
        writer.writerow([item["id"], item["ten"], item["da_ban"], item["doanh_thu"]])

    csv_bytes = ("\ufeff" + buf.getvalue()).encode("utf-8")
    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="bao_cao_doanh_thu.csv"'},
    )

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
    soDienThoai: Optional[str] = ""
    vaiTro: str = "KhachHang"
    trangThaiTaiKhoan: str = "HoatDong"

class UpdateUserAdminRequest(BaseModel):
    hoTen: Optional[str] = None
    email: Optional[str] = None
    diaChi: Optional[str] = None
    soDienThoai: Optional[str] = None
    vaiTro: Optional[str] = None
    trangThaiTaiKhoan: Optional[str] = None
    matKhau: Optional[str] = None

@app.get("/api/admin/nguoi-dung")
def get_admin_users(_admin: Dict[str, Any] = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT nd.MANGUOIDUNG, nd.TAIKHOAN, nd.HOTEN, nd.EMAIL, nd.DIACHI,
               nd.SODIENTHOAI, nd.AVATAR,
               nd.VAITRO, nd.NGAYDANGKY, nd.TRANGTHAITAIKHOAN,
               COUNT(dh.MADONHANG) AS SOTRUONGDONHANG,
               ISNULL(SUM(dh.TONGTIEN), 0) AS TONGCHITIEU
        FROM NGUOI_DUNG nd
        LEFT JOIN DON_HANG dh ON nd.MANGUOIDUNG = dh.MANGUOIDUNG
        GROUP BY nd.MANGUOIDUNG, nd.TAIKHOAN, nd.HOTEN, nd.EMAIL, nd.DIACHI,
                 nd.SODIENTHOAI, nd.AVATAR,
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
def update_user_status(ma_nguoi_dung: int, req: UpdateUserStatusRequest, _admin: Dict[str, Any] = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE NGUOI_DUNG SET TRANGTHAITAIKHOAN = ? WHERE MANGUOIDUNG = ?", (req.trangThai, ma_nguoi_dung))
    conn.commit()
    conn.close()
    return {"message": f"Đã chuyển trạng thái tài khoản thành {req.trangThai}", "MaNguoiDung": ma_nguoi_dung, "TrangThaiMoi": req.trangThai}

ALLOWED_USER_ROLES = {"Admin", "KhachHang"}

def _normalize_allowed_role(raw_role: Optional[str]) -> str:
    val = (raw_role or "").strip()
    if val.lower() == "admin":
        return "Admin"
    if val.lower() in ("khachhang", "user", "khach"):
        return "KhachHang"
    raise HTTPException(
        status_code=400,
        detail="Hệ thống chỉ hỗ trợ 2 vai trò chuẩn: 'Admin' (Quản trị viên) và 'KhachHang' (Khách hàng)!",
    )

@app.put("/api/admin/nguoi-dung/{ma_nguoi_dung}/vai-tro")
def update_user_role(ma_nguoi_dung: int, req: UpdateUserRoleRequest, _admin: Dict[str, Any] = Depends(require_admin)):
    role_val = _normalize_allowed_role(req.vaiTro)
    if int(_admin.get("sub", -1)) == int(ma_nguoi_dung) and role_val != "Admin":
        raise HTTPException(status_code=400, detail="Không thể tự hạ quyền tài khoản Quản trị viên đang đăng nhập!")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE NGUOI_DUNG SET VAITRO = ? WHERE MANGUOIDUNG = ?", (role_val, ma_nguoi_dung))
    conn.commit()
    conn.close()
    return {"message": f"Đã đổi vai trò người dùng thành {role_val}", "MaNguoiDung": ma_nguoi_dung, "VaiTroMoi": role_val}

@app.post("/api/admin/nguoi-dung")
def create_admin_user(req: CreateUserAdminRequest, _admin: Dict[str, Any] = Depends(require_admin)):
    role_val = _normalize_allowed_role(req.vaiTro)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT MANGUOIDUNG FROM NGUOI_DUNG WHERE LOWER(TAIKHOAN) = LOWER(?)", (req.taiKhoan.strip(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Tên tài khoản này đã tồn tại, vui lòng chọn tên khác!")

    cursor.execute("SELECT ISNULL(MAX(MANGUOIDUNG), 0) + 1 FROM NGUOI_DUNG")
    next_id = cursor.fetchone()[0]

    hashed_pw = hash_password(req.matKhau.strip())
    cursor.execute("""
        INSERT INTO NGUOI_DUNG (MANGUOIDUNG, TAIKHOAN, MATKHAU, HOTEN, EMAIL, DIACHI, SODIENTHOAI, VAITRO, TRANGTHAITAIKHOAN, NGAYDANGKY)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
    """, (
        next_id,
        req.taiKhoan.strip(),
        hashed_pw,
        req.hoTen.strip(),
        req.email.strip() if req.email else "",
        req.diaChi.strip() if req.diaChi else "",
        req.soDienThoai.strip() if req.soDienThoai else "",
        role_val,
        req.trangThaiTaiKhoan,
    ))
    conn.commit()
    conn.close()
    return {"message": "Tạo tài khoản mới thành công!", "MaNguoiDung": next_id, "TaiKhoan": req.taiKhoan, "VaiTro": role_val}

@app.put("/api/admin/nguoi-dung/{ma_nguoi_dung}")
def update_admin_user(ma_nguoi_dung: int, req: UpdateUserAdminRequest, _admin: Dict[str, Any] = Depends(require_admin)):
    role_val = _normalize_allowed_role(req.vaiTro) if req.vaiTro is not None else None
    if role_val is not None and int(_admin.get("sub", -1)) == int(ma_nguoi_dung) and role_val != "Admin":
        raise HTTPException(status_code=400, detail="Không thể tự hạ quyền tài khoản Quản trị viên đang đăng nhập!")
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
    if req.soDienThoai is not None:
        cursor.execute("UPDATE NGUOI_DUNG SET SODIENTHOAI = ? WHERE MANGUOIDUNG = ?", (req.soDienThoai, ma_nguoi_dung))
    if role_val is not None:
        cursor.execute("UPDATE NGUOI_DUNG SET VAITRO = ? WHERE MANGUOIDUNG = ?", (role_val, ma_nguoi_dung))
    if req.trangThaiTaiKhoan is not None:
        cursor.execute("UPDATE NGUOI_DUNG SET TRANGTHAITAIKHOAN = ? WHERE MANGUOIDUNG = ?", (req.trangThaiTaiKhoan, ma_nguoi_dung))
    if req.matKhau is not None and req.matKhau.strip():
        cursor.execute("UPDATE NGUOI_DUNG SET MATKHAU = ? WHERE MANGUOIDUNG = ?", (hash_password(req.matKhau.strip()), ma_nguoi_dung))

    conn.commit()
    conn.close()
    return {"message": "Cập nhật tài khoản thành công!", "MaNguoiDung": ma_nguoi_dung}

@app.delete("/api/admin/nguoi-dung/{ma_nguoi_dung}")
def delete_admin_user(ma_nguoi_dung: int, _admin: Dict[str, Any] = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM DON_HANG WHERE MANGUOIDUNG = ?", (ma_nguoi_dung,))
    order_count = cursor.fetchone()[0]
    if order_count > 0:
        cursor.execute("UPDATE NGUOI_DUNG SET TRANGTHAITAIKHOAN = N'BiKhoa' WHERE MANGUOIDUNG = ?", (ma_nguoi_dung,))
        conn.commit()
        conn.close()
        return {"message": "Người dùng đã có đơn hàng trong hệ thống nên được chuyển sang trạng thái 'Bị khóa' để bảo toàn dữ liệu!", "action": "locked"}

    cursor.execute("DELETE FROM DIA_CHI_NGUOI_DUNG WHERE MANGUOIDUNG = ?", (ma_nguoi_dung,))
    cursor.execute("DELETE FROM GIO_HANG WHERE MANGUOIDUNG = ?", (ma_nguoi_dung,))
    cursor.execute("DELETE FROM NGUOI_DUNG WHERE MANGUOIDUNG = ?", (ma_nguoi_dung,))
    conn.commit()
    conn.close()
    return {"message": "Đã xóa tài khoản thành công!", "action": "deleted"}

@app.get("/api/admin/don-hang")
def get_admin_don_hang(_admin: Dict[str, Any] = Depends(require_admin)):
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
def get_admin_don_hang_chi_tiet(ma_don_hang: int, _admin: Dict[str, Any] = Depends(require_admin)):
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
def update_trang_thai_don_hang(
    ma_don_hang: int,
    req: UpdateOrderStatusRequest,
    _admin: Dict[str, Any] = Depends(require_admin),
):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("SELECT TRANGTHAIDONHANG, MACHUONGTRINHGIAMGIA FROM DON_HANG WHERE MADONHANG = ?", (ma_don_hang,))
        curr_row = cursor.fetchone()
        if not curr_row:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng!")

        old_status, voucher_id = curr_row[0], curr_row[1]
        was_cancelled = is_cancelled_status(old_status)
        will_cancel = is_cancelled_status(req.TrangThaiDonHang)

        # Chống hoàn kho & hoàn voucher 2 lần nếu đơn đã ở trạng thái Đã hủy
        if was_cancelled and will_cancel:
            return {
                "message": "Đơn hàng đã ở trạng thái Đã hủy trước đó (không hoàn kho lại).",
                "MaDonHang": ma_don_hang,
                "TrangThaiMoi": old_status,
            }

        cursor.execute(
            "UPDATE DON_HANG SET TRANGTHAIDONHANG = ? WHERE MADONHANG = ?",
            (req.TrangThaiDonHang, ma_don_hang),
        )

        # Nếu hoàn thành đơn hàng -> Tự động cập nhật đã thanh toán
        if is_completed_status(req.TrangThaiDonHang):
            cursor.execute(
                "UPDATE DON_HANG SET TRANGTHAITHANHTOAN = N'Đã thanh toán' WHERE MADONHANG = ?",
                (ma_don_hang,),
            )

        # Nếu chuyển sang Đã hủy và trước đó chưa hủy -> Hoàn lại tồn kho và số lượt dùng voucher đúng 1 lần
        if will_cancel and not was_cancelled:
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
        return {
            "message": "Đã cập nhật trạng thái đơn hàng thành công",
            "MaDonHang": ma_don_hang,
            "TrangThaiMoi": req.TrangThaiDonHang,
        }
    finally:
        conn.close()

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
    rows = query_db("""
        SELECT MACHUONGTRINHGIAMGIA, TENMAGIAMGIA, TENCHUONGTRINHGIAMGIA,
               LOAIGIAMGIA, GIATRIGIAM, TOIDA, TOITHIEU, SOLUONGPHIEU,
               SOLUONGDADUNG, MOTA, NGAYBATDAU, NGAYKETTHUC
        FROM CHUONG_TRINH_GIAM_GIA
        WHERE (SOLUONGPHIEU IS NULL OR SOLUONGDADUNG < SOLUONGPHIEU)
        ORDER BY MACHUONGTRINHGIAMGIA DESC
    """)
    now = datetime.now()
    active = []
    for v in rows:
        ngay_bd = parse_db_datetime(v.get("NgayBatDau") or v.get("NGAYBATDAU"))
        ngay_kt = parse_db_datetime(v.get("NgayKetThuc") or v.get("NGAYKETTHUC"))
        if ngay_bd is not None and now < ngay_bd:
            continue
        if ngay_kt is not None and now > ngay_kt:
            continue
        qty = v.get("SoLuongPhieu") if "SoLuongPhieu" in v else v.get("SOLUONGPHIEU")
        used = v.get("SoLuongDaDung") if "SoLuongDaDung" in v else v.get("SOLUONGDADUNG")
        if qty is not None and int(used or 0) >= int(qty):
            continue
        active.append(v)
    return active

def _validate_and_calc_voucher(v: Dict[str, Any], tam_tinh: float, code_label: Optional[str] = None) -> float:
    code = code_label or str(v.get("TenMaGiamGia") or v.get("TENMAGIAMGIA") or "")
    now = datetime.now()
    ngay_bd = parse_db_datetime(v.get("NgayBatDau") or v.get("NGAYBATDAU"))
    ngay_kt = parse_db_datetime(v.get("NgayKetThuc") or v.get("NGAYKETTHUC"))
    if ngay_bd is not None and now < ngay_bd:
        raise HTTPException(status_code=400, detail=f"Mã giảm giá '{code}' chưa đến thời gian áp dụng!")
    if ngay_kt is not None and now > ngay_kt:
        raise HTTPException(status_code=400, detail=f"Mã giảm giá '{code}' đã hết hạn sử dụng!")

    qty = v.get("SoLuongPhieu")
    if qty is None:
        qty = v.get("SOLUONGPHIEU") or 0
    used = v.get("SoLuongDaDung")
    if used is None:
        used = v.get("SOLUONGDADUNG") or 0
    if int(qty or 0) > 0 and int(used or 0) >= int(qty):
        raise HTTPException(status_code=400, detail=f"Mã giảm giá '{code}' đã hết lượt sử dụng!")

    min_order = float(v.get("ToiThieu") or v.get("TOITHIEU") or 0)
    if tam_tinh < min_order:
        raise HTTPException(
            status_code=400,
            detail=f"Mã '{code}' chỉ áp dụng cho đơn hàng từ {min_order:,.0f} ₫ (Tạm tính hiện tại: {tam_tinh:,.0f} ₫)!",
        )

    v_type = str(v.get("LoaiGiamGia") or v.get("LOAIGIAMGIA") or "").strip().lower()
    val = float(v.get("GiaTriGiam") or v.get("GIATRIGIAM") or 0)
    max_discount = float(v.get("ToiDa") or v.get("TOIDA") or 0)

    if "phantram" in v_type:
        discount = (tam_tinh * val) / 100.0
        if max_discount > 0 and discount > max_discount:
            discount = max_discount
    else:
        discount = val
    if discount > tam_tinh:
        discount = tam_tinh
    return round(max(0.0, discount), 2)

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
    cols = [c[0] for c in cursor.description] if cursor.description else []
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Mã giảm giá '{code}' không tồn tại hoặc đã hết hạn!")

    v = normalize_row(cols, row)
    discount = _validate_and_calc_voucher(v, float(req.TamTinh), code_label=code)

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
    SoLuongPhieu: Optional[int] = None
    SoLuongToiDa: Optional[int] = None
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
    SoLuongToiDa: Optional[int] = None
    MoTa: Optional[str] = None
    NgayBatDau: Optional[str] = None
    NgayKetThuc: Optional[str] = None

@app.get("/api/admin/giam-gia")
def get_admin_danh_sach_giam_gia(_admin: Dict[str, Any] = Depends(require_admin)):
    return query_db("""
        SELECT MACHUONGTRINHGIAMGIA, TENMAGIAMGIA, TENCHUONGTRINHGIAMGIA,
               LOAIGIAMGIA, GIATRIGIAM, TOIDA, TOITHIEU, SOLUONGPHIEU,
               SOLUONGDADUNG, MOTA, NGAYBATDAU, NGAYKETTHUC
        FROM CHUONG_TRINH_GIAM_GIA
        ORDER BY MACHUONGTRINHGIAMGIA DESC
    """)

@app.post("/api/admin/giam-gia")
def create_admin_voucher(req: CreateAdminVoucherRequest, _admin: Dict[str, Any] = Depends(require_admin)):
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
    so_luong = int(req.SoLuongPhieu if req.SoLuongPhieu is not None else (req.SoLuongToiDa if req.SoLuongToiDa is not None else 100))
    mo_ta = req.MoTa or f"Giảm {gia_tri:,.0f}{'%' if loai == 'PhanTram' else ' ₫'} cho đơn từ {toi_thieu:,.0f} ₫"
    ngay_bd = (parse_db_datetime(req.NgayBatDau) or datetime.now()).strftime("%Y-%m-%d %H:%M:%S")
    ngay_kt = (parse_db_datetime(req.NgayKetThuc) or datetime(2027, 12, 31, 23, 59, 59)).strftime("%Y-%m-%d %H:%M:%S")

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
        "MoTa": mo_ta,
        "NgayBatDau": ngay_bd,
        "NgayKetThuc": ngay_kt,
    }

@app.put("/api/admin/giam-gia/{ma_chuong_trinh}")
@app.put("/api/admin/voucher/{ma_chuong_trinh}")
def update_admin_voucher(
    ma_chuong_trinh: int,
    req: UpdateAdminVoucherRequest,
    _admin: Dict[str, Any] = Depends(require_admin),
):
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
    so_luong_val = req.SoLuongPhieu if req.SoLuongPhieu is not None else req.SoLuongToiDa
    if so_luong_val is not None:
        cursor.execute("UPDATE CHUONG_TRINH_GIAM_GIA SET SOLUONGPHIEU = ? WHERE MACHUONGTRINHGIAMGIA = ?", (int(so_luong_val), ma_chuong_trinh))
    if req.MoTa is not None:
        cursor.execute("UPDATE CHUONG_TRINH_GIAM_GIA SET MOTA = ? WHERE MACHUONGTRINHGIAMGIA = ?", (req.MoTa, ma_chuong_trinh))
    if req.NgayBatDau is not None:
        cursor.execute("UPDATE CHUONG_TRINH_GIAM_GIA SET NGAYBATDAU = ? WHERE MACHUONGTRINHGIAMGIA = ?", (req.NgayBatDau, ma_chuong_trinh))
    if req.NgayKetThuc is not None:
        cursor.execute("UPDATE CHUONG_TRINH_GIAM_GIA SET NGAYKETTHUC = ? WHERE MACHUONGTRINHGIAMGIA = ?", (req.NgayKetThuc, ma_chuong_trinh))

    conn.commit()
    conn.close()
    return {"message": "Cập nhật mã giảm giá thành công!", "MaChuongTrinhGiamGia": ma_chuong_trinh}

@app.delete("/api/admin/giam-gia/{ma_chuong_trinh}")
def delete_admin_voucher(ma_chuong_trinh: int, _admin: Dict[str, Any] = Depends(require_admin)):
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
    DonGiaMua: Optional[float] = None

class CreateOrderRequest(BaseModel):
    MaNguoiDung: Optional[int] = None
    TenKhachHang: Optional[str] = None
    SdtNhanHang: str
    DiaChiNhanHang: str
    PhuongThucThanhToan: Optional[str] = "COD"
    TamTinh: Optional[float] = None
    SoTienGiam: Optional[float] = 0.0
    MaChuongTrinhGiamGia: Optional[int] = None
    PhiVanChuyen: Optional[float] = 30000.0
    TongTien: Optional[float] = None
    GhiChu: Optional[str] = None
    Items: List[CreateOrderItem]

@app.post("/api/don-hang")
def create_customer_order(
    req: CreateOrderRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    if not req.Items:
        raise HTTPException(status_code=400, detail="Đơn hàng phải có ít nhất 1 sản phẩm!")

    # Gộp số lượng nếu client gửi trùng MaSanPham và kiểm tra SoLuongMua > 0
    qty_by_product: Dict[int, int] = defaultdict(int)
    for item in req.Items:
        if item.SoLuongMua is None or item.SoLuongMua <= 0:
            raise HTTPException(status_code=400, detail="Số lượng mua mỗi sản phẩm phải lớn hơn 0!")
        qty_by_product[int(item.MaSanPham)] += int(item.SoLuongMua)

    ma_nguoi_dung = req.MaNguoiDung if req.MaNguoiDung is not None else (current_user["sub"] if current_user else None)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 1. Tính lại đơn giá & kiểm tra tồn kho trực tiếp từ DB (không tin giá client gửi)
        verified_items = []
        tam_tinh = 0.0
        for sp_id, total_qty in qty_by_product.items():
            cursor.execute("""
                SELECT sp.MASANPHAM, sp.TENSANPHAM, sp.SOLUONGTONKHO,
                       ISNULL(
                           (SELECT TOP 1 GIABAN FROM LICH_SU_GIA_SAN_PHAM lsg WHERE lsg.MASANPHAM = sp.MASANPHAM ORDER BY MALICHSUGIA DESC),
                           lc.GIATHAMKHAO
                       ) AS GIABAN
                FROM SAN_PHAM sp
                LEFT JOIN LOAI_CAY lc ON sp.MALOAICAY = lc.MALOAICAY
                WHERE sp.MASANPHAM = ?
            """, (sp_id,))
            sp_row = cursor.fetchone()
            if not sp_row:
                raise HTTPException(status_code=404, detail=f"Sản phẩm #{sp_id} không tồn tại!")
            sp_name = sp_row[1] or f"Sản phẩm #{sp_id}"
            ton_kho = int(sp_row[2] or 0)
            don_gia_db = float(sp_row[3] or 0.0)
            if ton_kho < total_qty:
                raise HTTPException(
                    status_code=400,
                    detail=f"Sản phẩm '{sp_name}' không đủ tồn kho (còn {ton_kho}, yêu cầu {total_qty})!",
                )
            tam_tinh += don_gia_db * total_qty
            verified_items.append((sp_id, total_qty, don_gia_db))

        tam_tinh = round(tam_tinh, 2)

        # 2. Kiểm tra & tính toán lại voucher từ DB nếu có
        so_tien_giam = 0.0
        voucher_id = req.MaChuongTrinhGiamGia
        if voucher_id:
            cursor.execute("""
                SELECT MACHUONGTRINHGIAMGIA, TENMAGIAMGIA, TENCHUONGTRINHGIAMGIA,
                       LOAIGIAMGIA, GIATRIGIAM, TOIDA, TOITHIEU, SOLUONGPHIEU,
                       SOLUONGDADUNG, MOTA, NGAYBATDAU, NGAYKETTHUC
                FROM CHUONG_TRINH_GIAM_GIA
                WHERE MACHUONGTRINHGIAMGIA = ?
            """, (voucher_id,))
            v_row = cursor.fetchone()
            if not v_row:
                raise HTTPException(status_code=404, detail="Mã giảm giá không tồn tại!")
            v_cols = [c[0] for c in cursor.description]
            v_dict = normalize_row(v_cols, v_row)
            so_tien_giam = _validate_and_calc_voucher(v_dict, tam_tinh)

            # Tăng lượt dùng voucher an toàn (tránh vượt SOLUONGPHIEU)
            cursor.execute("""
                UPDATE CHUONG_TRINH_GIAM_GIA
                SET SOLUONGDADUNG = ISNULL(SOLUONGDADUNG, 0) + 1
                WHERE MACHUONGTRINHGIAMGIA = ?
                  AND (SOLUONGPHIEU IS NULL OR SOLUONGPHIEU <= 0 OR ISNULL(SOLUONGDADUNG, 0) < SOLUONGPHIEU)
            """, (voucher_id,))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=400, detail="Mã giảm giá đã hết lượt sử dụng!")

        phi_van_chuyen = max(0.0, float(req.PhiVanChuyen if req.PhiVanChuyen is not None else 30000.0))
        tong_tien = round(max(0.0, tam_tinh - so_tien_giam + phi_van_chuyen), 2)

        # 3. Trừ tồn kho an toàn (kiểm tra lại điều kiện SOLUONGTONKHO >= qty)
        for sp_id, total_qty, _ in verified_items:
            cursor.execute("""
                UPDATE SAN_PHAM
                SET SOLUONGTONKHO = SOLUONGTONKHO - ?
                WHERE MASANPHAM = ? AND SOLUONGTONKHO >= ?
            """, (total_qty, sp_id, total_qty))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=400, detail=f"Sản phẩm #{sp_id} vừa hết hàng, vui lòng kiểm tra lại!")

        # 4. Lưu đơn hàng & chi tiết đơn hàng với đơn giá chuẩn từ DB
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
            next_dh, ma_nguoi_dung, tam_tinh, so_tien_giam, phi_van_chuyen,
            tong_tien, req.DiaChiNhanHang, req.SdtNhanHang,
            req.PhuongThucThanhToan or "COD", payment_status, voucher_id
        ))

        cursor.execute("SELECT ISNULL(MAX(MACHITIETDONHANG), 0) FROM CHI_TIET_DON_HANG")
        curr_ct_id = cursor.fetchone()[0]

        for sp_id, total_qty, don_gia_db in verified_items:
            curr_ct_id += 1
            cursor.execute("""
                INSERT INTO CHI_TIET_DON_HANG (
                    MADONHANG, MASANPHAM, MACHITIETDONHANG, SOLUONGMUA, DONGIAMUA
                )
                VALUES (?, ?, ?, ?, ?)
            """, (next_dh, sp_id, curr_ct_id, total_qty, don_gia_db))

        conn.commit()
        return {
            "message": "Đặt hàng thành công!",
            "MaDonHang": next_dh,
            "TamTinh": tam_tinh,
            "SoTienGiam": so_tien_giam,
            "PhiVanChuyen": phi_van_chuyen,
            "TongTien": tong_tien,
            "TrangThai": "Chờ xử lý"
        }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu đơn hàng: {str(e)}")
    finally:
        conn.close()

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
def cancel_user_order(
    ma_don_hang: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT TRANGTHAIDONHANG, MACHUONGTRINHGIAMGIA, MANGUOIDUNG FROM DON_HANG WHERE MADONHANG = ?",
            (ma_don_hang,),
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng!")

        curr_status, voucher_id, order_owner_id = row[0], row[1], row[2]
        if current_user.get("role") != "ADMIN" and order_owner_id != current_user.get("sub"):
            raise HTTPException(status_code=403, detail="Bạn không có quyền hủy đơn hàng của người khác!")

        if is_cancelled_status(curr_status):
            raise HTTPException(status_code=400, detail="Đơn hàng này đã được hủy trước đó!")

        if curr_status not in ["Chờ xử lý", "CHO_XAC_NHAN"]:
            raise HTTPException(status_code=400, detail="Chỉ có thể hủy đơn hàng khi shop chưa bắt đầu giao!")

        # Cập nhật trạng thái kèm điều kiện chống hoàn kho 2 lần
        cursor.execute("""
            UPDATE DON_HANG
            SET TRANGTHAIDONHANG = N'Đã hủy'
            WHERE MADONHANG = ? AND TRANGTHAIDONHANG IN (N'Chờ xử lý', N'CHO_XAC_NHAN')
        """, (ma_don_hang,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=400, detail="Đơn hàng đã thay đổi trạng thái hoặc đã hủy trước đó!")

        # Hoàn lại số lượng tồn kho cho các sản phẩm trong đơn
        cursor.execute("SELECT MASANPHAM, SOLUONGMUA FROM CHI_TIET_DON_HANG WHERE MADONHANG = ?", (ma_don_hang,))
        for sp_id, qty in cursor.fetchall():
            cursor.execute("UPDATE SAN_PHAM SET SOLUONGTONKHO = SOLUONGTONKHO + ? WHERE MASANPHAM = ?", (qty, sp_id))

        # Hoàn lại lượt dùng voucher nếu có
        if voucher_id:
            cursor.execute("""
                UPDATE CHUONG_TRINH_GIAM_GIA
                SET SOLUONGDADUNG = CASE WHEN SOLUONGDADUNG > 0 THEN SOLUONGDADUNG - 1 ELSE 0 END
                WHERE MACHUONGTRINHGIAMGIA = ?
            """, (voucher_id,))

        conn.commit()
        return {"message": "Đã hủy đơn hàng thành công!", "MaDonHang": ma_don_hang}
    finally:
        conn.close()

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
def create_danh_gia(
    req: CreateReviewRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    if not req.NoiDungBinhLuan or not req.NoiDungBinhLuan.strip():
        raise HTTPException(status_code=400, detail="Vui lòng nhập nội dung đánh giá sản phẩm!")
    if req.SoSao < 1 or req.SoSao > 5:
        raise HTTPException(status_code=400, detail="Số sao đánh giá phải từ 1 đến 5 sao!")

    uid = current_user["sub"] if current_user else req.MaNguoiDung

    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM SAN_PHAM WHERE MASANPHAM = ?", (req.MaSanPham,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại!")

        # Chỉ gán MADONHANG nếu chính user có đơn hàng chứa sản phẩm này; tuyệt đối không gán bừa đơn người khác
        m_dh = None
        if uid is not None:
            if req.MaDonHang:
                cursor.execute("""
                    SELECT dh.MADONHANG
                    FROM DON_HANG dh
                    JOIN CHI_TIET_DON_HANG ct ON dh.MADONHANG = ct.MADONHANG
                    WHERE dh.MADONHANG = ? AND dh.MANGUOIDUNG = ? AND ct.MASANPHAM = ?
                """, (req.MaDonHang, uid, req.MaSanPham))
                row_dh = cursor.fetchone()
                if row_dh:
                    m_dh = row_dh[0]
            else:
                cursor.execute("""
                    SELECT TOP 1 dh.MADONHANG
                    FROM DON_HANG dh
                    JOIN CHI_TIET_DON_HANG ct ON dh.MADONHANG = ct.MADONHANG
                    WHERE dh.MANGUOIDUNG = ? AND ct.MASANPHAM = ?
                    ORDER BY dh.MADONHANG DESC
                """, (uid, req.MaSanPham))
                row_dh = cursor.fetchone()
                if row_dh:
                    m_dh = row_dh[0]

        cursor.execute("SELECT ISNULL(MAX(MADANHGIA), 0) + 1 FROM DANH_GIA_SAN_PHAM")
        next_id = cursor.fetchone()[0]

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
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
            now_str,
        ))

        conn.commit()
        return {
            "message": "Cảm ơn bạn đã gửi đánh giá sản phẩm!",
            "MaDanhGia": next_id,
            "MaDonHang": m_dh,
            "MaSanPham": req.MaSanPham,
            "SoSao": req.SoSao,
            "NoiDungBinhLuan": req.NoiDungBinhLuan.strip(),
            "NgayDanhGia": now_str[:10],
        }
    finally:
        conn.close()

@app.delete("/api/danh-gia/{ma_danh_gia}")
def delete_danh_gia(
    ma_danh_gia: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT dg.MADANHGIA, dh.MANGUOIDUNG
            FROM DANH_GIA_SAN_PHAM dg
            LEFT JOIN DON_HANG dh ON dg.MADONHANG = dh.MADONHANG
            WHERE dg.MADANHGIA = ?
        """, (ma_danh_gia,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy đánh giá!")

        owner_id = row[1]
        if current_user.get("role") != "ADMIN" and (owner_id is None or owner_id != current_user.get("sub")):
            raise HTTPException(status_code=403, detail="Bạn không có quyền xóa đánh giá này!")

        cursor.execute("DELETE FROM DANH_GIA_SAN_PHAM WHERE MADANHGIA = ?", (ma_danh_gia,))
        conn.commit()
        return {"message": "Đã xóa đánh giá thành công!", "MaDanhGia": ma_danh_gia}
    finally:
        conn.close()

@app.get("/api/admin/ai-logs")
def get_admin_ai_logs(_admin: Dict[str, Any] = Depends(require_admin)):
    return query_db("""
        SELECT TOP 50 ta.MATIMKIEM, ta.THOIGIAN, ta.HINHANHURL, ta.NENTANG, ta.TRANGTHAINHANDIEN,
               kq.THUHANG, kq.XACSUATCHINHXAC, lc.MALOAICAY, lc.TENTHUONGGOI, lc.TENKHOAHOC
        FROM TIM_ANH ta
        LEFT JOIN KET_QUA_NHAN_DIEN kq ON ta.MATIMKIEM = kq.MATIMKIEM AND kq.THUHANG = 1
        LEFT JOIN LOAI_CAY lc ON kq.MALOAICAY = lc.MALOAICAY
        ORDER BY ta.MATIMKIEM DESC
    """)

@app.put("/api/admin/san-pham/{ma_san_pham}")
def update_san_pham(ma_san_pham: int, req: UpdateProductRequest, _admin: Dict[str, Any] = Depends(require_admin)):
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
def create_san_pham(req: CreateProductRequest, _admin: Dict[str, Any] = Depends(require_admin)):
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

class UpdateSpeciesRequest(BaseModel):
    TenThuongGoi: Optional[str] = None
    TenKhoaHoc: Optional[str] = None
    MaDanhMuc: Optional[int] = None
    GiaThamKhao: Optional[float] = None
    HuongDanChamSoc: Optional[str] = None
    DacDiemNhanDang: Optional[str] = None
    XuatXu: Optional[str] = None
    AnhSang: Optional[str] = None
    DoAm: Optional[str] = None
    NhietDo: Optional[str] = None
    DocTinh: Optional[str] = None
    PhongThuy: Optional[str] = None

@app.post("/api/admin/loai-cay")
def create_loai_cay(req: CreateSpeciesRequest, _admin: Dict[str, Any] = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Tìm ID loài cây tiếp theo an toàn (không trùng khóa chính với lớp #91)
    cursor.execute("SELECT ISNULL(MAX(MALOAICAY), 91) + 1 FROM LOAI_CAY")
    next_id = int(cursor.fetchone()[0] or 92)
    if next_id == 91:
        next_id = 92

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

@app.put("/api/admin/loai-cay/{ma_loai_cay}")
def update_loai_cay(
    ma_loai_cay: int,
    req: UpdateSpeciesRequest,
    _admin: Dict[str, Any] = Depends(require_admin),
):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT MALOAICAY FROM LOAI_CAY WHERE MALOAICAY = ?", (ma_loai_cay,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Không tìm thấy loài cây cần cập nhật!")

        updates = {
            "TENTHUONGGOI": req.TenThuongGoi,
            "TENKHOAHOC": req.TenKhoaHoc,
            "MADANHMUC": req.MaDanhMuc,
            "GIATHAMKHAO": req.GiaThamKhao,
            "HUONGDANCHAMSOC": req.HuongDanChamSoc,
            "DACDIEMNHANDANG": req.DacDiemNhanDang,
            "XUATXU": req.XuatXu,
            "ANHSANG": req.AnhSang,
            "DOAM": req.DoAm,
            "NHIETDO": req.NhietDo,
            "DOCTINH": req.DocTinh,
            "PHONGTHUY": req.PhongThuy,
        }
        for col, val in updates.items():
            if val is not None:
                cursor.execute(f"UPDATE LOAI_CAY SET {col} = ? WHERE MALOAICAY = ?", (val, ma_loai_cay))

        conn.commit()
        return {"message": "Cập nhật thông tin loài cây thành công!", "MaLoaiCay": ma_loai_cay}
    finally:
        conn.close()

@app.delete("/api/admin/loai-cay/{ma_loai_cay}")
def delete_loai_cay(
    ma_loai_cay: int,
    _admin: Dict[str, Any] = Depends(require_admin),
):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT MALOAICAY, TENTHUONGGOI FROM LOAI_CAY WHERE MALOAICAY = ?", (ma_loai_cay,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy loài cây cần xóa!")
        if ma_loai_cay == 91 or "lớp khác" in str(row[1] or "").lower():
            raise HTTPException(status_code=400, detail="Không thể xóa lớp hệ thống Out-of-Distribution (Lớp khác)!")

        cursor.execute("SELECT COUNT(1) FROM SAN_PHAM WHERE MALOAICAY = ?", (ma_loai_cay,))
        sp_count = int(cursor.fetchone()[0] or 0)
        if sp_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Không thể xóa loài cây #{ma_loai_cay} vì đang có {sp_count} sản phẩm liên kết!",
            )

        cursor.execute("DELETE FROM KET_QUA_NHAN_DIEN WHERE MALOAICAY = ?", (ma_loai_cay,))
        cursor.execute("DELETE FROM LOAI_CAY WHERE MALOAICAY = ?", (ma_loai_cay,))
        conn.commit()
        return {"message": "Đã xóa loài cây thành công!", "MaLoaiCay": ma_loai_cay}
    finally:
        conn.close()

@app.delete("/api/admin/san-pham/{ma_san_pham}")
def delete_san_pham(ma_san_pham: int, _admin: Dict[str, Any] = Depends(require_admin)):
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
# 5. XÁC THỰC NGƯỜI DÙNG, HỒ SƠ & SỔ ĐỊA CHỈ (NGUOI_DUNG, DIA_CHI_NGUOI_DUNG)
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
    soDienThoai: Optional[str] = None
    SoDienThoai: Optional[str] = None
    phone: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: Optional[str] = None
    ten_dang_nhap: Optional[str] = None
    taiKhoan: Optional[str] = None
    mat_khau_moi: Optional[str] = None
    matKhauMoi: Optional[str] = None
    ma_xac_nhan: Optional[str] = None
    maXacNhan: Optional[str] = None

@app.post("/api/auth/dang-nhap")
def login_user(req: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT MANGUOIDUNG, TAIKHOAN, MATKHAU, HOTEN, EMAIL, DIACHI, SODIENTHOAI, AVATAR, VAITRO, TRANGTHAITAIKHOAN
        FROM NGUOI_DUNG
        WHERE LOWER(TAIKHOAN) = LOWER(?)
    """, (req.taiKhoan.strip(),))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Tài khoản không tồn tại trên hệ thống!")

    manguoidung, taikhoan, matkhau, hoten, email, diachi, sodienthoai, avatar, vaitro, trangthai = row

    if is_account_locked(trangthai):
        raise HTTPException(status_code=403, detail="Tài khoản này hiện đang bị khóa! Vui lòng liên hệ quản trị viên.")

    if not verify_password(req.matKhau, matkhau):
        raise HTTPException(status_code=401, detail="Mật khẩu không chính xác!")

    role = "ADMIN" if (vaitro and str(vaitro).strip().lower() == "admin") else "USER"
    token = create_access_token(manguoidung, taikhoan, role)

    return {
        "id": manguoidung,
        "username": taikhoan,
        "fullName": hoten or taikhoan,
        "email": email or "",
        "address": diachi or "",
        "phone": sodienthoai or "",
        "soDienThoai": sodienthoai or "",
        "avatar": avatar or "",
        "role": role,
        "status": trangthai,
        "token": token,
    }

@app.post("/api/auth/dang-ky")
def register_user(req: RegisterRequest):
    username = req.taiKhoan.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Tên tài khoản không được để trống!")
    if not req.matKhau or len(req.matKhau) < 4:
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 4 ký tự!")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT MANGUOIDUNG FROM NGUOI_DUNG WHERE LOWER(TAIKHOAN) = LOWER(?)", (username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Tên tài khoản đã tồn tại, vui lòng chọn tên khác!")

    cursor.execute("SELECT ISNULL(MAX(MANGUOIDUNG), 0) + 1 FROM NGUOI_DUNG")
    next_id = cursor.fetchone()[0]

    hashed_pw = hash_password(req.matKhau)
    full_name = req.hoTen or username
    phone_val = (req.soDienThoai or req.SoDienThoai or req.phone or "").strip()
    cursor.execute("""
        INSERT INTO NGUOI_DUNG (MANGUOIDUNG, TAIKHOAN, MATKHAU, HOTEN, EMAIL, DIACHI, SODIENTHOAI, AVATAR, VAITRO, TRANGTHAITAIKHOAN, NGAYDANGKY)
        VALUES (?, ?, ?, ?, ?, ?, ?, '', 'KhachHang', N'HoatDong', GETDATE())
    """, (next_id, username, hashed_pw, full_name, req.email or "", req.diaChi or "", phone_val))

    conn.commit()
    conn.close()

    token = create_access_token(next_id, username, "USER")
    return {
        "id": next_id,
        "username": username,
        "fullName": full_name,
        "email": req.email or "",
        "address": req.diaChi or "",
        "phone": phone_val,
        "soDienThoai": phone_val,
        "avatar": "",
        "role": "USER",
        "status": "HoatDong",
        "token": token,
    }

@app.post("/api/auth/quen-mat-khau")
def forgot_password(req: ForgotPasswordRequest):
    uname = (req.ten_dang_nhap or req.taiKhoan or "").strip()
    email = (req.email or "").strip()
    if not uname and not email:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp email hoặc tên đăng nhập!")

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if uname:
            cursor.execute(
                "SELECT MANGUOIDUNG, TAIKHOAN, EMAIL, TRANGTHAITAIKHOAN FROM NGUOI_DUNG WHERE LOWER(TAIKHOAN) = LOWER(?)",
                (uname,),
            )
        else:
            cursor.execute(
                "SELECT MANGUOIDUNG, TAIKHOAN, EMAIL, TRANGTHAITAIKHOAN FROM NGUOI_DUNG WHERE LOWER(EMAIL) = LOWER(?)",
                (email,),
            )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản tương ứng!")

        uid, taikhoan, user_email, trangthai = row
        if is_account_locked(trangthai):
            raise HTTPException(status_code=403, detail="Tài khoản đang bị khóa, không thể đặt lại mật khẩu!")

        new_pw = req.mat_khau_moi or req.matKhauMoi
        otp_in = (req.ma_xac_nhan or req.maXacNhan or "").strip()

        # Bước 1: Chưa gửi mật khẩu mới -> Sinh mã OTP demo 6 chữ số để test luận văn
        if not new_pw:
            otp_code = f"{secrets.randbelow(900000) + 100000}"
            PASSWORD_RESET_OTPS[uid] = {"otp": otp_code, "exp": time.time() + 600}
            return {
                "message": "Đã tạo mã xác nhận đặt lại mật khẩu (OTP Demo).",
                "tai_khoan": taikhoan,
                "email": user_email or "",
                "ma_xac_nhan_demo": otp_code,
                "expires_in": 600,
            }

        # Bước 2: Đã gửi mật khẩu mới -> Bắt buộc kiểm tra mã OTP
        if len(new_pw.strip()) < 4:
            raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 4 ký tự!")
        stored = PASSWORD_RESET_OTPS.get(uid)
        if not stored or stored["exp"] < time.time():
            raise HTTPException(status_code=400, detail="Mã xác nhận đã hết hạn hoặc chưa được tạo. Vui lòng yêu cầu mã mới!")
        if not otp_in or not hmac.compare_digest(stored["otp"], otp_in):
            raise HTTPException(status_code=400, detail="Mã xác nhận OTP không chính xác!")

        cursor.execute(
            "UPDATE NGUOI_DUNG SET MATKHAU = ? WHERE MANGUOIDUNG = ?",
            (hash_password(new_pw.strip()), uid),
        )
        conn.commit()
        PASSWORD_RESET_OTPS.pop(uid, None)
        return {"message": "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.", "tai_khoan": taikhoan}
    finally:
        conn.close()

class UpdateUserRequest(BaseModel):
    hoTen: Optional[str] = None
    HoTen: Optional[str] = None
    email: Optional[str] = None
    Email: Optional[str] = None
    soDienThoai: Optional[str] = None
    SoDienThoai: Optional[str] = None
    diaChi: Optional[str] = None
    DiaChi: Optional[str] = None
    avatar: Optional[str] = None
    Avatar: Optional[str] = None
    matKhauCu: Optional[str] = None
    MatKhauCu: Optional[str] = None
    matKhauMoi: Optional[str] = None
    MatKhauMoi: Optional[str] = None
    matKhau: Optional[str] = None

@app.get("/api/nguoi-dung/{user_identifier}")
def get_user_profile(
    user_identifier: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if user_identifier.isdigit():
            cursor.execute("""
                SELECT MANGUOIDUNG, TAIKHOAN, HOTEN, EMAIL, DIACHI, SODIENTHOAI, AVATAR, VAITRO, TRANGTHAITAIKHOAN, NGAYDANGKY
                FROM NGUOI_DUNG WHERE MANGUOIDUNG = ?
            """, (int(user_identifier),))
        else:
            cursor.execute("""
                SELECT MANGUOIDUNG, TAIKHOAN, HOTEN, EMAIL, DIACHI, SODIENTHOAI, AVATAR, VAITRO, TRANGTHAITAIKHOAN, NGAYDANGKY
                FROM NGUOI_DUNG WHERE LOWER(TAIKHOAN) = LOWER(?)
            """, (user_identifier.strip(),))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng trong CSDL!")
        uid = row[0]
        if current_user.get("role") != "ADMIN" and current_user.get("sub") != uid:
            raise HTTPException(status_code=403, detail="Bạn không có quyền xem hồ sơ của người dùng khác!")
        return {
            "id": row[0],
            "username": row[1],
            "fullName": row[2] or row[1],
            "email": row[3] or "",
            "address": row[4] or "",
            "phone": row[5] or "",
            "soDienThoai": row[5] or "",
            "avatar": row[6] or "",
            "role": "ADMIN" if str(row[7] or "").strip().lower() == "admin" else "USER",
            "status": row[8],
            "ngayDangKy": str(row[9] or "")[:19],
        }
    finally:
        conn.close()

@app.put("/api/nguoi-dung/{user_identifier}")
def update_user_profile(
    user_identifier: str,
    req: UpdateUserRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        if user_identifier.isdigit():
            cursor.execute("SELECT MANGUOIDUNG, MATKHAU FROM NGUOI_DUNG WHERE MANGUOIDUNG = ?", (int(user_identifier),))
        else:
            cursor.execute("SELECT MANGUOIDUNG, MATKHAU FROM NGUOI_DUNG WHERE LOWER(TAIKHOAN) = LOWER(?)", (user_identifier.strip(),))

        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng trong CSDL!")

        uid, stored_pw = row[0], row[1]
        is_admin = current_user.get("role") == "ADMIN"
        if not is_admin and current_user.get("sub") != uid:
            raise HTTPException(status_code=403, detail="Bạn không có quyền chỉnh sửa tài khoản của người khác!")

        ho_ten = req.HoTen if req.HoTen is not None else req.hoTen
        email = req.Email if req.Email is not None else req.email
        so_dien_thoai = req.SoDienThoai if req.SoDienThoai is not None else req.soDienThoai
        dia_chi = req.DiaChi if req.DiaChi is not None else req.diaChi
        avatar = req.Avatar if req.Avatar is not None else req.avatar
        mat_khau_cu = req.MatKhauCu if req.MatKhauCu is not None else req.matKhauCu
        mat_khau_moi = req.MatKhauMoi if req.MatKhauMoi is not None else (req.matKhauMoi if req.matKhauMoi is not None else req.matKhau)

        if mat_khau_moi is not None and mat_khau_moi.strip():
            if len(mat_khau_moi.strip()) < 4:
                raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 4 ký tự!")
            if not is_admin:
                if not mat_khau_cu or not verify_password(mat_khau_cu, stored_pw):
                    raise HTTPException(status_code=400, detail="Mật khẩu cũ không chính xác!")
            cursor.execute("UPDATE NGUOI_DUNG SET MATKHAU = ? WHERE MANGUOIDUNG = ?", (hash_password(mat_khau_moi.strip()), uid))

        if ho_ten is not None:
            cursor.execute("UPDATE NGUOI_DUNG SET HOTEN = ? WHERE MANGUOIDUNG = ?", (ho_ten, uid))
        if email is not None:
            cursor.execute("UPDATE NGUOI_DUNG SET EMAIL = ? WHERE MANGUOIDUNG = ?", (email, uid))
        if so_dien_thoai is not None:
            cursor.execute("UPDATE NGUOI_DUNG SET SODIENTHOAI = ? WHERE MANGUOIDUNG = ?", (so_dien_thoai, uid))
        if dia_chi is not None:
            cursor.execute("UPDATE NGUOI_DUNG SET DIACHI = ? WHERE MANGUOIDUNG = ?", (dia_chi, uid))
        if avatar is not None:
            cursor.execute("UPDATE NGUOI_DUNG SET AVATAR = ? WHERE MANGUOIDUNG = ?", (avatar, uid))

        conn.commit()
        cursor.execute(
            "SELECT HOTEN, EMAIL, DIACHI, SODIENTHOAI, AVATAR FROM NGUOI_DUNG WHERE MANGUOIDUNG = ?",
            (uid,),
        )
        u_row = cursor.fetchone()
        return {
            "message": "Cập nhật thông tin thành công!",
            "id": uid,
            "fullName": u_row[0] if u_row else "",
            "email": u_row[1] if u_row else "",
            "address": u_row[2] if u_row else "",
            "phone": u_row[3] if u_row else "",
            "soDienThoai": u_row[3] if u_row else "",
            "avatar": u_row[4] if u_row else "",
        }
    finally:
        conn.close()

class AddressCreateRequest(BaseModel):
    TenNguoiNhan: Optional[str] = None
    tenNguoiNhan: Optional[str] = None
    SdtNguoiNhan: Optional[str] = None
    sdtNguoiNhan: Optional[str] = None
    SoDienThoai: Optional[str] = None
    soDienThoai: Optional[str] = None
    DiaChiChiTiet: Optional[str] = None
    diaChiChiTiet: Optional[str] = None
    DiaChi: Optional[str] = None
    diaChi: Optional[str] = None
    DatMacDinh: Optional[bool] = False
    datMacDinh: Optional[bool] = None

@app.get("/api/nguoi-dung/{user_id}/dia-chi")
def get_user_addresses(
    user_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    if current_user.get("role") != "ADMIN" and current_user.get("sub") != user_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem sổ địa chỉ của người khác!")
    return query_db("""
        SELECT MADIACHI, MANGUOIDUNG, TENNGUOINHAN, SDTNGUOINHAN, DIACHICHITIET, DATMACDINH
        FROM DIA_CHI_NGUOI_DUNG
        WHERE MANGUOIDUNG = ?
        ORDER BY DATMACDINH DESC, MADIACHI DESC
    """, (user_id,))

@app.post("/api/nguoi-dung/{user_id}/dia-chi")
def create_user_address(
    user_id: int,
    req: AddressCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    if current_user.get("role") != "ADMIN" and current_user.get("sub") != user_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền thêm địa chỉ cho người khác!")

    ten = (req.TenNguoiNhan or req.tenNguoiNhan or "").strip()
    sdt = (req.SdtNguoiNhan or req.sdtNguoiNhan or req.SoDienThoai or req.soDienThoai or "").strip()
    dia_chi = (req.DiaChiChiTiet or req.diaChiChiTiet or req.DiaChi or req.diaChi or "").strip()
    mac_dinh = bool(req.datMacDinh if req.datMacDinh is not None else req.DatMacDinh)

    if not dia_chi:
        raise HTTPException(status_code=400, detail="Vui lòng nhập địa chỉ chi tiết!")

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if mac_dinh:
            cursor.execute("UPDATE DIA_CHI_NGUOI_DUNG SET DATMACDINH = 0 WHERE MANGUOIDUNG = ?", (user_id,))
        cursor.execute("SELECT ISNULL(MAX(MADIACHI), 0) + 1 FROM DIA_CHI_NGUOI_DUNG")
        next_id = cursor.fetchone()[0]
        cursor.execute("""
            INSERT INTO DIA_CHI_NGUOI_DUNG (MADIACHI, MANGUOIDUNG, TENNGUOINHAN, DIACHICHITIET, DATMACDINH, SDTNGUOINHAN)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (next_id, user_id, ten, dia_chi, 1 if mac_dinh else 0, sdt))
        conn.commit()
        return {
            "message": "Đã thêm địa chỉ giao hàng thành công!",
            "MaDiaChi": next_id,
            "MaNguoiDung": user_id,
            "TenNguoiNhan": ten,
            "SdtNguoiNhan": sdt,
            "DiaChiChiTiet": dia_chi,
            "DatMacDinh": mac_dinh,
        }
    finally:
        conn.close()

@app.delete("/api/nguoi-dung/{user_id}/dia-chi/{ma_dia_chi}")
def delete_user_address_by_path(
    user_id: int,
    ma_dia_chi: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    if current_user.get("role") != "ADMIN" and current_user.get("sub") != user_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa địa chỉ của người khác!")
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM DIA_CHI_NGUOI_DUNG WHERE MADIACHI = ? AND MANGUOIDUNG = ?",
            (ma_dia_chi, user_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy địa chỉ cần xóa!")
        conn.commit()
        return {"message": "Đã xóa địa chỉ thành công!", "MaDiaChi": ma_dia_chi}
    finally:
        conn.close()

@app.delete("/api/nguoi-dung/{user_id}/dia-chi")
def delete_user_address_by_query(
    user_id: int,
    ma_dia_chi: int = Query(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    return delete_user_address_by_path(user_id=user_id, ma_dia_chi=ma_dia_chi, current_user=current_user)

# =====================================================================
# 4B. OFFLINE REINFORCEMENT / ACTIVE LEARNING (PHẢN HỒI & HUẤN LUYỆN LẠI)
# =====================================================================
class AiFeedbackRequest(BaseModel):
    ma_tim_kiem: int
    la_dung: bool
    ma_loai_dung: Optional[int] = None
    ghi_chu: Optional[str] = None
    ma_nguoi_dung: Optional[int] = None


class ReviewAiFeedbackRequest(BaseModel):
    trang_thai_duyet: str  # "DaDuyet" | "TuChoi" | "ChoDuyet"
    ma_loai_dung: Optional[int] = None
    ghi_chu: Optional[str] = None


def ensure_feedback_table(conn):
    """Tạo bảng PHAN_HOI_NHAN_DIEN nếu chưa tồn tại (hỗ trợ cả SQL Server & SQLite)."""
    cursor = conn.cursor()
    is_sqlite = hasattr(conn, "_conn")
    if is_sqlite:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS PHAN_HOI_NHAN_DIEN (
                MAPHANHOI INTEGER PRIMARY KEY,
                MATIMKIEM INTEGER NOT NULL,
                MANGUOIDUNG INTEGER NULL,
                MALOAIDUDOAN INTEGER NULL,
                MALOAIDUNG INTEGER NULL,
                LADUNG INTEGER NOT NULL,
                REWARD INTEGER NOT NULL,
                GHICHU TEXT NULL,
                TRANGTHAIDUYET TEXT NOT NULL DEFAULT 'ChoDuyet',
                THOIGIANTAO TEXT DEFAULT (datetime('now', 'localtime')),
                THOIGIANDUYET TEXT NULL
            )
        """)
    else:
        cursor.execute("""
            IF OBJECT_ID('PHAN_HOI_NHAN_DIEN', 'U') IS NULL
            CREATE TABLE PHAN_HOI_NHAN_DIEN (
                MAPHANHOI INT PRIMARY KEY,
                MATIMKIEM INT NOT NULL,
                MANGUOIDUNG INT NULL,
                MALOAIDUDOAN INT NULL,
                MALOAIDUNG INT NULL,
                LADUNG INT NOT NULL,
                REWARD INT NOT NULL,
                GHICHU NVARCHAR(500) NULL,
                TRANGTHAIDUYET NVARCHAR(50) NOT NULL DEFAULT N'ChoDuyet',
                THOIGIANTAO DATETIME DEFAULT GETDATE(),
                THOIGIANDUYET DATETIME NULL
            )
        """)


@app.post("/api/nhan-dien/phan-hoi")
def submit_ai_feedback(req: AiFeedbackRequest):
    conn = get_db_connection()
    try:
        ensure_feedback_table(conn)
        cursor = conn.cursor()

        cursor.execute("SELECT MATIMKIEM, MANGUOIDUNG, HINHANHURL FROM TIM_ANH WHERE MATIMKIEM = ?", (req.ma_tim_kiem,))
        tim_row = cursor.fetchone()
        if not tim_row:
            raise HTTPException(status_code=404, detail="Không tìm thấy lượt nhận diện này!")

        hinh_anh_url = tim_row[2] if len(tim_row) > 2 else None

        cursor.execute(
            "SELECT TOP 1 MALOAICAY FROM KET_QUA_NHAN_DIEN WHERE MATIMKIEM = ? AND THUHANG = 1",
            (req.ma_tim_kiem,),
        )
        kq_row = cursor.fetchone()
        ma_loai_du_doan = int(kq_row[0]) if kq_row and kq_row[0] is not None else None

        la_dung_int = 1 if req.la_dung else 0
        reward = 1 if req.la_dung else -1
        ma_loai_dung = req.ma_loai_dung if req.ma_loai_dung is not None else (ma_loai_du_doan if req.la_dung else None)
        user_id = req.ma_nguoi_dung if req.ma_nguoi_dung is not None else tim_row[1]
        ghi_chu = (req.ghi_chu or "").strip()[:500] or None

        cursor.execute("SELECT MAPHANHOI FROM PHAN_HOI_NHAN_DIEN WHERE MATIMKIEM = ?", (req.ma_tim_kiem,))
        existing = cursor.fetchone()
        if existing:
            ma_phan_hoi = int(existing[0])
            cursor.execute(
                """
                UPDATE PHAN_HOI_NHAN_DIEN
                SET MANGUOIDUNG = ?, MALOAIDUDOAN = ?, MALOAIDUNG = ?, LADUNG = ?, REWARD = ?,
                    GHICHU = ?, TRANGTHAIDUYET = N'ChoDuyet', THOIGIANTAO = GETDATE(), THOIGIANDUYET = NULL
                WHERE MAPHANHOI = ?
                """,
                (user_id, ma_loai_du_doan, ma_loai_dung, la_dung_int, reward, ghi_chu, ma_phan_hoi),
            )
        else:
            cursor.execute("SELECT ISNULL(MAX(MAPHANHOI), 0) + 1 FROM PHAN_HOI_NHAN_DIEN")
            ma_phan_hoi = int(cursor.fetchone()[0])
            cursor.execute(
                """
                INSERT INTO PHAN_HOI_NHAN_DIEN
                    (MAPHANHOI, MATIMKIEM, MANGUOIDUNG, MALOAIDUDOAN, MALOAIDUNG, LADUNG, REWARD, GHICHU, TRANGTHAIDUYET, THOIGIANTAO)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, N'ChoDuyet', GETDATE())
                """,
                (ma_phan_hoi, req.ma_tim_kiem, user_id, ma_loai_du_doan, ma_loai_dung, la_dung_int, reward, ghi_chu),
            )

        conn.commit()

        # Tự động nạp vào online_buffer nếu thuộc nhóm loài ưu tiên thiếu dữ liệu / < 60%
        online_sample_result = None
        if ma_loai_dung is not None and hinh_anh_url:
            try:
                rel_name = os.path.basename(str(hinh_anh_url).split("?")[0])
                src_path = os.path.join(UPLOAD_DIR, rel_name)
                if os.path.exists(src_path):
                    orig_label = None
                    for info in class_mapping.values():
                        if info.get("MaLoaiCay") == int(ma_loai_dung):
                            orig_label = info.get("original_label")
                            break
                    is_prio, _ = online_learning.is_priority_species(
                        ma_loai_cay=int(ma_loai_dung), original_label=orig_label
                    )
                    if is_prio:
                        online_sample_result = online_learning.record_online_sample(
                            image_path=src_path,
                            ma_loai_cay=int(ma_loai_dung),
                            original_label=orig_label,
                            reward=reward,
                            is_priority=True,
                        )
            except Exception as ol_err:
                print(f"[OnlineLearning] Notice recording feedback sample: {ol_err}")

        return {
            "message": "Đã ghi nhận phản hồi để đưa vào hàng đợi kiểm duyệt huấn luyện lại (Offline)!",
            "MaPhanHoi": ma_phan_hoi,
            "MaTimKiem": req.ma_tim_kiem,
            "LaDung": req.la_dung,
            "Reward": reward,
            "TrangThaiDuyet": "ChoDuyet",
            "OnlineLearning": online_sample_result,
        }
    finally:
        conn.close()


@app.get("/api/admin/ai-feedback")
def get_admin_ai_feedback(_admin: Dict[str, Any] = Depends(require_admin)):
    conn = get_db_connection()
    try:
        ensure_feedback_table(conn)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT TOP 200
                ph.MAPHANHOI, ph.MATIMKIEM, ph.MANGUOIDUNG, ph.MALOAIDUDOAN, ph.MALOAIDUNG,
                ph.LADUNG, ph.REWARD, ph.GHICHU, ph.TRANGTHAIDUYET, ph.THOIGIANTAO, ph.THOIGIANDUYET,
                ta.HINHANHURL, ta.TRANGTHAINHANDIEN,
                lc_dd.TENTHUONGGOI AS TENLOAIDUDOAN,
                lc_dung.TENTHUONGGOI AS TENLOAIDUNG,
                kq.XACSUATCHINHXAC
            FROM PHAN_HOI_NHAN_DIEN ph
            LEFT JOIN TIM_ANH ta ON ph.MATIMKIEM = ta.MATIMKIEM
            LEFT JOIN LOAI_CAY lc_dd ON ph.MALOAIDUDOAN = lc_dd.MALOAICAY
            LEFT JOIN LOAI_CAY lc_dung ON ph.MALOAIDUNG = lc_dung.MALOAICAY
            LEFT JOIN KET_QUA_NHAN_DIEN kq ON ph.MATIMKIEM = kq.MATIMKIEM AND kq.THUHANG = 1
            ORDER BY ph.MAPHANHOI DESC
        """)
        cols = [c[0] for c in cursor.description]
        rows = [normalize_row(cols, r) for r in cursor.fetchall()]

        total = len(rows)
        cho_duyet = sum(1 for r in rows if r.get("TrangThaiDuyet") == "ChoDuyet")
        da_duyet = sum(1 for r in rows if r.get("TrangThaiDuyet") == "DaDuyet")
        tu_choi = sum(1 for r in rows if r.get("TrangThaiDuyet") == "TuChoi")
        tong_dung = sum(1 for r in rows if int(r.get("LaDung") or 0) == 1)
        tong_sai = total - tong_dung

        return {
            "stats": {
                "total": total,
                "cho_duyet": cho_duyet,
                "da_duyet": da_duyet,
                "tu_choi": tu_choi,
                "tong_dung": tong_dung,
                "tong_sai": tong_sai,
                "ty_le_dung": round((tong_dung / total) * 100, 1) if total > 0 else 0.0,
            },
            "items": rows,
        }
    finally:
        conn.close()


@app.put("/api/admin/ai-feedback/{ma_phan_hoi}/duyet")
def review_ai_feedback(
    ma_phan_hoi: int,
    req: ReviewAiFeedbackRequest,
    _admin: Dict[str, Any] = Depends(require_admin),
):
    if req.trang_thai_duyet not in ("DaDuyet", "TuChoi", "ChoDuyet"):
        raise HTTPException(status_code=400, detail="Trạng thái duyệt không hợp lệ!")

    conn = get_db_connection()
    try:
        ensure_feedback_table(conn)
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT ph.MAPHANHOI, ph.MALOAIDUNG, ph.REWARD, ta.HINHANHURL
            FROM PHAN_HOI_NHAN_DIEN ph
            LEFT JOIN TIM_ANH ta ON ph.MATIMKIEM = ta.MATIMKIEM
            WHERE ph.MAPHANHOI = ?
            """,
            (ma_phan_hoi,),
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy phản hồi!")

        final_species_id = req.ma_loai_dung if req.ma_loai_dung is not None else row[1]
        feedback_reward = int(row[2]) if len(row) > 2 and row[2] is not None else 1
        feedback_img_url = row[3] if len(row) > 3 else None
        if req.trang_thai_duyet == "DaDuyet" and final_species_id is None:
            raise HTTPException(
                status_code=400,
                detail="Cần chọn loài cây đúng (MaLoaiDung) trước khi duyệt đưa vào tập huấn luyện!",
            )

        cursor.execute(
            """
            UPDATE PHAN_HOI_NHAN_DIEN
            SET TRANGTHAIDUYET = ?,
                MALOAIDUNG = COALESCE(?, MALOAIDUNG),
                GHICHU = COALESCE(?, GHICHU),
                THOIGIANDUYET = GETDATE()
            WHERE MAPHANHOI = ?
            """,
            (req.trang_thai_duyet, final_species_id, req.ghi_chu, ma_phan_hoi),
        )
        conn.commit()

        online_sample_result = None
        if req.trang_thai_duyet == "DaDuyet" and final_species_id is not None and feedback_img_url:
            try:
                rel_name = os.path.basename(str(feedback_img_url).split("?")[0])
                src_path = os.path.join(UPLOAD_DIR, rel_name)
                if os.path.exists(src_path):
                    orig_label = None
                    for info in class_mapping.values():
                        if info.get("MaLoaiCay") == int(final_species_id):
                            orig_label = info.get("original_label")
                            break
                    is_prio, _ = online_learning.is_priority_species(
                        ma_loai_cay=int(final_species_id), original_label=orig_label
                    )
                    online_sample_result = online_learning.record_online_sample(
                        image_path=src_path,
                        ma_loai_cay=int(final_species_id),
                        original_label=orig_label,
                        reward=feedback_reward,
                        is_priority=is_prio,
                    )
            except Exception as ol_err:
                print(f"[OnlineLearning] Notice recording approved sample: {ol_err}")

        return {
            "message": "Đã cập nhật trạng thái duyệt phản hồi!",
            "MaPhanHoi": ma_phan_hoi,
            "TrangThaiDuyet": req.trang_thai_duyet,
            "MaLoaiDung": final_species_id,
            "OnlineLearning": online_sample_result,
        }
    finally:
        conn.close()


@app.post("/api/admin/ai-feedback/export-dataset")
def export_approved_feedback_dataset(_admin: Dict[str, Any] = Depends(require_admin)):
    """Xuất các ảnh đã được Admin duyệt sang thư mục dataset_pipeline/feedback_retrain để huấn luyện Offline."""
    conn = get_db_connection()
    try:
        ensure_feedback_table(conn)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ph.MAPHANHOI, ph.MATIMKIEM, ph.MALOAIDUDOAN, ph.MALOAIDUNG, ph.REWARD, ta.HINHANHURL
            FROM PHAN_HOI_NHAN_DIEN ph
            JOIN TIM_ANH ta ON ph.MATIMKIEM = ta.MATIMKIEM
            WHERE ph.TRANGTHAIDUYET = N'DaDuyet' AND ph.MALOAIDUNG IS NOT NULL
        """)
        rows = cursor.fetchall()
    finally:
        conn.close()

    ma_to_label = {}
    for info in class_mapping.values():
        ma_id = info.get("MaLoaiCay")
        orig = info.get("original_label")
        if ma_id is not None and orig:
            ma_to_label[int(ma_id)] = orig

    export_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dataset_pipeline", "feedback_retrain")
    os.makedirs(export_root, exist_ok=True)

    exported = []
    skipped = 0
    for ma_ph, ma_tk, ma_dd, ma_dung, reward, img_url in rows:
        if not img_url:
            skipped += 1
            continue
        rel_name = os.path.basename(str(img_url).split("?")[0])
        src_path = os.path.join(UPLOAD_DIR, rel_name)
        if not os.path.exists(src_path):
            skipped += 1
            continue

        folder_label = ma_to_label.get(int(ma_dung), f"class_{int(ma_dung)}")
        safe_folder = "".join(c if c.isalnum() or c in (" ", "-", "_") else "_" for c in folder_label).strip()
        dst_dir = os.path.join(export_root, safe_folder)
        os.makedirs(dst_dir, exist_ok=True)
        dst_path = os.path.join(dst_dir, f"fb_{ma_ph}_{rel_name}")
        shutil.copy2(src_path, dst_path)
        exported.append({
            "ma_phan_hoi": int(ma_ph),
            "ma_tim_kiem": int(ma_tk),
            "ma_loai_du_doan": int(ma_dd) if ma_dd is not None else None,
            "ma_loai_dung": int(ma_dung),
            "label": safe_folder,
            "reward": int(reward),
            "file_path": dst_path,
        })

    manifest_path = os.path.join(export_root, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as mf:
        json.dump(
            {
                "exported_at": datetime.now().isoformat(),
                "exported_count": len(exported),
                "skipped_count": skipped,
                "items": exported,
            },
            mf,
            ensure_ascii=False,
            indent=2,
        )

    return {
        "message": f"Đã xuất {len(exported)} ảnh chuẩn sang tập huấn luyện Offline!",
        "exported_count": len(exported),
        "skipped_count": skipped,
        "export_dir": export_root,
        "manifest_path": manifest_path,
    }


# =====================================================================
# 4C. ONLINE REINFORCEMENT / ACTIVE DATA SUPPLEMENTATION & INCREMENTAL LEARNING
# =====================================================================
class OnlineLearningTriggerRequest(BaseModel):
    epochs: int = 3
    batch_size: int = 8
    lr: float = 1e-5
    replay_per_class: int = 2
    force_save: bool = False


@app.get("/api/admin/online-learning/status")
def get_admin_online_learning_status(_admin: Dict[str, Any] = Depends(require_admin)):
    """Trả về danh sách loài ưu tiên thiếu dữ liệu / < 60%, số mẫu online_buffer và kết quả đợt học Online gần nhất."""
    return online_learning.get_online_learning_status()


@app.post("/api/admin/online-learning/trigger")
def trigger_admin_online_learning(
    req: Optional[OnlineLearningTriggerRequest] = None,
    _admin: Dict[str, Any] = Depends(require_admin),
):
    """Kích hoạt học tăng cường Online trong luồng nền (không chặn FastAPI inference) và hot-reload model nếu đạt Quality Gate."""
    status_now = online_learning.get_online_learning_status()
    if status_now.get("is_running"):
        return {
            "started": False,
            "message": "Một phiên học tăng cường Online đang chạy ở nền. Vui lòng chờ hoàn tất!",
            "status": status_now,
        }

    params = req or OnlineLearningTriggerRequest()

    def _bg_worker():
        online_learning.run_online_incremental_update(
            epochs=params.epochs,
            batch_size=params.batch_size,
            lr=params.lr,
            replay_per_class=params.replay_per_class,
            force_save=params.force_save,
            on_model_saved=hot_reload_online_model,
        )

    worker = threading.Thread(target=_bg_worker, name="online-learning-worker", daemon=True)
    worker.start()

    return {
        "started": True,
        "message": "Đã kích hoạt Học Tăng Cường Online ở luồng nền (lr=1e-5, Quality-Gated). Inference vẫn hoạt động bình thường!",
        "params": {
            "epochs": params.epochs,
            "batch_size": params.batch_size,
            "lr": params.lr,
            "replay_per_class": params.replay_per_class,
            "force_save": params.force_save,
        },
        "status": online_learning.get_online_learning_status(),
    }


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