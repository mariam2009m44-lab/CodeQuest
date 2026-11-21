# تشغيل كودي بدون خادم مدفوع

يعمل مسار المحادثة داخل Cloudflare Worker الحالي، ولا يحتاج إلى Render أو خادم FastAPI منفصل.

## المتطلبات

- Cloudflare Worker الحالي باسم `codequest`.
- Firebase Authentication لمصادقة حساب الطالب.
- مفتاح Gemini API مع تفعيل نموذج متاح في حساب AI Studio.
- ربط Durable Object الحالي `CODE_EXECUTION_LIMITER` كما هو موضح في `wrangler.toml`.

## النشر التلقائي من GitHub

أُضيف سير عمل GitHub Actions باسم **Deploy CodeQuest Cloudflare Worker**. بعد دمجه في `main`، سيعيد نشر Worker تلقائيًا عند تغيير أي ملف داخل `cloudflare-worker/`، ثم يفحص نقطة صحة كودي للتأكد من جاهزية إعداد Gemini وحماية الاستخدام.

يتطلب سير العمل وجود GitHub Actions secrets التالية في إعدادات المستودع:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

لا تضعي القيم في ملفات المستودع أو المحادثات. يجب أن يمتلك رمز Cloudflare صلاحية نشر Workers وإدارة الموارد المرتبطة الموجودة في إعداد Wrangler.

بعد النشر، يتحقق سير العمل من:
- `configured: true` لوجود مفتاح Gemini في Cloudflare.
- `quotaAvailable: true` لوجود Durable Object الخاص بحدود الاستخدام.
- `ready: true` قبل اعتبار كودي جاهزًا.

إذا فشل فحص الصحة بعد النشر، راجعي Secret باسم `GEMINI_API_KEY` داخل Cloudflare Worker وإعدادات `GEMINI_MODEL` وربط `CODE_EXECUTION_LIMITER`. لا يطبع سير العمل أي مفاتيح سرية.

يمكن تشغيل سير العمل يدويًا من تبويب **Actions** باستخدام **Deploy CodeQuest Cloudflare Worker → Run workflow**.

## نشر Firebase Functions تلقائيًا

أُضيف سير عمل **Deploy Firebase Functions** لنشر دوال التحقق وحفظ التقدم عند تحديث مجلد `functions/`. يتطلب إضافة Secret واحد إلى إعدادات GitHub Actions:

- `FIREBASE_SERVICE_ACCOUNT_CODEQUEST`: محتوى JSON لمفتاح حساب خدمة مخصص للمشروع `codequest-6350a`، بصلاحيات نشر Firebase Functions اللازمة.

أضيفي القيمة من إعدادات المستودع: **Settings → Secrets and variables → Actions → New repository secret**. لا تضعي JSON في ملفات المشروع أو في المحادثات، ولا ترسليه لأي شخص. يجب أن يكون حساب الخدمة مفعّلًا في مشروع Firebase وأن يمتلك أدوار النشر المطلوبة في Google Cloud.

بعد إضافة السر، يمكن تشغيل **Actions → Deploy Firebase Functions → Run workflow** يدويًا. وعند تعديل ملفات `functions/` مستقبلًا، سيعمل النشر تلقائيًا. لا يمنح فشل الاتصال بالدالة إثبات إكمال محليًا؛ إثبات Firebase لا يُنشأ إلا من الدالة المنشورة بعد التحقق من الحل.

## إضافة مفتاح Gemini بأمان

من Cloudflare Dashboard:

1. افتحي **Workers & Pages** ثم اختاري Worker باسم `codequest`.
2. افتحي **Settings → Variables and Secrets**.
3. أضيفي Secret باسم `GEMINI_API_KEY` والصقي المفتاح في خانة القيمة.
4. أضيفي متغيرًا عاديًا باسم `GEMINI_MODEL` وقيمة نموذج متاح في Gemini API (الافتراضي في الكود `gemini-3.8-flash`).
5. احفظي التغييرات ثم أعيدي نشر Worker.

لا تضعي مفتاح Gemini في GitHub أو ملفات JavaScript التي تصل للمتصفح، ولا ترسليه في المحادثة.

## ما الذي يحدث عند سؤال كودي؟

1. يتحقق Worker من Firebase ID token.
2. يصنّف السؤال محليًا باستخدام مصنف خفيف مبني على أمثلة `cody-ml-engine/data/training_data.json` والفئات الست نفسها.
3. يرسل السؤال والسياق وسجلًا محدودًا إلى Gemini من الخادم.
4. يعيد الإجابة والتصنيف للواجهة.
5. يحدّ Durable Object الاستخدام إلى 20 سؤالًا يوميًا لكل حساب.

المصنف داخل Worker يستخدم TF-IDF character n-grams مع أقرب مركز فئة. وهو تلميح لتوجيه الإجابة وليس فلترًا يمنع الأسئلة خارج فئاته؛ يستطيع كودي الإجابة عن الأسئلة العامة المناسبة أيضًا. وهو بديل خفيف متوافق مع بيئة Workers، وليس نسخة مطابقة لخوارزمية Logistic Regression في Python.

## حدود الخطة المجانية

Cloudflare وGemini لديهما حدود استخدام ومعدلات طلب قد تتغير. المجانية ليست استخدامًا غير محدود، وقد تتوقف إجابات كودي مؤقتًا عند بلوغ حد المزود.

## اختبار بعد النشر

- افتحي CodeQuest بحساب مسجل الدخول.
- ارسلي سؤالًا برمجيًا بالعربية، مثل: `اشرح لي المتغيرات في بايثون`.
- جربي سؤالًا علميًا وسؤالًا باللغة الإنجليزية.
- تأكدي أن الاستجابة تتضمن `success: true` و`answer` و`category`.
- جرّبي الطلب دون تسجيل الدخول؛ يجب أن يرجع `401`.

لا تعتبري كودي جاهزًا للإطلاق قبل نجاح هذه الاختبارات من الموقع المنشور.
