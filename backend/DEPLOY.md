# نشر خادم كودي (FastAPI)

هذا الخادم مستقل عن GitHub Pages وCloudflare Worker. ملف `render.yaml` يجهز خدمة Render من جذر المستودع.

## متغيرات البيئة المطلوبة

أثناء إنشاء الخدمة، أضيفي القيم السرية في لوحة الاستضافة فقط:

- `GEMINI_API_KEY`: مفتاح Gemini API.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: محتوى JSON لحساب خدمة Firebase الخاص بمشروع `codequest-6350a`.

لا تضعي هذه القيم في GitHub أو داخل ملفات المشروع أو في المحادثة. استخدمي حساب خدمة مخصصًا بأقل صلاحيات ممكنة، واحتفظي بملفه في مكان آمن.

المتغيرات العامة المضبوطة في `render.yaml`:
- `FIREBASE_PROJECT_ID=codequest-6350a`
- `GEMINI_MODEL=gemini-3.8-flash`
- `CORS_ORIGINS=https://mariam2009m44-lab.github.io`

## خطوات النشر

1. افتحي Render واختاري إنشاء Web Service من مستودع GitHub.
2. اختاري مستودع CodeQuest والفرع الذي يحتوي على هذا الإصلاح.
3. اتركي Render يقرأ إعدادات `render.yaml`.
4. أضيفي المتغيرين السريين السابقين في Environment، ثم ابدئي النشر.
5. بعد نجاح النشر، اختبري `https://YOUR-SERVICE.onrender.com/health` ويجب أن يعيد حالة healthy.

## ربط Cloudflare Worker

من إعدادات Worker المسمى `codequest` افتحي Settings ثم Variables and Secrets، وأضيفي متغيرًا نصيًا باسم:

`CODY_API_URL`

واجعلي قيمته عنوان الخادم المنشور متبوعًا بالمسار:

`https://YOUR-SERVICE.onrender.com/api/cody/chat`

احفظي الإعدادات ثم أعيدي نشر Worker. لا تضعي مفتاح Gemini أو ملف Firebase في Worker؛ يظلان في خادم FastAPI فقط.

## ملاحظات

- لا يعتبر إنشاء خدمة Render نشرًا مكتملًا حتى تظهر حالة الخدمة Live وينجح فحص `/health`.
- بعد ربط Worker، اختبري محادثة حقيقية بحساب CodeQuest مسجل الدخول.
- لا تشاركي مفاتيح Gemini أو بيانات حساب خدمة Firebase مع أي شخص.
