import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CheckoutModal({ isOpen, onClose, onOpenAuth }) {
  const { items, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    paymentMethod: 'COD', // COD | BANK_QR | MOMO
    note: ''
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập tài khoản trước khi đặt hàng!');
      onClose();
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.address) {
      alert('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận cây!');
      return;
    }

    // Tạo bản ghi đơn hàng theo CDM: DON_HANG + CHI_TIET_DON_HANG
    const newOrder = {
      orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      userId: user.id,
      customerName: formData.fullName,
      phone: formData.phone,
      address: formData.address,
      paymentMethod: formData.paymentMethod,
      note: formData.note,
      totalAmount: totalPrice,
      status: 'CHO_XAC_NHAN',
      createdAt: new Date().toLocaleString('vi-VN'),
      items: items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        total: i.product.price * i.quantity
      }))
    };

    // Lưu vào danh sách đơn hàng đã mua trong localStorage
    const savedOrders = JSON.parse(localStorage.getItem('florabotanic_orders') || '[]');
    savedOrders.unshift(newOrder);
    localStorage.setItem('florabotanic_orders', JSON.stringify(savedOrders));

    setCreatedOrder(newOrder);
    setIsSuccess(true);
    clearCart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto p-6 sm:p-8">
        {!isAuthenticated ? (
          /* Ràng buộc: Chưa đăng nhập khi checkout */
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">Yêu cầu đăng nhập để Đặt hàng</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
                Theo thiết kế hệ thống (CDM: <strong className="text-gray-700">NGUOI_DUNG 1 — N DON_HANG</strong>), mỗi đơn đặt cây phải được định danh qua tài khoản khách hàng để quản lý bảo hành và tích điểm.
              </p>
            </div>
            <div className="flex gap-2 max-w-xs mx-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs"
              >
                Để sau
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAuth) onOpenAuth();
                }}
                className="flex-1 py-3 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs shadow-md transition-all"
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
              <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
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
                <label className="block font-bold text-gray-700 mb-1">Địa chỉ giao cây tận nơi *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-emerald-600 font-medium text-xs text-gray-800"
                />
              </div>

              {/* Phương thức thanh toán theo CDM */}
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

              {/* Tóm tắt đơn hàng */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-gray-500 block">Tổng thanh toán:</span>
                  <span className="text-xl font-extrabold text-emerald-900">
                    {totalPrice.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 font-bold text-gray-600"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold flex items-center gap-1 shadow-md transition-all"
                  >
                    <span>Đặt mua ngay</span>
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                  </button>
                </div>
              </div>
            </form>
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
              <div className="flex justify-between">
                <span className="text-gray-500">Khách hàng:</span>
                <span className="font-bold text-gray-800">{createdOrder?.customerName} ({createdOrder?.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Địa chỉ:</span>
                <span className="font-semibold text-gray-800 text-right">{createdOrder?.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Hình thức thanh toán:</span>
                <span className="font-semibold text-gray-800">{createdOrder?.paymentMethod}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm">
                <span className="font-bold text-gray-900">Tổng tiền:</span>
                <span className="font-black text-emerald-800">{createdOrder?.totalAmount.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Vườn ươm sẽ liên hệ bạn qua Zalo/Điện thoại để quay video kiểm tra cây trước khi gửi xe bảo đảm.
            </p>

            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white text-xs font-bold transition-all"
            >
              Tiếp tục khám phá vườn
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
