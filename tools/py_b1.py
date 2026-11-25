from gen import *
S={}
S['py-5-1']=[
C('for n in range(1, 4):\n    print(n * 2)','1|2|3','2|4|6|8','range(1, 4) بتدي 1 و2 و3، والنهاية 4 مش داخلة. كل رقم بيتضرب في 2.'),
C('for n in range(3):\n    print(n)','1|2|3','0|1|2|3','range(3) بتبدأ من 0 وبتوقف قبل 3، فالقيم 0 و1 و2.'),
C('total = 0\nfor n in range(1, 5):\n    total = total + n\nprint(total)','4','15','total بتجمع 1 و2 و3 و4 يعني 10. الرقم 5 مش داخل في range(1, 5).'),
Q('كام مرة بيتنفذ جسم الحلقة في for n in range(2, 6)؟','4 مرات (2 و3 و4 و5)','5 مرات','6 مرات','القيم بتبدأ من 2 وتخلص عند 5 لأن 6 مش مشمولة، فهي 4 قيم.')]
S['py-5-2']=[
C('n = 3\nwhile n > 0:\n    print(n)\n    n = n - 1','3|2|1|0','1|2|3','while بتشتغل طول ما n أكبر من 0، فبتطبع 3 و2 و1 وبعدين n تبقى 0 وتقف.'),
C('n = 0\nwhile n > 0:\n    print("go")\n    n = n - 1\nprint("end")','go ثم end','go','الشرط n > 0 غلط من الأول، فجسم الحلقة مش بيتنفذ ولا مرة والبرنامج يطبع end بس.'),
C('n = 1\nwhile n < 20:\n    n = n * 2\nprint(n)','16','8|16','n بتتضاعف: 2 و4 و8 و16 و32. لما تبقى 32 الشرط n < 20 يغلط وتتوقف.'),
Q('إيه اللي هيحصل لو نسينا السطر اللي بيغيّر العداد جوه while؟','الحلقة ممكن ما تقفش أبدًا','الحلقة بتتنفذ مرة واحدة بس','بايثون بتغيّر العداد لوحدها','لو الشرط فضل صح ومفيش حاجة بتغيّره، الحلقة بتكمل بلا نهاية.')]
S['py-5-3']=[
C('for n in range(1, 10):\n    if n == 3:\n        break\n    print(n)','1|2|3','1|2|3|4|5|6|7|8|9','break بتخرج من الحلقة لما n تبقى 3، قبل ما تطبعه.'),
C('for n in range(1, 4):\n    print(n)\n    if n == 2:\n        break','1|2|3','1','هنا print قبل if، فبتطبع 1 و2 وبعدين break توقف الحلقة قبل 3.'),
C('for n in range(1, 4):\n    if n == 5:\n        break\n    print(n)','1|2','1|2|3|4|5','n عمرها ما بتبقى 5 هنا، فـ break ما بتتنفذش والحلقة بتطبع كل القيم 1 و2 و3.'),
Q('break بتعمل إيه جوه حلقة for؟','بتخرج من الحلقة فورًا','بتتخطى الدورة دي بس وتكمل','بتبدأ الحلقة من الأول','break بتوقف أقرب حلقة خالص، ومش بتكمل أي دورات بعدها.')]
S['py-5-4']=[
C('for n in range(1, 6):\n    if n % 2 == 0:\n        continue\n    print(n)','2|4','1|3','continue بتتخطى الأرقام الزوجية، فبيتطبع الفردي بس: 1 و3 و5.'),
C('for n in range(1, 4):\n    if n == 2:\n        continue\n    print(n * 10)','10|20|30','10','لما n تبقى 2 بنتخطى الطباعة، فبيطلع 10 و30 بس.'),
C('for n in range(1, 4):\n    print(n)\n    if n == 2:\n        continue','1|2','1|2|3 ثم 2','continue في آخر الدورة ما بتغيّرش حاجة لأن مفيش بعدها أوامر، فكل القيم 1 و2 و3 بتتطبع.'),
Q('الفرق بين continue و break؟','continue بتتخطى الدورة الحالية وبتكمل، وbreak بتنهي الحلقة','continue بتنهي الحلقة وbreak بتتخطى دورة','هما نفس الشيء','continue بتروح للدورة اللي بعدها مباشرة، وbreak بتخرج من الحلقة كلها.')]
S['py-6-1']=[
C('items = ["map", "rope", "lamp"]\nprint(items)',"map rope lamp","['map', 'rope']",'print للـlist بتعرض شكلها بالأقواس المربعة والاقتباسات: [\'map\', \'rope\', \'lamp\'].'),
C('nums = [4, 7, 9]\nprint(nums)','4 7 9',"4, 7, 9",'القائمة بتتطبع بالأقواس المربعة، والأرقام من غير اقتباسات لأنها أعداد.'),
C('empty = []\nprint(empty)','0','None','القائمة الفاضية بتتطبع [] وهي لسه list.'),
Q('أنهي سطر بيعمل list صح؟','tools = ["map", "rope"]','tools = "map", "rope" ]','tools = ("map" "rope")','الـlist بتتكتب بين أقواس مربعة والعناصر بينها فاصلة.')]
S['py-6-2']=[
C('tools = ["map", "rope", "lamp"]\nprint(tools[1])','map','lamp','الفهرس بيبدأ من 0، فـ tools[1] هو العنصر التاني وهو rope.'),
C('nums = [10, 20, 30]\nprint(nums[0] + nums[2])','30','40|60','nums[0] هو 10 و nums[2] هو 30، والمجموع 40.'),
C('tools = ["map", "rope", "lamp"]\nprint(tools[-1])','map','rope','الفهرس -1 معناه آخر عنصر، وهو lamp.'),
Q('list فيها 4 عناصر، إيه أكبر فهرس صالح؟','3','4','1','الفهارس بتبدأ من 0 فهي 0 و1 و2 و3، والفهرس 4 بيدّي IndexError.')]
S['py-6-3']=[
C('a = ["x"]\na.append("y")\na.append("z")\nprint(a)',"['x', 'y']","['z', 'y', 'x']",'append بتضيف في آخر القائمة بالترتيب، فالنتيجة [\'x\', \'y\', \'z\'].'),
C('a = ["x", "y", "x"]\na.remove("x")\nprint(a)',"['y']","['y', 'x']".replace("['y', 'x']","['x', 'y']"),'remove بتشيل أول قيمة مطابقة بس، فبيفضل [\'y\', \'x\'].'),
C('a = [1, 2]\na.append(3)\nprint(len(a))','2','4','القائمة كانت فيها عنصرين وأضفنا واحد، فالعدد 3.'),
Q('append بتضيف العنصر فين؟','في آخر القائمة','في أول القائمة','مكان الفهرس 0 وتمسح اللي فيه','append بتحط العنصر الجديد بعد آخر عنصر.')]
S['py-6-4']=[
C('a = ["map", "rope", "lamp"]\nprint(len(a))','5','2','len بتعد العناصر في القائمة وهي 3، مش حروفها.'),
C('a = []\na.append(5)\na.append(6)\nprint(len(a))','0','1','أضفنا عنصرين لقائمة فاضية، فالطول 2.'),
C('a = ["ab", "cde"]\nprint(len(a))','5','3','القائمة فيها عنصرين، وlen بتعد العناصر مش حروف كل عنصر.'),
Q('len(["a", "b", "c"]) بترجع إيه؟','3','2','"abc"','len بترجع عدد عناصر القائمة وهو 3.')]
S['py-7-1']=[
C('def hi():\n    print("hi")\nprint("start")\nhi()','hi ثم start','start','السطر الأول بيطبع start، وبعدين استدعاء hi() بيشغل جسم الدالة ويطبع hi.'.replace('السطر الأول','التعريف نفسه ما بيطبعش. أول أمر بيتنفذ'))
,
C('def hi():\n    print("hi")\nhi()\nhi()','hi','hi ثم hi ثم hi','كل استدعاء بيشغّل الدالة مرة، وفي استدعاءين يعني hi مرتين.'),
C('def hi():\n    print("hi")\nprint("done")','hi ثم done','hi','الدالة اتعرّفت بس ما اتندهتش، فبيطبع done بس.'),
Q('إزاي نشغّل دالة اتعرّفت بـ def report():؟','report()','def report','report','لازم نكتب اسمها وبعده الأقواس عشان تتنفذ.')]
S['py-7-2']=[
C('def show(x):\n    print(x + 1)\nshow(4)\nshow(10)','5','4 ثم 10','x بتاخد القيمة اللي في كل استدعاء: 4 فبيطلع 5، و10 فبيطلع 11.'),
C('def greet(name):\n    print("Hi " + name)\ngreet("Cody")','Hi name','Hi','القيمة "Cody" بتدخل في name، فالنص بيبقى Hi Cody.'),
C('def add(a, b):\n    print(a - b)\nadd(9, 4)','13','5 ثم 4','الدالة بتطرح، 9 ناقص 4 بيدي 5.'),
Q('كلمة x في def show(x): اسمها إيه؟','parameter (متغير بيستقبل القيمة)','argument','return','الـparameter هو الاسم في تعريف الدالة، والـargument هو القيمة اللي بنبعتها وقت الاستدعاء.')]
S['py-7-3']=[
C('def double(x):\n    return x * 2\nprint(double(5))','5','x * 2','return بترجع 10 للمستدعي، وprint بتطبعها.'),
C('def double(x):\n    return x * 2\nr = double(3) + double(4)\nprint(r)','10','7','double(3) بـ 6 وdouble(4) بـ 8، والمجموع 14.'),
C('def f(x):\n    return x + 1\n    print("never")\nprint(f(1))','2 ثم never','never','الدالة بتخرج عند return، فسطر print جواها مش بيتنفذ. بيطلع 2 بس.'),
Q('الفرق بين return و print جوه دالة؟','return بترجع قيمة للمستدعي، وprint بتعرضها بس','هما نفس الشيء','print بترجع قيمة وreturn بتعرضها','return بتدّي القيمة لباقي البرنامج يستخدمها، لكن print بتعرضها على الشاشة بس.')]
S['py-7-4']=[
C('def sq(x):\n    return x * x\ndef show(v):\n    print(v)\nshow(sq(4))','4','8','sq(4) بترجع 16 وبتتبعت لـ show اللي بتطبعها.'),
C('def add(a, b):\n    return a + b\ndef show(v):\n    print("Total:", v)\ntotal = add(2, 5)\nshow(total)','Total: 2 5','Total: 10','add بترجع 7 وshow بتطبعه بعد كلمة Total:.'),
C('def add(a, b):\n    return a + b\nx = add(1, 2)\ny = add(x, 4)\nprint(y)','3','10','x = 3 ثم y = 3 + 4 = 7.'),
Q('ليه بنفصل الحساب في دالة والعرض في دالة تانية؟','عشان نستخدم نتيجة الحساب في أكتر من مكان','عشان بايثون بتمنع غير كده','عشان الدوال لازم تبقى اتنين','دالة الحساب بترجع القيمة، وأي دالة تانية تعرضها أو تستخدمها.')]
S['py-8-1']=[
C('s = "Cody"\nprint(len(s))','1','3','len بتعد الحروف: C و o و d و y يعني 4.'),
C('s = "hi there"\nprint(len(s))','2','7','المسافة بتتحسب حرف، فالنص h i مسافة t h e r e يعني 8.'),
C('s = ""\nprint(len(s))','1','None','النص الفاضي طوله 0.'),
Q('len("a b") بترجع كام؟','3','2','1','الحروف a ومسافة وb، والمسافة بتتحسب حرف.')]
S['py-8-2']=[
C('m = "Cody"\nm.upper()\nprint(m)','CODY','cody','upper بترجع نسخة جديدة وما بتغيّرش m، ومفيش حد خزّن النتيجة، فبيطبع Cody.'),
C('m = "Nova"\nm = m.upper()\nprint(m)','Nova','nova','هنا خزّنا النتيجة في m، فبقت NOVA.'),
C('m = "HeLLo"\nprint(m.lower())','HELLO','HeLLo','lower بتحوّل كل الحروف لصغيرة: hello.'),
Q('ليه m.upper() لوحدها ما بتغيّرش m؟','عشان النصوص ما بتتغيّرش، والدالة بترجع نص جديد','عشان upper مش شغالة','عشان m ثابتة وممنوع تتطبع','النصوص في بايثون ثابتة، فالدالة بترجع نسخة جديدة لازم نخزنها.')]
S['py-8-3']=[
C('m = "a-b-c"\nprint(m.replace("-", "+"))','a-b-c','a+b-c','replace بتبدّل كل المطابقات، فبيطلع a+b+c.'),
C('m = "cat"\nm.replace("c", "b")\nprint(m)','bat','cat ثم bat','النتيجة ما اتخزنتش، فـ m فضلت cat.'.replace('فـ m','فـ m')),
C('m = "cat"\nn = m.replace("c", "b")\nprint(m, n)','bat cat','bat bat','m الأصلية cat وn النسخة المعدلة bat.'),
Q('إزاي نحتفظ بنتيجة replace؟','نكتب new = m.replace(a, b)','نكتب m.replace(a, b) بس','replace بتعدل m تلقائيًا','replace بترجع نصًا جديدًا لازم نحطه في متغير.')]
S['py-8-4']=[
C('t = "a b c".split()\nprint(len(t))','1','2','split بتقسم عند المسافات، فبتطلع قائمة فيها 3 عناصر.'),
C('t = "x y z".split()\nprint(t[2])','x','y','الفهرس 2 هو العنصر التالت وهو z.'),
C('t = "red,green".split(",")\nprint(t)',"['red,green']","red green",'split(",") بتقسم عند الفاصلة، فالنتيجة [\'red\', \'green\'].'),
Q('نوع نتيجة "a b".split() هو؟','list','str','int','split بترجع قائمة (list) من النصوص.')]
exec(open('tools/_tail.py').read()) if False else None
if __name__=='__main__':
    import json
    units=json.load(open('/tmp/cq/learning-studio/units.json'));bank={}
    build('python',S,bank,units)
    json.dump(bank,open('/tmp/py_b1.json','w'),ensure_ascii=False)
    for k,v in bank.items():
        print('##',k)
        for it in v: print('  ',it['code'].replace('\n','\\n') if 'code' in it else it['q'],'=>',it['options'],it['answer'])
