import { Capacitor } from '@capacitor/core';

// URL Cloudflare Tunnel & IP LAN mặc định cho Backend AI Service (Port 8000)
export const DEFAULT_TUNNEL_URL = 'https://qualifications-holder-brown-says.trycloudflare.com';
export const DEFAULT_LAN_URL = 'http://192.168.1.23:8000';
export const CUSTOM_API_STORAGE_KEY = 'florabotanic_custom_api_url';

export function getApiBaseUrl() {
  try {
    const saved = localStorage.getItem(CUSTOM_API_STORAGE_KEY);
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  } catch (_) {}

  // Nếu đang mở trực tiếp trên trình duyệt Web (máy tính hoặc điện thoại)
  if (!Capacitor.isNativePlatform() && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    if (host.endsWith('.trycloudflare.com') || window.location.port === '8000') {
      return window.location.origin;
    }
    if (window.location.protocol === 'http:' && host) {
      return `http://${host}:8000`;
    }
  }

  // Trên Android APK hoặc HTTPS từ xa: ưu tiên Cloudflare Tunnel
  return DEFAULT_TUNNEL_URL;
}

export const API_BASE_URL = getApiBaseUrl();

export function setCustomApiBaseUrl(url) {
  try {
    const clean = (url || '').trim().replace(/\/+$/, '');
    if (clean) {
      localStorage.setItem(CUSTOM_API_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(CUSTOM_API_STORAGE_KEY);
    }
  } catch (_) {}
}

// Hàm fetch thông minh tự động dự phòng (Custom URL -> Tunnel -> LAN IP -> Localhost)
export async function apiFetch(path, options = {}) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const candidates = [];

  const primary = getApiBaseUrl();
  if (primary) candidates.push(primary);

  if (Capacitor.isNativePlatform()) {
    if (!candidates.includes(DEFAULT_TUNNEL_URL)) candidates.push(DEFAULT_TUNNEL_URL);
    if (!candidates.includes(DEFAULT_LAN_URL)) candidates.push(DEFAULT_LAN_URL);
  } else {
    if (!candidates.includes('http://localhost:8000')) candidates.push('http://localhost:8000');
    if (!candidates.includes(DEFAULT_TUNNEL_URL)) candidates.push(DEFAULT_TUNNEL_URL);
  }

  let lastErr = null;
  for (let i = 0; i < candidates.length; i++) {
    const base = candidates[i];
    try {
      const res = await fetch(`${base}${cleanPath}`, options);
      // Cloudflare Quick Tunnel trả về HTTP 530 khi tunnel cũ đã hết hạn
      if (res.status === 530 && i < candidates.length - 1) {
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Không thể kết nối đến Backend AI Service');
}
