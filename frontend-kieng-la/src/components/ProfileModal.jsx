import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AddressSelector from './AddressSelector';
import {
  apiFetch,
  getApiBaseUrl,
  setCustomApiBaseUrl,
  CUSTOM_API_STORAGE_KEY,
  DEFAULT_TUNNEL_URL,
  DEFAULT_LAN_URL
} from '../config';

export function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const TABS = [
  { id: 'profile', label: 'Hồ sơ', icon: 'person' },
  { id: 'password', label: 'Mật khẩu', icon: 'vpn_key' },
  { id: 'addresses', label: 'Sổ địa chỉ', icon: 'location_on' },
  { id: 'server', label: 'Kết nối Server', icon: 'dns' }
];

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, changePassword } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Tab 1: Profile
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Tab 2: Change Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Tab 3: Address Book
  const [addresses, setAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [newAddrName, setNewAddrName] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrDetail, setNewAddrDetail] = useState('');
  const [newAddrDefault, setNewAddrDefault] = useState(false);
  const [isSavingAddr, setIsSavingAddr] = useState(false);

  // Tab 4: Server Connection
  const [serverUrl, setServerUrl] = useState('');
  const [activeServerUrl, setActiveServerUrl] = useState('');
  const [healthResult, setHealthResult] = useState(null);
  const [isTestingHealth, setIsTestingHealth] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setAvatar(user.avatar || '');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNewAddrName(user.fullName || '');
      setNewAddrPhone(user.phone || '');
      setNewAddrDetail('');
      setNewAddrDefault(false);
      setMsg({ type: '', text: '' });
      setHealthResult(null);

      try {
        const savedCustom = localStorage.getItem(CUSTOM_API_STORAGE_KEY) || '';
        setServerUrl(savedCustom || getApiBaseUrl());
        setActiveServerUrl(getApiBaseUrl());
      } catch (_) {
        setServerUrl(getApiBaseUrl());
        setActiveServerUrl(getApiBaseUrl());
      }
    }
  }, [user, isOpen]);

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setIsLoadingAddresses(true);
    try {
      const res = await apiFetch(`/api/nguoi-dung/${user.id}/dia-chi`);
      if (res.ok) {
        const data = await res.json();
        setAddresses(Array.isArray(data) ? data : data.danh_sach || data.items || []);
      } else {
        setAddresses([]);
      }
    } catch (_) {
      setAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'addresses' && user?.id) {
      fetchAddresses();
    }
  }, [isOpen, activeTab, user?.id]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setIsSavingProfile(true);
    try {
      const res = await updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        avatar: avatar.trim()
      });
      if (res.success) {
        setMsg({ type: 'success', text: 'Đã cập nhật thông tin cá nhân lên máy chủ thành công!' });
      } else {
        setMsg({ type: 'error', text: res.error || 'Có lỗi xảy ra khi cập nhật!' });
      }
    } catch (_) {
      setMsg({ type: 'error', text: 'Không thể kết nối đến máy chủ cập nhật!' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMsg({ type: 'error', text: 'Vui lòng điền đầy đủ mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu!' });
      return;
    }
    if (newPassword.length < 4) {
      setMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 4 ký tự!' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Xác nhận mật khẩu mới không khớp!' });
      return;
    }
    setIsSavingPassword(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setMsg({ type: 'success', text: res.message || 'Đổi mật khẩu thành công!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMsg({ type: 'error', text: res.error || 'Đổi mật khẩu thất bại!' });
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    if (!newAddrName.trim() || !newAddrPhone.trim() || !newAddrDetail.trim()) {
      setMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ giao hàng!' });
      return;
    }
    setIsSavingAddr(true);
    try {
      const payload = {
        TenNguoiNhan: newAddrName.trim(),
        tenNguoiNhan: newAddrName.trim(),
        SdtNguoiNhan: newAddrPhone.trim(),
        sdtNguoiNhan: newAddrPhone.trim(),
        SoDienThoai: newAddrPhone.trim(),
        soDienThoai: newAddrPhone.trim(),
        DiaChiChiTiet: newAddrDetail.trim(),
        diaChiChiTiet: newAddrDetail.trim(),
        DiaChi: newAddrDetail.trim(),
        DatMacDinh: Boolean(newAddrDefault),
        datMacDinh: Boolean(newAddrDefault),
        LaMacDinh: newAddrDefault ? 1 : 0,
        laMacDinh: newAddrDefault
      };
      const res = await apiFetch(`/api/nguoi-dung/${user.id}/dia-chi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ type: 'success', text: 'Đã thêm địa chỉ giao hàng mới!' });
        setNewAddrDetail('');
        setNewAddrDefault(false);
        fetchAddresses();
      } else {
        setMsg({ type: 'error', text: data.detail || 'Không thể lưu địa chỉ mới!' });
      }
    } catch (_) {
      setMsg({ type: 'error', text: 'Lỗi kết nối máy chủ khi thêm địa chỉ!' });
    } finally {
      setIsSavingAddr(false);
    }
  };

  const handleDeleteAddress = async (addrId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này khỏi sổ địa chỉ?')) return;
    setMsg({ type: '', text: '' });
    try {
      const res = await apiFetch(`/api/nguoi-dung/${user.id}/dia-chi/${addrId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Đã xóa địa chỉ giao hàng!' });
        setAddresses((prev) => prev.filter((a) => (a.id ?? a.MaDiaChi ?? a.MADIACHI) !== addrId));
      } else {
        const data = await res.json().catch(() => ({}));
        setMsg({ type: 'error', text: data.detail || 'Không thể xóa địa chỉ!' });
      }
    } catch (_) {
      setMsg({ type: 'error', text: 'Lỗi kết nối khi xóa địa chỉ!' });
    }
  };

  const handleSaveServerUrl = () => {
    const clean = serverUrl.trim().replace(/\/+$/, '');
    setCustomApiBaseUrl(clean);
    setActiveServerUrl(getApiBaseUrl());
    setHealthResult(null);
    setMsg({
      type: 'success',
      text: clean
        ? `Đã lưu URL Server tùy chỉnh: ${clean}`
        : 'Đã đặt lại về URL Server mặc định!'
    });
  };

  const handleResetServerUrl = () => {
    setCustomApiBaseUrl('');
    const nextUrl = getApiBaseUrl();
    setServerUrl(nextUrl);
    setActiveServerUrl(nextUrl);
    setHealthResult(null);
    setMsg({ type: 'success', text: `Đã khôi phục URL mặc định (${nextUrl})` });
  };

  const handleTestHealth = async () => {
    const target = (serverUrl.trim() || getApiBaseUrl()).replace(/\/+$/, '');
    setIsTestingHealth(true);
    setHealthResult(null);
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${target}/health`, { signal: controller.signal });
      clearTimeout(timer);
      const ms = Date.now() - start;
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setHealthResult({
          ok: true,
          text: `Kết nối OK (${ms}ms) — Trạng thái: ${data.status || 'ok'}${
            data.models_loaded !== undefined ? ` • AI Models: ${data.models_loaded}` : ''
          }`
        });
      } else {
        setHealthResult({
          ok: false,
          text: `Server phản hồi lỗi HTTP ${res.status} (${ms}ms)`
        });
      }
    } catch (err) {
      setHealthResult({
        ok: false,
        text: `Không thể kết nối tới ${target}/health (${err?.name === 'AbortError' ? 'Hết thời gian chờ 8s' : 'Lỗi mạng / Tunnel đã đổi'})`
      });
    } finally {
      setIsTestingHealth(false);
    }
  };

  const initials = getInitials(fullName || user.username);
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto animate-fade-in font-['Plus_Jakarta_Sans']">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Header với Avatar */}
        <div className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-md shrink-0 overflow-hidden ${
                isAdmin
                  ? 'bg-gradient-to-tr from-emerald-950 via-emerald-800 to-teal-700 text-emerald-200 border-2 border-emerald-400/50'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white border-2 border-white ring-4 ring-emerald-100'
              }`}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={fullName || user.username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                initials
              )}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"
                title="Đang hoạt động"
              ></span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight truncate">
                  {fullName || user.username}
                </h3>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                    isAdmin
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isAdmin ? 'Quản trị viên' : 'Khách hàng'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium truncate">
                <span className="material-symbols-outlined text-sm text-gray-400">badge</span>
                <span>
                  Tài khoản: <strong>{user.username}</strong>
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
            title="Đóng cửa sổ"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* 4 Tabs Responsive */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-gray-50/80 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTab(t.id);
                setMsg({ type: '', text: '' });
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-[#012d1d] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-900 border border-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-base">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Nội dung Tab (Cuộn độc lập trên mobile) */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {msg.text && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
                msg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              <span className="material-symbols-outlined text-base shrink-0">
                {msg.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{msg.text}</span>
            </div>
          )}

          {/* TAB 1: HỒ SƠ */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-emerald-700">person</span>
                    <span>Họ và tên *</span>
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
                  <label className="font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-emerald-700">mail</span>
                    <span>Địa chỉ Email *</span>
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
                  <label className="font-bold text-gray-700 mb-1.5 flex items-center gap-1">
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
                  <label className="font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-emerald-700">image</span>
                    <span>URL Ảnh đại diện (Avatar)</span>
                  </label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-semibold text-xs text-gray-900 bg-gray-50/50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <AddressSelector
                  value={address}
                  onChange={setAddress}
                  label="Địa chỉ nhận hàng mặc định"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-emerald-400">
                    {isSavingProfile ? 'progress_activity' : 'check'}
                  </span>
                  <span>{isSavingProfile ? 'Đang lưu...' : 'Lưu hồ sơ'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ĐỔI MẬT KHẨU */}
          {activeTab === 'password' && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-amber-700 shrink-0 mt-0.5">security</span>
                <span>Để bảo mật tài khoản, bạn bắt buộc phải nhập chính xác mật khẩu hiện tại trước khi đặt mật khẩu mới.</span>
              </div>

              <div>
                <label className="font-bold text-gray-700 mb-1.5 block">Mật khẩu hiện tại *</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu cũ của bạn"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-semibold text-xs text-gray-900 bg-gray-50/50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 mb-1.5 block">Mật khẩu mới *</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-semibold text-xs text-gray-900 bg-gray-50/50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 mb-1.5 block">Xác nhận mật khẩu mới *</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-semibold text-xs text-gray-900 bg-gray-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-gray-600 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>Hiển thị mật khẩu</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-6 py-2.5 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-emerald-400">lock_reset</span>
                  <span>{isSavingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SỔ ĐỊA CHỈ */}
          {activeTab === 'addresses' && (
            <div className="space-y-5">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-gray-800">Danh sách địa chỉ đã lưu ({addresses.length})</h4>
                  <button
                    type="button"
                    onClick={fetchAddresses}
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    <span>Tải lại</span>
                  </button>
                </div>

                {isLoadingAddresses ? (
                  <div className="py-6 text-center text-gray-400 font-semibold">Đang tải sổ địa chỉ...</div>
                ) : addresses.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center text-gray-500">
                    Chưa có địa chỉ giao hàng nào được lưu trong sổ địa chỉ. Hãy thêm địa chỉ bên dưới!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addresses.map((addr) => {
                      const id = addr.id ?? addr.MaDiaChi ?? addr.MADIACHI;
                      const name = addr.TenNguoiNhan || addr.tenNguoiNhan || addr.TENNGUOINHAN || user.fullName;
                      const tel =
                        addr.SDTNGUOINHAN ||
                        addr.SdtNguoiNhan ||
                        addr.SoDienThoai ||
                        addr.soDienThoai ||
                        addr.SODIENTHOAI ||
                        '';
                      const detail = addr.DiaChiChiTiet || addr.diaChiChiTiet || addr.DIACHICHITIET || addr.DiaChi || '';
                      const isDef = Boolean(
                        addr.DATMACDINH || addr.DatMacDinh || addr.datMacDinh || addr.LaMacDinh || addr.laMacDinh || addr.LAMACDINH
                      );

                      return (
                        <div
                          key={id}
                          className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900">{name}</span>
                              {tel && <span className="text-gray-500 font-medium">• {tel}</span>}
                              {isDef && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 leading-relaxed">{detail}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 shrink-0 cursor-pointer"
                            title="Xóa địa chỉ"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <form onSubmit={handleAddAddress} className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-900/10 space-y-3">
                <h4 className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-emerald-700">add_location_alt</span>
                  <span>Thêm địa chỉ giao hàng mới</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={newAddrName}
                    onChange={(e) => setNewAddrName(e.target.value)}
                    placeholder="Họ tên người nhận *"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-emerald-600 font-medium"
                  />
                  <input
                    type="tel"
                    required
                    value={newAddrPhone}
                    onChange={(e) => setNewAddrPhone(e.target.value)}
                    placeholder="Số điện thoại nhận hàng *"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-emerald-600 font-medium"
                  />
                </div>
                <AddressSelector
                  value={newAddrDetail}
                  onChange={setNewAddrDetail}
                  required
                  label="Địa chỉ giao hàng chi tiết"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <label className="inline-flex items-center gap-2 text-gray-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAddrDefault}
                      onChange={(e) => setNewAddrDefault(e.target.checked)}
                      className="rounded border-gray-300 text-emerald-700"
                    />
                    <span>Đặt làm địa chỉ mặc định</span>
                  </label>
                  <button
                    type="submit"
                    disabled={isSavingAddr}
                    className="px-4 py-2 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs disabled:opacity-60 cursor-pointer"
                  >
                    {isSavingAddr ? 'Đang lưu...' : '+ Lưu địa chỉ'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: KẾT NỐI SERVER */}
          {activeTab === 'server' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">URL Backend đang hoạt động:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Active
                  </span>
                </div>
                <p className="font-mono text-[11px] text-emerald-900 break-all bg-white px-3 py-2 rounded-xl border border-slate-200">
                  {activeServerUrl}
                </p>
                <p className="text-[11px] text-slate-500">
                  Hữu ích trên Android APK khi link Cloudflare Tunnel hoặc IP mạng LAN thay đổi mà không cần build lại ứng dụng.
                </p>
              </div>

              <div>
                <label className="font-bold text-gray-700 mb-1.5 block">Nhập URL Server Backend mới</label>
                <input
                  type="url"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://xxxx.trycloudflare.com hoặc http://192.168.1.x:8000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-mono text-xs text-gray-900 bg-gray-50/50 focus:bg-white"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setServerUrl(DEFAULT_TUNNEL_URL)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] cursor-pointer"
                  >
                    Dùng Tunnel mặc định
                  </button>
                  <button
                    type="button"
                    onClick={() => setServerUrl(DEFAULT_LAN_URL)}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold text-[11px] cursor-pointer"
                  >
                    Dùng LAN ({DEFAULT_LAN_URL})
                  </button>
                  <button
                    type="button"
                    onClick={() => setServerUrl('http://localhost:8000')}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[11px] cursor-pointer"
                  >
                    Localhost:8000
                  </button>
                </div>
              </div>

              {healthResult && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    healthResult.ok
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-base shrink-0">
                    {healthResult.ok ? 'cloud_done' : 'cloud_off'}
                  </span>
                  <span>{healthResult.text}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleResetServerUrl}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
                >
                  Đặt lại mặc định
                </button>
                <button
                  type="button"
                  onClick={handleTestHealth}
                  disabled={isTestingHealth}
                  className="px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">network_check</span>
                  <span>{isTestingHealth ? 'Đang kiểm tra...' : 'Test /health'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveServerUrl}
                  className="px-5 py-2.5 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-emerald-400">save</span>
                  <span>Lưu URL Server</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
