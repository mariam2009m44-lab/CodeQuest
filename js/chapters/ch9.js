window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[9] = {
  title: "الفصل 9: درع الحماية (الأخطاء)",
  lessons: [
    {
      title: "الدرس 1: الكابتن والدرع (try/except)", steps: [
        { type: "cody", text: "أهلاً بك يا كابتن! ✈️ النهاردة هنطير بطيارة، وهنشوف إزاي نحميها من المشاكل." },
        { type: "cody", text: "تخيل إنك بتسوق طيارة وفجأة ظهرت عاصفة (خطأ في الكود). لو معندكش خطة بديلة، الطيارة هتقع (البرنامج هيقف)." },
        { type: "choice", question: "إيه أفضل حل عشان تحمي الطيارة؟", options: ["أتمنى العاصفة تروح لوحدها", "أجهز مظلة نجاة أو خطة بديلة (درع حماية)"], replies: ["في البرمجة، لو استنيت، البرنامج هيضرب خطأ ويتوقف.", "عاش يا كابتن! الدرع ده بنسميه في بايثون <code>try / except</code>."] },
        { type: "cody", text: "بنقول للكمبيوتر: <b>try</b> (جرب) تنفذ الكود ده. لو حصل خطأ، <b>except</b> (وإلا) نفذ الكود ده بدلاً منه." },
        { type: "cody", text: "بص على المثال ده:<br><code>try:<br>    print(10 / 0)<br>except:<br>    print(\"ممنوع القسمة على صفر!\")</code>" },
        { type: "cody", text: "تحديك: اكتب كود يحاول يقسم 10 على 0، ولو حصل خطأ يطبع كلمة <code>Error</code>." },
        { type: "challenge", expected: "Error", defaultCode: '# اكتب الكود هنا\n', hint: 'try:\n    print(10 / 0)\nexcept:\n    print("Error")', check: (code) => code.includes('try:') && code.includes('except:') && code.includes('print("Error")'), successMsg: "رائع جداً! 🌟 لقد حميت طيارتك من السقوط." }
      ]
    },
    {
      title: "الدرس 2: الدرع المخصص (ZeroDivisionError)", steps: [
        { type: "cody", text: "مرحباً بعودتك يا كابتن! الدرع اللي عملناه في الدرس الأول ده درع عام (بيحميك من أي خطأ)." },
        { type: "cody", text: "بس أحياناً الكابتن المحترف عايز يعرف بالظبط إيه نوع المشكلة عشان يصلحها." },
        { type: "choice", question: "لو فيه خطأ قسمة على صفر، إيه اسم الدرع المخصص ليه؟", options: ["except AllErrors", "except ZeroDivisionError"], replies: ["بايثون مش بتعرف الدرع ده، لازم نكتب اسم الخطأ الحقيقي.", "بالظبط! كده إحنا بنقول للكمبيوتر استنى (خطأ القسمة على صفر) بس، ولو حصل خطأ تاني هيقف عادي."] },
        { type: "cody", text: "تحديك: اكتب كود بيحاول يقسم 5 على 0. لو حصل خطأ (قسمة على صفر)، اطبع كلمة <code>Cannot divide by zero</code>." },
        { type: "challenge", expected: "Cannot divide by zero", defaultCode: '# اكتب الكود هنا\n', hint: 'try:\n    print(5 / 0)\nexcept ZeroDivisionError:\n    print("Cannot divide by zero")', check: (code) => code.includes('except ZeroDivisionError:') && code.includes('print("Cannot divide by zero")'), successMsg: "عبقري! استخدمت الدرع المخصص بنجاح." }
      ]
    },
    {
      title: "الدرس 3: خطأ في النوع (ValueError)", steps: [
        { type: "cody", text: "أهلاً بك! خلينا نتكلم عن نوع تاني من الأخطاء." },
        { type: "cody", text: "لو قلتلك حول كلمة (Apple) لرقم باستخدام <code>int(\"Apple\")</code>، الكمبيوتر هيتجنن، لأن (Apple) مش رقم." },
        { type: "choice", question: "إيه اسم الخطأ اللي هيحصل في الحالة دي؟", options: ["ValueError", "StringError"], replies: ["بالظبط! لأن القيمة (Value) اللي بندخلها غلط.", "بايثون مبتعرفش الخطأ ده، هو اسمه ValueError."] },
        { type: "cody", text: "تحديك: اكتب كود يحاول يحول النص (Hello) لرقم. لو حصل خطأ، اطبع <code>Invalid input</code>." },
        { type: "challenge", expected: "Invalid input", defaultCode: '# اكتب الكود هنا\n', hint: 'try:\n    int("Hello")\nexcept ValueError:\n    print("Invalid input")', check: (code) => code.includes('except ValueError:') && code.includes('print("Invalid input")'), successMsg: "مذهل! درعك المخصص شغال تمام." }
      ]
    },
    {
      title: "الدرس 4: الدرع المتكامل", steps: [
        { type: "cody", text: "آخر درس! إحنا عايزين نعمل برنامج محترف بياخد رقم من المستخدم ويقسمه." },
        { type: "cody", text: "تخيل إن الكمبيوتر مش عارف إيه اللي هيجي من المستخدم، ممكن يكتب حروف، أو يكتب صفر." },
        { type: "cody", text: "تحديك: اكتب كود بيحاول يقسم <code>10 / int("0")</code>، ولو حصل أي خطأ (سواء قسمة على صفر أو غيره)، اطبع <code>Error handled</code>." },
        { type: "challenge", expected: "Error handled", defaultCode: '# اكتب الكود هنا\n', hint: 'try:\n    print(10 / int("0"))\nexcept:\n    print("Error handled")', check: (code) => code.includes('try:') && code.includes('except:') && code.includes('print("Error handled")'), successMsg: "رائع! درعك العائم شغال في أي موقف." }
      ]
    },
    {
      title: "الامتحان الشامل للفصل", steps: [
        { type: "cody", text: "وصلنا لنهاية تدريب الكابتن! 🎓 جاهز للامتحان؟" },
        { type: "quiz", question: "1. إيه الكلمة اللي بنجرب بيها الكود المشكوك فيه؟", options: ["try", "except", "catch"], correct: 0, explanation: "بنستخدم try لتجربة الكود." },
        { type: "quiz", question: "2. إيه الكلمة اللي بنستخدمها لو حصل الخطأ؟", options: ["try", "except", "error"], correct: 1, explanation: "بنستخدم except لتنفيذ خطة بديلة." },
        { type: "cody", text: "تحدي برمجي أخير: اكتب كود بيحاول يحول النص <code>\"Cody\"</code> لرقم. لو حصل <code>ValueError</code> اطبع <code>Wrong Data</code>." },
        { type: "challenge", expected: "Wrong Data", defaultCode: '# اكتب الكود هنا\n', hint: 'try:\n    int("Cody")\nexcept ValueError:\n    print("Wrong Data")', check: (code) => code.includes('int("Cody")') && code.includes('except ValueError:') && code.includes('print("Wrong Data")'), successMsg: "🎉 مبروك يا كابتن! لقد اجتزت امتحان الأخطاء بنجاح." }
      ]
    }
  ]
};