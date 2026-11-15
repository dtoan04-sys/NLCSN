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
  'Sen đá ngọc bích',
  'Cây thủy sinh',
  'Lan ý hoa trắng',
  'Cây hợp mệnh Thủy'
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
    <header className="fixed top-0 left-0 w-full z-40 bg-[#fafaf7]/95 backdrop-blur-xl text-[#132a1e] shadow-[0_4px_24px_rgba(6,78,59,0.06)] border-b border-emerald-900/10 transition-all font-sans">
      {/* ========================================================================= */}
      {/* 1. TẦNG MICRO TOP BAR (Chỉ hiện trên tablet & desktop: hidden md:block) */}
      {/* ========================================================================= */}
      <div className="w-full bg-emerald-950/[0.035] text-emerald-950/85 text-[11px] border-b border-emerald-900/10 hidden md:block">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
          {/* Cụm trái: Kênh Người Bán / Admin, Tra cứu, Vườn Cây */}
          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' ? (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="hover:text-emerald-700 flex items-center gap-1 font-bold text-emerald-900 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px] text-emerald-700">storefront</span>
                <span>Kênh Quản Trị / Bán Hàng</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="hover:text-emerald-700 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px] text-emerald-700">eco</span>
                <span>Vườn Cây Sinh Khí Thủy Mộc</span>
              </button>
            )}
            <span className="text-emerald-900/20">|</span>
            <button
              type="button"
              onClick={() => onNavigate('wiki')}
              className="hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer font-medium text-emerald-950/80"
            >
              <span className="material-symbols-outlined text-[14px] text-emerald-700">menu_book</span>
              <span>Bách khoa 90 loài thực vật</span>
            </button>
            <span className="text-emerald-900/20">|</span>
            <div className="flex items-center gap-1.5 text-emerald-900/75">
              <span>Kết nối:</span>
              <span
                className="material-symbols-outlined text-[14px] hover:text-emerald-700 cursor-pointer transition-colors"
                title="Fanpage Facebook"
                onClick={() => window.open('https://facebook.com', '_blank')}
              >
                public
              </span>
              <span
                className="material-symbols-outlined text-[14px] hover:text-emerald-700 cursor-pointer transition-colors"
                title="Chat Zalo hỗ trợ"
                onClick={() => window.open('https://zalo.me', '_blank')}
              >
                chat
              </span>
            </div>
          </div>

          {/* Cụm phải: Thông báo, Hỗ trợ, Ngôn ngữ, Tài khoản */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onOpenOrders}
              className="flex items-center gap-1 hover:text-emerald-700 transition-colors cursor-pointer text-emerald-950/85 font-medium"
            >
              <span className="material-symbols-outlined text-[15px] text-emerald-700">notifications</span>
              <span>Thông Báo</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('wiki')}
              className="flex items-center gap-1 hover:text-emerald-700 transition-colors cursor-pointer text-emerald-950/85 font-medium"
            >
              <span className="material-symbols-outlined text-[15px] text-emerald-700">help_outline</span>
              <span>Hỗ Trợ 24/7</span>
            </button>
            <div className="flex items-center gap-1 text-emerald-900/75 font-medium">
              <span className="material-symbols-outlined text-[15px]">language</span>
              <span>Tiếng Việt</span>
            </div>

            <span className="text-emerald-900/20">|</span>

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 hover:text-emerald-700 font-bold text-emerald-950 transition-colors cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-900 to-emerald-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                    {getInitials(user?.fullName || user?.username)}
                  </div>
                  <span className="truncate max-w-[110px]">{user?.fullName || user?.username}</span>
                  <span className="material-symbols-outlined text-xs text-emerald-700">
                    {isUserMenuOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-[#fafaf7] text-[#132a1e] rounded-2xl shadow-2xl border border-emerald-900/10 py-2 z-50 text-xs animate-fadeIn">
                    <div className="px-4 py-2.5 border-b border-emerald-900/10 bg-emerald-950/[0.03]">
                      <p className="text-[11px] text-emerald-700 font-semibold">Tài khoản</p>
                      <p className="font-bold text-emerald-950 truncate">{user?.fullName || user?.username}</p>
                      <p className="text-[11px] text-emerald-800/70 truncate">{user?.email || 'Khách hàng'}</p>
                    </div>
                    <div className="p-1 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenProfile();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 font-semibold hover:bg-emerald-900/5 text-slate-700 hover:text-emerald-900 rounded-xl transition-colors cursor-pointer"
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
                        className="w-full flex items-center gap-2 px-3 py-2 font-semibold hover:bg-emerald-900/5 text-slate-700 hover:text-emerald-900 rounded-xl transition-colors cursor-pointer"
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
                        className="w-full flex items-center gap-2 px-3 py-2 font-semibold hover:bg-emerald-900/5 text-slate-700 hover:text-emerald-900 rounded-xl transition-colors cursor-pointer"
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
                          className="w-full flex items-center gap-2 px-3 py-2 font-bold text-emerald-900 hover:bg-emerald-900/5 rounded-xl transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base text-emerald-700">admin_panel_settings</span>
                          <span>Quản trị Admin Hub</span>
                        </button>
                      )}
                    </div>
                    <div className="border-t border-emerald-900/10 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">logout</span>
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  Đăng Ký
                </button>
                <span className="text-emerald-900/20">/</span>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  Đăng Nhập
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TẦNG MAIN HEADER (Co dãn mượt mà: Responsive Flexbox/Grid) */}
      {/* ========================================================================= */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-2 sm:gap-4 md:gap-6">
        {/* LOGO THƯƠNG HIỆU */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-950 via-emerald-800 to-emerald-600 text-[#fafaf7] flex items-center justify-center font-extrabold shadow-md shadow-emerald-950/15 group-hover:scale-105 transition-all">
            <span className="material-symbols-outlined text-xl sm:text-2xl">eco</span>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-black tracking-tight text-emerald-950 leading-none font-serif-display">
              FloraBotanic<span className="text-emerald-600">.AI</span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-emerald-800/80 font-bold tracking-wider uppercase block mt-0.5 hidden xs:block">
              Kiểng Lá &amp; AI Thực Vật Học
            </span>
          </div>
        </div>

        {/* NÚT THAO TÁC NHANH TRÊN MOBILE (Giỏ hàng & Camera) */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenAiModal}
            className="btn btn-sm btn-square bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-900/15 rounded-xl"
            title="Quét ảnh AI"
          >
            <span className="material-symbols-outlined text-xl">photo_camera</span>
          </button>
          <button
            type="button"
            onClick={onOpenCart}
            className="indicator btn btn-sm btn-square bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-900/15 rounded-xl"
            title="Giỏ hàng"
          >
            <span className="material-symbols-outlined text-xl">shopping_cart</span>
            {totalCount > 0 && (
              <span className="indicator-item badge badge-primary badge-xs font-black border border-white">
                {totalCount}
              </span>
            )}
          </button>
        </div>

        {/* CỤM TÌM KIẾM CO DÃN 100% TRÊN MOBILE / FLEX-1 TRÊN DESKTOP */}
        <div className="w-full md:flex-1 md:max-w-2xl lg:max-w-3xl flex flex-col justify-center order-3 md:order-2">
          <div className="bg-white rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-xs border border-emerald-900/15 focus-within:border-emerald-700 focus-within:ring-2 sm:focus-within:ring-4 focus-within:ring-emerald-600/15 flex items-center gap-1 sm:gap-2 transition-all">
            <span className="material-symbols-outlined text-emerald-700/70 text-lg sm:text-xl pl-1.5 sm:pl-2">
              search
            </span>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tìm tên cây, Monstera, Thủy sinh..."
              className="flex-1 px-1.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-[#132a1e] placeholder-slate-400 bg-transparent focus:outline-none min-w-0"
            />

            {/* NÚT QUÉT ẢNH AI (Desktop / Tablet) */}
            <button
              type="button"
              onClick={onOpenAiModal}
              className="hidden sm:flex btn btn-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-900/15 rounded-xl gap-1.5 shrink-0 shadow-none"
              title="Quét ảnh lá cây bằng AI"
            >
              <span className="material-symbols-outlined text-lg text-emerald-700">photo_camera</span>
              <span>Quét AI</span>
            </button>

            {/* NÚT TÌM KIẾM CHÍNH */}
            <button
              type="button"
              onClick={() => handleExecuteSearch()}
              className="btn btn-sm btn-primary bg-emerald-900 hover:bg-emerald-800 border-none text-[#fafaf7] px-3 sm:px-5 rounded-lg sm:rounded-xl font-bold text-xs shadow-sm shrink-0"
              title="Tìm kiếm"
            >
              <span className="material-symbols-outlined text-base sm:text-lg font-bold">search</span>
            </button>
          </div>

          {/* DÒNG TỪ KHÓA TÌM KIẾM HOT (Chỉ hiện trên desktop, không hiện scrollbar) */}
          <div className="hidden lg:flex items-center gap-1.5 mt-2 text-[11px] text-emerald-950/80 overflow-x-auto no-scrollbar whitespace-nowrap pl-1">
            <span className="text-emerald-800 font-bold flex items-center gap-1 shrink-0 mr-0.5">
              <span className="material-symbols-outlined text-xs text-emerald-600">spa</span>
              <span>Gợi ý:</span>
            </span>
            {TRENDING_KEYWORDS.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => {
                  setSearchValue(kw);
                  handleExecuteSearch(kw);
                }}
                className="shrink-0 hover:text-emerald-950 hover:bg-emerald-100/90 bg-emerald-950/[0.04] border border-emerald-900/10 px-2.5 py-0.5 rounded-full transition-all cursor-pointer text-emerald-900 font-medium"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* CỤM NÚT BÊN PHẢI (DESKTOP) */}
        <div className="hidden md:flex items-center gap-3 shrink-0 order-3">
          <button
            type="button"
            onClick={onOpenCart}
            className="indicator btn btn-ghost p-2.5 sm:p-3 h-auto text-emerald-950 hover:text-emerald-800 rounded-2xl bg-emerald-950/[0.04] hover:bg-emerald-950/[0.08] border border-emerald-900/10 shadow-none"
            title="Xem giỏ hàng"
          >
            <span className="material-symbols-outlined text-2xl sm:text-3xl text-emerald-800">shopping_cart</span>
            {totalCount > 0 && (
              <span className="indicator-item badge badge-primary badge-sm font-black border-2 border-[#fafaf7] shadow-sm">
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TẦNG ĐIỀU HƯỚNG & DANH MỤC CÂY */}
      {/* ========================================================================= */}
      <div className="w-full bg-[#fafaf7]/90 border-t border-emerald-900/10 relative z-30">
        <div className="max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8 flex items-center justify-between gap-1 sm:gap-2 h-10 sm:h-11 text-xs font-bold">
          {/* NÚT DANH MỤC CÂY */}
          <div className="relative shrink-0" ref={catMenuRef}>
            <button
              type="button"
              onClick={() => setIsCatMenuOpen(!isCatMenuOpen)}
              className="btn btn-sm h-8 min-h-8 px-2.5 sm:px-4 rounded-xl flex items-center gap-1 sm:gap-2 bg-emerald-900 hover:bg-emerald-800 text-[#fafaf7] border-none shadow-xs transition-all cursor-pointer font-bold text-xs"
            >
              <span className="material-symbols-outlined text-base font-bold">menu</span>
              <span className="hidden xs:inline">Danh Mục Cây</span>
              <span className="xs:hidden">Mục</span>
              <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isCatMenuOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {isCatMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-[#fafaf7] rounded-2xl shadow-2xl border border-emerald-900/15 p-2 z-50 text-[#132a1e] animate-fadeIn">
                <div className="px-3 py-2 border-b border-emerald-900/10 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wide">
                    Phân loại kiểng lá
                  </span>
                  <span className="badge badge-sm bg-emerald-50 text-emerald-800 border-emerald-900/15 font-bold">
                    6 Nhóm
                  </span>
                </div>
                <div className="p-1 space-y-1 max-h-80 overflow-y-auto no-scrollbar">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setIsCatMenuOpen(false);
                        if (onSelectCategory) onSelectCategory(cat.id);
                        onNavigate('products');
                      }}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-900/5 text-left transition-colors group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 group-hover:bg-emerald-900 group-hover:text-[#fafaf7] flex items-center justify-center shrink-0 transition-colors border border-emerald-900/10">
                        <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-emerald-950 group-hover:text-emerald-700 line-clamp-1">
                          {cat.name}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{cat.desc}</div>
                      </div>
                      <span className="material-symbols-outlined text-sm text-emerald-900/30 group-hover:text-emerald-700 my-auto">
                        chevron_right
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* DẢI CÁC LIÊN KẾT ĐIỀU HƯỚNG TRANG (Cuộn ngang êm ái trên màn hình nhỏ) */}
          <div className="flex-1 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar whitespace-nowrap pl-1 sm:pl-3">
            <button
              onClick={() => onNavigate('home')}
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                currentPage === 'home'
                  ? 'bg-emerald-900/10 text-emerald-950 font-extrabold border border-emerald-900/15'
                  : 'text-slate-600 hover:text-emerald-950 hover:bg-emerald-900/5 font-semibold'
              }`}
            >
              <span className="material-symbols-outlined text-sm sm:text-base text-emerald-700">home</span>
              <span>Trang chủ</span>
            </button>

            <button
              onClick={() => onNavigate('products')}
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                currentPage === 'products' || currentPage === 'detail'
                  ? 'bg-emerald-900/10 text-emerald-950 font-extrabold border border-emerald-900/15'
                  : 'text-slate-600 hover:text-emerald-950 hover:bg-emerald-900/5 font-semibold'
              }`}
            >
              <span className="material-symbols-outlined text-sm sm:text-base text-emerald-700">storefront</span>
              <span>Chậu cây sẵn hàng</span>
            </button>

            <button
              onClick={() => onNavigate('wiki')}
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                currentPage === 'wiki'
                  ? 'bg-emerald-900/10 text-emerald-950 font-extrabold border border-emerald-900/15'
                  : 'text-slate-600 hover:text-emerald-950 hover:bg-emerald-900/5 font-semibold'
              }`}
            >
              <span className="material-symbols-outlined text-sm sm:text-base text-emerald-700">menu_book</span>
              <span>Bách khoa 90 loài</span>
            </button>

            <button
              onClick={onOpenHistory}
              className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-slate-600 hover:text-emerald-950 hover:bg-emerald-900/5 flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer font-semibold"
            >
              <span className="material-symbols-outlined text-sm sm:text-base text-emerald-700">history</span>
              <span>Lịch sử</span>
            </button>

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('admin')}
                className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                  currentPage === 'admin'
                    ? 'bg-emerald-900 text-[#fafaf7] shadow-sm'
                    : 'text-emerald-900 hover:bg-emerald-900/5 border border-dashed border-emerald-800/30'
                }`}
              >
                <span className="material-symbols-outlined text-sm sm:text-base">dashboard</span>
                <span>Admin Hub</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
