import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, TOKEN_STORAGE_KEY } from '../config';

const AuthContext = createContext();

const STORAGE_KEY = 'florabotanic_user';
const LEGACY_USERS_DB_KEY = 'florabotanic_registered_users';

function normalizeUser(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const safe = {
    id: raw.id ?? raw.MaNguoiDung ?? raw.MANGUOIDUNG ?? null,
    username: raw.username ?? raw.taiKhoan ?? raw.TaiKhoan ?? raw.TAIKHOAN ?? '',
    fullName: raw.fullName ?? raw.hoTen ?? raw.HoTen ?? raw.HOTEN ?? raw.username ?? '',
    email: raw.email ?? raw.Email ?? raw.EMAIL ?? '',
    phone: raw.phone ?? raw.soDienThoai ?? raw.SoDienThoai ?? raw.SODIENTHOAI ?? '',
    address: raw.address ?? raw.diaChi ?? raw.DiaChi ?? raw.DIACHI ?? '',
    avatar: raw.avatar ?? raw.Avatar ?? raw.AVATAR ?? '',
    role: (raw.role ?? raw.vaiTro ?? raw.VaiTro ?? 'USER').toString().toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
    status: raw.status ?? raw.trangThai ?? raw.TrangThaiTaiKhoan ?? 'HoatDong'
  };
  return safe;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? normalizeUser(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });

  // Dọn sạch dữ liệu mật khẩu plain-text cũ trong localStorage nếu từng tồn tại
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_USERS_DB_KEY);
    } catch (_) {}
  }, []);

  const persistSession = (data) => {
    const safeUser = normalizeUser(data?.user || data);
    const token = data?.token || data?.access_token || null;
    setUser(safeUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
    } catch (_) {}
    return safeUser;
  };

  const login = async (username, password) => {
    try {
      const res = await apiFetch('/api/auth/dang-nhap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taiKhoan: username.trim(), matKhau: password })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const safeUser = persistSession(data);
        return { success: true, user: safeUser };
      }
      return {
        success: false,
        error: data.detail || 'Tên đăng nhập hoặc mật khẩu không chính xác!'
      };
    } catch (err) {
      return {
        success: false,
        error: 'Không thể kết nối đến máy chủ xác thực! Vui lòng kiểm tra mạng hoặc cấu hình URL Server.'
      };
    }
  };

  const register = async (userData) => {
    try {
      const phoneVal = (userData.phone || '').trim();
      const res = await apiFetch('/api/auth/dang-ky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taiKhoan: userData.username.trim(),
          matKhau: userData.password,
          hoTen: (userData.fullName || userData.username).trim(),
          email: (userData.email || '').trim(),
          phone: phoneVal,
          soDienThoai: phoneVal,
          SoDienThoai: phoneVal,
          diaChi: (userData.address || '').trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const safeUser = persistSession(data);
        return { success: true, user: safeUser };
      }
      return {
        success: false,
        error: data.detail || 'Đăng ký thất bại, vui lòng kiểm tra lại thông tin!'
      };
    } catch (err) {
      return {
        success: false,
        error: 'Không thể kết nối đến máy chủ để đăng ký tài khoản!'
      };
    }
  };

  const updateProfile = async (updatedData) => {
    if (!user?.id && !user?.username) {
      return { success: false, error: 'Bạn chưa đăng nhập!' };
    }
    const identifier = user.id || user.username;
    try {
      const hoTen = updatedData.fullName ?? updatedData.HoTen ?? user.fullName;
      const email = updatedData.email ?? updatedData.Email ?? user.email;
      const soDienThoai = updatedData.phone ?? updatedData.SoDienThoai ?? user.phone ?? '';
      const diaChi = updatedData.address ?? updatedData.DiaChi ?? user.address ?? '';
      const avatar = updatedData.avatar ?? updatedData.Avatar ?? user.avatar ?? '';

      const payload = {
        hoTen,
        HoTen: hoTen,
        email,
        Email: email,
        soDienThoai,
        SoDienThoai: soDienThoai,
        phone: soDienThoai,
        diaChi,
        DiaChi: diaChi,
        avatar,
        Avatar: avatar
      };

      const res = await apiFetch(`/api/nguoi-dung/${encodeURIComponent(identifier)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.detail || 'Cập nhật hồ sơ thất bại!' };
      }

      const nextUser = normalizeUser({
        ...user,
        fullName: hoTen,
        email,
        phone: soDienThoai,
        address: diaChi,
        avatar,
        ...(data.user || {})
      });
      setUser(nextUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      } catch (_) {}
      return { success: true, user: nextUser };
    } catch (err) {
      return { success: false, error: err?.message || 'Không thể kết nối đến máy chủ cập nhật!' };
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    if (!user?.id && !user?.username) {
      return { success: false, error: 'Bạn chưa đăng nhập!' };
    }
    if (!oldPassword || !newPassword) {
      return { success: false, error: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới!' };
    }
    const identifier = user.id || user.username;
    try {
      const res = await apiFetch(`/api/nguoi-dung/${encodeURIComponent(identifier)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          MatKhauCu: oldPassword,
          matKhauCu: oldPassword,
          MatKhauMoi: newPassword,
          matKhauMoi: newPassword
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.detail || 'Đổi mật khẩu thất bại!' };
      }
      return { success: true, message: data.message || 'Đổi mật khẩu thành công!' };
    } catch (err) {
      return { success: false, error: 'Không thể kết nối đến máy chủ để đổi mật khẩu!' };
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (_) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
