"""Integration tests for authentication, ownership, server-side shipping, and order rollback.

Run with:
    python -m unittest -v ai-service/tests/test_security_and_orders.py
"""

import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

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


if __name__ == "__main__":
    unittest.main()
