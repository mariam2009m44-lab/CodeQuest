window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[7] = {
  title: "الفصل 7: مصنع الآلات (الدوال)",
  lessons: [
    {
      title: "الدرس 1: اختراع آلة (def)", steps: [
        { type: "cody", text: "أهلاً بك في الفصل السابع! 🏭 النهاردة هنفتح (مصنع) بتاعنا، وهنصنع آلات بتخلص شغل معين." },
        { type: "cody", text: "تخيل إنك كل يوم الصبح بتكتب نفس الـ 10 أسطر عشان ترحب بأصحابك. مش ده مضيعة للوقت؟" },
        { type: "choice", question: "إيه أفضل حل عشان متكتبش نفس الكود كل يوم؟", options: ["أكتبهم 100 مرة", "أعمل (آلة) أو (دالة) تطبع الترحيب بكلمة واحدة"], replies: ["لا طبعاً، ده هيتعبك جداً وهيخلي الكود طويل.", "عاش! الآلة دي في البرمجة بنسميها <code>Function</code> أو (دالة)."] },
        { type: "cody", text: "عشان نصنع آلة في بايثون، بنستخدم كلمة <code>def</code> (اختصار define يعني عرّف). وبعدها بنكتب اسم الآلة والأقواس <code>()</code>." },
        { type: "cody", text: "بص على الآلة دي:<br><code>def say_hi():<br>    print(\"Hi!\")</code><br>عشان نشغل الآلة دي، بنكتب اسمها وبس: <code>say_hi()</code>." },
        { type: "cody", text: "تحديك: اصنع دالة اسمها <code>greet</code> تطبع كلمة <code>Welcome</code>، وبعدين شغلها (استدعيها)." },
        { type: "challenge", expected: "Welcome", defaultCode: '# اكتب الكود هنا\n', hint: 'def greet():\n    print("Welcome")\ngreet()', check: (code) => code.includes('def greet():') && code.includes('print("Welcome")') && code.includes('greet()'), successMsg: "رائع! 🌟 لقد اخترعت أول آلة برمجية ليك." }
      ]
    },
    {
      title: "الدرس 2: خلط المكونات (Parameters)", steps: [
        { type: "cody", text: "مرحباً بعودتك يا صانع الآلات! المرة دي هنطور الآلة بتاعتنا." },
        { type: "cody", text: "لو عايزين الآلة ترحب بشخص معين (مثلاً كودي)، هنخليها تستقبل (مكون) من بره. المكون ده بنسميه <code>parameter</code>." },
        { type: "choice", question: "إزاي نكتب الآلة عشان تستقبل اسم؟", options: ["def greet():", "def greet(name):"], replies: ["لا، كده الآلة شغالة في سرها ومش هتعرف اسم مين.", "بالظبط! كده لما نشغل الآلة هنديها الاسم اللي هيطبعه."] },
        { type: "cody", text: "شوف المثال:<br><code>def greet(name):<br>    print(\"Hello\", name)</code><br>عشان نشغلها ونقولها اسم علي: <code>greet(\"Ali\")</code>." },
        { type: "cody", text: "تحديك: اعمل دالة اسمها <code>add</code> بتستقبل رقمين (a و b)، وتطبع مجموعهم. وبعدين شغلها على الأرقام 5 و 10." },
        { type: "challenge", expected: "15", defaultCode: '# اكتب الكود هنا\n', hint: 'def add(a, b):\n    print(a + b)\nadd(5, 10)', check: (code) => code.includes('def add(a, b):') && code.includes('print(a + b)') && code.includes('add(5, 10)'), successMsg: "ممتاز! الآلة بتاعتك بقت بتستقبل مكونات وتعمل عمليات حسابية." }
      ]
    },
    {
      title: "الدرس 3: استلام المنتج النهائي (return)", steps: [
        { type: "cody", text: "جيت في الوقت المناسب! عندي سؤال محيرني. إيه الفرق بين إن الآلة تطبع الحاجة، وإنها (ترجعها) لك؟" },
        { type: "cody", text: "لما بنستخدم <code>print</code> جوه الدالة، دي مجرد شاشة بتعرض. لكن لو عايزين نحتفظ بالناتج ونستخدمه في حسابات تانية، بنستخدم <code>return</code>." },
        { type: "choice", question: "لو عايزين نحسب مساحة مستطيل ونحتفظ بالرقم عشان نضيفه على حاجة تانية، نستخدم إيه؟", options: ["print", "return"], replies: ["الـ print بيعرض وبس ومش بيرجع القيمة للبرنامج.", "بالضبط! return بترجع القيمة كأنها هدية بتاخدها وتكمل بيها شغلك."] },
        { type: "cody", text: "تحديك: اكتب دالة اسمها <code>square</code> بتاخد رقم (x)، وبترجع (return) مربع الرقم ده. بعدين اطبع الناتج باستخدام print مع الرقم 4." },
        { type: "challenge", expected: "16", defaultCode: '# اكتب الكود هنا\n', hint: 'def square(x):\n    return x * x\nprint(square(4))', check: (code) => code.includes('def square(x):') && code.includes('return x * x') && code.includes('print(square(4))'), successMsg: "عبقري! استخدمت return ورجعت القيمة وطباعتها." }
      ]
    },
    {
      title: "الدرس 4: مصنعك المتكامل", steps: [
        { type: "cody", text: "آخر درس! هنصنع آلة معقدة شوية بتجمع بين النصوص والمتغيرات." },
        { type: "cody", text: "عايزين دالة اسمها <code>welcome</code>، بتستقبل (name) وتطبع جملة ترحيب كاملة." },
        { type: "cody", text: "تحديك: اعمل الدالة دي، وخليها تطبع (Hello) وبعدها الاسم اللي هيتبعت لها. وشغلها باسمك (أو بأي اسم)." },
        { type: "challenge", expected: "Hello Ali", defaultCode: '# اكتب الكود هنا\n', hint: 'def welcome(name):\n    print("Hello", name)\nwelcome("Ali")', check: (code) => code.includes('def welcome(name):') && code.includes('print("Hello", name)') && code.includes('welcome('), successMsg: "مذهل! دمجت النصوص والمتغيرات في دالة واحدة." }
      ]
    },
    {
      title: "الامتحان الشامل للفصل", steps: [
        { type: "cody", text: "حان وقت الامتحان النهائي في مصنع الآلات! 🎓 يلا نختبر معلوماتك." },
        { type: "choice", question: "هل تعتقد إنك جاهز؟", options: ["جاهز جداً!", "محتاج أتأكد من حاجة"], replies: ["عظيم، يلا بينا!", "طبعاً، افتكر: def للتعريف، return للإرجاع، والـ print للعرض."] },
        { type: "quiz", question: "1. إيه الكلمة المفتاحية اللي بنستخدمها عشان نعرّف دالة؟", options: ["func", "def", "function"], correct: 1, explanation: "في بايثون بنستخدم def." },
        { type: "quiz", question: "2. إيه اللي بيرجع القيمة من الدالة للبرنامج الأساسي؟", options: ["print", "return", "input"], correct: 1, explanation: "return هي المسؤولة عن إرجاع القيمة." },
        { type: "cody", text: "تحدي برمجي أخير: اصنع دالة اسمها <code>multiply</code> بتستقبل رقمين وترجع ناتج ضربهم. اطبع الناتج لـ (3 و 4)." },
        { type: "challenge", expected: "12", defaultCode: '# اكتب الكود هنا\n', hint: 'def multiply(a, b):\n    return a * b\nprint(multiply(3, 4))', check: (code) => code.includes('def multiply(a, b):') && code.includes('return a * b') && code.includes('print(multiply(3, 4))'), successMsg: "🎉 مبروك! أنت الآن محترف في صناعة الدوال واجتزت الفصل السابع." }
      ]
    }
  ]
};