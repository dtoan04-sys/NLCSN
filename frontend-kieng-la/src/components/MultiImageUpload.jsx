import React, { useState, useRef } from 'react';
import { apiFetch } from '../config';

export default function MultiImageUpload({
  label = 'Album hình ảnh chậu cây thực tế:',
  images = [],
  onChange,
  maxImages = 10
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlBox, setShowUrlBox] = useState(false);
  const fileInputRef = useRef(null);

  // Normalize image list: ensure format [{ url: string, isMain: boolean }]
  const normalizedImages = (images || []).map((img, idx) => {
    if (typeof img === 'string') {
      return { url: img, isMain: idx === 0 };
    }
    return {
      url: img.url || img.UrlAnh || '',
      isMain: Boolean(img.isMain || img.LaAnhChinh || idx === 0 && !images.some(i => i.isMain || i.LaAnhChinh))
    };
  });

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      throw new Error(`Upload ảnh "${file.name}" thất bại (${res.status})`);
    }
    const data = await res.json();
    return data.url;
  };

  const handleFilesSelected = async (files) => {
    if (!files || files.length === 0) return;
    setUploadError('');
    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map((f) => uploadFile(f));
      const uploadedUrls = await Promise.all(uploadPromises);

      let updated = [...normalizedImages];
      uploadedUrls.forEach((u) => {
        if (updated.length < maxImages) {
          const isFirst = updated.length === 0;
          updated.push({ url: u, isMain: isFirst });
        }
      });

      // Ensure at least one is main
      if (!updated.some((i) => i.isMain) && updated.length > 0) {
        updated[0].isMain = true;
      }

      onChange(updated);
    } catch (err) {
      setUploadError(err.message || 'Lỗi tải ảnh lên hệ thống');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetMain = (index) => {
    const updated = normalizedImages.map((img, idx) => ({
      ...img,
      isMain: idx === index
    }));
    onChange(updated);
  };

  const handleRemoveImage = (index) => {
    const wasMain = normalizedImages[index]?.isMain;
    let updated = normalizedImages.filter((_, idx) => idx !== index);
    if (wasMain && updated.length > 0) {
      updated[0].isMain = true;
    }
    onChange(updated);
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    let updated = [...normalizedImages];
    if (updated.length < maxImages) {
      const isFirst = updated.length === 0;
      updated.push({ url: urlInput.trim(), isMain: isFirst });
      if (!updated.some((i) => i.isMain) && updated.length > 0) {
        updated[0].isMain = true;
      }
      onChange(updated);
      setUrlInput('');
      setShowUrlBox(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-bold text-gray-700 text-xs block">
          {label}
        </label>
        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
          {normalizedImages.length}/{maxImages} ảnh (Chọn 1 ảnh làm ảnh chính)
        </span>
      </div>

      {/* Grid danh sách ảnh đã upload */}
      {normalizedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {normalizedImages.map((img, idx) => (
            <div
              key={idx}
              className={`relative rounded-2xl overflow-hidden border-2 transition-all p-1 bg-white shadow-xs group ${
                img.isMain
                  ? 'border-[#ffd400] ring-2 ring-[#ffd400]/40'
                  : 'border-gray-200 hover:border-emerald-400'
              }`}
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative">
                <img
                  src={img.url}
                  alt={`Ảnh #${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/plants/1.jpg';
                  }}
                />

                {/* Badge Ảnh chính */}
                {img.isMain && (
                  <div className="absolute top-2 left-2 bg-[#ffd400] text-[#003822] text-[10px] font-black px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 select-none">
                    <span className="material-symbols-outlined text-[13px]">star</span>
                    <span>Ảnh chính</span>
                  </div>
                )}

                {/* Nút Xóa ảnh */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-sm"
                  title="Xóa ảnh này"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>

              {/* Action bên dưới ảnh */}
              <div className="pt-2 pb-1 px-1 flex items-center justify-between">
                {img.isMain ? (
                  <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    <span>Hiển thị ở bìa</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetMain(idx)}
                    className="text-[10px] font-bold text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-1 rounded-lg border border-gray-200 hover:border-emerald-300 transition-all flex items-center gap-1 w-full justify-center"
                  >
                    <span className="material-symbols-outlined text-xs">star_border</span>
                    <span>Đặt làm ảnh chính</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vùng Dropzone tải nhiều ảnh */}
      {normalizedImages.length < maxImages && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files) {
              handleFilesSelected(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-emerald-600 bg-emerald-50'
              : 'border-gray-300 hover:border-emerald-500 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />

          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">
                {isUploading ? 'progress_activity' : 'add_photo_alternate'}
              </span>
            </div>

            {isUploading ? (
              <p className="text-xs font-bold text-emerald-800 animate-pulse">
                Đang tải các ảnh lên hệ thống...
              </p>
            ) : (
              <>
                <p className="text-xs font-bold text-gray-800">
                  Kéo thả hoặc <span className="text-emerald-700 underline">chọn nhiều ảnh</span> cùng lúc
                </p>
                <p className="text-[11px] text-gray-400">
                  Hỗ trợ JPG, PNG, WEBP — Tối đa {maxImages} ảnh cho 1 chậu cây
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tùy chọn thêm ảnh từ URL */}
      <div className="flex items-center justify-between text-xs pt-1">
        <button
          type="button"
          onClick={() => setShowUrlBox(!showUrlBox)}
          className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">link</span>
          <span>{showUrlBox ? 'Ẩn nhập URL' : '+ Thêm ảnh bằng đường dẫn URL'}</span>
        </button>

        {uploadError && (
          <span className="text-[11px] font-bold text-red-600">{uploadError}</span>
        )}
      </div>

      {showUrlBox && (
        <form onSubmit={handleAddUrl} className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Dán link ảnh (https://... hoặc /plants/1.jpg)"
            className="flex-1 p-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-emerald-600"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900"
          >
            Thêm
          </button>
        </form>
      )}
    </div>
  );
}
