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
    const classId = result?.ma_loai_cay ?? result?.class_id ?? 53;
    const speciesId = (Number(classId) >= 0 && Number(classId) < 90) ? Number(classId) + 1 : 54;
    const fallbackImg = `/plants/${speciesId}.jpg`;

    let safeImgUrl = fallbackImg;
    if (result?.duong_dan_anh) {
      const base = getApiBaseUrl();
      safeImgUrl = result.duong_dan_anh.startsWith('http')
        ? result.duong_dan_anh
        : `${base}${result.duong_dan_anh}`;
    } else if (thumbnailDataUrl && thumbnailDataUrl.length < 45000) {
      safeImgUrl = thumbnailDataUrl;
    } else if (imageUrl && (!imageUrl.startsWith('data:') || imageUrl.length < 45000)) {
      safeImgUrl = imageUrl;
    }

    const newRecord = {
      id: Date.now(),
      userId,
      speciesId,
      imageUrl: safeImgUrl,
      fallbackImg,
      predictedName: result?.loai_du_doan || 'Cây kiểng lá',
      originalLabel: result?.loai_goc || '',
      accuracy: result?.do_chinh_xac || 0,
      topK: result?.top_k || [],
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
