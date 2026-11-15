import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../config';

const AuthContext = createContext();

const STORAGE_KEY = 'florabotanic_user';
const USERS_DB_KEY = 'florabotanic_registered_users';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!localStorage.getItem(USERS_DB_KEY)) {
      const defaultUsers = [
        {
          id: 11,
          username: 'admin',
          password: '123',
          fullName: 'Quản trị viên FloraBotanic',
          email: 'admin@florabotanic.ai',
          phone: '0909123456',
          address: 'Vườn ươm Bảo Lộc, Lâm Đồng',
          role: 'ADMIN',
          createdAt: new Date().toISOString()
        },
        {
          id: 12,
          username: 'khachhang',
          password: '123',
          fullName: 'Nguyễn Văn An',
          email: 'an.nguyen@gmail.com',
          phone: '0987654321',
          address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
          role: 'USER',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(defaultUsers));
    }
  }, []);

  const login = async (username, password) => {
    try {
      const res = await apiFetch('/api/auth/dang-nhap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taiKhoan: username.trim(), matKhau: password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return { success: true };
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          return { success: false, error: errData.detail || 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
        }
      }
    } catch (_) {
      // Fallback sang dữ liệu nội bộ khi chạy tĩnh không có kết nối Backend
    }

    const rawUsers = localStorage.getItem(USERS_DB_KEY);
    const users = rawUsers ? JSON.parse(rawUsers) : [];

    const found = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (found) {
      const safeUser = { ...found };
      delete safeUser.password;
      setUser(safeUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
      return { success: true };
    }
    return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
  };

  const register = async (userData) => {
    try {
      const res = await apiFetch('/api/auth/dang-ky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taiKhoan: userData.username.trim(),
          matKhau: userData.password,
          hoTen: userData.fullName || userData.username.trim(),
          email: userData.email,
          diaChi: userData.address || ''
        })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return { success: true };
      } else if (res.status === 400) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.detail || 'Tên đăng nhập đã tồn tại!' };
      }
    } catch (_) {
      // Fallback sang dữ liệu nội bộ khi chạy tĩnh
    }

    const rawUsers = localStorage.getItem(USERS_DB_KEY);
    const users = rawUsers ? JSON.parse(rawUsers) : [];

    if (users.some((u) => u.username.toLowerCase() === userData.username.trim().toLowerCase())) {
      return { success: false, error: 'Tên đăng nhập đã tồn tại, vui lòng chọn tên khác!' };
    }
    if (users.some((u) => u.email.toLowerCase() === userData.email.trim().toLowerCase())) {
      return { success: false, error: 'Email đã được đăng ký tài khoản khác!' };
    }

    const newUser = {
      id: Date.now(),
      username: userData.username.trim(),
      password: userData.password,
      fullName: userData.fullName || userData.username,
      email: userData.email,
      phone: userData.phone || '',
      address: userData.address || '',
      role: 'USER',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    const safeUser = { ...newUser };
    delete safeUser.password;
    setUser(safeUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));

    return { success: true };
  };

  const updateProfile = async (updatedData) => {
    try {
      const rawUsers = localStorage.getItem(USERS_DB_KEY);
      const users = rawUsers ? JSON.parse(rawUsers) : [];
      const idx = users.findIndex((u) => u.id === user.id || u.username === user.username);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updatedData };
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
      }
      const nextUser = { ...user, ...updatedData };
      delete nextUser.password;
      setUser(nextUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, isAuthenticated: !!user }}>
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
