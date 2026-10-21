window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[3] = {
  title: "الفصل 3: العمليات الحسابية",
  lessons: [
    {
      title: "الدرس 1: الجمع والطرح", steps: [
        { type: "cody", text: "أهلاً بك في مختبر العمليات الحسابية! للجمع نستخدم <code>+</code>، وللطرح <code>-</code>." },
        { type: "cody", text: "اطبع ناتج جمع <code>25 + 35</code>، وناتج طرح <code>100 - 40</code>." },
        { type: "challenge", expected: "60\n60", defaultCode: '# اكتب الكود هنا\n', hint: 'print(25 + 35)\nprint(100 - 40)', check: (code) => code.includes('print(25 + 35)') && code.includes('print(100 - 40)'), successMsg: "ممتاز! الكمبيوتر نفذ العمليتين بسرعة فائقة." }
      ]
    },
    {
      title: "الدرس 2: الضرب والقسمة", steps: [
        { type: "cody", text: "للضرب نستخدم النجمة <code>*</code>، وللقسمة الشرطة المائلة <code>/</code>." },
        { type: "cody", text: "اطبع ناتج ضرب <code>8 * 7</code>، وناتج قسمة <code>50 / 2</code>." },
        { type: "challenge", expected: "56\n25.0", defaultCode: '# اكتب الكود هنا\n', hint: 'print(8 * 7)\nprint(50 / 2)', check: (code) => code.includes('print(8 * 7)') && code.includes('print(50 / 2)'), successMsg: "عمل رائع! 🌟 القسمة في بايثون تعطي دائماً رقماً عشرياً." }
      ]
    },
    {
      title: "الدرس 3: باقي القسمة", steps: [
        { type: "cody", text: "علامة باقي القسمة هي <code>%</code>. تخيل 10 تفاحات على 3 أصدقاء، سيتبقى 1." },
        { type: "cody", text: "اطبع ناتج باقي قسمة <code>15</code> على <code>4</code>." },
        { type: "challenge", expected: "3", defaultCode: '# اكتب الكود هنا\n', hint: 'print(15 % 4)', check: (code) => /print\s*\(\s*15\s*%\s*4\s*\)/m.test(code.trim()), successMsg: "ممتاز! 15 مقسومة على 4 تساوي 3، ويتبقى 3." }
      ]
    },
    {
      title: "الدرس 4: أولويات العمليات", steps: [
        { type: "cody", text: "بايثون تتبع قواعد الرياضيات: الأقواس أولاً، ثم الضرب والقسمة، ثم الجمع والطرح." },
        { type: "quiz", question: "ماذا سيطبع الكمبيوتر عند تنفيذ print(10 - 2 * 3)؟", options: ["24", "4", "8"], correct: 1, explanation: "الضرب يتم أولاً: 2 * 3 = 6. ثم الطرح: 10 - 6 = 4." },
        { type: "cody", text: "اكتب كوداً يطبع ناتج <code>(10 + 5) * 2</code>، وكوداً آخر يطبع <code>10 + (5 * 2)</code>." },
        { type: "challenge", expected: "30\n20", defaultCode: '# اكتب الكود هنا\n', hint: 'print((10 + 5) * 2)\nprint(10 + (5 * 2))', check: (code) => code.includes('print((10 + 5) * 2)') && code.includes('print(10 + (5 * 2))'), successMsg: "عبقري! 🌟 الأقواس غيرت الناتج تماماً." }
      ]
    },
    {
      title: "امتحان الفصل الثالث", steps: [
        { type: "cody", text: "أهلاً بك في امتحان الفصل الثالث! 🎓" },
        { type: "quiz", question: "1. ما هو ناتج هذا الكود: print(7 % 3)؟", options: ["2", "1", "3"], correct: 1, explanation: "7 مقسومة على 3 تساوي 2، ويتبقى 1." },
        { type: "cody", text: "تحدي برمجي أخير: اكتب كوداً يطبع ناتج (5 + 5) مضروباً في 2. ثم اطبع باقي قسمة 10 على 3." },
        { type: "challenge", expected: "20\n1", defaultCode: '# اكتب الكود هنا\n', hint: 'print((5 + 5) * 2)\nprint(10 % 3)', check: (code) => code.includes('print((5 + 5) * 2)') && code.includes('print(10 % 3)'), successMsg: "مذهل! 🌟 لقد أثبت إتقانك التام للعمليات الحسابية." }
      ]
    }
  ]
};