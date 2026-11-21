import React, { useState, useEffect, useMemo } from 'react';
import { getPlantImage, handleImgError } from '../utils/plantAssets';
import { useCart } from '../context/CartContext';
import { apiFetch, getApiBaseUrl } from '../config';
import ImageUpload from '../components/ImageUpload';
import MultiImageUpload from '../components/MultiImageUpload';

export default function AdminDashboardPage({ onBackToStore, onSelectProduct }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, orders, products, species, vouchers, users, ai_logs
  const [stats, setStats] = useState({
    tong_doanh_thu: 0,
    doanh_thu_ky_truoc: 0,
    tang_truong_phan_tram: 0,
    tong_don_hang: 0,
    don_hoan_thanh: 0,
    don_da_huy: 0,
    ty_le_huy: 0,
    tong_khach_hang: 0,
    so_san_pham: 0,
    tong_ton_kho: 0,
    tong_luot_quet: 0,
    doanh_thu_theo_thoi_gian: [],
    don_hang_theo_trang_thai: [],
    top_san_pham_ban_chay: [],
    san_pham_sap_het: [],
    don_hang_gan_day: [],
    quet_ai_gan_day: []
  });

  // Bộ lọc thống kê doanh thu (Tab Overview)
  const [statsFromDate, setStatsFromDate] = useState('');
  const [statsToDate, setStatsToDate] = useState('');
  const [statsGroupBy, setStatsGroupBy] = useState('day'); // day | month | year
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [aiLogs, setAiLogs] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newVoucher, setNewVoucher] = useState({
    TenMaGiamGia: '',
    TenChuongTrinhGiamGia: '',
    LoaiGiamGia: 'PhanTram',
    GiaTriGiam: 15,
    ToiDa: 50000,
    ToiThieu: 150000,
    SoLuongPhieu: 50,
    MoTa: ''
  });

  // Search & Filter states
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [aiLogSearch, setAiLogSearch] = useState('');
  const [aiLogOodFilter, setAiLogOodFilter] = useState('all'); // all | recognized | ood

  // Modals state
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddSpeciesModalOpen, setIsAddSpeciesModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [orderDetailModal, setOrderDetailModal] = useState({ open: false, loading: false, data: null, error: '' });

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
    UrlAnh: '',
    DanhSachAnh: []
  });
  const [newSpecies, setNewSpecies] = useState({
    TenThuongGoi: '',
    TenKhoaHoc: '',
    MaDanhMuc: 1,
    GiaThamKhao: 200000,
    XuatXu: 'Nhiệt đới Nam Mỹ / Đông Nam Á',
    DacDiemNhanDang: 'Lá xanh mướt, phát triển tốt',
    HuongDanChamSoc: 'Tưới nước 2-3 lần/tuần, ánh sáng tán xạ 60-70%',
    AnhSang: 'Tán xạ 60%',
    DoAm: '70%',
    NhietDo: '25°C',
    DocTinh: 'Không ăn được',
    PhongThuy: 'Hút tài lộc, may mắn',
    UrlAnh: ''
  });

  const { showToast } = useCart();

  // Build stats query params
  const buildStatsQuery = (fromVal = statsFromDate, toVal = statsToDate, groupVal = statsGroupBy) => {
    const params = new URLSearchParams();
    if (fromVal) params.set('from_date', fromVal);
    if (toVal) params.set('to_date', toVal);
    if (groupVal) params.set('group_by', groupVal);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  // Load live stats with filter
  const fetchStats = async (fromVal = statsFromDate, toVal = statsToDate, groupVal = statsGroupBy) => {
    try {
      const qs = buildStatsQuery(fromVal, toVal, groupVal);
      const resStats = await apiFetch(`/api/admin/thong-ke${qs}`);
      if (resStats.ok) {
        const data = await resStats.json();
        setStats((prev) => ({
          ...prev,
          ...data,
          doanh_thu_theo_thoi_gian: Array.isArray(data.doanh_thu_theo_thoi_gian) ? data.doanh_thu_theo_thoi_gian : [],
          don_hang_theo_trang_thai: Array.isArray(data.don_hang_theo_trang_thai) ? data.don_hang_theo_trang_thai : [],
          top_san_pham_ban_chay: Array.isArray(data.top_san_pham_ban_chay) ? data.top_san_pham_ban_chay : [],
          san_pham_sap_het: Array.isArray(data.san_pham_sap_het) ? data.san_pham_sap_het : [],
          don_hang_gan_day: Array.isArray(data.don_hang_gan_day) ? data.don_hang_gan_day : [],
          quet_ai_gan_day: Array.isArray(data.quet_ai_gan_day) ? data.quet_ai_gan_day : []
        }));
      }
    } catch (err) {
      console.log('Admin stats sync notice:', err);
    }
  };

  // Load live data from Backend API
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Thống kê (kèm bộ lọc thời gian & nhóm)
      await fetchStats(statsFromDate, statsToDate, statsGroupBy);

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

      // 7. Mã giảm giá (CHUONG_TRINH_GIAM_GIA)
      const resVouchers = await apiFetch('/api/admin/giam-gia');
      if (resVouchers.ok) {
        const data = await resVouchers.json();
        setVouchers(data);
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

  // Re-fetch stats when date range or groupBy changes
  useEffect(() => {
    fetchStats(statsFromDate, statsToDate, statsGroupBy);
  }, [statsFromDate, statsToDate, statsGroupBy]);

  // Quick date preset helper
  const applyDatePreset = (preset) => {
    const today = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);
    if (preset === 'all') {
      setStatsFromDate('');
      setStatsToDate('');
      return;
    }
    const endStr = fmt(today);
    if (preset === '7d') {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      setStatsFromDate(fmt(start));
      setStatsToDate(endStr);
      setStatsGroupBy('day');
    } else if (preset === '30d') {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      setStatsFromDate(fmt(start));
      setStatsToDate(endStr);
      setStatsGroupBy('day');
    } else if (preset === 'this_month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setStatsFromDate(fmt(start));
      setStatsToDate(endStr);
      setStatsGroupBy('day');
    } else if (preset === 'this_year') {
      const start = new Date(today.getFullYear(), 0, 1);
      setStatsFromDate(fmt(start));
      setStatsToDate(endStr);
      setStatsGroupBy('month');
    }
  };

  // Export CSV report (API first, fallback client UTF-8 BOM CSV if offline)
  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    const todayStr = new Date().toISOString().slice(0, 10);
    const fileName = `bao_cao_doanh_thu_${statsGroupBy}_${todayStr}.csv`;

    const triggerDownload = (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    try {
      const qs = buildStatsQuery(statsFromDate, statsToDate, statsGroupBy);
      const res = await apiFetch(`/api/admin/thong-ke/export-csv${qs}`);
      if (res.ok) {
        const blob = await res.blob();
        triggerDownload(blob);
        showToast('✅ Đã xuất báo cáo CSV từ máy chủ!');
        return;
      }
      throw new Error('Server CSV endpoint unavailable');
    } catch (err) {
      // Fallback xuất CSV UTF-8 BOM trực tiếp từ dữ liệu hiện tại
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const lines = [];
      lines.push(['BÁO CÁO THỐNG KÊ DOANH THU FLORABOTANIC AI'].map(esc).join(','));
      lines.push(['Từ ngày', statsFromDate || 'Tất cả', 'Đến ngày', statsToDate || 'Hiện tại', 'Nhóm theo', statsGroupBy].map(esc).join(','));
      lines.push('');
      lines.push(['CHỈ SỐ TỔNG QUAN', 'GIÁ TRỊ'].map(esc).join(','));
      lines.push(['Tổng doanh thu (VNĐ)', Number(stats.tong_doanh_thu || 0)].map(esc).join(','));
      lines.push(['Tăng trưởng (%)', Number(stats.tang_truong_phan_tram || 0)].map(esc).join(','));
      lines.push(['Tổng đơn hàng', Number(stats.tong_don_hang || 0)].map(esc).join(','));
      lines.push(['Đơn hoàn thành', Number(stats.don_hoan_thanh || 0)].map(esc).join(','));
      lines.push(['Đơn đã hủy', Number(stats.don_da_huy || 0)].map(esc).join(','));
      lines.push(['Tỷ lệ hủy (%)', Number(stats.ty_le_huy || 0)].map(esc).join(','));
      lines.push(['Tổng khách hàng', Number(stats.tong_khach_hang ?? users.length ?? 0)].map(esc).join(','));
      lines.push(['Tổng lượt quét AI', Number(stats.tong_luot_quet || 0)].map(esc).join(','));
      lines.push('');
      lines.push(['DOANH THU THEO THỜI GIAN', 'Doanh thu (VNĐ)', 'Số đơn'].map(esc).join(','));
      (stats.doanh_thu_theo_thoi_gian || []).forEach((r) => {
        lines.push([r.label, Number(r.doanh_thu || 0), Number(r.so_don || 0)].map(esc).join(','));
      });
      lines.push('');
      lines.push(['TRẠNG THÁI ĐƠN HÀNG', 'Số lượng'].map(esc).join(','));
      (stats.don_hang_theo_trang_thai || []).forEach((r) => {
        lines.push([r.trang_thai, Number(r.so_luong || 0)].map(esc).join(','));
      });
      lines.push('');
      lines.push(['TOP SẢN PHẨM BÁN CHẠY', 'Mã SP', 'Đã bán', 'Doanh thu (VNĐ)'].map(esc).join(','));
      (stats.top_san_pham_ban_chay || []).forEach((r) => {
        lines.push([r.ten, r.id, Number(r.da_ban || 0), Number(r.doanh_thu || 0)].map(esc).join(','));
      });
      lines.push('');
      lines.push(['SẢN PHẨM SẮP HẾT HÀNG (<= 5)', 'Mã SP', 'Tồn kho'].map(esc).join(','));
      (stats.san_pham_sap_het || []).forEach((r) => {
        lines.push([r.ten, r.id, Number(r.ton_kho ?? 0)].map(esc).join(','));
      });

      const csvContent = '\uFEFF' + lines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      triggerDownload(blob);
      showToast('📄 Đã xuất báo cáo CSV (chế độ dự phòng UTF-8 BOM)!');
    } finally {
      setIsExportingCsv(false);
    }
  };

  // View order detail modal
  const handleViewOrderDetail = async (maDonHang) => {
    setOrderDetailModal({ open: true, loading: true, data: null, error: '' });
    try {
      const res = await apiFetch(`/api/admin/don-hang/${maDonHang}/chi-tiet`);
      if (res.ok) {
        const data = await res.json();
        setOrderDetailModal({ open: true, loading: false, data, error: '' });
      } else {
        const err = await res.json().catch(() => ({}));
        setOrderDetailModal({
          open: true,
          loading: false,
          data: null,
          error: err.detail || `Không thể tải chi tiết đơn #DH-${maDonHang}`
        });
      }
    } catch (e) {
      setOrderDetailModal({
        open: true,
        loading: false,
        data: null,
        error: 'Lỗi kết nối máy chủ khi tải chi tiết đơn hàng'
      });
    }
  };

  // Update order status (yêu cầu xác nhận trước khi hủy)
  const handleUpdateOrderStatus = async (maDonHang, newStatus) => {
    if (newStatus === 'Đã hủy') {
      const ok = window.confirm(
        `Bạn có chắc chắn muốn chuyển đơn hàng #DH-${maDonHang} sang trạng thái "Đã hủy" không?\nTồn kho và lượt dùng voucher (nếu có) sẽ được hoàn lại.`
      );
      if (!ok) return;
    }
    try {
      const res = await apiFetch(`/api/admin/don-hang/${maDonHang}/trang-thai`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ TrangThaiDonHang: newStatus })
      });
      if (res.ok) {
        showToast(`✅ Đã chuyển trạng thái đơn #${maDonHang} -> ${newStatus}`);
        fetchAllData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`❌ ${err.detail || 'Không thể cập nhật trạng thái đơn hàng'}`);
      }
    } catch (e) {
      showToast('❌ Không thể cập nhật trạng thái đơn hàng');
    }
  };

  // Update product (hỗ trợ nhiều ảnh + chọn ảnh chính)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const mainImg = editingProduct.DanhSachAnh?.find(img => img.isMain || img.LaAnhChinh)?.url || editingProduct.UrlAnh || editingProduct.urlanh;
      const res = await apiFetch(`/api/admin/san-pham/${editingProduct.MaSanPham || editingProduct.masanpham}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          TenSanPham: editingProduct.TenSanPham || editingProduct.tensanpham,
          GiaBan: Number(editingProduct.GiaBan ?? editingProduct.giaban ?? 0),
          SoLuongTonKho: Number(editingProduct.SoLuongTonKho ?? editingProduct.soluongtonkho ?? 0),
          KichThuocCay: editingProduct.KichThuocCay || editingProduct.kichthuoccay,
          TinhTrangCay: editingProduct.TinhTrangCay || editingProduct.tinhtrangcay,
          UrlAnh: mainImg,
          DanhSachAnh: editingProduct.DanhSachAnh || []
        })
      });
      if (res.ok) {
        showToast('✅ Đã lưu cập nhật thông tin chậu cây và album ảnh!');
        setEditingProduct(null);
        fetchAllData();
      }
    } catch (e) {
      showToast('❌ Lỗi khi cập nhật sản phẩm');
    }
  };

  // Add new product (hỗ trợ nhiều ảnh + chọn ảnh chính)
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const mainImg = newProduct.DanhSachAnh?.find(img => img.isMain)?.url || newProduct.UrlAnh || `/plants/${newProduct.MaLoaiCay}.jpg`;
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
          UrlAnh: mainImg,
          DanhSachAnh: newProduct.DanhSachAnh && newProduct.DanhSachAnh.length > 0
            ? newProduct.DanhSachAnh
            : [{ UrlAnh: mainImg, LaAnhChinh: true }]
        })
      });
      if (res.ok) {
        showToast('🎉 Đã thêm chậu cây mới vào kho hàng thành công!');
        setIsAddModalOpen(false);
        setNewProduct({
          MaLoaiCay: 1,
          TenSanPham: '',
          GiaBan: 150000,
          SoLuongTonKho: 12,
          KichThuocCay: 'Chậu tiêu chuẩn Ø16cm',
          TinhTrangCay: 'Cây khỏe mạnh, rễ ổn định, lá xanh mướt',
          UrlAnh: '',
          DanhSachAnh: []
        });
        fetchAllData();
      }
    } catch (e) {
      showToast('❌ Lỗi khi thêm chậu cây');
    }
  };

  // Add new botanical species (tự động tăng mã loài và cập nhật CSDL)
  const handleCreateSpecies = async (e) => {
    e.preventDefault();
    if (!newSpecies.TenThuongGoi.trim() || !newSpecies.TenKhoaHoc.trim()) {
      showToast('⚠️ Vui lòng nhập đầy đủ Tên thường gọi và Tên khoa học!');
      return;
    }
    try {
      const res = await apiFetch('/api/admin/loai-cay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSpecies)
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`🎉 ${data.message || 'Đã thêm loài cây mới thành công!'}`);
        setIsAddSpeciesModalOpen(false);
        setNewSpecies({
          TenThuongGoi: '',
          TenKhoaHoc: '',
          MaDanhMuc: 1,
          GiaThamKhao: 200000,
          XuatXu: 'Nhiệt đới Nam Mỹ / Đông Nam Á',
          DacDiemNhanDang: 'Lá xanh mướt, phát triển tốt',
          HuongDanChamSoc: 'Tưới nước 2-3 lần/tuần, ánh sáng tán xạ 60-70%',
          AnhSang: 'Tán xạ 60%',
          DoAm: '70%',
          NhietDo: '25°C',
          DocTinh: 'Không ăn được',
          PhongThuy: 'Hút tài lộc, may mắn',
          UrlAnh: ''
        });
        fetchAllData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`❌ ${err.detail || 'Lỗi khi thêm loài cây mới'}`);
      }
    } catch (e) {
      showToast('❌ Lỗi kết nối máy chủ');
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

  // Create & Delete Voucher (CHUONG_TRINH_GIAM_GIA)
  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    if (!newVoucher.TenMaGiamGia.trim()) {
      showToast('⚠️ Vui lòng nhập mã giảm giá!');
      return;
    }
    try {
      const res = await apiFetch('/api/admin/giam-gia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newVoucher,
          GiaTriGiam: Number(newVoucher.GiaTriGiam),
          ToiDa: Number(newVoucher.ToiDa),
          ToiThieu: Number(newVoucher.ToiThieu),
          SoLuongPhieu: Number(newVoucher.SoLuongPhieu)
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`🎉 ${data.message || 'Đã tạo mã giảm giá thành công!'}`);
        setNewVoucher({
          TenMaGiamGia: '',
          TenChuongTrinhGiamGia: '',
          LoaiGiamGia: 'PhanTram',
          GiaTriGiam: 15,
          ToiDa: 50000,
          ToiThieu: 150000,
          SoLuongPhieu: 50,
          MoTa: ''
        });
        fetchAllData();
      } else {
        showToast(`❌ ${data.detail || 'Không thể tạo mã giảm giá'}`);
      }
    } catch (err) {
      showToast('❌ Lỗi kết nối khi tạo mã giảm giá');
    }
  };

  // Update Voucher (PUT /api/admin/voucher/{id}, fallback /api/admin/giam-gia/{id})
  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    if (!editingVoucher) return;
    const vid = editingVoucher.MaChuongTrinhGiamGia || editingVoucher.MACHUONGTRINHGIAMGIA;
    const payload = {
      TenMaGiamGia: (editingVoucher.TenMaGiamGia || '').trim().toUpperCase(),
      TenChuongTrinhGiamGia: editingVoucher.TenChuongTrinhGiamGia || '',
      LoaiGiamGia: editingVoucher.LoaiGiamGia || 'PhanTram',
      GiaTriGiam: Number(editingVoucher.GiaTriGiam ?? 0),
      ToiDa: Number(editingVoucher.ToiDa ?? 0),
      ToiThieu: Number(editingVoucher.ToiThieu ?? 0),
      SoLuongPhieu: Number(editingVoucher.SoLuongPhieu ?? 0),
      MoTa: editingVoucher.MoTa || ''
    };
    try {
      let res = await apiFetch(`/api/admin/voucher/${vid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status === 404) {
        res = await apiFetch(`/api/admin/giam-gia/${vid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`✅ ${data.message || `Đã cập nhật mã giảm giá ${payload.TenMaGiamGia}!`}`);
        setEditingVoucher(null);
        fetchAllData();
      } else {
        showToast(`❌ ${data.detail || 'Không thể cập nhật mã giảm giá'}`);
      }
    } catch (err) {
      showToast('❌ Lỗi kết nối khi cập nhật mã giảm giá');
    }
  };

  const handleDeleteVoucher = async (id, code) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${code}" (#${id}) không?`)) return;
    try {
      const res = await apiFetch(`/api/admin/giam-gia/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`🗑️ ${data.message || `Đã xóa mã giảm giá ${code}!`}`);
        fetchAllData();
      }
    } catch (err) {
      showToast('❌ Không thể xóa mã giảm giá');
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

  // Filtered orders (tìm kiếm theo mã đơn, tên khách, SĐT + lọc trạng thái)
  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      const status = o.TRANGTHAIDONHANG || o.TrangThaiDonHang || o.trangthaidonhang || 'Chờ xử lý';
      const matchStatus = orderFilter === 'all' || status === orderFilter;
      if (!matchStatus) return false;
      if (!q) return true;
      const idStr = String(o.MADONHANG || o.MaDonHang || o.madonhang || '');
      const dhCode = `#dh-${idStr}`.toLowerCase();
      const customer = String(o.KHACHHANG || o.KhachHang || o.khachhang || '').toLowerCase();
      const phone = String(o.SDTNHANHANG || o.SdtNhanHang || o.sdtnhanhang || '').toLowerCase();
      const addr = String(o.DIACHINHANHANG || o.DiaChiNhanHang || o.diachinhanhang || '').toLowerCase();
      return idStr.includes(q) || dhCode.includes(q) || customer.includes(q) || phone.includes(q) || addr.includes(q);
    });
  }, [orders, orderFilter, orderSearch]);

  // Filtered species (tìm kiếm theo mã loài, tên thường gọi, tên khoa học, xuất xứ)
  const filteredSpecies = useMemo(() => {
    const q = speciesSearch.trim().toLowerCase();
    if (!q) return speciesList;
    return speciesList.filter((sp) => {
      const idStr = String(sp.MALOAICAY || sp.maloaicay || '');
      const tg = String(sp.TENTHUONGGOI || sp.tenthuonggoi || '').toLowerCase();
      const kh = String(sp.TENKHOAHOC || sp.tenkhoahoc || '').toLowerCase();
      const xx = String(sp.XUATXU || sp.xuatxu || '').toLowerCase();
      const dd = String(sp.DACDIEM || sp.dacdiem || '').toLowerCase();
      return idStr.includes(q) || tg.includes(q) || kh.includes(q) || xx.includes(q) || dd.includes(q);
    });
  }, [speciesList, speciesSearch]);

  // Helper xác định bản ghi AI Log có phải OOD (Lớp khác / Ngoài danh mục) không
  const isAiLogOod = (log) => {
    const sId = Number(log.MaLoaiCay ?? log.MALOAICAY ?? log.maloaicay ?? 0);
    const name = String(log.TenThuongGoi || log.TENTHUONGGOI || log.tenthuonggoi || log.LoaiDuDoan || '').toLowerCase();
    const sci = String(log.TenKhoaHoc || log.TENKHOAHOC || log.tenkhoahoc || '').toLowerCase();
    const st = String(log.TrangThaiNhanDien || log.TRANGTHAINHANDIEN || log.trangthainhandien || '').toLowerCase();
    return (
      Boolean(log.LaLoaiKhac) ||
      sId === 91 ||
      name.includes('lớp khác') ||
      name.includes('ngoài danh mục') ||
      sci.includes('unknown') ||
      st.includes('lớp khác') ||
      st.includes('ood') ||
      st.includes('ngoài')
    );
  };

  // Filtered AI logs (lọc OOD + tìm kiếm)
  const filteredAiLogs = useMemo(() => {
    const q = aiLogSearch.trim().toLowerCase();
    return aiLogs.filter((log) => {
      const ood = isAiLogOod(log);
      if (aiLogOodFilter === 'ood' && !ood) return false;
      if (aiLogOodFilter === 'recognized' && ood) return false;
      if (!q) return true;
      const idStr = String(log.MaTimKiem || log.MATIMKIEM || log.matimkiem || '');
      const name = String(log.TenThuongGoi || log.TENTHUONGGOI || log.tenthuonggoi || log.LoaiDuDoan || '').toLowerCase();
      const sci = String(log.TenKhoaHoc || log.TENKHOAHOC || log.tenkhoahoc || '').toLowerCase();
      const st = String(log.TrangThaiNhanDien || log.TRANGTHAINHANDIEN || log.trangthainhandien || '').toLowerCase();
      return idStr.includes(q) || `#tk-${idStr}`.includes(q) || name.includes(q) || sci.includes(q) || st.includes(q);
    });
  }, [aiLogs, aiLogSearch, aiLogOodFilter]);

  // Danh sách các loài cây sinh học chuẩn (loại trừ lớp Lớp Khác #91 khỏi danh sách chọn chậu cây bán)
  const botanicalSpecies = useMemo(() => {
    return speciesList.filter((s) => {
      const id = Number(s.MALOAICAY || s.maloaicay);
      const tg = (s.TENTHUONGGOI || s.tenthuonggoi || '').toLowerCase();
      const kh = (s.TENKHOAHOC || s.tenkhoahoc || '').toLowerCase();
      return id !== 91 && !tg.includes('lớp khác') && !kh.includes('unknown');
    });
  }, [speciesList]);

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
                {products.length}
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
                {orders.length}
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
                {users.length}
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

            <button
              onClick={() => setActiveTab('vouchers')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
                activeTab === 'vouchers'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/40'
                  : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">confirmation_number</span>
              <span>Mã giảm giá (Voucher)</span>
              <span className="ml-auto bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {vouchers.length}
              </span>
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
                {activeTab === 'products' && 'Quản Lý Danh Mục Chậu Cây'}
                {activeTab === 'orders' && 'Quản Lý Đơn Hàng & Vận Chuyển'}
                {activeTab === 'users' && 'Quản Lý Tài Khoản, Phân Quyền & Nhân Sự'}
                {activeTab === 'ai_logs' && 'Nhật Ký Giám Định AI (v2.0-TuSo0)'}
                {activeTab === 'species' && 'Tri Thức 90 Loài Thực Vật Học'}
                {activeTab === 'vouchers' && 'Quản Lý Mã Giảm Giá & Khuyến Mãi'}
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

        {/* Mobile Responsive Admin Navigation (ngang, cuộn được trên điện thoại/APK) */}
        <nav
          aria-label="Điều hướng quản trị trên di động"
          className="md:hidden bg-white border-b border-gray-200/80 px-3 py-2.5 flex items-center gap-2 overflow-x-auto sticky top-[65px] z-20 shadow-2xs"
        >
          {[
            { id: 'overview', label: 'Tổng quan', icon: 'dashboard' },
            { id: 'orders', label: 'Đơn hàng', icon: 'local_mall', badge: orders.length },
            { id: 'products', label: 'Chậu cây', icon: 'potted_plant', badge: products.length },
            { id: 'species', label: 'Loài cây', icon: 'menu_book', badge: botanicalSpecies.length },
            { id: 'vouchers', label: 'Voucher', icon: 'confirmation_number', badge: vouchers.length },
            { id: 'users', label: 'Tài khoản', icon: 'manage_accounts', badge: users.length },
            { id: 'ai_logs', label: 'AI Vision', icon: 'psychology', badge: aiLogs.length }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-none ${
                  isActive
                    ? 'bg-[#012d1d] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white text-gray-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Content Body */}
        <main className="p-4 sm:p-8 space-y-8 flex-1">
          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW / DASHBOARD & THỐNG KÊ DOANH THU */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (() => {
            const totalRevenue = Number(stats.tong_doanh_thu ?? 0);
            const prevRevenue = Number(stats.doanh_thu_ky_truoc ?? 0);
            const growthPct = Number(stats.tang_truong_phan_tram ?? 0);
            const totalOrders = Number(stats.tong_don_hang ?? 0);
            const completedOrders = Number(stats.don_hoan_thanh ?? 0);
            const cancelledOrders = Number(stats.don_da_huy ?? 0);
            const cancelRate = Number(stats.ty_le_huy ?? (totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0));
            const totalCustomers = Number(
              stats.tong_khach_hang ?? users.filter((u) => (u.VaiTro || u.vaitro) === 'KhachHang').length ?? users.length ?? 0
            );
            const totalScans = Number(stats.tong_luot_quet ?? 0);

            const timeSeries = Array.isArray(stats.doanh_thu_theo_thoi_gian) ? stats.doanh_thu_theo_thoi_gian : [];
            const statusDist = Array.isArray(stats.don_hang_theo_trang_thai) ? stats.don_hang_theo_trang_thai : [];
            const topProducts = Array.isArray(stats.top_san_pham_ban_chay) ? stats.top_san_pham_ban_chay : [];
            const lowStockItems = Array.isArray(stats.san_pham_sap_het) ? stats.san_pham_sap_het : [];

            const maxRev = Math.max(...timeSeries.map((d) => Number(d.doanh_thu || 0)), 1);
            const maxOrd = Math.max(...timeSeries.map((d) => Number(d.so_don || 0)), 1);
            const totalStatusCount = Math.max(
              statusDist.reduce((acc, item) => acc + Number(item.so_luong || 0), 0),
              1
            );

            const formatShortVnd = (val) => {
              const n = Number(val || 0);
              if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}tỷ`;
              if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
              if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
              return `${n}`;
            };

            const getStatusBarColor = (stName) => {
              const s = String(stName || '').toLowerCase();
              if (s.includes('hoàn thành') || s.includes('đã giao')) return { bar: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700' };
              if (s.includes('đang giao')) return { bar: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700' };
              if (s.includes('hủy')) return { bar: 'bg-rose-500', pill: 'bg-rose-50 text-rose-700' };
              return { bar: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700' };
            };

            // SVG geometry for Revenue + Orders Chart
            const chartW = Math.max(560, timeSeries.length * 64);
            const chartH = 230;
            const padL = 54;
            const padR = 24;
            const padT = 20;
            const padB = 42;
            const plotW = chartW - padL - padR;
            const plotH = chartH - padT - padB;
            const stepX = timeSeries.length > 0 ? plotW / timeSeries.length : plotW;
            const barW = Math.min(34, Math.max(14, stepX * 0.52));

            const orderLinePoints = timeSeries
              .map((d, idx) => {
                const cx = padL + idx * stepX + stepX / 2;
                const cy = padT + plotH - (Number(d.so_don || 0) / maxOrd) * (plotH * 0.85);
                return `${cx.toFixed(1)},${cy.toFixed(1)}`;
              })
              .join(' ');

            return (
              <div className="space-y-6">
                {/* Bộ lọc khoảng thời gian, nhóm theo Ngày/Tháng/Năm & Xuất CSV */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-500">Từ:</span>
                        <input
                          type="date"
                          value={statsFromDate}
                          onChange={(e) => setStatsFromDate(e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-emerald-600"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-500">Đến:</span>
                        <input
                          type="date"
                          value={statsToDate}
                          onChange={(e) => setStatsToDate(e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-emerald-600"
                        />
                      </div>
                      <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                        {[
                          { id: 'day', label: 'Ngày' },
                          { id: 'month', label: 'Tháng' },
                          { id: 'year', label: 'Năm' }
                        ].map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setStatsGroupBy(g.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              statsGroupBy === g.id
                                ? 'bg-[#012d1d] text-white shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 text-[11px]">
                        {[
                          { id: '7d', label: '7 ngày' },
                          { id: '30d', label: '30 ngày' },
                          { id: 'this_month', label: 'Tháng này' },
                          { id: 'all', label: 'Tất cả' }
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => applyDatePreset(p.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold transition-colors"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleExportCsv}
                        disabled={isExportingCsv}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                        <span>{isExportingCsv ? 'Đang xuất...' : 'Xuất báo cáo CSV'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 Real KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* 1. Tổng Doanh Thu */}
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between text-gray-500">
                      <span className="text-xs font-bold uppercase tracking-wider">Tổng Doanh Thu</span>
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">payments</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-black text-gray-900">
                        {totalRevenue.toLocaleString('vi-VN')} ₫
                      </div>
                      <span
                        className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${
                          growthPct >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                        title={`Doanh thu kỳ trước: ${prevRevenue.toLocaleString('vi-VN')} ₫`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {growthPct >= 0 ? 'trending_up' : 'trending_down'}
                        </span>
                        {growthPct > 0 ? '+' : ''}
                        {growthPct.toFixed(1)}% so với kỳ trước
                      </span>
                    </div>
                  </div>

                  {/* 2. Tổng Đơn Hàng */}
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between text-gray-500">
                      <span className="text-xs font-bold uppercase tracking-wider">Tổng Đơn Hàng</span>
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">shopping_bag</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-black text-gray-900">
                        {totalOrders.toLocaleString('vi-VN')} đơn
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-bold mt-1">
                        <span className="text-emerald-700">Hoàn thành: {completedOrders}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-rose-600">
                          Hủy: {cancelledOrders} ({cancelRate.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Tổng Khách Hàng & Tồn Kho */}
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between text-gray-500">
                      <span className="text-xs font-bold uppercase tracking-wider">Tổng Khách Hàng</span>
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">group</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-black text-gray-900">
                        {totalCustomers.toLocaleString('vi-VN')} khách
                      </div>
                      <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-sm">inventory_2</span>
                        Tồn kho: {Number(stats.tong_ton_kho ?? 0).toLocaleString('vi-VN')} chậu ({Number(stats.so_san_pham ?? products.length)} SP)
                      </span>
                    </div>
                  </div>

                  {/* 4. Tổng Lượt Quét AI */}
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between text-gray-500">
                      <span className="text-xs font-bold uppercase tracking-wider">Tổng Lượt Quét AI</span>
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">psychology</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-black text-gray-900">
                        {totalScans.toLocaleString('vi-VN')} lần
                      </div>
                      <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        Ensemble v2.0-TuSo0 (90 Class)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Biểu đồ Doanh thu & Số đơn + Phân bố Trạng thái đơn hàng */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Biểu đồ cột & xu hướng Doanh thu & Số đơn theo thời gian (SVG) */}
                  <div className="xl:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl text-emerald-700">bar_chart</span>
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-900">
                            Biểu đồ Doanh thu &amp; Số đơn theo thời gian
                          </h3>
                          <p className="text-[11px] text-gray-400">
                            Nhóm theo: {statsGroupBy === 'day' ? 'Ngày' : statsGroupBy === 'month' ? 'Tháng' : 'Năm'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-bold">
                        <span className="flex items-center gap-1.5 text-emerald-700">
                          <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block"></span>
                          Doanh thu (₫)
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-600">
                          <span className="w-3 h-1 rounded-full bg-amber-500 inline-block"></span>
                          Số đơn
                        </span>
                      </div>
                    </div>

                    {timeSeries.length > 0 ? (
                      <div className="overflow-x-auto pb-2">
                        <svg
                          viewBox={`0 0 ${chartW} ${chartH}`}
                          className="w-full min-w-[520px] h-[230px] select-none"
                          role="img"
                          aria-label="Biểu đồ doanh thu và số đơn theo thời gian"
                        >
                          <defs>
                            <linearGradient id="revBarGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#059669" />
                              <stop offset="100%" stopColor="#34d399" stopOpacity="0.75" />
                            </linearGradient>
                          </defs>

                          {/* Horizontal gridlines + Y ticks */}
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                            const y = padT + plotH - ratio * plotH;
                            const val = maxRev * ratio;
                            return (
                              <g key={idx}>
                                <line
                                  x1={padL}
                                  y1={y}
                                  x2={chartW - padR}
                                  y2={y}
                                  stroke="#e5e7eb"
                                  strokeDasharray={ratio === 0 ? '0' : '4 4'}
                                />
                                <text
                                  x={padL - 8}
                                  y={y + 3}
                                  textAnchor="end"
                                  className="fill-gray-400 text-[10px] font-mono"
                                >
                                  {formatShortVnd(val)}
                                </text>
                              </g>
                            );
                          })}

                          {/* Revenue bars */}
                          {timeSeries.map((d, idx) => {
                            const rev = Number(d.doanh_thu || 0);
                            const ord = Number(d.so_don || 0);
                            const h = (rev / maxRev) * plotH;
                            const x = padL + idx * stepX + (stepX - barW) / 2;
                            const y = padT + plotH - h;
                            const shortLabel = String(d.label || '').length > 10 ? String(d.label).slice(5) : String(d.label || '');
                            return (
                              <g key={`${d.label}-${idx}`}>
                                <rect
                                  x={x}
                                  y={y}
                                  width={barW}
                                  height={Math.max(h, 2)}
                                  rx="6"
                                  fill="url(#revBarGrad)"
                                  className="transition-opacity hover:opacity-80 cursor-pointer"
                                >
                                  <title>{`${d.label}: ${rev.toLocaleString('vi-VN')} ₫ (${ord} đơn)`}</title>
                                </rect>
                                <text
                                  x={padL + idx * stepX + stepX / 2}
                                  y={chartH - 14}
                                  textAnchor="middle"
                                  className="fill-gray-500 text-[10px] font-semibold"
                                >
                                  {shortLabel}
                                </text>
                              </g>
                            );
                          })}

                          {/* Orders trend line */}
                          {timeSeries.length > 1 && (
                            <polyline
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={orderLinePoints}
                            />
                          )}

                          {/* Order count dots */}
                          {timeSeries.map((d, idx) => {
                            const ord = Number(d.so_don || 0);
                            const cx = padL + idx * stepX + stepX / 2;
                            const cy = padT + plotH - (ord / maxOrd) * (plotH * 0.85);
                            return (
                              <g key={`dot-${idx}`}>
                                <circle cx={cx} cy={cy} r="4" fill="#ffffff" stroke="#f59e0b" strokeWidth="2.5">
                                  <title>{`${d.label}: ${ord} đơn hàng`}</title>
                                </circle>
                                <text
                                  x={cx}
                                  y={cy - 8}
                                  textAnchor="middle"
                                  className="fill-amber-700 text-[9px] font-bold"
                                >
                                  {ord}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-xs text-gray-400">
                        Chưa có dữ liệu doanh thu trong khoảng thời gian đã chọn
                      </div>
                    )}
                  </div>

                  {/* Biểu đồ thanh ngang phân bố Trạng thái đơn hàng */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                      <span className="material-symbols-outlined text-xl text-amber-600">donut_small</span>
                      <h3 className="font-extrabold text-sm text-gray-900">Trạng thái đơn hàng</h3>
                    </div>

                    {statusDist.length > 0 ? (
                      <div className="space-y-4 pt-1">
                        {statusDist.map((stItem, idx) => {
                          const cnt = Number(stItem.so_luong || 0);
                          const pct = Math.round((cnt / totalStatusCount) * 1000) / 10;
                          const colors = getStatusBarColor(stItem.trang_thai);
                          return (
                            <div key={`${stItem.trang_thai}-${idx}`} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className={`px-2 py-0.5 rounded-lg font-bold ${colors.pill}`}>
                                  {stItem.trang_thai}
                                </span>
                                <span className="font-extrabold text-gray-800">
                                  {cnt} đơn <span className="text-gray-400 font-semibold">({pct}%)</span>
                                </span>
                              </div>
                              <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                                  style={{ width: `${Math.max(pct, cnt > 0 ? 4 : 0)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 py-10 text-center">Chưa có dữ liệu trạng thái đơn hàng</p>
                    )}
                  </div>
                </div>

                {/* 2 Bảng nhanh: Top sản phẩm bán chạy & Cảnh báo sản phẩm sắp hết hàng (<= 5) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top sản phẩm bán chạy */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl text-emerald-700">workspace_premium</span>
                        <h3 className="font-extrabold text-sm text-gray-900">Top sản phẩm bán chạy</h3>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        {topProducts.length} SP
                      </span>
                    </div>

                    {topProducts.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {topProducts.map((item, idx) => (
                          <div key={`${item.id}-${idx}`} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] flex-none ${
                                  idx === 0
                                    ? 'bg-amber-100 text-amber-800'
                                    : idx === 1
                                    ? 'bg-gray-200 text-gray-700'
                                    : idx === 2
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                #{idx + 1}
                              </span>
                              <div className="min-w-0">
                                <span className="font-bold text-gray-900 block truncate">{item.ten}</span>
                                <span className="text-[10px] text-gray-400 font-mono">Mã SP #{item.id}</span>
                              </div>
                            </div>
                            <div className="text-right flex-none">
                              <span className="font-extrabold text-[#012d1d] block">
                                {Number(item.doanh_thu || 0).toLocaleString('vi-VN')} ₫
                              </span>
                              <span className="text-[10px] font-bold text-emerald-700">
                                Đã bán: {Number(item.da_ban || 0)} chậu
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 py-8 text-center">Chưa có dữ liệu sản phẩm bán chạy</p>
                    )}
                  </div>

                  {/* Cảnh báo sản phẩm sắp hết hàng (<= 5) */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl text-rose-600">warning</span>
                        <h3 className="font-extrabold text-sm text-gray-900">Cảnh báo sắp hết hàng (&le; 5)</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('products')}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800"
                      >
                        Quản lý kho &rarr;
                      </button>
                    </div>

                    {lowStockItems.length > 0 ? (
                      <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto pr-1">
                        {lowStockItems.map((item) => {
                          const qty = Number(item.ton_kho ?? 0);
                          return (
                            <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-gray-900 block truncate">{item.ten}</span>
                                <span className="text-[10px] text-gray-400 font-mono">Mã SP #{item.id}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-none">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    qty <= 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {qty <= 0 ? 'Hết hàng (0)' : `Còn ${qty} chậu`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const found = products.find((p) => Number(p.MaSanPham || p.masanpham) === Number(item.id));
                                    if (found) setEditingProduct(found);
                                    else setActiveTab('products');
                                  }}
                                  className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-800 text-[10px] font-bold"
                                >
                                  Nhập kho
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-emerald-700 font-semibold flex flex-col items-center gap-1">
                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                        <span>Tất cả sản phẩm đều còn tồn kho an toàn (&gt; 5 chậu)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2 Grids: Recent Orders & Recent AI Scans */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          <div
                            key={dh.MaDonHang}
                            onClick={() => handleViewOrderDetail(dh.MaDonHang)}
                            className="py-3 flex items-center justify-between hover:bg-emerald-50/40 rounded-xl px-2 -mx-2 cursor-pointer transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-gray-900">#{dh.MaDonHang}</span>
                                <span className="text-xs text-gray-600 font-medium">{dh.KhachHang}</span>
                              </div>
                              <span className="text-[11px] text-gray-400 block mt-0.5">{dh.DiaChi}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-xs text-[#012d1d] block">
                                {Number(dh.TongTien || 0).toLocaleString('vi-VN')} ₫
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
            );
          })()}

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
                      <th className="py-3.5 px-4">Loài thực vật</th>
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
                      const price = Number(p.GiaBan ?? p.giaban ?? p.GiaThamKhao ?? 0);
                      const stock = Number(p.SoLuongTonKho ?? p.soluongtonkho ?? 0);
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
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl text-emerald-700">inventory</span>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    Danh sách đơn đặt hàng ({filteredOrders.length}/{orders.length})
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative min-w-[220px]">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                      search
                    </span>
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Tìm mã đơn, tên khách, SĐT..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-emerald-600"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">Trạng thái:</span>
                    <select
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value)}
                      className="py-1.5 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-emerald-600"
                    >
                      <option value="all">Tất cả đơn</option>
                      <option value="Chờ xử lý">Chờ xử lý</option>
                      <option value="Đang giao hàng">Đang giao hàng</option>
                      <option value="Đã hoàn thành">Đã hoàn thành</option>
                      <option value="Đã hủy">Đã hủy</option>
                    </select>
                  </div>
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
                      <th className="py-3 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((dh) => {
                        const mDh = dh.MADONHANG || dh.MaDonHang || dh.madonhang;
                        const status = dh.TRANGTHAIDONHANG || dh.TrangThaiDonHang || dh.trangthaidonhang || 'Chờ xử lý';
                        const total = Number(dh.TONGTIEN ?? dh.TongTien ?? dh.tongtien ?? 0);

                        return (
                          <tr key={mDh} className="hover:bg-emerald-50/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-gray-900">#DH-{mDh}</td>
                            <td className="py-3 px-4 font-bold text-gray-900">{dh.KHACHHANG || dh.KhachHang || dh.khachhang || 'Khách vãng lai'}</td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-gray-800 block">{dh.SDTNHANHANG || dh.SdtNhanHang || dh.sdtnhanhang}</span>
                              <span className="text-[11px] text-gray-400 block line-clamp-1">{dh.DIACHINHANHANG || dh.DiaChiNhanHang || dh.diachinhanhang}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                {dh.PHUONGTHUCTHANHTOAN || dh.PhuongThucThanhToan || 'COD'}
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
                              <div className="flex items-center justify-center flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleViewOrderDetail(mDh)}
                                  className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-800 text-[10px] font-bold flex items-center gap-1"
                                  title="Xem chi tiết đơn hàng"
                                >
                                  <span className="material-symbols-outlined text-xs">visibility</span>
                                  <span>Chi tiết</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(mDh, 'Đang giao hàng')}
                                  className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold"
                                  title="Giao đơn này"
                                >
                                  Giao hàng
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(mDh, 'Đã hoàn thành')}
                                  className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold"
                                  title="Hoàn tất đơn"
                                >
                                  Hoàn thành
                                </button>
                                <button
                                  type="button"
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
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-5">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    Nhật Ký Giám Định Thị Giác Máy Tính ({filteredAiLogs.length}/{aiLogs.length})
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Ghi nhận tự động từ bảng TIM_ANH và KET_QUA_NHAN_DIEN mỗi khi người dùng tải ảnh lên quét
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold font-mono self-start sm:self-auto">
                  v2.0-TuSo0 • 90 Loài + OOD
                </span>
              </div>

              {/* Bộ lọc tìm kiếm & lọc OOD */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                    search
                  </span>
                  <input
                    type="text"
                    value={aiLogSearch}
                    onChange={(e) => setAiLogSearch(e.target.value)}
                    placeholder="Tìm theo mã #TK, tên loài, tên khoa học, trạng thái..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-purple-600"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'recognized', label: '90 Loài hợp lệ' },
                    { id: 'ood', label: 'Ngoài danh mục (OOD)' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAiLogOodFilter(opt.id)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                        aiLogOodFilter === opt.id
                          ? opt.id === 'ood'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-purple-700 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lưới ảnh quét */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAiLogs.length > 0 ? (
                  filteredAiLogs.map((log) => {
                    const mTk = log.MaTimKiem || log.MATIMKIEM || log.matimkiem;
                    const speciesName = log.TenThuongGoi || log.TENTHUONGGOI || log.tenthuonggoi || log.LoaiDuDoan || 'Cây kiểng lá';
                    const sciName = log.TenKhoaHoc || log.TENKHOAHOC || log.tenkhoahoc || '';
                    const prob = Number(log.XacSuatChinhXac ?? log.XACSUATCHINHXAC ?? log.xacsuatchinhxac ?? 0);
                    const sId = log.MaLoaiCay || log.MALOAICAY || log.maloaicay || 1;
                    const rawImg = log.HinhAnhUrl || log.HINHANHURL || log.hinhanhurl;
                    const imgUrl = rawImg ? `${getApiBaseUrl()}${rawImg}` : `/plants/${sId}.jpg`;
                    const ood = isAiLogOod(log);

                    return (
                      <div
                        key={mTk}
                        className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                          ood
                            ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                            : 'bg-gray-50/80 border-gray-100 hover:border-purple-300'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={speciesName}
                          className="w-16 h-16 rounded-xl object-cover bg-gray-200 flex-none border border-gray-200"
                          onError={(e) => handleImgError(e, `/plants/${sId}.jpg`)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono font-bold text-gray-400">#TK-{mTk}</span>
                            {ood ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                                OOD ({prob.toFixed(1)}%)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                Top 1 ({prob.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-xs text-gray-900 truncate mt-1">{speciesName}</h4>
                          <span className="text-[10px] italic text-gray-400 block truncate">{sciName}</span>
                          <span className="text-[9px] text-gray-400 block mt-2 font-mono">
                            {String(log.THOIGIAN || log.ThoiGian || '').slice(0, 16)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="col-span-3 py-10 text-center text-xs text-gray-400">
                    Không có lượt quét AI nào phù hợp bộ lọc
                  </p>
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    Danh mục {botanicalSpecies.length || 90} loài cây thực vật học (LOAI_CAY)
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Khi thêm loài mới, mục Quản lý chậu cây sẽ tự động tăng số lượng và cập nhật ngay lập tức
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/60">
                    {botanicalSpecies.length || 90} Loài Sinh Học Chuẩn
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddSpeciesModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#004830] hover:bg-[#005e3e] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    <span>Thêm Loài Cây Mới</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                    search
                  </span>
                  <input
                    type="text"
                    value={speciesSearch}
                    onChange={(e) => setSpeciesSearch(e.target.value)}
                    placeholder="Tìm theo mã loài, tên thường gọi, tên khoa học, xuất xứ..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-emerald-600"
                  />
                </div>
                <span className="text-xs text-gray-500 font-semibold">
                  Hiển thị {filteredSpecies.length} / {speciesList.length} loài
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
                    {filteredSpecies.length > 0 ? (
                      filteredSpecies.map((sp) => {
                        const mLoai = sp.MALOAICAY || sp.maloaicay;
                        const tenTg = sp.TENTHUONGGOI || sp.tenthuonggoi;
                        const tenKh = sp.TENKHOAHOC || sp.tenkhoahoc;
                        const img = `/plants/${mLoai}.jpg`;
                        const price = Number(sp.GIATHAMKHAO ?? sp.giathamkhao ?? 0);

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
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">
                          Không tìm thấy loài cây nào phù hợp từ khóa "{speciesSearch}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: QUẢN LÝ MÃ GIẢM GIÁ (CHUONG_TRINH_GIAM_GIA) */}
          {/* ======================================================== */}
          {activeTab === 'vouchers' && (
            <div className="space-y-6">
              {/* Form thêm mã giảm giá nhanh */}
              <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6">
                <h3 className="font-extrabold text-sm text-gray-900 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">add_circle</span>
                  <span>Tạo Mã Giảm Giá Mới (Lưu trực tiếp SQL Server)</span>
                </h3>
                <form onSubmit={handleCreateVoucher} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-gray-600 block mb-1">Mã giảm giá *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: KIENGLA2026"
                      value={newVoucher.TenMaGiamGia}
                      onChange={(e) => setNewVoucher({ ...newVoucher, TenMaGiamGia: e.target.value.toUpperCase() })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 uppercase font-mono font-bold text-emerald-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-600 block mb-1">Tên chương trình</label>
                    <input
                      type="text"
                      placeholder="Ưu đãi mùa xuân..."
                      value={newVoucher.TenChuongTrinhGiamGia}
                      onChange={(e) => setNewVoucher({ ...newVoucher, TenChuongTrinhGiamGia: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-600 block mb-1">Loại giảm</label>
                    <select
                      value={newVoucher.LoaiGiamGia}
                      onChange={(e) => setNewVoucher({ ...newVoucher, LoaiGiamGia: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200"
                    >
                      <option value="PhanTram">Theo %</option>
                      <option value="SoTien">Số tiền (₫)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-gray-600 block mb-1">Giá trị giảm</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newVoucher.GiaTriGiam}
                      onChange={(e) => setNewVoucher({ ...newVoucher, GiaTriGiam: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-600 block mb-1">Đơn tối thiểu (₫)</label>
                    <input
                      type="number"
                      min="0"
                      value={newVoucher.ToiThieu}
                      onChange={(e) => setNewVoucher({ ...newVoucher, ToiThieu: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-[#004830] hover:bg-[#005e3e] text-white font-bold shadow-xs transition-all cursor-pointer"
                    >
                      + Thêm Mã GG
                    </button>
                  </div>
                </form>
              </div>

              {/* Danh sách mã giảm giá */}
              <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-gray-900">
                    Danh sách {vouchers.length} mã giảm giá trong CSDL (CHUONG_TRINH_GIAM_GIA)
                  </h3>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-gray-50/80 text-[11px] uppercase font-bold text-gray-700 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Mã Code</th>
                        <th className="py-3 px-4">Tên chương trình</th>
                        <th className="py-3 px-4">Mức giảm</th>
                        <th className="py-3 px-4">Đơn tối thiểu</th>
                        <th className="py-3 px-4">Đã dùng / Tổng</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {vouchers.map((v) => {
                        const vid = v.MaChuongTrinhGiamGia || v.MACHUONGTRINHGIAMGIA;
                        const code = v.TenMaGiamGia || v.TENMAGIAMGIA;
                        const title = v.TenChuongTrinhGiamGia || v.TENCHUONGTRINHGIAMGIA;
                        const loai = v.LoaiGiamGia || v.LOAIGIAMGIA;
                        const val = Number(v.GiaTriGiam || v.GIATRIGIAM || 0);
                        const minOrder = Number(v.ToiThieu || v.TOITHIEU || 0);
                        const totalQty = Number(v.SoLuongPhieu || v.SOLUONGPHIEU || 0);
                        const usedQty = Number(v.SoLuongDaDung || v.SOLUONGDADUNG || 0);
                        return (
                          <tr key={vid} className="hover:bg-emerald-50/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-gray-500">#{vid}</td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-mono font-extrabold">
                                {code}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-gray-900">{title}</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">
                              {loai === 'PhanTram' ? `${val}%` : `${val.toLocaleString('vi-VN')} ₫`}
                            </td>
                            <td className="py-3 px-4">{minOrder.toLocaleString('vi-VN')} ₫</td>
                            <td className="py-3 px-4 font-mono">
                              {usedQty} / {totalQty}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingVoucher({
                                      MaChuongTrinhGiamGia: vid,
                                      TenMaGiamGia: code || '',
                                      TenChuongTrinhGiamGia: title || '',
                                      LoaiGiamGia: loai || 'PhanTram',
                                      GiaTriGiam: val,
                                      ToiDa: Number(v.ToiDa ?? v.TOIDA ?? 0),
                                      ToiThieu: minOrder,
                                      SoLuongPhieu: totalQty,
                                      MoTa: v.MoTa || v.MOTA || ''
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition-colors"
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVoucher(vid, code)}
                                  className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] transition-colors"
                                >
                                  Xóa
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
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODAL: CHỈNH SỬA SẢN PHẨM */}
      {/* ======================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale max-h-[92vh] overflow-y-auto">
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
              {/* Quản lý Album nhiều ảnh & Chọn ảnh chính */}
              <MultiImageUpload
                label="Album hình ảnh chậu cây thực tế (Hỗ trợ nhiều góc máy):"
                images={(() => {
                  const rawSid = Number(editingProduct.MaLoaiCay || editingProduct.maloaicay || 1);
                  const sId = rawSid >= 1 && rawSid <= 90 ? rawSid : 1;
                  if (editingProduct.DanhSachAnh && editingProduct.DanhSachAnh.length > 0) {
                    return editingProduct.DanhSachAnh.map((img, i) => ({
                      url: img.url || img.UrlAnh || '',
                      isMain: Boolean(
                        img.isMain ||
                          img.LaAnhChinh ||
                          (i === 0 && !editingProduct.DanhSachAnh.some((x) => x.isMain || x.LaAnhChinh))
                      )
                    }));
                  }
                  const mainU = editingProduct.UrlAnh || editingProduct.urlanh || `/plants/${sId}.jpg`;
                  return [
                    { url: mainU, isMain: true },
                    { url: `/plants/angles/${sId}_closeup.jpg`, isMain: false },
                    { url: `/plants/angles/${sId}_side.jpg`, isMain: false },
                    { url: `/plants/angles/${sId}_detail.jpg`, isMain: false }
                  ];
                })()}
                onChange={(updated) => {
                  const mainOne = updated.find((i) => i.isMain)?.url || updated[0]?.url || '';
                  setEditingProduct({
                    ...editingProduct,
                    DanhSachAnh: updated,
                    UrlAnh: mainOne,
                    urlanh: mainOne
                  });
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
                    min="0"
                    value={editingProduct.SoLuongTonKho ?? editingProduct.soluongtonkho ?? 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        SoLuongTonKho: Number(e.target.value),
                        soluongtonkho: Number(e.target.value)
                      })
                    }
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale max-h-[92vh] overflow-y-auto">
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
                <label className="font-bold text-gray-700 block mb-1">
                  Chọn loài thực vật (1 – {botanicalSpecies.length || 90} loài sinh học chuẩn):
                </label>
                <select
                  value={newProduct.MaLoaiCay}
                  onChange={(e) => {
                    const mId = Number(e.target.value);
                    const found = botanicalSpecies.find((s) => (s.MALOAICAY || s.maloaicay) === mId);
                    setNewProduct({
                      ...newProduct,
                      MaLoaiCay: mId,
                      TenSanPham: found ? `${found.TENTHUONGGOI || found.tenthuonggoi} — chậu mới` : newProduct.TenSanPham
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:outline-emerald-600"
                >
                  {botanicalSpecies.map((sp) => {
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

              {/* Quản lý Album nhiều ảnh & Chọn ảnh chính (Kế thừa từ HTQLSX) */}
              <MultiImageUpload
                label="Album hình ảnh chậu cây thực tế (Hỗ trợ nhiều ảnh):"
                images={
                  newProduct.DanhSachAnh && newProduct.DanhSachAnh.length > 0
                    ? newProduct.DanhSachAnh
                    : (newProduct.UrlAnh ? [{ url: newProduct.UrlAnh, isMain: true }] : [{ url: `/plants/${newProduct.MaLoaiCay}.jpg`, isMain: true }])
                }
                onChange={(updated) => {
                  const mainOne = updated.find((i) => i.isMain)?.url || updated[0]?.url || '';
                  setNewProduct({
                    ...newProduct,
                    DanhSachAnh: updated,
                    UrlAnh: mainOne
                  });
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
      {/* MODAL: THÊM LOÀI THỰC VẬT MỚI VÀO CSDL (LOAI_CAY) */}
      {/* ======================================================== */}
      {isAddSpeciesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-scale max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700">potted_plant</span>
                  <span>Thêm loài thực vật học mới</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Loài mới sẽ tự động nhận mã #{botanicalSpecies.length + 1}. Quản lý kho chậu sẽ tự động cập nhật ngay.
                </p>
              </div>
              <button
                onClick={() => setIsAddSpeciesModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSpecies} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tên thường gọi (*):</label>
                  <input
                    type="text"
                    value={newSpecies.TenThuongGoi}
                    onChange={(e) => setNewSpecies({ ...newSpecies, TenThuongGoi: e.target.value })}
                    placeholder="Ví dụ: Trầu bà lá xẻ Nam Mỹ Albo..."
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-gray-900 focus:outline-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tên khoa học (*):</label>
                  <input
                    type="text"
                    value={newSpecies.TenKhoaHoc}
                    onChange={(e) => setNewSpecies({ ...newSpecies, TenKhoaHoc: e.target.value })}
                    placeholder="Ví dụ: Monstera deliciosa variegata"
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-semibold italic text-emerald-800 focus:outline-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Nhóm danh mục nhu cầu:</label>
                  <select
                    value={newSpecies.MaDanhMuc}
                    onChange={(e) => setNewSpecies({ ...newSpecies, MaDanhMuc: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:outline-emerald-600"
                  >
                    <option value={1}>1. Cây đột biến cẩm thạch (Variegated)</option>
                    <option value={2}>2. Cây để bàn &amp; Nội thất văn phòng</option>
                    <option value={3}>3. Cây lọc không khí &amp; Hấp thụ độc tố</option>
                    <option value={4}>4. Cây phong thủy &amp; Hút tài lộc</option>
                    <option value={5}>5. Cây dây leo bám tường</option>
                    <option value={6}>6. Cây thủy sinh &amp; Bán thủy sinh</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Giá tham khảo (VNĐ):</label>
                  <input
                    type="number"
                    value={newSpecies.GiaThamKhao}
                    onChange={(e) => setNewSpecies({ ...newSpecies, GiaThamKhao: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-emerald-800 focus:outline-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Xuất xứ tự nhiên &amp; phân bố:</label>
                <input
                  type="text"
                  value={newSpecies.XuatXu}
                  onChange={(e) => setNewSpecies({ ...newSpecies, XuatXu: e.target.value })}
                  placeholder="Ví dụ: Rừng mưa nhiệt đới Trung &amp; Nam Mỹ"
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Đặc điểm nhận dạng sinh học:</label>
                <textarea
                  value={newSpecies.DacDiemNhanDang}
                  onChange={(e) => setNewSpecies({ ...newSpecies, DacDiemNhanDang: e.target.value })}
                  rows={2}
                  placeholder="Mô tả hình thái phiến lá, viền lá, thân rễ..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Hướng dẫn chăm sóc &amp; ánh sáng:</label>
                <textarea
                  value={newSpecies.HuongDanChamSoc}
                  onChange={(e) => setNewSpecies({ ...newSpecies, HuongDanChamSoc: e.target.value })}
                  rows={2}
                  placeholder="Chế độ nước tưới, ánh sáng, độ ẩm..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-emerald-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddSpeciesModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#004830] hover:bg-[#005e3e] text-white font-bold shadow-md shadow-emerald-900/20 cursor-pointer"
                >
                  Xác nhận thêm loài cây
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

      {/* ======================================================== */}
      {/* MODAL: XEM CHI TIẾT ĐƠN HÀNG (GET /api/admin/don-hang/{id}/chi-tiet) */}
      {/* ======================================================== */}
      {orderDetailModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-scale max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700">receipt_long</span>
                <span>
                  Chi tiết đơn hàng{' '}
                  {orderDetailModal.data?.don_hang
                    ? `#DH-${
                        orderDetailModal.data.don_hang.MADONHANG ||
                        orderDetailModal.data.don_hang.MaDonHang ||
                        orderDetailModal.data.don_hang.madonhang
                      }`
                    : ''}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setOrderDetailModal({ open: false, loading: false, data: null, error: '' })}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {orderDetailModal.loading && (
              <div className="py-12 text-center text-xs text-gray-500 font-semibold flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-2xl animate-spin text-emerald-600">sync</span>
                <span>Đang tải chi tiết đơn hàng từ máy chủ...</span>
              </div>
            )}

            {!orderDetailModal.loading && orderDetailModal.error && (
              <div className="py-8 text-center text-xs text-rose-600 font-bold">
                ❌ {orderDetailModal.error}
              </div>
            )}

            {!orderDetailModal.loading && orderDetailModal.data && (() => {
              const dh = orderDetailModal.data.don_hang || {};
              const items = Array.isArray(orderDetailModal.data.chi_tiet) ? orderDetailModal.data.chi_tiet : [];
              const st = dh.TRANGTHAIDONHANG || dh.TrangThaiDonHang || dh.trangthaidonhang || 'Chờ xử lý';
              const payMethod = dh.PHUONGTHUCTHANHTOAN || dh.PhuongThucThanhToan || dh.phuongthucthanhtoan || 'COD';
              const payStatus = dh.TRANGTHAITHANHTOAN || dh.TrangThaiThanhToan || dh.trangthaithanhtoan || 'Chưa thanh toán';
              const tamTinh = Number(dh.TAMTINH ?? dh.TamTinh ?? dh.tamtinh ?? 0);
              const giamGia = Number(dh.SOTIENGIAM ?? dh.SoTienGiam ?? dh.sotiengiam ?? 0);
              const phiShip = Number(dh.PHIVANCHUYEN ?? dh.PhiVanChuyen ?? dh.phivanchuyen ?? 0);
              const tongTien = Number(dh.TONGTIEN ?? dh.TongTien ?? dh.tongtien ?? 0);
              const voucherCode = dh.TENMAGIAMGIA || dh.TenMaGiamGia || dh.tenmagiamgia || '';

              return (
                <div className="space-y-4 text-xs">
                  {/* Thông tin khách hàng & giao nhận */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase text-gray-400">Thông tin người nhận</div>
                      <div className="font-extrabold text-gray-900">
                        {dh.KHACHHANG || dh.KhachHang || dh.khachhang || 'Khách vãng lai'}
                      </div>
                      <div className="text-gray-700 font-semibold">
                        SĐT: {dh.SDTNHANHANG || dh.SdtNhanHang || dh.sdtnhanhang || '—'}
                      </div>
                      {(dh.EMAIL || dh.Email) && (
                        <div className="text-gray-500">Email: {dh.EMAIL || dh.Email}</div>
                      )}
                      <div className="text-gray-600">
                        Địa chỉ: {dh.DIACHINHANHANG || dh.DiaChiNhanHang || dh.diachinhanhang || '—'}
                      </div>
                    </div>

                    <div className="space-y-1 sm:text-right">
                      <div className="text-[10px] font-bold uppercase text-gray-400">Thanh toán &amp; Trạng thái</div>
                      <div>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            st === 'Đã hoàn thành'
                              ? 'bg-emerald-100 text-emerald-800'
                              : st === 'Đang giao hàng'
                              ? 'bg-blue-100 text-blue-800'
                              : st === 'Đã hủy'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {st}
                        </span>
                      </div>
                      <div className="font-bold text-gray-800">Phương thức: {payMethod}</div>
                      <div className="text-gray-500">Thanh toán: {payStatus}</div>
                      <div className="text-[11px] font-mono text-gray-400">
                        Ngày đặt: {String(dh.NGAYDATHANG || dh.NgayDatHang || dh.ngaydathang || '').slice(0, 19)}
                      </div>
                    </div>
                  </div>

                  {/* Danh sách sản phẩm trong đơn */}
                  <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="w-full text-left text-xs text-gray-700">
                      <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-600 border-b border-gray-200">
                        <tr>
                          <th className="py-2.5 px-3">Sản phẩm</th>
                          <th className="py-2.5 px-3 text-center">SL</th>
                          <th className="py-2.5 px-3 text-right">Đơn giá</th>
                          <th className="py-2.5 px-3 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.length > 0 ? (
                          items.map((it, idx) => {
                            const spId = it.MASANPHAM || it.MaSanPham || it.masanpham;
                            const sId = it.MALOAICAY || it.MaLoaiCay || it.maloaicay || spId || 1;
                            const spName = it.TENSANPHAM || it.TenSanPham || it.tensanpham || `Sản phẩm #${spId}`;
                            const qty = Number(it.SOLUONGMUA ?? it.SoLuongMua ?? it.soluongmua ?? 0);
                            const unitPrice = Number(it.DONGIAMUA ?? it.DonGiaMua ?? it.dongiamua ?? 0);
                            const lineTotal = Number(it.THANHTIEN ?? it.ThanhTien ?? it.thanhtien ?? qty * unitPrice);
                            const img = getPlantImage(sId, it.TENTHUONGGOI || spName, it.URLANH || it.UrlAnh);
                            return (
                              <tr key={it.MACHITIETDONHANG || idx}>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={img}
                                      alt={spName}
                                      className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-none"
                                      onError={(e) => handleImgError(e)}
                                    />
                                    <div>
                                      <div className="font-bold text-gray-900">{spName}</div>
                                      <div className="text-[10px] text-gray-400">
                                        {it.KICHTHUOCCAY || it.KichThuocCay || 'Tiêu chuẩn'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold">{qty}</td>
                                <td className="py-2.5 px-3 text-right">{unitPrice.toLocaleString('vi-VN')} ₫</td>
                                <td className="py-2.5 px-3 text-right font-extrabold text-[#012d1d]">
                                  {lineTotal.toLocaleString('vi-VN')} ₫
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-gray-400">
                              Không có dòng chi tiết sản phẩm nào
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Tổng kết tiền */}
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
                    <div className="flex justify-between text-gray-600">
                      <span>Tạm tính:</span>
                      <span className="font-bold">{(tamTinh || tongTien + giamGia - phiShip).toLocaleString('vi-VN')} ₫</span>
                    </div>
                    {giamGia > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Giảm giá {voucherCode ? `(${voucherCode})` : ''}:</span>
                        <span className="font-bold">-{giamGia.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>Phí vận chuyển:</span>
                      <span className="font-bold">{phiShip > 0 ? `${phiShip.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-[#012d1d] pt-2 border-t border-emerald-200/70">
                      <span>Tổng thanh toán:</span>
                      <span>{tongTien.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setOrderDetailModal({ open: false, loading: false, data: null, error: '' })}
                      className="px-4 py-2 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CHỈNH SỬA MÃ GIẢM GIÁ (PUT /api/admin/voucher/{id}) */}
      {/* ======================================================== */}
      {editingVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700">confirmation_number</span>
                <span>Chỉnh sửa mã giảm giá #{editingVoucher.MaChuongTrinhGiamGia}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingVoucher(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Mã giảm giá (*):</label>
                  <input
                    type="text"
                    required
                    value={editingVoucher.TenMaGiamGia}
                    onChange={(e) =>
                      setEditingVoucher({ ...editingVoucher, TenMaGiamGia: e.target.value.toUpperCase() })
                    }
                    className="w-full p-2.5 rounded-xl border border-gray-200 uppercase font-mono font-bold text-emerald-900 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Loại giảm giá:</label>
                  <select
                    value={editingVoucher.LoaiGiamGia}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, LoaiGiamGia: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:outline-emerald-600"
                  >
                    <option value="PhanTram">Theo phần trăm (%)</option>
                    <option value="SoTien">Số tiền cố định (₫)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Tên chương trình khuyến mãi:</label>
                <input
                  type="text"
                  value={editingVoucher.TenChuongTrinhGiamGia}
                  onChange={(e) =>
                    setEditingVoucher({ ...editingVoucher, TenChuongTrinhGiamGia: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Giá trị giảm:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingVoucher.GiaTriGiam}
                    onChange={(e) =>
                      setEditingVoucher({ ...editingVoucher, GiaTriGiam: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-emerald-800 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Giảm tối đa (₫):</label>
                  <input
                    type="number"
                    min="0"
                    value={editingVoucher.ToiDa}
                    onChange={(e) => setEditingVoucher({ ...editingVoucher, ToiDa: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Đơn tối thiểu:</label>
                  <input
                    type="number"
                    min="0"
                    value={editingVoucher.ToiThieu}
                    onChange={(e) =>
                      setEditingVoucher({ ...editingVoucher, ToiThieu: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Số lượng phiếu:</label>
                  <input
                    type="number"
                    min="1"
                    value={editingVoucher.SoLuongPhieu}
                    onChange={(e) =>
                      setEditingVoucher({ ...editingVoucher, SoLuongPhieu: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-gray-900 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Mô tả chi tiết:</label>
                <textarea
                  rows={2}
                  value={editingVoucher.MoTa}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, MoTa: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-emerald-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingVoucher(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#004830] hover:bg-[#005e3e] text-white font-bold shadow-sm"
                >
                  Lưu thay đổi Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
