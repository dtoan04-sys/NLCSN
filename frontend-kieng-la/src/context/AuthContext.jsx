import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Khởi tạo danh sách tài khoản mẫu theo CDM NGUOI_DUNG
  useEffect(() => {
    if (!localStorage.getItem(USERS_DB_KEY)) {
      const defaultUsers = [
        {
          id: 1,
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
          id: 2,
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

  const login = (username, password) => {
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

  const register = (userData) => {
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
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updatedData };
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
        const safeUser = { ...users[idx] };
        delete safeUser.password;
        setUser(safeUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
        return { success: true };
      }
      return { success: false, error: 'Không tìm thấy người dùng' };
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
