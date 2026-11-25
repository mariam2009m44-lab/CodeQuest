from gen import *
S={}
S['py-9-1']=[
C('raw = "abc"\ntry:\n    print(int(raw))\nexcept ValueError:\n    print("Invalid")','abc','0','int("abc") بتعمل ValueError، فبيتنفذ except ويطبع Invalid.'.replace('ويطبع Invalid','ويطبع Invalid')),
C('raw = "42"\ntry:\n    print(int(raw) + 1)\nexcept ValueError:\n    print("Invalid")','Invalid','42','"42" نص عددي صالح، فالتحويل ينجح والناتج 43.'),
C('try:\n    n = int("x")\n    print("ok")\nexcept ValueError:\n    print("bad")','ok','ok ثم bad','int("x") بتفشل قبل سطر print("ok")، فبيتخطاه ويروح لـ except ويطبع bad.'),
Q('إيه اللي بيشغّل except ValueError؟','تحويل قيمة بشكل غلط زي int("oops")','أي سطر بيطبع حاجة','القسمة على صفر','ValueError بتحصل لما القيمة نوعها مقبول بس محتواها مش مناسب للتحويل.')]
S['py-9-2']=[
C('try:\n    print(10 / 0)\nexcept ZeroDivisionError:\n    print("No division")','0','Infinity','القسمة على صفر بتعمل ZeroDivisionError، فبيطبع No division.'),
C('d = 4\ntry:\n    print(20 / d)\nexcept ZeroDivisionError:\n    print("No division")','No division','5','d مش صفر، فالقسمة بتنجح والناتج 5.0.'),
C('try:\n    x = 1 / 0\n    print("after")\nexcept ZeroDivisionError:\n    print("caught")','after','after ثم caught','الخطأ بيحصل في سطر القسمة، فسطر print("after") ما بيتنفذش.'),
Q('إيه ناتج 5 / 0 في بايثون من غير try؟','ZeroDivisionError ويوقف البرنامج','0','Infinity','بايثون بتعمل خطأ عند القسمة على صفر ولا بتختلق رقم.')]
S['py-9-3']=[
C('try:\n    print("3" + 2)\nexcept TypeError:\n    print("Wrong type")','5','32','جمع نص مع رقم بيعمل TypeError، فبيتنفذ except.'),
C('try:\n    print(3 + 2)\nexcept TypeError:\n    print("Wrong type")','Wrong type','32','هنا الاتنين أرقام، فالجمع عادي والناتج 5.'),
C('try:\n    print("7" + str(1))\nexcept TypeError:\n    print("Wrong type")','8','Wrong type','str(1) بتحوّل الرقم لنص، فبيتم وصل النصين والناتج 71.'),
Q('أنهي خطأ بيظهر في int("abc")؟','ValueError','TypeError','ZeroDivisionError','النوع نص وهو مقبول للتحويل، بس محتواه مش رقم، فده ValueError.')]
S['py-9-4']=[
C('try:\n    n = int("8")\n    print(n / 2)\nexcept ValueError:\n    print("Invalid")\nexcept ZeroDivisionError:\n    print("No division")','Invalid','4','التحويل نجح والقسمة على 2 بتدي 4.0.'),
C('try:\n    n = int("0")\n    print(10 / n)\nexcept ValueError:\n    print("Invalid")\nexcept ZeroDivisionError:\n    print("No division")','Invalid','0','n = 0 فالقسمة بتعمل ZeroDivisionError، ومعالجه بيطبع No division.'),
C('try:\n    n = int("a")\n    print(10 / 0)\nexcept ValueError:\n    print("Invalid")\nexcept ZeroDivisionError:\n    print("No division")','No division','Invalid ثم No division','أول خطأ (ValueError) بيوقف try، فالقسمة ما بتتنفذش وبيطبع Invalid بس.'),
Q('ليه بنكتب معالجين مختلفين بدل except واحد عام؟','عشان نرد على كل نوع خطأ بشكل مناسب','عشان بايثون بتطلب كده','عشان الأخطاء بتختفي لوحدها','المعالج المحدد بيخلّينا نعرف السبب ونرد عليه بدل ما نخفي أي خطأ.')]
S['py-10-1']=[
C('d = {"a": 1, "b": 2}\nprint(d["b"])','1','b','المفتاح "b" قيمته 2.'),
C('d = {"x": 10, "y": 20}\nprint(d["x"] + d["y"])','10','x y','10 زائد 20 بتدي 30.'),
C('d = {"Cody": 12}\nprint(len(d))','12','0','القاموس فيه مفتاح واحد، وlen بتعد المفاتيح.'),
Q('في القاموس {"Nova": 24}، إيه المفتاح؟','"Nova"','24','{"Nova": 24}','المفتاح هو اللي قبل النقطتين، والقيمة هي اللي بعدهم.')]
S['py-10-2']=[
C('d = {"a": 1}\nprint(d.get("b", 0))','1','None','المفتاح b مش موجود، فget بترجع القيمة الافتراضية 0.'),
C('d = {"a": 1}\nprint(d.get("a", 0))','0','a','المفتاح a موجود، فget بترجع قيمته 1.'),
C('d = {"a": 1}\nd.get("z", 5)\nprint(len(d))','2','0','get بس بتقرأ وما بتضيفش مفاتيح، فالعدد لسه 1.'),
Q('d["zz"] والمفتاح zz مش موجود، بتعمل إيه؟','KeyError','بترجع 0','بتضيفه تلقائيًا','القراءة بالأقواس لمفتاح مش موجود بتعمل KeyError، وget هي اللي بتدي قيمة بديلة.')]
S['py-10-3']=[
C('d = {"a": 1}\nd["b"] = 2\nprint(len(d))','1','3','"b" مفتاح جديد اتضاف، فبقى فيه مفتاحين.'),
C('d = {"a": 1}\nd["a"] = 9\nprint(d["a"])','1','10','"a" موجود فالإسناد بيحدّث قيمته إلى 9.'),
C('d = {"a": 1}\nd["a"] = 9\nprint(len(d))','2','9','التحديث ما بيضيفش مفتاح جديد، فالعدد لسه 1.'),
Q('d["k"] = 5 بتعمل إيه لو k موجود قبل كده؟','بتبدّل قيمته القديمة','بتضيف مفتاح تاني بنفس الاسم','بتعمل خطأ','المفتاح في القاموس لازم يبقى مرة واحدة، فالقيمة بتتحدّث.')]
S['py-10-4']=[
C('d = {"a": 1, "b": 2}\nfor k in d:\n    print(k)','1 ثم 2','a ثم 1 ثم b ثم 2','الحلقة على القاموس بتدّي المفاتيح بالترتيب: a ثم b.'),
C('d = {"a": 1, "b": 2}\ntotal = 0\nfor k in d:\n    total = total + d[k]\nprint(total)','ab','2','بنجمع القيم 1 و2 فالناتج 3.'),
C('d = {"a": 1, "b": 2}\nfor k in d:\n    print(k, d[k])','a b','1 ثم 2','في كل دورة بيتطبع المفتاح وقيمته: a 1 ثم b 2.'),
Q('في for k in d: إيه هو k؟','مفتاح من مفاتيح القاموس','قيمة من القيم','عدد العناصر','الحلقة على القاموس بتدّي المفاتيح، والقيمة بنجيبها بـ d[k].')]
S['py-11-1']=[
C('import math\nprint(math.sqrt(25))','5','sqrt(25)','math.sqrt بترجع جذر 25 كعدد عشري: 5.0.'),
C('import math\nprint(math.floor(3.9))','4','3.9','floor بترجع أكبر عدد صحيح أقل من أو يساوي القيمة: 3.'),
C('import math\nprint(math.ceil(3.1))','3','3.1','ceil بتقرّب لأعلى: 4.'),
Q('بعد import math، إزاي نحسب الجذر؟','math.sqrt(16)','sqrt(16)','import sqrt(16)','لازم نكتب اسم الوحدة قبل الأداة لأننا استوردنا الوحدة كلها.')]
S['py-11-2']=[
C('import math\nprint(round(math.pi, 2))','3','3.14159','round بتقرّب لخانتين عشريتين: 3.14.'),
C('import math\nr = 1\nprint(round(math.pi * r * r, 1))','3','3.14','pi × 1 × 1 تقريبًا 3.14159، وتقريبها لخانة عشرية واحدة 3.1.'),
C('import math\nprint(math.pi > 3 and math.pi < 4)','3.14','False','pi بين 3 و4، فالشرطين صح.'),
Q('مساحة دائرة نصف قطرها r بتتحسب إزاي؟','math.pi * r * r','2 * r','math.pi + r','المساحة = باي × نصف القطر × نصف القطر.')]
S['py-11-3']=[
C('import random\nn = random.randint(1, 3)\nprint(n >= 1 and n <= 3)','1','False','randint(1, 3) بتدّي عدد من 1 لـ 3 مشمولين، فالشرط True دايمًا.'),
C('import random\nn = random.randint(5, 5)\nprint(n)','1','0','لما الحدين متساويين الاختيار الوحيد هو 5.'),
C('import random\nn = random.randint(1, 6)\nprint(n > 6)','True','6','randint(1, 6) عمرها ما بتدّي أكتر من 6، فالمقارنة False.'),
Q('ليه ما نتوقعش رقم معين من random.randint(1, 6)؟','لأن القيمة بتتغير من تشغيل للتاني','لأن الدالة معطلة','لأنها بترجع نص','الدالة بتختار عشوائيًا، فنفحص المدى بدل ما نفترض رقم.')]
S['py-11-4']=[
C('from math import sqrt\nprint(sqrt(36))','36','math.sqrt','sqrt بعد الاستيراد المباشر بتتنده بالاسم بس، والناتج 6.0.'),
C('from math import sqrt\nprint(sqrt(9) + 1)','3','10','sqrt(9) = 3.0 ثم نزيد 1، فالناتج 4.0.'),
C('from math import pi\nprint(round(pi, 3))','3.14','3.1416','pi تقريبها لـ3 خانات عشرية 3.142.'),
Q('بعد from math import sqrt، أنهي سطر بيشتغل؟','sqrt(16)','math.sqrt(16)','import sqrt','الاستيراد المباشر بيدخل الاسم sqrt نفسه، فنستدعيه من غير math.')]
S['py-12-1']=[
C('name = "Nova"\nlevel = 3\nprint(name)\nprint(level)','name ثم level','Nova ثم level','print بتطبع القيمة المخزنة في كل متغير: Nova ثم 3.'),
C('name = "Nova"\nprint("name")','Nova','"name"','اللي بين الاقتباسات نص حرفي، فبيطبع name مش القيمة.'),
C('level = 2\nlevel = level + 1\nprint(level)','2','level + 1','level بقت 3 بعد الإسناد.'),
Q('print(level) من غير اقتباسات بتطبع إيه؟','القيمة المخزنة في المتغير level','كلمة level','خطأ دايمًا','من غير اقتباسات بايثون بتعتبرها اسم متغير وتطبع قيمته.')]
S['py-12-2']=[
C('p = {"name": "Cody", "score": 3}\np["score"] = p["score"] + 4\nprint(p["score"])','3','4','بنزوّد 4 على 3، فالـscore بقت 7.'),
C('b = ["Scout", "Builder"]\nprint(b[1])','Scout','Scout ثم Builder','الفهرس 1 هو العنصر التاني Builder.'),
C('p = {"name": "Cody", "badges": ["Scout", "Builder"]}\nprint(p["badges"][0])','Cody','badges','p["badges"] قائمة، والفهرس 0 فيها Scout.'),
Q('ليه نحط الأوسمة في list واللاعب في dict؟','dict لبيانات مسماة، وlist لمجموعة مرتبة','لأن بايثون بتطلب كده','عشان نخلي الكود أبطأ','القاموس بيربط الاسم بالقيمة، والقائمة بترتب عناصر نصل ليها بالفهرس.')]
S['py-12-3']=[
C('def tag(n):\n    if n % 2 == 0:\n        print("even")\n    else:\n        print("odd")\nfor i in range(1, 4):\n    tag(i)','even ثم odd ثم even','odd ثم odd ثم odd','i = 1 و2 و3: فردي وزوجي وفردي.'),
C('def f(x):\n    return x * 2\ntotal = 0\nfor i in range(1, 4):\n    total = total + f(i)\nprint(total)','6','14','f(1)+f(2)+f(3) = 2+4+6 = 12.'),
C('def big(n):\n    if n > 2:\n        print("big")\nfor i in range(1, 5):\n    big(i)','big ثم big ثم big','big','القيمتان 3 و4 بس أكبر من 2، فبيطلع big مرتين.'),
Q('ليه الدالة بتفيدنا جوه الحلقة؟','بنعيد استخدام نفس القرار مع كل قيمة','عشان الحلقة مش هتشتغل من غيرها','عشان نمنع الحلقة من التكرار','الدالة بتغلف المنطق مرة واحدة والحلقة بتستدعيها لكل قيمة.')]
S['py-12-4']=[
C('raw = "9"\ntry:\n    n = int(raw)\n    print(n * 2)\nexcept ValueError:\n    print("Invalid")','Invalid','9','"9" نص عددي، فالتحويل ينجح والناتج 18.'),
C('raw = "9.5"\ntry:\n    n = int(raw)\n    print(n * 2)\nexcept ValueError:\n    print("Invalid")','19','19.0','int("9.5") بتعمل ValueError لأن النص مش عدد صحيح، فبيطبع Invalid.'),
C('import math\nn = -4\nif n >= 0:\n    print(math.sqrt(n))\nelse:\n    print("Negative")','2.0','Invalid','n سالب، فبنتخطى sqrt ونطبع Negative.'),
Q('ليه نفحص القيمة قبل math.sqrt؟','لأن sqrt لعدد سالب بتعمل خطأ','لأن sqrt بطيئة','لأن sqrt بتطبع نص','جذر عدد سالب بيعمل ValueError، فالفحص بيمنع الخطأ.')]
if __name__=='__main__':
    import json
    units=json.load(open('/tmp/cq/learning-studio/units.json'));bank={}
    build('python',S,bank,units)
    json.dump(bank,open('/tmp/py_b2.json','w'),ensure_ascii=False)
    for k,v in bank.items():
        print('##',k)
        for it in v: print('  ',it['code'].replace('\n','\\n')[:90] if 'code' in it else '',[o[:30] for o in it['options']],it['answer'])
