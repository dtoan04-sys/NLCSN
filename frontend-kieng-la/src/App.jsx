import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { HistoryProvider, useHistory } from './context/HistoryContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AiVisionModal from './components/AiVisionModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AuthModal from './components/AuthModal';
import HistoryModal from './components/HistoryModal';
import ProfileModal, { getInitials } from './components/ProfileModal';
import UserOrdersModal from './components/UserOrdersModal';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import SpeciesWikiPage from './pages/SpeciesWikiPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { PRODUCTS } from './data/mockData';

// Lớp bảo vệ chống văng ứng dụng (Crash-Proof ErrorBoundary cho Android WebView)
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || 'Lỗi hiển thị giao diện' };
  }

  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8faf7] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl">restart_alt</span>
          </div>
          <h2 className="text-lg font-extrabold text-gray-900">Đã tự động khôi phục bộ nhớ ứng dụng</h2>
          <p className="text-xs text-gray-500 max-w-sm">{this.state.errorMsg}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, errorMsg: '' });
              window.location.reload();
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 text-white text-xs font-bold shadow-md"
          >
            Quay lại màn hình chính
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp({ isAuthOpen, setIsAuthOpen }) {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSpeciesFilter, setActiveSpeciesFilter] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const { user, isAuthenticated } = useAuth();

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  const { toastMsg, totalCount } = useCart();
  const [exitToast, setExitToast] = useState(false);

  // Ngăn xếp lịch sử điều hướng trang trên Android để bấm nút Back quay lại đúng trang trước đó
  const navStackRef = useRef(['home']);

  const stateRef = useRef({
    currentPage,
    isAiModalOpen,
    isCartOpen,
    isCheckoutOpen,
    isHistoryOpen,
    isProfileOpen,
    isOrdersOpen,
    isAuthOpen,
    activeSpeciesFilter,
    activeCategory
  });

  useEffect(() => {
    stateRef.current = {
      currentPage,
      isAiModalOpen,
      isCartOpen,
      isCheckoutOpen,
      isHistoryOpen,
      isProfileOpen,
      isOrdersOpen,
      isAuthOpen,
      activeSpeciesFilter,
      activeCategory
    };
  }, [
    currentPage,
    isAiModalOpen,
    isCartOpen,
    isCheckoutOpen,
    isHistoryOpen,
    isProfileOpen,
    isOrdersOpen,
    isAuthOpen,
    activeSpeciesFilter,
    activeCategory
  ]);

  // Theo dõi trạng thái kết nối mạng trên điện thoại
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Xử lý nút Back phần cứng & cử chỉ vuốt cạnh màn hình của Android
  // Trả về 'HANDLED' nếu đã đóng modal / lùi trang, hoặc 'EXIT' nếu đang ở màn hình gốc 'home'
  useEffect(() => {
    const handleBack = () => {
      const st = stateRef.current;

      // 1. Nếu Modal AI đang mở -> ưu tiên gọi __aiModalBackHandler (nếu đang xem ảnh chụp thì lùi về Live Camera)
      if (st.isAiModalOpen) {
        if (typeof window.__aiModalBackHandler === 'function') {
          window.__aiModalBackHandler();
        } else {
          setIsAiModalOpen(false);
        }
        return 'HANDLED';
      }
      if (st.isCheckoutOpen) {
        setIsCheckoutOpen(false);
        return 'HANDLED';
      }
      if (st.isCartOpen) {
        setIsCartOpen(false);
        return 'HANDLED';
      }
      if (st.isOrdersOpen) {
        setIsOrdersOpen(false);
        return 'HANDLED';
      }
      if (st.isProfileOpen) {
        setIsProfileOpen(false);
        return 'HANDLED';
      }
      if (st.isHistoryOpen) {
        setIsHistoryOpen(false);
        return 'HANDLED';
      }
      if (st.isAuthOpen) {
        setIsAuthOpen(false);
        return 'HANDLED';
      }

      // 2. Nếu đang ở trang Sản phẩm và có bộ lọc -> xóa bộ lọc trước
      if (st.currentPage === 'products') {
        if (st.activeSpeciesFilter) {
          setActiveSpeciesFilter(null);
          return 'HANDLED';
        }
        if (st.activeCategory !== 'all') {
          setActiveCategory('all');
          return 'HANDLED';
        }
      }

      // 3. Nếu ngăn xếp điều hướng có trang trước đó -> lùi về trang trước
      if (navStackRef.current.length > 1) {
        navStackRef.current.pop();
        const prevPage = navStackRef.current[navStackRef.current.length - 1] || 'home';
        setCurrentPage(prevPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return 'HANDLED';
      }

      // 4. Nếu không phải trang 'home' -> luôn quay về 'home' trước, tuyệt đối không thoát app
      if (st.currentPage !== 'home') {
        navStackRef.current = ['home'];
        setCurrentPage('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return 'HANDLED';
      }

      // 5. Đang ở đúng Trang chủ ('home') và không mở Modal nào -> báo cho MainActivity xử lý nhấn đúp thoát app
      setExitToast(true);
      setTimeout(() => setExitToast(false), 2000);
      return 'EXIT';
    };

    window.handleAndroidBack = handleBack;
    window.addEventListener('appBackButton', handleBack);

    // Đồng bộ thêm popstate cho trình duyệt mobile
    const onPopState = () => {
      handleBack();
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      delete window.handleAndroidBack;
      window.removeEventListener('appBackButton', handleBack);
      window.removeEventListener('popstate', onPopState);
    };
  }, [setIsAuthOpen]);

  const handleNavigate = (page) => {
    if (page === 'products') {
      setActiveSpeciesFilter(null);
    }
    if (page !== currentPage) {
      navStackRef.current.push(page);
      if (navStackRef.current.length > 15) {
        navStackRef.current = navStackRef.current.slice(-15);
      }
      try {
        window.history.pushState({ page }, '');
      } catch (_) {}
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    navStackRef.current.push('detail');
    try {
      window.history.pushState({ page: 'detail' }, '');
    } catch (_) {}
    setCurrentPage('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterBySpecies = (speciesName) => {
    setActiveSpeciesFilter(speciesName);
    navStackRef.current.push('products');
    setCurrentPage('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (catId) => {
    setActiveCategory(catId);
    setActiveSpeciesFilter(null);
    setSearchKeyword('');
    navStackRef.current.push('products');
    setCurrentPage('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (keyword) => {
    setSearchKeyword(keyword || '');
    setActiveSpeciesFilter(null);
    setActiveCategory('all');
    navStackRef.current.push('products');
    setCurrentPage('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (loggedInUser) => {
    if (loggedInUser?.role === 'ADMIN') {
      handleNavigate('admin');
    } else {
      handleNavigate('home');
    }
  };

  // Trang Admin Dashboard
  if (currentPage === 'admin') {
    return (
      <div className="min-h-screen bg-[#f8faf7]">
        <AdminDashboardPage
          onBackToStore={() => handleNavigate('home')}
          onSelectProduct={handleSelectProduct}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf7] font-['Plus_Jakarta_Sans'] text-[#191c1b] flex flex-col justify-between selection:bg-emerald-200 selection:text-emerald-950 pb-20 md:pb-0">
      {/* 1. Header Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onSelectCategory={handleSelectCategory}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onSearch={handleSearch}
        searchKeyword={searchKeyword}
      />

      {/* Cảnh báo mất kết nối mạng trên điện thoại */}
      {!isOnline && (
        <div className="fixed top-16 inset-x-0 z-40 bg-amber-500 text-white text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 shadow-md">
          <span className="material-symbols-outlined text-sm">wifi_off</span>
          <span>Điện thoại đang ngoại tuyến — Dữ liệu 90 loài vẫn được lưu trên máy</span>
        </div>
      )}

      {/* 2. Main Page Content (Khoảng cách dưới Header Shopee co dãn tự động trên mobile và desktop) */}
      <main className="pt-24 sm:pt-28 md:pt-36 flex-1 pb-16 md:pb-0">
        {currentPage === 'home' && (
          <HomePage
            onOpenAiModal={() => setIsAiModalOpen(true)}
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {currentPage === 'products' && (
          <ProductsPage
            onSelectProduct={handleSelectProduct}
            activeCategory={activeCategory}
            activeSpeciesFilter={activeSpeciesFilter}
            onClearSpeciesFilter={() => setActiveSpeciesFilter(null)}
            searchKeyword={searchKeyword}
            onSearchChange={setSearchKeyword}
          />
        )}

        {currentPage === 'detail' && (
          <ProductDetailPage
            product={selectedProduct}
            onBack={() => handleNavigate('products')}
            onCheckoutNow={() => setIsCheckoutOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {currentPage === 'wiki' && (
          <SpeciesWikiPage
            onSelectSpeciesToShop={handleFilterBySpecies}
          />
        )}
      </main>

      {/* 4. Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* 5. Modals & Drawers */}
      {isAiModalOpen && (
        <AiVisionModal
          onClose={() => setIsAiModalOpen(false)}
          onSelectProduct={() => {
            setIsAiModalOpen(false);
            handleNavigate('products');
          }}
          onFilterBySpecies={(spName) => {
            setIsAiModalOpen(false);
            handleFilterBySpecies(spName);
          }}
          onOpenGarden={() => {
            setIsAiModalOpen(false);
            openHistoryModalWithTab('garden');
          }}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => setIsCheckoutOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSpecies={(spName) => {
          setIsHistoryOpen(false);
          handleFilterBySpecies(spName);
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <UserOrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        onNavigateShopping={() => handleNavigate('products')}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-20 md:bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2.5 z-50 animate-bounce border border-sky-400/40">
          <span className="material-symbols-outlined text-sky-400 text-base">water_drop</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Toast thông báo nhấn Back lần nữa để thoát */}
      {exitToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-2xl z-50 pointer-events-none">
          Nhấn Back lần nữa để thoát ứng dụng
        </div>
      )}

      {/* 6. Mobile Bottom Navigation Bar Chuẩn App Bán Hàng Kiểng Lá */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-sky-100 z-40 flex items-center justify-around h-16 px-1 md:hidden shadow-[0_-4px_20px_rgba(14,165,233,0.08)]">
        {/* 1. Trang chủ */}
        <button
          type="button"
          onClick={() => handleNavigate('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentPage === 'home' && !isOrdersOpen ? 'text-blue-700 font-bold' : 'text-slate-500'
          }`}
        >
          <span className="material-symbols-outlined text-xl">home</span>
          <span className="text-[10px] mt-0.5">Trang chủ</span>
        </button>

        {/* 2. Cửa hàng 90 chậu cây */}
        <button
          type="button"
          onClick={() => handleNavigate('products')}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentPage === 'products' || currentPage === 'detail' ? 'text-blue-700 font-bold' : 'text-slate-500'
          }`}
        >
          <span className="material-symbols-outlined text-xl">storefront</span>
          <span className="text-[10px] mt-0.5">Cửa hàng</span>
        </button>

        {/* 3. NÚT CHỤP ẢNH AI NỔI BẬT Ở CHÍNH GIỮA (TÌM CÂY BẰNG HÌNH ẢNH) */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            type="button"
            onClick={() => {
              if (window.AndroidNative?.vibrate) window.AndroidNative.vibrate(30);
              setIsAiModalOpen(true);
            }}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-600 via-blue-700 to-indigo-800 text-white flex flex-col items-center justify-center shadow-lg shadow-sky-600/30 active:scale-90 transition-transform border-4 border-white"
            title="Chụp ảnh cây tìm mua chậu tại vườn"
          >
            <span className="material-symbols-outlined text-2xl">photo_camera</span>
            <span className="text-[8px] font-extrabold uppercase tracking-tight">Quét AI</span>
          </button>
        </div>

        {/* 4. Đơn hàng của tôi (Theo dõi tiến độ đơn hàng) */}
        <button
          type="button"
          onClick={() => {
            if (isAuthenticated) {
              setIsOrdersOpen(true);
            } else {
              setIsAuthOpen(true);
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isOrdersOpen ? 'text-blue-700 font-bold' : 'text-slate-500'
          }`}
        >
          <span className="material-symbols-outlined text-xl">receipt_long</span>
          <span className="text-[10px] mt-0.5">Đơn mua</span>
        </button>

        {/* 5. Bách Khoa 90 Loài */}
        <button
          type="button"
          onClick={() => handleNavigate('wiki')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentPage === 'wiki' ? 'text-blue-700 font-bold' : 'text-slate-500'
          }`}
        >
          <span className="material-symbols-outlined text-xl">menu_book</span>
          <span className="text-[10px] mt-0.5">90 Loài</span>
        </button>
      </nav>
    </div>
  );
}

function AppWithProviders() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <AppErrorBoundary>
      <CartProvider onRequireAuth={() => setIsAuthOpen(true)}>
        <HistoryProvider>
          <MainApp isAuthOpen={isAuthOpen} setIsAuthOpen={setIsAuthOpen} />
        </HistoryProvider>
      </CartProvider>
    </AppErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppWithProviders />
    </AuthProvider>
  );
}
