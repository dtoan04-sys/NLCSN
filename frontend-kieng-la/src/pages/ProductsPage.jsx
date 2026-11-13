import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES, PRODUCTS } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { getPlantImage, getPlantCategory, handleImgError } from '../utils/plantAssets';
import { apiFetch } from '../config';

export default function ProductsPage({
  onSelectProduct,
  activeCategory = 'all',
  activeSpeciesFilter = null,
  onClearSpeciesFilter,
  searchKeyword = '',
  onSearchChange
}) {
  const [selectedCategory, setSelectedCategory] = useState(activeCategory);
  const [searchQuery, setSearchQuery] = useState(searchKeyword);
  const [sortOption, setSortOption] = useState('default'); // default | price-asc | price-desc
  const [products, setProducts] = useState(PRODUCTS);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    setSelectedCategory(activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    if (searchKeyword !== undefined) {
      setSearchQuery(searchKeyword);
    }
  }, [searchKeyword]);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveProducts = async () => {
      try {
        const res = await apiFetch('/api/san-pham');
        if (!res.ok) throw new Error('Failed to fetch live products');
        const data = await res.json();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((sp, idx) => {
            const pId = sp.MaSanPham ?? sp.masanpham ?? sp.MASANPHAM ?? (idx + 1);
            const sId = sp.MaLoaiCay ?? sp.maloaicay ?? sp.MALOAICAY ?? pId;
            const tenThuongGoi = sp.TenThuongGoi || sp.tenthuonggoi || sp.TENTHUONGGOI || '';
            const tenKhoaHoc = sp.TenKhoaHoc || sp.tenkhoahoc || sp.TENKHOAHOC || '';
            const tenSanPham = sp.TenSanPham || sp.tensanpham || sp.TENSANPHAM || tenThuongGoi || `Chậu Kiểng Lá #${pId}`;
            const rawImgUrl = sp.UrlAnh || sp.urlanh || sp.URLANH || `/plants/${sId}.jpg`;
            const giaBan = Number(sp.GiaBan ?? sp.giaban ?? sp.GIABAN ?? 150000);
            const tonKho = sp.SoLuongTonKho ?? sp.soluongtonkho ?? sp.SOLUONGTONKHO ?? 8;
            const kichThuoc = sp.KichThuocCay || sp.kichthuoccay || sp.KICHTHUOCCAY || 'Cao 35-50cm, chậu gốm Ø18cm';
            const tinhTrang = sp.TinhTrangCay || sp.tinhtrangcay || sp.TINHTRANGCAY || 'Lá xanh mướt, rễ khỏe đã thuần khí hậu';

            const fallback = PRODUCTS.find((p) => p.id === pId) || PRODUCTS[idx % PRODUCTS.length] || {};
            const speciesTitle = tenThuongGoi
              ? `${tenThuongGoi} (${tenKhoaHoc || 'Thực vật học'})`
              : fallback.speciesName || 'Kiểng lá';
            const cat = getPlantCategory(sId, `${tenThuongGoi} ${tenKhoaHoc} ${tenSanPham}`);
            const validImg = getPlantImage(sId, `${tenThuongGoi} ${tenKhoaHoc} ${tenSanPham}`, rawImgUrl);

            return {
              ...fallback,
              id: pId,
              speciesId: sId,
              speciesName: speciesTitle,
              name: tenSanPham,
              category: cat,
              price: giaBan,
              originalPrice: Math.round(giaBan * 1.18),
              stock: tonKho,
              size: kichThuoc,
              leafCondition: tinhTrang,
              healthStatus: fallback.healthStatus || 'Đã thuần dưỡng khí hậu, kháng sâu bệnh tốt',
              tag: cat === 'dot-bien' ? 'Đột biến / Quý hiếm' : cat === 'loc-khong-khi' ? 'Lọc khí sạch' : cat === 'phong-thuy' ? 'Hút tài lộc' : 'Bán chạy',
              isHot: idx < 8,
              rating: fallback.rating || 4.9,
              reviewCount: fallback.reviewCount || (12 + (idx % 25)),
              image: validImg,
              gallery: (sp.DanhSachAnh && sp.DanhSachAnh.length > 0)
                ? sp.DanhSachAnh.map(img => img.UrlAnh || img.urlanh || img.url)
                : [validImg],
              desc: `Chậu cây ${tenSanPham} thuộc loài ${speciesTitle} (#${sId} trong CSDL). Tình trạng thực tế: ${tinhTrang}.`
            };
          });
          setProducts(mapped);
          setIsLiveDb(true);
        }
      } catch (err) {
        console.log('Dùng dữ liệu chậu cây mẫu cục bộ (Backend offline):', err.message);
      }
    };

    fetchLiveProducts();
    return () => { isMounted = false; };
  }, []);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Lọc theo loài nếu đến từ kết quả AI Vision
    if (activeSpeciesFilter) {
      list = list.filter((p) =>
        p.speciesName.toLowerCase().includes(activeSpeciesFilter.toLowerCase()) ||
        p.name.toLowerCase().includes(activeSpeciesFilter.toLowerCase())
      );
    }

    // Lọc theo danh mục CDM DANH_MUC
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.speciesName.toLowerCase().includes(q) ||
          p.tag.toLowerCase().includes(q)
      );
    }

    // Sắp xếp
    if (sortOption === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, selectedCategory, searchQuery, sortOption, activeSpeciesFilter]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-16 py-10 space-y-8">
      {/* Tiêu đề & Thông báo lọc loài từ AI nếu có */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                Thương mại &amp; Vườn Ươm (CDM: SAN_PHAM)
              </span>
              {isLiveDb ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  SQL Server Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium">
                  Dữ liệu mẫu
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#012d1d] tracking-tight">
              Danh Mục Chậu Cây Đang Sẵn Hàng
            </h1>
          </div>
          <span className="text-xs text-gray-500 font-semibold">
            Hiển thị <span className="text-emerald-800 font-bold">{filteredProducts.length}</span> chậu cây
          </span>
        </div>

        {activeSpeciesFilter && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-800 text-lg">psychology</span>
              <span>
                Đang lọc các chậu cây thuộc loài bạn vừa quét AI:{' '}
                <strong className="text-emerald-950 font-bold">{activeSpeciesFilter}</strong>
              </span>
            </div>
            <button
              onClick={onClearSpeciesFilter}
              className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg font-bold text-emerald-900 hover:bg-emerald-100 transition-colors"
            >
              Xem tất cả loài
            </button>
          </div>
        )}
      </div>

      {/* Thanh công cụ: Tìm kiếm & Lọc danh mục & Sắp xếp */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white p-4 rounded-3xl border border-emerald-100/80 shadow-xs">
        {/* Tìm kiếm */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-3 text-emerald-600 text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên cây, Monstera, Albo, Lưỡi Hổ..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-emerald-500/60 focus:border-emerald-600 focus:outline-none text-xs font-medium text-gray-800 transition-all"
          />
        </div>

        {/* Danh mục pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scroll-smooth">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white shadow-xs'
                  : 'bg-emerald-50/60 text-emerald-900 hover:bg-emerald-100/80 border border-emerald-100/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sắp xếp */}
        <div className="flex-none">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl border border-emerald-200 text-xs font-semibold text-emerald-900 bg-white focus:outline-emerald-600"
          >
            <option value="default">Sắp xếp: Mặc định</option>
            <option value="price-asc">Giá: Thấp đến cao</option>
            <option value="price-desc">Giá: Cao đến thấp</option>
          </select>
        </div>
      </div>

      {/* Lưới sản phẩm */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-dashed border-gray-200 p-8">
          <span className="material-symbols-outlined text-6xl text-emerald-800/40">potted_plant</span>
          <div>
            <p className="font-bold text-gray-800 text-lg">Chưa tìm thấy chậu cây khớp bộ lọc</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              {activeSpeciesFilter
                ? `Loài "${activeSpeciesFilter}" tạm thời chưa có chậu sẵn tại vườn.`
                : 'Thử tìm với từ khóa khác hoặc bấm nút "Tất cả cây" để khám phá.'}
            </p>
          </div>
          <button
            onClick={() => {
              if (onClearSpeciesFilter) onClearSpeciesFilter();
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-5 py-2.5 rounded-xl bg-[#012d1d] text-white text-xs font-bold hover:bg-[#1b4332] transition-all shadow-sm"
          >
            Xem lại tất cả 90 chậu cây
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Lưới sản phẩm chính */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelectProduct={onSelectProduct}
                onAddToCart={addToCart}
              />
            ))}
          </div>

          {/* Gợi ý thêm khi đang lọc theo loài từ AI mà có ít hơn 4 sản phẩm */}
          {activeSpeciesFilter && filteredProducts.length < 4 && (
            <div className="pt-8 border-t border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700">recommend</span>
                    <span>Gợi ý thêm các mẫu kiểng lá được ưa chuộng khác</span>
                  </h3>
                  <p className="text-xs text-gray-500">Các loài cây sinh trưởng tốt, cùng phong cách nhiệt đới</p>
                </div>
                <button
                  onClick={onClearSpeciesFilter}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1"
                >
                  <span>Xem tất cả ({products.length} chậu)</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products
                  .filter((p) => !filteredProducts.some((fp) => fp.id === p.id))
                  .slice(0, 4)
                  .map((p) => (
                    <ProductCard
                      key={`sug-${p.id}`}
                      product={p}
                      onSelectProduct={onSelectProduct}
                      onAddToCart={addToCart}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product: p, onSelectProduct, onAddToCart }) {
  return (
    <div className="group flex flex-col bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden border border-emerald-100/80 hover:border-emerald-300">
      <div
        className="relative aspect-[4/5] bg-emerald-50/50 overflow-hidden cursor-pointer"
        onClick={() => onSelectProduct(p)}
      >
        <img
          alt={p.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={p.image}
          onError={(e) => handleImgError(e, getPlantImage(p.speciesId, p.speciesName))}
        />
        <span className="absolute top-3 left-3 bg-emerald-100 text-emerald-900 border border-emerald-200/90 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs">
          {p.tag}
        </span>
        {p.stock <= 3 && (
          <span className="absolute bottom-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
            Chỉ còn {p.stock} chậu
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <span className="text-[10px] font-bold text-emerald-700 uppercase block line-clamp-1">
            {p.speciesName}
          </span>
          <h3
            onClick={() => onSelectProduct(p)}
            className="font-bold text-gray-900 text-sm leading-snug mt-1 cursor-pointer group-hover:text-emerald-900 transition-colors line-clamp-2"
          >
            {p.name}
          </h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.size}</p>
        </div>

        <div className="pt-3 flex items-center justify-between border-t border-emerald-50 mt-4">
          <div>
            <span className="font-black text-base text-emerald-950">
              {p.price.toLocaleString('vi-VN')} ₫
            </span>
            {p.originalPrice && (
              <span className="text-[11px] text-gray-400 line-through block">
                {p.originalPrice.toLocaleString('vi-VN')} ₫
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => onAddToCart(p, 1)}
              className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors border border-emerald-200/60 cursor-pointer"
              title="Thêm vào giỏ hàng"
            >
              <span className="material-symbols-outlined text-base">add_shopping_cart</span>
            </button>
            <button
              onClick={() => onSelectProduct(p)}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white transition-colors cursor-pointer shadow-2xs"
            >
              Chi tiết
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
