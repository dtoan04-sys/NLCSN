import { Capacitor } from '@capacitor/core';

// URL Cloud Backend (Hugging Face Spaces / Render / Cloudflare Tunnel) & IP LAN mặc định
export const ENV_API_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
export const DEFAULT_TUNNEL_URL = ENV_API_URL || 'https://cooler-terminals-vote-players.trycloudflare.com';
export const DEFAULT_LAN_URL = 'http://192.168.1.23:8000';
export const CUSTOM_API_STORAGE_KEY = 'florabotanic_custom_api_url';
export const TOKEN_STORAGE_KEY = 'florabotanic_token';
export const DEFAULT_API_TIMEOUT_MS = 15000;
export const AI_INFERENCE_TIMEOUT_MS = 120000;
const RETRYABLE_STATUSES = new Set([502, 503, 504, 530]);

export function normalizeApiUrl(rawUrl) {
  const trimmed = (rawUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})(:\d+)?$/i.test(trimmed)) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
}

function getSavedCustomApiUrl() {
  try {
    const saved = localStorage.getItem(CUSTOM_API_STORAGE_KEY);
    if (saved && saved.trim()) {
      const normalized = normalizeApiUrl(saved);
      if (/^https?:\/\/.+/i.test(normalized)) {
        return normalized;
      }
    }
  } catch (_) {}
  return '';
}

function clearSavedCustomApiUrl() {
  try {
    localStorage.removeItem(CUSTOM_API_STORAGE_KEY);
  } catch (_) {}
}

export function getApiBaseUrl() {
  const savedCustom = getSavedCustomApiUrl();
  if (savedCustom) {
    return savedCustom;
  }

  if (ENV_API_URL) {
    return ENV_API_URL;
  }

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

  // Trên Android APK hoặc HTTPS từ xa (Vercel / Netlify): ưu tiên DEFAULT_TUNNEL_URL
  return DEFAULT_TUNNEL_URL;
}

export const API_BASE_URL = getApiBaseUrl();

export function setCustomApiBaseUrl(url) {
  try {
    const clean = normalizeApiUrl(url);
    if (clean) {
      localStorage.setItem(CUSTOM_API_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(CUSTOM_API_STORAGE_KEY);
    }
  } catch (_) {}
}

export function getApiCandidates() {
  const candidates = [];
  const pushUnique = (u) => {
    const clean = (u || '').trim().replace(/\/+$/, '');
    if (clean && !candidates.includes(clean)) {
      candidates.push(clean);
    }
  };

  const savedCustom = getSavedCustomApiUrl();
  if (savedCustom) pushUnique(savedCustom);
  if (ENV_API_URL) pushUnique(ENV_API_URL);

  if (Capacitor.isNativePlatform()) {
    // Trên Android APK: Custom URL hợp lệ -> DEFAULT_TUNNEL_URL (4G/Wi-Fi) -> DEFAULT_LAN_URL
    pushUnique(DEFAULT_TUNNEL_URL);
    pushUnique(DEFAULT_LAN_URL);
  } else {
    pushUnique(getApiBaseUrl());
    pushUnique(DEFAULT_TUNNEL_URL);
    pushUnique(DEFAULT_LAN_URL);
    pushUnique('http://localhost:8000');
  }

  return candidates;
}

// Kiểm tra kết nối /health trực tiếp (nếu truyền targetUrl) hoặc theo chuỗi fallback tự động
export async function checkApiHealth(targetUrl = '', timeoutMs = 8000) {
  const explicitTarget = normalizeApiUrl(targetUrl);
  const savedCustom = getSavedCustomApiUrl();
  const candidates = explicitTarget ? [explicitTarget] : getApiCandidates();

  let lastResult = {
    ok: false,
    url: candidates[0] || DEFAULT_TUNNEL_URL,
    status: 0,
    ms: 0,
    data: null,
    error: 'Không có URL Server để kiểm tra'
  };

  for (let i = 0; i < candidates.length; i++) {
    const base = candidates[i];
    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${base}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timer);
      const ms = Date.now() - start;
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        let clearedDeadCustomUrl = false;
        if (!explicitTarget && savedCustom && base !== savedCustom) {
          clearSavedCustomApiUrl();
          clearedDeadCustomUrl = true;
        }
        return {
          ok: true,
          url: base,
          status: res.status,
          ms,
          data,
          error: '',
          clearedDeadCustomUrl
        };
      }

      lastResult = {
        ok: false,
        url: base,
        status: res.status,
        ms,
        data,
        error: `HTTP ${res.status}`
      };

      if (!RETRYABLE_STATUSES.has(res.status)) {
        return lastResult;
      }
    } catch (err) {
      clearTimeout(timer);
      const ms = Date.now() - start;
      lastResult = {
        ok: false,
        url: base,
        status: 0,
        ms,
        data: null,
        error: err?.name === 'AbortError' ? `Hết thời gian chờ (${Math.round(timeoutMs / 1000)}s)` : 'Lỗi mạng / Tunnel không phản hồi'
      };
    }
  }

  return lastResult;
}

// Hàm fetch thông minh tự động dự phòng (Custom URL -> ENV Cloud URL -> Tunnel -> LAN IP -> Localhost)
// Tự động dọn Custom URL cũ bị chết (530/502/503/504/timeout/network error) khi fallback thành công
export async function apiFetch(path, options = {}) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const savedCustom = getSavedCustomApiUrl();
  const candidates = getApiCandidates();

  const isAiInference = /^\/(api\/)?nhan-dien/i.test(cleanPath);
  const {
    timeoutMs = isAiInference ? AI_INFERENCE_TIMEOUT_MS : DEFAULT_API_TIMEOUT_MS,
    signal: externalSignal,
    headers: rawHeaders,
    ...restOptions
  } = options;

  // Tự động gắn Authorization: Bearer <token> nếu có trong localStorage và caller chưa ghi đè
  const headers = new Headers(rawHeaders || {});
  if (!headers.has('Authorization')) {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token && token.trim()) {
        headers.set('Authorization', `Bearer ${token.trim()}`);
      }
    } catch (_) {}
  }

  const method = String(restOptions.method || 'GET').toUpperCase();
  const isSafeRetryMethod = method === 'GET' || method === 'HEAD';
  let lastErr = null;
  let lastRetryableRes = null;

  for (let i = 0; i < candidates.length; i++) {
    const base = candidates[i];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) {
        clearTimeout(timer);
        throw new DOMException('Aborted', 'AbortError');
      }
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }

    try {
      const res = await fetch(`${base}${cleanPath}`, {
        ...restOptions,
        headers,
        signal: controller.signal
      });
      clearTimeout(timer);
      if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);

      if (RETRYABLE_STATUSES.has(res.status)) {
        lastRetryableRes = res;
        if (isSafeRetryMethod && i < candidates.length - 1) {
          continue;
        }
        return res;
      }

      // Nếu URL tùy chỉnh cũ bị chết và fallback sang DEFAULT_TUNNEL_URL / DEFAULT_LAN_URL thành công -> xóa URL cũ
      if (savedCustom && base !== savedCustom) {
        clearSavedCustomApiUrl();
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
      lastErr = err;
      if (externalSignal?.aborted || !isSafeRetryMethod) {
        throw err;
      }
    }
  }

  if (lastRetryableRes) {
    return lastRetryableRes;
  }
  throw lastErr || new Error('Không thể kết nối đến Backend AI Service');
}
