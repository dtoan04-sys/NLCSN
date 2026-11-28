import React, { useRef, useState, useEffect } from 'react';
import { CATEGORIES, PRODUCTS, INITIAL_REVIEWS } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { getPlantImage, getPlantCategory, handleImgError } from '../utils/plantAssets';
import { apiFetch } from '../config';

export default function HomePage({ onOpenAiModal, onSelectProduct, onNavigate, onSelectCategory }) {
  const carouselRef = useRef(null);
  const { addToCart } = useCart();
  const [liveProducts, setLiveProducts] = useState(PRODUCTS);
  const [totalProducts, setTotalProducts] = useState(PRODUCTS.length);

  useEffect(() => {
    let mounted = true;
    apiFetch('/api/san-pham')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !Array.isArray(data) || data.length === 0) return;
        setTotalProducts(data.length);
        const mapped = data.slice(0, 8).map((sp, idx) => {
          const pId = sp.MaSanPham ?? sp.masanpham ?? sp.MASANPHAM ?? (idx + 1);
          const rawSid = sp.MaLoaiCay ?? sp.maloaicay ?? sp.MALOAICAY ?? pId;
          const sId = Number(rawSid) || pId;
          const validSid = sId >= 1 && sId <= 90 ? sId : 1;
          const tenThuongGoi = sp.TenThuongGoi || sp.tenthuonggoi || sp.TENTHUONGGOI || '';
          const tenKhoaHoc = sp.TenKhoaHoc || sp.tenkhoahoc || sp.TENKHOAHOC || '';
          const tenSanPham = sp.TenSanPham || sp.tensanpham || sp.TENSANPHAM || tenThuongGoi || `Chậu Kiểng Lá #${pId}`;
          const rawImgUrl = sp.UrlAnh || sp.urlanh || sp.URLANH || '';
          const giaBan = Number(sp.GiaBan ?? sp.giaban ?? sp.GIABAN ?? 150000);
          const tonKho = Number(sp.SoLuongTonKho ?? sp.soluongtonkho ?? sp.SOLUONGTONKHO ?? 0);
          const kichThuoc = sp.KichThuocCay || sp.kichthuoccay || sp.KICHTHUOCCAY || 'Cao 35-50cm, chậu gốm Ø18cm';
          const tinhTrang = sp.TinhTrangCay || sp.tinhtrangcay || sp.TINHTRANGCAY || 'Lá xanh mướt, rễ khỏe đã thuần khí hậu';
          const fallback = PRODUCTS.find((p) => p.speciesId === sId) || {};
          const cat = getPlantCategory(sId, `${tenThuongGoi} ${tenKhoaHoc} ${tenSanPham}`);
          const validImg = getPlantImage(sId, `${tenThuongGoi} ${tenKhoaHoc} ${tenSanPham}`, rawImgUrl);
          const speciesTitle = tenThuongGoi ? `${tenThuongGoi} (${tenKhoaHoc || 'Thực vật học'})` : fallback.speciesName || 'Kiểng lá';
          const defaultAngles = [
            validImg,
            `/plants/angles/${validSid}_closeup.jpg`,
            `/plants/angles/${validSid}_side.jpg`,
            `/plants/angles/${validSid}_detail.jpg`
          ];
          const dbGallery =
            Array.isArray(sp.DanhSachAnh) && sp.DanhSachAnh.length > 1
              ? sp.DanhSachAnh
                  .map((img) => getPlantImage(sId, `${tenThuongGoi} ${tenKhoaHoc} ${tenSanPham}`, img?.UrlAnh || img?.urlanh || img?.url || ''))
                  .filter(Boolean)
              : defaultAngles;

          return {
            id: pId,
            speciesId: sId,
            speciesName: speciesTitle,
            name: tenSanPham,
            category: cat,
            price: giaBan,
            originalPrice: null,
            stock: tonKho,
            size: kichThuoc,
            leafCondition: tinhTrang,
            healthStatus: fallback.healthStatus || 'Đã thuần dưỡng khí hậu, kháng sâu bệnh tốt',
            rating: fallback.rating || 4.9,
            reviewCount: fallback.reviewCount || (12 + (idx % 25)),
            image: validImg,
            gallery: dbGallery.length > 1 ? dbGallery : defaultAngles,
            desc: `Chậu cây ${tenSanPham} thuộc loài ${speciesTitle}. Tình trạng thực tế: ${tinhTrang}.`,
            tag: cat === 'dot-bien' ? 'Đột biến / Quý hiếm' : cat === 'loc-khong-khi' ? 'Lọc khí sạch' : cat === 'phong-thuy' ? 'Hút tài lộc' : 'Bán chạy'
          };
        });
        setLiveProducts(mapped);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const featuredProducts = liveProducts.slice(0, 4);
  const heroBanners = [
    {
      id: 'b1',
      speciesId: liveProducts[0]?.speciesId,
      badge: 'Cá Thể Tinh Hoa #MB-9902',
      tag: 'Đột Biến Cẩm Thạch',
      title: liveProducts[0]?.name || 'Monstera Deliciosa Albo',
      subtitle: 'Lá cẩm thạch trắng tuyết • Hợp mệnh Thủy - Kim',
      image: liveProducts[0]?.image,
      ctaLabel: 'Xem chậu',
      onAction: () => onSelectProduct(liveProducts[0])
    },
    {
      id: 'b2',
      speciesId: liveProducts[1]?.speciesId || liveProducts[0]?.speciesId,
      badge: 'AI Vision • 90 Loài Kiểng Lá',
      tag: 'Chẩn Đoán & Tách Đa Cây',
      title: 'Quét Camera Nhận Diện Ngay',
      subtitle: 'Chụp 1 hoặc nhiều chậu cây cùng lúc, gợi ý chăm sóc chuẩn',
      image: liveProducts[1]?.image || liveProducts[0]?.image,
      ctaLabel: 'Quét AI ngay',
      onAction: onOpenAiModal
    },
    {
      id: 'b3',
      speciesId: liveProducts[2]?.speciesId || liveProducts[0]?.speciesId,
      badge: 'Bộ Sưu Tập Thanh Lọc Khí',
      tag: 'Bán Chạy Nhất Tuần',
      title: liveProducts[2]?.name || 'Lưỡi Hổ & Trầu Bà Phong Thủy',
      subtitle: 'Dễ chăm trong nhà, văn phòng • Lọc bụi mịn & sinh khí',
      image: liveProducts[2]?.image || liveProducts[0]?.image,
      ctaLabel: 'Xem chậu',
      onAction: () => onSelectProduct(liveProducts[2] || liveProducts[0])
    },
    {
      id: 'b4',
      speciesId: liveProducts[3]?.speciesId || liveProducts[0]?.speciesId,
      badge: 'Ưu Đãi Vườn Kiểng Lá',
      tag: 'Giao Nhanh Nội Ô',
      title: liveProducts[3]?.name || 'Vườn Kiểng Lá Nhiệt Đới',
      subtitle: 'Đóng gói chống sốc • Bảo hành cây khỏe 7 ngày',
      image: liveProducts[3]?.image || liveProducts[0]?.image,
      ctaLabel: 'Khám phá',
      onAction: () => onNavigate('products')
    }
  ];

  const [bannerIndex, setBannerIndex] = useState(0);
  const [bannerPaused, setBannerPaused] = useState(false);

  useEffect(() => {
    if (bannerPaused) return;
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [bannerPaused, heroBanners.length]);

  const activeBanner = heroBanners[bannerIndex] || heroBanners[0];

  return (
    <div className="flex flex-col w-full bg-[#fafaf7] text-[#132a1e]">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Botanical Emerald & Warm Cream) */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-gradient-to-b from-[#eef5ef] via-[#fafaf7] to-[#fafaf7] py-14 md:py-22 border-b border-emerald-900/10 overflow-hidden">
        {/* Ánh sáng tự nhiên dịu nhẹ */}
        <div className="absolute -top-16 right-0 w-[28rem] h-[28rem] bg-gradient-to-bl from-emerald-200/35 via-teal-100/25 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 -left-12 w-80 h-80 bg-gradient-to-tr from-[#064e3b]/10 via-emerald-100/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col items-start space-y-5">
              <div className="badge badge-lg h-auto py-1.5 px-3.5 gap-1.5 rounded-full bg-emerald-900/8 text-[#064e3b] border border-emerald-800/15 text-xs font-bold uppercase tracking-wider shadow-2xs">
                <span className="material-symbols-outlined text-sm text-[#059669]">eco</span>
                <span>Thủy Sinh Khí • Cây Phong Thủy &amp; AI Thực Vật</span>
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-[3.4rem] text-[#132a1e] font-extrabold tracking-tight leading-[1.14]">
                Tuyệt Tác Kiểng Lá{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#064e3b] via-[#059669] to-teal-700">
                  Thanh Lọc Sinh Khí
                </span>{' '}
                &amp; AI Giám Định
              </h1>

              <p className="text-sm md:text-base text-[#132a1e]/75 max-w-2xl leading-relaxed">
                Tập hợp các loài cây kiểng lá nhiệt đới, cây thủy sinh vượng tài lộc, thanh lọc không gian sống. Hệ thống kết hợp mô hình AI 90 loài chẩn đoán nhanh, gợi ý cây hợp mệnh chuẩn phong thủy ngũ hành.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('products')}
                  className="btn btn-primary h-auto min-h-0 px-7 py-3.5 rounded-2xl text-sm font-bold shadow-md shadow-emerald-950/15 hover:shadow-lg transition-all gap-2"
                >
                  <span>Khám phá bộ sưu tập cây</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenAiModal}
                  className="btn h-auto min-h-0 px-6 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-[#064e3b] border border-emerald-900/15 hover:border-emerald-800/30 font-bold text-sm shadow-xs transition-all gap-2"
                >
                  <span className="material-symbols-outlined text-lg text-[#059669]">photo_camera</span>
                  <span>Quét cây bằng AI Vision</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div
                onMouseEnter={() => setBannerPaused(true)}
                onMouseLeave={() => setBannerPaused(false)}
                className="card bg-white rounded-3xl shadow-xl overflow-hidden p-3 max-w-md mx-auto border border-emerald-900/10 group"
              >
                {/* Khung chạy slide banner kiểu TMĐT (Bách Hóa Xanh / TGDD) */}
                <div className="relative h-56 sm:h-64 rounded-2xl overflow-hidden bg-[#f3f2ec]">
                  <div
                    className="flex h-full w-full transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
                  >
                    {heroBanners.map((slide) => (
                      <div
                        key={slide.id}
                        onClick={slide.onAction}
                        className="relative w-full h-full shrink-0 cursor-pointer"
                      >
                        <img
                          alt={slide.title}
                          className="w-full h-full object-cover"
                          src={slide.image}
                          onError={(e) => handleImgError(e, getPlantImage(slide.speciesId, slide.title))}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none"></div>
                        <span className="badge absolute top-3 left-3 h-auto py-1 px-3 bg-[#064e3b]/85 backdrop-blur-md text-[#fafaf7] rounded-full text-xs font-semibold border border-white/15">
                          {slide.badge}
                        </span>
                        <span className="badge absolute bottom-3 right-3 h-auto py-1 px-2.5 bg-[#059669] text-white border-0 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          {slide.tag}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Nút Prev / Next */}
                  <button
                    type="button"
                    aria-label="Banner trước"
                    onClick={() => setBannerIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#064e3b] shadow-md flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Banner tiếp theo"
                    onClick={() => setBannerIndex((prev) => (prev + 1) % heroBanners.length)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#064e3b] shadow-md flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>

                  {/* Dots chỉ báo slide */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/35 backdrop-blur-xs px-2 py-1 rounded-full">
                    {heroBanners.map((slide, idx) => (
                      <button
                        key={slide.id}
                        type="button"
                        aria-label={`Chọn banner ${idx + 1}`}
                        onClick={() => setBannerIndex(idx)}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === bannerIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Thông tin slide hiện tại */}
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-[#132a1e] uppercase truncate">{activeBanner.title}</h3>
                    <p className="text-xs text-[#059669] font-medium truncate">{activeBanner.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={activeBanner.onAction}
                    className="btn btn-primary btn-sm h-9 px-4 rounded-xl text-xs font-bold shrink-0"
                  >
                    {activeBanner.ctaLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DANH MỤC CHI THỰC VẬT */}
      {/* ========================================================================= */}
      <section className="w-full py-14 bg-[#fafaf7]" id="danh-muc">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold text-[#059669] uppercase tracking-widest block mb-1">
                Hệ Thực Vật Học Nhiệt Đới &amp; Phong Thủy
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#132a1e]">
                Danh Mục Cây Theo Nhu Cầu &amp; Không Gian
              </h2>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => carouselRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                className="btn btn-square btn-sm w-10 h-10 rounded-2xl bg-white hover:bg-emerald-50 text-[#064e3b] border border-emerald-900/15 shadow-2xs"
                aria-label="Cuộn sang trái"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={() => carouselRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                className="btn btn-square btn-sm w-10 h-10 rounded-2xl bg-white hover:bg-emerald-50 text-[#064e3b] border border-emerald-900/15 shadow-2xs"
                aria-label="Cuộn sang phải"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>

          <div ref={carouselRef} className="flex gap-4 overflow-x-auto pb-4 scroll-smooth no-scrollbar">
            {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  onNavigate('products');
                }}
                className="card flex-none w-72 bg-white p-5 rounded-3xl border border-emerald-900/10 hover:border-[#059669] shadow-sm hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-gradient-to-tr group-hover:from-[#064e3b] group-hover:to-[#059669] text-[#064e3b] group-hover:text-white flex items-center justify-center transition-colors mb-4 border border-emerald-900/10">
                  <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                </div>
                <h4 className="font-extrabold text-[#132a1e] text-base group-hover:text-[#064e3b] transition-colors">
                  {cat.name}
                </h4>
                <p className="text-xs text-[#132a1e]/60 mt-1 line-clamp-2 leading-relaxed">{cat.desc}</p>
                <div className="mt-4 flex items-center text-xs font-bold text-[#059669] group-hover:translate-x-1 transition-transform">
                  <span>Khám phá danh mục</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. LƯỚI SẢN PHẨM NỔI BẬT */}
      {/* ========================================================================= */}
      <section className="w-full py-14 bg-[#f3f2ec]/70 border-t border-b border-emerald-900/10">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold text-[#059669] uppercase tracking-widest block mb-1">
                Cập Nhật Trực Tiếp Tại Vườn Ươm
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#132a1e]">
                Mẫu Phẩm Kiểng Lá Mới Về Hôm Nay
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="btn btn-ghost btn-sm text-xs font-bold text-[#064e3b] hover:bg-emerald-900/8 rounded-xl gap-1 shrink-0"
            >
              <span>Xem tất cả ({totalProducts} chậu)</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <div
                key={p.id}
                className="card group flex flex-col bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden border border-emerald-900/10 hover:border-[#059669]/50"
              >
                <div
                  className="relative h-48 sm:h-52 bg-[#f3f2ec] overflow-hidden cursor-pointer"
                  onClick={() => onSelectProduct(p)}
                >
                  <img
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={p.image}
                    onError={(e) => handleImgError(e, getPlantImage(p.speciesId, p.speciesName))}
                  />
                  <span className="badge absolute top-3 left-3 h-auto py-1 px-2.5 bg-white/90 backdrop-blur-sm text-[#064e3b] border border-emerald-900/15 text-[11px] font-bold rounded-lg shadow-2xs">
                    {p.tag}
                  </span>
                </div>

                <div className="card-body p-4 flex flex-col flex-1 justify-between gap-0">
                  <div>
                    <span className="text-[10px] font-bold text-[#059669] uppercase block">{p.speciesName}</span>
                    <h3
                      onClick={() => onSelectProduct(p)}
                      className="font-bold text-[#132a1e] text-sm leading-snug mt-1 cursor-pointer group-hover:text-[#064e3b] transition-colors line-clamp-1"
                    >
                      {p.name}
                    </h3>
                    <p className="text-xs text-[#132a1e]/50 mt-1 line-clamp-1">{p.size}</p>
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-emerald-900/8 mt-4">
                    <div>
                      <span className="font-black text-base text-[#064e3b]">
                        {p.price.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => addToCart(p, 1)}
                        className="btn btn-square btn-sm w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border border-emerald-900/15"
                        title="Thêm vào giỏ hàng"
                      >
                        <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectProduct(p)}
                        className="btn btn-primary btn-sm h-9 px-3.5 rounded-xl text-xs font-bold"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BANNER GIỚI THIỆU AI VISION (Deep Botanical Forest & Glassmorphism) */}
      {/* ========================================================================= */}
      <section className="w-full py-16 bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#0b3f31] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_55%)] pointer-events-none"></div>
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          <div className="lg:col-span-6 space-y-4">
            <span className="badge h-auto px-3.5 py-1.5 rounded-full bg-emerald-400/15 text-emerald-200 text-xs font-bold uppercase tracking-wider border border-emerald-400/30">
              AI Deep Learning Core
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Nhận Diện Cây Bằng Hình Ảnh Ngay Trên Thiết Bị
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Bạn thấy một cây kiểng lá đẹp nhưng chưa biết loài hay tính năng phong thủy? Chụp ảnh hoặc tải lên, mô hình AI 90 loài sẽ nhận dạng trong 0.5s và cung cấp toàn bộ hướng dẫn chăm sóc chuẩn khoa học.
            </p>
            <div className="flex flex-wrap gap-3 pt-3">
              <button
                type="button"
                onClick={onOpenAiModal}
                className="btn h-auto min-h-0 bg-emerald-400 hover:bg-emerald-300 text-[#022c22] border-0 px-7 py-3.5 rounded-2xl font-extrabold text-sm shadow-xl transition-all gap-2"
              >
                <span className="material-symbols-outlined text-lg text-[#022c22]">photo_camera</span>
                <span>Quét ảnh lá cây ngay</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('wiki')}
                className="btn h-auto min-h-0 bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-2xl font-bold text-sm transition-all border border-white/20 gap-2"
              >
                <span className="material-symbols-outlined text-lg">menu_book</span>
                <span>Tra cứu thư viện 90 loài</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <div className="card p-6 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-md max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/15 text-xs text-emerald-100/80">
                <span className="font-bold text-emerald-300">Kiến trúc AI Vision</span>
                <span>MobileNetV2 (v2.0-TuSo0)</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/10 flex items-center justify-between">
                  <span>Cơ chế suy luận triển khai:</span>
                  <span className="font-mono text-emerald-300 font-bold">8-Crop ROI TTA + OOD #91</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/10 flex items-center justify-between">
                  <span>Định dạng đầu vào:</span>
                  <span className="font-mono text-emerald-300 font-bold">224 x 224 x 3 RGB</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/10 flex items-center justify-between">
                  <span>Chuẩn hóa CSDL:</span>
                  <span className="font-mono text-emerald-300 font-bold">Chuẩn 1NF Top-K Results</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ĐÁNH GIÁ KHÁCH HÀNG */}
      {/* ========================================================================= */}
      <section className="w-full py-14 bg-[#fafaf7]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#059669] uppercase tracking-widest block mb-1">
              Phản Hồi Thực Tế Từ Khách Hàng
            </span>
            <h2 className="text-2xl font-extrabold text-[#132a1e]">Khách Hàng Nói Gì Về Cây Của Vườn</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {INITIAL_REVIEWS.map((rev) => (
              <div
                key={rev.id}
                className="card p-6 rounded-3xl bg-white border border-emerald-900/10 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-2">
                    {[...Array(rev.rating)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-base">star</span>
                    ))}
                  </div>
                  <p className="text-xs text-[#132a1e]/80 leading-relaxed italic">"{rev.comment}"</p>
                </div>
                <div className="mt-4 pt-4 border-t border-emerald-900/10 flex items-center justify-between text-xs">
                  <span className="font-bold text-[#132a1e]">{rev.userName}</span>
                  <span className="text-[#132a1e]/45">{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
