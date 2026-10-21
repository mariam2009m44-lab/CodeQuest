window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[2] = {
  title: "الفصل 2: المتغيرات",
  lessons: [
    {
      title: "الدرس 1: صندوق الأسرار", steps: [
        { type: "cody", text: "أهلاً بك في الفصل الثاني! المتغير ده زي صندوق بنحط فيه قيمة ونكتب عليه اسم عشان نستخدمها بعدين." },
        { type: "cody", text: "مثال: <code>name = \"Cody\"</code>. كده أنشأنا متغير اسمه name وخزنّا فيه كلمة Cody." },
        { type: "cody", text: "أنشئ متغير اسمه <code>age</code> وخزن فيه رقم <code>10</code>، وبعدها اطبعه." },
        { type: "challenge", expected: "10", defaultCode: '# اكتب الكود هنا\n', hint: 'age = 10\nprint(age)', check: (code) => /age\s*=\s*10/.test(code) && /print\s*\(\s*age\s*\)/.test(code), successMsg: "ممتاز! المتغيرات بتساعدنا نخزن المعلومات ونستخدمها وقت الحاجة." }
      ]
    },
    {
      title: "الدرس 2: تغيير القيم", steps: [
        { type: "cody", text: "قيمة المتغير يمكن أن تتغير في أي وقت. الكمبيوتر بينفذ الأوامر بالترتيب." },
        { type: "cody", text: "أنشئ متغيراً اسمه <code>points</code> وقيمته <code>5</code>. ثم غير قيمته إلى <code>20</code>. واطبعه." },
        { type: "challenge", expected: "20", defaultCode: '# اكتب الكود هنا\n', hint: 'points = 5\npoints = 20\nprint(points)', check: (code) => /points\s*=\s*5/.test(code) && /points\s*=\s*20/.test(code) && /print\s*\(\s*points\s*\)/.test(code), successMsg: "ممتاز! 🌟 لقد رأيت كيف تم استبدال القيمة القديمة بالجديدة." }
      ]
    },
    {
      title: "الدرس 3: دمج النصوص", steps: [
        { type: "cody", text: "يمكنك دمج نصين باستخدام <code>+</code>." },
        { type: "cody", text: "أنشئ متغيرين <code>word1 = \"Hello\"</code> و <code>word2 = \"World\"</code>. واطبعهم مع مسافة بينهم." },
        { type: "challenge", expected: "Hello World", defaultCode: '# اكتب الكود هنا\n', hint: 'word1 = "Hello"\nword2 = "World"\nprint(word1 + " " + word2)', check: (code) => /word1\s*=\s*(['"])Hello\1/.test(code) && /word2\s*=\s*(['"])World\1/.test(code) && /print\s*\(\s*word1\s*\+\s*(['"])\s*\1\s*\+\s*word2\s*\)/.test(code), successMsg: "تمام! 🌟 دمج النصوص مفيد جداً." }
      ]
    },
    {
      title: "الدرس 4: قواعد التسمية", steps: [
        { type: "cody", text: "هناك قواعد لتسمية المتغيرات. لا يمكن أن يبدأ برقم، ولا يحتوي على مسافات." },
        { type: "quiz", question: "أي من أسماء المتغيرات التالية صحيح؟", options: ["2user", "user name", "user_name"], correct: 2, explanation: "الاسم user_name صحيح لأنه يستخدم شرطة سفلية." },
        { type: "cody", text: "أنشئ متغيراً باسم <code>student_name</code> وضع فيه اسمك واطبعه." },
        { type: "challenge", expected: "Ali", defaultCode: '# اكتب الكود هنا\n', hint: 'student_name = "Ali"\nprint(student_name)', check: (code) => /student_name\s*=\s*(['"])Ali\1/.test(code) && /print\s*\(\s*student_name\s*\)/.test(code), successMsg: "عمل رائع! لقد اتبعت قواعد التسمية." }
      ]
    },
    {
      title: "امتحان الفصل الثاني", steps: [
        { type: "cody", text: "أهلاً بك في امتحان الفصل الثاني! 🎓" },
        { type: "quiz", question: "1. كيف ننشئ متغيراً باسم score يحمل القيمة 50؟", options: ["score == 50", "score = 50", "let score = 50"], correct: 1, explanation: "علامة = المفردة تستخدم لتعيين القيم." },
        { type: "cody", text: "تحدي برمجي: أنشئ متغير <code>hero</code> وضع فيه اسمك، ثم اطبع <code>I am [اسمك]</code> باستخدام الفاصلة." },
        { type: "challenge", expected: "I am Ali", defaultCode: '# اكتب الكود هنا\n', hint: 'hero = "Ali"\nprint("I am", hero)', check: (code) => /hero\s*=\s*(['"])Ali\1/.test(code) && /print\s*\(\s*(['"])I am\1\s*,\s*hero\s*\)/.test(code), successMsg: "ممتاز! 🌟 لقد أثبت إتقانك للمتغيرات." }
      ]
    }
  ]
};