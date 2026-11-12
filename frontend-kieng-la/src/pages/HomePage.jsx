import React, { useRef } from 'react';
import { CATEGORIES, PRODUCTS, INITIAL_REVIEWS } from '../data/mockData';
import { useCart } from '../context/CartContext';

export default function HomePage({ onOpenAiModal, onSelectProduct, onNavigate, onSelectCategory }) {
  const carouselRef = useRef(null);
  const { addToCart } = useCart();

  const featuredProducts = PRODUCTS.slice(0, 4);

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Section */}
      <section className="relative w-full bg-[#f2f4f1] py-12 md:py-20 border-b border-gray-200/50">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 flex flex-col items-start space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#92f7c3] text-[#002113] text-xs font-bold uppercase tracking-wider shadow-xs">
                <span className="material-symbols-outlined text-sm">verified</span>
                Vườn Ươm Chuẩn Bảo Tồn Aroid &amp; AI Vision
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl text-[#012d1d] font-light tracking-tight leading-tight">
                Tuyệt Tác Kiểng Lá Hiếm &amp; Đột Biến Thuần Dưỡng
              </h1>
              <p className="text-sm md:text-base text-[#414844] max-w-2xl leading-relaxed">
                Tuyển chọn các cá thể Monstera, Philodendron và Anthurium tinh hoa có nguồn gốc rõ ràng, rễ khỏe mạnh đã thuần khí hậu nhiệt đới. Giám định loài cây tức thì bằng mô hình AI 90 loài.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('products')}
                  className="inline-flex items-center gap-1.5 bg-[#012d1d] hover:bg-[#1b4332] text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all"
                >
                  <span>Khám phá bộ sưu tập cây</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenAiModal}
                  className="inline-flex items-center gap-2 bg-white hover:bg-emerald-50 text-[#012d1d] px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm border border-gray-200"
                >
                  <span className="material-symbols-outlined text-lg text-emerald-700">photo_camera</span>
                  <span>Quét cây bằng AI Vision</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden p-3 max-w-md mx-auto border border-gray-100">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
                  <img
                    alt="Monstera Albo Specimen"
                    className="w-full h-full object-cover"
                    src={PRODUCTS[0].image}
                  />
                  <span className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Cá Thể Tinh Hoa #MB-9902
                  </span>
                  <span className="absolute bottom-3 right-3 bg-emerald-500 text-white px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    Đột Biến Cẩm Thạch
                  </span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950 uppercase">{PRODUCTS[0].name}</h3>
                    <p className="text-xs text-gray-500 italic">Borsigiana Variegata Sectoral</p>
                  </div>
                  <button
                    onClick={() => onSelectProduct(PRODUCTS[0])}
                    className="text-xs bg-[#012d1d] text-white px-3 py-1.5 rounded-xl font-bold hover:bg-[#1b4332] transition-colors"
                  >
                    Xem chậu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Danh mục chi thực vật theo CDM: DANH_MUC */}
      <section className="w-full py-14 bg-white" id="danh-muc">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">
                Hệ Thực Vật Học Nhiệt Đới
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#012d1d]">
                Danh Mục Cây Theo Nhu Cầu &amp; Không Gian
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => carouselRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-emerald-100 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button
                onClick={() => carouselRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-emerald-100 flex items-center justify-center transition-colors"
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
                className="flex-none w-72 bg-[#f8faf7] p-5 rounded-3xl border border-gray-100 hover:border-emerald-300 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-[#012d1d] text-emerald-800 group-hover:text-emerald-400 flex items-center justify-center transition-colors mb-4">
                  <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                </div>
                <h4 className="font-bold text-gray-900 text-base group-hover:text-emerald-800 transition-colors">
                  {cat.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{cat.desc}</p>
                <div className="mt-4 flex items-center text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                  <span>Khám phá danh mục</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Lưới sản phẩm nổi bật theo CDM: SAN_PHAM */}
      <section className="w-full py-14 bg-[#f8faf7]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">
                Cập Nhật Trực Tiếp Tại Vườn Ươm
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#012d1d]">
                Mẫu Phẩm Kiểng Lá Mới Về Hôm Nay
              </h2>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả ({PRODUCTS.length} chậu)</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <div
                key={p.id}
                className="group flex flex-col bg-white rounded-3xl shadow-xs hover:shadow-xl transition-all overflow-hidden border border-gray-100"
              >
                <div
                  className="relative aspect-[4/5] bg-gray-100 overflow-hidden cursor-pointer"
                  onClick={() => onSelectProduct(p)}
                >
                  <img
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={p.image}
                  />
                  <span className="absolute top-3 left-3 bg-[#92f7c3] text-[#002113] text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                    {p.tag}
                  </span>
                </div>

                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">{p.speciesName}</span>
                    <h3
                      onClick={() => onSelectProduct(p)}
                      className="font-bold text-gray-900 text-sm leading-snug mt-1 cursor-pointer group-hover:text-emerald-800 transition-colors line-clamp-1"
                    >
                      {p.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.size}</p>
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-gray-100 mt-4">
                    <div>
                      <span className="font-extrabold text-base text-[#012d1d]">
                        {p.price.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => addToCart(p, 1)}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-900 transition-colors"
                        title="Thêm vào giỏ hàng"
                      >
                        <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                      </button>
                      <button
                        onClick={() => onSelectProduct(p)}
                        className="text-xs font-bold px-3 py-2 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white transition-colors"
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

      {/* 4. Banner giới thiệu AI Vision nhận diện 90 loài */}
      <section className="w-full py-16 bg-[#012d1d] text-white">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              AI Deep Learning Core
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Nhận Diện Cây Bằng Hình Ảnh Ngay Trên Thiết Bị
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Bạn thấy một cây kiểng lá đẹp nhưng không biết tên hay cách chăm sóc? Hãy chụp hoặc tải ảnh lên. Mô hình MobileNetV2 của hệ thống sẽ phân loại trong tích tắc qua cơ sở dữ liệu 90 loài cây nhiệt đới.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={onOpenAiModal}
                className="inline-flex items-center gap-2 bg-[#92f7c3] hover:bg-[#75daa8] text-[#002113] px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-lg">photo_camera</span>
                <span>Thử nghiệm quét ảnh ngay</span>
              </button>
              <button
                onClick={() => onNavigate('wiki')}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all border border-white/20"
              >
                <span className="material-symbols-outlined text-lg">menu_book</span>
                <span>Tra cứu thư viện 90 loài</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md max-w-md w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs text-gray-300">
                <span className="font-bold text-emerald-400">Kiến trúc AI Vision</span>
                <span>MobileNetV2 + Softmax 90</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 flex items-center justify-between">
                  <span>Thời gian inference trung bình:</span>
                  <span className="font-mono text-emerald-300 font-bold">&lt; 0.5s / ảnh</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 flex items-center justify-between">
                  <span>Định dạng đầu vào:</span>
                  <span className="font-mono text-emerald-300 font-bold">224 x 224 x 3 RGB</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 flex items-center justify-between">
                  <span>Chuẩn hóa CSDL:</span>
                  <span className="font-mono text-emerald-300 font-bold">Chuẩn 1NF Top-K Results</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Đánh giá khách hàng theo CDM: DANH_GIA_SAN_PHAM */}
      <section className="w-full py-14 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">
              Phản Hồi Thực Tế (CDM: DANH_GIA_SAN_PHAM)
            </span>
            <h2 className="text-2xl font-bold text-gray-900">Khách Hàng Nói Gì Về Cây Của Vườn</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {INITIAL_REVIEWS.map((rev) => (
              <div
                key={rev.id}
                className="p-6 rounded-3xl bg-[#f8faf7] border border-gray-100 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-2">
                    {[...Array(rev.rating)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-base">star</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed italic">"{rev.comment}"</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900">{rev.userName}</span>
                  <span className="text-gray-400">{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
