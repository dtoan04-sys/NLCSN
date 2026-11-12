import React, { useState, useRef, useEffect } from 'react';
import { apiFetch, getApiBaseUrl } from '../config';

export default function ImageUpload({
  onImageChange,
  currentImage = null,
  label = 'Hình ảnh chậu cây thực tế:',
  hint = 'JPG, PNG hoặc WEBP (Kéo thả hoặc bấm để tải ảnh từ máy)',
  defaultSpeciesImage = null,
  onResetToDefault = null
}) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);
  const blobUrlRef = useRef(null);

  // Cập nhật preview khi currentImage hoặc defaultSpeciesImage thay đổi
  useEffect(() => {
    if (currentImage) {
      if (
        currentImage.startsWith('http') ||
        currentImage.startsWith('blob:') ||
        currentImage.startsWith('data:image')
      ) {
        setPreview(currentImage);
      } else {
        const base = getApiBaseUrl();
        setPreview(`${base}${currentImage.startsWith('/') ? '' : '/'}${currentImage}`);
      }
    } else if (defaultSpeciesImage) {
      setPreview(defaultSpeciesImage);
    } else {
      setPreview(null);
    }
  }, [currentImage, defaultSpeciesImage]);

  // Dọn dẹp bộ nhớ Blob URL khi unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (JPG, PNG, WEBP)!');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước ảnh quá lớn (>10MB). Vui lòng chọn ảnh nhỏ hơn!');
      return;
    }

    // 1. Tạo Blob URL để hiển thị tức thì
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    const newBlobUrl = URL.createObjectURL(file);
    blobUrlRef.current = newBlobUrl;
    setPreview(newBlobUrl);

    // 2. Upload file lên Backend AI Service (/api/upload)
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        // Trả URL từ backend về cho form (VD: /uploads/prod_1731370000.jpg)
        if (onImageChange) {
          onImageChange(data.url, file);
        }
      } else {
        // Fallback: nếu backend chưa có endpoint upload thì dùng Blob hoặc base64
        if (onImageChange) {
          onImageChange(newBlobUrl, file);
        }
      }
    } catch (err) {
      console.warn('Lỗi tải ảnh lên backend, dùng preview:', err);
      if (onImageChange) {
        onImageChange(newBlobUrl, file);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onContainerClick = (e) => {
    e.stopPropagation();
    inputRef.current?.click();
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="font-bold text-gray-700 block text-xs">{label}</label>
        {defaultSpeciesImage && onResetToDefault && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onResetToDefault();
            }}
            className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold underline"
          >
            Dùng ảnh mẫu của loài
          </button>
        )}
      </div>

      <div
        className={`relative border-2 border-dashed rounded-2xl p-3 sm:p-4 flex items-center gap-4 transition-all cursor-pointer group ${
          dragActive
            ? 'border-emerald-600 bg-emerald-50/60 scale-[1.01]'
            : 'border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/30 bg-gray-50/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onContainerClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {/* Khung hiển thị ảnh xem trước */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border border-gray-200 p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
              onError={() => setPreview(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-emerald-600 transition-colors">
              <span className="material-symbols-outlined text-2xl sm:text-3xl">
                add_photo_alternate
              </span>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            </div>
          )}
        </div>

        {/* Nội dung text hướng dẫn */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800">
            {isUploading ? (
              <span className="text-amber-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                Đang tải ảnh lên hệ thống...
              </span>
            ) : preview ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>Đã chọn ảnh chậu cây</span>
                <span className="text-gray-400 font-normal ml-1 text-[11px] underline group-hover:text-emerald-800">
                  (Bấm để đổi ảnh)
                </span>
              </span>
            ) : (
              <>
                Kéo thả ảnh vào đây hoặc{' '}
                <span className="text-emerald-700 font-bold underline group-hover:text-emerald-800">
                  tải từ máy tính/điện thoại
                </span>
              </>
            )}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">{hint}</p>
        </div>
      </div>
    </div>
  );
}
