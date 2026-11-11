import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartDrawer({ isOpen, onClose, onCheckout, onOpenAuth }) {
  const { items, updateQuantity, removeFromCart, totalPrice, totalCount, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Nền mờ đóng drawer */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Drawer content */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-emerald-800">shopping_bag</span>
            <h2 className="text-lg font-bold text-gray-900">Giỏ hàng của bạn</h2>
            {isAuthenticated && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {totalCount} chậu
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Nội dung giỏ hàng */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!isAuthenticated ? (
            /* Ràng buộc: Chưa đăng nhập */
            <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-3xl">lock</span>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Chưa đăng nhập tài khoản</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                  Theo thiết kế hệ thống (CDM: <strong className="text-gray-700">NGUOI_DUNG 1 — 1 GIO_HANG</strong>), giỏ hàng được quản lý theo từng tài khoản riêng biệt.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="w-full py-3 rounded-2xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">login</span>
                <span>Đăng nhập / Đăng ký để mua cây</span>
              </button>
            </div>
          ) : items.length === 0 ? (
            /* Giỏ hàng trống */
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center space-y-3">
              <span className="material-symbols-outlined text-6xl text-gray-300">remove_shopping_cart</span>
              <p className="font-semibold text-gray-700">Giỏ hàng đang trống</p>
              <p className="text-xs max-w-xs text-gray-400">
                Chào <strong className="text-gray-600">{user.fullName || user.username}</strong>! Hãy khám phá các mẫu kiểng lá tinh hoa và bấm "Thêm vào giỏ".
              </p>
            </div>
          ) : (
            /* Danh sách món trong giỏ */
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-4 p-3 rounded-2xl border border-gray-100 bg-[#f8faf7] hover:shadow-sm transition-shadow"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-xl flex-none bg-gray-200"
                />
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 line-clamp-1">{product.name}</h4>
                    <span className="text-[11px] text-emerald-800 font-semibold block mt-0.5">
                      {product.price.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/60">
                    <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                      <button
                        onClick={() => updateQuantity(product.id, -1)}
                        className="px-2 py-0.5 hover:bg-gray-100 text-xs font-bold text-gray-600"
                      >
                        -
                      </button>
                      <span className="px-2.5 text-xs font-bold text-gray-800">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        className="px-2 py-0.5 hover:bg-gray-100 text-xs font-bold text-gray-600"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                      title="Xóa khỏi giỏ"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer tính tiền & Đặt hàng */}
        {isAuthenticated && items.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-white space-y-4">
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Tài khoản mua hàng:</span>
                <span className="font-bold text-gray-900">{user.fullName || user.username}</span>
              </div>
              <div className="flex justify-between">
                <span>Tạm tính ({totalCount} cây):</span>
                <span className="font-semibold text-gray-900">{totalPrice.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển bảo quản cây:</span>
                <span className="font-semibold text-emerald-700">Miễn phí giao hàng</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 text-sm">
                <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                <span className="font-black text-emerald-900 text-lg">
                  {totalPrice.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={clearCart}
                className="px-3 py-3 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-600"
              >
                Xóa tất cả
              </button>
              <button
                onClick={() => {
                  onClose();
                  onCheckout();
                }}
                className="flex-1 py-3 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <span>Tiến hành Đặt hàng</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
