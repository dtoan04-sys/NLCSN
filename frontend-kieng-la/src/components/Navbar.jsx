import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getInitials } from './ProfileModal';

export default function Navbar({
  currentPage,
  onNavigate,
  onOpenAiModal,
  onOpenCart,
  onOpenAuth,
  onOpenHistory,
  onOpenProfile,
  onOpenOrders
}) {
  const { totalCount } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-[#004830] text-white shadow-md">
      {/* 1. Main Header Bar (chuẩn form Thế Giới Di Động / Điện Máy Xanh) */}
      <div className="max-w-[1440px] mx-auto h-16 sm:h-18 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Logo Thương Hiệu */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-[#ffd400] text-[#004830] flex items-center justify-center font-extrabold shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl font-bold">potted_plant</span>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-black tracking-tight text-white leading-none">
              FloraBotanic<span className="text-[#ffd400]">.AI</span>
            </div>
            <span className="text-[10px] text-emerald-200/90 font-semibold tracking-wider uppercase block mt-1 hidden xs:block">
              Siêu thị Kiểng Lá &amp; AI
            </span>
          </div>
        </div>

        {/* Thanh tìm kiếm nhanh phong cách Thế Giới Di Động */}
        <div
          onClick={() => onNavigate('products')}
          className="flex-1 max-w-xl hidden md:flex items-center bg-white rounded-xl px-3.5 py-2 cursor-pointer border-2 border-transparent hover:border-[#ffd400] transition-colors"
        >
          <span className="material-symbols-outlined text-gray-400 text-xl mr-2">search</span>
          <span className="text-xs text-gray-400 flex-1">
            Bạn muốn tìm chậu cây kiểng lá gì? (Trầu bà, Lưỡi hổ, Kim tiền...)
          </span>
          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md">
            90 Loài
          </span>
        </div>

        {/* Cụm Action Buttons: Quét ảnh AI, Giỏ hàng, Đơn hàng, Tài khoản */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* NÚT QUÉT ẢNH AI NỔI BẬT KIỂU THẾ GIỚI DI ĐỘNG (Màu vàng rực rỡ #ffd400) */}
          <button
            type="button"
            onClick={onOpenAiModal}
            className="flex items-center gap-2 bg-[#ffd400] hover:bg-[#ffe14d] text-[#003822] px-3.5 sm:px-4 py-2 rounded-xl font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            title="Quét ảnh lá cây để nhận diện & tìm chậu mua"
          >
            <span className="material-symbols-outlined text-xl font-bold">photo_camera</span>
            <span className="hidden sm:inline">Quét Ảnh AI</span>
          </button>

          {/* Nút Giỏ Hàng có số lượng */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all border border-white/15"
            title="Xem giỏ hàng"
          >
            <span className="material-symbols-outlined text-xl">shopping_cart</span>
            <span className="hidden lg:inline">Giỏ hàng</span>
            {totalCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {totalCount}
              </span>
            )}
          </button>

          {/* Tài Khoản / Đăng Nhập */}
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border border-white/15 transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-[#ffd400] text-[#004830] font-black text-xs flex items-center justify-center">
                  {getInitials(user?.fullName || user?.username)}
                </div>
                <span className="hidden xl:inline max-w-[100px] truncate font-bold">
                  {user?.fullName || user?.username}
                </span>
                <span className="material-symbols-outlined text-sm hidden sm:inline">
                  {isUserMenuOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 text-xs animate-fadeIn">
                  <div className="px-4 py-2.5 border-b border-gray-100 bg-emerald-50/50">
                    <p className="text-[11px] text-gray-500">Tài khoản</p>
                    <p className="font-bold text-gray-900 truncate">{user?.fullName || user?.username}</p>
                    <p className="text-[11px] text-emerald-800 truncate">{user?.email || 'Khách hàng'}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 font-semibold hover:bg-gray-50 rounded-xl"
                    >
                      <span className="material-symbols-outlined text-base text-emerald-700">person</span>
                      <span>Thông tin tài khoản</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenOrders();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 font-semibold hover:bg-gray-50 rounded-xl"
                    >
                      <span className="material-symbols-outlined text-base text-emerald-700">receipt_long</span>
                      <span>Đơn mua của tôi</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenHistory();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 font-semibold hover:bg-gray-50 rounded-xl"
                    >
                      <span className="material-symbols-outlined text-base text-emerald-700">history</span>
                      <span>Lịch sử tìm kiếm cây</span>
                    </button>
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 font-bold text-amber-700 hover:bg-amber-50 rounded-xl"
                      >
                        <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                        <span>Quản trị Admin Hub</span>
                      </button>
                    )}
                  </div>
                  <div className="border-t border-gray-100 p-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 font-bold text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-bold border border-white/15 transition-all"
            >
              <span className="material-symbols-outlined text-base">person</span>
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Secondary Navigation Bar (Danh mục danh thiếp chuẩn thế giới di động) */}
      <div className="w-full bg-[#003822] border-t border-emerald-900/60 overflow-x-auto no-scrollbar">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 h-11 text-xs font-bold whitespace-nowrap">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              currentPage === 'home'
                ? 'bg-[#ffd400] text-[#003822] shadow-sm'
                : 'text-gray-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">home</span>
            <span>Trang chủ</span>
          </button>

          <button
            onClick={() => onNavigate('products')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              currentPage === 'products' || currentPage === 'detail'
                ? 'bg-[#ffd400] text-[#003822] shadow-sm'
                : 'text-gray-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">storefront</span>
            <span>Chậu cây sẵn hàng</span>
          </button>

          <button
            onClick={() => onNavigate('wiki')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              currentPage === 'wiki'
                ? 'bg-[#ffd400] text-[#003822] shadow-sm'
                : 'text-gray-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">menu_book</span>
            <span>Bách khoa 90 loài</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="px-3.5 py-1.5 rounded-lg text-gray-200 hover:bg-white/10 hover:text-white flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-base">history</span>
            <span>Lịch sử quét ảnh</span>
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => onNavigate('admin')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                currentPage === 'admin'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-amber-300 hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              <span>Quản trị viên (Hub)</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
