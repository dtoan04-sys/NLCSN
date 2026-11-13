import React, { useRef } from 'react';
import { CATEGORIES, PRODUCTS, INITIAL_REVIEWS } from '../data/mockData';
import { useCart } from '../context/CartContext';

export default function HomePage({ onOpenAiModal, onSelectProduct, onNavigate, onSelectCategory }) {
  const carouselRef = useRef(null);
  const { addToCart } = useCart();

  const featuredProducts = PRODUCTS.slice(0, 4);

  return (
    <div className="flex flex-col w-full bg-white">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Phong thủy Mệnh Thủy - Tuyền Trung Thủy: Sóng biển Sapphire & Trắng sứ) */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-gradient-to-b from-sky-50/70 via-cyan-50/30 to-white py-14 md:py-24 border-b border-sky-100 overflow-hidden">
        {/* Vệt ánh sáng nước lung linh */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-200/40 via-cyan-100/30 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-100/30 via-indigo-50/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 flex flex-col items-start space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-100/80 text-sky-900 text-xs font-bold uppercase tracking-wider border border-sky-200 shadow-2xs">
                <span className="material-symbols-outlined text-sm text-sky-600">water_drop</span>
                <span>Thủy Sinh Khí • Cây Phong Thủy &amp; AI Thực Vật</span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl text-slate-900 font-extrabold tracking-tight leading-tight">
                Tuyệt Tác Kiểng Lá <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800">Thanh Lọc Sinh Khí</span> &amp; AI Giám Định
              </h1>
              <p className="text-sm md:text-base text-slate-600 max-w-2xl leading-relaxed">
                Tập hợp các loài cây kiểng lá nhiệt đới, cây thủy sinh vượng tài lộc, thanh lọc không gian sống. Hệ thống kết hợp mô hình AI 90 loài chẩn đoán nhanh, gợi ý cây hợp mệnh chuẩn phong thủy ngũ hành.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => onNavigate('products')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 hover:from-sky-700 hover:to-indigo-900 text-white px-7 py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-sky-600/25 hover:shadow-lg transition-all cursor-pointer"
                >
                  <span>Khám phá bộ sưu tập cây</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenAiModal}
                  className="inline-flex items-center gap-2 bg-white hover:bg-sky-50 text-blue-900 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-sm border border-sky-200 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg text-sky-600">photo_camera</span>
                  <span>Quét cây bằng AI Vision</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden p-3 max-w-md mx-auto border border-sky-100">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-sky-50/50">
                  <img
                    alt="Monstera Albo Specimen"
                    className="w-full h-full object-cover"
                    src={PRODUCTS[0].image}
                  />
                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold border border-white/20">
                    Cá Thể Tinh Hoa #MB-9902
                  </span>
                  <span className="absolute bottom-3 right-3 bg-gradient-to-r from-sky-600 to-blue-700 text-white px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    Đột Biến Cẩm Thạch
                  </span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase">{PRODUCTS[0].name}</h3>
                    <p className="text-xs text-sky-700 font-medium">Lá cẩm thạch trắng tuyết • Hợp mệnh Thủy - Kim</p>
                  </div>
                  <button
                    onClick={() => onSelectProduct(PRODUCTS[0])}
                    className="text-xs bg-gradient-to-r from-sky-600 to-blue-700 text-white px-4 py-2 rounded-xl font-bold hover:from-sky-700 hover:to-blue-800 transition-colors shadow-2xs"
                  >
                    Xem chậu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DANH MỤC CHI THỰC VẬT (Thẻ Trắng Viền Xanh Biển) */}
      {/* ========================================================================= */}
      <section className="w-full py-14 bg-white" id="danh-muc">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-sky-600 uppercase tracking-widest block mb-1">
                Hệ Thực Vật Học Nhiệt Đới &amp; Phong Thủy
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                Danh Mục Cây Theo Nhu Cầu &amp; Không Gian
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => carouselRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                className="w-10 h-10 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button
                onClick={() => carouselRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                className="w-10 h-10 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>

          <div ref={carouselRef} className="flex gap-4 overflow-x-auto pb-4 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  onNavigate('products');
                }}
                className="flex-none w-72 bg-white p-5 rounded-3xl border border-sky-100/90 hover:border-sky-400 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-50 group-hover:bg-gradient-to-tr group-hover:from-sky-600 group-hover:to-blue-700 text-sky-700 group-hover:text-white flex items-center justify-center transition-colors mb-4 border border-sky-100">
                  <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                  {cat.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{cat.desc}</p>
                <div className="mt-4 flex items-center text-xs font-bold text-sky-600 group-hover:translate-x-1 transition-transform">
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
      <section className="w-full py-14 bg-sky-50/40 border-t border-b border-sky-100">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-sky-600 uppercase tracking-widest block mb-1">
                Cập Nhật Trực Tiếp Tại Vườn Ươm
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                Mẫu Phẩm Kiểng Lá Mới Về Hôm Nay
              </h2>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-bold text-sky-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả ({PRODUCTS.length} chậu)</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <div
                key={p.id}
                className="group flex flex-col bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden border border-sky-100 hover:border-sky-300"
              >
                <div
                  className="relative aspect-[4/5] bg-sky-50/50 overflow-hidden cursor-pointer"
                  onClick={() => onSelectProduct(p)}
                >
                  <img
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={p.image}
                  />
                  <span className="absolute top-3 left-3 bg-sky-100 text-sky-900 border border-sky-200 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                    {p.tag}
                  </span>
                </div>

                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-sky-600 uppercase block">{p.speciesName}</span>
                    <h3
                      onClick={() => onSelectProduct(p)}
                      className="font-bold text-slate-900 text-sm leading-snug mt-1 cursor-pointer group-hover:text-blue-700 transition-colors line-clamp-1"
                    >
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{p.size}</p>
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-sky-50 mt-4">
                    <div>
                      <span className="font-black text-base text-slate-900">
                        {p.price.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => addToCart(p, 1)}
                        className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors cursor-pointer border border-sky-200"
                        title="Thêm vào giỏ hàng"
                      >
                        <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                      </button>
                      <button
                        onClick={() => onSelectProduct(p)}
                        className="text-xs font-bold px-3 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white transition-colors cursor-pointer shadow-2xs"
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
      {/* 4. BANNER GIỚI THIỆU AI VISION (Ocean Deep Blue & Glassmorphism) */}
      {/* ========================================================================= */}
      <section className="w-full py-16 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.25),transparent_50%)] pointer-events-none"></div>
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          <div className="lg:col-span-6 space-y-4">
            <span className="px-3.5 py-1.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold uppercase tracking-wider border border-sky-400/30">
              AI Deep Learning Core
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Nhận Diện Cây Bằng Hình Ảnh Ngay Trên Thiết Bị
            </h2>
            <p className="text-xs sm:text-sm text-sky-100/80 leading-relaxed">
              Bạn thấy một cây kiểng lá đẹp nhưng chưa biết loài hay tính năng phong thủy? Chụp ảnh hoặc tải lên, mô hình AI 90 loài sẽ nhận dạng trong 0.5s và cung cấp toàn bộ hướng dẫn chăm sóc chuẩn khoa học.
            </p>
            <div className="flex flex-wrap gap-3 pt-3">
              <button
                onClick={onOpenAiModal}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-slate-950 px-7 py-3.5 rounded-2xl font-extrabold text-sm shadow-xl transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg text-slate-900">photo_camera</span>
                <span>Thử nghiệm quét ảnh ngay</span>
              </button>
              <button
                onClick={() => onNavigate('wiki')}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-2xl font-bold text-sm transition-all border border-white/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">menu_book</span>
                <span>Tra cứu thư viện 90 loài</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <div className="p-6 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/15 text-xs text-sky-200">
                <span className="font-bold text-sky-300">Kiến trúc AI Vision</span>
                <span>MobileNetV2 + Softmax 90</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/10 flex items-center justify-between">
                  <span>Thời gian inference trung bình:</span>
                  <span className="font-mono text-sky-300 font-bold">&lt; 0.5s / ảnh</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/10 flex items-center justify-between">
                  <span>Định dạng đầu vào:</span>
                  <span className="font-mono text-sky-300 font-bold">224 x 224 x 3 RGB</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/10 flex items-center justify-between">
                  <span>Chuẩn hóa CSDL:</span>
                  <span className="font-mono text-sky-300 font-bold">Chuẩn 1NF Top-K Results</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ĐÁNH GIÁ KHÁCH HÀNG */}
      {/* ========================================================================= */}
      <section className="w-full py-14 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-widest block mb-1">
              Phản Hồi Thực Tế (CDM: DANH_GIA_SAN_PHAM)
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">Khách Hàng Nói Gì Về Cây Của Vườn</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {INITIAL_REVIEWS.map((rev) => (
              <div
                key={rev.id}
                className="p-6 rounded-3xl bg-sky-50/30 border border-sky-100 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-2">
                    {[...Array(rev.rating)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-base">star</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic">"{rev.comment}"</p>
                </div>
                <div className="mt-4 pt-4 border-t border-sky-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{rev.userName}</span>
                  <span className="text-slate-400">{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
