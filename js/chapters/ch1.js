window.CHAPTERS = window.CHAPTERS || {};

window.CHAPTERS[1] = {
  title: "الفصل 1: الطباعة",
  lessons: [
    {
      title: "الدرس 1: أول أمر في بايثون",
      steps: [
        { type: "cody", text: "أهلاً بك يا بطل في أول درس! 🤖 اسمي كودي، وسأكون دليلك في هذه الرحلة المذهلة لتعلم البرمجة." },
        { type: "cody", text: "قبل أن نبدأ، هل تعلم ما هي البرمجة؟" },
        { type: "choice", question: "اختر إجابتك:", options: ["لا، عرفني!", "أعتقد أنها كتابة أوامر للكمبيوتر.", "سمعت عنها، لكنني أريد التطبيق."], replies: ["ولا يهمك، سأشرحها لك الآن ببساطة!", "إجابة رائعة! أنت قريب من الفكرة.", "ممتاز! سنكتب الكود من أول درس."] },
        { type: "cody", text: "البرمجة هي إعطاء أوامر للكمبيوتر بلغة يفهمها، ليقوم بتنفيذها. تمامًا كما تعطي قائداً تعليمات البناء." },
        { type: "cody", text: "في لغة بايثون، أول أمر سنتعلمه هو أمر الطباعة: <code>print()</code>." },
        { type: "cody", text: "تخيل أن <code>print()</code> هو صديقك الذي ينطق ما تريده على الشاشة. أنت تكتب داخل القوسين ما تريد أن يظهر." },
        { type: "choice", question: "هل فهمت المفهوم الأساسي؟", options: ["نعم، فهمت!", "ممكن توضح أكتر؟"], replies: ["عظيم! سأعطيك مثالاً.", "بالطبع. ببساطة، كل ما تكتبه بين الأقواس سيظهر على الشاشة."] },
        { type: "cody", text: "المثال الأول: <code>print(\"Cody\")</code>. ماذا تعتقد سيظهر على الشاشة؟" },
        { type: "choice", question: "ما هي نتيجة هذا الكود؟", options: ["Cody", "print(Cody)", "\"Cody\""], replies: ["بالضبط! ستظهر كلمة Cody فقط.", "لا، الكمبيوتر يعرض ما بين القوسين فقط.", "لا، علامات التنصيص لا تظهر، هي فقط لإخبار الكمبيوتر أن هذا نص."] },
        { type: "cody", text: "الآن حان دورك! اكتب كودًا يطبع الكلمة <code>Hello</code>." },
        { type: "challenge", expected: "Hello", defaultCode: '# اكتب الكود هنا\n', hint: 'print("Hello")', check: (code) => /print\s*\(\s*(['"])Hello\1\s*\)/m.test(code.trim()), successMsg: "أحسنت! 🎉 كتبت أول أمر برمجي لك. الأرقام والحروف أصبحت بين يديك الآن." },
        { type: "cody", text: "الآن، تحدي إضافي صغير. اطبع الجملة <code>I am learning Python</code>." },
        { type: "challenge", expected: "I am learning Python", defaultCode: '# اكتب الكود هنا\n', hint: 'print("I am learning Python")', check: (code) => /print\s*\(\s*(['"])I am learning Python\1\s*\)/m.test(code.trim()), successMsg: "مذهل! 🌟 أنت تتحسن بسرعة. الجُمل الطويلة والمسافات لا تعيقك." },
        { type: "cody", text: "أنت الآن جاهز لبدء الدرس الثاني. تقدمك محفوظ." }
      ]
    },
    {
      title: "الدرس 2: الطباعة والأرقام",
      steps: [
        { type: "cody", text: "أهلاً بعودتك يا بطل! في الدرس السابق عرفنا أن print تطبع النصوص. اليوم سنكتشف قدرتها على طباعة الأرقام." },
        { type: "cody", text: "إذا كتبنا <code>print(25)</code> بدون علامات تنصيص، سيفهم الكمبيوتر أن هذا رقم صحيح وسيطبعه." },
        { type: "cody", text: "جرّب أنت! اطبع الرقم <code>100</code>." },
        { type: "challenge", expected: "100", defaultCode: '# اكتب الكود هنا\n', hint: 'print(100)', check: (code) => /print\s*\(\s*100\s*\)/m.test(code.trim()), successMsg: "أحسنت! الأرقام لا تحتاج إلى علامات تنصيص." },
        { type: "cody", text: "ولكن ماذا لو احتجنا أن نجري عملية حسابية؟ بايثون ذكية وتستطيع الحساب!" },
        { type: "cody", text: "على سبيل المثال: <code>print(5 + 3)</code> سيقوم الكمبيوتر بجمع الرقمين وعرض الناتج <code>8</code>." },
        { type: "cody", text: "تخيل أنك تمتلك آلة حاسبة جبارة داخل الكود الخاص بك. اطبع ناتج جمع <code>10 + 20</code> بنفسك." },
        { type: "challenge", expected: "30", defaultCode: '# اكتب الكود هنا\n', hint: 'print(10 + 20)', check: (code) => /print\s*\(\s*10\s*\+\s*20\s*\)/m.test(code.trim()), successMsg: "ممتاز! الكمبيوتر أجرى العملية الحسابية وطبع الناتج فوراً." },
        { type: "cody", text: "وهنا سؤال ذكي: لو كتبنا <code>print(\"5 + 3\")</code> (مع علامات التنصيص)، ماذا سيحدث؟" },
        { type: "quiz", question: "ماذا سيطبع الكمبيوتر عند تنفيذ print(\"5 + 3\")؟", options: ["8", "5 + 3", "خطأ"], correct: 1, explanation: "علامات التنصيص تجعل الكمبيوتر يتعامل معها كنص عادي، فيطبعها كما هي دون أن يحسبها." },
        { type: "cody", text: "الآن لديك فهم عميق للفرق بين النصوص والأرقام داخل الطباعة. اطبع تحدي أخير: ناتج طرح 50 - 15، ورقم 7، في سطرين منفصلين." },
        { type: "challenge", expected: "35\n7", defaultCode: '# اكتب الكود هنا\n', hint: 'print(50 - 15)\nprint(7)', check: (code) => code.includes('print(50 - 15)') && code.includes('print(7)'), successMsg: "رائع! أنت الآن مطور صغير يعرف كيف يستخدم الطباعة والحساب." },
        { type: "cody", text: "استعد للدرس الثالث حيث سنكتب عدة أسطر معاً." }
      ]
    },
    {
      title: "الدرس 3: الطباعة المتعددة",
      steps: [
        { type: "cody", text: "مرحباً بك مجدداً! في الدرس الماضي كتبنا أكثر من سطر للطباعة، واليوم سنتعمق أكثر في هذا الأمر." },
        { type: "cody", text: "في بايثون، يمكنك كتابة عدة أوامر print في نفس الكود، وسيقوم الكمبيوتر بتنفيذها بالترتيب من السطر الأول إلى الأخير." },
        { type: "cody", text: "مثال: <code>print(\"السطر الأول\")\nprint(\"السطر الثاني\")</code> سيطبع السطرين واحدًا تلو الآخر." },
        { type: "choice", question: "ماذا يحدث إذا كتبت 3 أوامر print؟", options: ["الكمبيوتر يختار أمر واحد فقط.", "ينفذها كلها بالترتيب.", "يحدث خطأ."], replies: ["لا، الكمبيوتر ينفذ كل الأوامر.", "بالتأكيد! بالترتيب من فوق لتحت.", "لا يحدث خطأ مطلقاً."] },
        { type: "cody", text: "تحديك هو: اطبع كلمة <code>مرحبا</code>، ثم كلمة <code>بك</code>، ثم <code>في بايثون</code>، كل واحدة في سطر منفصل." },
        { type: "challenge", expected: "مرحبا\nبك\nفي بايثون", defaultCode: '# اكتب الكود هنا\n', hint: 'print("مرحبا")\nprint("بك")\nprint("في بايثون")', check: (code) => code.includes('print("مرحبا")') && code.includes('print("بك")') && code.includes('print("في بايثون")'), successMsg: "مذهل! 🌟 الكمبيوتر ينفذ الأوامر بالترتيب الذي كتبتها به." },
        { type: "cody", text: "هناك طريقة أخرى لكتابة النصوص الطويلة: استخدم <code>\\n</code> داخل النص ليقوم الكمبيوتر بكسر السطر تلقائياً." },
        { type: "cody", text: "تحدي متقدم: اطبع في أمر واحد، الجملة <code>أهلاً\nكودي</code> باستخدام الرمز <code>\\n</code>." },
        { type: "challenge", expected: "أهلاً\nكودي", defaultCode: '# اكتب الكود هنا\n', hint: 'print("أهلاً\\nكودي")', check: (code) => /print\s*\(\s*(['"])أهلاً\\nكودي\1\s*\)/m.test(code.trim()), successMsg: "عبقري! استخدمت \\n لكسر السطر داخل أمر طباعة واحد." },
        { type: "cody", text: "أصبحت الآن تعرف طرقاً متعددة لكتابة وتنسيق المخرجات. استعد للدرس الأخير!" }
      ]
    },
    {
      title: "الدرس 4: اكتشاف الأخطاء",
      steps: [
        { type: "cody", text: "أهلاً بك في الدرس الرابع! المبرمج المحترف لا يخاف من الأخطاء، بل يتعلم منها." },
        { type: "cody", text: "أشهر خطأ يقع فيه المبتدئون هو نسيان علامات التنصيص. لو كتبت <code>print(Hello)</code> بدون تنصيص، سيعتقد الكمبيوتر أن Hello هو متغير." },
        { type: "cody", text: "دعنا نجرب. الكود التالي فيه خطأ: <code>print(Hello)</code>. أصلحه ليطبع كلمة Hello بشكل صحيح." },
        { type: "challenge", expected: "Hello", defaultCode: 'print(Hello)\n', hint: 'print("Hello")', check: (code) => /print\s*\(\s*(['"])Hello\1\s*\)/m.test(code.trim()), successMsg: "رائع! أصلحت أول خطأ برمجي في حياتك. هذه مهارة ثمينة جدًا." },
        { type: "cody", text: "الخطأ الثاني الشائع: نسيان قوس الإغلاق. لو كتبت <code>print(\"Hi\"</code> بدون قوس الإغلاق، سيتوقف الكمبيوتر ويظهر خطأ." },
        { type: "cody", text: "أصلح هذا الكود: <code>print(\"Welcome\"</code>. لا تنسَ إغلاق القوس!" },
        { type: "challenge", expected: "Welcome", defaultCode: 'print("Welcome"\n', hint: 'print("Welcome")', check: (code) => /print\s*\(\s*(['"])Welcome\1\s*\)/m.test(code.trim()), successMsg: "عمل ممتاز! الأقواس المتوازنة أساسية في كل لغات البرمجة." },
        { type: "cody", text: "الخطأ الثالث: استخدام حرف كبير في بداية الأمر. <code>Print()</code> بحرف P كبير خطأ. يجب أن يكون <code>print()</code> بحرف p صغير." },
        { type: "quiz", question: "أي مما يلي يمثل كتابة صحيحة لأمر الطباعة؟", options: ["Print(\"Hi\")", "PRINT(\"Hi\")", "print(\"Hi\")"], correct: 2, explanation: "بايثون حساسة لحالة الأحرف (Case Sensitive). يجب كتابة print بحروف صغيرة." },
        { type: "cody", text: "أنت الآن تعرف كيف تكتشف الأخطاء الشائعة وتصلحها. استعد للامتحان الشامل للفصل!" }
      ]
    },
    {
      title: "امتحان الفصل الأول",
      steps: [
        { type: "cody", text: "أهلاً بك في امتحان الفصل الأول! 🎓 سأطرح عليك 3 أسئلة، وتحدي برمجي أخير. هل أنت مستعد؟" },
        { type: "choice", question: "لنبدأ بسؤال سريع قبل الامتحان:", options: ["أنا جاهز!", "متحمس جداً!"], replies: ["رائع! لنبدأ.", "حماسك هو سر نجاحك! هيا بنا."] },
        { type: "quiz", question: "1. ما هي وظيفة الأمر print()؟", options: ["يجمع الأرقام", "يعرض النصوص والأرقام على الشاشة", "يمسح الكود"], correct: 1, explanation: "نعم، وظيفته الأساسية هي عرض المخرجات." },
        { type: "quiz", question: "2. كيف نطبع جملة نصية في بايثون؟", options: ["print(\"Hello\")", "print(Hello)", "Print(Hello)"], correct: 0, explanation: "يجب وضع النص بين علامات تنصيص واستخدام print بحروف صغيرة." },
        { type: "quiz", question: "3. ماذا يحدث لو نسينا إغلاق القوس في دالة الطباعة؟", options: ["يعمل الكود بشكل طبيعي", "يحدث خطأ (Syntax Error)", "يطبع القوس تلقائياً"], correct: 1, explanation: "بايثون صارمة جداً في الأقواس، ونسيانها يسبب خطأ." },
        { type: "cody", text: "أحسنت! الآن التحدي البرمجي الأخير لاجتياز الفصل. اطبع عبارة الترحيب التالية بالضبط: <br><code>Welcome to Cody</code><br>ثم في السطر التالي اطبع: <br><code>Level 1</code>" },
        { type: "challenge", expected: "Welcome to Cody\nLevel 1", defaultCode: '# اكتب الكود هنا\n', hint: 'print("Welcome to Cody")\nprint("Level 1")', check: (code) => code.includes('print("Welcome to Cody")') && code.includes('print("Level 1")'), successMsg: "مذهل! 🌟 لقد أثبت جدارتك واجتزت امتحان الفصل الأول بنجاح." },
        { type: "cody", text: "🎉 مبروك! لقد أكملت الفصل الأول بالكامل وحصلت على 3 نجوم. لقد أصبحت الآن مستعداً للفصل القادم: المتغيرات!" }
      ]
    }
  ]
};