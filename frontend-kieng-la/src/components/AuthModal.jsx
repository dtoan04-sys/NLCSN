import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  apiFetch,
  checkApiHealth,
  getApiBaseUrl,
  setCustomApiBaseUrl,
  CUSTOM_API_STORAGE_KEY,
  DEFAULT_TUNNEL_URL,
  DEFAULT_LAN_URL
} from '../config';
import AddressSelector from './AddressSelector';

function isNetworkErrorText(msg) {
  return /không thể kết nối|máy chủ|mạng|timeout|failed to fetch|network|url server/i.test(msg || '');
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  // mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Forgot password states
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otpSentInfo, setOtpSentInfo] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: request OTP, 2: reset password

  // Server connection config & health status (usable before login on APK)
  const [showServerPanel, setShowServerPanel] = useState(false);
  const [serverInputUrl, setServerInputUrl] = useState('');
  const [serverStatus, setServerStatus] = useState({
    state: 'checking', // 'checking' | 'ok' | 'error'
    url: '',
    text: 'Đang kiểm tra kết nối Server...'
  });
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [serverFeedback, setServerFeedback] = useState({ type: '', text: '' });

  const [error, setError] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const runServerHealthCheck = async (explicitUrl = '') => {
    setIsTestingServer(true);
    setServerStatus((prev) => ({
      ...prev,
      state: 'checking',
      text: 'Đang kiểm tra /health...'
    }));
    try {
      const res = await checkApiHealth(explicitUrl, 8000);
      if (res.ok) {
        if (res.clearedDeadCustomUrl) {
          setServerInputUrl(res.url);
        }
        setServerStatus({
          state: 'ok',
          url: res.url,
          ms: res.ms,
          text: `Server & CSDL sẵn sàng (${res.ms}ms${res.data?.model_version ? ` • ${res.data.model_version}` : ''})`
        });
        return res;
      }
      setServerStatus({
        state: 'error',
        url: res.url,
        text: `Không kết nối được (${res.error || 'Lỗi mạng'})`
      });
      return res;
    } finally {
      setIsTestingServer(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (isOpen) {
      setError('');
      setIsNetworkError(false);
      setSuccessMsg('');
      setServerFeedback({ type: '', text: '' });
      try {
        const saved = localStorage.getItem(CUSTOM_API_STORAGE_KEY) || '';
        setServerInputUrl(saved || getApiBaseUrl());
      } catch (_) {
        setServerInputUrl(getApiBaseUrl());
      }

      setIsTestingServer(true);
      setServerStatus({
        state: 'checking',
        url: getApiBaseUrl(),
        text: 'Đang kiểm tra kết nối Server...'
      });
      checkApiHealth('', 7000).then((res) => {
        if (!active) return;
        setIsTestingServer(false);
        if (res.ok) {
          if (res.clearedDeadCustomUrl) {
            setServerInputUrl(res.url);
          }
          setServerStatus({
            state: 'ok',
            url: res.url,
            ms: res.ms,
            text: `Server & CSDL sẵn sàng (${res.ms}ms${res.data?.model_version ? ` • ${res.data.model_version}` : ''})`
          });
        } else {
          setServerStatus({
            state: 'error',
            url: res.url,
            text: `Mất kết nối Server (${res.error || 'Lỗi mạng'})`
          });
        }
      });
    } else {
      setMode('login');
      setPassword('');
      setForgotStep(1);
      setOtpCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setOtpSentInfo('');
      setError('');
      setIsNetworkError(false);
      setSuccessMsg('');
      setShowServerPanel(false);
      setServerFeedback({ type: '', text: '' });
    }
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setIsNetworkError(false);
    setSuccessMsg('');
    if (nextMode === 'forgot') {
      setForgotStep(1);
      setOtpSentInfo('');
      setOtpCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  const handleSaveAndTestServer = async () => {
    setServerFeedback({ type: '', text: '' });
    const cleanInput = serverInputUrl.trim();
    setCustomApiBaseUrl(cleanInput);
    const activeUrl = getApiBaseUrl();
    setServerInputUrl(activeUrl);
    const res = await runServerHealthCheck(activeUrl);
    if (res.ok) {
      setServerFeedback({
        type: 'success',
        text: `Đã lưu & kết nối thành công tới ${res.url} (${res.ms}ms)! Bạn có thể đăng nhập ngay.`
      });
      setIsNetworkError(false);
      setError('');
    } else {
      setServerFeedback({
        type: 'error',
        text: `Đã lưu URL nhưng chưa kết nối được ${res.url}/health (${res.error}).`
      });
    }
  };

  const handleResetDefaultServer = async () => {
    setServerFeedback({ type: '', text: '' });
    setCustomApiBaseUrl('');
    const fallbackUrl = getApiBaseUrl();
    setServerInputUrl(fallbackUrl);
    const res = await runServerHealthCheck('');
    if (res.ok) {
      setServerInputUrl(res.url);
      setServerFeedback({
        type: 'success',
        text: `Đã đặt lại mặc định & kết nối OK (${res.url}, ${res.ms}ms).`
      });
      setIsNetworkError(false);
      setError('');
    } else {
      setServerFeedback({
        type: 'error',
        text: `Đã đặt lại mặc định (${fallbackUrl}) nhưng chưa phản hồi (${res.error}).`
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsNetworkError(false);
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!username.trim() || !password || !email.trim()) {
          setError('Vui lòng điền đầy đủ tên đăng nhập, mật khẩu và email!');
          return;
        }
        const res = await register({ username, password, fullName, email, phone, address });
        if (!res.success) {
          setError(res.error);
          if (isNetworkErrorText(res.error)) {
            setIsNetworkError(true);
            setServerStatus((prev) => ({ ...prev, state: 'error', text: 'Không thể kết nối đến máy chủ' }));
          }
          return;
        }
        onClose();
        if (onLoginSuccess && res.user) {
          onLoginSuccess(res.user);
        }
      } else if (mode === 'login') {
        if (!username.trim() || !password) {
          setError('Vui lòng nhập tên đăng nhập và mật khẩu!');
          return;
        }
        const res = await login(username, password);
        if (!res.success) {
          setError(res.error);
          if (isNetworkErrorText(res.error)) {
            setIsNetworkError(true);
            setServerStatus((prev) => ({ ...prev, state: 'error', text: 'Không thể kết nối đến máy chủ' }));
          }
          return;
        }
        onClose();
        if (onLoginSuccess && res.user) {
          onLoginSuccess(res.user);
        }
      } else if (mode === 'forgot') {
        const ident = forgotIdentifier.trim();
        if (!ident) {
          setError('Vui lòng nhập email hoặc tên đăng nhập của tài khoản!');
          return;
        }
        const isEmail = ident.includes('@');
        const basePayload = isEmail
          ? { email: ident, ten_dang_nhap: '' }
          : { ten_dang_nhap: ident, email: '' };

        if (forgotStep === 1) {
          const res = await apiFetch('/api/auth/quen-mat-khau', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(basePayload)
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setError(data.detail || 'Không tìm thấy tài khoản khớp với thông tin đã nhập!');
            return;
          }
          const demoCode = data.ma_xac_nhan_demo || data.ma_xac_nhan || data.otp || data.demo_otp || '';
          setOtpSentInfo(
            demoCode
              ? `${data.message || 'Đã tạo mã xác nhận khôi phục mật khẩu.'} Mã OTP demo: ${demoCode}`
              : data.message || 'Đã gửi mã xác nhận! Vui lòng nhập mã OTP và mật khẩu mới.'
          );
          if (demoCode) setOtpCode(String(demoCode));
          setForgotStep(2);
        } else {
          if (!newPassword || newPassword.length < 4) {
            setError('Mật khẩu mới phải có ít nhất 4 ký tự!');
            return;
          }
          if (newPassword !== confirmNewPassword) {
            setError('Xác nhận mật khẩu mới không khớp!');
            return;
          }
          const res = await apiFetch('/api/auth/quen-mat-khau', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...basePayload,
              ma_xac_nhan: otpCode.trim(),
              mat_khau_moi: newPassword
            })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setError(data.detail || 'Mã xác nhận không hợp lệ hoặc đã hết hạn!');
            return;
          }
          setSuccessMsg(data.message || 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
          setUsername(isEmail ? '' : ident);
          setPassword('');
          setTimeout(() => {
            setMode('login');
            setForgotStep(1);
            setOtpSentInfo('');
            setError('');
          }, 1400);
        }
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ! Vui lòng kiểm tra mạng hoặc cấu hình URL Server bên dưới.');
      setIsNetworkError(true);
      setServerStatus((prev) => ({ ...prev, state: 'error', text: 'Không thể kết nối đến máy chủ' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className={`relative w-full ${mode === 'register' ? 'max-w-lg' : 'max-w-md'} bg-white rounded-3xl shadow-2xl overflow-hidden my-auto p-6 sm:p-8`}>
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">
              {mode === 'register'
                ? 'Đăng ký tài khoản'
                : mode === 'forgot'
                ? 'Khôi phục mật khẩu'
                : 'Đăng nhập hệ thống'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {mode === 'forgot'
                ? 'Xác thực tài khoản để đặt lại mật khẩu mới'
                : 'Tài khoản thành viên Vườn Kiểng Lá'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Thanh trạng thái kết nối Server/CSDL & nút mở panel cấu hình nhanh (dùng được trước khi đăng nhập) */}
        <div className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  serverStatus.state === 'ok'
                    ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]'
                    : serverStatus.state === 'error'
                    ? 'bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.2)]'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span
                className={`text-[11px] font-bold truncate ${
                  serverStatus.state === 'ok'
                    ? 'text-emerald-800'
                    : serverStatus.state === 'error'
                    ? 'text-red-700'
                    : 'text-amber-700'
                }`}
                title={serverStatus.text}
              >
                {serverStatus.text}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowServerPanel((prev) => !prev)}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 text-[11px] font-bold text-slate-700 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">dns</span>
              <span>{showServerPanel ? 'Thu gọn' : 'Cấu hình Server'}</span>
            </button>
          </div>

          {showServerPanel && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 space-y-2 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-700">Cấu hình kết nối Server / Kiểm tra CSDL</span>
                <span className="text-[10px] font-mono text-slate-500 truncate max-w-[55%]" title={serverStatus.url || getApiBaseUrl()}>
                  {serverStatus.url || getApiBaseUrl()}
                </span>
              </div>

              <input
                type="url"
                value={serverInputUrl}
                onChange={(e) => setServerInputUrl(e.target.value)}
                placeholder="https://xxxx.trycloudflare.com hoặc http://192.168.1.x:8000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-emerald-600 font-mono text-[11px] text-slate-800"
              />

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setServerInputUrl(DEFAULT_TUNNEL_URL)}
                  className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[10px] cursor-pointer"
                >
                  Tunnel mặc định
                </button>
                <button
                  type="button"
                  onClick={() => setServerInputUrl(DEFAULT_LAN_URL)}
                  className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold text-[10px] cursor-pointer"
                >
                  LAN ({DEFAULT_LAN_URL.replace(/^https?:\/\//, '')})
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaultServer}
                  disabled={isTestingServer}
                  className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[10px] disabled:opacity-60 cursor-pointer"
                >
                  Đặt lại mặc định
                </button>
              </div>

              {serverFeedback.text && (
                <div
                  className={`px-2.5 py-2 rounded-xl font-semibold text-[11px] flex items-start gap-1.5 ${
                    serverFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">
                    {serverFeedback.type === 'success' ? 'cloud_done' : 'cloud_off'}
                  </span>
                  <span>{serverFeedback.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => runServerHealthCheck(serverInputUrl)}
                  disabled={isTestingServer}
                  className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-[11px] flex items-center gap-1 disabled:opacity-60 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">network_check</span>
                  <span>{isTestingServer ? 'Đang test...' : 'Test /health'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndTestServer}
                  disabled={isTestingServer}
                  className="px-3 py-1.5 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-[11px] flex items-center gap-1 disabled:opacity-60 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-emerald-400">save</span>
                  <span>Lưu & Kiểm tra</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="my-3 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold border border-red-100 space-y-2">
            <div className="flex items-start gap-1.5">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
            {isNetworkError && (
              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-red-100">
                <span className="text-[11px] font-medium text-red-500">
                  APK không kết nối được Backend/CSDL? Dán URL Tunnel hoặc LAN mới tại đây:
                </span>
                <button
                  type="button"
                  onClick={() => setShowServerPanel(true)}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold cursor-pointer"
                >
                  Cấu hình Server
                </button>
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className="my-3 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200">
            <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'forgot' ? (
          <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Email hoặc Tên đăng nhập *</label>
              <input
                type="text"
                required
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
                disabled={forgotStep === 2}
                placeholder="VD: khachhang hoặc an.nguyen@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-medium text-xs text-gray-800 disabled:bg-gray-100"
              />
            </div>

            {otpSentInfo && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                {otpSentInfo}
              </div>
            )}

            {forgotStep === 2 && (
              <>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mã xác nhận (OTP) *</label>
                  <input
                    type="text"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Nhập mã OTP 6 chữ số"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-mono font-bold text-xs text-gray-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mật khẩu mới *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-medium text-xs text-gray-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Xác nhận mật khẩu mới *</label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
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
              {loading
                ? 'Đang xử lý...'
                : forgotStep === 1
                ? 'Lấy mã xác nhận (OTP)'
                : 'Xác nhận đổi mật khẩu'}
            </button>
          </form>
        ) : (
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
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-gray-700">Mật khẩu *</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-medium text-xs text-gray-800"
              />
            </div>

            {mode === 'register' && (
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
                  <AddressSelector
                    value={address}
                    onChange={setAddress}
                    label="Địa chỉ mặc định"
                    compact
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] disabled:opacity-60 text-white font-bold text-xs shadow-md transition-all mt-4 cursor-pointer"
            >
              {loading
                ? 'Đang xử lý...'
                : mode === 'register'
                ? 'Hoàn tất Đăng ký'
                : 'Đăng nhập ngay'}
            </button>
          </form>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
          {mode === 'register' ? (
            <p>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                Đăng nhập
              </button>
            </p>
          ) : mode === 'forgot' ? (
            <p>
              Nhớ lại mật khẩu?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                Quay lại Đăng nhập
              </button>
            </p>
          ) : (
            <p>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
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
