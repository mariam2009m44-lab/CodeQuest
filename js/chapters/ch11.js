window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[11] = {
  title: "الفصل 11: صندوق الأدوات (المكتبات)",
  lessons: [
    {
      title: "الدرس 1: استعارة كتاب (import)", steps: [
        { type: "cody", text: "أهلاً بك! 📚 النهاردة هنروح (المكتبة). مش محتاجين نألف كتاب جديد، إحنا بنستعير كتاب جاهز." },
        { type: "cody", text: "في بايثون، المكتبات هي عبارة عن أكواد جاهزة ناس تانية كتبتها، عشان نستخدمها بدل ما نعيد اختراع العجلة." },
        { type: "choice", question: "إزاي بنستدعي مكتبة في بايثون؟", options: ["بنكتب اسم المكتبة", "بنستخدم كلمة import"], replies: ["لازم نعرف بايثون إننا بنستدعيها الأول.", "بالظبط! كلمة import معناها (استورد)."] },
        { type: "cody", text: "مكتبة <code>math</code> فيها أدوات رياضية. عشان نستخدمها بنكتب <code>import math</code> في الأول." },
        { type: "cody", text: "تحديك: استورد مكتبة math، واستخدم <code>math.sqrt(25)</code> عشان تطبع الجذر التربيعي لـ 25." },
        { type: "challenge", expected: "5.0", defaultCode: '# اكتب الكود هنا\n', hint: 'import math\nprint(math.sqrt(25))', check: (code) => code.includes('import math') && code.includes('math.sqrt(25)'), successMsg: "ممتاز! حسبت الجذر التربيعي بمساعدة المكتبة." }
      ]
    },
    {
      title: "الدرس 2: سر الرقم باي", steps: [
        { type: "cody", text: "مرحباً بعودتك! عارف قيمة (باي) اللي بنستخدمها في الدواير؟" },
        { type: "cody", text: "مكتبة math فيها قيمة باي جاهزة، ومش محتاج تحفظها." },
        { type: "cody", text: "تحديك: اطبع قيمة <code>math.pi</code>." },
        { type: "challenge", expected: "3.141592653589793", defaultCode: '# اكتب الكود هنا\n', hint: 'import math\nprint(math.pi)', check: (code) => code.includes('math.pi'), successMsg: "رائع! استخدمت قيمة ثابتة من المكتبة." }
      ]
    },
    {
      title: "الدرس 3: صندوق العشوائية", steps: [
        { type: "cody", text: "أهلاً بك! في مكتبة تانية اسمها <code>random</code> بتطلعلك أرقام عشوائية (زي زهر الطاولة)." },
        { type: "cody", text: "تحديك: استورد random، واطبع رقم عشوائي بين 1 و 10 باستخدام <code>random.randint(1, 10)</code>." },
        { type: "challenge", expected: "", defaultCode: '# اكتب الكود هنا\n', hint: 'import random\nprint(random.randint(1, 10))', check: (code) => code.includes('import random') && code.includes('random.randint(1, 10)'), successMsg: "عبقري! ولدت رقماً عشوائياً." }
      ]
    },
    {
      title: "الدرس 4: استعارة جزء", steps: [
        { type: "cody", text: "آخر درس! لو عايز تستعير صفحة واحدة بس من الكتاب بدل ما تشيله كله؟" },
        { type: "cody", text: "تقدر تستورد أداة واحدة من المكتبة باستخدام <code>from</code>. زي ما تقول: من المكتبة دي، هات الأداة دي بس." },
        { type: "cody", text: "تحديك: استورد <code>sqrt</code> بس من مكتبة math، واستخدمها عشان تحسب جذر 36." },
        { type: "challenge", expected: "6.0", defaultCode: '# اكتب الكود هنا\n', hint: 'from math import sqrt\nprint(sqrt(36))', check: (code) => code.includes('from math import sqrt') && code.includes('sqrt(36)'), successMsg: "مذهل! استوردت الأداة اللي محتاجها بس." }
      ]
    },
    {
      title: "الامتحان الشامل", steps: [
        { type: "cody", text: "جاهز لامتحان المكتبات؟ 🎓" },
        { type: "quiz", question: "1. إيه الكلمة اللي بنستخدمها لاستدعاء مكتبة؟", options: ["import", "get", "library"], correct: 0, explanation: "بنستخدم import لاستدعاء المكتبات." },
        { type: "cody", text: "تحديك: استورد random واطبع <code>random.choice([1, 2, 3])</code>." },
        { type: "challenge", expected: "", defaultCode: '# اكتب الكود هنا\n', hint: 'import random\nprint(random.choice([1, 2, 3]))', check: (code) => code.includes('random.choice'), successMsg: "🎉 مبروك! اجتزت الفصل الحادي عشر." }
      ]
    }
  ]
};