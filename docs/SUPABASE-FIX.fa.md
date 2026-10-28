# اصلاح اتصال Supabase — نسخه 0.2.1

خطای P1011 / SELF_SIGNED_CERT_IN_CHAIN در seed، Session و ورود پنل از اعتبارسنجی TLS در درایور pg است. ساخته‌شدن جدول‌ها توسط Prisma CLI به معنای کارکرد اتصال برنامه نیست.

1. سرور را متوقف و فایل‌های این نسخه را جایگزین کنید. فایل .env شخصی خودتان را نگه دارید.
2. از Supabase > Database Settings > SSL Configuration گواهی CA پروژه را دانلود و در certs/supabase-ca.crt ذخیره کنید. فایل باید PEM باشد و با BEGIN CERTIFICATE شروع شود.
3. به .env اضافه کنید:

```dotenv
DATABASE_SSL_CA_FILE="./certs/supabase-ca.crt"
LOCAL_DATABASE="false"
ENABLE_DEMO_AUTH="true"
PANEL_PASSWORD="1111"
```

DATABASE_URL فعلی با رمز صحیح را حفظ کنید. تنظیم مشترک جدید، هنگام ارائه گواهی، پارامترهای SSL آدرس را در حافظه حذف می‌کند تا pg گواهی را بازنویسی نکند؛ فایل .env تغییر نمی‌کند. اعتبارسنجی گواهی و نام سرور فعال می‌ماند. DIRECT_URL و Prisma CLI مستقل هستند و تغییری نکرده‌اند.

AUTH_SECRET باید مقدار ثابت حداقل 32 کاراکتر داشته باشد. برای تولید:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

خروجی را در AUTH_SECRET در .env قرار دهید. سپس:

```powershell
npm install
npm run db:generate
npm run db:check
npm run db:seed
npm run dev
```

هر دستور را جدا اجرا کنید و در صورت خطا متوقف شوید. db:check باید DATABASE_OK نمایش دهد. اگر فایل CA صحیح باز هم خطای گواهی داد، کد خطا را گزارش کنید؛ ممکن است زنجیره متفاوت یا واسطه TLS وجود داشته باشد. اعتبارسنجی TLS را غیرفعال نکنید.

ورود پنل /panel با 1111 در حالت آزمایشی است. هدایت / به /lernen عمدی است. پس از تغییر دیتابیس، اگر نشست قدیمی باقی ماند دوباره از /anmelden وارد شوید.

## تاریخچه migration قبلی

این اصلاح جدول یا migration را تغییر نمی‌دهد. در نصب گزارش‌شده، migrate diff نتیجه No difference detected داشت ولی migration اولیه failed ثبت شده بود. پس از توقف همه اجراهای دیگر، دستور زیر فقط وضعیت آن را اصلاح می‌کند:

```powershell
npx prisma migrate resolve --applied 202610280001_initial
npx prisma migrate status
```

اگر دوباره advisory lock timeout دریافت شد، اتصال نگه‌دارنده قفل باید جداگانه شناسایی شود؛ reset یا rolled-back اجرا نکنید و قفل را غیرفعال نکنید. این مشکل مستقل از TLS برنامه است.

## استقرار

مسیر گواهی روی کامپیوتر ویندوز در Vercel معتبر نیست. برای استقرار گواهی PEM را در DATABASE_SSL_CA وارد کنید یا فایل عمومی CA را همراه پروژه قرار دهید. کلید خصوصی را قرار ندهید. تنظیمات ورود آزمایشی برای استفاده عمومی مناسب نیستند.

## بررسی انجام‌شده

آزمون‌ها و build محلی اجرا شدند؛ اتصال زنده به دیتابیس کاربر بدون گواهی و تنظیمات خصوصی او آزمایش نشده است.
