import React, { useState, useEffect, useMemo } from 'react';
import { getPlantImage, handleImgError } from '../utils/plantAssets';
import { useCart } from '../context/CartContext';
import { apiFetch, getApiBaseUrl } from '../config';
import ImageUpload from '../components/ImageUpload';

export default function AdminDashboardPage({ onBackToStore, onSelectProduct }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, products, orders, users, ai_logs, species
  const [stats, setStats] = useState({
    tong_doanh_thu: 38500000,
    tong_don_hang: 142,
    so_san_pham: 90,
    tong_ton_kho: 1250,
    tong_luot_quet: 348,
    don_hang_gan_day: [],
    quet_ai_gan_day: []
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [aiLogs, setAiLogs] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter states
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

  // Modals state
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const [newUser, setNewUser] = useState({
    taiKhoan: '',
    matKhau: '',
    hoTen: '',
    email: '',
    diaChi: '',
    vaiTro: 'KhachHang',
    trangThaiTaiKhoan: 'HoatDong'
  });
  const [newProduct, setNewProduct] = useState({
    MaLoaiCay: 1,
    TenSanPham: '',
    GiaBan: 150000,
    SoLuongTonKho: 12,
    KichThuocCay: 'Chậu tiêu chuẩn Ø16cm',
    TinhTrangCay: 'Cây khỏe mạnh, rễ ổn định, lá xanh mướt',
    UrlAnh: ''
  });

  const { showToast } = useCart();

  // Load live data from Backend API
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Thống kê
      const resStats = await apiFetch('/api/admin/thong-ke');
      if (resStats.ok) {
        const data = await resStats.json();
        setStats(data);
      }

      // 2. Sản phẩm
      const resSp = await apiFetch('/api/san-pham');
      if (resSp.ok) {
        const data = await resSp.json();
        setProducts(data);
      }

      // 3. Đơn hàng
      const resOrders = await apiFetch('/api/admin/don-hang');
      if (resOrders.ok) {
        const data = await resOrders.json();
        setOrders(data);
      }

      // 4. Tài khoản người dùng & nhân viên
      const resUsers = await apiFetch('/api/admin/nguoi-dung');
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsers(data);
      }

      // 5. AI Logs
      const resLogs = await apiFetch('/api/admin/ai-logs');
      if (resLogs.ok) {
        const data = await resLogs.json();
        setAiLogs(data);
      }

      // 6. Loài cây
      const resSpecies = await apiFetch('/api/loai-cay');
      if (resSpecies.ok) {
        const data = await resSpecies.json();
        setSpeciesList(data);
      }
    } catch (err) {
      console.log('Admin live sync notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Update order status
  const handleUpdateOrderStatus = async (maDonHang, newStatus) => {
    try {
      const res = await apiFetch(`/api/admin/don-hang/${maDonHang}/trang-thai`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ TrangThaiDonHang: newStatus })
      });
      if (res.ok) {
        showToast(`✅ Đã chuyển trạng thái đơn #${maDonHang} -> ${newStatus}`);
        fetchAllData();
      }
    } catch (e) {
      showToast('❌ Không thể cập nhật trạng thái đơn hàng');
    }
  };

  // Update product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const res = await apiFetch(`/api/admin/san-pham/${editingProduct.MaSanPham || editingProduct.masanpham}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          TenSanPham: editingProduct.TenSanPham || editingProduct.tensanpham,
          GiaBan: Number(editingProduct.GiaBan || editingProduct.giaban),
          SoLuongTonKho: Number(editingProduct.SoLuongTonKho || editingProduct.soluongtonkho),
          KichThuocCay: editingProduct.KichThuocCay || editingProduct.kichthuoccay,
          TinhTrangCay: editingProduct.TinhTrangCay || editingProduct.tinhtrangcay,
          UrlAnh: editingProduct.UrlAnh || editingProduct.urlanh
        })
      });
      if (res.ok) {
        showToast('✅ Đã lưu cập nhật thông tin chậu cây!');
        setEditingProduct(null);
        fetchAllData();
      }
    } catch (e) {
      showToast('❌ Lỗi khi cập nhật sản phẩm');
    }
  };

  // Add new product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/admin/san-pham', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          MaLoaiCay: Number(newProduct.MaLoaiCay),
          TenSanPham: newProduct.TenSanPham,
          GiaBan: Number(newProduct.GiaBan),
          SoLuongTonKho: Number(newProduct.SoLuongTonKho),
          KichThuocCay: newProduct.KichThuocCay,
          TinhTrangCay: newProduct.TinhTrangCay,
          UrlAnh: newProduct.UrlAnh || `/plants/${newProduct.MaLoaiCay}.jpg`
        })
      });
      if (res.ok) {
        showToast('🎉 Đã thêm chậu cây mới vào kho hàng thành công!');
        setIsAddModalOpen(false);
        fetchAllData();
      }
    } catch (e) {
      showToast('❌ Lỗi khi thêm chậu cây');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${name}" (ID #${id}) khỏi danh mục không?`)) return;
    try {
      const res = await apiFetch(`/api/admin/san-pham/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`🗑️ Đã xóa chậu cây #${id} thành công!`);
        fetchAllData();
      }
    } catch (e) {
      showToast('❌ Không thể xóa sản phẩm');
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = (p.TenSanPham || p.tensanpham || '').toLowerCase();
      const tg = (p.TenThuongGoi || p.tenthuonggoi || '').toLowerCase();
      const kh = (p.TenKhoaHoc || p.tenkhoahoc || '').toLowerCase();
      const q = productSearch.toLowerCase();
      const matchSearch = !q || name.includes(q) || tg.includes(q) || kh.includes(q);
      return matchSearch;
    });
  }, [products, productSearch]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    return orders.filter((o) => (o.TrangThaiDonHang || o.trangthaidonhang) === orderFilter);
  }, [orders, orderFilter]);

  // User management handlers
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.taiKhoan || !newUser.matKhau || !newUser.hoTen) {
      showToast('⚠️ Vui lòng điền đủ Tên tài khoản, Mật khẩu và Họ tên!');
      return;
    }
    try {
      const res = await apiFetch('/api/admin/nguoi-dung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        showToast('🎉 Đã tạo tài khoản nhân sự / người dùng mới thành công!');
        setIsAddUserModalOpen(false);
        setNewUser({
          taiKhoan: '',
          matKhau: '',
          hoTen: '',
          email: '',
          diaChi: '',
          vaiTro: 'KhachHang',
          trangThaiTaiKhoan: 'HoatDong'
        });
        fetchAllData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`❌ ${err.detail || 'Không thể tạo tài khoản'}`);
      }
    } catch (e) {
      showToast('❌ Lỗi khi gửi dữ liệu tạo tài khoản');
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    const uid = editingUser.MaNguoiDung || editingUser.manguoidung;
    try {
      const res = await apiFetch(`/api/admin/nguoi-dung/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoTen: editingUser.HoTen || editingUser.hoten,
          email: editingUser.Email || editingUser.email,
          diaChi: editingUser.DiaChi || editingUser.diachi,
          vaiTro: editingUser.VaiTro || editingUser.vaitro,
          trangThaiTaiKhoan: editingUser.TrangThaiTaiKhoan || editingUser.trangthaitaikhoan,
          matKhau: editingUser.MatKhauMoi || undefined
        })
      });
      if (res.ok) {
        showToast('✅ Đã cập nhật thông tin tài khoản thành công!');
        setEditingUser(null);
        fetchAllData();
      } else {
        showToast('❌ Lỗi khi lưu cập nhật tài khoản');
      }
    } catch (e) {
      showToast('❌ Không thể kết nối để cập nhật');
    }
  };

  const handleToggleUserStatus = async (uid, currentStatus) => {
    const nextStatus = currentStatus === 'HoatDong' ? 'BiKhoa' : 'HoatDong';
    try {
      const res = await apiFetch(`/api/admin/nguoi-dung/${uid}/trang-thai`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trangThai: nextStatus })
      });
      if (res.ok) {
        showToast(`✅ Đã chuyển trạng thái tài khoản #${uid} -> ${nextStatus === 'HoatDong' ? 'Đang hoạt động' : 'Bị khóa'}`);
        fetchAllData();
      }
    } catch (e) {
      showToast('❌ Không thể cập nhật trạng thái tài khoản');
    }
  };

  const handleChangeUserRole = async (uid, newRole) => {
    try {
      const res = await apiFetch(`/api/admin/nguoi-dung/${uid}/vai-tro`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaiTro: newRole })
      });
      if (res.ok) {
        showToast(`✅ Đã phân quyền tài khoản #${uid} -> ${newRole}`);
        fetchAllData();
      }
    } catch (e) {
      showToast('❌ Không thể đổi vai trò');
    }
  };

  const handleDeleteUser = async (uid, accountName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa/khóa tài khoản "${accountName}" (#${uid}) không?`)) return;
    try {
      const res = await apiFetch(`/api/admin/nguoi-dung/${uid}`, { method: 'DELETE' });
      if (res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.message || `Đã xử lý tài khoản #${uid}`);
        fetchAllData();
      }
    } catch (e) {
      showToast('❌ Lỗi khi xóa tài khoản');
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const tk = (u.TaiKhoan || u.taikhoan || '').toLowerCase();
      const ht = (u.HoTen || u.hoten || '').toLowerCase();
      const em = (u.Email || u.email || '').toLowerCase();
      const q = userSearch.toLowerCase();
      const matchSearch = !q || tk.includes(q) || ht.includes(q) || em.includes(q);

      const role = u.VaiTro || u.vaitro || '';
      const matchRole = userRoleFilter === 'all' || role === userRoleFilter;

      const st = u.TrangThaiTaiKhoan || u.trangthaitaikhoan || '';
      const matchStatus = userStatusFilter === 'all' || st === userStatusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  return (
    <div className="min-h-screen bg-[#f4f7f4] flex text-gray-800 font-['Plus_Jakarta_Sans']">
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-[#012d1d] text-white flex flex-col justify-between p-5 shadow-2xl flex-none hidden md:flex">
        <div className="space-y-6">
          {/* Logo & Portal title */}
          <div className="flex items-center gap-3 pb-6 border-b border-emerald-900/60">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30 shadow-inner">
              <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight leading-none text-white">
                FloraBotanic<span className="text-emerald-400"> Admin</span>
              </div>
              <span className="text-[10px] text-emerald-400/80 font-mono tracking-wider uppercase mt-1 block">
                Control Hub v2.5
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 font-medium text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/40'
                  : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              <span>Tổng quan &amp; KPI</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
                activeTab === 'products'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/40'
                  : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">potted_plant</span>
              <span>Quản lý chậu cây</span>
              <span className="ml-auto bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {products.length || 90}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
                activeTab === 'orders'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/40'
                  : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">local_mall</span>
              <span>Đơn hàng</span>
              <span className="ml-auto bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {orders.length || '12+'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
                activeTab === 'users'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/40'
                  : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">manage_accounts</span>
              <span>Tài khoản &amp; Nhân sự</span>
              <span className="ml-auto bg-blue-400/20 text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {users.length || '5+'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ai_logs')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
                activeTab === 'ai_logs'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/40'
                  : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">psychology</span>
              <span>Giám sát AI Vision</span>
              <span className="ml-auto bg-purple-400/20 text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                90 Loài
              </span>
            </button>

            <button
              onClick={() => setActiveTab('species')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
                activeTab === 'species'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/40'
                  : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">menu_book</span>
              <span>Tri thức 90 loài cây</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Action */}
        <div className="pt-6 border-t border-emerald-900/60 space-y-3">
          <button
            onClick={onBackToStore}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 text-xs font-bold transition-all border border-emerald-500/20"
          >
            <span className="material-symbols-outlined text-base">storefront</span>
            <span>Về trang mua hàng</span>
          </button>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/20">
            <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center font-bold text-emerald-300 text-xs">
              AD
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-white block truncate">Admin Quản trị</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                SQL Server Live
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStore}
              className="md:hidden p-2 rounded-xl bg-gray-100 text-gray-700"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight">
                {activeTab === 'overview' && 'Bảng Điều Khiển & Chỉ Số KPI'}
                {activeTab === 'products' && 'Quản Lý Danh Mục Chậu Cây (SAN_PHAM)'}
                {activeTab === 'orders' && 'Quản Lý Đơn Hàng & Vận Chuyển (DON_HANG)'}
                {activeTab === 'users' && 'Quản Lý Tài Khoản, Phân Quyền & Nhân Sự (NGUOI_DUNG)'}
                {activeTab === 'ai_logs' && 'Nhật Ký Giám Định AI (MobileNetV2 - TIM_ANH)'}
                {activeTab === 'species' && 'Tri Thức 90 Loài Thực Vật Học (LOAI_CAY)'}
              </h1>
              <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                Hệ thống đồng bộ dữ liệu thời gian thực với SQL Server (CayKiengLa)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
              title="Đồng bộ lại dữ liệu"
            >
              <span className={`material-symbols-outlined text-base ${isLoading ? 'animate-spin' : ''}`}>sync</span>
              <span className="hidden sm:inline">Đồng bộ</span>
            </button>
            <button
              onClick={onBackToStore}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white text-xs font-bold transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-base text-emerald-400">open_in_new</span>
              <span>Xem trang Web</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-8 space-y-8 flex-1">
          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW / DASHBOARD */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* 4 Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Doanh thu */}
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Tổng Doanh Thu</span>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">payments</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-black text-gray-900">
                      {stats.tong_doanh_thu.toLocaleString('vi-VN')} ₫
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-sm">trending_up</span>
                      +18.5% so với tháng trước
                    </span>
                  </div>
                </div>

                {/* Đơn hàng */}
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Đơn Hàng Đã Ghi</span>
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">shopping_bag</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-black text-gray-900">
                      {stats.tong_don_hang} đơn
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-sm">hourglass_top</span>
                      Tự động lưu vào DON_HANG
                    </span>
                  </div>
                </div>

                {/* Kho hàng */}
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Tồn Kho Sẵn Có</span>
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">inventory_2</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-black text-gray-900">
                      {stats.tong_ton_kho || 1080} chậu
                    </div>
                    <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      {stats.so_san_pham || 90} loài cây chuẩn hóa
                    </span>
                  </div>
                </div>

                {/* Lượt quét AI */}
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Lượt Quét AI</span>
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">psychology</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-black text-gray-900">
                      {stats.tong_luot_quet || 65} lần
                    </div>
                    <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      MobileNetV2 90 Class (~50ms)
                    </span>
                  </div>
                </div>
              </div>

              {/* 2 Grids: Recent Orders & Recent AI Scans */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bảng đơn hàng mới nhất */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-xl text-emerald-700">receipt_long</span>
                      <h3 className="font-extrabold text-sm text-gray-900">Đơn hàng mới tiếp nhận</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
                    >
                      Xem tất cả &rarr;
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {stats.don_hang_gan_day && stats.don_hang_gan_day.length > 0 ? (
                      stats.don_hang_gan_day.map((dh) => (
                        <div key={dh.MaDonHang} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-gray-900">#{dh.MaDonHang}</span>
                              <span className="text-xs text-gray-600 font-medium">{dh.KhachHang}</span>
                            </div>
                            <span className="text-[11px] text-gray-400 block mt-0.5">{dh.DiaChi}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-xs text-[#012d1d] block">
                              {dh.TongTien.toLocaleString('vi-VN')} ₫
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {dh.TrangThai || 'Chờ xử lý'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 py-6 text-center">Chưa có đơn hàng mới</p>
                    )}
                  </div>
                </div>

                {/* Bảng quét AI mới nhất */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-xl text-purple-700">photo_camera</span>
                      <h3 className="font-extrabold text-sm text-gray-900">Ảnh thực vật vừa nhận diện</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('ai_logs')}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900"
                    >
                      Xem lịch sử &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {stats.quet_ai_gan_day && stats.quet_ai_gan_day.length > 0 ? (
                      stats.quet_ai_gan_day.map((scan) => (
                        <div
                          key={scan.MaTimKiem}
                          className="p-2.5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-2"
                        >
                          <img
                            src={scan.HinhAnh ? `${getApiBaseUrl()}${scan.HinhAnh}` : `/plants/${scan.MaLoaiCay || 1}.jpg`}
                            alt={scan.LoaiDuDoan}
                            className="w-full aspect-square object-cover rounded-xl bg-gray-200"
                            onError={(e) => handleImgError(e, `/plants/${scan.MaLoaiCay || 1}.jpg`)}
                          />
                          <div>
                            <span className="text-[11px] font-bold text-gray-900 block truncate">
                              {scan.LoaiDuDoan}
                            </span>
                            <span className="text-[10px] font-mono text-purple-700 font-bold">
                              Khớp {scan.DoChinhXac}%
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="col-span-3 text-xs text-gray-400 py-6 text-center">Chưa có ảnh nào được quét</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: QUẢN LÝ SẢN PHẨM (PRODUCTS) */}
          {/* ======================================================== */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden space-y-4 p-6">
              {/* Header Action: Tìm kiếm & Thêm cây */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-gray-400 text-lg">search</span>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Tìm theo tên chậu cây, tên khoa học hoặc thường gọi..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-emerald-600 text-xs text-gray-900"
                  />
                </div>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white text-xs font-bold transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  <span>Thêm chậu cây mới</span>
                </button>
              </div>

              {/* Bảng sản phẩm */}
              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50/80 text-[11px] uppercase font-bold text-gray-700 border-b border-gray-200">
                    <tr>
                      <th className="py-3.5 px-4">Mã</th>
                      <th className="py-3.5 px-4">Chậu cây</th>
                      <th className="py-3.5 px-4">Loài thực vật (LOAI_CAY)</th>
                      <th className="py-3.5 px-4">Giá bán</th>
                      <th className="py-3.5 px-4">Tồn kho</th>
                      <th className="py-3.5 px-4">Kích thước</th>
                      <th className="py-3.5 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredProducts.map((p) => {
                      const spId = p.MaSanPham || p.masanpham;
                      const sId = p.MaLoaiCay || p.maloaicay || spId;
                      const name = p.TenSanPham || p.tensanpham;
                      const price = Number(p.GiaBan || p.giaban || p.GiaThamKhao || 120000);
                      const stock = Number(p.SoLuongTonKho || p.soluongtonkho || 10);
                      const speciesName = p.TenThuongGoi || p.tenthuonggoi || `Loài #${sId}`;
                      const rawUrl = p.UrlAnh || p.urlanh;
                      const img = getPlantImage(sId, speciesName, rawUrl);

                      return (
                        <tr key={spId} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-gray-900">#{spId}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={img}
                                alt={name}
                                className="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-none border border-gray-100"
                                onError={(e) => handleImgError(e)}
                              />
                              <div>
                                <span className="font-extrabold text-gray-900 block text-xs">{name}</span>
                                <span className="text-[10px] text-gray-400 block line-clamp-1">{p.TinhTrangCay || p.tinhtrangcay}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-emerald-800 block">{speciesName}</span>
                            <span className="text-[10px] italic text-gray-400 block">{p.TenKhoaHoc || p.tenkhoahoc}</span>
                          </td>
                          <td className="py-3 px-4 font-extrabold text-gray-900">
                            {price.toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                stock <= 3
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {stock > 0 ? `${stock} chậu` : 'Hết hàng'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[11px] text-gray-500">{p.KichThuocCay || p.kichthuoccay || 'Ø16cm'}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setEditingProduct(p)}
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-600 transition-colors"
                                title="Chỉnh sửa sản phẩm"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(spId, name)}
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-700 text-gray-600 transition-colors"
                                title="Xóa cây này"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: QUẢN LÝ ĐƠN HÀNG (ORDERS) */}
          {/* ======================================================== */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl text-emerald-700">inventory</span>
                  <h3 className="font-extrabold text-sm text-gray-900">Danh sách đơn đặt hàng từ khách hàng</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-semibold">Lọc trạng thái:</span>
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="py-1.5 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-800"
                  >
                    <option value="all">Tất cả đơn</option>
                    <option value="Chờ xử lý">Chờ xử lý</option>
                    <option value="Đang giao hàng">Đang giao hàng</option>
                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                    <option value="Đã hủy">Đã hủy</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50/80 text-[11px] uppercase font-bold text-gray-700 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Mã đơn</th>
                      <th className="py-3 px-4">Khách hàng</th>
                      <th className="py-3 px-4">Số điện thoại &amp; Địa chỉ</th>
                      <th className="py-3 px-4">Phương thức</th>
                      <th className="py-3 px-4">Tổng tiền</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-center">Cập nhật nhanh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((dh) => {
                        const mDh = dh.MADONHANG || dh.madonhang;
                        const status = dh.TRANGTHAIDONHANG || dh.trangthaidonhang || 'Chờ xử lý';
                        const total = Number(dh.TONGTIEN || dh.tongtien || 0);

                        return (
                          <tr key={mDh} className="hover:bg-emerald-50/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-gray-900">#DH-{mDh}</td>
                            <td className="py-3 px-4 font-bold text-gray-900">{dh.KHACHHANG || dh.khachhang || 'Khách vãng lai'}</td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-gray-800 block">{dh.SDTNHANHANG || dh.sdtnhanhang}</span>
                              <span className="text-[11px] text-gray-400 block line-clamp-1">{dh.DIACHINHANHANG || dh.diachinhanhang}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                {dh.PHUONGTHUCTHANHTOAN || 'COD'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-extrabold text-[#012d1d]">
                              {total.toLocaleString('vi-VN')} ₫
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleUpdateOrderStatus(mDh, 'Đang giao hàng')}
                                  className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold"
                                  title="Giao đơn này"
                                >
                                  Giao hàng
                                </button>
                                <button
                                  onClick={() => handleUpdateOrderStatus(mDh, 'Đã hoàn thành')}
                                  className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold"
                                  title="Hoàn tất đơn"
                                >
                                  Hoàn thành
                                </button>
                                <button
                                  onClick={() => handleUpdateOrderStatus(mDh, 'Đã hủy')}
                                  className="px-2 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-[10px] font-bold"
                                  title="Hủy đơn"
                                >
                                  Hủy
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">Không có đơn hàng nào phù hợp bộ lọc</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: GIÁM SÁT NHẬN DIỆN AI (AI LOGS) */}
          {/* ======================================================== */}
          {activeTab === 'ai_logs' && (
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-6">
              {/* Header Info */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">Nhật Ký Giám Định Thị Giác Máy Tính (MobileNetV2)</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Ghi nhận tự động từ bảng TIM_ANH và KET_QUA_NHAN_DIEN mỗi khi người dùng tải ảnh lên quét
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold font-mono">
                  Độ chính xác trung bình: ~94.6%
                </span>
              </div>

              {/* Lưới ảnh quét */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiLogs.length > 0 ? (
                  aiLogs.map((log) => {
                    const mTk = log.MaTimKiem || log.MATIMKIEM || log.matimkiem;
                    const speciesName = log.TenThuongGoi || log.TENTHUONGGOI || log.tenthuonggoi || log.LoaiDuDoan || 'Cây kiểng lá';
                    const sciName = log.TenKhoaHoc || log.TENKHOAHOC || log.tenkhoahoc || '';
                    const prob = Number(log.XacSuatChinhXac || log.XACSUATCHINHXAC || log.xacsuatchinhxac || 92.5);
                    const sId = log.MaLoaiCay || log.MALOAICAY || log.maloaicay || 1;
                    const rawImg = log.HinhAnhUrl || log.HINHANHURL || log.hinhanhurl;
                    const imgUrl = rawImg ? `${getApiBaseUrl()}${rawImg}` : `/plants/${sId}.jpg`;

                    return (
                      <div
                        key={mTk}
                        className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-purple-300 transition-all flex items-start gap-3"
                      >
                        <img
                          src={imgUrl}
                          alt={speciesName}
                          className="w-16 h-16 rounded-xl object-cover bg-gray-200 flex-none border border-gray-200"
                          onError={(e) => handleImgError(e, `/plants/${sId}.jpg`)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-gray-400">#TK-{mTk}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                              Top 1 ({prob}%)
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs text-gray-900 truncate mt-1">{speciesName}</h4>
                          <span className="text-[10px] italic text-gray-400 block truncate">{sciName}</span>
                          <span className="text-[9px] text-gray-400 block mt-2 font-mono">
                            {String(log.THOIGIAN || '').slice(0, 16)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="col-span-3 py-10 text-center text-xs text-gray-400">Chưa có lượt quét nào được lưu</p>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: QUẢN LÝ TÀI KHOẢN, PHÂN QUYỀN & NHÂN SỰ (NGUOI_DUNG) */}
          {/* ======================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Header Action: Tìm kiếm & Thêm tài khoản */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex flex-1 flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px] max-w-md">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm tài khoản, họ tên, email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-emerald-600 bg-gray-50/50"
                    />
                  </div>

                  {/* Lọc Vai trò */}
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white text-gray-700 font-semibold focus:outline-emerald-600"
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="Admin">Admin (Quản trị)</option>
                    <option value="NhanVien">Nhân viên kho / Bán hàng</option>
                    <option value="KhachHang">Khách hàng</option>
                  </select>

                  {/* Lọc Trạng thái */}
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white text-gray-700 font-semibold focus:outline-emerald-600"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="HoatDong">Đang hoạt động</option>
                    <option value="BiKhoa">Bị khóa</option>
                  </select>
                </div>

                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-700/20 active:scale-95 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  <span>Thêm tài khoản / nhân sự mới</span>
                </button>
              </div>

              {/* Bảng danh sách người dùng */}
              <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-gray-50/80 text-[11px] uppercase font-bold text-gray-700 border-b border-gray-200">
                      <tr>
                        <th className="py-3.5 px-4">Mã ND</th>
                        <th className="py-3.5 px-4">Tài khoản &amp; Họ tên</th>
                        <th className="py-3.5 px-4">Email / Địa chỉ</th>
                        <th className="py-3.5 px-4">Vai trò (Phân quyền)</th>
                        <th className="py-3.5 px-4">Số đơn / Chi tiêu</th>
                        <th className="py-3.5 px-4">Trạng thái</th>
                        <th className="py-3.5 px-4 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => {
                          const uid = u.MaNguoiDung || u.manguoidung;
                          const tk = u.TaiKhoan || u.taikhoan;
                          const ht = u.HoTen || u.hoten || tk;
                          const em = u.Email || u.email || 'Chưa cập nhật';
                          const dc = u.DiaChi || u.diachi || '—';
                          const role = u.VaiTro || u.vaitro || 'KhachHang';
                          const st = u.TrangThaiTaiKhoan || u.trangthaitaikhoan || 'HoatDong';
                          const donCount = Number(u.SoLuongDonHang || u.sotruongdonhang || 0);
                          const spend = Number(u.TongChiTieu || u.tongchitieu || 0);

                          return (
                            <tr key={uid} className="hover:bg-emerald-50/30 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-emerald-900">#{uid}</td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                                    {(ht || tk).charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-900">{ht}</div>
                                    <div className="text-[11px] text-gray-400 font-mono">@{tk}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="text-gray-800">{em}</div>
                                <div className="text-[10px] text-gray-400 truncate max-w-xs">{dc}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <select
                                  value={role}
                                  onChange={(e) => handleChangeUserRole(uid, e.target.value)}
                                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                                    role === 'Admin'
                                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                                      : role === 'NhanVien'
                                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                                      : 'bg-gray-100 text-gray-700 border-gray-200'
                                  }`}
                                >
                                  <option value="Admin">Admin (Quản trị)</option>
                                  <option value="NhanVien">Nhân viên</option>
                                  <option value="KhachHang">Khách hàng</option>
                                </select>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-gray-900">{donCount} đơn</div>
                                <div className="text-[10px] text-emerald-700 font-mono">{spend.toLocaleString('vi-VN')} ₫</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <button
                                  onClick={() => handleToggleUserStatus(uid, st)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                                    st === 'HoatDong'
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                  }`}
                                  title="Bấm để Đổi trạng thái Hoạt động / Bị khóa"
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${st === 'HoatDong' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                  <span>{st === 'HoatDong' ? 'Hoạt động' : 'Bị khóa'}</span>
                                </button>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => setEditingUser(u)}
                                    className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                                    title="Sửa thông tin tài khoản"
                                  >
                                    <span className="material-symbols-outlined text-base">edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(uid, tk)}
                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Xóa hoặc khóa tài khoản"
                                  >
                                    <span className="material-symbols-outlined text-base">delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="py-10 text-center text-gray-400">
                            Không tìm thấy tài khoản người dùng phù hợp
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: TRI THỨC 90 LOÀI CÂY (SPECIES WIKI) */}
          {/* ======================================================== */}
          {activeTab === 'species' && (
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-extrabold text-sm text-gray-900">Danh mục 90 loài cây trong cơ sở dữ liệu (LOAI_CAY)</h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  90 Loài Sinh Học Chuẩn
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50/80 text-[11px] uppercase font-bold text-gray-700 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Mã loài</th>
                      <th className="py-3 px-4">Ảnh mẫu</th>
                      <th className="py-3 px-4">Tên thường gọi</th>
                      <th className="py-3 px-4">Tên khoa học</th>
                      <th className="py-3 px-4">Xuất xứ tự nhiên</th>
                      <th className="py-3 px-4">Giá tham khảo</th>
                      <th className="py-3 px-4">Đặc điểm nhận dạng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {speciesList.map((sp) => {
                      const mLoai = sp.MALOAICAY || sp.maloaicay;
                      const tenTg = sp.TENTHUONGGOI || sp.tenthuonggoi;
                      const tenKh = sp.TENKHOAHOC || sp.tenkhoahoc;
                      const img = `/plants/${mLoai}.jpg`;
                      const price = Number(sp.GIATHAMKHAO || sp.giathamkhao || 150000);

                      return (
                        <tr key={mLoai} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-emerald-900">#{mLoai}</td>
                          <td className="py-3 px-4">
                            <img
                              src={img}
                              alt={tenTg}
                              className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                              onError={(e) => handleImgError(e)}
                            />
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900">{tenTg}</td>
                          <td className="py-3 px-4 italic text-emerald-800">{tenKh}</td>
                          <td className="py-3 px-4">{sp.XUATXU || sp.xuatxu || 'Nhiệt đới'}</td>
                          <td className="py-3 px-4 font-bold text-gray-900">{price.toLocaleString('vi-VN')} ₫</td>
                          <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{sp.DACDIEM || sp.dacdiem || 'Lá đẹp mướt khỏe'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODAL: CHỈNH SỬA SẢN PHẨM */}
      {/* ======================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900">
                Chỉnh sửa chậu cây #{editingProduct.MaSanPham || editingProduct.masanpham}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <ImageUpload
                label="Hình ảnh chậu cây thực tế:"
                currentImage={editingProduct.UrlAnh || editingProduct.urlanh}
                defaultSpeciesImage={`/plants/${editingProduct.MaLoaiCay || editingProduct.maloaicay || 1}.jpg`}
                onImageChange={(uploadedUrl) => {
                  setEditingProduct({ ...editingProduct, UrlAnh: uploadedUrl, urlanh: uploadedUrl });
                }}
                onResetToDefault={() => {
                  const mId = editingProduct.MaLoaiCay || editingProduct.maloaicay || 1;
                  setEditingProduct({ ...editingProduct, UrlAnh: `/plants/${mId}.jpg`, urlanh: `/plants/${mId}.jpg` });
                }}
              />

              <div>
                <label className="font-bold text-gray-700 block mb-1">Tên chậu cây hiển thị:</label>
                <input
                  type="text"
                  value={editingProduct.TenSanPham || editingProduct.tensanpham || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, TenSanPham: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:outline-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Giá bán (VNĐ):</label>
                  <input
                    type="number"
                    value={editingProduct.GiaBan || editingProduct.giaban || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, GiaBan: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-emerald-800 focus:outline-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Số lượng tồn kho:</label>
                  <input
                    type="number"
                    value={editingProduct.SoLuongTonKho || editingProduct.soluongtonkho || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, SoLuongTonKho: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-gray-900 focus:outline-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Kích thước chậu:</label>
                <input
                  type="text"
                  value={editingProduct.KichThuocCay || editingProduct.kichthuoccay || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, KichThuocCay: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Tình trạng cây &amp; rễ:</label>
                <textarea
                  value={editingProduct.TinhTrangCay || editingProduct.tinhtrangcay || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, TinhTrangCay: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-emerald-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: THÊM CHẬU CÂY MỚI */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900">
                Thêm chậu cây mới vào kho hàng
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Chọn loài thực vật (1 - 90 loài):</label>
                <select
                  value={newProduct.MaLoaiCay}
                  onChange={(e) => {
                    const mId = Number(e.target.value);
                    const found = speciesList.find((s) => (s.MALOAICAY || s.maloaicay) === mId);
                    setNewProduct({
                      ...newProduct,
                      MaLoaiCay: mId,
                      TenSanPham: found ? `${found.TENTHUONGGOI || found.tenthuonggoi} — chậu mới` : newProduct.TenSanPham
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:outline-emerald-600"
                >
                  {speciesList.map((sp) => {
                    const mId = sp.MALOAICAY || sp.maloaicay;
                    const tg = sp.TENTHUONGGOI || sp.tenthuonggoi;
                    return (
                      <option key={mId} value={mId}>
                        #{mId} - {tg}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Tải ảnh chậu cây lên hệ thống (Kế thừa từ HTQLSX) */}
              <ImageUpload
                label="Hình ảnh chậu cây thực tế:"
                currentImage={newProduct.UrlAnh}
                defaultSpeciesImage={`/plants/${newProduct.MaLoaiCay}.jpg`}
                onImageChange={(uploadedUrl) => {
                  setNewProduct({ ...newProduct, UrlAnh: uploadedUrl });
                }}
                onResetToDefault={() => {
                  setNewProduct({ ...newProduct, UrlAnh: `/plants/${newProduct.MaLoaiCay}.jpg` });
                }}
              />

              <div>
                <label className="font-bold text-gray-700 block mb-1">Tên chậu cây thương mại:</label>
                <input
                  type="text"
                  value={newProduct.TenSanPham}
                  onChange={(e) => setNewProduct({ ...newProduct, TenSanPham: e.target.value })}
                  placeholder="Ví dụ: Monstera Deliciosa Variegata Albo Half-Moon..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:outline-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Giá bán (VNĐ):</label>
                  <input
                    type="number"
                    value={newProduct.GiaBan}
                    onChange={(e) => setNewProduct({ ...newProduct, GiaBan: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-emerald-800 focus:outline-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Số lượng nhập kho:</label>
                  <input
                    type="number"
                    value={newProduct.SoLuongTonKho}
                    onChange={(e) => setNewProduct({ ...newProduct, SoLuongTonKho: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-gray-900 focus:outline-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Kích thước chậu:</label>
                <input
                  type="text"
                  value={newProduct.KichThuocCay}
                  onChange={(e) => setNewProduct({ ...newProduct, KichThuocCay: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Tình trạng cây &amp; rễ:</label>
                <textarea
                  value={newProduct.TinhTrangCay}
                  onChange={(e) => setNewProduct({ ...newProduct, TinhTrangCay: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-emerald-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold shadow-sm"
                >
                  Xác nhận thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: THÊM TÀI KHOẢN / NHÂN SỰ MỚI */}
      {/* ======================================================== */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">person_add</span>
                <span>Thêm tài khoản / nhân sự mới</span>
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Tên tài khoản (Username): *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: nhanvien_kho, hoanganh..."
                  value={newUser.taiKhoan}
                  onChange={(e) => setNewUser({ ...newUser, taiKhoan: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Mật khẩu khởi tạo: *</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu..."
                  value={newUser.matKhau}
                  onChange={(e) => setNewUser({ ...newUser, matKhau: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Họ và tên: *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn Hoàng"
                  value={newUser.hoTen}
                  onChange={(e) => setNewUser({ ...newUser, hoTen: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Email liên hệ:</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Địa chỉ:</label>
                <input
                  type="text"
                  placeholder="Địa chỉ giao hàng / làm việc"
                  value={newUser.diaChi}
                  onChange={(e) => setNewUser({ ...newUser, diaChi: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Vai trò:</label>
                  <select
                    value={newUser.vaiTro}
                    onChange={(e) => setNewUser({ ...newUser, vaiTro: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                  >
                    <option value="KhachHang">Khách hàng</option>
                    <option value="NhanVien">Nhân viên kho</option>
                    <option value="Admin">Admin (Quản trị)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Trạng thái:</label>
                  <select
                    value={newUser.trangThaiTaiKhoan}
                    onChange={(e) => setNewUser({ ...newUser, trangThaiTaiKhoan: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                  >
                    <option value="HoatDong">Đang hoạt động</option>
                    <option value="BiKhoa">Bị khóa</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CHỈNH SỬA TÀI KHOẢN NGƯỜI DÙNG */}
      {/* ======================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">manage_accounts</span>
                <span>Chỉnh sửa tài khoản #{editingUser.MaNguoiDung || editingUser.manguoidung}</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Tài khoản:</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.TaiKhoan || editingUser.taikhoan || ''}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Họ và tên:</label>
                <input
                  type="text"
                  required
                  value={editingUser.HoTen || editingUser.hoten || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, HoTen: e.target.value, hoten: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Email:</label>
                <input
                  type="email"
                  value={editingUser.Email || editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, Email: e.target.value, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Địa chỉ:</label>
                <input
                  type="text"
                  value={editingUser.DiaChi || editingUser.diachi || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, DiaChi: e.target.value, diachi: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Vai trò:</label>
                  <select
                    value={editingUser.VaiTro || editingUser.vaitro || 'KhachHang'}
                    onChange={(e) => setEditingUser({ ...editingUser, VaiTro: e.target.value, vaitro: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                  >
                    <option value="KhachHang">Khách hàng</option>
                    <option value="NhanVien">Nhân viên</option>
                    <option value="Admin">Admin (Quản trị)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Trạng thái:</label>
                  <select
                    value={editingUser.TrangThaiTaiKhoan || editingUser.trangthaitaikhoan || 'HoatDong'}
                    onChange={(e) => setEditingUser({ ...editingUser, TrangThaiTaiKhoan: e.target.value, trangthaitaikhoan: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                  >
                    <option value="HoatDong">Đang hoạt động</option>
                    <option value="BiKhoa">Bị khóa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Đổi mật khẩu mới (để trống nếu không đổi):</label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu mới..."
                  value={editingUser.MatKhauMoi || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, MatKhauMoi: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
