# --- Batman License Manager — برای Suga ---
FROM node:20-alpine

WORKDIR /app

# پروژه هیچ وابستگی npm خارجی ندارد (فقط ماژول‌های هسته‌ای Node)، اما این مرحله را
# نگه می‌داریم تا اگر در آینده به package.json چیزی اضافه شد، خودکار نصب شود.
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund || true

COPY . .

RUN chmod +x entrypoint.sh

# پیش‌فرض‌ها؛ در پنل Suga قابل بازنویسی‌اند
ENV HOST=0.0.0.0
ENV DATA_DIR=/data

EXPOSE 3200

# این مسیر باید دقیقاً همونی باشه که در Suga به‌عنوان Volume mount می‌کنی
VOLUME ["/data"]

ENTRYPOINT ["./entrypoint.sh"]
