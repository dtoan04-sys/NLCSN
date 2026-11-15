FROM python:3.11-slim

# Cài đặt thư viện hệ thống cho OpenCV & xử lý ảnh
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cài đặt dependencies Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn, model AI và cơ sở dữ liệu SQLite (caykiengla.db)
COPY . .

# Tạo thư mục uploads và cấp quyền ghi cho container Hugging Face Spaces (UID 1000)
RUN mkdir -p /app/uploads && chmod -R 777 /app

ENV USE_SQLITE=1
ENV PORT=7860
EXPOSE 7860

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"]
