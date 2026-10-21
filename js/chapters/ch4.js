window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[4] = {
  title: "الفصل 4: اتخاذ القرارات (الشروط)",
  lessons: [
    {
      title: "الدرس 1: أول قرار في حياتك (if)", steps: [
        { type: "cody", text: "أهلاً بك في عالم القرارات! 🧠 لحد دلوقتي إحنا كنا بنكتب أوامر وبس. النهاردة هنعلم الكمبيوتر إزاي (يفكر) وياخد قرار." },
        { type: "cody", text: "تخيل إنك ماشي في الشارع وقولت لنفسك: <b>لو</b> الجو بيمطر، يبقى هلبس الجاكيت. الكلمة السرية هنا هي (لو) أو <code>if</code>." },
        { type: "cody", text: "في بايثون، بنكتب <code>if</code> وبعدها الشرط، وبعدها نقطتين <code>:</code>. وبعدين بنعمل مسافة (Indentation) في السطر اللي بعده عشان نقول للكمبيوتر إن الأمر ده يخص الـ if." },
        { type: "choice", question: "كود بايثون بيعتمد على المسافات البادئة (Indentation). إيه رأيك في الكود ده؟\nif 10 > 5:\n    print(\"Yes\")", options: ["كود صحيح لأن فيه مسافة بادئة قبل print", "كود غلط لأني مش محتاج مسافة"], replies: ["بالضبط! المسافة البادئة هي اللي بتحدد إن الأمر ده جوه الـ if.", "لا، بايثون لغة صارمة جداً في المسافات. لازم نحط مسافة (4 مسافات أو Tab)."] },
        { type: "cody", text: "دلوقتي دورك! أنا عايزك تتأكد إن <code>20</code> أكبر من <code>15</code>، وتطبع كلمة <code>Correct</code>." },
        { type: "challenge", expected: "Correct", defaultCode: '# اكتب الكود هنا\n', hint: 'if 20 > 15:\n    print("Correct")', check: (code) => /if\s+20\s*>\s*15\s*:\s*\n\s+print\s*\(\s*(['"])Correct\1\s*\)/m.test(code.trim()), successMsg: "رائع! 🌟 الكمبيوتر قرأ شرطك، لقاه صح، فدخل ونفذ الأمر اللي جوه الـ if." }
      ]
    },
    {
      title: "الدرس 2: ماذا لو كان القرار خاطئ؟ (else)", steps: [
        { type: "cody", text: "مرحباً بعودتك! طيب لو الجو مش بيمطر؟ (الشرط بتاعنا طلع غلط). هنا بيجي دور كلمة <code>else</code> (يعني: وإلا)." },
        { type: "cody", text: "بص على المثال ده: <br><code>if 5 > 10:<br>    print(\"Big\")<br>else:<br>    print(\"Small\")</code>" },
        { type: "choice", question: "الكمبيوتر هيفكر إزاي هنا؟", options: ["هيطبع Big لأن الشرط فيه أرقام", "هيطبع Small لأن 5 مش أكبر من 10"], replies: ["لا يا بطل، الأرقام بتتكلم بالرياضيات. 5 مش أكبر من 10.", "بالضبط! الكمبيوتر شاف الشرط غلط، فساب كود الـ if وروح على طول على كود الـ else."] },
        { type: "cody", text: "تحديك دلوقتي: اكتب كود بيقول لو <code>3</code> أكبر من <code>5</code> اطبع <code>Big</code>، وإلا (else) اطبع <code>Small</code>." },
        { type: "challenge", expected: "Small", defaultCode: '# اكتب الكود هنا\n', hint: 'if 3 > 5:\n    print("Big")\nelse:\n    print("Small")', check: (code) => code.includes('if 3 > 5:') && code.includes('else:') && code.includes('print("Small")'), successMsg: "ممتاز! الكمبيوتر اتصرف بذكاء واختار المسار البديل." }
      ]
    },
    {
      title: "الدرس 3: أكتر من خيار (elif)", steps: [
        { type: "cody", text: "أهلاً بك! طيب لو عندي 3 اختيارات؟ مش بس (صح) أو (غلط)؟" },
        { type: "cody", text: "مثلاً: لو الدرجة 90 أو أكتر (A)، وإلا لو الدرجة 75 أو أكتر (B)، وإلا (C)." },
        { type: "cody", text: "عشان نعمل كده بنستخدم <code>elif</code>، وهي اختصار لـ else if. الكود هيبقى كده:<br><code>if grade >= 90:<br>    print(\"A\")<br>elif grade >= 75:<br>    print(\"B\")<br>else:<br>    print(\"C\")</code>" },
        { type: "choice", question: "لو المتغير grade = 80. إيه اللي هيطبعه الكمبيوتر؟", options: ["A", "B", "C"], replies: ["لا، 80 مش أكبر من 90، فهيتخطى الـ if الأول.", "ممتاز! 80 مش أكبر من 90، بس هي أكبر من 75، فهيدخل في الـ elif ويطبع B.", "لا، عشان الـ elif اتحقق فمش هيوصل للـ else."] },
        { type: "cody", text: "تحديك: أنشئ متغير <code>score = 60</code>. لو 60 أو أكتر اطبع <code>Pass</code>، وإلا لو 30 أو أكتر اطبع <code>Mid</code>." },
        { type: "challenge", expected: "Pass", defaultCode: '# اكتب الكود هنا\n', hint: 'score = 60\nif score >= 60:\n    print("Pass")\nelif score >= 30:\n    print("Mid")', check: (code) => code.includes('score = 60') && code.includes('if score >= 60:') && code.includes('print("Pass")'), successMsg: "عبقري! استخدام elif بيخلي البرنامج يفحص الشروط بالترتيب ويلاقي أول شرط صح." }
      ]
    },
    {
      title: "الدرس 4: دمج الشروط (and / or)", steps: [
        { type: "cody", text: "في الدرس ده هنبقى محققين! 🕵️‍♂️ عايزين نتأكد من أكتر من شرط مع بعض." },
        { type: "cody", text: "لو عايزين نضمن إن (الرقم أكبر من 10) <b>و</b> (أصغر من 20) في نفس الوقت، بنستخدم <code>and</code>." },
        { type: "cody", text: "ولو عايزين نتحقق إن الرقم (زوجي) <b>أو</b> (مضاعف لـ 5)، بنستخدم <code>or</code>." },
        { type: "choice", question: "إيه ناتج طباعة: print(10 > 5 and 5 > 10)؟", options: ["True", "False"], replies: ["لا، الشرط التاني غلط، والـ and لازم الاتنين يتحققوا.", "بالضبط! لأن الشرط التاني (5 > 10) غلط، فالنتيجة الكلية False."] },
        { type: "cody", text: "تحديك: اكتب شرط يتأكد إن <code>15 > 10</code> (و) <code>15 < 20</code>، واطبع كلمة <code>Teen</code>." },
        { type: "challenge", expected: "Teen", defaultCode: '# اكتب الكود هنا\n', hint: 'if 15 > 10 and 15 < 20:\n    print("Teen")', check: (code) => code.includes('15 > 10 and 15 < 20') && code.includes('print("Teen")'), successMsg: "رائع! دمجت شرطين بنجاح واتأكدت إن الاتنين صح." }
      ]
    },
    {
      title: "الامتحان الشامل للفصل", steps: [
        { type: "cody", text: "حان وقت إثبات جدارتك! 🎓 الامتحان ده هيختبر فهمك للشروط." },
        { type: "quiz", question: "1. لو شرط الـ if طلع غلط، بنستخدم إيه عشان ننفذ كود تاني؟", options: ["if", "else", "print"], correct: 1, explanation: "else (وإلا) بتتنفذ لما شرط if ميتحققش." },
        { type: "quiz", question: "2. إيه الرمز اللي لازم نحطه في آخر سطر الشرط؟", options: [".", ":", ";"], correct: 1, explanation: "النقطتين (:) هما أساس كتابة if و else." },
        { type: "cody", text: "تحدي برمجي أخير: نظام تسجيل دخول بسيط. أنشئ متغير <code>user = \"admin\"</code> ومتغير <code>pass = \"1234\"</code>. لو الاتنين دول مطابقين، اطبع <code>Welcome</code>." },
        { type: "challenge", expected: "Welcome", defaultCode: '# اكتب الكود هنا\n', hint: 'user = "admin"\npass = "1234"\nif user == "admin" and pass == "1234":\n    print("Welcome")', check: (code) => code.includes('user == "admin"') && code.includes('pass == "1234"') && code.includes('print("Welcome")'), successMsg: "🎉 مبروك! لقد اجتزت الامتحان بنجاح. أنت الآن تفهم الشروط تماماً." }
      ]
    }
  ]
};