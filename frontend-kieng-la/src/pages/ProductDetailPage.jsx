import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { INITIAL_REVIEWS } from '../data/mockData';
import { getPlantImage, handleImgError } from '../utils/plantAssets';

export default function ProductDetailPage({ product, onBack, onCheckoutNow, onOpenAuth }) {
  const [selectedImg, setSelectedImg] = useState(product?.image);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(5);

  const { addToCart, showToast } = useCart();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (product) {
      setSelectedImg(product.image);
    }
  }, [product]);

  if (!product) return null;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    addToCart(product, qty);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      showToast('⚠️ Vui lòng đăng nhập tài khoản trước khi mua hàng!');
      if (onOpenAuth) onOpenAuth();
      return;
    }
    const res = addToCart(product, qty);
    if (res?.success) {
      onCheckoutNow();
    }
  };

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('⚠️ Vui lòng đăng nhập để gửi nhận xét và đánh giá sản phẩm!');
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!newReviewText.trim()) return;

    const rev = {
      id: Date.now(),
      productId: product.id,
      userName: user.fullName || user.username,
      rating: newRating,
      date: new Date().toLocaleDateString('vi-VN'),
      comment: newReviewText,
      verified: true
    };

    setReviews([rev, ...reviews]);
    setNewReviewText('');
    showToast('⭐ Cảm ơn bạn đã đóng góp đánh giá sản phẩm!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 text-[#132a1e]">
      {/* Nút quay lại */}
      <button
        type="button"
        onClick={onBack}
        className="btn btn-ghost btn-sm px-2 text-xs font-bold text-[#064e3b] hover:bg-emerald-900/8 rounded-xl gap-1.5"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        <span>Quay lại danh sách sản phẩm</span>
      </button>

      {/* Chi tiết sản phẩm */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Gallery ảnh đa góc máy theo CDM: HINH_ANH_SAN_PHAM */}
        {(() => {
          const rawSid = Number(product.speciesId || 1);
          const validSid = rawSid >= 1 && rawSid <= 90 ? rawSid : 1;
          const galleryList =
            product.gallery && product.gallery.length > 1
              ? product.gallery
              : [
                  product.image,
                  `/plants/angles/${validSid}_closeup.jpg`,
                  `/plants/angles/${validSid}_side.jpg`,
                  `/plants/angles/${validSid}_detail.jpg`
                ];
          const angleLabels = ['Góc chính diện', 'Cận cảnh phiến lá', 'Góc nghiêng 3/4', 'Góc thân & chậu'];
          const currentImg = selectedImg || galleryList[0] || product.image;
          const currentIdx = Math.max(0, galleryList.indexOf(currentImg));

          return (
            <div className="lg:col-span-7 space-y-3.5">
              <div className="relative h-72 sm:h-80 lg:h-[360px] rounded-3xl overflow-hidden bg-[#f3f2ec] shadow-md border border-emerald-900/10 group">
                <img
                  src={currentImg}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-300"
                  onError={(e) => handleImgError(e, getPlantImage(product.speciesId, product.speciesName))}
                />
                <span className="badge absolute top-3 left-3 h-auto py-1 px-3 bg-[#064e3b]/85 backdrop-blur-sm text-white border border-white/15 rounded-full text-xs font-semibold gap-1.5">
                  <span className="material-symbols-outlined text-sm">videocam</span>
                  <span>
                    Góc máy {currentIdx + 1}/{galleryList.length}: {angleLabels[currentIdx] || `Góc #${currentIdx + 1}`}
                  </span>
                </span>
                {galleryList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedImg(galleryList[(currentIdx - 1 + galleryList.length) % galleryList.length])
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-[#064e3b] shadow-md flex items-center justify-center transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImg(galleryList[(currentIdx + 1) % galleryList.length])}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-[#064e3b] shadow-md flex items-center justify-center transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3">
                {galleryList.map((img, idx) => {
                  const isActive = currentImg === img;
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setSelectedImg(img)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#059669] ring-2 ring-[#059669]/30 shadow-sm'
                          : 'border-emerald-900/10 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={angleLabels[idx] || `Góc ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => handleImgError(e, getPlantImage(product.speciesId, product.speciesName))}
                      />
                      <span className="absolute bottom-1 inset-x-1 bg-black/65 backdrop-blur-2xs text-white text-[10px] font-semibold py-0.5 px-1 rounded-md truncate text-center">
                        {angleLabels[idx] || `Góc #${idx + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Thông số mua hàng & CDM Data */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge h-auto py-1 px-2.5 rounded-full text-[11px] font-bold text-[#064e3b] uppercase tracking-widest bg-emerald-50 border border-emerald-200">
                {product.speciesName}
              </span>
              <span className="text-[11px] font-bold text-[#132a1e]/50">Mã SP: #{product.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#132a1e] mt-2 leading-snug">
              {product.name}
            </h1>
            <p className="text-xs text-[#132a1e]/55 italic mt-1">{product.healthStatus}</p>
          </div>

          {/* Khối giá tiền */}
          <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-900/12 flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl sm:text-4xl font-black text-[#064e3b]">
              {product.price.toLocaleString('vi-VN')} ₫
            </span>
            {product.originalPrice && (
              <span className="text-sm text-[#132a1e]/40 line-through">
                {product.originalPrice.toLocaleString('vi-VN')} ₫
              </span>
            )}
            <span className="badge h-auto py-0.5 px-2.5 text-xs font-bold rounded-full bg-[#059669] text-white border-0">
              Sẵn hàng tại vườn
            </span>
          </div>

          {/* Thông số kỹ thuật theo CDM: SAN_PHAM */}
          <div className="space-y-2 text-xs text-[#132a1e]/80 bg-white p-4 rounded-2xl border border-emerald-900/10">
            <div className="flex justify-between border-b border-emerald-900/8 pb-2">
              <span className="text-[#132a1e]/55">Quy cách kích thước:</span>
              <span className="font-semibold text-[#132a1e]">{product.size}</span>
            </div>
            <div className="flex justify-between border-b border-emerald-900/8 pb-2">
              <span className="text-[#132a1e]/55">Tình trạng lá &amp; ngọn:</span>
              <span className="font-semibold text-[#132a1e]">{product.leafCondition}</span>
            </div>
            <div className="flex justify-between border-b border-emerald-900/8 pb-2">
              <span className="text-[#132a1e]/55">Tồn kho khả dụng:</span>
              <span className="font-semibold text-[#059669]">{product.stock} chậu</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#132a1e]/55">Bảo hành vườn ươm:</span>
              <span className="font-semibold text-[#132a1e]">1 đổi 1 trong 30 ngày</span>
            </div>
          </div>

          {/* Mô tả chi tiết */}
          <div className="text-xs text-[#132a1e]/75 leading-relaxed space-y-2">
            <h4 className="font-bold text-[#132a1e] uppercase tracking-wider text-[11px]">Mô tả sinh học:</h4>
            <p>{product.desc}</p>
          </div>

          {/* Chọn số lượng & Nút mua */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-[#132a1e]/80">Số lượng:</span>
              <div className="join border border-emerald-900/15 rounded-xl bg-white">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="btn btn-ghost btn-sm join-item px-3 text-[#064e3b] font-bold"
                >
                  -
                </button>
                <span className="px-4 flex items-center text-xs font-bold text-[#132a1e]">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="btn btn-ghost btn-sm join-item px-3 text-[#064e3b] font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-[#132a1e]/50">(Tối đa {product.stock} chậu)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="btn h-auto min-h-0 w-full py-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border border-emerald-900/15 font-bold text-xs gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                <span>Thêm vào giỏ</span>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="btn btn-primary h-auto min-h-0 w-full py-3.5 rounded-2xl font-bold text-xs shadow-md gap-1.5"
              >
                <span>Mua ngay • Giao 2H</span>
                <span className="material-symbols-outlined text-base">bolt</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tri thức loài cây từ CDM: LOAI_CAY */}
      <section className="card bg-white p-6 sm:p-8 rounded-3xl border border-emerald-900/10 space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#059669] text-2xl">spa</span>
          <h3 className="text-lg font-bold text-[#132a1e]">
            Cẩm Nang Chăm Sóc Thực Vật Học
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#fafaf7] border border-emerald-900/8 space-y-1">
            <span className="font-bold text-[#059669] block text-[10px] uppercase">Ánh sáng</span>
            <p className="font-semibold text-[#132a1e]">Tán xạ gián tiếp 60-70%, tránh nắng gắt buổi trưa trực tiếp.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#fafaf7] border border-emerald-900/8 space-y-1">
            <span className="font-bold text-[#059669] block text-[10px] uppercase">Tưới nước</span>
            <p className="font-semibold text-[#132a1e]">Tưới khi đất khô se (1-2 lần/tuần), không để ngập úng gốc.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#fafaf7] border border-emerald-900/8 space-y-1">
            <span className="font-bold text-[#059669] block text-[10px] uppercase">Độ ẩm</span>
            <p className="font-semibold text-[#132a1e]">65% - 85% lý tưởng cho sự bung mở và phát triển lá xẻ to.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#fafaf7] border border-emerald-900/8 space-y-1">
            <span className="font-bold text-[#059669] block text-[10px] uppercase">Giá thể</span>
            <p className="font-semibold text-[#132a1e]">Vỏ thông, đá bọt perlite, xơ dừa tơi xốp giàu dinh dưỡng.</p>
          </div>
        </div>
      </section>

      {/* Đánh giá sản phẩm theo CDM: DANH_GIA_SAN_PHAM */}
      <section className="card bg-white p-6 sm:p-8 rounded-3xl border border-emerald-900/10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#132a1e]">Đánh giá từ khách mua</h3>
            <p className="text-xs text-[#132a1e]/50">Yêu cầu đăng nhập tài khoản trước khi viết nhận xét</p>
          </div>
          <span className="badge h-auto py-1 px-3 text-xs font-bold text-[#064e3b] bg-emerald-50 border border-emerald-200 rounded-full">
            {reviews.length} đánh giá
          </span>
        </div>

        {/* Danh sách review */}
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl bg-[#fafaf7] border border-emerald-900/8 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#132a1e]">{r.userName}</span>
                <span className="text-[#132a1e]/45 text-[11px]">{r.date}</span>
              </div>
              <div className="flex items-center text-amber-500">
                {[...Array(r.rating)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm">star</span>
                ))}
              </div>
              <p className="text-[#132a1e]/80 mt-1">{r.comment}</p>
            </div>
          ))}
        </div>

        {/* Form viết đánh giá mới */}
        <form onSubmit={handleAddReview} className="pt-4 border-t border-emerald-900/10 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-[#132a1e]">Gửi đánh giá của bạn cho cây này:</h4>
            {!isAuthenticated && (
              <span className="text-xs text-amber-700 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">lock</span>
                Cần đăng nhập để đánh giá
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#132a1e]/60">Số sao:</span>
            <select
              value={newRating}
              onChange={(e) => setNewRating(Number(e.target.value))}
              className="select select-xs h-8 px-2.5 rounded-lg border border-emerald-900/15 bg-white font-semibold text-[#132a1e]"
            >
              <option value="5">⭐⭐⭐⭐⭐ 5 Sao</option>
              <option value="4">⭐⭐⭐⭐ 4 Sao</option>
              <option value="3">⭐⭐⭐ 3 Sao</option>
            </select>
          </div>
          <textarea
            rows="2"
            value={newReviewText}
            onChange={(e) => setNewReviewText(e.target.value)}
            placeholder={
              isAuthenticated
                ? 'Chia sẻ trải nghiệm đóng gói, tình trạng rễ và vẻ đẹp của cây...'
                : 'Vui lòng đăng nhập tài khoản để viết đánh giá...'
            }
            className="w-full p-3 rounded-2xl border border-emerald-900/15 bg-[#fafaf7] focus:border-[#059669] focus:outline-none text-xs text-[#132a1e]"
          ></textarea>
          <button
            type="submit"
            className="btn btn-primary btn-sm h-10 px-5 rounded-xl font-bold text-xs"
          >
            Đăng nhận xét
          </button>
        </form>
      </section>
    </div>
  );
}
