#!/bin/sh
# اگر هنوز ادمینی ساخته نشده، از روی ADMIN_USERNAME / ADMIN_PASSWORD می‌سازد.
# اگر از قبل وجود داشته باشد، هیچ کاری نمی‌کند (رمز قبلی دست‌نخورده می‌ماند).
set -e

node cli.js init-if-needed

exec node server.js
