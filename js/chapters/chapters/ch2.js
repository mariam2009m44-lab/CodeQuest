window.CHAPTERS = window.CHAPTERS || {};

window.CHAPTERS[2] = {
  title: "الفصل 2: المتغيرات",
  lessons: [
    {
      title: "الدرس 1: صندوق الأسرار",
      steps: [
        { type: "cody", text: "أهلاً بك في الفصل الثاني! 🎉 في الفصل الأول تعلمت كيف تطبع النصوص والأرقام. لكن ماذا لو أردنا الاحتفاظ بقيمة واستخدامها لاحقاً؟ هنا تأتي المتغيرات." },
        { type: "cody", text: "تخيل أن المتغير هو صندوق سحري. يمكنك وضع شيء بداخله، وكتابة اسم على الصندوق، ثم استخدام هذا الاسم لاحقاً للإشارة إلى ما بداخله." },
        { type: "cody", text: "في بايثون، ننشئ المتغير بكتابة اسمه، ثم علامة يساوي <code>=</code>، ثم القيمة التي نريد تخزينها. مثال: <code>name = \"Cody\"</code>." },
        { type: "choice", question: "هل فهمت فكرة المتغير؟", options: ["نعم، فهمت! إنه مثل الصندوق.", "ممكن توضيح أكثر؟"], replies: ["ممتاز! ستتقنها بسرعة.", "بالتأكيد. فكر فيها كأنك تعطي اسماً لقطة وتقول 'هذه القطة اسمها سمسم'. في البرمجة، تعطي اسماً لقيمة."] },
        { type: "cody", text: "الآن، أنشئ متغيراً اسمه <code>age</code> وضع فيه الرقم <code>10</code>. ثم اطبع قيمة هذا المتغير." },
        { type: "challenge", expected: "10", defaultCode: '# اكتب الكود هنا\n', hint: 'age = 10\nprint(age)', check: (code) => /age\s*=\s*10/.test(code) && /print\s*\(\s*age\s*\)/.test(code), successMsg: "أحسنت! 🎉 لقد أنشأت أول متغير لك وطبعت قيمته." },
        { type: "cody", text: "الآن، جرب أن تضع نصاً في متغير. أنشئ متغيراً اسمه <code>greeting</code> وضع فيه النص <code>\"Hello\"</code>، ثم اطبعه." },
        { type: "challenge", expected: "Hello", defaultCode: '# اكتب الكود هنا\n', hint: 'greeting = "Hello"\nprint(greeting)', check: (code) => /greeting\s*=\s*(['"])Hello\1/.test(code) && /print\s*\(\s*greeting\s*\)/.test(code), successMsg: "مذهل! المتغيرات يمكنها تخزين النصوص أيضاً، وليس الأرقام فقط." },
        { type: "quiz", question: "ما هو المتغير في البرمجة؟", options: ["أداة لحذف الأكواد.", "مكان لتخزين قيمة واستخدامها لاحقاً.", "أمر لطباعة النصوص."], correct: 1, explanation: "المتغير هو بمثابة وعاء أو صندوق نضع فيه قيمة (رقم، نص، إلخ) ونعطيه اسماً لنستخدمه وقت الحاجة." },
        { type: "cody", text: "رائع! لقد أتممت الدرس الأول. الآن أنت تعرف كيف تخزن البيانات. في الدرس التالي، ستتعلم كيف تغير هذه القيم." }
      ]
    },
    {
      title: "الدرس 2: تغيير قيم المتغيرات",
      steps: [
        { type: "cody", text: "أهلاً بعودتك! هل تعلم أن قيمة المتغير يمكن أن تتغير؟ إنه ليس صندوقاً ثابتاً، بل يمكنك استبدال ما بداخله في أي وقت." },
        { type: "cody", text: "على سبيل المثال، إذا كان لدينا متغير <code>score = 0</code>، فهذا يعني أن النتيجة صفر. إذا أردنا زيادة النتيجة، يمكننا كتابة <code>score = 100</code>. هذا سيستبدل القيمة القديمة (0) بالقيمة الجديدة (100)." },
        { type: "cody", text: "الكمبيوتر ينفذ الأوامر بالترتيب. لذا إذا طبعت المتغير بعد تغييره، ستحصل على القيمة الجديدة." },
        { type: "cody", text: "أنشئ متغيراً اسمه <code>points</code> وقيمته <code>5</code>. ثم غير قيمته إلى <code>20</code>. أخيراً، اطبع قيمة <code>points</code>." },
        { type: "challenge", expected: "20", defaultCode: '# اكتب الكود هنا\n', hint: 'points = 5\npoints = 20\nprint(points)', check: (code) => /points\s*=\s*5/.test(code) && /points\s*=\s*20/.test(code) && /print\s*\(\s*points\s*\)/.test(code), successMsg: "ممتاز! 🌟 لقد رأيت كيف تم استبدال القيمة القديمة بالجديدة." },
        { type: "cody", text: "ماذا تعتقد سيحدث لو كتبنا الكود التالي؟<br><code>x = 10<br>x = 20<br>x = 30<br>print(x)</code>" },
        { type: "quiz", question: "ما هي القيمة التي ستُطبع من الكود السابق؟", options: ["10", "20", "30"], correct: 2, explanation: "الكمبيوتر ينفذ التعليمات سطراً بسطر. آخر قيمة تم تعيينها للمتغير x هي 30، لذا هذا ما سيتم طباعته." },
        { type: "cody", text: "هناك طريقة مختصرة لزيادة قيمة المتغير. بدلاً من كتابة <code>score = score + 10</code>، يمكنك كتابة <code>score += 10</code>. هذا يعني 'أضف 10 إلى القيمة الحالية'." },
        { type: "cody", text: "جربها! أنشئ متغيراً <code>health = 100</code>، ثم استخدم <code>health -= 30</code> لإنقاص قيمته، ثم اطبع القيمة النهائية." },
        { type: "challenge", expected: "70", defaultCode: '# اكتب الكود هنا\n', hint: 'health = 100\nhealth -= 30\nprint(health)', check: (code) => /health\s*=\s*100/.test(code) && /health\s*-=\s*30/.test(code) && /print\s*\(\s*health\s*\)/.test(code), successMsg: "عبقري! لقد استخدمت طريقة مختصرة لتحديث قيمة المتغير." },
        { type: "cody", text: "رائع! أنت الآن تعرف كيف تخزن القيم وتغيرها. هذا هو أساس كل برنامج. استعد للدرس الثالث حيث سندمج النصوص." }
      ]
    },
    {
      title: "الدرس 3: دمج النصوص",
      steps: [
        { type: "cody", text: "مرحباً! في الدرس السابق، تعاملنا مع متغيرات تحمل أرقاماً. اليوم، سنتعامل مع متغيرات تحمل نصوصاً (Strings)." },
        { type: "cody", text: "يمكنك دمج نصين أو أكثر معاً باستخدام علامة الزائد <code>+</code>. هذه العملية تسمى 'الدمج' (Concatenation)." },
        { type: "cody", text: "على سبيل المثال، إذا كان لدينا <code>first_name = \"Cody\"</code> و <code>last_name = \"Academy\"</code>، يمكننا طباعة الاسم الكامل بكتابة <code>print(first_name + \" \" + last_name)</code>." },
        { type: "cody", text: "لاحظ أننا أضفنا <code>\" \"</code> (مسافة) بين الاسمين. بدونها، سيظهر الاسم ملتصقاً." },
        { type: "choice", question: "ماذا سيحدث إذا استخدمنا print(first_name + last_name) بدون مسافة؟", options: ["سيظهر خطأ.", "سيُطبع CodyAcademy.", "سيُطبع Cody Academy."], replies: ["لا، الدمج يعمل بشكل صحيح.", "بالضبط! سيتم دمج النصين مباشرة.", "لا، لن يتم إضافة مسافة تلقائياً."] },
        { type: "cody", text: "أنشئ متغيرين: <code>word1 = \"Hello\"</code> و <code>word2 = \"World\"</code>. ثم اطبع الجملة <code>Hello World</code> باستخدام الدمج وإضافة مسافة بينهما." },
        { type: "challenge", expected: "Hello World", defaultCode: '# اكتب الكود هنا\n', hint: 'word1 = "Hello"\nword2 = "World"\nprint(word1 + " " + word2)', check: (code) => /word1\s*=\s*(['"])Hello\1/.test(code) && /word2\s*=\s*(['"])World\1/.test(code) && /print\s*\(\s*word1\s*\+\s*(['"])\s*\1\s*\+\s*word2\s*\)/.test(code), successMsg: "تمام! 🌟 دمج النصوص مفيد جداً لبناء الرسائل." },
        { type: "cody", text: "هناك طريقة أخرى لدمج النصوص والأرقام معاً، وهي استخدام الفاصلة <code>,</code> داخل دالة الطباعة. على سبيل المثال: <code>print(\"My age is\", age)</code>. هذه الطريقة تضيف مسافة تلقائياً وتسمح بدمج أنواع بيانات مختلفة." },
        { type: "cody", text: "جربها! أنشئ متغيراً <code>name</code> وضع فيه اسمك، ثم اطبع جملة <code>My name is [اسمك]</code> باستخدام الفاصلة." },
        { type: "challenge", expected: "My name is Ali", defaultCode: '# اكتب الكود هنا\n', hint: 'name = "Ali"\nprint("My name is", name)', check: (code) => /name\s*=\s*(['"])Ali\1/.test(code) && /print\s*\(\s*(['"])My name is\1\s*,\s*name\s*\)/.test(code), successMsg: "رائع! استخدام الفاصلة يجعل الكود أنظف وأسهل." },
        { type: "quiz", question: "أي طريقة صحيحة لدمج نص ورقم في الطباعة؟", options: ["print(\"Age:\" + 10)", "print(\"Age:\", 10)", "كلاهما صحيح"], correct: 1, explanation: "لا يمكن استخدام + لدمج نص مع رقم مباشرة (سيسبب خطأ). يجب استخدام الفاصلة , أو تحويل الرقم إلى نص أولاً." },
        { type: "cody", text: "أحسنت! الآن يمكنك بناء جمل كاملة من أجزاء مختلفة. استعد للدرس الأخير في هذا الفصل." }
      ]
    },
    {
      title: "الدرس 4: قواعد تسمية المتغيرات",
      steps: [
        { type: "cody", text: "أهلاً بك في الدرس الأخير من فصل المتغيرات! كما أن لكل شخص اسماً، لكل متغير اسم. لكن هناك قواعد لتسمية المتغيرات." },
        { type: "cody", text: "القاعدة الأولى: اسم المتغير يجب أن يبدأ بحرف (a-z أو A-Z) أو شرطة سفلية (_). لا يمكن أن يبدأ برقم." },
        { type: "cody", text: "القاعدة الثانية: يمكن أن يحتوي الاسم على أحرف وأرقام وشرطات سفلية، لكن لا يمكن أن يحتوي على مسافات أو رموز خاصة مثل @ أو #." },
        { type: "cody", text: "القاعدة الثالثة: بايثون حساسة لحالة الأحرف. لذا <code>Name</code> و <code>name</code> هما متغيران مختلفان تماماً." },
        { type: "quiz", question: "أي من أسماء المتغيرات التالية صحيح؟", options: ["2user", "user name", "user_name"], correct: 2, explanation: "الاسم user_name صحيح لأنه يستخدم شرطة سفلية بدلاً من المسافة، ولا يبدأ برقم." },
        { type: "cody", text: "دعنا نختبر فهمك. أي من هذه الأسماء غير صالح ولماذا؟<br><code>my-var = 5</code>" },
        { type: "quiz", question: "ما هو الخطأ في الاسم my-var؟", options: ["يبدأ بحرف.", "يحتوي على شرطة (-) وهي رمز غير مسموح.", "طويل جداً."], correct: 1, explanation: "الشرطة (-) تعتبر رمزاً خاصاً (operator) في بايثون، ولا يمكن استخدامها في أسماء المتغيرات. الصحيح هو my_var." },
        { type: "cody", text: "من الأفضل دائماً استخدام أسماء وصفية. <code>user_age</code> أفضل من <code>a</code>. هذا يجعل الكود أسهل للقراءة والفهم." },
        { type: "cody", text: "أنشئ متغيراً باسم <code>student_name</code> وضع فيه اسمك، ثم اطبعه." },
        { type: "challenge", expected: "Ali", defaultCode: '# اكتب الكود هنا\n', hint: 'student_name = "Ali"\nprint(student_name)', check: (code) => /student_name\s*=\s*(['"])Ali\1/.test(code) && /print\s*\(\s*student_name\s*\)/.test(code), successMsg: "عمل رائع! لقد اتبعت قواعد التسمية واستخدمت اسماً وصفياً." },
        { type: "cody", text: "🎉 مبروك! لقد أكملت فصل المتغيرات بالكامل. تعلمت كيف تنشئ المتغيرات، تغير قيمها، تدمج النصوص، وتسميها بشكل صحيح." },
        { type: "cody", text: "في الفصل القادم، سنتعلم كيف نجعل البرنامج يتخذ قرارات باستخدام الشروط (if/else). استعد!" }
      ]
    }
  ]
};