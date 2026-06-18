# موقع كُتبي

متجر عربي لبيع عروض PowerPoint وأوراق العمل وملفات PDF/DOCX، مع مكتبة مرتبة حسب الصف والمادة، لوحة إدارة محمية، ودفع PayPal.

## التشغيل المحلي

```bash
npm install
copy .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

افتح الموقع على:

```bash
http://localhost:3000
```

## لوحة الإدارة

المسار:

```bash
/admin/login
```

اضبط `ADMIN_EMAIL` و`ADMIN_PASSWORD` أو `ADMIN_PASSWORD_HASH` و`ADMIN_SESSION_SECRET` قبل التشغيل. في الإنتاج، لا تستخدم قيماً تجريبية.

## الرفع والأمان

- الملفات المدفوعة تحفظ في `storage/uploads` ولا تُعرض مباشرة من `public`.
- صور الأغلفة فقط تحفظ في `public/uploads`.
- الرفع يقبل: PDF, PPT, PPTX, PPSX, DOC, DOCX, XLS, XLSX, PNG, JPG, WEBP.
- يتم فحص الامتداد، نوع MIME، توقيع الملف، الحجم، والجلسة الإدارية.
- روابط التحميل بعد الدفع مؤقتة وتُستهلك مرة واحدة.

## PayPal وEmail 2FA

- أضف `NEXT_PUBLIC_PAYPAL_CLIENT_ID` و`PAYPAL_CLIENT_SECRET`.
- اترك `PAYPAL_ENV=sandbox` أثناء التجربة.
- أضف `RESEND_API_KEY` و`RESEND_FROM_EMAIL` لتفعيل رمز تحقق البريد للوحة الإدارة.
- اضبط `NEXT_PUBLIC_SITE_URL` على رابط الموقع الحقيقي قبل النشر.
