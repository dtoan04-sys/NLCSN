import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setPassword('');
      setMsg({ type: '', text: '' });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setIsSaving(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        ...(password.trim() ? { password: password.trim() } : {})
      };

      const res = await updateProfile(payload);
      if (res.success) {
        setMsg({ type: 'success', text: '✅ Đã cập nhật thông tin cá nhân thành công!' });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMsg({ type: 'error', text: res.error || 'Có lỗi xảy ra khi cập nhật!' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Không thể kết nối đến máy chủ cập nhật!' });
    } finally {
      setIsSaving(false);
    }
  };

  const initials = getInitials(fullName || user.username);
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto animate-fade-in font-['Plus_Jakarta_Sans']">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-auto p-6 sm:p-8 border border-gray-100">
        
        {/* Header với Avatar chữ lớn */}
        <div className="flex items-start justify-between pb-5 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-md ${
              isAdmin
                ? 'bg-gradient-to-tr from-emerald-950 via-emerald-800 to-teal-700 text-emerald-200 border-2 border-emerald-400/50'
                : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white border-2 border-white ring-4 ring-emerald-100'
            }`}>
              {initials}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" title="Đang hoạt động"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  {fullName || user.username}
                </h3>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isAdmin ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isAdmin ? 'Quản trị viên' : 'Khách hàng'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-sm text-gray-400">badge</span>
                <span>Tài khoản: <strong>{user.username}</strong></span>
                <span className="text-gray-300">•</span>
                <span className="text-emerald-700 font-semibold">CDM: NGUOI_DUNG</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Đóng cửa sổ"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Thông báo cập nhật */}
        {msg.text && (
          <div className={`my-4 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <span className="material-symbols-outlined text-base">
              {msg.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{msg.text}</span>
          </div>
        )}

        {/* Form chỉnh sửa thông tin */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-emerald-700">person</span>
                <span>Họ và tên</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn An"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-semibold text-xs text-gray-900 bg-gray-50/50 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-emerald-700">mail</span>
                <span>Địa chỉ Email</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="an.nguyen@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-semibold text-xs text-gray-900 bg-gray-50/50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-emerald-700">call</span>
                <span>Số điện thoại</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0987654321"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-semibold text-xs text-gray-900 bg-gray-50/50 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-emerald-700">vpn_key</span>
                <span>Đổi mật khẩu mới (tùy chọn)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Để trống nếu không đổi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-semibold text-xs text-gray-900 bg-gray-50/50 focus:bg-white transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined text-base">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-emerald-700">location_on</span>
              <span>Địa chỉ nhận hàng mặc định</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: 123 Nguyễn Văn Cừ, Quận 5, TP.HCM"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-semibold text-xs text-gray-900 bg-gray-50/50 focus:bg-white transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base text-emerald-400">check</span>
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
