window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[1] = {
  title: "الفصل 1: الطباعة",
  lessons: [
    {
      title: "الدرس 1: أول أمر", steps: [
        { type: "cody", text: "أهلاً بك يا بطل! 🤖 أنا كودي، سنتعلم اليوم أول أمر برمجي: <code>print()</code>." },
        { type: "cody", text: "تخيل أن الكمبيوتر مساعدك، والأمر <code>print()</code> يطلب منه أن يعرض شيئاً على الشاشة." },
        { type: "choice", question: "هل فهمت الفكرة؟", options: ["نعم، فهمت!", "مش فاهم، ممكن توضيح؟"], replies: ["عظيم! سأعطيك مثالاً.", "بالتأكيد. كل ما تكتبه بين الأقواس سيظهر على الشاشة."] },
        { type: "cody", text: "مثال: <code>print(\"Hello\")</code> سيعرض كلمة Hello. الكلام بين علامات التنصيص هو ما سيظهر." },
        { type: "cody", text: "الآن حان دورك! اكتب كوداً يطبع الجملة <code>Hello, World!</code> في المحرر بالأسفل." },
        { type: "challenge", expected: "Hello, World!", defaultCode: '# اكتب الكود هنا\n', hint: 'print("Hello, World!")', check: (code) => /print\s*\(\s*(['"])Hello, World!\1\s*\)/m.test(code.trim()), successMsg: "عظيم جداً! 🎉 لقد كتبت أول أمر برمجي لك بنجاح!" },
        { type: "cody", text: "أنت مبرمج رائع! اضغط على (متابعة) للانتقال للدرس القادم." }
      ]
    },
    {
      title: "الدرس 2: الأرقام", steps: [
        { type: "cody", text: "أهلاً بعودتك! في الدرس ده هنكتشف إن أمر <code>print()</code> مش بس للكلام، ده كمان بيطبع الأرقام ويحسبها!" },
        { type: "cody", text: "لو كتبنا <code>print(25)</code> من غير علامات تنصيص، الكمبيوتر هيفهم إن ده رقم. ولو كتبنا <code>print(5 + 3)</code> هيعمل العملية ويطبع الناتج." },
        { type: "cody", text: "اكتب سطر يطبع الرقم 25، وسطر تاني يطبع ناتج جمع 5 + 3." },
        { type: "challenge", expected: "25\n8", defaultCode: '# اكتب الكود هنا\n', hint: 'print(25)\nprint(5 + 3)', check: (code) => code.includes('print(25)') && code.includes('print(5 + 3)'), successMsg: "ممتاز! 🌟 شوفت إزاي الكمبيوتر ذكي؟ طبع الرقم وحسب الجمع." },
        { type: "quiz", question: "إيه اللي هيطبعه الكمبيوتر لو كتبنا print(\"5 + 3\")؟", options: ["8", "5 + 3", "خطأ"], correct: 1, explanation: "لأننا حطينا العملية بين تنصيص، الكمبيوتر اعتبرها كلام عادي." },
        { type: "cody", text: "عبقري! كده خلصنا الفصل الأول. جرب تضغط على الفصل التاني في القائمة الجانبية!" }
      ]
    },
    {
      title: "الدرس 3: الطباعة المتعددة", steps: [
        { type: "cody", text: "مرحباً بك مجدداً! يمكنك كتابة عدة أوامر print في نفس الكود، وسيقوم الكمبيوتر بتنفيذها بالترتيب." },
        { type: "cody", text: "تحديك هو: اطبع كلمة <code>مرحبا</code>، ثم كلمة <code>بك</code>، كل واحدة في سطر منفصل." },
        { type: "challenge", expected: "مرحبا\nبك", defaultCode: '# اكتب الكود هنا\n', hint: 'print("مرحبا")\nprint("بك")', check: (code) => code.includes('print("مرحبا")') && code.includes('print("بك")'), successMsg: "مذهل! 🌟 الكمبيوتر ينفذ الأوامر بالترتيب من فوق لتحت." }
      ]
    },
    {
      title: "الدرس 4: اكتشاف الأخطاء", steps: [
        { type: "cody", text: "أهلاً بك في الدرس الرابع! المبرمج المحترف لا يخاف من الأخطاء بل يتعلم منها." },
        { type: "cody", text: "أشهر خطأ: نسيان علامات التنصيص. لو كتبت <code>print(Hello)</code> بدون تنصيص سيعتقد الكمبيوتر أن Hello متغير." },
        { type: "cody", text: "الكود التالي فيه خطأ: <code>print(Hello)</code>. أصلحه ليطبع كلمة Hello بشكل صحيح." },
        { type: "challenge", expected: "Hello", defaultCode: 'print(Hello)\n', hint: 'print("Hello")', check: (code) => /print\s*\(\s*(['"])Hello\1\s*\)/m.test(code.trim()), successMsg: "رائع! أصلحت أول خطأ برمجي في حياتك. هذه مهارة ثمينة جدًا." },
        { type: "quiz", question: "أي مما يلي يمثل كتابة صحيحة لأمر الطباعة؟", options: ["Print(\"Hi\")", "PRINT(\"Hi\")", "print(\"Hi\")"], correct: 2, explanation: "بايثون حساسة لحالة الأحرف. يجب كتابة print بحروف صغيرة." }
      ]
    },
    {
      title: "امتحان الفصل الأول", steps: [
        { type: "cody", text: "أهلاً بك في امتحان الفصل الأول! 🎓" },
        { type: "quiz", question: "1. ما هي وظيفة الأمر print()؟", options: ["يجمع الأرقام", "يعرض النصوص والأرقام على الشاشة", "يمسح الكود"], correct: 1, explanation: "نعم، وظيفته الأساسية هي عرض المخرجات." },
        { type: "quiz", question: "2. ماذا يحدث لو نسينا إغلاق القوس في دالة الطباعة؟", options: ["يعمل الكود بشكل طبيعي", "يحدث خطأ (Syntax Error)", "يطبع القوس تلقائياً"], correct: 1, explanation: "بايثون صارمة جداً في الأقواس." },
        { type: "cody", text: "تحدي برمجي أخير: اطبع <code>Welcome to Cody</code> ثم <code>Level 1</code>." },
        { type: "challenge", expected: "Welcome to Cody\nLevel 1", defaultCode: '# اكتب الكود هنا\n', hint: 'print("Welcome to Cody")\nprint("Level 1")', check: (code) => code.includes('print("Welcome to Cody")') && code.includes('print("Level 1")'), successMsg: "مذهل! 🌟 لقد أثبت جدارتك واجتزت امتحان الفصل الأول." },
        { type: "cody", text: "🎉 مبروك! لقد أكملت الفصل الأول بالكامل." }
      ]
    }
  ]
};