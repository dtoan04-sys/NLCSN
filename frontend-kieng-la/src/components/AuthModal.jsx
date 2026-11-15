import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!username || !password || !email) {
          setError('Vui lòng điền đầy đủ tên đăng nhập, mật khẩu và email!');
          return;
        }
        const res = await register({ username, password, fullName, email, phone, address });
        if (!res.success) {
          setError(res.error);
          return;
        }
        onClose();
      } else {
        if (!username || !password) {
          setError('Vui lòng nhập tên đăng nhập và mật khẩu!');
          return;
        }
        const res = await login(username, password);
        if (!res.success) {
          setError(res.error);
          return;
        }
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden my-auto p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">
              {isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập hệ thống'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Tài khoản thành viên Vườn Kiểng Lá</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {error && (
          <div className="my-3 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tên đăng nhập *</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên tài khoản của bạn"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-medium text-xs text-gray-800"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Mật khẩu *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-medium text-xs text-gray-800"
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn An"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-medium text-xs text-gray-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Email liên hệ *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="an.nguyen@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-medium text-xs text-gray-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0909123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-medium text-xs text-gray-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Địa chỉ mặc định</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Quận/Huyện, Tỉnh/Thành phố"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-medium text-xs text-gray-800"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] disabled:opacity-60 text-white font-bold text-xs shadow-md transition-all mt-4 cursor-pointer"
          >
            {loading ? 'Đang xử lý...' : isRegister ? 'Hoàn tất Đăng ký' : 'Đăng nhập ngay'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
          {isRegister ? (
            <p>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                }}
                className="font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                Đăng nhập
              </button>
            </p>
          ) : (
            <p>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                }}
                className="font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                Tạo tài khoản mới
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
