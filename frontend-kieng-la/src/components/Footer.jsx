import React from 'react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="w-full bg-[#fbf9f5] text-[#2c332e] border-t border-[#e8e2d5] pt-12 pb-8 px-4 sm:px-8 lg:px-12 mt-16 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-10 border-b border-[#e5dfd2]">
        
        {/* Cột 1: THÔNG TIN VƯỜN KIỂNG (Chuẩn form WebCayCanh) */}
        <div className="space-y-3.5">
          <h3 className="text-base font-extrabold text-[#5c8a1e] tracking-tight uppercase">
            CÔNG TY TNHH CÂY CẢNH FLORABOTANIC
          </h3>

          <div className="space-y-2.5 text-xs text-[#333a35] leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-[#5c8a1e] shrink-0 mt-0.5">home</span>
              <span><strong>Văn phòng:</strong> Số 132, Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, TP. Cần Thơ</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#5c8a1e] shrink-0">person</span>
              <span><strong>Người đại diện:</strong> Đoàn Xuân Thịnh</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#5c8a1e] shrink-0">badge</span>
              <span><strong>Mã số thuế:</strong> 1801689999</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#5c8a1e] shrink-0">mail</span>
              <span><strong>Email:</strong> kiengla.cantho.cholach@gmail.com</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#5c8a1e] shrink-0">phone_iphone</span>
              <span><strong>Phản ánh / Zalo:</strong> <strong className="text-[#5c8a1e]">0909.123.456</strong></span>
            </p>
          </div>
        </div>

        {/* Cột 2: ĐỊA CHỈ BÁN BUÔN BÁN LẺ & VƯỜN ƯƠM CÂY GIỐNG */}
        <div className="space-y-3.5">
          <h3 className="text-base font-extrabold text-[#5c8a1e] tracking-tight uppercase">
            Địa chỉ bán buôn bán lẻ
          </h3>

          <div className="space-y-3 text-xs text-[#333a35] leading-relaxed">
            <div className="bg-white/90 p-3 rounded-xl border border-[#ece6d9] shadow-2xs">
              <p className="font-bold text-[#1f2922] text-[13px] mb-1">Tại Cơ Sở 1 (Cần Thơ):</p>
              <p>Khu Vực 2, Phường An Khánh, Quận Ninh Kiều, TP. Cần Thơ (Gần ĐH Cần Thơ)</p>
              <p className="mt-1 font-semibold text-[#5c8a1e]">ĐT: 0909.123.456</p>
            </div>

            <div className="bg-white/90 p-3 rounded-xl border border-[#ece6d9] shadow-2xs">
              <p className="font-bold text-[#1f2922] text-[13px] mb-1">Tại Cơ Sở 2 (Vườn Ươm Chợ Lách):</p>
              <p>Ấp Quân Phong, Xã Tân Thiềng, Huyện Chợ Lách, Tỉnh Bến Tre (Cũ)</p>
              <p className="mt-1 font-semibold text-[#5c8a1e]">ĐT: 0966.561.589</p>
            </div>
          </div>
        </div>

        {/* Cột 3: DANH MỤC & CHÍNH SÁCH MUA HÀNG */}
        <div className="space-y-3.5">
          <h3 className="text-base font-extrabold text-[#5c8a1e] tracking-tight uppercase">
            Danh mục &amp; Chính sách
          </h3>

          <ul className="space-y-2 text-xs text-[#3f4741]">
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-[#5c8a1e] hover:underline transition-colors flex items-center gap-1.5">
                <span className="text-[#8ca861]">›</span>
                <span>Trang Chủ</span>
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('products')} className="hover:text-[#5c8a1e] hover:underline transition-colors flex items-center gap-1.5">
                <span className="text-[#8ca861]">›</span>
                <span>Chậu cây kiểng lá sẵn hàng</span>
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('wiki')} className="hover:text-[#5c8a1e] hover:underline transition-colors flex items-center gap-1.5">
                <span className="text-[#8ca861]">›</span>
                <span>Bách khoa tra cứu 90 loài cây</span>
              </button>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-[#8ca861]">›</span>
              <span>Chính sách giao nhanh Cần Thơ &amp; Miền Tây trong ngày</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-[#8ca861]">›</span>
              <span>Chính sách bảo hành sống 30 ngày thuần khí hậu Chợ Lách</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-[#8ca861]">›</span>
              <span>Chính sách đổi trả hàng hư hại khi vận chuyển</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-[#8ca861]">›</span>
              <span>Sitemaps</span>
            </li>
          </ul>
        </div>

        {/* Cột 4: HỆ THỐNG GIÁM ĐỊNH AI VÀ CSDL */}
        <div className="space-y-3.5">
          <h3 className="text-base font-extrabold text-[#5c8a1e] tracking-tight uppercase">
            Hệ thống Giám định AI
          </h3>

          <div className="bg-white/90 p-3.5 rounded-xl border border-[#ece6d9] space-y-2 text-xs text-[#3f4741] shadow-2xs">
            <p className="flex items-center gap-1.5 font-bold text-[#1f2922]">
              <span className="material-symbols-outlined text-base text-[#5c8a1e]">psychology</span>
              <span>Mô hình AI: MobileNetV2 + 6-TTA</span>
            </p>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Nhận diện 90 loài cây kiểng lá nhiệt đới theo chuẩn nông học. Kết quả kiểm định Top-3 đạt <strong>88.11%</strong> trên 23.850 ảnh thực nghiệm.
            </p>
            <div className="pt-2 border-t border-[#f0ece1] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5c8a1e] animate-pulse"></span>
              <span className="text-[11px] font-bold text-[#5c8a1e]">Đồng bộ SQL Server (Cần Thơ — Chợ Lách)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dòng bản quyền dưới cùng */}
      <div className="max-w-[1440px] mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6e7770] gap-2">
        <p>© 2026 Bản quyền thuộc về Hệ thống Cây Cảnh &amp; AI FloraBotanic (Cần Thơ — Chợ Lách Bến Tre).</p>
        <p className="text-[11px]">Đồ án Niên luận Công nghệ Thông tin — Khoa CNTT &amp; Truyền thông</p>
      </div>
    </footer>
  );
}
