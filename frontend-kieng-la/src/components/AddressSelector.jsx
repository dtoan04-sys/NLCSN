import React, { useState, useEffect, useId, useRef } from 'react';
import {
  VIETNAM_PROVINCES_2_TIER,
  LEGACY_PROVINCE_SHORTCUTS,
  getWardsByProvince,
  matchProvinceName,
  normalizeWardFromNominatim,
  parseFullAddress2Tier,
  formatFullAddress2Tier
} from '../data/vietnamLocations';

export default function AddressSelector({
  value = '',
  onChange,
  required = false,
  label = 'Địa chỉ (Chuẩn hành chính 2 cấp mới)',
  compact = false
}) {
  const uid = useId();
  const datalistId = `wards-datalist-${uid}`;

  const [province, setProvince] = useState('');
  const [ward, setWard] = useState('');
  const [street, setStreet] = useState('');

  // Gợi ý Phường/Xã động từ OpenStreetMap khi người dùng gõ tìm kiếm
  const [remoteWards, setRemoteWards] = useState([]);
  const [isSearchingWard, setIsSearchingWard] = useState(false);

  // Trạng thái Định vị GPS
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState({ type: '', message: '' });

  // Cho phép sửa trực tiếp chuỗi tổng hợp nếu người dùng muốn
  const [isDirectEdit, setIsDirectEdit] = useState(false);
  const lastEmittedRef = useRef(value || '');

  // Đồng bộ từ prop `value` bên ngoài vào 3 ô (khi mở modal hoặc bấm chọn nhanh Sổ địa chỉ)
  useEffect(() => {
    const incoming = (value || '').trim();
    if (incoming === lastEmittedRef.current) return;
    lastEmittedRef.current = incoming;
    const parsed = parseFullAddress2Tier(incoming);
    setProvince(parsed.province || '');
    setWard(parsed.ward || '');
    setStreet(parsed.street || '');
  }, [value]);

  // Hàm cập nhật 3 trường và đẩy chuỗi `[Số nhà/Đường, ]<Phường/Xã>, <Tỉnh/Thành phố>` ra onChange
  const emitAddressChange = (nextStreet, nextWard, nextProvince) => {
    const formatted = formatFullAddress2Tier({
      street: nextStreet,
      ward: nextWard,
      province: nextProvince
    });
    lastEmittedRef.current = formatted;
    if (onChange) {
      onChange(formatted);
    }
  };

  const handleProvinceChange = (e) => {
    const rawVal = e.target.value;
    const matched = matchProvinceName(rawVal);
    setProvince(matched);
    // Khi đổi Tỉnh/Thành phố, giữ nguyên hoặc xóa xã/phường cũ nếu muốn chọn lại nhanh
    emitAddressChange(street, ward, matched);
  };

  const handleWardChange = (e) => {
    const nextWard = e.target.value;
    setWard(nextWard);
    emitAddressChange(street, nextWard, province);
  };

  const handleStreetChange = (e) => {
    const nextStreet = e.target.value;
    setStreet(nextStreet);
    emitAddressChange(nextStreet, ward, province);
  };

  // Tìm kiếm thêm Phường/Xã theo Tỉnh từ OpenStreetMap Nominatim khi người dùng gõ
  useEffect(() => {
    const q = ward.trim();
    if (!province || q.length < 2) {
      setRemoteWards([]);
      return;
    }

    const staticWards = getWardsByProvince(province);
    // Nếu người dùng vừa chọn đúng 1 phường có sẵn trong danh sách tĩnh thì không cần gọi API
    if (staticWards.includes(q)) {
      setRemoteWards([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingWard(true);
      try {
        const queryStr = `${q}, ${province}, Việt Nam`;
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          queryStr
        )}&countrycodes=vn&addressdetails=1&accept-language=vi&limit=6`;
        const res = await fetch(url, {
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          const suggestions = [];
          for (const item of data) {
            const addr = item.address || {};
            const candidate =
              addr.suburb ||
              addr.quarter ||
              addr.village ||
              addr.town ||
              addr.neighbourhood ||
              (item.name && /^(Phường|Xã|Đặc khu|Thị trấn)/i.test(item.name) ? item.name : '');
            if (
              candidate &&
              !/^(Quận|Huyện)\s+/i.test(candidate) &&
              !staticWards.includes(candidate) &&
              !suggestions.includes(candidate)
            ) {
              suggestions.push(candidate);
            }
          }
          setRemoteWards(suggestions);
        }
      } catch (_) {
        // Bỏ qua lỗi mạng khi gợi ý phụ
      } finally {
        setIsSearchingWard(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [ward, province]);

  // Xử lý bấm nút Định vị GPS
  const handleLocateGPS = () => {
    setGpsStatus({ type: '', message: '' });

    if (!navigator.geolocation) {
      setGpsStatus({
        type: 'error',
        message: 'Thiết bị hoặc trình duyệt của bạn không hỗ trợ định vị GPS!'
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=vi`;
          const res = await fetch(url, {
            headers: {
              Accept: 'application/json'
            }
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const data = await res.json();
          const addr = data.address || {};

          // 1. Lấy Tỉnh/Thành phố (chuẩn hóa về 34 Tỉnh/Thành phố mới)
          const rawProvince = addr.city || addr.province || addr.state || '';
          const detectedProvince = matchProvinceName(rawProvince);

          // 2. Lấy Phường/Xã trực thuộc Tỉnh/Thành phố (bỏ cấp Quận/Huyện cũ)
          const rawWard =
            addr.suburb ||
            addr.quarter ||
            addr.village ||
            addr.town ||
            addr.neighbourhood ||
            normalizeWardFromNominatim(addr) ||
            '';
          const detectedWard = rawWard.replace(/^(Quận|Huyện)\s+/i, 'Phường ').trim();

          // 3. Lấy Số nhà / Tên đường
          const detectedStreet = [addr.house_number, addr.road].filter(Boolean).join(' ').trim();

          setProvince(detectedProvince);
          setWard(detectedWard);
          if (detectedStreet) {
            setStreet(detectedStreet);
          }

          const finalStreet = detectedStreet || street;
          const fullAddr = formatFullAddress2Tier({
            street: finalStreet,
            ward: detectedWard,
            province: detectedProvince
          });

          if (fullAddr) {
            lastEmittedRef.current = fullAddr;
            if (onChange) onChange(fullAddr);
            setGpsStatus({
              type: 'success',
              message: 'Đã định vị GPS thành công!'
            });
          } else if (data.display_name) {
            const parsedFallback = parseFullAddress2Tier(data.display_name);
            setProvince(parsedFallback.province);
            setWard(parsedFallback.ward);
            setStreet(parsedFallback.street);
            emitAddressChange(parsedFallback.street, parsedFallback.ward, parsedFallback.province);
            setGpsStatus({
              type: 'success',
              message: 'Đã định vị GPS thành công!'
            });
          } else {
            setGpsStatus({
              type: 'error',
              message: 'Đã lấy tọa độ GPS nhưng không phân giải được tên đường/phường.'
            });
          }
        } catch (err) {
          setGpsStatus({
            type: 'error',
            message: 'Không thể kết nối dịch vụ bản đồ OpenStreetMap để lấy địa chỉ. Vui lòng thử lại!'
          });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        let errMsg = 'Không thể lấy vị trí GPS. Vui lòng kiểm tra quyền Vị trí (Location) của ứng dụng!';
        if (error.code === 1) {
          errMsg = 'Bạn đã từ chối quyền truy cập Vị trí (GPS). Vui lòng cấp quyền Vị trí trong Cài đặt để tự động điền!';
        } else if (error.code === 2) {
          errMsg = 'Không tìm thấy tín hiệu GPS. Hãy bật Vị trí (Location) trên điện thoại/máy tính của bạn!';
        } else if (error.code === 3) {
          errMsg = 'Hết thời gian chờ định vị GPS (10 giây). Vui lòng thử lại ở nơi thoáng sóng!';
        }
        setGpsStatus({
          type: 'error',
          message: errMsg
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  const staticWardOptions = getWardsByProvince(province);
  const allWardSuggestions = [...staticWardOptions, ...remoteWards];

  // Kiểm tra xem province hiện tại có nằm sẵn trong 34 tỉnh thành chuẩn hay không
  const isCustomProvince =
    province && !VIETNAM_PROVINCES_2_TIER.some((p) => p.name === province);

  return (
    <div className="space-y-2.5 rounded-2xl bg-emerald-50/40 border border-emerald-900/10 p-3 sm:p-3.5 text-xs">
      {/* Thanh tiêu đề + Nút Định vị GPS */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base text-emerald-700">location_on</span>
          <span className="font-bold text-gray-800">
            {label} {required && <span className="text-red-500">*</span>}
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
            Tỉnh/TP → Phường/Xã
          </span>
        </div>

        <button
          type="button"
          onClick={handleLocateGPS}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold text-[11px] shadow-sm transition-all disabled:opacity-60 cursor-pointer"
          title="Tự động lấy Tỉnh/Thành phố, Phường/Xã và Số nhà/Đường qua GPS"
        >
          <span className="material-symbols-outlined text-sm">
            {isLocating ? 'progress_activity' : 'my_location'}
          </span>
          <span>{isLocating ? 'Đang định vị GPS...' : 'Định vị GPS'}</span>
        </button>
      </div>

      {/* Thông báo trạng thái GPS */}
      {gpsStatus.message && (
        <div
          className={`px-3 py-2 rounded-xl text-[11px] font-bold flex items-center justify-between gap-2 ${
            gpsStatus.type === 'success'
              ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm shrink-0">
              {gpsStatus.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{gpsStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setGpsStatus({ type: '', message: '' })}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Bố cục 2 cấp hành chính mới: Ô 1 (Tỉnh/Thành phố) + Ô 2 (Phường/Xã/Đặc khu) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Ô 1: Tỉnh / Thành phố */}
        <div>
          <label className="block font-bold text-gray-700 mb-1 text-[11px]">
            1. Tỉnh / Thành phố {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={province}
            onChange={handleProvinceChange}
            required={required && !value}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-emerald-600 font-semibold text-xs text-gray-800 cursor-pointer"
          >
            <option value="">-- Chọn Tỉnh / Thành phố --</option>
            {isCustomProvince && <option value={province}>{province}</option>}
            <optgroup label="34 Tỉnh / Thành phố (Chuẩn hành chính 2 cấp mới)">
              {VIETNAM_PROVINCES_2_TIER.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Tỉnh / Thành quen thuộc (Tự động quy chiếu)">
              {LEGACY_PROVINCE_SHORTCUTS.map((legacyName) => (
                <option key={legacyName} value={legacyName}>
                  {legacyName} → ({matchProvinceName(legacyName)})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Ô 2: Phường / Xã / Đặc khu trực thuộc Tỉnh/Thành phố (không qua Quận/Huyện) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-bold text-gray-700 text-[11px]">
              2. Phường / Xã / Đặc khu {required && <span className="text-red-500">*</span>}
            </label>
            {isSearchingWard && (
              <span className="text-[10px] text-emerald-700 font-semibold">Đang tìm...</span>
            )}
          </div>
          <input
            type="text"
            list={datalistId}
            value={ward}
            onChange={handleWardChange}
            required={required && !value}
            placeholder={
              province
                ? `Chọn hoặc gõ Phường/Xã thuộc ${province}`
                : 'Chọn hoặc gõ Phường / Xã / Đặc khu'
            }
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-emerald-600 font-semibold text-xs text-gray-800"
          />
          <datalist id={datalistId}>
            {allWardSuggestions.map((w) => (
              <option key={w} value={w} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Gợi ý chọn nhanh Phường/Xã phổ biến của Tỉnh/Thành đã chọn */}
      {province && staticWardOptions.length > 0 && !compact && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-bold text-gray-500 shrink-0">Phổ biến:</span>
          {staticWardOptions.slice(0, 6).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => {
                setWard(w);
                emitAddressChange(street, w, province);
              }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                ward === w
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      )}

      {/* Ô 3: Số nhà, tên đường / ấp / khóm */}
      <div>
        <label className="block font-bold text-gray-700 mb-1 text-[11px]">
          3. Số nhà, tên đường / ấp / khóm (tùy chọn)
        </label>
        <input
          type="text"
          value={street}
          onChange={handleStreetChange}
          placeholder="VD: Số 123 Đường 3/2, Ấp Mỹ Khánh..."
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-emerald-600 font-medium text-xs text-gray-800"
        />
      </div>

      {/* Hiển thị chuỗi địa chỉ chuẩn 2 cấp đã ghép hoặc cho phép sửa trực tiếp */}
      <div className="pt-1 border-t border-emerald-900/10 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-emerald-700">pin_drop</span>
            <span>Địa chỉ hiển thị (2 cấp: Phường/Xã, Tỉnh/Thành phố):</span>
          </span>
          <button
            type="button"
            onClick={() => setIsDirectEdit((prev) => !prev)}
            className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            {isDirectEdit ? 'Đóng sửa trực tiếp' : 'Sửa trực tiếp'}
          </button>
        </div>

        {isDirectEdit ? (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => {
              const raw = e.target.value;
              lastEmittedRef.current = raw;
              if (onChange) onChange(raw);
              const parsed = parseFullAddress2Tier(raw);
              setProvince(parsed.province || '');
              setWard(parsed.ward || '');
              setStreet(parsed.street || '');
            }}
            placeholder="Nhập địa chỉ: Số nhà/Đường, Phường/Xã, Tỉnh/Thành phố"
            className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white focus:outline-emerald-600 font-semibold text-xs text-gray-900"
          />
        ) : (
          <div className="px-3 py-2 rounded-xl bg-white/90 border border-gray-200 text-xs font-semibold text-gray-800 min-h-[34px] flex items-center">
            {value ? (
              <span>{value}</span>
            ) : (
              <span className="text-gray-400 font-normal italic">
                Chưa chọn địa chỉ — Hãy bấm &quot;Định vị GPS&quot; hoặc chọn Tỉnh/Thành phố &amp; Phường/Xã ở trên
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
