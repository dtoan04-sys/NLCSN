import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiBaseUrl } from '../config';

const HistoryContext = createContext();

const HISTORY_STORAGE_KEY = 'florabotanic_scan_history_v2';
const MAX_HISTORY_ITEMS = 30;

function safeSaveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    try {
      if (Array.isArray(value)) {
        const trimmed = value.slice(0, 10).map((item, idx) => {
          if (idx > 2 && item.imageUrl && item.imageUrl.startsWith('data:image/')) {
            return { ...item, imageUrl: item.fallbackImg || '/plants/54.jpg' };
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(trimmed));
      }
    } catch (_) {
      try {
        localStorage.removeItem(key);
      } catch (__) {}
    }
    return false;
  }
}

export function HistoryProvider({ children }) {
  const [history, setHistory] = useState(() => {
    try {
      localStorage.removeItem('florabotanic_scan_history');
      localStorage.removeItem('florabotanic_my_garden_v1');
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    safeSaveToStorage(HISTORY_STORAGE_KEY, history.slice(0, MAX_HISTORY_ITEMS));
  }, [history]);

  // Thêm lần nhận diện mới (Nhẹ < 25KB, không gây đầy bộ nhớ Android WebView)
  const addScanRecord = ({ imageUrl, thumbnailDataUrl, result, userId = null }) => {
    const rawMaLoai = result?.ma_loai_cay ?? result?.MaLoaiCay;
    const rawClassId = result?.class_id;
    let speciesId = 54;
    if (rawMaLoai !== undefined && rawMaLoai !== null && Number(rawMaLoai) >= 1 && Number(rawMaLoai) <= 91) {
      speciesId = Number(rawMaLoai);
    } else if (rawClassId !== undefined && rawClassId !== null && Number(rawClassId) >= 0 && Number(rawClassId) < 91) {
      speciesId = Number(rawClassId) + 1;
    }
    const fallbackImg = `/plants/${speciesId}.jpg`;

    const isPersistableImage = (url) =>
      typeof url === 'string' &&
      url.length > 0 &&
      !url.startsWith('blob:') &&
      (!url.startsWith('data:') || url.length < 45000);

    let safeImgUrl = fallbackImg;
    if (result?.duong_dan_anh) {
      safeImgUrl = result.duong_dan_anh;
    } else if (isPersistableImage(thumbnailDataUrl)) {
      safeImgUrl = thumbnailDataUrl;
    } else if (isPersistableImage(imageUrl)) {
      safeImgUrl = imageUrl;
    }

    const rawAcc = Number(result?.do_chinh_xac ?? 0);
    const normalizedAcc = rawAcc > 1 ? rawAcc / 100 : rawAcc;

    const isMulti = Boolean(result?.is_multi);
    const compactMultiPlants = isMulti && Array.isArray(result?.danh_sach_cay)
      ? result.danh_sach_cay.slice(0, 8).map((p, idx) => ({
          stt: p.stt || idx + 1,
          maloaicay: p.maloaicay || 1,
          tenthuonggoi: p.tenthuonggoi || '',
          tenkhoahoc: p.tenkhoahoc || '',
          do_chinh_xac: p.do_chinh_xac ?? 0,
          mau_sac: p.mau_sac || '#00FF66',
          crop_image: p.crop_image || null
        }))
      : [];

    const primarySpeciesName =
      result?.primary_species_name ||
      compactMultiPlants[0]?.tenthuonggoi ||
      result?.loai_du_doan ||
      'Cây kiểng lá';

    const newRecord = {
      id: Date.now(),
      matimkiem: result?.matimkiem ?? result?.MaTimKiem ?? null,
      userId,
      speciesId,
      imageUrl: safeImgUrl,
      fallbackImg,
      predictedName: result?.loai_du_doan || 'Cây kiểng lá',
      primarySpeciesName,
      originalLabel: result?.loai_goc || '',
      accuracy: normalizedAcc,
      topK: result?.top_k || [],
      isMulti,
      multiPlants: compactMultiPlants,
      platform: window.AndroidNative ? 'ANDROID' : 'WEB',
      timestamp: new Date().toISOString(),
      feedback: null
    };

    setHistory((prev) => [newRecord, ...prev.slice(0, MAX_HISTORY_ITEMS - 1)]);
    return newRecord;
  };

  const submitFeedback = (scanId, isCorrect, note = '') => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === scanId
          ? {
              ...item,
              feedback: {
                isCorrect,
                note,
                submittedAt: new Date().toISOString()
              }
            }
          : item
      )
    );
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {}
  };

  return (
    <HistoryContext.Provider
      value={{
        history,
        addScanRecord,
        submitFeedback,
        clearHistory
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}
