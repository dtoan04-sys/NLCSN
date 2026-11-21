import { apiFetch } from '../config';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getPlantImage, handleImgError } from '../utils/plantAssets';

const ORDER_STEPS = [
  { key: 'PENDING', label: 'Chờ xử lý', icon: 'receipt_long' },
  { key: 'SHIPPING', label: 'Đang giao hàng', icon: 'local_shipping' },
  { key: 'COMPLETED', label: 'Đã hoàn thành', icon: 'task_alt' }
];

function getStepIndex(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('hủy') || s.includes('huy')) return -1;
  if (s.includes('hoàn thành') || s.includes('hoan thanh')) return 2;
  if (s.includes('đang giao') || s.includes('dang giao')) return 1;
  return 0;
}

export default function UserOrdersModal({ isOpen, onClose, onNavigateShopping }) {
  const { user } = useAuth();
  const { addToCart, showToast } = useCart();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, CHO_XU_LY, DANG_GIAO, HOAN_THANH, DA_HUY
  const [cancelingId, setCancelingId] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const fetchOrders = async () => {
    if (!user || !user.id) {
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
        setOrders(Array.isArray(data) ? data : []);
      } else {
        const local = JSON.parse(localStorage.getItem('florabotanic_orders') || '[]');
        setOrders(local);
      }
    } catch (err) {
      const local = JSON.parse(localStorage.getItem('florabotanic_orders') || '[]');
      setOrders(local);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setInvoiceOrder(null);
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
        const data = await res.json().catch(() => ({}));
        showToast(`❌ ${data.detail || 'Không thể hủy đơn hàng này!'}`);
      }
    } catch (err) {
      showToast('❌ Lỗi kết nối khi hủy đơn hàng');
    } finally {
      setCancelingId(null);
    }
  };

  const handleReorder = (order) => {
    const itemsList = order.ChiTiet || order.items || [];
    if (!itemsList.length) {
      showToast('⚠️ Đơn hàng này không có danh sách sản phẩm để mua lại!');
      return;
    }
    let addedCount = 0;
    itemsList.forEach((item) => {
      const pid = item.MaSanPham || item.MASANPHAM || item.productId;
      const name = item.TenSanPham || item.TENSANPHAM || item.productName || 'Chậu cây kiểng lá';
      const price = Number(item.DonGiaMua || item.DONGIAMUA || item.price || 0);
      const qty = Number(item.SoLuongMua || item.SOLUONGMUA || item.quantity || 1);
      const img =
        item.UrlAnh ||
        item.URLANH ||
        item.productImage ||
        getPlantImage(item.MaLoaiCay, name);
      if (pid) {
        addToCart(
          {
            id: pid,
            name,
            price,
            image: img,
            size: item.KichThuocCay || item.KICHTHUOCCAY || 'Tiêu chuẩn',
            stock: 99
          },
          qty
        );
        addedCount += qty;
      }
    });
    if (addedCount > 0) {
      showToast(`🛒 Đã thêm lại ${addedCount} chậu cây từ đơn vào giỏ hàng!`);
    }
  };

  const handlePrintInvoice = (order) => {
    const mDh = order.MaDonHang || order.MADONHANG || order.orderId;
    const dateStr = order.NgayDatHang || order.NGAYDATHANG || order.createdAt;
    const status = order.TrangThaiDonHang || order.TRANGTHAIDONHANG || order.status || 'Chờ xử lý';
    const itemsList = order.ChiTiet || order.items || [];
    const subTotal = Number(order.TamTinh || order.TAMTINH || 0);
    const discount = Number(order.SoTienGiam || order.SOTIENGIAM || 0);
    const ship = Number(order.PhiVanChuyen || order.PHIVANCHUYEN || 0);
    const total = Number(order.TongTien || order.TONGTIEN || order.totalAmount || 0);

    const rowsHtml = itemsList
      .map((it, i) => {
        const name = it.TenSanPham || it.TENSANPHAM || it.productName || 'Chậu cây';
        const qty = Number(it.SoLuongMua || it.SOLUONGMUA || it.quantity || 1);
        const price = Number(it.DonGiaMua || it.DONGIAMUA || it.price || 0);
        return `<tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${i + 1}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${name}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${qty}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${price.toLocaleString('vi-VN')} ₫</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;">${(price * qty).toLocaleString('vi-VN')} ₫</td>
        </tr>`;
      })
      .join('');

    const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>Hóa đơn #DH-${mDh} — FloraBotanic.AI</title>
<style>body{font-family:Arial,sans-serif;color:#111827;padding:24px;max-width:720px;margin:0 auto;}
h1{color:#064e3b;margin:0 0 4px;}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px;}
th{background:#f3f4f6;padding:8px;text-align:left;border-bottom:2px solid #d1d5db;}
.totals{margin-top:16px;text-align:right;font-size:14px;line-height:1.8;}</style></head>
<body>
  <h1>FloraBotanic.AI — Vườn Kiểng Lá</h1>
  <p style="margin:0;color:#6b7280;font-size:12px;">Hóa đơn bán lẻ điện tử • Bảo hành cây 1 đổi 1 trong 30 ngày</p>
  <hr style="margin:14px 0;border:none;border-top:1px solid #e5e7eb;">
  <p style="font-size:13px;line-height:1.7;">
    <strong>Mã đơn hàng:</strong> #DH-${mDh}<br>
    <strong>Ngày đặt:</strong> ${dateStr ? new Date(dateStr).toLocaleString('vi-VN') : 'Mới đặt'}<br>
    <strong>Trạng thái:</strong> ${status}<br>
    <strong>Khách hàng:</strong> ${user?.fullName || user?.username || 'Khách hàng'} — ${order.SdtNhanHang || order.SDTNHANHANG || order.phone || '---'}<br>
    <strong>Địa chỉ nhận:</strong> ${order.DiaChiNhanHang || order.DIACHINHANHANG || order.address || '---'}<br>
    <strong>Thanh toán:</strong> ${order.PhuongThucThanhToan || order.PHUONGTHUCTHANHTOAN || order.paymentMethod || 'COD'}
  </p>
  <table>
    <thead><tr><th>#</th><th>Sản phẩm</th><th style="text-align:center;">SL</th><th style="text-align:right;">Đơn giá</th><th style="text-align:right;">Thành tiền</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="totals">
    ${subTotal > 0 ? `<div>Tạm tính: ${subTotal.toLocaleString('vi-VN')} ₫</div>` : ''}
    ${ship > 0 ? `<div>Phí vận chuyển: ${ship.toLocaleString('vi-VN')} ₫</div>` : ''}
    ${discount > 0 ? `<div>Giảm giá: -${discount.toLocaleString('vi-VN')} ₫</div>` : ''}
    <div style="font-size:18px;font-weight:800;color:#064e3b;">Tổng thanh toán: ${total.toLocaleString('vi-VN')} ₫</div>
  </div>
</body></html>`;

    const printWin = window.open('', '_blank', 'width=800,height=700');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => printWin.print(), 300);
    } else {
      window.print();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-emerald-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[#012d1d] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-300 text-2xl">package_2</span>
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                {invoiceOrder ? `Hóa đơn #DH-${invoiceOrder.MaDonHang || invoiceOrder.MADONHANG || invoiceOrder.orderId}` : 'Đơn hàng của tôi'}
              </h3>
              <p className="text-xs text-emerald-200/80">
                {invoiceOrder ? 'Chi tiết hóa đơn bán lẻ điện tử' : 'Lịch sử mua sắm & Theo dõi tiến trình giao chậu cây kiểng lá'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {invoiceOrder && (
              <button
                type="button"
                onClick={() => setInvoiceOrder(null)}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
              >
                Quay lại
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Nếu đang xem Hóa đơn chi tiết */}
        {invoiceOrder ? (
          <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs bg-gray-50/50">
            {(() => {
              const mDh = invoiceOrder.MaDonHang || invoiceOrder.MADONHANG || invoiceOrder.orderId;
              const dateStr = invoiceOrder.NgayDatHang || invoiceOrder.NGAYDATHANG || invoiceOrder.createdAt;
              const status = invoiceOrder.TrangThaiDonHang || invoiceOrder.TRANGTHAIDONHANG || invoiceOrder.status || 'Chờ xử lý';
              const itemsList = invoiceOrder.ChiTiet || invoiceOrder.items || [];
              const subTotal = Number(invoiceOrder.TamTinh || invoiceOrder.TAMTINH || 0);
              const discount = Number(invoiceOrder.SoTienGiam || invoiceOrder.SOTIENGIAM || 0);
              const ship = Number(invoiceOrder.PhiVanChuyen || invoiceOrder.PHIVANCHUYEN || 0);
              const total = Number(invoiceOrder.TongTien || invoiceOrder.TONGTIEN || invoiceOrder.totalAmount || 0);

              return (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
                    <div>
                      <h4 className="text-lg font-black text-emerald-950">FloraBotanic.AI</h4>
                      <p className="text-[11px] text-gray-500">Vườn Ươm Kiểng Lá &amp; Thực Vật Học</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-extrabold text-sm text-emerald-900">#DH-{mDh}</p>
                      <p className="text-[11px] text-gray-500">
                        {dateStr ? new Date(dateStr).toLocaleString('vi-VN') : 'Mới đặt'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl">
                    <div className="space-y-1">
                      <p className="text-gray-400 text-[11px] font-bold uppercase">Người nhận</p>
                      <p className="font-bold text-gray-900">{user?.fullName || user?.username || 'Khách hàng'}</p>
                      <p className="text-gray-600">{invoiceOrder.SdtNhanHang || invoiceOrder.SDTNHANHANG || invoiceOrder.phone || '---'}</p>
                      <p className="text-gray-600">{invoiceOrder.DiaChiNhanHang || invoiceOrder.DIACHINHANHANG || invoiceOrder.address || '---'}</p>
                    </div>
                    <div className="space-y-1 sm:text-right">
                      <p className="text-gray-400 text-[11px] font-bold uppercase">Thanh toán &amp; Trạng thái</p>
                      <p className="font-bold text-gray-900">
                        {invoiceOrder.PhuongThucThanhToan || invoiceOrder.PHUONGTHUCTHANHTOAN || invoiceOrder.paymentMethod || 'COD'}
                      </p>
                      <p className="text-emerald-700 font-bold">{status}</p>
                      {(invoiceOrder.TenMaGiamGia || invoiceOrder.TENMAGIAMGIA) && (
                        <p className="text-amber-700 font-semibold">
                          Voucher: {invoiceOrder.TenMaGiamGia || invoiceOrder.TENMAGIAMGIA}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-[11px] text-gray-500 uppercase">
                          <th className="py-2 pr-2">#</th>
                          <th className="py-2 pr-2">Sản phẩm</th>
                          <th className="py-2 px-2 text-center">SL</th>
                          <th className="py-2 px-2 text-right">Đơn giá</th>
                          <th className="py-2 pl-2 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {itemsList.map((it, idx) => {
                          const name = it.TenSanPham || it.TENSANPHAM || it.productName || 'Chậu cây';
                          const qty = Number(it.SoLuongMua || it.SOLUONGMUA || it.quantity || 1);
                          const price = Number(it.DonGiaMua || it.DONGIAMUA || it.price || 0);
                          return (
                            <tr key={idx}>
                              <td className="py-2.5 pr-2 text-gray-400">{idx + 1}</td>
                              <td className="py-2.5 pr-2 font-semibold text-gray-800">{name}</td>
                              <td className="py-2.5 px-2 text-center font-bold">{qty}</td>
                              <td className="py-2.5 px-2 text-right">{price.toLocaleString('vi-VN')} ₫</td>
                              <td className="py-2.5 pl-2 text-right font-bold text-emerald-900">
                                {(price * qty).toLocaleString('vi-VN')} ₫
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-gray-200 pt-3 space-y-1.5 text-right">
                    {subTotal > 0 && (
                      <p className="text-gray-600">
                        Tạm tính: <strong className="text-gray-900">{subTotal.toLocaleString('vi-VN')} ₫</strong>
                      </p>
                    )}
                    {ship > 0 && (
                      <p className="text-gray-600">
                        Phí vận chuyển: <strong className="text-gray-900">{ship.toLocaleString('vi-VN')} ₫</strong>
                      </p>
                    )}
                    {discount > 0 && (
                      <p className="text-emerald-700 font-semibold">
                        Giảm giá: <strong>-{discount.toLocaleString('vi-VN')} ₫</strong>
                      </p>
                    )}
                    <p className="text-base font-black text-[#012d1d]">
                      Tổng thanh toán: {total.toLocaleString('vi-VN')} ₫
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handlePrintInvoice(invoiceOrder)}
                      className="px-5 py-2.5 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">print</span>
                      <span>In / Lưu PDF hóa đơn</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <>
            {/* Status Filter Tabs */}
            <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2 overflow-x-auto text-xs font-bold shrink-0">
              {[
                { id: 'ALL', label: 'Tất cả đơn' },
                { id: 'CHO_XU_LY', label: 'Chờ xử lý' },
                { id: 'DANG_GIAO', label: 'Đang giao' },
                { id: 'HOAN_THANH', label: 'Đã hoàn thành' },
                { id: 'DA_HUY', label: 'Đã hủy' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
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
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-gray-50/50">
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
                  const stepIdx = getStepIndex(status);

                  return (
                    <div key={mDh} className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                      {/* Order header row */}
                      <div className="p-4 bg-emerald-50/30 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-gray-900 text-sm">#DH-{mDh}</span>
                          <span className="text-xs text-gray-400">
                            • {dateStr ? new Date(dateStr).toLocaleString('vi-VN') : 'Mới đặt'}
                          </span>
                          {(order.PhuongThucThanhToan || order.PHUONGTHUCTHANHTOAN || order.paymentMethod) && (
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold">
                              {order.PhuongThucThanhToan || order.PHUONGTHUCTHANHTOAN || order.paymentMethod}
                            </span>
                          )}
                        </div>

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

                      {/* Thanh tiến trình trạng thái đơn hàng */}
                      <div className="px-4 py-3 bg-white border-b border-gray-100">
                        {stepIdx === -1 ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50/70 px-3 py-2 rounded-xl">
                            <span className="material-symbols-outlined text-base">cancel</span>
                            <span>Đơn hàng đã bị hủy — Tồn kho và lượt voucher đã được hoàn trả</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1">
                            {ORDER_STEPS.map((st, idx) => {
                              const done = idx <= stepIdx;
                              const isCurrent = idx === stepIdx;
                              return (
                                <React.Fragment key={st.key}>
                                  <div className="flex flex-col items-center text-center min-w-[72px]">
                                    <div
                                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                                        done
                                          ? 'bg-emerald-700 text-white shadow-xs'
                                          : 'bg-gray-100 text-gray-400'
                                      } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                                    >
                                      <span className="material-symbols-outlined text-sm">{st.icon}</span>
                                    </div>
                                    <span
                                      className={`text-[10px] mt-1 font-bold ${
                                        done ? 'text-emerald-900' : 'text-gray-400'
                                      }`}
                                    >
                                      {st.label}
                                    </span>
                                  </div>
                                  {idx < ORDER_STEPS.length - 1 && (
                                    <div
                                      className={`flex-1 h-1 rounded-full -mt-4 ${
                                        idx < stepIdx ? 'bg-emerald-600' : 'bg-gray-200'
                                      }`}
                                    />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Order items */}
                      <div className="p-4 divide-y divide-gray-50">
                        {itemsList.map((item, idx) => {
                          const name = item.TenSanPham || item.TENSANPHAM || item.productName || 'Chậu cây kiểng lá';
                          const img =
                            item.UrlAnh ||
                            item.URLANH ||
                            item.productImage ||
                            getPlantImage(item.MaLoaiCay, name);
                          const qty = Number(item.SoLuongMua || item.SOLUONGMUA || item.quantity || 1);
                          const price = Number(item.DonGiaMua || item.DONGIAMUA || item.price || 0);

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
                                    {price.toLocaleString('vi-VN')} ₫ &times;{' '}
                                    <strong className="text-gray-700">{qty}</strong>
                                    {(item.KichThuocCay || item.KICHTHUOCCAY) && (
                                      <span> • {item.KichThuocCay || item.KICHTHUOCCAY}</span>
                                    )}
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
                        <div className="text-xs text-gray-500 min-w-0">
                          <p className="truncate">
                            <span className="text-gray-400">Giao đến:</span>{' '}
                            <strong className="text-gray-700">
                              {order.DiaChiNhanHang || order.DIACHINHANHANG || order.address || 'Địa chỉ mặc định'}
                            </strong>
                          </p>
                          <p>
                            <span className="text-gray-400">Liên hệ:</span>{' '}
                            <span className="text-gray-600">
                              {order.SdtNhanHang || order.SDTNHANHANG || order.phone || '---'}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 ml-auto">
                          <div className="text-right mr-1">
                            <span className="text-[11px] text-gray-400 block">Tổng thanh toán:</span>
                            <span className="text-sm font-extrabold text-[#012d1d]">
                              {total.toLocaleString('vi-VN')} ₫
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setInvoiceOrder(order)}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">receipt</span>
                            <span>Hóa đơn</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                            <span>Mua lại</span>
                          </button>

                          {canCancel && (
                            <button
                              type="button"
                              disabled={cancelingId === mDh}
                              onClick={() => handleCancelOrder(mDh)}
                              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs transition-colors cursor-pointer"
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
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onNavigateShopping) onNavigateShopping();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Khám phá cửa hàng ngay
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-400">Hỗ trợ đổi trả &amp; bảo hành cây trong vòng 7 ngày</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
