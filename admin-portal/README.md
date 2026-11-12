# CodeQuest Control Center — Django Admin

لوحة إدارة داخلية مستقلة لإدارة المحتوى التعليمي في CodeQuest. هذه المرحلة تضيف أساس Django Admin ونماذج المحتوى فقط؛ لا تستبدل الواجهة الحالية أو FastAPI أو Firebase.

## ما أُضيف

- مسارات التعلم والمناهج والدروس.
- بنك أسئلة مرتبط بالدروس.
- الإعلانات والمشاريع التعليمية.
- بحث وفلاتر وترتيب داخل لوحة الإدارة.
- واجهة Django Admin باللغة العربية.

## تشغيل محلي

يتطلب Python 3.11 أو أحدث.

```bash
cd admin-portal
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate
pip install -r requirements.txt
python manage.py check
python manage.py makemigrations content
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

افتح `http://127.0.0.1:8000/admin/` وسجّل الدخول بحساب Staff/Superuser.

## الأمان

- لوحة الإدارة محمية بنظام Django Authentication وتتطلب مستخدمًا بصلاحية staff.
- لا يوجد تسجيل عام للمديرين.
- عيّن `DJANGO_SECRET_KEY` قويًا وسريًا في بيئة الاستضافة.
- اترك `DJANGO_DEBUG=false` في الإنتاج واضبط `DJANGO_ALLOWED_HOSTS` على نطاق لوحة الإدارة فقط.
- استخدم HTTPS وقاعدة بيانات دائمة ونسخًا احتياطية قبل تشغيلها لمستخدمين حقيقيين.
- لا تضع مفاتيح Firebase أو Gemini أو بيانات حسابات الطلاب في هذا التطبيق.

## حدود التكامل الحالية

هذه لوحة إدارة أولية وليست متصلة بعد بواجهة CodeQuest المنشورة. لا تُنشر على GitHub Pages؛ Pages يستضيف ملفات ثابتة ولا يشغّل تطبيق Django/Python. يلزم استضافة Python مستقلة (مثل خدمة تدعم ASGI/WSGI) وربط نطاق إداري خاص.

لا تقوم هذه النسخة بكتابة أي بيانات إلى Firestore، ولا تدّعي أن تعديل المحتوى هنا يغيّر المناهج الحالية. قبل تفعيل النشر من اللوحة، يجب تنفيذ طبقة تكامل صريحة ومختبرة مع ملفات المناهج الحالية أو واجهة محتوى موحدة، مع مراجعة صلاحيات النشر وسجل التغييرات.

## التحقق

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

يجب تشغيل أوامر التحقق بعد تثبيت المتطلبات. لم تُضف هذه المرحلة إعدادات نشر تلقائي أو تغييرات إلى Firebase/Firestore.
