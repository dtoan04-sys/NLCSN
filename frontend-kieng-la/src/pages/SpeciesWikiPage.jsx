import React, { useState, useMemo, useEffect } from 'react';
import { SPECIES_LIST } from '../data/mockData';
import { apiFetch } from '../config';

export default function SpeciesWikiPage({ onSelectSpeciesToShop }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesData, setSpeciesData] = useState(SPECIES_LIST);
  const [isLiveFromDb, setIsLiveFromDb] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState('all');

  useEffect(() => {
    apiFetch('/api/loai-cay')
      .then((res) => {
        if (!res.ok) throw new Error('Không thể tải từ database');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item, idx) => {
            const mId = item.MaLoaiCay ?? item.maloaicay ?? item.MALOAICAY ?? (idx + 1);
            const tenTg = item.TenThuongGoi || item.tenthuonggoi || item.TENTHUONGGOI || `Loài #${mId}`;
            const tenKh = item.TenKhoaHoc || item.tenkhoahoc || item.TENKHOAHOC || '';
            const xuatXu = item.XuatXu || item.xuatxu || item.XUATXU || 'Nhiệt đới';
            const dacDiem = item.DacDiemNhanDang || item.dacdiemnhandang || item.dacdiem || 'Lá mướt đẹp, khỏe mạnh.';
            const huongDan = item.HuongDanChamSoc || item.huongdanchamsoc || '';
            const giaTk = item.GiaThamKhao ?? item.giathamkhao ?? item.GIATHAMKHAO;
            return {
              class_id: mId - 1,
              maloaicay: mId,
              vietnamese_name: tenTg,
              original_label: tenKh,
              image: `/plants/${mId}.jpg`,
              anhSang: item.AnhSang || item.anhsang || 'Tán xạ gián tiếp 60-70%',
              tuoiNuoc: '1 - 2 lần/tuần',
              doAm: item.DoAm || item.doam || '65% - 85%',
              xuatXu,
              dacDiem,
              huongDanChamSoc: huongDan,
              giaThamKhao: giaTk ? `${Number(giaTk).toLocaleString('vi-VN')} ₫` : '150.000 ₫'
            };
          });
          setSpeciesData(mapped);
          setIsLiveFromDb(true);
        }
      })
      .catch((err) => {
        console.log('Using local fallback for species list:', err);
      });
  }, []);

  const filteredSpecies = useMemo(() => {
    let list = speciesData;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (sp) =>
          sp.vietnamese_name.toLowerCase().includes(q) ||
          sp.original_label.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchTerm, speciesData]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-8 text-[#132a1e]">
      {/* 1. Header Banner Bách Khoa chuẩn Thực vật học Botanical */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#0b3f31] p-6 sm:p-10 text-white overflow-hidden shadow-xl border border-emerald-800/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <span className="material-symbols-outlined text-[260px] text-white">menu_book</span>
        </div>
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge h-auto py-1 px-3 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold uppercase tracking-wider border border-emerald-400/30 gap-1.5">
              <span className="material-symbols-outlined text-sm">psychology</span>
              Hệ Tri Thức Cây Trồng (Knowledge Base)
            </span>
            {isLiveFromDb && (
              <span className="badge h-auto py-0.5 px-3 bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 text-[11px] font-bold rounded-full gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Đồng bộ CSDL SQL Server (CayKiengLa)
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Bách Khoa 90 Loài Kiểng Lá &amp; AI Vision
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
            Tập hợp đầy đủ 90 loài cây kiểng lá theo danh mục nghiên cứu. Tra cứu đặc điểm nhận dạng hình thái, nguồn gốc xuất xứ, chế độ ánh sáng, lịch tưới nước chuẩn nông học và kết nối trực tiếp đến các chậu cây sẵn hàng tại vườn.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs text-emerald-200/90 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-400 text-base">verified</span>
              <span>90 Loài định danh thực vật</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-400 text-base">photo_camera</span>
              <span>Tích hợp AI MobileNetV2 (v2.0-TuSo0)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-400 text-base">potted_plant</span>
              <span>Sẵn hàng tại vựa kiểng</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Thanh tìm kiếm và bộ lọc nhanh */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-emerald-900/10 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#059669] text-xl">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên cây hoặc tên khoa học (Trầu bà, Lưỡi hổ, Kim tiền, Hồng môn...)"
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-emerald-900/15 bg-[#fafaf7] focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#059669] text-xs sm:text-sm text-[#132a1e] placeholder:text-[#132a1e]/40"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
          <span className="text-[#132a1e]/60 font-medium">
            Hiển thị: <strong className="text-[#064e3b] font-bold text-sm">{filteredSpecies.length}</strong> / 90 loài cây
          </span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="btn btn-ghost btn-xs text-xs text-[#059669] hover:text-[#064e3b] font-semibold underline"
            >
              Xem tất cả
            </button>
          )}
        </div>
      </div>

      {/* 3. Lưới thẻ loài cây (Botanical Card Grid) chuẩn thiết kế sang trọng */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpecies.map((sp) => {
          const sId = sp.maloaicay || sp.class_id + 1;
          const imgSrc = sp.image || `/plants/${sId}.jpg`;

          return (
            <div
              key={sp.class_id}
              className="card group bg-white rounded-3xl overflow-hidden border border-emerald-900/10 hover:border-[#059669]/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Phần ảnh trực quan + Tag mã loài */}
              <div className="relative h-40 sm:h-44 bg-[#f3f2ec] overflow-hidden">
                <img
                  src={imgSrc}
                  alt={sp.vietnamese_name}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `/plants/${sId}.jpg`;
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Badge mã loài chuẩn CSDL */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="badge h-auto px-3 py-1 rounded-full bg-white/95 backdrop-blur text-[#064e3b] font-mono font-bold text-xs shadow-md border border-emerald-900/10">
                    Loài #{sId}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="badge h-auto px-2.5 py-1 rounded-full bg-[#064e3b]/80 backdrop-blur text-[#fafaf7] text-[10px] font-semibold border border-white/15">
                    Flora 90
                  </span>
                </div>

                {/* Dải gradient mờ dưới chân ảnh để tôn thông tin */}
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/45 to-transparent"></div>
              </div>

              {/* Nội dung thông tin thực vật học */}
              <div className="card-body p-5 flex-1 flex flex-col justify-between space-y-4 gap-0">
                <div>
                  {/* Tên loài tiếng Việt & Danh pháp khoa học quốc tế */}
                  <div>
                    <h3 className="font-extrabold text-lg text-[#132a1e] group-hover:text-[#064e3b] transition-colors leading-snug">
                      {sp.vietnamese_name}
                    </h3>
                    <p className="text-xs text-[#059669] font-semibold italic mt-0.5 tracking-wide">
                      {sp.original_label}
                    </p>
                  </div>

                  {/* Đặc điểm nhận dạng */}
                  <p className="text-xs text-[#132a1e]/70 mt-2.5 line-clamp-2 leading-relaxed">
                    {sp.dacDiem}
                  </p>

                  {/* 4 Chỉ số chăm sóc (Ánh sáng, Tưới nước, Độ ẩm, Xuất xứ) */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-[#fafaf7] border border-emerald-900/8">
                      <span className="text-[#132a1e]/45 font-bold text-[9px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-amber-600">light_mode</span>
                        Ánh sáng
                      </span>
                      <span className="font-bold text-[#132a1e] line-clamp-1">{sp.anhSang}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#fafaf7] border border-emerald-900/8">
                      <span className="text-[#132a1e]/45 font-bold text-[9px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-teal-600">water_drop</span>
                        Tưới nước
                      </span>
                      <span className="font-bold text-[#132a1e] line-clamp-1">{sp.tuoiNuoc}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#fafaf7] border border-emerald-900/8">
                      <span className="text-[#132a1e]/45 font-bold text-[9px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-emerald-600">humidity_mid</span>
                        Độ ẩm
                      </span>
                      <span className="font-bold text-[#132a1e] line-clamp-1">{sp.doAm}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#fafaf7] border border-emerald-900/8">
                      <span className="text-[#132a1e]/45 font-bold text-[9px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-[#059669]">public</span>
                        Xuất xứ
                      </span>
                      <span className="font-bold text-[#132a1e] line-clamp-1">{sp.xuatXu}</span>
                    </div>
                  </div>
                </div>

                {/* Chân thẻ: Giá tham khảo & Nút xem chậu bán */}
                <div className="pt-3.5 border-t border-emerald-900/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#132a1e]/45 uppercase tracking-wider font-semibold block">Giá tham khảo:</span>
                    <span className="text-sm font-black text-[#064e3b]">{sp.giaThamKhao}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectSpeciesToShop(sp.vietnamese_name)}
                    className="btn btn-primary btn-sm h-9 px-4 rounded-xl text-xs font-bold gap-1.5 shadow-sm"
                  >
                    <span>Xem chậu bán</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
