import { apiFetch } from '../config';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getPlantImage, handleImgError } from '../utils/plantAssets';

export default function UserOrdersModal({ isOpen, onClose, onNavigateShopping }) {
  const { user } = useAuth();
  const { addToCart, showToast } = useCart();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, CHO_XU_LY, DANG_GIAO, HOAN_THANH, DA_HUY
  const [cancelingId, setCancelingId] = useState(null);

  const fetchOrders = async () => {
    if (!user || !user.id) {
      // Dùng localStorage nếu chưa có ID DB
      const local = JSON.parse(localStorage.getItem('florabotanic_orders') || '[]');
      setOrders(local);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/nguoi-dung/${user.id}/don-hang`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        const local = JSON.parse(localStorage.getItem('florabotanic_orders') || '[]');
        setOrders(local);
      }
    } catch (err) {
      console.log('Backend orders fetch fallback to localStorage:', err);
      const local = JSON.parse(localStorage.getItem('florabotanic_orders') || '[]');
      setOrders(local);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleCancelOrder = async (mDh) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #DH-${mDh} không?`)) {
      return;
    }

    setCancelingId(mDh);
    try {
      const res = await apiFetch(`/api/don-hang/${mDh}/huy`, {
        method: 'PUT'
      });
      if (res.ok) {
        showToast(`✅ Đã hủy đơn hàng #DH-${mDh} thành công!`);
        fetchOrders();
      } else {
        const data = await res.json();
        showToast(`❌ ${data.detail || 'Không thể hủy đơn hàng này!'}`);
      }
    } catch (err) {
      showToast('❌ Lỗi kết nối khi hủy đơn hàng');
    } finally {
      setCancelingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const st = o.TrangThaiDonHang || o.TRANGTHAIDONHANG || o.status || 'Chờ xử lý';
    if (activeFilter === 'CHO_XU_LY') return st === 'Chờ xử lý' || st === 'CHO_XAC_NHAN';
    if (activeFilter === 'DANG_GIAO') return st === 'Đang giao hàng';
    if (activeFilter === 'HOAN_THANH') return st === 'Đã hoàn thành';
    if (activeFilter === 'DA_HUY') return st === 'Đã hủy';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-emerald-100">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#012d1d] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-300 text-2xl">package_2</span>
            </div>
            <div>
              <h3 className="font-extrabold text-lg">Đơn hàng của tôi</h3>
              <p className="text-xs text-emerald-200/80">
                Lịch sử mua sắm &amp; Theo dõi tiến trình giao chậu cây kiểng lá
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2 overflow-x-auto text-xs font-bold">
          {[
            { id: 'ALL', label: 'Tất cả đơn' },
            { id: 'CHO_XU_LY', label: 'Chờ xử lý' },
            { id: 'DANG_GIAO', label: 'Đang giao' },
            { id: 'HOAN_THANH', label: 'Đã hoàn thành' },
            { id: 'DA_HUY', label: 'Đã hủy' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-gray-50/50">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold text-gray-500">Đang tải lịch sử đơn hàng...</p>
            </div>
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const mDh = order.MaDonHang || order.MADONHANG || order.orderId;
              const status = order.TrangThaiDonHang || order.TRANGTHAIDONHANG || order.status || 'Chờ xử lý';
              const total = Number(order.TongTien || order.TONGTIEN || order.totalAmount || 0);
              const dateStr = order.NgayDatHang || order.NGAYDATHANG || order.createdAt;
              const itemsList = order.ChiTiet || order.items || [];
              const canCancel = status === 'Chờ xử lý' || status === 'CHO_XAC_NHAN';

              return (
                <div key={mDh} className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                  {/* Order header row */}
                  <div className="p-4 bg-emerald-50/30 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900 text-sm">
                        #DH-{mDh}
                      </span>
                      <span className="text-xs text-gray-400">
                        • {dateStr ? new Date(dateStr).toLocaleString('vi-VN') : 'Mới đặt'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          status === 'Đã hoàn thành'
                            ? 'bg-emerald-100 text-emerald-800'
                            : status === 'Đang giao hàng'
                            ? 'bg-blue-100 text-blue-800'
                            : status === 'Đã hủy'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="p-4 divide-y divide-gray-50">
                    {itemsList.map((item, idx) => {
                      const img = item.UrlAnh || item.productImage || getPlantImage({
                        MaLoaiCay: item.MaLoaiCay,
                        TenSanPham: item.TenSanPham || item.productName
                      });
                      const name = item.TenSanPham || item.productName || 'Chậu cây kiểng lá';
                      const qty = item.SoLuongMua || item.quantity || 1;
                      const price = Number(item.DonGiaMua || item.price || 0);

                      return (
                        <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={img}
                              alt={name}
                              onError={handleImgError}
                              className="w-12 h-12 rounded-xl object-cover bg-gray-100 shrink-0 border border-gray-100"
                            />
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-gray-800 truncate">{name}</h4>
                              <p className="text-[11px] text-gray-400">
                                {price.toLocaleString('vi-VN')} ₫ &times; <strong className="text-gray-700">{qty}</strong>
                              </p>
                            </div>
                          </div>
                          <div className="font-bold text-xs text-[#012d1d] shrink-0">
                            {(price * qty).toLocaleString('vi-VN')} ₫
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order footer */}
                  <div className="p-4 bg-gray-50/60 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-gray-500">
                      <p><span className="text-gray-400">Giao đến:</span> <strong className="text-gray-700">{order.DiaChiNhanHang || order.address || 'Địa chỉ mặc định'}</strong></p>
                      <p><span className="text-gray-400">Liên hệ:</span> <span className="text-gray-600">{order.SdtNhanHang || order.phone || '---'}</span></p>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      <div className="text-right">
                        <span className="text-[11px] text-gray-400 block">Tổng thanh toán:</span>
                        <span className="text-sm font-extrabold text-[#012d1d]">
                          {total.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>

                      {canCancel && (
                        <button
                          disabled={cancelingId === mDh}
                          onClick={() => handleCancelOrder(mDh)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors"
                        >
                          {cancelingId === mDh ? 'Đang hủy...' : 'Hủy đơn'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">shopping_basket</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-base">Bạn chưa có đơn hàng nào ở mục này</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Hãy chọn những chậu cây kiểng lá xanh tươi để trang trí không gian sống của bạn ngay hôm nay!
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  if (onNavigateShopping) onNavigateShopping();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs shadow-md transition-all"
              >
                Khám phá cửa hàng ngay
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Hỗ trợ đổi trả &amp; bảo hành cây trong vòng 7 ngày
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
