window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[12] = {
  title: "الفصل 12: مشروع التخرج (نظام اللاعب)",
  lessons: [
    {
      title: "الدرس 1: بداية المشروع (المتغيرات والطباعة)", steps: [
        { type: "cody", text: "أهلاً بك في مشروع التخرج! 🎓 هنبني مع بعض (نظام إحصائيات لاعب) في لعبة." },
        { type: "cody", text: "عشان نبدأ، هنستخدم اللي اتعلمناه في الفصل الأول والتاني. هنطبع رسالة ترحيب، وننشئ متغيرات للاعب." },
        { type: "choice", question: "إزاي هنبدأ اللعبة؟", options: ["هنكتب print لوحدها", "هنطبع ترحيب ونعرف المتغيرات"], replies: ["لازم نطبع ترحيب الأول عشان نعلن بداية اللعبة.", "عاش! دي البداية الصح."] },
        { type: "cody", text: "تحديك: اطبع جملة <code>Game Started</code>، وبعدين أنشئ متغير <code>name = \"Hero\"</code>، ومتغير <code>health = 100</code>، واطبع رسالة <code>Player Ready</code>." },
        { type: "challenge", expected: "Game Started\nPlayer Ready", defaultCode: '# اكتب الكود هنا\n', hint: 'print("Game Started")\nname = "Hero"\nhealth = 100\nprint("Player Ready")', check: (code) => code.includes('print("Game Started")') && code.includes('name = "Hero"') && code.includes('health = 100') && code.includes('print("Player Ready")'), successMsg: "ممتاز! استخدمت الطباعة والمتغيرات زي ما اتعلمت في الفصل 1 و 2." }
      ]
    },
    {
      title: "الدرس 2: البيانات (قوائم وقواميس وحساب)", steps: [
        { type: "cody", text: "مرحباً بعودتك! دلوقتي هنخزن بيانات اللاعب. هنستخدم القوائم (من الفصل 6) والقواميس (من الفصل 10)." },
        { type: "cody", text: "اللاعب معاه أدوات في شنطة (قائمة)، وعنده إحصائيات (قاموس). وكمان هنحسب مستواه بناءً على نقاطه (حساب من الفصل 3)." },
        { type: "cody", text: "تحديك: اعمل قائمة <code>inventory = [\"Sword\", \"Shield\"]</code>، واعمل قاموس <code>stats = {\"name\": \"Hero\", \"level\": 1}</code>، واحسب <code>xp = 50 * 2</code>، واطبع <code>Data Ready</code>." },
        { type: "challenge", expected: "Data Ready", defaultCode: '# اكتب الكود هنا\n', hint: 'inventory = ["Sword", "Shield"]\nstats = {"name": "Hero", "level": 1}\nxp = 50 * 2\nprint("Data Ready")', check: (code) => code.includes('inventory = ["Sword", "Shield"]') && code.includes('stats = {"name": "Hero", "level": 1}') && code.includes('xp = 50 * 2') && code.includes('print("Data Ready")'), successMsg: "رائع! استخدمت القوائم والقواميس والعمليات الحسابية." }
      ]
    },
    {
      title: "الدرس 3: الحركة (شروط وحلقات ودوال)", steps: [
        { type: "cody", text: "أهلاً بك! دلوقتي اللعبة هتبدأ تتحرك. هنستخدم الدوال (من الفصل 7)، والحلقات (من الفصل 5)، والشروط (من الفصل 4)." },
        { type: "cody", text: "هنعمل دالة بتداوي اللاعب. وهنستخدم حلقة عشان نلف 3 مرات ونشوف حالة اللاعب." },
        { type: "choice", question: "عشان نتحقق من حالة اللاعب في كل لفة، نستخدم إيه؟", options: ["حلقة for بس", "حلقة for وجواها شرط if"], replies: ["الحلقة لوحدها مش كفاية عشان نتحقق من الشرط.", "بالظبط! كده بنقدر نتأكد من الصحة في كل دور."] },
        { type: "cody", text: "تحديك: اعمل دالة <code>heal()</code> تطبع <code>Healed</code>. وبعدين اكتب حلقة <code>for i in range(2):</code> اللي تطبع <code>Turn</code> كل لفة، وجواها <code>if health > 0:</code> اللي تستدعي <code>heal()</code>." },
        { type: "challenge", expected: "Turn\nHealed\nTurn\nHealed", defaultCode: '# اكتب الكود هنا\n', hint: 'health = 100\ndef heal():\n    print("Healed")\nfor i in range(2):\n    print("Turn")\n    if health > 0:\n        heal()', check: (code) => code.includes('def heal():') && code.includes('for i in range(2):') && code.includes('if health > 0:') && code.includes('heal()'), successMsg: "عبقري! استخدمت الحلقات والشروط والدوال مع بعض." }
      ]
    },
    {
      title: "الدرس 4: الحماية (نصوص وأخطاء ومكتبات)", steps: [
        { type: "cody", text: "آخر خطوة! هنحمي اللعبة من الانهيار لو حصل خطأ (من الفصل 9)، وهنستخدم مكتبة random (من الفصل 11)، ونتعامل مع النصوص (من الفصل 8)." },
        { type: "cody", text: "لو اللعبة حاولت تقسم على صفر هتضرب خطأ، عشان كده هنستخدم <code>try/except</code>." },
        { type: "cody", text: "تحديك: استورد <code>random</code>، واعمل <code>try</code> تطبع فيها <code>random.randint(1, 6)</code>، ولو حصل خطأ اطبع <code>Safe</code> باستخدام <code>except</code>." },
        { type: "challenge", expected: "", defaultCode: '# اكتب الكود هنا\n', hint: 'import random\ntry:\n    print(random.randint(1, 6))\nexcept:\n    print("Safe")', check: (code) => code.includes('import random') && code.includes('try:') && code.includes('random.randint(1, 6)') && code.includes('except:'), successMsg: "مذهل! استخدمت المكتبات والأخطاء لحماية مشروعك." }
      ]
    },
    {
      title: "الامتحان النهائي الشامل", steps: [
        { type: "cody", text: "مبروك يا بطل! 🎓 وصلت لأخر خطوة. لازم نختبر إن كل الأنظمة اللي بنيناها شغالة صح." },
        { type: "quiz", question: "1. إيه الهيكل الأنسب لحفظ (اسم اللاعب ومستواه) مع بعض؟", options: ["قائمة", "قاموس"], correct: 1, explanation: "القاموس بيربط المفتاح بالقيمة زي الاسم والمستوى." },
        { type: "cody", text: "تحدي التخرج: أنشئ دالة <code>welcome(name)</code> تطبع <code>Welcome name</code>، واستدعيها بالاسم <code>Hero</code>." },
        { type: "challenge", expected: "Welcome Hero", defaultCode: '# اكتب الكود هنا\n', hint: 'def welcome(name):\n    print("Welcome", name)\nwelcome("Hero")', check: (code) => code.includes('def welcome(name):') && code.includes('print("Welcome", name)') && code.includes('welcome("Hero")'), successMsg: "🎉 مبروك يا هندسة! لقد أتممت مشروع التخرج وربطت كل مهاراتك. أنت الآن مبرمج محترف!" }
      ]
    }
  ]
};