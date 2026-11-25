from gen import *
def J(body,pre='',imp=''):
    b='\n'.join('    '+l if l else l for l in body.split('\n'))
    return imp+'public class Main {\n'+pre+'  public static void main(String[] args) {\n'+b+'\n  }\n}'
def M(sig_body): return '  '+sig_body.replace('\n','\n  ')+'\n'
def L(x): return 'System.out.println('+x+');'
S={}
S['java-1-1']=[
C(J(L('"A"')+'\n'+L('"B"')),'AB','B ثم A','كل println بتنزّل سطر، فبيظهر A ثم B.'),
C(J(L('"2 + 2"')),'4','2+2=4','اللي بين الاقتباسات نص، فبيتطبع زي ما هو: 2 + 2.'),
C(J(L('1 + 1')),'1 + 1','11','من غير اقتباسات Java بتحسب الجمع وبتطبع 2.'),
Q('أي سطر بيعرض كلمة Ready؟','System.out.println("Ready");','print("Ready");','System.println("Ready");','الطباعة في Java بتكون بـ System.out.println.')]
S['java-1-2']=[
C(J('System.out.print("A");\nSystem.out.print("B");'),'A ثم B','BA','print من غير ln بتطبع ورا بعض في نفس السطر: AB.'),
C(J('System.out.print("A");\nSystem.out.println("B");\nSystem.out.println("C");'),'A ثم B ثم C','ABC','أول print ما نزّلتش سطر، فA وB في نفس السطر وC في سطر جديد.'.replace('AB ثم C','AB ثم C')),
C(J('// '+L('"no"')+'\n'+L('"yes"')),'no','no ثم yes','// بتخلي السطر تعليق مش بيتنفذ، فبيطبع yes بس.'),
Q('الفرق بين print و println؟','println بتنزّل سطر جديد بعد الطباعة','print بتنزّل سطر وprintln لأ','مفيش فرق','ln اختصار line، يعني بتنهي السطر بعد الطباعة.')]
S['java-2-1']=[
C(J('String s = "Hi";\nint n = 3;\n'+L('s + n')),'Hi 3','3Hi','+ مع نص بتوصل، فالناتج Hi3.'),
C(J('double d = 2.5;\n'+L('d * 2')),'5','2.5','d من نوع double فالناتج بيظهر 5.0.'),
C(J('boolean b = 5 > 3;\n'+L('b')),'5','true ثم false','5 أكبر من 3، فالقيمة true.'),
Q('أنهي نوع مناسب لتخزين اسم نصي؟','String','int','boolean','String هو النوع المخصص للنصوص.')]
S['java-2-2']=[
C(J('int n = 4;\nn = n + 3;\n'+L('n')),'4','43','n كانت 4 وزودنا 3، فبقت 7.'),
C(J('int a = 2;\nint b = a;\na = 9;\n'+L('b')),'9','11','b خدت نسخة من 2، وتغيير a بعد كده ما بيأثرش فيها.'),
C(J('int n = 5;\nn = n * 2;\nn = n - 3;\n'+L('n')),'10','2','n بتبقى 10 بعد الضرب و7 بعد الطرح.'),
Q('ليه ما نكتبش int مرة تانية في n = n + 3;؟','لأن المتغير اتعرّف قبل كده ونحن بس بنحدّثه','لأن int ممنوعة','لأن n تتغير نوعها','تكرار int بيحاول يعرّف متغير جديد بنفس الاسم وده خطأ.')]
S['java-2-3']=[
C(J('String s = "Nova";\n'+L('s.length()')),'3','5','Nova فيها 4 حروف.'),
C(J('String s = "Nova";\n'+L('s.charAt(1)')),'N','v','الفهرس 1 هو الحرف التاني وهو o.'),
C(J('String s = "ab";\n'+L('s.length() + "" + s.charAt(0)')),'3','a2','length() = 2 وcharAt(0) = a، والوصل بينهم بيدي 2a.'),
Q('s.charAt(0) في s = "Cody" بترجع؟','C','Cody','y','الفهرس 0 هو أول حرف.')]
S['java-3-1']=[
C(J(L('9 / 2')+'\n'+L('9.0 / 2')),'4.5 ثم 4.5','4 ثم 4','قسمة int على int بتدي 4 وتحذف الكسر، لكن 9.0 / 2 بتدي 4.5.'.replace('4 ثم 4','4 ثم 4')),
C(J(L('1 / 2')),'0.5','1','قسمة int على int بتدي 0 وتحذف الكسر.'),
C(J('double d = 7 / 2;\n'+L('d')),'3.5','3','7 / 2 اتحسبت كـ int فطلعت 3، وبعدين اتخزنت في double فبقت 3.0.'),
Q('ليه 7 / 2 بتدي 3 في Java؟','لأن قسمة int على int بتحذف الكسر','لأن Java بتقرّب لأعلى','لأن 7 رقم فردي','لما الاتنين int بيرجع int من غير الجزء العشري.')]
S['java-3-2']=[
C(J(L('17 % 5')),'3','5','17 = 5 × 3 + 2، فالباقي 2.'),
C(J(L('8 % 2')+'\n'+L('9 % 2')),'1 ثم 0','0 ثم 0','8 على 2 باقي 0، و9 على 2 باقي 1.'),
C(J('int n = 14;\n'+L('n / 4 + " " + n % 4')),'3 3','3.5 2','14 / 4 = 3 (قسمة int) و14 % 4 = 2، فالناتج 3 2.'),
Q('أنهي تعبير بيعطي باقي 14 على 4؟','14 % 4','14 / 4','14 * 4','% هو معامل الباقي.')]
S['java-2-4']=[
C(J('int a = 9, b = 4;\n'+L('a - b')),'13','4','9 - 4 = 5.'.replace('9 - 4 = 5.','9 - 4 بتدي 5 وده اللي بيتطبع.')),
C(J('int a = 3, b = 3;\n'+L('a * b')),'6','33','3 × 3 = 9.'.replace('3 × 3 = 9.','3 × 3 بتدي 9 وده اللي بيتطبع.')),
C(J('int energy = 10;\nint used = 4;\nenergy = energy - used;\n'+L('energy')),'10','14','energy بقت 6 بعد الطرح.'),
Q('Scanner بيقرأ العددين بأنهي ترتيب؟','بنفس ترتيب إدخالهم','بالعكس','بالأكبر الأول','nextInt الأولى بتاخد أول رقم والتانية التاني.')]
S['java-4-1']=[
C(J('int e = 3;\nif (e >= 5) {\n  '+L('"Go"')+'\n}\n'+L('"End"')),'Go ثم End','Go','الشرط غلط، فبيتخطى الجسم ويطبع End بس.'),
C(J('int e = 5;\nif (e >= 5) {\n  '+L('"A"')+'\n}\nif (e > 5) {\n  '+L('"B"')+'\n}'),'A ثم B','B','5 >= 5 صح فبيطبع A، و5 > 5 غلط.'),
C(J('int e = 6;\nif (e == 6) {\n  '+L('"six"')+'\n}'),'6','بدون مخرجات','== بتقارن فبيطبع six.'),
Q('الفرق بين = و == في Java؟','= بتسند و== بتقارن','= بتقارن و== بتسند','مفيش فرق','= بتحط قيمة، و== بتسأل هل متساويين.')]
S['java-4-2']=[
C(J('int e = 9;\nif (e >= 5) {\n  '+L('"Go"')+'\n} else {\n  '+L('"Charge"')+'\n}'),'Charge','Go ثم Charge','الشرط صح فبيتنفذ Go بس.'),
C(J('int e = 5;\nif (e > 5) {\n  '+L('"Go"')+'\n} else {\n  '+L('"Charge"')+'\n}'),'Go','Go ثم Charge','5 مش أكبر من 5، فبيتنفذ else ويطبع Charge.'),
C(J('int n = 9;\nif (n % 3 == 0) {\n  '+L('"yes"')+'\n} else {\n  '+L('"no"')+'\n}'),'no','yes ثم no','9 % 3 يساوي 0 فالشرط صح ويطبع yes.'),
Q('إمتى بيتنفذ else؟','لما شرط if يطلع غلط','لما شرط if يطلع صح','دايمًا','else هي المسار البديل لو الشرط ما اتحققش.')]
S['java-4-3']=[
C(J('int e = 8;\nboolean k = true;\nif (k && e >= 5) {\n  '+L('"Open"')+'\n} else {\n  '+L('"Locked"')+'\n}'),'Locked','Open ثم Locked','الشرطين صح، فبيطبع Open.'),
C(J('int e = 2;\nboolean k = false;\nif (k || e >= 5) {\n  '+L('"Open"')+'\n} else {\n  '+L('"Locked"')+'\n}'),'Open','Open ثم Locked','الشرطين غلط والـ || محتاجة واحد صح، فبيطبع Locked.'),
C(J('int e = 2;\nboolean k = true;\nif (k || e >= 5) {\n  '+L('"Light"')+'\n} else {\n  '+L('"Dark"')+'\n}'),'Dark','Light ثم Dark','|| بتكفي شرط صح واحد، وk هي true، فبيطبع Light.'),
Q('&& بترجع true إمتى؟','لما الشرطين صح','لما شرط واحد صح','لما الاتنين غلط','&& محتاجة الاتنين صح.')]
S['java-4-4']=[
C(J('int b = 3;\nswitch (b) {\n  case 1:\n    '+L('"Red"')+'\n    break;\n  case 3:\n    '+L('"Blue"')+'\n    break;\n  default:\n    '+L('"Unknown"')+'\n}'),'Red','Unknown','b = 3 بتطابق case 3 فبيطبع Blue.'),
C(J('int b = 9;\nswitch (b) {\n  case 1:\n    '+L('"Red"')+'\n    break;\n  default:\n    '+L('"Unknown"')+'\n}'),'Red','9','9 مش مطابقة لأي case، فبيتنفذ default.'.replace('9','9',1)),
C(J('int b = 1;\nswitch (b) {\n  case 1:\n    '+L('"One"')+'\n  case 2:\n    '+L('"Two"')+'\n    break;\n  default:\n    '+L('"Other"')+'\n}'),'One','Two','case 1 مفيهاش break، فالتنفيذ بيكمل في case 2: بيطبع One ثم Two.'),
Q('وظيفة break في case؟','توقف التنفيذ بعد الفرع','تبدأ switch','تمسح المتغير','من غير break بيكمل التنفيذ في case اللي بعده.')]
S['java-5-1']=[
C(J('for (int i = 2; i <= 4; i++) {\n  '+L('i * 3')+'\n}'),'2 ثم 3 ثم 4','6 ثم 9','i بتمشي 2 و3 و4 وبتتضرب في 3: 6 ثم 9 ثم 12.'),
C(J('for (int i = 0; i < 2; i++) {\n  '+L('i + 5')+'\n}'),'6 ثم 7','5 ثم 6 ثم 7','i = 0 و1 بس وبنزوّد 5: 5 ثم 6.'),
C(J('int t = 0;\nfor (int i = 1; i <= 5; i++) {\n  t = t + i;\n}\n'+L('t')),'5','10','المجموع 1 + 2 + 3 + 4 + 5 = 15.'),
Q('for (int i = 0; i < 4; i++) بتشتغل كام مرة؟','4','3','5','i بتاخد 0 و1 و2 و3 وبتقف قبل 4، فـ 4 دورات.')]
S['java-5-2']=[
C(J('int n = 4;\nwhile (n > 1) {\n  '+L('n')+'\n  n = n - 1;\n}'),'1 ثم 2 ثم 3 ثم 4','4 ثم 3 ثم 2 ثم 1','n بتنقص كل دورة وبتقف لما n توصل 1، فبيطبع 4 ثم 3 ثم 2.'),
C(J('int n = 0;\nwhile (n > 0) {\n  '+L('"y"')+'\n}\n'+L('"stop"')),'y ثم stop','y','الشرط غلط من الأول، فبيطبع stop بس.'),
C(J('int n = 3;\nwhile (n < 50) {\n  n = n * 3;\n}\n'+L('n')),'27','50','n بتبقى 9 و27 و81، وبتقف عند 81.'),
Q('لو نسينا نغيّر العداد في while؟','ممكن تفضل شغالة للأبد','هتشتغل مرة واحدة','Java بتعدّله لوحدها','لو الشرط فضل صح مش هتوقف.')]
S['java-5-3']=[
C(J('int c = 0;\nfor (int r = 1; r <= 2; r++) {\n  for (int s = 1; s <= 3; s++) {\n    c++;\n  }\n}\n'+L('c')),'5','2','الحلقة الداخلية بتشتغل 3 مرات لكل مرة من الخارجية: 2 × 3 = 6.'),
C(J('for (int r = 1; r <= 2; r++) {\n  for (int s = 1; s <= 2; s++) {\n    System.out.print(r * s);\n  }\n  System.out.println();\n}'),'12 ثم 36','1 ثم 2 ثم 2 ثم 4','الصف r=1 بيطبع 1 و2 جنب بعض، والصف r=2 بيطبع 2 و4 جنب بعض.'),
C(J('int c = 0;\nfor (int r = 0; r < 3; r++) {\n  for (int s = 0; s < 4; s++) {\n    c++;\n  }\n}\n'+L('c')),'7','4','3 × 4 = 12 تكرار للأمر الداخلي.'),
Q('حلقة خارجية 4 دورات وداخلية 5، كام مرة بيتنفذ الأمر الداخلي؟','20','9','45','بنضرب عدد دورات الخارجية في الداخلية: 4 × 5.')]
S['java-6-1']=[
C(J('int[] a = {4, 7, 9};\n'+L('a[1]')),'4','9','الفهرس بيبدأ من 0، فـ a[1] هي 7.'),
C(J('int[] a = {2, 4, 6, 8};\n'+L('a.length')),'3','8','المصفوفة فيها 4 عناصر.'),
C(J('int[] a = {1, 2, 3};\na[0] = 10;\n'+L('a[0] + a[2]')),'4','6','a[0] بقت 10 وa[2] = 3 فالمجموع 13.'),
Q('مصفوفة فيها 5 عناصر، إيه آخر فهرس؟','4','5','6','الفهارس من 0 لـ 4.')]
S['java-6-2']=[
C(J('int[] a = {4, 7, 9};\nfor (int i = 0; i < a.length; i++) {\n  '+L('a[i]')+'\n}'),'7 ثم 9 ثم 4','4 ثم 7','الحلقة بتزور كل العناصر بالترتيب: 4 ثم 7 ثم 9.'),
C(J('int[] a = {1, 2, 3};\nint t = 0;\nfor (int i = 0; i < a.length; i++) {\n  t = t + a[i];\n}\n'+L('t')),'3','5','1 + 2 + 3 = 6 وده اللي بيتطبع.'),
C(J('int[] a = {5, 1, 8};\nint m = a[0];\nfor (int i = 1; i < a.length; i++) {\n  if (a[i] > m) {\n    m = a[i];\n  }\n}\n'+L('m')),'5','1','m بتبقى أكبر عنصر وهو 8.'),
Q('ليه نستخدم i < a.length مش i <= a.length؟','لأن a[a.length] خارج الحدود','لأن <= ممنوعة','لأن length بتبدأ من 1','آخر فهرس صالح هو length - 1.')]
S['java-6-3']=[
C(J('ArrayList<String> t = new ArrayList<>();\nt.add("a");\nt.add("b");\nt.add("c");\n'+L('t.size()'),imp='import java.util.ArrayList;\n\n'),'2','4','أضفنا 3 عناصر، فالحجم 3.'),
C(J('ArrayList<String> t = new ArrayList<>();\nt.add("x");\nt.add("y");\n'+L('t.get(1)'),imp='import java.util.ArrayList;\n\n'),'x','2','الفهرس 1 هو العنصر التاني y.'),
C(J('ArrayList<Integer> t = new ArrayList<>();\nt.add(5);\nt.add(6);\nint s = t.get(0) + t.get(1);\n'+L('s'),imp='import java.util.ArrayList;\n\n'),'56','2','5 + 6 = 11 وده اللي بيتطبع.'),
Q('الفرق بين المصفوفة وArrayList؟','ArrayList بتكبر بالإضافة، والمصفوفة حجمها ثابت','المصفوفة بتكبر وArrayList ثابتة','مفيش فرق','ArrayList بتضيف عناصر بـ add، والمصفوفة بتتحدد في الإنشاء.')]
S['java-7-1']=[
C(J('hi();\nhi();',M('static void hi() {\n  '+L('"hi"')+'\n}')),'hi','hi ثم hi ثم hi','في استدعاءين، فبيطبع hi مرتين.'),
C(J(L('"a"')+'\nhi();',M('static void hi() {\n  '+L('"hi"')+'\n}')),'hi ثم a','a','a بتتطبع الأول وبعدها hi.'.replace('الأول','الأول').replace("'hi ثم a'","'a ثم hi'")),
C(J(L('"end"'),M('static void hi() {\n  '+L('"hi"')+'\n}')),'hi ثم end','hi','الدالة اتعرّفت وما اتندهتش، فبيطبع end بس.'),
Q('إزاي نشغّل static void report() من main؟','report();','void report;','Main.report','بنكتب اسمها وأقواس وفاصلة منقوطة.')]
S['java-7-2']=[
C(J('int r = sq(3);\n'+L('r + 1'),M('static int sq(int x) {\n  return x * x;\n}')),'9','16','sq(3) بترجع 9 ونزيد 1، فالناتج 10.'),
C(J(L('f(f(1))'),M('static int f(int x) {\n  return x + 1;\n}')),'2','4','f(1) = 2 ثم f(2) = 3.'),
C(J(L('add(2, 3) * add(1, 1)'),M('static int add(int a, int b) {\n  return a + b;\n}')),'5','7','add(2, 3) = 5 وadd(1, 1) = 2، والضرب 10.'),
Q('static int total(int x, int y) بترجع نوعها إيه؟','int','void','String','النوع قبل اسم الدالة هو نوع القيمة المرجعة.')]
S['java-8-1']=[
C(J('Robot a = new Robot();\nRobot b = new Robot();\na.e = 3;\nb.e = 9;\n'+L('a.e')+'\n'+L('b.e'),'  static class Robot {\n    int e;\n  }\n'),'3 ثم 3','9 ثم 3','كل كائن له حقوله المستقلة: a.e = 3 وb.e = 9.'),
C(J('Robot a = new Robot();\nRobot b = a;\nb.e = 5;\n'+L('a.e'),'  static class Robot {\n    int e;\n  }\n'),'0','10','b بتشاور على نفس الكائن بتاع a، فتغيير b.e بقى 5 في a.e.'),
C(J('Robot a = new Robot();\n'+L('a.e'),'  static class Robot {\n    int e;\n  }\n'),'null','1','الحقل int من غير قيمة بيبدأ بـ 0.'),
Q('Robot a = new Robot(); Robot b = new Robot(); هل a و b نفس الكائن؟','لا، كائنان مستقلان','أيوه نفس الكائن','أيوه لأن الفئة واحدة','كل new بتنشئ كائن جديد.')]
S['java-8-2']=[
C(J('Robot a = new Robot(4);\nRobot b = new Robot(8);\n'+L('a.e + b.e'),'  static class Robot {\n    int e;\n    Robot(int s) {\n      e = s;\n    }\n  }\n'),'48','4','المنشئ بيحط 4 في a.e و8 في b.e والمجموع 12.'),
C(J('Robot a = new Robot(5);\na.e = a.e + 1;\n'+L('a.e'),'  static class Robot {\n    int e;\n    Robot(int s) {\n      e = s;\n    }\n  }\n'),'5','51','المنشئ حط 5 ثم زودنا 1، فالناتج 6.'),
C(J('Robot a = new Robot(7);\n'+L('a.e * 2'),'  static class Robot {\n    int e;\n    Robot(int s) {\n      e = s;\n    }\n  }\n'),'7','72','a.e = 7 وبتتضرب في 2 فالناتج 14.'),
Q('ليه المنشئ مفيهوش void؟','لأن المنشئ مش دالة عادية وبيجهّز الكائن','لأن void ممنوعة في Java','لأن المنشئ بيرجع int','المنشئ ليه اسم الفئة نفسها ومالوش نوع إرجاع.')]
if __name__=='__main__':
    import json
    units=json.load(open('/tmp/cq/learning-studio/units.json'));bank={}
    build('java',S,bank,units)
    json.dump(bank,open('/tmp/java_b1p.json','w'),ensure_ascii=False)
    print(len(bank))
    for k,v in bank.items():
        for it in v:
            if 'code' in it: print(k,'|',it['options'][it['answer']],'|',it['why'][:60])
