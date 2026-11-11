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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Nút quay lại */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        <span>Quay lại danh sách sản phẩm</span>
      </button>

      {/* Chi tiết sản phẩm */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Gallery ảnh theo CDM: HINH_ANH_SAN_PHAM */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/5] sm:aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-md border border-gray-100">
            <img
              src={selectedImg || product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-all"
              onError={(e) => handleImgError(e, getPlantImage(product.speciesId, product.speciesName))}
            />
          </div>

          {product.gallery && product.gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(img)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                    (selectedImg || product.image) === img
                      ? 'border-emerald-600 shadow-sm'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt="Thumb"
                    className="w-full h-full object-cover"
                    onError={(e) => handleImgError(e, getPlantImage(product.speciesId, product.speciesName))}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Thông số mua hàng & CDM Data */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {product.speciesName}
              </span>
              <span className="text-[11px] font-bold text-gray-500">Mã SP: #{product.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 leading-snug">
              {product.name}
            </h1>
            <p className="text-xs text-gray-400 italic mt-1">{product.healthStatus}</p>
          </div>

          {/* Khối giá tiền */}
          <div className="p-5 rounded-3xl bg-emerald-50/60 border border-emerald-100 flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-black text-emerald-900">
              {product.price.toLocaleString('vi-VN')} ₫
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                {product.originalPrice.toLocaleString('vi-VN')} ₫
              </span>
            )}
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
              Sẵn hàng tại vườn
            </span>
          </div>

          {/* Thông số kỹ thuật theo CDM: SAN_PHAM */}
          <div className="space-y-2 text-xs text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Quy cách kích thước:</span>
              <span className="font-semibold text-gray-900">{product.size}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Tình trạng lá &amp; ngọn:</span>
              <span className="font-semibold text-gray-900">{product.leafCondition}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Tồn kho khả dụng:</span>
              <span className="font-semibold text-emerald-700">{product.stock} chậu</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bảo hành vườn ươm:</span>
              <span className="font-semibold text-gray-900">1 đổi 1 trong 30 ngày</span>
            </div>
          </div>

          {/* Mô tả chi tiết */}
          <div className="text-xs text-gray-600 leading-relaxed space-y-2">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">Mô tả sinh học:</h4>
            <p>{product.desc}</p>
          </div>

          {/* Chọn số lượng & Nút mua */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-gray-700">Số lượng:</span>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-1 hover:bg-gray-100 text-gray-600 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1 text-xs font-bold text-gray-900">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="px-3 py-1 hover:bg-gray-100 text-gray-600 font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-gray-400">(Tối đa {product.stock} chậu)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                <span>Thêm vào giỏ</span>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full py-3.5 rounded-2xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Mua ngay • Giao 2H</span>
                <span className="material-symbols-outlined text-base">bolt</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tri thức loài cây từ CDM: LOAI_CAY */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-800 text-2xl">spa</span>
          <h3 className="text-lg font-bold text-gray-900">
            Cẩm Nang Chăm Sóc Thực Vật Học (CDM: LOAI_CAY)
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#f8faf7] border border-gray-100 space-y-1">
            <span className="font-bold text-gray-400 block text-[10px] uppercase">Ánh sáng</span>
            <p className="font-semibold text-gray-800">Tán xạ gián tiếp 60-70%, tránh nắng gắt buổi trưa trực tiếp.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#f8faf7] border border-gray-100 space-y-1">
            <span className="font-bold text-gray-400 block text-[10px] uppercase">Tưới nước</span>
            <p className="font-semibold text-gray-800">Tưới khi đất khô se (1-2 lần/tuần), không để ngập úng gốc.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#f8faf7] border border-gray-100 space-y-1">
            <span className="font-bold text-gray-400 block text-[10px] uppercase">Độ ẩm</span>
            <p className="font-semibold text-gray-800">65% - 85% lý tưởng cho sự bung mở và phát triển lá xẻ to.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#f8faf7] border border-gray-100 space-y-1">
            <span className="font-bold text-gray-400 block text-[10px] uppercase">Giá thể</span>
            <p className="font-semibold text-gray-800">Vỏ thông, đá bọt perlite, xơ dừa tơi xốp giàu dinh dưỡng.</p>
          </div>
        </div>
      </section>

      {/* Đánh giá sản phẩm theo CDM: DANH_GIA_SAN_PHAM */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Đánh giá từ khách mua (CDM: DANH_GIA_SAN_PHAM)</h3>
            <p className="text-xs text-gray-400">Yêu cầu đăng nhập tài khoản trước khi viết nhận xét</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
            {reviews.length} đánh giá
          </span>
        </div>

        {/* Danh sách review */}
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl bg-[#f8faf7] border border-gray-100 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">{r.userName}</span>
                <span className="text-gray-400 text-[11px]">{r.date}</span>
              </div>
              <div className="flex items-center text-amber-500">
                {[...Array(r.rating)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm">star</span>
                ))}
              </div>
              <p className="text-gray-700 mt-1">{r.comment}</p>
            </div>
          ))}
        </div>

        {/* Form viết đánh giá mới */}
        <form onSubmit={handleAddReview} className="pt-4 border-t border-gray-100 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-900">Gửi đánh giá của bạn cho cây này:</h4>
            {!isAuthenticated && (
              <span className="text-xs text-amber-700 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">lock</span>
                Cần đăng nhập để đánh giá
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Số sao:</span>
            <select
              value={newRating}
              onChange={(e) => setNewRating(Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg border border-gray-200 font-semibold"
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
            className="w-full p-3 rounded-2xl border border-gray-200 focus:outline-emerald-600 text-xs text-gray-800"
          ></textarea>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs"
          >
            Đăng nhận xét
          </button>
        </form>
      </section>
    </div>
  );
}
