import React from 'react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="w-full bg-gradient-to-b from-white to-sky-50/60 text-slate-600 border-t border-sky-100 pt-12 pb-8 px-4 sm:px-8 lg:px-12 mt-16 font-sans">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-10 border-b border-sky-100">
        
        {/* Cột 1: THÔNG TIN VƯỜN KIỂNG */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white flex items-center justify-center font-black shadow-xs">
              <span className="material-symbols-outlined text-lg">water_drop</span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">
              CÔNG TY TNHH CÂY CẢNH FLORABOTANIC
            </h3>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-sky-600 shrink-0 mt-0.5">home</span>
              <span><strong>Văn phòng:</strong> Số 132, Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, TP. Cần Thơ</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-sky-600 shrink-0">person</span>
              <span><strong>Người đại diện:</strong> Đoàn Xuân Thịnh</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-sky-600 shrink-0">badge</span>
              <span><strong>Mã số thuế:</strong> 1801689999</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-sky-600 shrink-0">mail</span>
              <span><strong>Email:</strong> kiengla.cantho.cholach@gmail.com</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-sky-600 shrink-0">phone_iphone</span>
              <span><strong>Phản ánh / Zalo:</strong> <strong className="text-blue-700">0909.123.456</strong></span>
            </p>
          </div>
        </div>

        {/* Cột 2: ĐỊA CHỈ BÁN BUÔN BÁN LẺ & VƯỜN ƯƠM CÂY GIỐNG */}
        <div className="space-y-3.5">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-sky-600">store</span>
            <span>Địa chỉ bán buôn bán lẻ</span>
          </h3>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="bg-white p-3.5 rounded-2xl border border-sky-100 shadow-2xs">
              <p className="font-bold text-slate-900 text-[13px] mb-1">Cơ Sở 1 (Cần Thơ):</p>
              <p>Khu Vực 2, Phường An Khánh, Quận Ninh Kiều, TP. Cần Thơ (Gần ĐH Cần Thơ)</p>
              <p className="mt-1 font-semibold text-blue-600">ĐT: 0909.123.456</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-sky-100 shadow-2xs">
              <p className="font-bold text-slate-900 text-[13px] mb-1">Cơ Sở 2 (Vườn Ươm Chợ Lách):</p>
              <p>Ấp Quân Phong, Xã Tân Thiềng, Huyện Chợ Lách, Tỉnh Bến Tre (Cũ)</p>
              <p className="mt-1 font-semibold text-blue-600">ĐT: 0966.561.589</p>
            </div>
          </div>
        </div>

        {/* Cột 3: DANH MỤC & CHÍNH SÁCH MUA HÀNG */}
        <div className="space-y-3.5">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-sky-600">verified_user</span>
            <span>Danh mục &amp; Chính sách</span>
          </h3>

          <ul className="space-y-2 text-xs text-slate-600">
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-blue-700 hover:underline transition-colors flex items-center gap-1.5 cursor-pointer">
                <span className="text-sky-500 font-bold">›</span>
                <span>Trang Chủ</span>
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('products')} className="hover:text-blue-700 hover:underline transition-colors flex items-center gap-1.5 cursor-pointer">
                <span className="text-sky-500 font-bold">›</span>
                <span>Chậu cây kiểng lá sẵn hàng</span>
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('wiki')} className="hover:text-blue-700 hover:underline transition-colors flex items-center gap-1.5 cursor-pointer">
                <span className="text-sky-500 font-bold">›</span>
                <span>Bách khoa tra cứu 90 loài cây</span>
              </button>
            </li>
            <li className="pt-1 text-slate-500">
              <span className="block font-semibold text-slate-800 mb-1">Chính sách vận chuyển &amp; Bảo hành:</span>
              <span>Đóng gói chuyên dụng giữ ẩm rễ, bảo hành 1 đổi 1 trong 7 ngày nếu cây bị ảnh hưởng trong quá trình giao hàng toàn quốc.</span>
            </li>
          </ul>
        </div>

        {/* Cột 4: KẾT NỐI & CÔNG NGHỆ NHẬN DIỆN AI */}
        <div className="space-y-3.5">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-sky-600">psychology</span>
            <span>Công nghệ AI Thực Vật</span>
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            Hệ sinh thái AI MobileNetV2 nhận dạng nhanh 90 loài kiểng lá, kết nối CSDL SQL Server và tư vấn cây trồng vượng khí, tài lộc theo mệnh gia chủ.
          </p>

          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-sky-200 shadow-2xs text-sky-900 text-xs font-bold">
              <span className="material-symbols-outlined text-sky-600 text-lg">check_circle</span>
              <span>100% Cây Thật Đã Thuần Dưỡng Ổn Định</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>© 2026 FloraBotanic AI. Bản quyền hệ thống thuộc về Vườn Ươm Kiểng Lá Cần Thơ &amp; Chợ Lách.</p>
        <p className="flex items-center gap-1 text-sky-800 font-semibold">
          <span className="material-symbols-outlined text-sm text-sky-600">water_drop</span>
          <span>Thủy Sinh Mộc • Sinh Khí &amp; May Mắn Cho Gia Chủ</span>
        </p>
      </div>
    </footer>
  );
}
