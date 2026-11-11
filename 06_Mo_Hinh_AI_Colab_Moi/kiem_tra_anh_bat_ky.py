import os
import sys
import json
import numpy as np
from PIL import Image

# Đảm bảo in tiếng Việt không lỗi font console
sys.stdout.reconfigure(encoding='utf-8')

MODEL_PATH = r"E:\dowload\ai-service\model\best_model.keras"
CLASS_NAMES_PATH = r"E:\dowload\ai-service\model\class_names.json"

print("=" * 65)
print("     CÔNG CỤ KIỂM TRA ĐỘ CHÍNH XÁC NHẬN DIỆN CÂY (KIENGLA AI)")
print("=" * 65)

if not os.path.exists(MODEL_PATH):
    print(f"[!] Không tìm thấy mô hình tại: {MODEL_PATH}")
    sys.exit(1)

# Nạp danh sách loài cây
with open(CLASS_NAMES_PATH, 'r', encoding='utf-8') as f:
    class_names = json.load(f)

print(f"[*] Đã nạp từ điển: {len(class_names)} loài cây trong kho.")
print("[*] Đang khởi động mô hình AI (TensorFlow / Keras)...")

import tensorflow as tf
from tensorflow import keras

model = keras.models.load_model(MODEL_PATH)
print("[✓] Nạp mô hình thành công!\n")

def predict_image(img_path):
    if not os.path.exists(img_path):
        print(f"[X] File ảnh không tồn tại: {img_path}")
        return

    print(f"--- Đang phân tích ảnh: {os.path.basename(img_path)} ---")
    
    # Tiền xử lý ảnh theo chuẩn MobileNetV2 (224x224, scale [-1, 1])
    img = Image.open(img_path).convert('RGB')
    img = img.resize((224, 224))
    img_arr = np.array(img, dtype=np.float32)
    img_arr = (img_arr / 127.5) - 1.0
    img_tensor = np.expand_dims(img_arr, axis=0)

    # Dự đoán
    preds = model.predict(img_tensor, verbose=0)[0]
    
    # Tính Entropy đo độ bất định
    eps = 1e-12
    entropy = -np.sum(preds * np.log(preds + eps))
    max_entropy = np.log(len(preds))
    norm_entropy = float(entropy / max_entropy)

    # Lấy Top 3 kết quả cao nhất
    top_indices = np.argsort(preds)[::-1][:3]
    top1_prob = float(preds[top_indices[0]])

    CONFIDENCE_THRESHOLD = 0.48
    ENTROPY_THRESHOLD = 0.52

    is_ood = (top1_prob < CONFIDENCE_THRESHOLD) or (norm_entropy > ENTROPY_THRESHOLD)

    print("\n[+] KẾT QUẢ DỰ ĐOÁN TOP-3:")
    for rank, idx in enumerate(top_indices, 1):
        species_name = class_names[idx]
        confidence = float(preds[idx]) * 100
        bar = "█" * int(confidence // 5) + "░" * (20 - int(confidence // 5))
        print(f"  Top {rank}: [{bar}] {confidence:5.1f}%  ->  {species_name}")

    print(f"\n[+] ĐỘ BẤT ĐỊNH (Normalized Entropy): {norm_entropy:.3f} (Ngưỡng an toàn: < {ENTROPY_THRESHOLD})")
    
    if is_ood:
        print("[!] ĐÁNH GIÁ: KÍCH HOẠT CƠ CHẾ AN TOÀN OOD (Lớp khác #91)")
        print(f"    Lý do: Độ khớp tối đa {top1_prob*100:.1f}% chưa vượt ngưỡng tin cậy {CONFIDENCE_THRESHOLD*100:.0f}%.")
        print("    -> Hệ thống từ chối đoán bừa, chỉ hiển thị gợi ý loài gần nhất.")
    else:
        print(f"[✓] ĐÁNH GIÁ: NHẬN DIỆN THÀNH CÔNG VỚI ĐỘ TIN CẬY CAO: {class_names[top_indices[0]]}")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_path = sys.argv[1]
    else:
        # Mặc định thử với ảnh 1 loài cây có sẵn
        test_path = r"E:\CNTT\NLCNHTTT\frontend-kieng-la\public\plants\51.jpg"
    predict_image(test_path)
