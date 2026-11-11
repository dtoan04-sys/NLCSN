"""
Kịch bản kiểm tra nhanh (Test) mô hình AI vừa tải từ Google Colab
"""
import os
import sys
import glob
import numpy as np
import tensorflow as tf
from PIL import Image

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

MODEL_PATH = r"E:\CNTT\NLCNHTTT\06_Mo_Hinh_AI_Colab_Moi\best_model_fixed.keras"
RAW_IMAGES_DIR = r"E:\dowload\ai-service\dataset_pipeline\raw_images"

print("=" * 65)
print("     KIỂM TRA MÔ HÌNH AI VỪA HUẤN LUYỆN TỪ GOOGLE COLAB")
print("=" * 65)

if not os.path.exists(MODEL_PATH):
    print(f"[!] Không tìm thấy file mô hình tại: {MODEL_PATH}")
    sys.exit(1)

print(f"[*] Đang nạp mô hình: {os.path.basename(MODEL_PATH)}...")
model = tf.keras.models.load_model(MODEL_PATH)
print(f"[✓] Nạp thành công!")
print(f"    - Kích thước ảnh đầu vào: {model.input_shape}")
print(f"    - Số lớp phân loại đầu ra: {model.output_shape[-1]} lớp")

# Lấy thử một vài ảnh mẫu cây để test
sample_images = glob.glob(os.path.join(RAW_IMAGES_DIR, "**", "*.jpg"), recursive=True)[:6]

if not sample_images:
    # Nếu không có trong raw_images thì lấy trong plants
    sample_images = glob.glob(r"E:\CNTT\NLCNHTTT\frontend-kieng-la\public\plants\*.jpg")[:6]

print("\n" + "-" * 65)
print(" KẾT QUẢ DỰ ĐOÁN THỬ NGHIỆM TRÊN CÁC ẢNH MẪU:")
print("-" * 65)

for idx, img_path in enumerate(sample_images, start=1):
    species_name = os.path.basename(os.path.dirname(img_path))
    file_name = os.path.basename(img_path)
    
    img = Image.open(img_path).convert("RGB").resize((224, 224))
    img_arr = np.expand_dims(np.array(img, dtype=np.float32), axis=0)
    
    preds = model.predict(img_arr, verbose=0)[0]
    top_class = int(np.argmax(preds))
    top_prob = float(np.max(preds)) * 100
    
    print(f"{idx}. Ảnh: {species_name}/{file_name}")
    print(f"   --> Dự đoán Lớp #{top_class} với độ tin cậy: {top_prob:.2f}%")
    print(f"   --> Mảng xác suất chi tiết: {np.round(preds, 4)}")
    print()

print("=" * 65)
print("[✓] ĐÃ HOÀN TẤT KIỂM TRA MÔ HÌNH!")
print("=" * 65)
