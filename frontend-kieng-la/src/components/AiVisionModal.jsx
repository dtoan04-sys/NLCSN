import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useHistory } from '../context/HistoryContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch, getApiBaseUrl, setCustomApiBaseUrl } from '../config';
import { SPECIES_LIST } from '../data/mockData';

export default function AiVisionModal({ onClose, onSelectProduct, onFilterBySpecies }) {
  // State camera & ảnh
  const [isLiveCamera, setIsLiveCamera] = useState(true);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraError, setCameraError] = useState(null);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [flashOn, setFlashOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // State nhận diện AI
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState('single'); // 'single' (Đơn cây) | 'multi' (Đa cây)
  const [aiResult, setAiResult] = useState(null);
  const [multiResult, setMultiResult] = useState(null);
  const [selectedMultiIndex, setSelectedMultiIndex] = useState(0);
  const [showAnnotatedBox, setShowAnnotatedBox] = useState(true);
  const [rawFile, setRawFile] = useState(null);
  const [lastScanId, setLastScanId] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(() => getApiBaseUrl());

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const nativeCameraInputRef = useRef(null);
  const prevObjectUrlRef = useRef(null);

  const { addScanRecord, submitFeedback } = useHistory();
  const { user } = useAuth();

  // Giải phóng ObjectURL cũ để tránh rò rỉ RAM trên Android WebView
  const cleanupPreviewUrl = useCallback(() => {
    if (prevObjectUrlRef.current) {
      try {
        URL.revokeObjectURL(prevObjectUrlRef.current);
      } catch (_) {}
      prevObjectUrlRef.current = null;
    }
  }, []);

  // Dừng camera stream
  const stopCamera = useCallback(() => {
    setFlashOn(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // 1. Khởi động Live Camera stream (kích thước tối ưu 960x720 chống tràn RAM WebView)
  const startCamera = useCallback(async (mode = facingMode) => {
    stopCamera();
    try {
      setCameraError(null);
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Thiết bị không hỗ trợ Camera trực tiếp. Hãy bấm nút "Camera Gốc" bên dưới.');
      }

      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 960, max: 1280 },
          height: { ideal: 720, max: 960 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsLiveCamera(true);
    } catch (err) {
      console.warn('Không thể khởi động Live Camera:', err);
      setCameraError(err.message || 'Không thể truy cập máy ảnh trực tiếp');
      setIsLiveCamera(false);
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopCamera();
      cleanupPreviewUrl();
    };
  }, []);

  // Hỗ trợ nút Back phần cứng Android ngay trong Modal:
  // Nếu đang xem ảnh chụp -> bấm Back sẽ quay về Live Camera thay vì đóng luôn Modal
  useEffect(() => {
    window.__aiModalBackHandler = () => {
      if (!isLiveCamera && capturedUrl) {
        handleResumeLive();
        return true; // Đã xử lý nội bộ
      }
      stopCamera();
      cleanupPreviewUrl();
      onClose();
      return true;
    };
    return () => {
      delete window.__aiModalBackHandler;
    };
  }, [isLiveCamera, capturedUrl, onClose, stopCamera, cleanupPreviewUrl]);

  // Bật / tắt đèn Flash (Torch) trên Android
  const handleToggleFlash = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextFlash = !flashOn;
      await track.applyConstraints({
        advanced: [{ torch: nextFlash }]
      });
      setFlashOn(nextFlash);
      if (window.AndroidNative?.vibrate) window.AndroidNative.vibrate(25);
    } catch (_) {
      if (window.AndroidNative?.showToast) {
        window.AndroidNative.showToast('Camera hiện tại không hỗ trợ bật đèn Flash');
      }
    }
  };

  // Đổi camera trước / sau
  const handleToggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    setZoomLevel(1);
    startCamera(nextMode);
  };

  // 2. Chụp khung hình vuông có hỗ trợ Zoom & nén nhẹ chống tràn RAM
  const captureFrame = () => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const baseSide = Math.min(vw, vh);
    const cropSide = Math.floor(baseSide / zoomLevel);
    const sx = Math.floor((vw - cropSide) / 2);
    const sy = Math.floor((vh - cropSide) / 2);
    const targetSide = 640; // Kích thước chuẩn cho AI 224x224 Multi-Crop TTA, siêu nhẹ (~70KB)

    const canvas = document.createElement('canvas');
    canvas.width = targetSide;
    canvas.height = targetSide;
    const ctx = canvas.getContext('2d');

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, sx, sy, cropSide, cropSide, 0, 0, targetSide, targetSide);

    // Tạo thêm 1 thumbnail siêu nhỏ 160x160 (~7KB) để lưu lịch sử không bao giờ đầy bộ nhớ
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 160;
    thumbCanvas.height = 160;
    thumbCanvas.getContext('2d').drawImage(canvas, 0, 0, 160, 160);
    const thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.6);
    thumbCanvas.width = 0;
    thumbCanvas.height = 0;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          cleanupPreviewUrl();
          const previewUrl = blob ? URL.createObjectURL(blob) : thumbnailDataUrl;
          if (blob) prevObjectUrlRef.current = previewUrl;
          // Giải phóng bộ nhớ canvas ngay lập tức
          canvas.width = 0;
          canvas.height = 0;
          resolve({ blob, previewUrl, thumbnailDataUrl });
        },
        'image/jpeg',
        0.88
      );
    });
  };

  // Nén file ảnh chụp từ Camera Gốc Android (12MP-48MP) xuống 640x640 trước khi xử lý để chống văng App do hết RAM
  const compressSelectedFile = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const tempUrl = URL.createObjectURL(file);
      img.onload = () => {
        const vw = img.naturalWidth || img.width;
        const vh = img.naturalHeight || img.height;
        const side = Math.min(vw, vh);
        const sx = Math.floor((vw - side) / 2);
        const sy = Math.floor((vh - side) / 2);
        const targetSide = 640;

        const canvas = document.createElement('canvas');
        canvas.width = targetSide;
        canvas.height = targetSide;
        canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, targetSide, targetSide);

        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 160;
        thumbCanvas.height = 160;
        thumbCanvas.getContext('2d').drawImage(canvas, 0, 0, 160, 160);
        const thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.6);
        thumbCanvas.width = 0;
        thumbCanvas.height = 0;

        URL.revokeObjectURL(tempUrl);

        canvas.toBlob(
          (blob) => {
            cleanupPreviewUrl();
            const previewUrl = blob ? URL.createObjectURL(blob) : thumbnailDataUrl;
            if (blob) prevObjectUrlRef.current = previewUrl;
            canvas.width = 0;
            canvas.height = 0;
            resolve({ blob: blob || file, previewUrl, thumbnailDataUrl });
          },
          'image/jpeg',
          0.88
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        resolve({ blob: file, previewUrl: URL.createObjectURL(file), thumbnailDataUrl: null });
      };
      img.src = tempUrl;
    });
  };

  // 3. Gửi ảnh lên AI Backend để phân tích
  const triggerAiScan = async (blobOrFile, previewUrlParam, thumbnailDataUrl = null) => {
    if (!blobOrFile) return;

    setIsScanning(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', blobOrFile, 'scan_plant.jpg');

    const targetPath = user ? `/nhan-dien?user_id=${user.id}` : '/nhan-dien';

    try {
      const response = await apiFetch(targetPath, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errDetail = `Lỗi nhận diện (${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson.detail) errDetail = errJson.detail;
        } catch (_) {}
        throw new Error(errDetail);
      }

      const data = await response.json();
      setAiResult(data);
      if (window.AndroidNative?.vibrate) window.AndroidNative.vibrate(50);

      const record = addScanRecord({
        imageUrl: previewUrlParam || capturedUrl,
        thumbnailDataUrl,
        result: data,
        userId: user ? user.id : null
      });
      setLastScanId(record.id);
    } catch (err) {
      setErrorMsg(
        'Không thể kết nối đến AI Server. Hãy kiểm tra mạng hoặc bấm biểu tượng máy chủ ở góc trên để kiểm tra URL!'
      );
    } finally {
      setIsScanning(false);
    }
  };

  // 3B. Quét đa cây trên toàn khung hình (Multi-Plant Detection)
  const triggerMultiAiScan = async (blobOrFile, previewUrlParam) => {
    if (!blobOrFile) return;

    setIsScanning(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', blobOrFile, 'multi_scan.jpg');

    const targetPath = user ? `/api/nhan-dien-da-cay?user_id=${user.id}` : '/api/nhan-dien-da-cay';

    try {
      const response = await apiFetch(targetPath, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Lỗi nhận diện đa cây (${response.status})`);
      }

      const data = await response.json();
      setMultiResult(data);
      setSelectedMultiIndex(0);
      setShowAnnotatedBox(true);
      if (window.AndroidNative?.vibrate) window.AndroidNative.vibrate(50);

      const firstPlant = data.danh_sach_cay?.[0];
      const record = addScanRecord({
        imageUrl: previewUrlParam || capturedUrl,
        thumbnailDataUrl: null,
        result: {
          loai_du_doan: firstPlant ? `Đa cây: ${firstPlant.tenthuonggoi} (+${data.tong_so_cay - 1} loài khác)` : 'Nhận diện đa cây',
          loai_goc: firstPlant?.tenkhoahoc || 'Multi-Plant Detection',
          do_chinh_xac: (firstPlant?.do_chinh_xac || 80) / 100,
          ma_loai_cay: firstPlant?.maloaicay || 1,
          is_multi: true,
          danh_sach_cay: data.danh_sach_cay
        },
        userId: user ? user.id : null
      });
      setLastScanId(record.id);
    } catch (err) {
      setErrorMsg('Không thể quét đa cây. Kiểm tra kết nối AI Server!');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveServerUrl = (e) => {
    e.preventDefault();
    setCustomApiBaseUrl(serverUrlInput);
    setServerUrlInput(getApiBaseUrl());
    setShowServerConfig(false);
    setErrorMsg('');
  };

  // Bấm nút chụp trên giao diện Live Camera
  const handleSnapLive = async () => {
    if (isScanning) return;
    if (window.AndroidNative?.vibrate) window.AndroidNative.vibrate(35);

    if (scanMode === 'multi') {
      // Chụp toàn khung hình
      if (!videoRef.current) return;
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        cleanupPreviewUrl();
        const previewUrl = URL.createObjectURL(blob);
        prevObjectUrlRef.current = previewUrl;
        setCapturedUrl(previewUrl);
        stopCamera();
        setIsLiveCamera(false);
        await triggerMultiAiScan(blob, previewUrl);
      }, 'image/jpeg', 0.9);
      return;
    }

    const frame = await captureFrame();
    if (!frame) return;

    setCapturedUrl(frame.previewUrl);
    stopCamera();
    setIsLiveCamera(false);

    await triggerAiScan(frame.blob, frame.previewUrl, frame.thumbnailDataUrl);
  };

  // Quay lại chế độ Live Camera để chụp cây tiếp theo
  const handleResumeLive = () => {
    cleanupPreviewUrl();
    setCapturedUrl(null);
    setAiResult(null);
    setMultiResult(null);
    setSelectedMultiIndex(0);
    setRawFile(null);
    setFeedbackGiven(null);
    setErrorMsg('');
    startCamera(facingMode);
  };

  // Chọn ảnh từ thư viện hoặc Camera Gốc Android
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      if (!file.type.startsWith('image/')) {
        return;
      }
      stopCamera();
      setIsLiveCamera(false);
      setAiResult(null);
      setMultiResult(null);
      setFeedbackGiven(null);
      setErrorMsg('');
      setRawFile(file);

      if (scanMode === 'multi') {
        const previewUrl = URL.createObjectURL(file);
        cleanupPreviewUrl();
        prevObjectUrlRef.current = previewUrl;
        setCapturedUrl(previewUrl);
        await triggerMultiAiScan(file, previewUrl);
      } else {
        const compressed = await compressSelectedFile(file);
        setCapturedUrl(compressed.previewUrl);
        await triggerAiScan(compressed.blob, compressed.previewUrl, compressed.thumbnailDataUrl);
      }
    }
  };

  const handleFeedback = (isCorrect) => {
    if (!lastScanId) return;
    submitFeedback(lastScanId, isCorrect, isCorrect ? 'Người dùng xác nhận đúng' : 'Báo cáo nhận diện sai');
    setFeedbackGiven(isCorrect);
    if (window.AndroidNative?.vibrate) window.AndroidNative.vibrate(30);
  };

  // Tìm thông tin chăm sóc chi tiết của loài vừa nhận diện
  const matchedSpeciesInfo = React.useMemo(() => {
    if (!aiResult) return null;
    const classId = Number(aiResult.ma_loai_cay ?? aiResult.class_id ?? -1);
    return (
      SPECIES_LIST.find((sp) => sp.class_id === classId) ||
      SPECIES_LIST.find((sp) => sp.vietnamese_name === aiResult.loai_du_doan) ||
      null
    );
  }, [aiResult]);

  // Đọc tên loài & hướng dẫn chăm sóc bằng giọng nói
  const handleSpeakResult = () => {
    if (!aiResult) return;
    const text = `Kết quả nhận diện: ${aiResult.loai_du_doan}, tên khoa học ${aiResult.loai_goc}, độ chính xác ${(aiResult.do_chinh_xac * 100).toFixed(1)} phần trăm. ${
      matchedSpeciesInfo ? `Ánh sáng phù hợp: ${matchedSpeciesInfo.anhSang}. Lịch tưới nước: ${matchedSpeciesInfo.tuoiNuoc}.` : ''
    }`;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'vi-VN';
      window.speechSynthesis.speak(utter);
    } else if (window.AndroidNative?.showToast) {
      window.AndroidNative.showToast(text);
    }
  };

  // Chia sẻ kết quả qua Android Share Sheet
  const handleShareResult = () => {
    if (!aiResult) return;
    const title = `Giám định cây AI: ${aiResult.loai_du_doan}`;
    const content = `🌿 Tôi vừa quét cây bằng FloraBotanic AI:\n- Loài cây: ${aiResult.loai_du_doan} (${aiResult.loai_goc})\n- Độ khớp: ${(aiResult.do_chinh_xac * 100).toFixed(1)}%\n- Chăm sóc: ${matchedSpeciesInfo?.tuoiNuoc || 'Tưới 1-2 lần/tuần'}, ${matchedSpeciesInfo?.anhSang || 'Ánh sáng tán xạ'}`;
    if (window.AndroidNative?.shareText) {
      window.AndroidNative.shareText(title, content);
    } else if (navigator.share) {
      navigator.share({ title, text: content }).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
        {/* Header Modal */}
        <header className="flex-none px-4 sm:px-6 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#012d1d] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-xl text-emerald-400">psychology</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">AI Plant Vision</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase font-bold">
                  {isLiveCamera ? (scanMode === 'multi' ? 'Live Đa Cây' : 'Live Đơn Cây') : (multiResult ? 'Đa cây' : 'Kết quả')}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">Nhận diện 90 loài kiểng lá • Hỗ trợ cụm nhiều cây</p>
            </div>
          </div>

          {/* Chuyển chế độ: Đơn cây vs Đa cây */}
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setScanMode('single');
                if (multiResult) handleResumeLive();
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                scanMode === 'single'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm">filter_center_focus</span>
              <span className="hidden sm:inline">Đơn cây</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setScanMode('multi');
                if (aiResult) handleResumeLive();
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                scanMode === 'multi'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
              <span>Đa cây (2-3 cây)</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowServerConfig((v) => !v)}
              className="p-2 rounded-xl text-gray-400 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              title="Cấu hình địa chỉ AI Server"
            >
              <span className="material-symbols-outlined text-xl">dns</span>
            </button>
            <button
              onClick={() => {
                stopCamera();
                cleanupPreviewUrl();
                onClose();
              }}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </header>

        {showServerConfig && (
          <form
            onSubmit={handleSaveServerUrl}
            className="flex-none px-4 sm:px-6 py-2.5 bg-emerald-50/80 border-b border-emerald-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs"
          >
            <span className="font-bold text-emerald-900 whitespace-nowrap">AI Server URL:</span>
            <input
              type="text"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
              placeholder="https://xxxx.trycloudflare.com hoặc http://192.168.1.x:8000"
              className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-200 bg-white text-gray-800 font-mono text-[11px] focus:outline-none"
            />
            <div className="flex gap-1.5">
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#012d1d] text-white font-bold">
                Lưu
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomApiBaseUrl('');
                  setServerUrlInput(getApiBaseUrl());
                  setShowServerConfig(false);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 font-semibold"
              >
                Mặc định
              </button>
            </div>
          </form>
        )}

        {/* Nội dung Modal */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Cột trái: Màn hình Live Camera hoặc Ảnh đã chụp */}
            <div className="lg:col-span-6 flex flex-col gap-3">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black shadow-inner flex items-center justify-center border-2 border-emerald-500/40">
                {isLiveCamera ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        transform: `${facingMode === 'user' ? 'scaleX(-1) ' : ''}scale(${zoomLevel})`
                      }}
                      className="w-full h-full object-cover transition-transform duration-200"
                    />

                    {/* HUD Scanner Khung ngắm */}
                    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="w-7 h-7 border-t-3 border-l-3 border-emerald-400"></div>
                        <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          LIVE AI CAMERA
                        </span>
                        <div className="w-7 h-7 border-t-3 border-r-3 border-emerald-400"></div>
                      </div>

                      <div className="relative mx-auto w-[80%] h-[74%] border border-emerald-400/50 rounded-2xl flex flex-col justify-between p-2">
                        <div className="w-full text-center my-auto">
                          <span className="text-[11px] text-emerald-200/90 bg-black/60 px-3 py-1 rounded-full font-medium">
                            Đưa 1 phiến lá vào giữa khung vuông
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="w-7 h-7 border-b-3 border-l-3 border-emerald-400"></div>
                        <span className="px-2 py-0.5 rounded-full bg-black/70 text-emerald-400 text-[10px] font-mono">
                          Ensemble 6-TTA • 90 Loài
                        </span>
                        <div className="w-7 h-7 border-b-3 border-r-3 border-emerald-400"></div>
                      </div>
                    </div>

                    {/* Cụm nút điều khiển trên Camera: Đèn Flash, Zoom 1x/1.5x/2x, Đổi Camera */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={handleToggleFlash}
                        className={`p-2 rounded-full backdrop-blur transition-all active:scale-90 ${
                          flashOn ? 'bg-amber-400 text-black font-bold' : 'bg-black/60 text-white hover:bg-black/80'
                        }`}
                        title="Bật/Tắt đèn Flash"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {flashOn ? 'flash_on' : 'flash_off'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleToggleCamera}
                        className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur transition-all active:scale-90"
                        title="Đổi camera trước/sau"
                      >
                        <span className="material-symbols-outlined text-lg">flip_camera_android</span>
                      </button>
                    </div>

                    {/* Thanh chọn mức Zoom 1x / 1.5x / 2x */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/65 backdrop-blur px-2.5 py-1 rounded-full z-10">
                      {[1, 1.5, 2].map((z) => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => setZoomLevel(z)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                            zoomLevel === z ? 'bg-emerald-500 text-white' : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          {z}x
                        </button>
                      ))}
                    </div>
                  </>
                ) : capturedUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      alt="Captured plant"
                      className="w-full h-full object-contain bg-black"
                      src={
                        multiResult && showAnnotatedBox && multiResult.anh_ve_box_url
                          ? `${getApiBaseUrl()}${multiResult.anh_ve_box_url}`
                          : capturedUrl
                      }
                    />
                    {multiResult && multiResult.anh_ve_box_url && (
                      <button
                        type="button"
                        onClick={() => setShowAnnotatedBox((v) => !v)}
                        className="absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur text-white text-[10px] font-bold flex items-center gap-1 border border-white/20 hover:bg-black/90 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-xs">
                          {showAnnotatedBox ? 'visibility' : 'visibility_off'}
                        </span>
                        <span>{showAnnotatedBox ? 'Ẩn Bounding Box' : 'Hiện Bounding Box'}</span>
                      </button>
                    )}
                    {isScanning && (
                      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-20">
                        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <span className="text-white text-xs font-bold tracking-wide uppercase bg-black/60 px-3 py-1 rounded-full">
                          {scanMode === 'multi' ? 'Đang quét phân vùng đa cây...' : 'Đang phân tích hình thái lá...'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-white space-y-3">
                    <span className="material-symbols-outlined text-4xl text-emerald-400">photo_camera</span>
                    <p className="text-xs text-gray-300">{cameraError || 'Hãy chọn chụp bằng Camera Gốc hoặc Thư viện ảnh bên dưới'}</p>
                  </div>
                )}
              </div>

              {/* Input ẩn: 1 cho Thư viện ảnh, 1 cho Camera Gốc hệ thống Android */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* KHU VỰC THAO TÁC CHỤP */}
              {isLiveCamera ? (
                <div className="flex flex-col items-center gap-2.5 pt-1">
                  <div className="flex items-center justify-center gap-4 w-full">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center w-20 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-xl">photo_library</span>
                      <span className="text-[10px] font-bold mt-0.5">Thư viện</span>
                    </button>

                    {/* NÚT CHỤP LIVE CHÍNH */}
                    <button
                      type="button"
                      onClick={handleSnapLive}
                      disabled={isScanning}
                      className="w-18 h-18 rounded-full border-4 border-emerald-500 p-1 flex items-center justify-center bg-transparent active:scale-90 transition-all shadow-lg"
                      title="Chụp ảnh ngay"
                    >
                      <div className="w-full h-full rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-3xl">photo_camera</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="flex flex-col items-center justify-center w-20 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 active:scale-95 transition-all"
                      title="Mở ứng dụng Camera gốc của máy Android"
                    >
                      <span className="material-symbols-outlined text-xl">add_a_photo</span>
                      <span className="text-[10px] font-bold mt-0.5">Camera Gốc</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResumeLive}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">videocam</span>
                    <span>Quét tiếp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">add_a_photo</span>
                    <span>Cam Gốc</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">photo_library</span>
                    <span>Thư viện</span>
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-base text-amber-600 mt-0.5">warning</span>
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Cột phải: Kết quả nhận diện AI & Tiện ích Android */}
            <div className="lg:col-span-6 flex flex-col gap-3.5">
              {/* TRƯỜNG HỢP 1: KẾT QUẢ QUÉT ĐA CÂY (MULTI-PLANT DETECTION) */}
              {multiResult ? (
                <>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                          Phát hiện {multiResult.tong_so_cay || multiResult.danh_sach_cay?.length} loài cây
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-800 text-white font-bold">
                        Multi-Crop NMS
                      </span>
                    </div>

                    {/* Danh sách tab chọn cây đã phát hiện */}
                    <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5">
                      {multiResult.danh_sach_cay?.map((item, idx) => {
                        const isSelected = selectedMultiIndex === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedMultiIndex(idx)}
                            className={`px-3 py-2 rounded-2xl flex items-center gap-2 border transition-all shrink-0 text-left ${
                              isSelected
                                ? 'bg-[#012d1d] text-white border-[#012d1d] shadow-md scale-102'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50'
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/50"
                              style={{ backgroundColor: item.mau_sac || '#00FF66' }}
                            ></span>
                            <div>
                              <div className="text-xs font-bold leading-tight line-clamp-1">{item.tenthuonggoi}</div>
                              <div className={`text-[10px] font-mono ${isSelected ? 'text-emerald-300' : 'text-gray-400'}`}>
                                #{idx + 1} • {item.do_chinh_xac}%
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Chi tiết cây đang được chọn */}
                    {(() => {
                      const activePlant = multiResult.danh_sach_cay?.[selectedMultiIndex] || multiResult.danh_sach_cay?.[0];
                      if (!activePlant) return null;
                      const detail = activePlant.thong_tin_chi_tiet || {};

                      return (
                        <div className="bg-white/90 rounded-2xl p-3.5 border border-emerald-100 space-y-2.5 text-xs shadow-xs">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: activePlant.mau_sac || '#00FF66' }}
                                ></span>
                                <h4 className="text-lg font-black text-gray-900 leading-tight">
                                  {activePlant.tenthuonggoi}
                                </h4>
                              </div>
                              <span className="text-[11px] italic text-emerald-800 font-semibold block mt-0.5">
                                {activePlant.tenkhoahoc}
                              </span>
                            </div>
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-bold font-mono text-[11px]">
                              {activePlant.do_chinh_xac}% Khớp
                            </span>
                          </div>

                          {/* Thông số sinh học & chăm sóc */}
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div className="bg-emerald-50/60 p-2 rounded-xl">
                              <span className="text-[9px] text-gray-400 font-bold uppercase block">Ánh sáng</span>
                              <span className="font-semibold text-gray-800 line-clamp-2">
                                {detail.anhsang || 'Ánh sáng tán xạ gián tiếp'}
                              </span>
                            </div>
                            <div className="bg-emerald-50/60 p-2 rounded-xl">
                              <span className="text-[9px] text-gray-400 font-bold uppercase block">Độ ẩm &amp; Nhiệt độ</span>
                              <span className="font-semibold text-gray-800 line-clamp-2">
                                {detail.doam || '60-70%'} • {detail.nhietdo || '18-30°C'}
                              </span>
                            </div>
                          </div>

                          {detail.huongdanchamsoc && (
                            <div className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded-xl border border-gray-100">
                              <strong className="text-emerald-900">Chăm sóc: </strong>
                              {detail.huongdanchamsoc}
                            </div>
                          )}

                          {/* Nút hành động cho cây được chọn */}
                          <div className="pt-1 flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                stopCamera();
                                cleanupPreviewUrl();
                                onClose();
                                if (onFilterBySpecies) {
                                  onFilterBySpecies(activePlant.tenthuonggoi);
                                }
                              }}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                            >
                              <span className="material-symbols-outlined text-base text-emerald-400">filter_alt</span>
                              <span>Lọc chậu cây loài này tại cửa hàng</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Nút chụp tiếp */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleResumeLive}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-base">photo_camera</span>
                      <span>Quét tiếp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScanMode('single');
                        handleResumeLive();
                      }}
                      className="py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
                    >
                      <span>Về chế độ đơn cây</span>
                    </button>
                  </div>
                </>
              ) : aiResult ? (
                /* TRƯỜNG HỢP 2: KẾT QUẢ QUÉT ĐƠN CÂY */
                <>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center justify-between pb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-800 text-white text-[11px] uppercase font-bold">
                        Top 1 • Khớp {(aiResult.do_chinh_xac * 100).toFixed(1)}%
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleSpeakResult}
                          className="p-1.5 rounded-lg bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 text-[11px] font-bold"
                          title="Nghe đọc tên cây & cách chăm sóc"
                        >
                          <span className="material-symbols-outlined text-sm">volume_up</span>
                          <span>Đọc</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleShareResult}
                          className="p-1.5 rounded-lg bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 text-[11px] font-bold"
                          title="Chia sẻ kết quả"
                        >
                          <span className="material-symbols-outlined text-sm">share</span>
                          <span>Chia sẻ</span>
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1">
                      {aiResult.loai_du_doan}
                    </h3>
                    <p className="text-xs text-emerald-800 italic font-semibold">{aiResult.loai_goc}</p>

                    {/* Cẩm nang chăm sóc nhanh ngay trên kết quả */}
                    {matchedSpeciesInfo && (
                      <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-emerald-200/70 text-[11px]">
                        <div className="bg-white/80 p-2 rounded-xl">
                          <span className="text-[9px] text-gray-400 font-bold uppercase block">Ánh sáng</span>
                          <span className="font-bold text-gray-800 line-clamp-1">{matchedSpeciesInfo.anhSang}</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-xl">
                          <span className="text-[9px] text-gray-400 font-bold uppercase block">Tưới nước</span>
                          <span className="font-bold text-gray-800 line-clamp-1">{matchedSpeciesInfo.tuoiNuoc}</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-xl">
                          <span className="text-[9px] text-gray-400 font-bold uppercase block">Độ ẩm</span>
                          <span className="font-bold text-gray-800 line-clamp-1">{matchedSpeciesInfo.doAm}</span>
                        </div>
                      </div>
                    )}

                    {/* Gợi ý nếu ảnh có nhiều cây */}
                    <div className="mt-3 pt-2.5 border-t border-emerald-200/60">
                      <button
                        type="button"
                        onClick={async () => {
                          setScanMode('multi');
                          if (rawFile) {
                            await triggerMultiAiScan(rawFile, capturedUrl);
                          } else if (capturedUrl) {
                            // Chuyển blob từ capturedUrl
                            const blob = await fetch(capturedUrl).then((r) => r.blob());
                            await triggerMultiAiScan(blob, capturedUrl);
                          }
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-sm text-emerald-600">grid_view</span>
                        <span>Ảnh có 2-3 cây? Bấm để chuyển sang Quét Đa Cây</span>
                      </button>
                    </div>

                    {/* Phản hồi đúng/sai */}
                    <div className="mt-2.5 pt-2 border-t border-emerald-200/40 flex items-center justify-between">
                      <span className="text-[11px] text-gray-600 font-medium">Kết quả AI chuẩn xác?</span>
                      {feedbackGiven !== null ? (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">verified</span>
                          {feedbackGiven ? 'Đã xác nhận Đúng!' : 'Đã ghi nhận góp ý!'}
                        </span>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleFeedback(true)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">thumb_up</span>
                            Đúng
                          </button>
                          <button
                            onClick={() => handleFeedback(false)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:bg-red-50 text-gray-600 text-xs font-semibold flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">thumb_down</span>
                            Sai
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top 3 dự đoán */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block">
                      Top 3 loài có hình thái gần nhất:
                    </span>
                    {aiResult.top_k?.map((item, idx) => {
                      const pct = (item.xac_suat * 100).toFixed(1);
                      return (
                        <div key={idx} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                          <div className="flex items-center justify-between font-semibold text-gray-700 mb-1">
                            <span className="truncate pr-2">
                              {idx + 1}. {item.loai}{' '}
                              <span className="text-gray-400 font-normal italic text-[11px]">({item.loai_goc})</span>
                            </span>
                            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono text-[11px] font-bold shrink-0">
                              {pct}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Các nút hành động mua hàng */}
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        cleanupPreviewUrl();
                        onClose();
                        if (onFilterBySpecies) {
                          onFilterBySpecies(aiResult.loai_du_doan);
                        } else {
                          onSelectProduct();
                        }
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-[#012d1d] hover:bg-[#1b4332] active:scale-98 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <span className="material-symbols-outlined text-lg text-emerald-400">storefront</span>
                      <span>Xem &amp; Đặt Mua Chậu Cây Loài Này Tại Cửa Hàng</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResumeLive}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">photo_camera</span>
                      <span>Chụp quét cây khác</span>
                    </button>
                  </div>
                </>
              ) : (
                /* TRƯỜNG HỢP 3: CHƯA QUÉT (TRẠNG THÁI CHỜ) */
                <div className="h-56 sm:h-72 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 p-5 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                    <span className="material-symbols-outlined text-3xl">
                      {scanMode === 'multi' ? 'grid_view' : 'camera_alt'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    {scanMode === 'multi' ? 'Sẵn sàng Quét Đa Cây (2-3 Cây)' : 'Sẵn sàng Giám định 90 Loài Cây'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                    {scanMode === 'multi'
                      ? 'AI sẽ tự động quét lưới và gộp phân vùng (NMS) để nhận diện cùng lúc nhiều loài cây trong ảnh.'
                      : 'Bạn có thể bấm nút chụp tròn ở giữa, dùng Camera Gốc của điện thoại, hoặc tải ảnh từ Thư viện.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
