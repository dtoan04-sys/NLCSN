import React from 'react';
import { useHistory } from '../context/HistoryContext';

export default function HistoryModal({ isOpen, onClose, onSelectSpecies }) {
  const { history, submitFeedback, clearHistory } = useHistory();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-[#012d1d] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
              <span className="material-symbols-outlined text-2xl">image_search</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Lịch Sử Quét &amp; Tìm Kiếm Cây</h2>
              <p className="text-[11px] text-emerald-200/80">
                Các mẫu kiểng lá bạn từng chụp để tìm mua chậu cây tại vườn
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-red-300 hover:text-red-200 font-semibold px-2.5 py-1 rounded-lg bg-white/10 transition-colors"
              >
                Xóa lịch sử
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-xl text-white/80 hover:bg-white/10">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {history.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-gray-400 text-center space-y-3">
              <span className="material-symbols-outlined text-6xl text-gray-300">image_search</span>
              <p className="font-semibold text-gray-700">Chưa có lịch sử tìm kiếm cây nào</p>
              <p className="text-xs max-w-sm text-gray-400">
                Khi bạn quét ảnh một chiếc lá cây, hệ thống AI sẽ phân loại và lưu tại đây để bạn có thể xem lại và đặt mua chậu cây bất cứ lúc nào.
              </p>
            </div>
          ) : (
            history.map((record) => {
              const topAcc = ((record.accuracy || 0) * 100).toFixed(1);
              const dateStr = new Date(record.timestamp).toLocaleString('vi-VN');
              const fallbackImg = record.fallbackImg || `/plants/${record.speciesId || 54}.jpg`;

              return (
                <div
                  key={record.id}
                  className="p-4 rounded-2xl border border-gray-100 bg-[#f8faf7] hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 items-start"
                >
                  <img
                    src={record.imageUrl || fallbackImg}
                    alt={record.predictedName}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = fallbackImg;
                    }}
                    className="w-full sm:w-28 h-28 object-cover rounded-xl bg-gray-200 border border-gray-200 flex-none"
                  />

                  <div className="flex-1 min-w-0 space-y-2 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Top 1 • Khớp {topAcc}%
                        </span>
                        <h4 className="text-base font-extrabold text-gray-900 mt-0.5">{record.predictedName}</h4>
                        <span className="text-xs text-gray-500 italic block">{record.originalLabel}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">{dateStr}</span>
                    </div>

                    {record.topK && record.topK.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {record.topK.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-white border border-gray-200 px-2 py-0.5 rounded-md text-gray-600"
                          >
                            {idx + 1}. {item.loai} ({(item.xac_suat * 100).toFixed(0)}%)
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        {record.feedback ? (
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">
                              {record.feedback.isCorrect ? 'thumb_up' : 'thumb_down'}
                            </span>
                            <span>{record.feedback.isCorrect ? 'Đã xác nhận Đúng' : 'Đã báo sai'}</span>
                          </span>
                        ) : (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => submitFeedback(record.id, true)}
                              className="px-2 py-1 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-lg font-semibold text-[11px] flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">thumb_up</span>
                              Đúng
                            </button>
                            <button
                              onClick={() => submitFeedback(record.id, false)}
                              className="px-2 py-1 bg-white border border-gray-200 hover:bg-red-50 text-gray-600 rounded-lg font-semibold text-[11px] flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">thumb_down</span>
                              Sai
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectSpecies(record.predictedName);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">storefront</span>
                        <span>Xem chậu &amp; Đặt mua</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
