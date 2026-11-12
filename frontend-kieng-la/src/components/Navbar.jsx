import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getInitials } from './ProfileModal';
import { CATEGORIES } from '../data/mockData';

const TRENDING_KEYWORDS = [
  'Monstera Albo',
  'Trầu bà lá xẻ',
  'Kim tiền tài lộc',
  'Lưỡi hổ lọc khí',
  'Sen đá cẩm thạch',
  'Cây để bàn',
  'Lan ý hoa trắng',
  'Cây phong thủy'
];

export default function Navbar({
  currentPage,
  onNavigate,
  onSelectCategory,
  onOpenAiModal,
  onOpenCart,
  onOpenAuth,
  onOpenHistory,
  onOpenProfile,
  onOpenOrders,
  onSearch,
  searchKeyword = ''
}) {
  const { totalCount } = useCart();
  const { user, logout, isAuthenticated } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCatMenuOpen, setIsCatMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchKeyword);

  const userMenuRef = useRef(null);
  const catMenuRef = useRef(null);

  // Sync internal search value with external prop if provided
  useEffect(() => {
    if (searchKeyword !== undefined) {
      setSearchValue(searchKeyword);
    }
  }, [searchKeyword]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (catMenuRef.current && !catMenuRef.current.contains(event.target)) {
        setIsCatMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExecuteSearch = (term) => {
    const query = (term !== undefined ? term : searchValue).trim();
    if (onSearch) {
      onSearch(query);
    } else {
      onNavigate('products');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecuteSearch();
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-[#004830] text-white shadow-md">
      {/* ========================================================================= */}
      {/* 1. TẦNG MICRO TOP BAR (Chuẩn cấu trúc Shopee) */}
      {/* ========================================================================= */}
      <div className="w-full bg-[#003822] text-emerald-100/90 text-[11px] border-b border-emerald-900/60 hidden sm:block">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
          {/* Cụm trái: Kênh Người Bán / Admin, Tra cứu, Kết nối MXH */}
          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' ? (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="hover:text-white flex items-center gap-1 font-semibold text-amber-300 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">storefront</span>
                <span>Kênh Quản Trị / Bán Hàng</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="hover:text-white flex items-center gap-1 font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">storefront</span>
                <span>Kênh Người Bán Flora</span>
              </button>
            )}
            <span className="text-emerald-700/80">|</span>
            <button
              type="button"
              onClick={() => onNavigate('wiki')}
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Bách khoa 90 loài thực vật</span>
            </button>
            <span className="text-emerald-700/80">|</span>
            <div className="flex items-center gap-1.5 text-emerald-200/90">
              <span>Kết nối:</span>
              <span
                className="material-symbols-outlined text-[14px] hover:text-white cursor-pointer transition-colors"
                title="Fanpage Facebook"
                onClick={() => window.open('https://facebook.com', '_blank')}
              >
                public
              </span>
              <span
                className="material-symbols-outlined text-[14px] hover:text-white cursor-pointer transition-colors"
                title="Chat Zalo hỗ trợ"
                onClick={() => window.open('https://zalo.me', '_blank')}
              >
                chat
              </span>
            </div>
          </div>

          {/* Cụm phải: Thông báo, Hỗ trợ, Ngôn ngữ, Tài khoản / Đăng nhập */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onOpenOrders}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">notifications</span>
              <span>Thông Báo</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('wiki')}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">help_outline</span>
              <span>Hỗ Trợ 24/7</span>
            </button>
            <div className="flex items-center gap-1 text-emerald-200">
              <span className="material-symbols-outlined text-[14px]">language</span>
              <span>Tiếng Việt</span>
            </div>

            <span className="text-emerald-700/80">|</span>

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 hover:text-[#ffd400] font-bold text-white transition-colors cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-[#ffd400] text-[#004830] font-black text-[10px] flex items-center justify-center">
                    {getInitials(user?.fullName || user?.username)}
                  </div>
                  <span className="truncate max-w-[110px]">{user?.fullName || user?.username}</span>
                  <span className="material-symbols-outlined text-xs">
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
                        type="button"
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
                        type="button"
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
                        type="button"
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
                          type="button"
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
                        type="button"
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
              <div className="flex items-center gap-2 font-bold">
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="hover:text-[#ffd400] transition-colors"
                >
                  Đăng Ký
                </button>
                <span className="text-emerald-700">/</span>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="hover:text-[#ffd400] transition-colors"
                >
                  Đăng Nhập
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TẦNG MAIN HEADER (Logo bên trái, Thanh Search rộng ở giữa, Giỏ hàng bên phải) */}
      {/* ========================================================================= */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pt-2.5 pb-2.5 flex items-center justify-between gap-3 sm:gap-6">
        {/* LOGO THƯƠNG HIỆU */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group shrink-0"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#ffd400] text-[#004830] flex items-center justify-center font-extrabold shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl sm:text-3xl font-bold">potted_plant</span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
              FloraBotanic<span className="text-[#ffd400]">.AI</span>
            </div>
            <span className="text-[10px] text-emerald-200/90 font-semibold tracking-wider uppercase block mt-1 hidden xs:block">
              Siêu thị Kiểng Lá &amp; AI
            </span>
          </div>
        </div>

        {/* CỤM TÌM KIẾM KHỔNG LỒ PHONG CÁCH SHOPEE (TRỌNG TÂM Ở GIỮA) */}
        <div className="flex-1 max-w-2xl lg:max-w-3xl flex flex-col justify-center">
          {/* Ô input tìm kiếm màu trắng với nút Search & Camera AI tích hợp bên trong */}
          <div className="bg-white rounded-lg p-1 sm:p-1.5 shadow-md flex items-center gap-1 sm:gap-2">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="FloraBotanic bao trọn 90 loài kiểng lá - Nhập tên cây, mã #1-90, Monstera..."
              className="flex-1 px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
            />

            {/* NÚT QUÉT ẢNH AI TÍCH HỢP TRONG THANH SEARCH (Giống tính năng chụp hình tìm kiếm của Shopee) */}
            <button
              type="button"
              onClick={onOpenAiModal}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-all border border-emerald-200/80 cursor-pointer shrink-0"
              title="Quét ảnh lá cây bằng AI để nhận diện và tìm chậu mua"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl text-[#004830]">photo_camera</span>
              <span className="hidden sm:inline">Quét Ảnh AI</span>
            </button>

            {/* NÚT TÌM KIẾM CHÍNH (Nút bấm hình chữ nhật nổi bật bên phải thanh search giống Shopee) */}
            <button
              type="button"
              onClick={() => handleExecuteSearch()}
              className="bg-[#004830] hover:bg-[#005e3e] text-white px-4 sm:px-6 py-2 rounded-md font-bold text-xs flex items-center justify-center cursor-pointer transition-colors shadow-xs shrink-0"
              title="Tìm kiếm"
            >
              <span className="material-symbols-outlined text-lg font-bold">search</span>
            </button>
          </div>

          {/* DÒNG TỪ KHÓA TÌM KIẾM HOT DƯỚI THANH SEARCH (Chuẩn Shopee) */}
          <div className="hidden md:flex items-center gap-2.5 sm:gap-3.5 mt-1.5 text-[11px] text-emerald-100/90 overflow-x-auto no-scrollbar whitespace-nowrap pl-1">
            {TRENDING_KEYWORDS.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => {
                  setSearchValue(kw);
                  handleExecuteSearch(kw);
                }}
                className="hover:text-[#ffd400] hover:underline transition-colors cursor-pointer"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* CỤM NÚT BÊN PHẢI: GIỎ HÀNG NỔI BẬT KIỂU SHOPEE */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="relative p-2.5 sm:p-3 text-white hover:text-[#ffd400] transition-colors rounded-xl hover:bg-white/10 flex items-center justify-center cursor-pointer"
            title="Xem giỏ hàng"
          >
            <span className="material-symbols-outlined text-2xl sm:text-3xl">shopping_cart</span>
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] font-black px-1.5 py-0.2 rounded-full min-w-[20px] text-center shadow-md border-2 border-[#004830]">
                {totalCount}
              </span>
            )}
          </button>

          {/* Mobile login avatar if small screen */}
          <div className="block sm:hidden">
            {isAuthenticated ? (
              <div
                onClick={onOpenProfile}
                className="w-8 h-8 rounded-lg bg-[#ffd400] text-[#004830] font-black text-xs flex items-center justify-center cursor-pointer"
              >
                {getInitials(user?.fullName || user?.username)}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="p-1.5 rounded-lg bg-white/10 text-white"
              >
                <span className="material-symbols-outlined text-xl">person</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TẦNG ĐIỀU HƯỚNG & DANH MỤC CÂY Ở GÓC TRÊN BÊN TRÁI (DUY NHẤT 1 NÚT) */}
      {/* ========================================================================= */}
      <div className="w-full bg-[#003822] border-t border-emerald-900/60 relative z-30">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 h-10 sm:h-11 text-xs font-bold">
          {/* NÚT DANH MỤC CÂY Ở GÓC TRÊN BÊN TRÁI (KHÔNG BỊ CLIP BỞI OVERFLOW) */}
          <div className="relative shrink-0" ref={catMenuRef}>
            <button
              type="button"
              onClick={() => setIsCatMenuOpen(!isCatMenuOpen)}
              className="px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 bg-[#ffd400] text-[#003822] shadow-sm font-extrabold hover:bg-[#ffe14d] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base font-bold">menu</span>
              <span>Danh Mục Cây</span>
              <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isCatMenuOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {isCatMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 text-gray-800 animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wide">
                    Hệ thống phân loại kiểng lá
                  </span>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    6 Nhóm Nhu Cầu
                  </span>
                </div>
                <div className="p-1 space-y-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setIsCatMenuOpen(false);
                        if (onSelectCategory) onSelectCategory(cat.id);
                        onNavigate('products');
                      }}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-50 text-left transition-colors group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 group-hover:bg-[#004830] group-hover:text-emerald-300 flex items-center justify-center shrink-0 transition-colors">
                        <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900 group-hover:text-emerald-800 line-clamp-1">
                          {cat.name}
                        </div>
                        <div className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{cat.desc}</div>
                      </div>
                      <span className="material-symbols-outlined text-sm text-gray-300 group-hover:text-emerald-700 my-auto">
                        chevron_right
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* DẢI CÁC LIÊN KẾT ĐIỀU HƯỚNG TRANG (CHO PHÉP CUỘN NGANG TRÊN MÀN HÌNH NHỎ) */}
          <div className="flex-1 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar whitespace-nowrap pl-1 sm:pl-3">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentPage === 'home'
                  ? 'bg-emerald-800/80 text-white shadow-xs'
                  : 'text-gray-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">home</span>
              <span>Trang chủ</span>
            </button>

            <button
              onClick={() => onNavigate('products')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
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
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
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
              className="px-3.5 py-1.5 rounded-lg text-gray-200 hover:bg-white/10 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">history</span>
              <span>Lịch sử quét ảnh</span>
            </button>

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('admin')}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
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
      </div>
    </header>
  );
}
