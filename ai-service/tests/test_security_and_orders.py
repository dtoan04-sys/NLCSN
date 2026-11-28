"""Integration tests for authentication, ownership, concurrency, uploads, online learning, and CORS.

Run with:
    python -m unittest -v ai-service/tests/test_security_and_orders.py
"""

import concurrent.futures
import os
import shutil
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest import mock

from fastapi.testclient import TestClient
from PIL import Image

AI_SERVICE_DIR = Path(__file__).resolve().parent.parent
if str(AI_SERVICE_DIR) not in sys.path:
    sys.path.insert(0, str(AI_SERVICE_DIR))


class SecurityAndOrdersTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp_dir = Path(tempfile.mkdtemp(prefix="florabotanic_test_"))
        cls.db_copy = cls.tmp_dir / "test_caykiengla.db"
        shutil.copy2(AI_SERVICE_DIR / "caykiengla.db", cls.db_copy)

        os.environ["SKIP_AI_LOAD"] = "1"
        os.environ["USE_SQLITE"] = "1"
        os.environ["SQLITE_DB_PATH"] = str(cls.db_copy)

        import main  # noqa: E402

        cls.main = main
        cls.client = TestClient(main.app)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp_dir, ignore_errors=True)

    # ------------------------------------------------------------------
    # Existing 5 tests (kept intact)
    # ------------------------------------------------------------------
    def test_auth_secret_not_hardcoded(self):
        self.assertGreaterEqual(len(self.main.AUTH_SECRET_KEY), 32)
        self.assertNotIn(b"florabotanic-kieng-la-hmac-secret-2026", self.main.AUTH_SECRET_KEY)

    def test_orders_endpoint_requires_auth_and_owner(self):
        self.assertEqual(self.client.get("/api/nguoi-dung/1/don-hang").status_code, 401)

        token_user_2 = self.main.create_access_token(2, "user2", "USER")
        res_other = self.client.get(
            "/api/nguoi-dung/1/don-hang",
            headers={"Authorization": f"Bearer {token_user_2}"},
        )
        self.assertEqual(res_other.status_code, 403)

        token_admin = self.main.create_access_token(999, "admin", "ADMIN")
        res_admin = self.client.get(
            "/api/nguoi-dung/1/don-hang",
            headers={"Authorization": f"Bearer {token_admin}"},
        )
        self.assertEqual(res_admin.status_code, 200)

    def test_guest_order_cannot_spoof_user_id_or_shipping(self):
        res = self.client.post(
            "/api/don-hang",
            json={
                "MaNguoiDung": 1,
                "DiaChiNhanHang": "Guest Test Address",
                "SdtNhanHang": "0901234567",
                "PhuongThucThanhToan": "COD",
                "PhiVanChuyen": 0,
                "Items": [{"MaSanPham": 1, "SoLuongMua": 1}],
            },
        )
        self.assertEqual(res.status_code, 200, res.text)
        body = res.json()
        expected_ship = 0.0 if body["TamTinh"] >= 500000.0 else 30000.0
        self.assertEqual(body["PhiVanChuyen"], expected_ship)

        conn = self.main.get_db_connection()
        saved_uid = conn.cursor().execute(
            "SELECT MANGUOIDUNG FROM DON_HANG WHERE MADONHANG = ?", (body["MaDonHang"],)
        ).fetchone()[0]
        conn.close()
        self.assertIsNone(saved_uid)

    def test_two_consecutive_guest_orders_succeed(self):
        """Ensure multiple guest orders (MANGUOIDUNG=NULL, MAGIOHANG=NULL) do not conflict."""
        order_ids = []
        for idx in range(2):
            res = self.client.post(
                "/api/don-hang",
                json={
                    "DiaChiNhanHang": f"Guest Order #{idx + 1}",
                    "SdtNhanHang": "0901234567",
                    "PhuongThucThanhToan": "COD",
                    "Items": [{"MaSanPham": 1, "SoLuongMua": 1}],
                },
            )
            self.assertEqual(res.status_code, 200, res.text)
            order_ids.append(res.json()["MaDonHang"])
        self.assertEqual(len(set(order_ids)), 2)

    def test_order_rollback_preserves_stock_on_failure(self):
        conn = self.main.get_db_connection()
        stock_before = conn.cursor().execute(
            "SELECT SOLUONGTONKHO FROM SAN_PHAM WHERE MASANPHAM = 1"
        ).fetchone()[0]
        conn.close()

        res = self.client.post(
            "/api/don-hang",
            json={
                "DiaChiNhanHang": "Rollback Test",
                "SdtNhanHang": "0901234567",
                "PhuongThucThanhToan": "COD",
                "Items": [
                    {"MaSanPham": 1, "SoLuongMua": 1},
                    {"MaSanPham": 2, "SoLuongMua": 999999},
                ],
            },
        )
        self.assertEqual(res.status_code, 400)

        conn = self.main.get_db_connection()
        stock_after = conn.cursor().execute(
            "SELECT SOLUONGTONKHO FROM SAN_PHAM WHERE MASANPHAM = 1"
        ).fetchone()[0]
        conn.close()
        self.assertEqual(stock_after, stock_before)

    # ------------------------------------------------------------------
    # New P1 / P2 root-cause verification tests (7 tests)
    # ------------------------------------------------------------------
    def test_review_cannot_spoof_user_id(self):
        token_u1 = self.main.create_access_token(1, "user1", "USER")
        token_u2 = self.main.create_access_token(2, "user2", "USER")

        # Create real orders for user 1 and user 2 on product #1
        r_ord1 = self.client.post(
            "/api/don-hang",
            headers={"Authorization": f"Bearer {token_u1}"},
            json={
                "DiaChiNhanHang": "User 1 Addr",
                "SdtNhanHang": "0901111111",
                "PhuongThucThanhToan": "COD",
                "Items": [{"MaSanPham": 1, "SoLuongMua": 1}],
            },
        )
        self.assertEqual(r_ord1.status_code, 200, r_ord1.text)
        order_u1 = r_ord1.json()["MaDonHang"]

        r_ord2 = self.client.post(
            "/api/don-hang",
            headers={"Authorization": f"Bearer {token_u2}"},
            json={
                "DiaChiNhanHang": "User 2 Addr",
                "SdtNhanHang": "0902222222",
                "PhuongThucThanhToan": "COD",
                "Items": [{"MaSanPham": 1, "SoLuongMua": 1}],
            },
        )
        self.assertEqual(r_ord2.status_code, 200, r_ord2.text)
        order_u2 = r_ord2.json()["MaDonHang"]

        # 1. Unauthenticated caller passing MaNguoiDung must be rejected with 401
        r_unauth = self.client.post(
            "/api/danh-gia",
            json={
                "MaSanPham": 1,
                "MaNguoiDung": 1,
                "MaDonHang": order_u1,
                "SoSao": 5,
                "NoiDungBinhLuan": "Unauthenticated spoof attempt",
            },
        )
        self.assertEqual(r_unauth.status_code, 401)

        # 2. Authenticated user 2 spoofing user 1's MaNguoiDung + user 1's MaDonHang
        #    must NOT attach user 1's order
        r_spoof_order = self.client.post(
            "/api/danh-gia",
            headers={"Authorization": f"Bearer {token_u2}"},
            json={
                "MaSanPham": 1,
                "MaNguoiDung": 1,
                "MaDonHang": order_u1,
                "SoSao": 5,
                "NoiDungBinhLuan": "Spoof user 1 order attempt",
            },
        )
        self.assertEqual(r_spoof_order.status_code, 200, r_spoof_order.text)
        rev_id_1 = r_spoof_order.json()["MaDanhGia"]

        # 3. Authenticated user 2 spoofing MaNguoiDung=1 without MaDonHang must resolve
        #    order strictly from JWT sub (user 2 -> order_u2), NOT user 1
        r_spoof_uid = self.client.post(
            "/api/danh-gia",
            headers={"Authorization": f"Bearer {token_u2}"},
            json={
                "MaSanPham": 1,
                "MaNguoiDung": 1,
                "SoSao": 5,
                "NoiDungBinhLuan": "Spoof user 1 id attempt",
            },
        )
        self.assertEqual(r_spoof_uid.status_code, 200, r_spoof_uid.text)
        rev_id_2 = r_spoof_uid.json()["MaDanhGia"]

        conn = self.main.get_db_connection()
        cur = conn.cursor()
        saved_dh_1 = cur.execute(
            "SELECT MADONHANG FROM DANH_GIA_SAN_PHAM WHERE MADANHGIA = ?", (rev_id_1,)
        ).fetchone()[0]
        saved_dh_2 = cur.execute(
            "SELECT MADONHANG FROM DANH_GIA_SAN_PHAM WHERE MADANHGIA = ?", (rev_id_2,)
        ).fetchone()[0]
        conn.close()

        self.assertIsNone(saved_dh_1)
        self.assertEqual(saved_dh_2, order_u2)
        self.assertNotEqual(saved_dh_2, order_u1)

    def test_concurrent_order_creation_no_duplicate_ids(self):
        target_sp = 3
        initial_stock = 20
        num_threads = 8
        qty_per_order = 2

        conn = self.main.get_db_connection()
        conn.cursor().execute(
            "UPDATE SAN_PHAM SET SOLUONGTONKHO = ? WHERE MASANPHAM = ?",
            (initial_stock, target_sp),
        )
        conn.commit()
        conn.close()

        def place_order(idx: int):
            with TestClient(self.main.app) as c:
                return c.post(
                    "/api/don-hang",
                    json={
                        "DiaChiNhanHang": f"Concurrent Addr #{idx}",
                        "SdtNhanHang": "0903333333",
                        "PhuongThucThanhToan": "COD",
                        "Items": [{"MaSanPham": target_sp, "SoLuongMua": qty_per_order}],
                    },
                )

        with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as pool:
            responses = list(pool.map(place_order, range(num_threads)))

        ok_res = [r for r in responses if r.status_code == 200]
        self.assertEqual(
            len(ok_res),
            num_threads,
            f"Expected {num_threads} succeeded orders, got {[r.status_code for r in responses]}",
        )

        order_ids = [r.json()["MaDonHang"] for r in ok_res]
        self.assertEqual(len(set(order_ids)), num_threads)

        conn = self.main.get_db_connection()
        cur = conn.cursor()
        placeholders = ",".join("?" for _ in order_ids)
        detail_rows = cur.execute(
            f"SELECT MACHITIETDONHANG, MADONHANG FROM CHI_TIET_DON_HANG WHERE MADONHANG IN ({placeholders})",
            tuple(order_ids),
        ).fetchall()
        stock_after = cur.execute(
            "SELECT SOLUONGTONKHO FROM SAN_PHAM WHERE MASANPHAM = ?", (target_sp,)
        ).fetchone()[0]
        conn.close()

        detail_ids = [row[0] for row in detail_rows]
        self.assertEqual(len(detail_rows), num_threads)
        self.assertEqual(len(set(detail_ids)), num_threads)
        self.assertEqual(stock_after, initial_stock - num_threads * qty_per_order)

    def test_concurrent_voucher_redemption_respects_limit(self):
        target_sp = 4
        voucher_limit = 2
        num_threads = 6

        conn = self.main.get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE SAN_PHAM SET SOLUONGTONKHO = 50 WHERE MASANPHAM = ?", (target_sp,))
        next_vid = cur.execute(
            "SELECT ISNULL(MAX(MACHUONGTRINHGIAMGIA), 0) + 1 FROM CHUONG_TRINH_GIAM_GIA"
        ).fetchone()[0]
        cur.execute(
            """
            INSERT INTO CHUONG_TRINH_GIAM_GIA (
                MACHUONGTRINHGIAMGIA, TENMAGIAMGIA, TENCHUONGTRINHGIAMGIA,
                LOAIGIAMGIA, GIATRIGIAM, TOIDA, TOITHIEU, SOLUONGPHIEU,
                SOLUONGDADUNG, MOTA, NGAYBATDAU, NGAYKETTHUC
            )
            VALUES (?, ?, ?, 'GIAM_TIEN', 10000, 10000, 0, ?, 0, 'Concurrent test voucher', '2020-01-01', '2099-12-31')
            """,
            (next_vid, f"CONCUR{next_vid}", "Voucher Concurrent Test", voucher_limit),
        )
        conn.commit()
        conn.close()

        def redeem_order(idx: int):
            with TestClient(self.main.app) as c:
                return c.post(
                    "/api/don-hang",
                    json={
                        "DiaChiNhanHang": f"Voucher Addr #{idx}",
                        "SdtNhanHang": "0904444444",
                        "PhuongThucThanhToan": "COD",
                        "MaChuongTrinhGiamGia": next_vid,
                        "Items": [{"MaSanPham": target_sp, "SoLuongMua": 1}],
                    },
                )

        with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as pool:
            responses = list(pool.map(redeem_order, range(num_threads)))

        ok_res = [r for r in responses if r.status_code == 200]
        err_res = [r for r in responses if r.status_code == 400]

        self.assertLessEqual(len(ok_res), voucher_limit)
        self.assertEqual(len(ok_res), voucher_limit, f"Statuses: {[r.status_code for r in responses]}")
        self.assertEqual(len(err_res), num_threads - voucher_limit)

        conn = self.main.get_db_connection()
        used_count = conn.cursor().execute(
            "SELECT SOLUONGDADUNG FROM CHUONG_TRINH_GIAM_GIA WHERE MACHUONGTRINHGIAMGIA = ?",
            (next_vid,),
        ).fetchone()[0]
        conn.close()
        self.assertLessEqual(used_count, voucher_limit)
        self.assertEqual(used_count, voucher_limit)

    def test_upload_and_ai_reject_fake_image(self):
        fake_bytes = b"<html><body>This is NOT a real JPEG image</body></html>"
        token_user = self.main.create_access_token(2, "user2", "USER")
        token_admin = self.main.create_access_token(999, "admin", "ADMIN")

        # Unauthorized callers to /api/upload must be rejected (401 unauth, 403 non-admin)
        r_unauth = self.client.post(
            "/api/upload",
            files={"file": ("fake.jpg", fake_bytes, "image/jpeg")},
        )
        self.assertEqual(r_unauth.status_code, 401)

        r_non_admin = self.client.post(
            "/api/upload",
            headers={"Authorization": f"Bearer {token_user}"},
            files={"file": ("fake.jpg", fake_bytes, "image/jpeg")},
        )
        self.assertEqual(r_non_admin.status_code, 403)

        # Authorized admin uploading fake .jpg -> 400
        r_admin_fake = self.client.post(
            "/api/upload",
            headers={"Authorization": f"Bearer {token_admin}"},
            files={"file": ("fake.jpg", fake_bytes, "image/jpeg")},
        )
        self.assertEqual(r_admin_fake.status_code, 400, r_admin_fake.text)

        # Public AI endpoint /api/nhan-dien-anh uploading fake .jpg -> 400
        r_ai_fake = self.client.post(
            "/api/nhan-dien-anh",
            files={"file": ("fake.jpg", fake_bytes, "image/jpeg")},
        )
        self.assertEqual(r_ai_fake.status_code, 400, r_ai_fake.text)

    def test_upload_and_ai_reject_oversized_file(self):
        token_admin = self.main.create_access_token(999, "admin", "ADMIN")
        oversized = b"\xff\xd8\xff\xe0" + (b"\x00" * (10 * 1024 * 1024 + 1024))

        r_upload_big = self.client.post(
            "/api/upload",
            headers={"Authorization": f"Bearer {token_admin}"},
            files={"file": ("huge.jpg", oversized, "image/jpeg")},
        )
        self.assertEqual(r_upload_big.status_code, 413, r_upload_big.text)

        r_ai_big = self.client.post(
            "/api/nhan-dien-anh",
            files={"file": ("huge.jpg", oversized, "image/jpeg")},
        )
        self.assertEqual(r_ai_big.status_code, 413, r_ai_big.text)

    def test_force_save_without_validation_blocks_hot_reload(self):
        import online_learning  # noqa: E402

        ol_tmp = self.tmp_dir / "ol_force_save_test"
        model_dir = ol_tmp / "model"
        buf_dir = ol_tmp / "buffer" / "001_test_plant"
        model_dir.mkdir(parents=True, exist_ok=True)
        buf_dir.mkdir(parents=True, exist_ok=True)

        # Create 1 original image + 3 augmented variants (all belonging to 1 unique source group)
        img_paths = []
        for suffix in ["", "_aug_flip", "_aug_rot", "_aug_bright"]:
            p = buf_dir / f"sample_01{suffix}.jpg"
            Image.new("RGB", (32, 32), color=(40, 140, 60)).save(p, format="JPEG")
            img_paths.append(p)

        prod_model_path = model_dir / "best_model_online.keras"
        exp_model_path = model_dir / "experimental_online_force_save.keras"
        status_path = ol_tmp / "online_learning_status.json"
        fake_base_model = model_dir / "base.keras"
        fake_base_model.write_bytes(b"fake-base")

        class _FakeBN:
            pass

        class _FakeLayer:
            def __init__(self):
                self.trainable = True

        class _FakeModel:
            def __init__(self):
                self.input_shape = (None, 32, 32, 3)
                self.layers = [_FakeLayer(), _FakeLayer()]
                self.saved_paths = []

            def compile(self, **kwargs):
                pass

            def fit(self, *args, **kwargs):
                pass

            def evaluate(self, *args, **kwargs):
                return [0.5, 0.8]

            def save(self, path_str):
                self.saved_paths.append(path_str)
                Path(path_str).write_bytes(b"fake-keras-checkpoint")

        fake_tf = types.ModuleType("tensorflow")
        fake_tf.keras = types.SimpleNamespace(
            layers=types.SimpleNamespace(BatchNormalization=_FakeBN),
            optimizers=types.SimpleNamespace(Adam=lambda learning_rate=1e-5: ("adam", learning_rate)),
        )

        fake_model = _FakeModel()
        hot_reload_calls = []

        with mock.patch.dict(os.environ, {"SKIP_AI_LOAD": "0"}), \
             mock.patch.dict(sys.modules, {"tensorflow": fake_tf}), \
             mock.patch.object(online_learning, "ONLINE_MODEL_PATH", prod_model_path), \
             mock.patch.object(online_learning, "EXPERIMENTAL_FORCE_SAVE_MODEL_PATH", exp_model_path), \
             mock.patch.object(online_learning, "STATUS_FILE_PATH", status_path), \
             mock.patch.object(online_learning, "_find_base_model_path", return_value=fake_base_model), \
             mock.patch.object(
                 online_learning,
                 "_collect_online_buffer_samples",
                 return_value=(img_paths, [0, 0, 0, 0], [1.5, 1.5, 1.5, 1.5], 4, 1),
             ), \
             mock.patch.object(online_learning, "_collect_replay_samples", return_value=([], [], [])), \
             mock.patch.object(online_learning, "_load_keras_compat", return_value=fake_model):
            res = online_learning.run_online_incremental_update(
                epochs=1,
                batch_size=2,
                force_save=True,
                on_model_saved=lambda p: hot_reload_calls.append(p),
            )

        self.assertIs(res["quality_gate_passed"], False)
        self.assertIs(res["saved_by_force"], True)
        self.assertIs(res["eligible_for_hot_reload"], False)
        self.assertIs(res["saved"], False)
        self.assertIs(res["model_saved_production"], False)
        self.assertIsNone(res["model_path"])
        self.assertIsNone(res["production_model_path"])
        self.assertFalse(prod_model_path.exists(), "Production best_model_online.keras must NOT be written!")
        self.assertEqual(hot_reload_calls, [], "on_model_saved hot-reload callback must NOT be invoked!")
        self.assertEqual(res["experimental_checkpoint_path"], str(exp_model_path))
        self.assertTrue(exp_model_path.exists(), "Experimental force-save checkpoint must be written separately!")

        # Defensive guard in main.hot_reload_online_model must also refuse experimental checkpoints
        self.assertFalse(self.main.hot_reload_online_model(str(exp_model_path)))

    def test_cors_blocks_disallowed_origin(self):
        # Disallowed origin on preflight OPTIONS and GET /health
        r_evil_opt = self.client.options(
            "/health",
            headers={
                "Origin": "https://evil.example.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        self.assertNotEqual(r_evil_opt.headers.get("access-control-allow-origin"), "https://evil.example.com")
        self.assertNotEqual(r_evil_opt.headers.get("access-control-allow-origin"), "*")
        self.assertNotEqual(r_evil_opt.headers.get("access-control-allow-credentials"), "true")

        r_evil_get = self.client.get(
            "/health",
            headers={"Origin": "https://evil.example.com"},
        )
        self.assertEqual(r_evil_get.status_code, 200)
        self.assertIsNone(r_evil_get.headers.get("access-control-allow-origin"))
        self.assertNotEqual(r_evil_get.headers.get("access-control-allow-credentials"), "true")

        # Allowed origins: http://localhost:5173 and https://localhost
        for allowed_origin in ("http://localhost:5173", "https://localhost"):
            r_ok_get = self.client.get("/health", headers={"Origin": allowed_origin})
            self.assertEqual(r_ok_get.status_code, 200)
            self.assertEqual(r_ok_get.headers.get("access-control-allow-origin"), allowed_origin)
            self.assertNotEqual(r_ok_get.headers.get("access-control-allow-credentials"), "true")

            r_ok_opt = self.client.options(
                "/health",
                headers={
                    "Origin": allowed_origin,
                    "Access-Control-Request-Method": "GET",
                },
            )
            self.assertEqual(r_ok_opt.headers.get("access-control-allow-origin"), allowed_origin)
            self.assertNotEqual(r_ok_opt.headers.get("access-control-allow-credentials"), "true")


if __name__ == "__main__":
    unittest.main()
