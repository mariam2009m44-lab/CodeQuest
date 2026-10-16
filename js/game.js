/* ============================================
   CodeQuest - Interactive Learning Engine
   Multi-Language Support: JS / Python / C++
   ============================================ */

const CONFIG = {
    levelCount: 5,
    pointsPerQuestion: 10,
    avatarBaseUrl: 'https://api.dicebear.com/7.x/adventurer/svg',
    codyUrl: 'https://cdn-icons-png.flaticon.com/512/4712/4712139.png'
};

const STATE = {
    user: null,
    lang: 'js',
    level: 'level1',
    stepIndex: 0,
    questionIndex: 0,
    score: 0,
    inQuiz: false
};

const STORIES = {
    js: {
        level1: {
            langName: 'JavaScript',
            levelTitle: 'المستوى الأول: المتغيرات',
            steps: [
                { type: 'cody', text: 'الجزء الأول: إيه هو المتغير؟ 🤔' },
                { type: 'cody', text: 'تخيل إن عندك صندوق بتخزن فيه حاجتك. في البرمجة، الصندوق ده اسمه متغير.' },
                { type: 'code', code: 'let name = "أحمد";' },
                { type: 'choice', question: 'فهمت يعني إيه متغير؟', options: [
                    { text: 'أيوه! ✅', reply: 'برافو! يلا نكمل.' },
                    { text: 'مش أوي 🤔', reply: 'هتوضح أكتر!' }
                ]},
                { type: 'cody', text: 'الجزء التاني: إزاي نعمل متغير؟ ✨' },
                { type: 'code', code: 'let age = 15;\nlet city = "القاهرة";' },
                { type: 'cody', text: 'الجزء التالت: الفرق بين let و const 🎨' },
                { type: 'code', code: 'const PI = 3.14;' },
                { type: 'choice', question: 'الفرق بين let و const؟', options: [
                    { text: 'let بتتغير، const ثابتة ✅', reply: 'إجابة صحيحة! 🌟' },
                    { text: 'مفيش فرق 🤷', reply: 'قربت! ركز في الفرق.' }
                ]},
                { type: 'cody', text: 'الجزء الرابع: أنواع البيانات 📊' },
                { type: 'code', code: 'let num = 10;\nlet str = "Hello";\nlet isTrue = true;' },
                { type: 'cody', text: 'الجزء الخامس: تطبيق عملي 🎯' },
                { type: 'code', code: 'let myAge = 12;\nlet myName = "مريم";' },
                { type: 'cody', text: 'يلا نجرب امتحان صغير! 🎯' }
            ],
            questions: [
                { q: 'إزاي نعرّف متغير اسمه age وقيمته 10؟', options: ['let age = 10;', 'age = 10', 'int age = 10;', 'define age = 10;'], answer: 'let age = 10;', explanation: 'بنستخدم let.' },
                { q: 'الفرق بين let و const؟', options: ['مفيش فرق', 'let بتتغير، const ثابتة', 'const بتتغير', 'الاتنين ثابتين'], answer: 'let بتتغير، const ثابتة', explanation: 'const ثابتة.' },
                { q: 'إزاي نطبع؟', options: ['console.log(name);', 'print(name);', 'echo name;', 'write(name);'], answer: 'console.log(name);', explanation: 'console.log.' },
                { q: 'نوع "Hello"؟', options: ['Number', 'String', 'Boolean', 'Array'], answer: 'String', explanation: 'String.' },
                { q: 'نوع true؟', options: ['Number', 'String', 'Boolean', 'Object'], answer: 'Boolean', explanation: 'Boolean.' }
            ]
        },
        level2: {
            langName: 'JavaScript',
            levelTitle: 'المستوى الثاني: الشروط',
            steps: [
                { type: 'cody', text: 'الجزء الأول: إيه هي الشروط؟ 🎯' },
                { type: 'cody', text: 'الشروط بتخلي الكود بتاعك يفكر وياخد قرار.' },
                { type: 'choice', question: 'فهمت الفكرة؟', options: [
                    { text: 'أيوه! ✅', reply: 'يلا نكمل!' },
                    { text: 'مش أوي 🤔', reply: 'هتوضح!' }
                ]},
                { type: 'cody', text: 'الجزء التاني: إزاي نكتب if 🎨' },
                { type: 'code', code: 'if (score === 100) {\n  console.log("مبروك!");\n}' },
                { type: 'cody', text: 'الجزء التالت: else 🔀' },
                { type: 'code', code: 'if (score === 100) {\n  console.log("مبروك!");\n} else {\n  console.log("حاول تاني!");\n}' },
                { type: 'cody', text: 'الجزء الرابع: علامات المقارنة 📊' },
                { type: 'code', code: 'if (age > 18) { ... }\nif (name === "أحمد") { ... }' },
                { type: 'cody', text: 'الجزء الخامس: تطبيق 🎯' },
                { type: 'code', code: 'let age = 15;\nif (age >= 13) {\n  console.log("مراهق");\n} else {\n  console.log("طفل");\n}' }
            ],
            questions: [
                { q: 'كلمة الشرط؟', options: ['if', 'let', 'for', 'var'], answer: 'if', explanation: 'if.' },
                { q: 'لو الشرط غلط؟', options: ['if', 'else', 'let', 'const'], answer: 'else', explanation: 'else.' },
                { q: 'معنى ===؟', options: ['أكبر', 'أصغر', 'يساوي', 'مش يساوي'], answer: 'يساوي', explanation: '===' },
                { q: 'أكبر من؟', options: ['>', '<', '=', '!='], answer: '>', explanation: '>' },
                { q: 'مش يساوي؟', options: ['===', '!==', '>', '<'], answer: '!==', explanation: '!==' }
            ]
        },
        level3: {
            langName: 'JavaScript',
            levelTitle: 'المستوى الثالث: الحلقات',
            steps: [
                { type: 'cody', text: 'الجزء الأول: الحلقات 🔄' },
                { type: 'cody', text: 'الحلقات بتكرر الكود بدل ما تكتبه كل مرة.' },
                { type: 'choice', question: 'فهمت؟', options: [
                    { text: 'أيوه! ✅', reply: 'يلا!' },
                    { text: 'مش أوي 🤔', reply: 'هيتوضح!' }
                ]},
                { type: 'cody', text: 'الجزء التاني: for loop 🔁' },
                { type: 'code', code: 'for (let i = 0; i < 5; i++) {\n  console.log(i);\n}' },
                { type: 'cody', text: 'الجزء التالت: while loop ♾️' },
                { type: 'code', code: 'let i = 0;\nwhile (i < 5) {\n  console.log(i);\n  i++;\n}' },
                { type: 'cody', text: 'الجزء الرابع: break 🛑' },
                { type: 'code', code: 'for (let i = 0; i < 10; i++) {\n  if (i === 5) break;\n  console.log(i);\n}' },
                { type: 'cody', text: 'الجزء الخامس: تطبيق 🎯' },
                { type: 'code', code: 'for (let i = 1; i <= 3; i++) {\n  console.log("مرحباً " + i);\n}' }
            ],
            questions: [
                { q: 'حلقة عدد؟', options: ['for', 'if', 'let', 'else'], answer: 'for', explanation: 'for.' },
                { q: 'حلقة شرط؟', options: ['while', 'for', 'if', 'else'], answer: 'while', explanation: 'while.' },
                { q: 'بتوقف؟', options: ['stop', 'break', 'end', 'exit'], answer: 'break', explanation: 'break.' },
                { q: 'for i<3 هيكرر كام؟', options: ['1', '2', '3', '4'], answer: '3', explanation: '3 مرات.' },
                { q: 'i++ معناها؟', options: ['تزود 1', 'تقل 1', 'تضرب', 'مفيش'], answer: 'تزود 1', explanation: 'زوّد 1.' }
            ]
        },
        level4: {
            langName: 'JavaScript',
            levelTitle: 'المستوى الرابع: الدوال',
            steps: [
                { type: 'cody', text: 'الجزء الأول: الدوال 🎁' },
                { type: 'cody', text: 'الدالة كتلة كود ليها اسم بنستخدمها في أي وقت.' },
                { type: 'choice', question: 'فهمت؟', options: [
                    { text: 'أيوه! ✅', reply: 'يلا!' },
                    { text: 'مش أوي 🤔', reply: 'هيتوضح!' }
                ]},
                { type: 'cody', text: 'الجزء التاني: تعريف دالة 🎨' },
                { type: 'code', code: 'function greet() {\n  console.log("أهلاً!");\n}' },
                { type: 'cody', text: 'الجزء التالت: بنستخدمها 📞' },
                { type: 'code', code: 'greet();' },
                { type: 'cody', text: 'الجزء الرابع: بمعاملات 📥' },
                { type: 'code', code: 'function greet(name) {\n  console.log("أهلاً " + name);\n}' },
                { type: 'cody', text: 'الجزء الخامس: return ↩️' },
                { type: 'code', code: 'function add(a, b) {\n  return a + b;\n}' }
            ],
            questions: [
                { q: 'بنعرّف دالة بـ؟', options: ['function name()', 'def name()', 'fun', 'void'], answer: 'function name()', explanation: 'function.' },
                { q: 'بترجع قيمة بـ؟', options: ['return', 'give', 'send', 'back'], answer: 'return', explanation: 'return.' },
                { q: 'المعاملات فين؟', options: ['جوه ()', 'بره', 'بعد return', 'مش بتتحط'], answer: 'جوه ()', explanation: '()' },
                { q: 'نشغل دالة إزاي؟', options: ['sayHi()', 'run', 'call', 'sayHi'], answer: 'sayHi()', explanation: 'اسم+()' },
                { q: 'return معناها؟', options: ['ترجع قيمة', 'تطبع', 'توقف', 'تكمل'], answer: 'ترجع قيمة', explanation: 'ترجع.' }
            ]
        },
        level5: {
            langName: 'JavaScript',
            levelTitle: 'المستوى الخامس: المشاريع',
            steps: [
                { type: 'cody', text: 'الجزء الأول: مراجعة 📚' },
                { type: 'choice', question: 'جاهز؟', options: [
                    { text: 'يلا! 🚀', reply: 'يلا!' },
                    { text: 'أيوه! 💪', reply: 'تمام!' }
                ]},
                { type: 'cody', text: 'الجزء التاني: آلة حاسبة 🧮' },
                { type: 'code', code: 'function add(a, b) {\n  return a + b;\n}' },
                { type: 'cody', text: 'الجزء التالت: لعبة تخمين 🎮' },
                { type: 'code', code: 'let secret = 7;\nfor (let i = 0; i < 3; i++) {\n  let guess = prompt("خمن");\n  if (guess == secret) break;\n}' },
                { type: 'cody', text: 'الجزء الرابع: جدول الضرب 🎨' },
                { type: 'code', code: 'for (let i = 1; i <= 5; i++) {\n  console.log("5 × " + i + " = " + (5 * i));\n}' },
                { type: 'cody', text: 'الجزء الخامس: إنت مبرمج! 🏆' }
            ],
            questions: [
                { q: 'آلة حاسبة بـ؟', options: ['دالة', 'if', 'مفيش', 'let'], answer: 'دالة', explanation: 'دالة.' },
                { q: 'لعبة تخمين بـ؟', options: ['حلقة + شرط', 'دالة', 'let', 'مفيش'], answer: 'حلقة + شرط', explanation: 'حلقة وشرط.' },
                { q: 'جدول الضرب بـ؟', options: ['for', 'if', 'let', 'function'], answer: 'for', explanation: 'for.' },
                { q: 'بترجع قيمة بـ؟', options: ['return', 'print', 'echo', 'send'], answer: 'return', explanation: 'return.' },
                { q: 'إنت بقيت إيه؟', options: ['مبرمج! 🏆', 'طالب', 'مش حاجة', 'مبتدئ'], answer: 'مبرمج! 🏆', explanation: 'مبروك!' }
            ]
        }
    },
    py: {
        level1: {
            langName: 'Python',
            levelTitle: 'المستوى الأول: المتغيرات',
            steps: [
                { type: 'cody', text: 'الجزء الأول: المتغير في Python 🐍' },
                { type: 'cody', text: 'Python لغة سهلة جداً، المتغير فيها بسيط جداً.' },
                { type: 'code', code: 'name = "أحمد"' },
                { type: 'choice', question: 'فهمت؟', options: [
                    { text: 'أيوه! ✅', reply: 'يلا نكمل!' },
                    { text: 'مش أوي 🤔', reply: 'هتوضح!' }
                ]},
                { type: 'cody', text: 'الجزء التاني: بنكتب متغير إزاي؟ ✏️' },
                { type: 'cody', text: 'في Python مفيش let ولا const، بنكتب الاسم = والقيمة وبس!' },
                { type: 'code', code: 'age = 15\ncity = "القاهرة"' },
                { type: 'cody', text: 'الجزء التالت: الطباعة 🖨️' },
                { type: 'code', code: 'print(name)\nprint("أهلاً " + name)' },
                { type: 'choice', question: 'بنستخدم إيه للطباعة؟', options: [
                    { text: 'print ✅', reply: 'صح!' },
                    { text: 'console.log', reply: 'دي بتاعة JS.' }
                ]},
                { type: 'cody', text: 'الجزء الرابع: أنواع البيانات 📊' },
                { type: 'code', code: 'num = 10\nstr = "Hello"\nflag = True' },
                { type: 'cody', text: 'الجزء الخامس: تطبيق 🎯' },
                { type: 'code', code: 'myAge = 12\nmyName = "مريم"' },
                { type: 'cody', text: 'يلا نجرب امتحان! 🎯' }
            ],
            questions: [
                { q: 'نعرّف متغير إزاي؟', options: ['age = 10', 'let age = 10;', 'int age = 10;', 'var age = 10;'], answer: 'age = 10', explanation: 'اسم=قيمة.' },
                { q: 'نطبع إزاي؟', options: ['print("مرحباً")', 'console.log()', 'echo', 'cout'], answer: 'print("مرحباً")', explanation: 'print.' },
                { q: 'ميزة Python؟', options: ['صعبة', 'سهلة', 'قديمة', 'مش بتستخدم'], answer: 'سهلة', explanation: 'سهلة.' },
                { q: 'نوع "Hello"؟', options: ['int', 'str', 'bool', 'list'], answer: 'str', explanation: 'str.' },
                { q: 'نوع True؟', options: ['int', 'str', 'bool', 'list'], answer: 'bool', explanation: 'bool.' }
            ]
        },
        level2: {
            langName: 'Python',
            levelTitle: 'المستوى الثاني: الشروط',
            steps: [
                { type: 'cody', text: 'الجزء الأول: الشروط في Python 🎯' },
                { type: 'cody', text: 'بنستخدم if وبعدها الشرط وبعدها نقطتين :' },
                { type: 'code', code: 'score = 100\nif score == 100:\n    print("مبروك!")' },
                { type: 'choice', question: 'فهمت؟', options: [
                    { text: 'أيوه ✅', reply: 'يلا!' },
                    { text: 'مش أوي 🤔', reply: 'هيتوضح!' }
                ]},
                { type: 'cody', text: 'الجزء التاني: else 🔀' },
                { type: 'code', code: 'if score == 100:\n    print("مبروك!")\nelse:\n    print("حاول!")' },
                { type: 'cody', text: 'الجزء التالت: علامات المقارنة 📊' },
                { type: 'cody', text: '> أكبر، < أصغر، == يساوي، != مش يساوي.' },
                { type: 'cody', text: 'الجزء الرابع: elif 🎨' },
                { type: 'code', code: 'if x > 10:\n    print("كبير")\nelif x > 5:\n    print("متوسط")\nelse:\n    print("صغير")' },
                { type: 'cody', text: 'الجزء الخامس: تطبيق 🎯' },
                { type: 'code', code: 'age = 15\nif age >= 13:\n    print("مراهق")\nelse:\n    print("طفل")' }
            ],
            questions: [
                { q: 'رمز التساوي؟', options: ['=', '==', '===', '!='], answer: '==', explanation: '==' },
                { q: 'نهاية الشرط؟', options: [':', ';', '.', ','], answer: ':', explanation: ':' },
                { q: 'الحالة العكسية؟', options: ['if', 'else', 'for', 'while'], answer: 'else', explanation: 'else.' },
                { q: 'elif؟', options: ['شرط إضافي', 'طباعة', 'متغير', 'دالة'], answer: 'شرط إضافي', explanation: 'شرط.' },
                { q: 'المقارنة الأكبر؟', options: ['>', '<', '==', '!='], answer: '>', explanation: '>' }
            ]
        },
        level3: {
            langName: 'Python',
            levelTitle: 'المستوى الثالث: الحلقات',
            steps: [
                { type: 'cody', text: 'الجزء الأول: الحلقات في Python 🔄' },
                { type: 'code', code: 'for i in range(5):\n    print(i)' },
                { type: 'choice', question: 'فهمت؟', options: [
                    { text: 'أيوه ✅', reply: 'يلا!' },
                    { text: 'مش أوي 🤔', reply: 'هيتوضح!' }
                ]},
                { type: 'cody', text: 'الجزء التاني: range 📏' },
                { type: 'code', code: 'range(5)  # 0,1,2,3,4\nrange(1, 6)  # 1,2,3,4,5' },
                { type: 'cody', text: 'الجزء التالت: while ♾️' },
                { type: 'code', code: 'i = 0\nwhile i < 5:\n    print(i)\n    i += 1' },
                { type: 'cody', text: 'الجزء الرابع: break و continue 🛑' },
                { type: 'code', code: 'for i in range(10):\n    if i == 5:\n        break\n    print(i)' },
                { type: 'cody', text: 'الجزء الخامس: تطبيق 🎯' },
                { type: 'code', code: 'for i in range(1, 4):\n    print("مرحباً " + str(i))' }
            ],
            questions: [
                { q: 'كلمة التكرار؟', options: ['for', 'if', 'def', 'let'], answer: 'for', explanation: 'for.' },
                { q: 'التكرار الشرطي؟', options: ['while', 'for', 'if', 'else'], answer: 'while', explanation: 'while.' },
                { q: 'range(5) كام؟', options: ['5', '4', '6', '3'], answer: '5', explanation: 'من 0 لـ 4.' },
                { q: 'بيوقف الحلقة؟', options: ['break', 'stop', 'end', 'exit'], answer: 'break', explanation: 'break.' },
                { q: 'الفرق؟', options: ['for لعدد، while لشرط', 'مفيش', 'نفس الحاجة', 'for بس'], answer: 'for لعدد، while لشرط', explanation: 'الفرق.' }
            ]
        },
        level4: {
            langName: 'Python',
            levelTitle: 'المستوى الرابع: الدوال',
            steps: [
                { type: 'cody', text: 'الجزء الأول: الدوال في Python 🎁' },
                { type: 'cody', text: 'بنستخدم كلمة def عشان نعرّف دالة.' },
                { type: 'code', code: 'def greet():\n    print("أهلاً!")' },
                { type: 'choice', question: 'فهمت؟', options: [
                    { text: 'أيوه ✅', reply: 'يلا!' },
                    { text: 'مش أوي 🤔', reply: 'هيتوضح!' }
                ]},
                { type: 'cody', text: 'الجزء التاني: نستخدم الدالة 📞' },
                { type: 'code', code: 'greet()\ngreet()' },
                { type: 'cody', text: 'الجزء التالت: بمعاملات 📥' },
                { type: 'code', code: 'def greet(name):\n    print("أهلاً " + name)\ngreet("مريم")' },
                { type: 'cody', text: 'الجزء الرابع: return ↩️' },
                { type: 'code', code: 'def add(a, b):\n    return a + b\nresult = add(3, 4)' },
                { type: 'cody', text: 'الجزء الخامس: تطبيق 🎯' },
                { type: 'code', code: 'def square(x):\n    return x * x\nprint(square(5))' }
            ],
            questions: [
                { q: 'بنعرّف بـ؟', options: ['def', 'function', 'fun', 'void'], answer: 'def', explanation: 'def.' },
                { q: 'بترجع قيمة بـ؟', options: ['return', 'give', 'send', 'back'], answer: 'return', explanation: 'return.' },
                { q: 'نستخدمها إزاي؟', options: ['name()', 'def name', 'call name', 'name'], answer: 'name()', explanation: 'اسم+().' },
                { q: 'المعاملات فين؟', options: ['جوه ()', 'بره', 'بعد return', 'مش بتتحط'], answer: 'جوه ()', explanation: '().' },
                { q: 'def add(a,b): يعني؟', options: ['دالة add', 'متغير', 'حلقة', 'شرط'], answer: 'دالة add', explanation: 'دالة.' }
            ]
        },
        level5: {
            langName: 'Python',
            levelTitle: 'المستوى الخامس: المشاريع',
            steps: [
                { type: 'cody', text: 'الجزء الأول: مراجعة 📚' },
                { type: 'choice', question: 'جاهز؟', options: [
                    { text: 'يلا! 🚀', reply: 'يلا!' },
                    { text: 'أيوه 💪', reply: 'تمام!' }
                ]},
                { type: 'cody', text: 'الجزء التاني: آلة حاسبة 🧮' },
                { type: 'code', code: 'def add(a, b):\n    return a + b\nprint(add(5, 3))' },
                { type: 'cody', text: 'الجزء التالت: لعبة تخمين 🎮' },
                { type: 'code', code: 'secret = 7\nfor i in range(3):\n    guess = int(input("خمن: "))\n    if guess == secret:\n        print("كسبت!")\n        break' },
                { type: 'cody', text: 'الجزء الرابع: جدول الضرب 🎨' },
                { type: 'code', code: 'for i in range(1, 6):\n    print("5 × " + str(i) + " = " + str(5 * i))' },
                { type: 'cody', text: 'الجزء الخامس: إنت مبرمج! 🏆' }
            ],
            questions: [
                { q: 'آلة حاسبة بـ؟', options: ['دالة', 'if', 'مفيش', 'let'], answer: 'دالة', explanation: 'دالة.' },
                { q: 'لعبة تخمين بـ؟', options: ['حلقة + شرط', 'دالة', 'let', 'مفيش'], answer: 'حلقة + شرط', explanation: 'حلقة وشرط.' },
                { q: 'جدول الضرب بـ؟', options: ['for', 'if', 'def', 'return'], answer: 'for', explanation: 'for.' },
                { q: 'بترجع قيمة بـ؟', options: ['return', 'print', 'echo', 'def'], answer: 'return', explanation: 'return.' },
                { q: 'إنت بقيت إيه؟', options: ['مبرمج 🏆', 'طالب', 'مش حاجة', 'مبتدئ'], answer: 'مبرمج 🏆', explanation: 'مبروك!' }
            ]
        }
    },
    cpp: {
        level1: {
            langName: 'C++',
            levelTitle: 'المستوى الأول: المتغيرات',
            steps: [
                { type: 'cody', text: 'الجزء الأول: المتغيرات في C++ 🚀' },
                { type: 'cody', text: 'في C++ لازم نقول للكمبيوتر نوع البيانات.' },
                { type: 'code', code: 'int age = 15;' },
                { type: 'choice', question: 'فهمت؟', options: [
                    { text: 'أيوه ✅', reply: 'يلا!' },
                    { text: 'مش أوي 🤔', reply: 'هيتوضح!' }
                ]},
                { type: 'cody', text: 'الجزء التاني: أنواع البيانات 📊' },
                { type: 'code', code: 'int num = 10;\nstring name = "أحمد";\nbool flag = true;' },
                { type: 'cody', text: 'الجزء التالت: فاصلة منقوطة ; ❕' },
                { type: 'cody', text: 'كل سطر في C++ لازم ينتهي بـ ;' },
                { type: 'choice', question: 'بننهي كل سطر بـ؟', options: [
                    { text: '; ✅', reply: 'صح!' },
                    { text: ':', reply: 'دي Python.' }
                ]},
                { type: 'cody', text: 'الجزء الرابع: cout للطباعة 🖨️' },
                { type: 'code', code: 'cout << name << endl;' },
                { type: 'cody', text: 'الجزء الخامس: تطبيق 🎯' },
                { type: 'code', code: 'int myAge = 12;\nstring myName = "مريم";\ncout << myName;' }
            ],
            questions: [
                { q: 'رقم صحيح؟', options: ['int age = 10;', 'let age = 10;', 'age = 10', 'number'], answer: 'int age = 10;', explanation: 'int.' },
                { q: 'نهاية السطر؟', options: [';', '.', ':', ','], answer: ';', explanation: ';' },
                { q: 'C++ في إيه؟', options: ['الألعاب والأنظمة', 'المواقع بس', 'الطباعة', 'مش بتستخدم'], answer: 'الألعاب والأنظمة', explanation: 'للألعاب.' },
                { q: 'الطباعة بـ؟', options: ['cout', 'print', 'echo', 'console.log'], answer: 'cout', explanation: 'cout.' },
                { q: 'نوع النص؟', options: ['string', 'int', 'bool', 'char'], answer: 'string', explanation: 'string.' }
            ]
        },
        level2: {
            langName: 'C++',
            levelTitle: 'المستوى الثاني: الشروط',
            steps: [
                { type: 'cody', text: 'الجزء الأول: الشروط في C++ 🎯' },
                { type: 'code', code: 'if (score == 100) {\n    cout << "مبروك!";\n}' },
                { type: 'choice', question: 'فهمت؟', options: [
                    { text: 'أيوه ✅', reply: 'يلا!' },
                    { text: 'مش أوي 🤔', reply: 'هيتوضح!' }
                ]},
                { type: 'cody', text: 'الجزء التاني: else 🔀' },
                { type: 'code', code: 'if (score == 100) {\n    cout << "مبروك!";\n} else {\n    cout << "حاول!";\n}' },
                { type: 'cody', text: 'الجزء التالت: علامات المقارنة 📊' },
                { type: 'code', code: 'if (x > 5) { ... }\nif (name == "أحمد") { ... }' },
                { type: 'cody', text: 'الجزء الرابع: else if 🎨' },
                { type: 'code', code: 'if (x > 10) { ... }\nelse if (x > 5) { ... }\nelse { ... }' },
                { type: 'cody', text: 'الجزء الخامس: تطبيق 🎯' },
                { type: 'code', code: 'int age = 15;\nif (age >= 13) {\n    cout << "مراهق";\n} else {\n    cout << "طفل";\n}' }
            ],
            questions: [
                { q: 'الشرط؟', options: ['if', 'when', 'case', 'check'], answer: 'if', explanation: 'if.' },
                { q: 'العكسية؟', options: ['else', 'other', 'or', 'then'], answer: 'else', explanation: 'else.' },
                { q: 'نهاية السطر؟', options: [';', ':', '.', ','], answer: ';', explanation: ';' },
                { q: 'رمز التساوي؟', options: ['=', '==', '===', '!='], answer: '==', explanation: '==' },
                { q: 'تساوي بالظبط؟', options: ['==', '=', '===', '!='], answer: '==', explanation: '==' }
            ]
        },
        level3: {
            langName: 'C++',
            levelTitle: 'المستوى الثالث: الحلقات',
            steps: [
                { type: 'cody', text: 'الجزء الأول: حلقات C++ 🔄' },
                { type: 'code', code: 'for (int i = 0; i < 5; i++) {\n    cout << i;\n}' },
                { type: 'choice', question: 'فهمت؟', options: [
                    { text: 'أيوه ✅', reply: 'يلا!' },
                    { text: 'مش أوي 🤔', reply: 'هيتوضح!' }
                ]},
                { type: 'cody', text: 'الجزء التاني: while ♾️' },
                { type: 'code', code: 'int i = 0;\nwhile (i < 5) {\n    cout << i;\n    i++;\n}' },
                { type: 'cody', text: 'الجزء التالت: break 🛑' },
                { type: 'code', code: 'for (int i = 0; i < 10; i++) {\n    if (i == 5) break;\n}' },
                { type: 'cody', text: 'الجزء الرابع: continue ➡️' },
                { type: 'code', code: 'for (int i = 0; i < 5; i++) {\n    if (i == 3) continue;\n}' },
                { type: 'cody', text: 'الجزء الخامس: تطبيق 🎯' },
                { type: 'code', code: 'for (int i = 1; i <= 3; i++) {\n    cout << "مرحباً " << i;\n}' }
            ],
            questions: [
                { q: 'حلقة عدد؟', options: ['for', 'if', 'else', 'int'], answer: 'for', explanation: 'for.' },
                { q: 'حلقة شرط؟', options: ['while', 'for', 'if', 'def'], answer: 'while', explanation: 'while.' },
                { q: 'بتوقف؟', options: ['break', 'stop', 'end', 'exit'], answer: 'break', explanation: 'break.' },
                { q: 'بتتخطى؟', options: ['continue', 'break', 'skip', 'next'], answer: 'continue', explanation: 'continue.' },
                { q: 'i++؟', options: ['تزود 1', 'تقل 1', 'تضرب', 'توقف'], answer: 'تزود 1', explanation: '++.' }
            ]
        },
        level4: {
            langName: 'C++',
            levelTitle: 'المستوى الرابع: الدوال',
            steps: [
                { type: 'cody', text: 'الجزء الأول: دوال C++ 🎁' },
                { type: 'code', code: 'void greet() {\n    cout << "أهلاً!";\n}' },
                { type: 'choice', question: 'فهمت؟', options: [
                    { text: 'أيوه ✅', reply: 'يلا!' },
                    { text: 'مش أوي 🤔', reply: 'هيتوضح!' }
                ]},
                { type: 'cody', text: 'الجزء التاني: بنستخدمها 📞' },
                { type: 'code', code: 'greet();' },
                { type: 'cody', text: 'الجزء التالت: بمعاملات 📥' },
                { type: 'code', code: 'void greet(string name) {\n    cout << "أهلاً " << name;\n}' },
                { type: 'cody', text: 'الجزء الرابع: return ↩️' },
                { type: 'code', code: 'int add(int a, int b) {\n    return a + b;\n}' },
                { type: 'cody', text: 'الجزء الخامس: تطبيق 🎯' },
                { type: 'code', code: 'int square(int x) {\n    return x * x;\n}\ncout << square(5);' }
            ],
            questions: [
                { q: 'بنعرّف دالة بـ؟', options: ['function', 'def', 'fun', 'void'], answer: 'function', explanation: 'نوع+اسم.' },
                { q: 'بترجع بـ؟', options: ['return', 'give', 'send', 'back'], answer: 'return', explanation: 'return.' },
                { q: 'void؟', options: ['مش بترجع حاجة', 'بترجع رقم', 'بترجع نص', 'مش بتشتغل'], answer: 'مش بترجع حاجة', explanation: 'void.' },
                { q: 'نشغلها بـ؟', options: ['name()', 'call name', 'run', 'def'], answer: 'name()', explanation: 'اسم+().' },
                { q: 'int add() ترجع؟', options: ['رقم', 'نص', 'صح/غلط', 'مفيش'], answer: 'رقم', explanation: 'int.' }
            ]
        },
        level5: {
            langName: 'C++',
            levelTitle: 'المستوى الخامس: المشاريع',
            steps: [
                { type: 'cody', text: 'الجزء الأول: مراجعة 📚' },
                { type: 'choice', question: 'جاهز؟', options: [
                    { text: 'يلا! 🚀', reply: 'يلا!' },
                    { text: 'أيوه 💪', reply: 'تمام!' }
                ]},
                { type: 'cody', text: 'الجزء التاني: آلة حاسبة 🧮' },
                { type: 'code', code: 'int add(int a, int b) {\n    return a + b;\n}' },
                { type: 'cody', text: 'الجزء التالت: لعبة تخمين 🎮' },
                { type: 'code', code: 'int secret = 7;\nfor (int i = 0; i < 3; i++) {\n    int g;\n    cin >> g;\n    if (g == secret) break;\n}' },
                { type: 'cody', text: 'الجزء الرابع: جدول الضرب 🎨' },
                { type: 'code', code: 'for (int i = 1; i <= 5; i++) {\n    cout << 5*i << endl;\n}' },
                { type: 'cody', text: 'الجزء الخامس: إنت مبرمج! 🏆' }
            ],
            questions: [
                { q: 'آلة حاسبة بـ؟', options: ['دالة', 'if', 'مفيش', 'let'], answer: 'دالة', explanation: 'دالة.' },
                { q: 'لعبة تخمين؟', options: ['حلقة + شرط', 'دالة', 'let', 'مفيش'], answer: 'حلقة + شرط', explanation: 'حلقة وشرط.' },
                { q: 'جدول الضرب بـ؟', options: ['for', 'if', 'def', 'return'], answer: 'for', explanation: 'for.' },
                { q: 'بترجع بـ؟', options: ['return', 'cout', 'cin', 'void'], answer: 'return', explanation: 'return.' },
                { q: 'إنت بقيت؟', options: ['مبرمج 🏆', 'طالب', 'مش حاجة', 'مبتدئ'], answer: 'مبرمج 🏆', explanation: 'مبروك!' }
            ]
        }
    }
};

function initState() {
    STATE.user = Auth.getCurrentUser();
    STATE.lang = localStorage.getItem('cq_language') || 'js';
    STATE.level = localStorage.getItem('cq_current_level') || 'level1';
    STATE.progressKey = 'cq_progress_' + STATE.user + '_' + STATE.lang + '_' + STATE.level;
    STATE.doneKey = 'cq_done_' + STATE.user + '_' + STATE.lang + '_' + STATE.level;
    STATE.story = (STORIES[STATE.lang] || STORIES.js)[STATE.level] || STORIES.js.level1;
    STATE.totalSteps = STATE.story.steps.length;
}

function getAvatarUrl() {
    return Auth.getAvatarUrl(STATE.user);
}

function saveProgress() {
    localStorage.setItem(STATE.progressKey, JSON.stringify({
        step: STATE.stepIndex,
        q: STATE.questionIndex,
        score: STATE.score,
        inQuiz: STATE.inQuiz
    }));
}

function $(id) { return document.getElementById(id); }
function scrollChat() { const c = $('chatArea'); if (c) c.scrollTop = c.scrollHeight; }

function codyBubble(html) {
    const b = document.createElement('div');
    b.className = 'chat-row cody-row';
    b.innerHTML = '<div class="chat-avatar cody-avatar-img"><img src="' + CONFIG.codyUrl + '" alt="Cody"></div><div class="chat-bubble cody-bubble">' + html + '</div>';
    $('chatArea').appendChild(b);
    scrollChat();
}

function studentBubble(html) {
    const b = document.createElement('div');
    b.className = 'chat-row student-row';
    b.innerHTML = '<div class="chat-bubble student-bubble">' + html + '</div><div class="chat-avatar student-avatar"><img src="' + getAvatarUrl() + '" alt="Student"></div>';
    $('chatArea').appendChild(b);
    scrollChat();
}

function codeBubble(code) {
    const b = document.createElement('div');
    b.className = 'chat-row cody-row';
    b.innerHTML = '<div class="chat-avatar cody-avatar-img"><img src="' + CONFIG.codyUrl + '" alt="Cody"></div><div class="chat-bubble code-bubble"><pre dir="ltr">' + code + '</pre></div>';
    $('chatArea').appendChild(b);
    scrollChat();
}

function showChoices(step) {
    const area = $('choicesArea');
    const nextBtn = $('nextBtn');
    area.innerHTML = '';
    area.classList.remove('hidden');
    nextBtn.classList.add('hidden');
    step.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = opt.text;
        btn.onclick = () => {
            playSound('click');
            area.classList.add('hidden');
            studentBubble(opt.text);
            playSound('pop');
            setTimeout(() => {
                codyBubble(opt.reply);
                setTimeout(() => { STATE.stepIndex++; saveProgress(); advanceStep(); }, 700);
            }, 400);
        };
        area.appendChild(btn);
    });
}

function advanceStep() {
    if (STATE.stepIndex >= STATE.totalSteps) { startQuiz(); return; }
    const step = STATE.story.steps[STATE.stepIndex];
    const nextBtn = $('nextBtn');
    const choicesArea = $('choicesArea');
    if (step.type === 'cody') {
        codyBubble(step.text);
        choicesArea.classList.add('hidden');
        nextBtn.classList.remove('hidden');
        $('progressFill').style.width = (10 + (STATE.stepIndex / STATE.totalSteps) * 40) + '%';
    } else if (step.type === 'code') {
        codeBubble(step.code);
        choicesArea.classList.add('hidden');
        nextBtn.classList.remove('hidden');
    } else if (step.type === 'choice') {
        if (step.question) codyBubble(step.question);
        showChoices(step);
    }
}

function startQuiz() {
    STATE.inQuiz = true;
    $('nextBtn').classList.add('hidden');
    $('choicesArea').classList.add('hidden');
    document.querySelectorAll('.stage-dot').forEach(d => d.classList.remove('active', 'done'));
    const chatDot = document.querySelector('[data-stage="chat"]');
    const quizDot = document.querySelector('[data-stage="quiz"]');
    if (chatDot) chatDot.classList.add('done');
    if (quizDot) quizDot.classList.add('active');
    $('progressFill').style.width = '60%';
    setTimeout(() => {
        codyBubble('🎯 يلا بينا على الامتحان!');
        setTimeout(() => loadQuestion(), 800);
    }, 400);
}

function loadQuestion() {
    if (STATE.questionIndex >= STATE.story.questions.length) { finishGame(); return; }
    const q = STATE.story.questions[STATE.questionIndex];
    codyBubble('❓ ' + q.q);
    const area = $('choicesArea');
    area.innerHTML = '';
    area.classList.remove('hidden');
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn quiz-choice';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(btn, opt, q.answer, q.explanation);
        area.appendChild(btn);
    });
    $('progressFill').style.width = (60 + ((STATE.questionIndex / STATE.story.questions.length) * 40)) + '%';
}

function checkAnswer(btn, selected, correct, explanation) {
    document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
    studentBubble(selected);
    playSound('pop');
    if (selected === correct) {
        btn.classList.add('correct');
        STATE.score += CONFIG.pointsPerQuestion;
        $('score').innerText = STATE.score;
        playSound('success');
        setTimeout(() => {
            codyBubble('🎉 صح! ' + explanation);
            try { confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#00e5ff', '#27ae60', '#ffffff'] }); } catch(e) {}
            setTimeout(() => { STATE.questionIndex++; saveProgress(); $('choicesArea').classList.add('hidden'); loadQuestion(); }, 1800);
        }, 500);
    } else {
        btn.classList.add('wrong');
        playSound('error');
        setTimeout(() => {
            codyBubble('❌ الصح: ' + correct + ' — ' + explanation);
            setTimeout(() => { STATE.questionIndex++; saveProgress(); $('choicesArea').classList.add('hidden'); loadQuestion(); }, 2200);
        }, 500);
    }
}

function finishGame() {
    $('progressFill').style.width = '100%';
    document.querySelectorAll('.stage-dot').forEach(d => d.classList.remove('active'));
    const quizDot = document.querySelector('[data-stage="quiz"]');
    if (quizDot) quizDot.classList.add('done');
    $('choicesArea').classList.add('hidden');
    localStorage.removeItem(STATE.progressKey);
    localStorage.setItem(STATE.doneKey, 'true');
    const balanceKey = 'cq_balance_' + STATE.user;
    const currentBalance = parseInt(localStorage.getItem(balanceKey) || '0');
    localStorage.setItem(balanceKey, currentBalance + STATE.score);

    setTimeout(() => {
        codyBubble('🎉 مبروك يا ' + STATE.user + '! خلّصت ' + STATE.story.levelTitle + '!');
        setTimeout(() => {
            codyBubble('كسبت ' + STATE.score + ' نقطة! ⭐ رصيدك: ' + (currentBalance + STATE.score) + ' نقطة 💰');
            try { confetti({ particleCount: 250, spread: 120, origin: { y: 0.6 }, colors: ['#00e5ff', '#0072ff', '#27ae60', '#ffd700'] }); } catch(e) {}
            playSound('win');
            const progress = JSON.parse(localStorage.getItem('cq_unlocked_' + STATE.user + '_' + STATE.lang)) || { level1: true };
            const levelNum = parseInt(STATE.level.replace('level', ''));
            for (let i = 1; i <= Math.min(levelNum + 1, 5); i++) {
                progress['level' + i] = true;
            }
            localStorage.setItem('cq_unlocked_' + STATE.user + '_' + STATE.lang, JSON.stringify(progress));
            setTimeout(() => {
                const nextLevelNum = levelNum + 1;
                if (nextLevelNum <= 5) {
                    codyBubble('🔓 المستوى ' + nextLevelNum + ' اتفتح!');
                    const backBtn = document.createElement('button');
                    backBtn.className = 'choice-btn';
                    backBtn.style.background = 'linear-gradient(135deg, #27ae60, #1e8449)';
                    backBtn.innerText = '🗺️ الرجوع للخريطة';
                    backBtn.onclick = () => { window.location.href = 'levels.html'; };
                    $('choicesArea').appendChild(backBtn);
                    $('choicesArea').classList.remove('hidden');
                } else {
                    codyBubble('🏆 خلّصت كل المستويات!');
                    const backBtn = document.createElement('button');
                    backBtn.className = 'choice-btn';
                    backBtn.style.background = 'linear-gradient(135deg, #ffd700, #ff9500)';
                    backBtn.innerText = '🛒 روح للمتجر';
                    backBtn.onclick = () => { window.location.href = 'shop.html'; };
                    $('choicesArea').appendChild(backBtn);
                    $('choicesArea').classList.remove('hidden');
                }
            }, 1200);
        }, 1000);
    }, 400);
}

function showResumeDialog() {
    const saved = JSON.parse(localStorage.getItem(STATE.progressKey));
    $('chatArea').innerHTML = '';
    $('choicesArea').innerHTML = '';
    $('choicesArea').classList.remove('hidden');
    $('nextBtn').classList.add('hidden');
    codyBubble('أهلاً بيك تاني يا ' + STATE.user + '! 👋<br>إنت وقفت عند خطوة رقم ' + (saved.step + 1) + '.<br><br>عايز تكمل ولا نبدأ من الأول؟');
    const resumeBtn = document.createElement('button');
    resumeBtn.className = 'choice-btn';
    resumeBtn.style.background = 'linear-gradient(135deg, #27ae60, #1e8449)';
    resumeBtn.innerText = '▶️ أكمل من حيث وقفت';
    resumeBtn.onclick = () => {
        playSound('click');
        STATE.stepIndex = saved.step || 0;
        STATE.questionIndex = saved.q || 0;
        STATE.score = saved.score || 0;
        $('score').innerText = STATE.score;
        $('choicesArea').classList.add('hidden');
        $('choicesArea').innerHTML = '';
        $('chatArea').innerHTML = '';
        if (STATE.questionIndex > 0 || saved.inQuiz) { startQuiz(); }
        else { advanceStep(); }
    };
    $('choicesArea').appendChild(resumeBtn);
    const restartBtn = document.createElement('button');
    restartBtn.className = 'choice-btn';
    restartBtn.style.background = 'rgba(231,76,60,0.3)';
    restartBtn.innerText = '🔄 ابدأ من الأول';
    restartBtn.onclick = () => {
        playSound('click');
        STATE.stepIndex = 0;
        STATE.questionIndex = 0;
        STATE.score = 0;
        $('score').innerText = 0;
        localStorage.removeItem(STATE.progressKey);
        $('choicesArea').classList.add('hidden');
        $('choicesArea').innerHTML = '';
        $('chatArea').innerHTML = '';
        advanceStep();
    };
    $('choicesArea').appendChild(restartBtn);
}

function showReviewDialog() {
    $('chatArea').innerHTML = '';
    $('choicesArea').innerHTML = '';
    $('choicesArea').classList.remove('hidden');
    $('nextBtn').classList.add('hidden');
    codyBubble('🎉 إنت خلّصت ' + STATE.story.levelTitle + ' قبل كده!<br><br>عايز تراجع المحادثة كلها ولا تبدأ من الأول؟');
    const reviewBtn = document.createElement('button');
    reviewBtn.className = 'choice-btn';
    reviewBtn.style.background = 'linear-gradient(135deg, #00e5ff, #0072ff)';
    reviewBtn.innerText = '📖 راجع المحادثة كلها';
    reviewBtn.onclick = () => {
        playSound('click');
        $('choicesArea').classList.add('hidden');
        $('choicesArea').innerHTML = '';
        $('chatArea').innerHTML = '';
        reviewAll();
    };
    $('choicesArea').appendChild(reviewBtn);
    const restartBtn = document.createElement('button');
    restartBtn.className = 'choice-btn';
    restartBtn.style.background = 'rgba(231,76,60,0.3)';
    restartBtn.innerText = '🔄 ابدأ من الأول';
    restartBtn.onclick = () => {
        playSound('click');
        STATE.stepIndex = 0;
        STATE.questionIndex = 0;
        STATE.score = 0;
        $('score').innerText = 0;
        localStorage.removeItem(STATE.doneKey);
        $('choicesArea').classList.add('hidden');
        $('choicesArea').innerHTML = '';
        $('chatArea').innerHTML = '';
        advanceStep();
    };
    $('choicesArea').appendChild(restartBtn);
}

function reviewAll() {
    $('nextBtn').classList.add('hidden');
    let idx = 0;
    function showNext() {
        if (idx >= STATE.totalSteps) {
            setTimeout(() => {
                codyBubble('🎓 دي كانت مراجعة ' + STATE.story.levelTitle + '.');
                const backBtn = document.createElement('button');
                backBtn.className = 'choice-btn';
                backBtn.style.background = 'linear-gradient(135deg, #27ae60, #1e8449)';
                backBtn.innerText = '🗺️ الرجوع للخريطة';
                backBtn.onclick = () => { window.location.href = 'levels.html'; };
                $('choicesArea').appendChild(backBtn);
                $('choicesArea').classList.remove('hidden');
            }, 500);
            return;
        }
        const step = STATE.story.steps[idx];
        if (step.type === 'cody') codyBubble(step.text);
        else if (step.type === 'code') codeBubble(step.code);
        else if (step.type === 'choice') {
            if (step.question) codyBubble(step.question);
            if (step.options && step.options[0]) {
                studentBubble(step.options[0].text);
                setTimeout(() => codyBubble(step.options[0].reply), 300);
            }
        }
        idx++;
        setTimeout(showNext, 800);
    }
    showNext();
}

document.addEventListener('DOMContentLoaded', () => {
    initState();
    const levelInfoEl = $('levelInfo');
    if (levelInfoEl) levelInfoEl.innerText = STATE.story.levelTitle;
    const scoreEl = $('score');
    if (scoreEl) scoreEl.innerText = 0;

    if (localStorage.getItem(STATE.doneKey) === 'true') {
        showReviewDialog();
    } else if (localStorage.getItem(STATE.progressKey)) {
        showResumeDialog();
    } else {
        advanceStep();
    }
});

window.nextStep = function() {
    playSound('click');
    const btn = document.getElementById('nextBtn');
    if (btn) btn.classList.add('hidden');
    STATE.stepIndex++;
    saveProgress();
    advanceStep();
};

function triggerAchievements(extra) {
    if (typeof Achievements !== 'undefined') {
        setTimeout(() => Achievements.check(extra), 2500);
    }
}

function showCelebration() {
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    const levelNum = parseInt(STATE.level.replace('level', ''));
    const stars = Math.min(3, Math.max(1, Math.ceil(STATE.score / 40)));
    let starsHTML = '';
    for (let i = 0; i < 3; i++) {
        const filled = i < stars;
        starsHTML += '<span class="celebration-star" style="animation-delay:' + (0.3 + i * 0.2) + 's;color:' + (filled ? '#ffd700' : '#444') + '">★</span>';
    }
    overlay.innerHTML = 
        '<div class="celebration-card">' +
            '<div class="celebration-trophy">🏆</div>' +
            '<div class="celebration-title">مبروك يا ' + STATE.user + '!</div>' +
            '<div class="celebration-subtitle">خلصت ' + STATE.story.levelTitle + '</div>' +
            '<div class="celebration-stars">' + starsHTML + '</div>' +
            '<div class="celebration-score">' +
                '<div class="celebration-score-label">النقاط اللي كسبتها</div>' +
                '<div class="celebration-score-value">+' + STATE.score + '</div>' +
            '</div>' +
            '<button class="celebration-btn" id="celebrationContinue">🎯 كمّل للمستوى التالي</button>' +
        '</div>';
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 50);
    setTimeout(() => {
        try { confetti({ particleCount: 300, spread: 130, origin: { y: 0.5 }, colors: ['#00e5ff', '#ffd700', '#27ae60', '#ffffff'] }); } catch(e) {}
        try { if (typeof playSound === 'function') playSound('win'); } catch(e) {}
    }, 400);
    setTimeout(() => {
        try { confetti({ particleCount: 200, spread: 100, origin: { x: 0.2, y: 0.6 }, colors: ['#00e5ff', '#ffd700'] }); } catch(e) {}
    }, 800);
    setTimeout(() => {
        try { confetti({ particleCount: 200, spread: 100, origin: { x: 0.8, y: 0.6 }, colors: ['#27ae60', '#ffffff'] }); } catch(e) {}
    }, 1200);
    document.getElementById('celebrationContinue').onclick = () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 500);
    };
}

const _origFinishGame = finishGame;
window.finishGame = function() {
    _origFinishGame();
    setTimeout(() => {
        showCelebration();
        triggerAchievements({ lastPerfect: STATE.score === STATE.story.questions.length * CONFIG.pointsPerQuestion });
    }, 2500);
};

const _origStartQuiz = startQuiz;
window.startQuiz = function() {
    const gamesCount = parseInt(localStorage.getItem('cq_games_count_' + STATE.user) || '0');
    localStorage.setItem('cq_games_count_' + STATE.user, gamesCount + 1);
    _origStartQuiz();
};

triggerAchievements();
