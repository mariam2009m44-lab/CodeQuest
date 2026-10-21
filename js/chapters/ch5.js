window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[5] = {
  title: "الفصل 5: سحر التكرار",
  lessons: [
    {
      title: "الدرس 1: قوة التكرار (for)", steps: [
        { type: "cody", text: "أهلاً بك في الفصل الخامس! 🔄 النهاردة هنتعلم حاجة هتوفر وقتك جداً: التكرار (Loops)." },
        { type: "cody", text: "تخيل إنك مطلوب منك تنط (100) نطة! هل هتكتب أمر (اطبع نطة) 100 مرة؟ طبعاً لا، هتقول (كرر الأمر ده 100 مرة)." },
        { type: "cody", text: "في بايثون بنستخدم <code>for</code> عشان نكرر الأوامر. الكود ده بيطبع كلمة (Hi) 3 مرات:<br><code>for i in range(3):<br>    print(\"Hi\")</code>" },
        { type: "choice", question: "الكلمة <code>range(3)</code> معناها إيه؟", options: ["هيطبع الرقم 3", "هيكرر الأمر 3 مرات"], replies: ["لا، range بتخلي الحلقة تلف وتعيد الأمر لعدد المرات اللي إحنا بنحدده.", "بالضبط! العدد اللي جوه range هو عدد المرات اللي هيتم تكرار الكود فيها."] },
        { type: "cody", text: "دلوقتي دورك: أنا عايزك تطبع كلمة <code>مرحبا</code> 5 مرات من غير ما تكرر سطر الطباعة 5 مرات." },
        { type: "challenge", expected: "مرحبا\nمرحبا\nمرحبا\nمرحبا\nمرحبا", defaultCode: '# اكتب الكود هنا\n', hint: 'for i in range(5):\n    print("مرحبا")', check: (code) => /for\s+\w+\s+in\s+range\s*\(\s*5\s*\)\s*:\s*\n\s+print\s*\(\s*(['"])مرحبا\1\s*\)/m.test(code.trim()), successMsg: "رائع جداً! 🌟 وفرت على نفسك 4 أسطر زيادة باستخدام الـ for loop." }
      ]
    },
    {
      title: "الدرس 2: طالما الشرط موجود (while)", steps: [
        { type: "cody", text: "مرحباً بعودتك! في نوع تاني من التكرار اسمه <code>while</code> (يعني: طالما)." },
        { type: "cody", text: "حلقة while بتفضل تكرر الأمر (طالما) الشرط بتاعها صح. زي ما تقول: طالما أنا عندي فلوس، هشتري حاجات." },
        { type: "cody", text: "بس خد بالك جداً! لازم تخلّي الشرط يبقى (غلط) في يوم من الأيام، عشان الحلقة متبقاش (لا نهائية) وتعلّق الكمبيوتر." },
        { type: "choice", question: "إيه اللي هيحصل لو كتبت: <br><code>while 10 > 5:<br>    print(\"Help\")</code>", options: ["هيطبع Help مرة واحدة", "هيطبع Help لانهائي والبرنامج هيهنج"], replies: ["لا، الشرط 10 > 5 دايماً صح، فالحلقة مش هتوقف.", "بالضبط! عشان كده في while لازم نغير المتغير اللي جوه الشرط عشان الحلقة تقف في النهاية."] },
        { type: "cody", text: "تحديك: أنشئ متغير <code>count = 1</code>. وطالما <code>count <= 3</code> اطبع كلمة <code>Loop</code> وزد العداد بمقدار 1 (عشان الحلقة تقف)." },
        { type: "challenge", expected: "Loop\nLoop\nLoop", defaultCode: '# اكتب الكود هنا\n', hint: 'count = 1\nwhile count <= 3:\n    print("Loop")\n    count += 1', check: (code) => code.includes('while count <= 3:') && code.includes('count += 1') && code.includes('print("Loop")'), successMsg: "ممتاز! تحكمت في الحلقة وعرفت توقفها بالطريقة الصح." }
      ]
    },
    {
      title: "الدرس 3: أوقف الحلقة فوراً (break)", steps: [
        { type: "cody", text: "أهلاً بك! أحياناً بنكون بندور على حاجة، ولما نلاقيها بنقف عن البحث فوراً. في بايثون بنستخدم <code>break</code> عشان نوقف الحلقة." },
        { type: "cody", text: "بص هنا: إحنا هنلف 100 مرة، بس لو لقينا الرقم 50، هنوقف الحلقة.<br><code>for i in range(100):<br>    if i == 50:<br>        print(\"Found\")\n        break</code>" },
        { type: "cody", text: "تحديك: اكتب كود بيلف 10 مرات. لو الرقم وصل لـ 4، اطبع <code>Stop</code> واقف الحلقة فوراً." },
        { type: "challenge", expected: "Stop", defaultCode: '# اكتب الكود هنا\n', hint: 'for i in range(10):\n    if i == 4:\n        print("Stop")\n        break', check: (code) => code.includes('for i in range(10):') && code.includes('if i == 4:') && code.includes('break'), successMsg: "عبقري! break بيوقف الحلقة فوراً وبيطلع منها على طول." }
      ]
    },
    {
      title: "الدرس 4: تخطي الدور (continue)", steps: [
        { type: "cody", text: "في الدرس الأخير! إحنا عارفين إزاي نوقف الحلقة كلها. طيب لو عايزين نتخطى (دورة واحدة) بس ونكمل اللي بعدها؟" },
        { type: "cody", text: "هنا بنستخدم <code>continue</code>. يعني (استمر في الحلقة بس متعملش حاجة في اللفة دي)." },
        { type: "cody", text: "تحديك: اكتب حلقة تطبع الأرقام من 1 لـ 5. بس لو الرقم 3، تخطاه واطبع الباقي." },
        { type: "challenge", expected: "1\n2\n4\n5", defaultCode: '# اكتب الكود هنا\n', hint: 'for i in range(1, 6):\n    if i == 3:\n        continue\n    print(i)', check: (code) => code.includes('for i in range(1, 6):') && code.includes('if i == 3:') && code.includes('continue'), successMsg: "مذهل! continue بيتخطى اللفة دي بس ويكمل الحلقة عادي." }
      ]
    },
    {
      title: "الامتحان الشامل للفصل", steps: [
        { type: "cody", text: "حان وقت إثبات جدارتك في التكرار! 🎓 ركز معايا في الامتحان ده." },
        { type: "quiz", question: "1. لو عايزين نكرر كود لعدد معين من المرات، بنستخدم إيه؟", options: ["if", "for", "print"], correct: 1, explanation: "for loop هي الأفضل للتكرار لعدد معروف من المرات." },
        { type: "quiz", question: "2. إيه الكلمة اللي بتوقف الحلقة فوراً؟", options: ["continue", "break", "stop"], correct: 1, explanation: "break توقف الحلقة نهائياً." },
        { type: "cody", text: "تحدي برمجي أخير: اطبع الأرقام الزوجية من 1 إلى 10 باستخدام حلقة for وشرط if." },
        { type: "challenge", expected: "2\n4\n6\n8\n10", defaultCode: '# اكتب الكود هنا\n', hint: 'for i in range(1, 11):\n    if i % 2 == 0:\n        print(i)', check: (code) => code.includes('for i in range(1, 11):') && code.includes('if i % 2 == 0:') && code.includes('print(i)'), successMsg: "🎉 مبروك! لقد أثبت إتقانك التام للتكرار واجتزت الامتحان." }
      ]
    }
  ]
};