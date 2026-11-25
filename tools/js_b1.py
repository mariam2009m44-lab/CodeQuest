from gen import *
S={}
S['js_ch1_l1']=[
C('console.log("Hi");\nconsole.log("Cody");','Hi Cody','Hi','كل console.log بتطبع في سطر جديد، فبيظهر Hi ثم Cody.'),
C('console.log("1 + 1");','2','1 + 1 = 2','اللي بين الاقتباسات نص، فبيتطبع زي ما هو: 1 + 1.'),
C('console.log(1 + 1);','1 + 1','11','من غير اقتباسات JavaScript بتحسب الجمع وبتطبع 2.'),
Q('أنهي سطر بيطبع Ready في الـconsole؟','console.log("Ready");','print("Ready");','console("Ready");','في JavaScript الطباعة بتكون بـ console.log وبين الأقواس القيمة.')]
S['js_ch1_l2']=[
C('let n = 2;\nn = n + 3;\nconsole.log(n);','2','23','n كانت 2 وزودنا عليها 3، فبقت 5.'),
C('let a = 1;\nlet b = a;\na = 5;\nconsole.log(b);','5','6','b خدت نسخة من القيمة 1 وقت الإسناد، وتغيير a بعد كده ما بيأثرش فيها.'),
C('let n = 4;\nn = n * 2;\nn = n - 1;\nconsole.log(n);','8','3','n بتبقى 8 بعد الضرب و7 بعد الطرح.'),
Q('let count = 3; بعدها count = 5; إيه قيمة count دلوقتي؟','5','3','8','الإسناد الجديد بيبدّل القيمة القديمة.')]
S['js_ch1_l3']=[
C('const name = "Nova";\nlet level = 1;\nlevel = 2;\nconsole.log(name + level);','Nova1','Nova','name ثابتة وlevel اتغيّرت إلى 2، فالوصل ينتج Nova2.'),
C('const n = 5;\nconsole.log(n + 1);','5','51','const بتمنع إعادة الإسناد بس القراءة عادية: 5 زائد 1 بيدي 6.'),
C('const items = [1, 2];\nitems.push(3);\nconsole.log(items.length);','2','خطأ','const بتمنع إعادة إسناد المتغير، لكن push بتعدل نفس المصفوفة، فالطول بقى 3.'),
Q('لو كتبنا const n = 1; ثم n = 2; إيه اللي يحصل؟','خطأ لأن const ما تقبلش إعادة الإسناد','n تبقى 2 عادي','n تبقى 1 من غير خطأ','const معناها إن الاسم يفضل مربوط بنفس القيمة، وإعادة الإسناد بتعمل TypeError.')]
S['js_ch2_l1']=[
C('console.log(4 + 5);\nconsole.log("4" + "5");','9 ثم 9','45 ثم 45','الأول جمع أرقام 9، والتاني وصل نصين 45.'),
C('console.log("a" + 1 + 2);','a3','3a','النص بيوصل: a1 ثم a12.'),
C('console.log(1 + 2 + "a");','12a','a3','1 + 2 بيتحسب الأول فيطلع 3، وبعدين بيتوصل مع a: 3a.'),
Q('إيه ناتج "10" + "5" في JavaScript؟','"105" (نص)','15 (رقم)','"15" (نص)','الاتنين نصوص، والـ + معاهم بتوصل بدل ما تجمع.')]
S['js_ch2_l2']=[
C('let open = true;\nconsole.log(!open);','true','!open','! بتعكس القيمة المنطقية، فtrue تبقى false.'),
C('let a = true;\nlet b = false;\nconsole.log(a && b);','true','a && b','&& محتاجة الاتنين true، وb هي false، فالناتج false.'),
C('console.log(typeof true);\nconsole.log(typeof "true");','boolean ثم boolean','string ثم boolean','true بدون اقتباس قيمة منطقية boolean، و"true" بين اقتباسات نص string.'),
Q('أنهي واحدة قيمة منطقية فعلًا؟','true','"true"','TRUE ','القيمة المنطقية بتتكتب true أو false بحروف صغيرة ومن غير اقتباسات.')]
S['js_ch2_l3']=[
C('console.log(9 / 2);\nconsole.log(9 % 2);','4 ثم 1','4.5 ثم 0','9 على 2 بيدي 4.5 في JavaScript، والباقي 1.'),
C('console.log(10 % 5);','2','5','10 بتتقسم على 5 من غير باقي، فالناتج 0.'),
C('console.log(14 % 4);','3','4','14 = 4 × 3 + 2، فالباقي 2.'),
Q('7 / 2 في JavaScript بتدي كام؟','3.5','3','4','JavaScript مفيهاش قسمة صحيحة منفصلة، فالقسمة بتدّي ناتج عشري.')]
S['js_ch2_l4']=[
C('const s = "6";\nconsole.log(Number(s) + 1);','61','7 ثم 61','Number("6") بتحوّل النص لرقم 6 فالجمع بيدي 7.'),
C('const s = "6";\nconsole.log(s + 1);','7','Number(6)','s نص، فالـ + بتوصل: 61.'),
C('console.log(Number("abc"));','0','abc','Number("abc") مش قادرة تحوّل النص، فبترجع NaN.'),
Q('ليه بنحوّل "8" إلى Number قبل الجمع؟','عشان الجمع يبقى حسابي مش وصل نصوص','عشان "8" ما تتطبعش','عشان JavaScript بتمنع الجمع','من غير تحويل الـ + مع النص بتوصل بدل ما تجمع.')]
S['js_ch3_l1']=[
C('console.log(5 > 3);\nconsole.log(5 === 6);','true ثم true','false ثم false','5 أكبر من 3 فtrue، و5 مش بتساوي 6 فfalse.'),
C('console.log(5 === "5");\nconsole.log(5 === 5);','true ثم true','false ثم false','5 === "5" بـ false لأن النوعين مختلفين (رقم ونص)، و5 === 5 بـ true.'),
C('let x = 7;\nconsole.log(x >= 7);\nconsole.log(x < 7);','false ثم true','true ثم true','>= بتشمل المساواة فtrue، و< مش بتشمل فfalse.'),
Q('الفرق بين = و === ؟','= بتسند قيمة، و=== بتقارن','= بتقارن و=== بتسند','هما نفس الشيء','علامة = واحدة بتحط قيمة في متغير، و=== بتسأل هل الاتنين متساويين نوعًا وقيمة.')]
S['js_ch3_l2']=[
C('const e = 3;\nif (e >= 5) {\n  console.log("Go");\n}\nconsole.log("End");','Go ثم End','Go','الشرط غلط، فالجسم بيتخطى ويتطبع End بس.'),
C('const e = 9;\nif (e > 5) {\n  console.log("A");\n}\nif (e > 8) {\n  console.log("B");\n}','A','B','الشرطين صح، فبيتطبع A ثم B.'),
C('const e = 5;\nif (e > 5) {\n  console.log("Go");\n}\nconsole.log("end");','Go ثم end','Go','5 مش أكبر من 5، فالجسم بيتخطى ويتطبع end بس.'),
Q('جسم if بيتنفذ إمتى؟','لما الشرط يطلع true','في كل مرة','لما الشرط يطلع false','if بتنفذ الجسم لو الشرط صح بس.')]
S['js_ch3_l3']=[
C('const n = 4;\nif (n % 2 === 0) {\n  console.log("even");\n} else {\n  console.log("odd");\n}','odd','even ثم odd','4 على 2 باقي 0، فالشرط صح وبيتطبع even.'),
C('const n = 7;\nif (n > 10) {\n  console.log("big");\n} else {\n  console.log("small");\n}','big','big ثم small','الشرط غلط فبيتنفذ else بس.'),
C('const n = 10;\nif (n >= 10) {\n  console.log("pass");\n} else {\n  console.log("fail");\n}','fail','pass ثم fail','>= بتشمل 10، فالشرط صح.'),
Q('إيه اللي بيحصل لو الشرط true في if/else؟','بيتنفذ فرع if بس','بيتنفذ الفرعين','بيتنفذ else بس','الفرع التاني بيتخطى لما الشرط يتحقق.')]
S['js_ch3_l4']=[
C('const t = 30;\nif (t < 10) {\n  console.log("Cold");\n} else if (t < 25) {\n  console.log("Mild");\n} else {\n  console.log("Hot");\n}','Cold','Mild','30 مش أقل من 10 ولا من 25، فبيروح لـ else.'),
C('const t = 5;\nif (t < 25) {\n  console.log("Mild");\n} else if (t < 10) {\n  console.log("Cold");\n}','Cold','Mild ثم Cold','الشرط الأول t < 25 بيتحقق، فبيتنفذ وبيتخطى الباقي. الترتيب بيفرق.'),
C('const s = 85;\nif (s >= 90) {\n  console.log("A");\n} else if (s >= 80) {\n  console.log("B");\n} else {\n  console.log("C");\n}','A','C','85 مش >= 90 لكن >= 80، فالناتج B.'),
Q('ليه ترتيب شروط else if مهم؟','لأن أول شرط صح هو اللي بيتنفذ','لأن كلهم بيتنفذوا دايمًا','لأن JavaScript بتعيد ترتيبهم','بعد أول شرط يتحقق بيتم تخطي باقي الفروع.')]
S['js_ch4_l1']=[
C('for (let i = 1; i <= 3; i++) {\n  console.log(i * 3);\n}','1 ثم 2 ثم 3','3 ثم 6','i بتمشي من 1 لـ 3 وكل مرة بتتضرب في 3: 3 ثم 6 ثم 9.'),
C('for (let i = 0; i < 3; i++) {\n  console.log(i);\n}','1 ثم 2 ثم 3','0 ثم 1 ثم 2 ثم 3','الشرط i < 3 بيوقف قبل 3، فالقيم 0 و1 و2.'),
C('let t = 0;\nfor (let i = 1; i <= 4; i++) {\n  t += i;\n}\nconsole.log(t);','4','6','المجموع 1+2+3+4 = 10.'),
Q('for (let i = 1; i <= 5; i++) بتشتغل كام مرة؟','5','4','6','من 1 لـ 5 مشمولين، فـ 5 دورات.')]
S['js_ch4_l2']=[
C('let n = 3;\nwhile (n > 0) {\n  console.log(n);\n  n--;\n}','1 ثم 2 ثم 3','3 ثم 2 ثم 1 ثم 0','n بتنقص كل دورة، والحلقة بتقف لما n توصل 0 قبل ما تطبعه.'),
C('let n = 10;\nwhile (n > 3) {\n  n = n - 4;\n}\nconsole.log(n);','10','6','n بتبقى 6 ثم 2، و2 مش أكبر من 3 فبتقف على 2.'.replace('2','2',1)),
C('let n = 0;\nwhile (n > 0) {\n  console.log("x");\n}\nconsole.log("done");','x ثم done','x','الشرط غلط من الأول، فالجسم ما بيتنفذش وبيتطبع done بس.'),
Q('ليه لازم نغيّر المتغير جوه while؟','عشان الشرط يتوقف يبقى صح في الآخر','عشان JavaScript بتطلب كده','عشان الحلقة تبدأ','لو الشرط فضل صح للأبد الحلقة مش هتقف.')]
S['js_ch4_l3']=[
C('for (let i = 1; i <= 5; i++) {\n  if (i === 3) { continue; }\n  console.log(i);\n}','1 ثم 2','1 ثم 2 ثم 3 ثم 4 ثم 5','continue بتتخطى 3 بس، فالقيم 1 و2 و4 و5.'),
C('for (let i = 1; i <= 5; i++) {\n  if (i === 3) { break; }\n  console.log(i);\n}','1 ثم 2 ثم 4 ثم 5','1 ثم 2 ثم 3','break بتوقف الحلقة عند 3، فبيتطبع 1 و2.'),
C('let c = 0;\nfor (let i = 1; i <= 4; i++) {\n  if (i % 2 === 0) { continue; }\n  c++;\n}\nconsole.log(c);','4','2 ثم 1','الأرقام الفردية 1 و3 بس بتتعد، فc = 2.'.replace('2 ثم 1','1')),
Q('إيه الفرق بين break و continue؟','break بتنهي الحلقة وcontinue بتتخطى دورة','break بتتخطى دورة وcontinue بتنهي الحلقة','مفيش فرق','break بتخرج من الحلقة، وcontinue بتروح للدورة اللي بعدها.')]
S['js_ch5_l1']=[
C('function hi() {\n  console.log("hi");\n}\nconsole.log("a");\nhi();','hi ثم a','a','التعريف ما بيطبعش، فبيطبع a ثم hi عند الاستدعاء.'),
C('function hi() {\n  console.log("hi");\n}\nhi();\nhi();','hi','hi ثم hi ثم hi','في استدعاءين، فبيتطبع hi مرتين.'),
C('function hi() {\n  console.log("hi");\n}\nconsole.log("end");','hi ثم end','hi','الدالة ما اتندهتش، فبيتطبع end بس.'),
Q('إزاي ننفذ دالة اسمها report؟','report();','function report;','report','الاستدعاء بيكون باسم الدالة وبعده أقواس.')]
S['js_ch5_l2']=[
C('function add(a, b) {\n  console.log(a + b);\n}\nadd(2, 3);\nadd(10, 5);','5','23 ثم 105','الاستدعاء الأول 2 + 3 = 5 والتاني 10 + 5 = 15.'),
C('function say(name) {\n  console.log("Hi " + name);\n}\nsay("Nova");','Hi name','Hi','القيمة "Nova" بتدخل في name.'),
C('function show(x) {\n  console.log(x * x);\n}\nshow(4);','8','4','4 × 4 بتدي 16 وده اللي بيتطبع.'),
Q('اسم القيمة اللي بنكتبها عند الاستدعاء في add(2, 3) هو؟','arguments','parameters','return values','القيم 2 و3 هي الـarguments، ولما تدخل في الدالة بتتسمّى parameters.'.replace('parameters','parameters'))]
S['js_ch5_l3']=[
C('function sq(x) {\n  return x * x;\n}\nconsole.log(sq(3) + 1);','9','16','sq(3) بترجع 9 ثم نزيد 1، فالناتج 10.'),
C('function f(x) {\n  return x + 1;\n}\nconst r = f(f(1));\nconsole.log(r);','2','4','f(1) = 2 ثم f(2) = 3.'),
C('function f(x) {\n  x + 1;\n}\nconsole.log(f(1));','2','1','من غير return الدالة بترجع undefined.'),
Q('إيه الفرق بين return و console.log جوه دالة؟','return بترجع قيمة للمستدعي، وconsole.log بتعرضها','هما نفس الشيء','console.log بترجع قيمة وreturn بتعرضها','return بتدّي القيمة للكود اللي ندهها عشان يستخدمها.')]
S['js_ch6_l1']=[
C('const a = [5, 6, 7, 8];\nconsole.log(a.length);','3','8','في المصفوفة 4 عناصر، فالطول 4.'),
C('const a = [];\nconsole.log(a.length);','1','undefined','المصفوفة الفاضية طولها 0.'),
C('const a = [1, 2, 3];\nconsole.log(a.length + 1);','3','5','الطول 3 ونزيد 1، فالناتج 4.'),
Q('أنهي سطر بيعمل مصفوفة؟','const a = [1, 2, 3];','const a = (1, 2, 3);','const a = {1, 2, 3};','المصفوفة بتتكتب بين أقواس مربعة.')]
S['js_ch6_l2']=[
C('const a = [10, 20, 30];\nconsole.log(a[1]);','10','30','الفهرس بيبدأ من 0، فـ a[1] هي 20.'),
C('const a = [10, 20, 30];\nconsole.log(a[a.length - 1]);','10','3','آخر عنصر فهرسه length - 1 وهو 2، فالقيمة 30.'),
C('const a = [10, 20];\nconsole.log(a[2]);','20','0','الفهرس 2 مش موجود في مصفوفة من عنصرين، فبيرجع undefined.'),
Q('مصفوفة فيها 5 عناصر، إيه فهرس آخر عنصر؟','4','5','6','الفهارس بتبدأ من 0، فآخرها 4.')]
S['js_ch6_l3']=[
C('const a = [1, 2];\na.push(3);\na.push(4);\nconsole.log(a.length);','2','3','أضفنا عنصرين لمصفوفة طولها 2، فبقت 4.'),
C('const a = [5];\na.push(6);\nconsole.log(a[1]);','5','undefined','push حطت 6 في آخر المصفوفة على الفهرس 1.'),
C('const a = [1, 2, 3];\nconst last = a.pop();\nconsole.log(last);\nconsole.log(a.length);','3 ثم 3','2 ثم 2','pop بتشيل آخر عنصر وترجعه: 3، وبعدها الطول 2.'.replace('3 ثم 3','3 ثم 3')),
Q('push بتضيف العنصر فين؟','في آخر المصفوفة','في أولها','في الفهرس 0','push بتزوّد العنصر بعد آخر عنصر.')]
S['js_ch6_l4']=[
C('const r = {name: "Cody", level: 3};\nconsole.log(r.level);','Cody','level','r.level بتجيب قيمة الخاصية level وهي 3.'),
C('const r = {a: 1, b: 2};\nr.a = 10;\nconsole.log(r.a + r.b);','3','11','r.a بقت 10، فالمجموع 12.'),
C('const r = {a: 1};\nr.b = 5;\nconsole.log(r.a + r.b);','1','5','أضفنا الخاصية b بقيمة 5، فالجمع 6.'),
Q('إزاي نقرأ خاصية name من r؟','r.name','r[name]','r(name)','بنستخدم النقطة واسم الخاصية.')]
S['js_ch7_l1']=[
C('const s = "hello";\nconsole.log(s.length);','4','6','hello فيها 5 حروف.'),
C('const s = "a b";\nconsole.log(s.length);','2','1','المسافة بتتحسب حرف، فالطول 3.'),
C('console.log("".length);','1','undefined','النص الفاضي طوله 0.'),
Q('"Cody".length بتدّي كام؟','4','3','5','C وo وd وy أربع حروف.')]
S['js_ch7_l2']=[
C('const s = "Cody";\ns.toUpperCase();\nconsole.log(s);','CODY','cody','toUpperCase بترجع نسخة جديدة وما بتغيّرش s، ومفيش حاجة خزّنتها فبيطبع Cody.'),
C('let s = "Nova";\ns = s.toUpperCase();\nconsole.log(s);','Nova','nova','هنا خزّنا النتيجة في s، فبقت NOVA.'),
C('console.log("HeLLo".toLowerCase());','HELLO','HeLLo','toLowerCase بتحوّل كل الحروف لصغيرة.'),
Q('ليه message ما اتغيّرتش بعد message.toUpperCase()؟','لأن النصوص ثابتة والدالة بترجع نص جديد','لأن الدالة مش شغالة','لأن message const','النصوص في JavaScript ما بتتعدلش، والدوال بترجع نسخة جديدة.')]
S['js_ch7_l3']=[
C('try {\n  console.Log("x");\n} catch (e) {\n  console.log("typo");\n}','x','خطأ','console.Log مش موجودة (الحرف L كبير)، فبيحصل خطأ ويتنفذ catch ويطبع typo.'),
C('console.log("ok");','Ok','ok ثم ok','السطر صح، فبيطبع ok.'),
C('try {\n  undefinedName;\n} catch (e) {\n  console.log("missing");\n}\nconsole.log("after");','after','missing','الاسم غير معرّف فبيحصل ReferenceError ويتمسك، وبعدها البرنامج يكمل فيطبع missing ثم after.'),
Q('إيه أول حاجة نقراها لما يظهر خطأ؟','رسالة الخطأ ورقم السطر','نمسح الكود كله','نتجاهله','رسالة الخطأ بتقولنا نوعه ومكانه غالبًا.')]
S['js_ch8_l1']=[
C('const a = 15;\nconst ok = true;\nif (a >= 12 && ok) {\n  console.log("yes");\n} else {\n  console.log("no");\n}','no','yes ثم no','الشرطين صح مع بعض، فبيطبع yes.'),
C('const a = 10;\nconst ok = true;\nif (a >= 12 || ok) {\n  console.log("yes");\n} else {\n  console.log("no");\n}','no','yes ثم no','|| بتكفي شرط واحد، وok هي true، فبيطبع yes.'),
C('const a = 10;\nconst ok = false;\nif (a >= 12 || ok) {\n  console.log("yes");\n} else {\n  console.log("no");\n}','yes','no ثم yes','الشرطين غلط والـ || محتاجة واحد صح على الأقل، فبيطبع no.'),
Q('&& بتدّي true إمتى؟','لما الشرطين صح','لما شرط واحد على الأقل صح','لما الشرطين غلط','&& محتاجة الاتنين صح مع بعض.')]
S['js_ch8_l2']=[
C('const p = {name: "Cody", level: 3};\nfunction show(x) {\n  if (x.level >= 2) {\n    console.log(x.name + " ready");\n  } else {\n    console.log(x.name + " train");\n  }\n}\nshow(p);','Cody train','ready','level = 3 فالشرط صح، فبيطبع Cody ready.'),
C('const badges = ["Scout", "Builder"];\nconsole.log(badges[1] + badges.length);','Scout2','Builder','badges[1] هي Builder وطول المصفوفة 2، فبيوصل Builder2.'.replace('Builder','Builder',1)),
C('const p = {score: 4};\nfunction add(x) {\n  x.score = x.score + 1;\n}\nadd(p);\nconsole.log(p.score);','4','6','الدالة بتعدل نفس الكائن، فscore بقت 5.'),
Q('ليه نعمل دالة بتاخد الكائن كمعامل؟','عشان نستخدم نفس المنطق مع أي كائن','عشان الكائنات ما تتقرأش من برّه','عشان JavaScript بتطلب كده','الدالة بتكتب المنطق مرة وتشتغل على أي كائن بنفس الشكل.')]
if __name__=='__main__':
    import json
    units=json.load(open('/tmp/cq/learning-studio/units.json'));bank={}
    build('javascript',S,bank,units)
    json.dump(bank,open('/tmp/js_b1.json','w'),ensure_ascii=False)
    print(len(bank))
