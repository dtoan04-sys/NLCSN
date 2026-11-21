import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../config';
import AddressSelector from './AddressSelector';

const SHIPPING_FEE_DEFAULT = 30000;
const FREE_SHIP_THRESHOLD = 500000;

export default function CheckoutModal({ isOpen, onClose, onOpenAuth }) {
  const { items, totalPrice, clearCart, showToast, syncCartWithDb } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    paymentMethod: 'COD', // COD | BANK_QR | MOMO
    note: ''
  });

  // Voucher state
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null); // { id, code, discount, message }
  const [voucherError, setVoucherError] = useState('');
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [copiedMemo, setCopiedMemo] = useState(false);

  // Saved addresses quick-pick
  const [savedAddresses, setSavedAddresses] = useState([]);

  // Submission state
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  // Đồng bộ formData khi user thay đổi
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName || '',
        phone: user.phone || prev.phone || '',
        address: user.address || prev.address || ''
      }));
    } else {
      setFormData({
        fullName: '',
        phone: '',
        address: '',
        paymentMethod: 'COD',
        note: ''
      });
    }
  }, [user]);

  // Reset trạng thái khi đóng modal & tải sổ địa chỉ khi mở modal
  useEffect(() => {
    if (!isOpen) {
      setIsSuccess(false);
      setCreatedOrder(null);
      setSubmitError('');
      setVoucherInput('');
      setAppliedVoucher(null);
      setVoucherError('');
      return;
    }

    if (syncCartWithDb) {
      syncCartWithDb();
    }

    if (user?.id) {
      apiFetch(`/api/nguoi-dung/${user.id}/dia-chi`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.danh_sach || [];
          setSavedAddresses(list);
        })
        .catch(() => setSavedAddresses([]));
    }

    apiFetch('/api/giam-gia')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const now = Date.now();
        const list = (Array.isArray(data) ? data : []).filter((v) => {
          const bdRaw = v.NgayBatDau || v.NGAYBATDAU;
          const ktRaw = v.NgayKetThuc || v.NGAYKETTHUC;
          const bd = bdRaw ? Date.parse(String(bdRaw).replace(' ', 'T')) : NaN;
          const kt = ktRaw ? Date.parse(String(ktRaw).replace(' ', 'T')) : NaN;
          if (!Number.isNaN(bd) && now < bd) return false;
          if (!Number.isNaN(kt) && now > kt) return false;
          const qty = v.SoLuongPhieu ?? v.SOLUONGPHIEU;
          const used = Number(v.SoLuongDaDung ?? v.SOLUONGDADUNG ?? 0);
          if (qty !== null && qty !== undefined && used >= Number(qty)) return false;
          return true;
        });
        setAvailableVouchers(list);
      })
      .catch(() => setAvailableVouchers([]));
  }, [isOpen, user?.id]);

  // Reset voucher nếu tổng tiền giỏ thay đổi xuống dưới điều kiện
  useEffect(() => {
    if (appliedVoucher && totalPrice <= 0) {
      setAppliedVoucher(null);
    }
  }, [totalPrice, appliedVoucher]);

  if (!isOpen) return null;

  const shippingFee = items.length === 0 ? 0 : totalPrice >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE_DEFAULT;
  const discountAmount = appliedVoucher ? Math.min(Number(appliedVoucher.discount || 0), totalPrice) : 0;
  const finalTotal = Math.max(0, totalPrice - discountAmount + shippingFee);
  const transferMemo = `FLORABOTANIC ${user?.username || 'KHACH'} ${Math.round(finalTotal)}`;
  const vietQrUrl = `https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${Math.round(
    finalTotal
  )}&addInfo=${encodeURIComponent(transferMemo)}`;
  const momoQrData = `2|99|0987654321|FLORABOTANIC AI||0|0|${Math.round(finalTotal)}|${transferMemo}|transfer_myqr`;
  const momoQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(momoQrData)}`;

  const handleCopyMemo = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(transferMemo).catch(() => {});
    }
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 1800);
  };

  const handleApplyVoucher = async (overrideCode) => {
    const code = (typeof overrideCode === 'string' ? overrideCode : voucherInput).trim().toUpperCase();
    if (typeof overrideCode === 'string') {
      setVoucherInput(code);
    }
    setVoucherError('');
    if (!code) {
      setVoucherError('Vui lòng nhập hoặc chọn một mã giảm giá bên dưới!');
      return;
    }
    if (items.length === 0 || totalPrice <= 0) {
      setVoucherError('Giỏ hàng đang trống, không thể áp dụng mã giảm giá!');
      return;
    }

    setIsCheckingVoucher(true);
    try {
      const res = await apiFetch('/api/giam-gia/kiem-tra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          MaGiamGia: code,
          TamTinh: totalPrice
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.hopLe) {
        const v = data.voucher || {};
        setAppliedVoucher({
          id: v.MaChuongTrinhGiamGia || v.MACHUONGTRINHGIAMGIA || null,
          code: v.TenMaGiamGia || v.TENMAGIAMGIA || code,
          discount: Number(data.soTienGiam || 0),
          message: data.thongBao || `Đã áp dụng mã ${code}!`
        });
        setVoucherError('');
      } else {
        setAppliedVoucher(null);
        setVoucherError(data.detail || 'Mã giảm giá không hợp lệ hoặc đã hết hạn!');
      }
    } catch (_) {
      setAppliedVoucher(null);
      setVoucherError('Không thể kiểm tra mã giảm giá lúc này. Vui lòng thử lại!');
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
    setVoucherError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!isAuthenticated) {
      onClose();
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!items || items.length === 0) {
      setSubmitError('Giỏ hàng của bạn đang trống! Vui lòng thêm chậu cây trước khi đặt hàng.');
      return;
    }

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setSubmitError('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận cây!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        MaNguoiDung: user?.id ? Number(user.id) : null,
        TenKhachHang: formData.fullName.trim(),
        SdtNhanHang: formData.phone.trim(),
        DiaChiNhanHang: formData.address.trim(),
        PhuongThucThanhToan: formData.paymentMethod,
        TamTinh: totalPrice,
        SoTienGiam: discountAmount,
        MaChuongTrinhGiamGia: appliedVoucher?.id || null,
        PhiVanChuyen: shippingFee,
        TongTien: finalTotal,
        GhiChu: formData.note.trim(),
        Items: items.map((i) => ({
          MaSanPham: Number(i.product.id),
          SoLuongMua: Number(i.quantity),
          DonGiaMua: Number(i.product.price)
        }))
      };

      const res = await apiFetch('/api/don-hang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(data.detail || 'Đặt hàng thất bại! Vui lòng kiểm tra tồn kho hoặc thông tin đơn hàng.');
        return;
      }

      const confirmedTotal = Number(data.TongTien ?? finalTotal);
      const orderId = data.MaDonHang ? `#DH-${data.MaDonHang}` : 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      const newOrder = {
        orderId,
        maDonHang: data.MaDonHang || null,
        userId: user.id,
        customerName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        paymentMethod: formData.paymentMethod,
        note: formData.note.trim(),
        subTotal: totalPrice,
        discountAmount,
        shippingFee,
        voucherCode: appliedVoucher?.code || null,
        totalAmount: confirmedTotal,
        status: data.TrangThai || 'Chờ xử lý',
        createdAt: new Date().toLocaleString('vi-VN'),
        items: items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          total: i.product.price * i.quantity
        }))
      };

      setCreatedOrder(newOrder);
      setIsSuccess(true);
      clearCart();
      if (showToast) {
        showToast(`✅ Đặt hàng thành công ${orderId}!`);
      }
    } catch (err) {
      setSubmitError('Không thể kết nối tới máy chủ để tạo đơn hàng! Vui lòng kiểm tra mạng và thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto p-5 sm:p-8 max-h-[92vh] overflow-y-auto">
        {!isAuthenticated ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">Yêu cầu đăng nhập để Đặt hàng</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
                Mỗi đơn đặt cây cần được định danh qua tài khoản khách hàng để quản lý bảo hành và theo dõi vận chuyển.
              </p>
            </div>
            <div className="flex gap-2 max-w-xs mx-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs cursor-pointer"
              >
                Để sau
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAuth) onOpenAuth();
                }}
                className="flex-1 py-3 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        ) : !isSuccess ? (
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-emerald-800">local_shipping</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Xác nhận Đặt hàng (Checkout)</h3>
                  <p className="text-xs text-gray-500">
                    Khách hàng: <strong className="text-emerald-800 font-bold">{user.fullName || user.username}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">shopping_cart</span>
                </div>
                <p className="text-sm font-bold text-gray-700">Giỏ hàng của bạn đang trống</p>
                <p className="text-xs text-gray-500">Hãy chọn ít nhất 1 chậu cây trước khi tiến hành thanh toán.</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[#012d1d] text-white font-bold text-xs cursor-pointer"
                >
                  Quay lại chọn cây
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
                {submitError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-base shrink-0">error</span>
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Chọn nhanh từ Sổ địa chỉ nếu có */}
                {savedAddresses.length > 0 && (
                  <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-900/10 space-y-2">
                    <span className="font-bold text-emerald-950 flex items-center gap-1 text-[11px]">
                      <span className="material-symbols-outlined text-sm text-emerald-700">bookmarks</span>
                      <span>Chọn nhanh từ Sổ địa chỉ:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {savedAddresses.map((addr) => {
                        const id = addr.id ?? addr.MaDiaChi ?? addr.MADIACHI;
                        const name = addr.TenNguoiNhan || addr.tenNguoiNhan || addr.TENNGUOINHAN || user.fullName;
                        const tel =
                          addr.SDTNGUOINHAN ||
                          addr.SdtNguoiNhan ||
                          addr.SoDienThoai ||
                          addr.soDienThoai ||
                          addr.SODIENTHOAI ||
                          '';
                        const detail = addr.DiaChiChiTiet || addr.diaChiChiTiet || addr.DIACHICHITIET || '';
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                fullName: name || prev.fullName,
                                phone: tel || prev.phone,
                                address: detail || prev.address
                              }))
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-900 font-semibold text-[11px] truncate max-w-full cursor-pointer"
                          >
                            {name} — {detail}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Họ và tên người nhận *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Nguyễn Văn An"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-medium text-xs text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Số điện thoại nhận hàng *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0909123456"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-medium text-xs text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <AddressSelector
                    value={formData.address}
                    onChange={(nextAddr) => setFormData((prev) => ({ ...prev, address: nextAddr }))}
                    required
                    label="Địa chỉ giao cây tận nơi"
                  />
                </div>

                {/* Mã giảm giá (Voucher) */}
                <div className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/70 space-y-2">
                  <label className="font-bold text-gray-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-amber-600">confirmation_number</span>
                    <span>Mã giảm giá (Voucher)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherInput}
                      onChange={(e) => {
                        setVoucherInput(e.target.value.toUpperCase());
                        if (voucherError) setVoucherError('');
                      }}
                      placeholder="Nhập mã ưu đãi hoặc chọn nhanh bên dưới..."
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-emerald-600 font-mono font-bold text-xs uppercase text-gray-800"
                    />
                    {appliedVoucher ? (
                      <button
                        type="button"
                        onClick={handleRemoveVoucher}
                        className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs shrink-0 cursor-pointer"
                      >
                        Gỡ mã
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyVoucher()}
                        disabled={isCheckingVoucher}
                        className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shrink-0 disabled:opacity-60 cursor-pointer"
                      >
                        {isCheckingVoucher ? 'Đang kiểm tra...' : 'Áp dụng'}
                      </button>
                    )}
                  </div>
                  {availableVouchers.length > 0 && !appliedVoucher && (
                    <div className="pt-1 space-y-1.5">
                      <p className="text-[11px] font-semibold text-amber-900">Mã ưu đãi đang hiệu lực (chạm để áp dụng nhanh):</p>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                        {availableVouchers.map((v) => {
                          const vId = v.MaChuongTrinhGiamGia ?? v.MACHUONGTRINHGIAMGIA;
                          const vCode = String(v.TenMaGiamGia || v.TENMAGIAMGIA || '').trim();
                          const vType = String(v.LoaiGiamGia || v.LOAIGIAMGIA || '').toLowerCase();
                          const vVal = Number(v.GiaTriGiam ?? v.GIATRIGIAM ?? 0);
                          const vMin = Number(v.ToiThieu ?? v.TOITHIEU ?? 0);
                          const isPercent = vType.includes('phan') || vType.includes('%') || vType === 'percent';
                          const labelVal = isPercent ? `Giảm ${vVal}%` : `Giảm ${vVal.toLocaleString('vi-VN')}đ`;
                          const eligible = totalPrice >= vMin;
                          return (
                            <button
                              key={vId || vCode}
                              type="button"
                              disabled={isCheckingVoucher || !eligible}
                              onClick={() => handleApplyVoucher(vCode)}
                              title={v.MoTa || v.MOTA || labelVal}
                              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1 ${
                                eligible
                                  ? 'bg-white border-amber-300 hover:border-emerald-600 hover:bg-emerald-50 text-amber-950 cursor-pointer'
                                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              <span className="font-mono text-emerald-800">{vCode}</span>
                              <span className="text-gray-400">•</span>
                              <span>{labelVal}</span>
                              {vMin > 0 && (
                                <span className="text-[10px] font-normal text-gray-500">
                                  (từ {Math.round(vMin / 1000)}k)
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {voucherError && <p className="text-red-600 font-semibold text-[11px]">{voucherError}</p>}
                  {appliedVoucher && (
                    <p className="text-emerald-800 font-bold text-[11px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>{appliedVoucher.message}</span>
                    </p>
                  )}
                </div>

                {/* Phương thức thanh toán */}
                <div>
                  <label className="block font-bold text-gray-700 mb-2">Phương thức thanh toán:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.paymentMethod === 'COD'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={formData.paymentMethod === 'COD'}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="hidden"
                      />
                      <span className="material-symbols-outlined text-lg">payments</span>
                      <span>COD (Khi nhận)</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.paymentMethod === 'BANK_QR'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="BANK_QR"
                        checked={formData.paymentMethod === 'BANK_QR'}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="hidden"
                      />
                      <span className="material-symbols-outlined text-lg">qr_code_2</span>
                      <span>VietQR / Chuyển khoản</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.paymentMethod === 'MOMO'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="MOMO"
                        checked={formData.paymentMethod === 'MOMO'}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="hidden"
                      />
                      <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                      <span>Ví MoMo</span>
                    </label>
                  </div>
                </div>

                {/* Hiển thị mã VietQR động khi chọn BANK_QR */}
                {formData.paymentMethod === 'BANK_QR' && (
                  <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={vietQrUrl}
                      alt="Mã thanh toán VietQR MB Bank"
                      className="w-40 h-40 rounded-2xl border border-sky-200 bg-white object-contain shadow-sm shrink-0"
                    />
                    <div className="space-y-1.5 text-xs text-slate-700 flex-1 min-w-0">
                      <div className="font-extrabold text-sky-950 text-sm flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sky-700 text-lg">qr_code_scanner</span>
                        <span>Quét mã VietQR để chuyển khoản nhanh</span>
                      </div>
                      <p>
                        Ngân hàng: <strong className="text-slate-900">MB Bank (Quân Đội)</strong>
                      </p>
                      <p>
                        Số tài khoản: <strong className="font-mono text-slate-900">0987654321</strong>
                      </p>
                      <p>
                        Số tiền:{' '}
                        <strong className="text-emerald-800 text-sm">{finalTotal.toLocaleString('vi-VN')} ₫</strong>
                      </p>
                      <p className="break-all flex flex-wrap items-center gap-1.5">
                        <span>Nội dung CK:</span>
                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-sky-200 text-sky-900">
                          {transferMemo}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyMemo}
                          className="px-2 py-0.5 rounded-md bg-sky-700 hover:bg-sky-800 text-white text-[10px] font-bold cursor-pointer"
                        >
                          {copiedMemo ? 'Đã chép' : 'Chép'}
                        </button>
                      </p>
                    </div>
                  </div>
                )}

                {/* Hiển thị mã QR & thông tin Ví MoMo khi chọn MOMO */}
                {formData.paymentMethod === 'MOMO' && (
                  <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-200 flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={momoQrUrl}
                      alt="Mã thanh toán Ví MoMo"
                      className="w-40 h-40 rounded-2xl border border-pink-200 bg-white p-1.5 object-contain shadow-sm shrink-0"
                    />
                    <div className="space-y-1.5 text-xs text-slate-700 flex-1 min-w-0">
                      <div className="font-extrabold text-[#a50064] text-sm flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#a50064] text-lg">account_balance_wallet</span>
                        <span>Quét mã bằng ứng dụng Ví MoMo</span>
                      </div>
                      <p>
                        Số điện thoại ví: <strong className="font-mono text-slate-900">0987 654 321</strong>
                      </p>
                      <p>
                        Chủ tài khoản: <strong className="text-slate-900">VUON UOM FLORABOTANIC AI</strong>
                      </p>
                      <p>
                        Số tiền:{' '}
                        <strong className="text-[#a50064] text-sm">{finalTotal.toLocaleString('vi-VN')} ₫</strong>
                      </p>
                      <p className="break-all flex flex-wrap items-center gap-1.5">
                        <span>Lời nhắn chuyển tiền:</span>
                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-pink-200 text-[#a50064]">
                          {transferMemo}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyMemo}
                          className="px-2 py-0.5 rounded-md bg-[#a50064] hover:bg-[#880052] text-white text-[10px] font-bold cursor-pointer"
                        >
                          {copiedMemo ? 'Đã chép' : 'Chép'}
                        </button>
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ghi chú cho vườn ươm (nếu có)</label>
                  <textarea
                    rows="2"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Ví dụ: Giao giờ hành chính, bọc kỹ chậu sứ..."
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-emerald-600 font-medium text-xs text-gray-800"
                  ></textarea>
                </div>

                {/* Tóm tắt chi tiết tiền */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính ({items.reduce((s, i) => s + i.quantity, 0)} chậu):</span>
                    <span className="font-semibold text-gray-900">{totalPrice.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển bảo đảm:</span>
                    <span className="font-semibold text-gray-900">
                      {shippingFee === 0 ? (
                        <span className="text-emerald-700 font-bold">Miễn phí</span>
                      ) : (
                        `${shippingFee.toLocaleString('vi-VN')} ₫`
                      )}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Giảm giá ({appliedVoucher?.code}):</span>
                      <span>-{discountAmount.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-gray-500 block">Tổng thanh toán:</span>
                      <span className="text-xl font-extrabold text-emerald-900">
                        {finalTotal.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 font-bold text-gray-600 cursor-pointer"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || items.length === 0}
                        className="px-6 py-2.5 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] disabled:opacity-60 text-white font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <span>{isSubmitting ? 'Đang gửi đơn...' : 'Đặt mua ngay'}</span>
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-4xl">task_alt</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">Đặt hàng thành công!</h3>
              <p className="text-xs text-gray-500 mt-1">
                Mã đơn hàng: <span className="font-mono font-bold text-emerald-800">{createdOrder?.orderId}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8faf7] border border-gray-100 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Khách hàng:</span>
                <span className="font-bold text-gray-800 text-right">
                  {createdOrder?.customerName} ({createdOrder?.phone})
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Địa chỉ:</span>
                <span className="font-semibold text-gray-800 text-right">{createdOrder?.address}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Hình thức thanh toán:</span>
                <span className="font-semibold text-gray-800">{createdOrder?.paymentMethod}</span>
              </div>
              {createdOrder?.discountAmount > 0 && (
                <div className="flex justify-between gap-2 text-emerald-700">
                  <span>Giảm giá ({createdOrder?.voucherCode}):</span>
                  <span className="font-bold">-{createdOrder.discountAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-sm">
                <span className="font-bold text-gray-900">Tổng tiền:</span>
                <span className="font-black text-emerald-800">
                  {Number(createdOrder?.totalAmount || 0).toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>

            {createdOrder?.paymentMethod === 'BANK_QR' && (
              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 max-w-md mx-auto flex flex-col items-center gap-2">
                <img
                  src={`https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${Math.round(
                    createdOrder.totalAmount
                  )}&addInfo=${encodeURIComponent(`THANH TOAN ${createdOrder.orderId}`)}`}
                  alt="VietQR thanh toán đơn hàng"
                  className="w-36 h-36 rounded-xl bg-white border border-sky-200 object-contain"
                />
                <p className="text-[11px] text-sky-900 font-semibold">
                  Nội dung CK: <span className="font-mono font-bold">THANH TOAN {createdOrder.orderId}</span>
                </p>
              </div>
            )}

            <p className="text-xs text-gray-400">
              Vườn ươm sẽ liên hệ bạn qua Zalo/Điện thoại để quay video kiểm tra cây trước khi gửi xe bảo đảm.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white text-xs font-bold transition-all cursor-pointer"
            >
              Tiếp tục khám phá vườn
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
