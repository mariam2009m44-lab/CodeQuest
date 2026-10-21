window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[6] = {
  title: "الفصل 6: القوائم (Lists)",
  lessons: [
    {
      title: "الدرس 1: صندوق الأدوات", steps: [
        { type: "cody", text: "أهلاً بك في الفصل السادس! 🎒 تخيل إنك رايح المدرسة، ومحتاج تحط كتبك وأقلامك في مكان واحد. هتعمل إيه؟" },
        { type: "choice", question: "هتجمعهم فين؟", options: ["هحط كل كتاب في إيدي", "هجيب شنطة وأحطهم كلهم جواها"], replies: ["مش عملي، إيدك هتتعب جداً!", "عاش! في البرمجة، الـ (الشنطة) دي بنسميها (قائمة) أو <code>List</code>."] },
        { type: "cody", text: "القائمة في بايثون بتخليك تخزن مجموعة قيم في مكان واحد، وبينهم فاصلة. وبنحطهم بين أقواس مربعة <code>[]</code>." },
        { type: "cody", text: "مثال: <code>bag = [\"Book\", \"Pen\", \"Copybook\"]</code>. دي قائمة فيها 3 عناصر." },
        { type: "choice", question: "لو عايزين نضيف (مسطرة) للشنطة ديه، إيه اللي هيحصل؟", options: ["الشنطة هتبوظ", "هتبقى قائمة فيها 4 عناصر"], replies: ["لا طبعاً! القوائم بتستوعب أي عدد من العناصر.", "بالضبط! القوائم مرنة وبتكبر معاك."] },
        { type: "cody", text: "تحديك: أنشئ قائمة اسمها <code>colors</code> فيها (Red, Green, Blue)." },
        { type: "challenge", expected: "['Red', 'Green', 'Blue']", defaultCode: '# اكتب الكود هنا\n', hint: 'colors = ["Red", "Green", "Blue"]\nprint(colors)', check: (code) => code.includes('colors = ["Red", "Green", "Blue"]'), successMsg: "ممتاز! لقد أنشأت أول قائمة لك بنجاح." }
      ]
    },
    {
      title: "الدرس 2: الأرقام السحرية (Index)", steps: [
        { type: "cody", text: "رجعنا تاني! عارف إني لو سألتك: إيه أول عنصر في قائمة الـ colors اللي أنت عملتها؟ هتقولي Red صح؟" },
        { type: "choice", question: "طيب في البرمجة، رقم العنصر الأول (Red) ده كام؟", options: ["1", "0"], replies: ["غلط! البرمجة بتبدأ العد من الصفر. العنصر الأول رقمه 0.", "صح لسانك! البرمجة زي المصعد الأوروبي، بتدور على الدور الأرضي (0) الأول."] },
        { type: "cody", text: "عشان كده، لو عايزين نطبع Red من القائمة، بنكتب <code>print(colors[0])</code>. ولو عايزين Green بنكتب <code>print(colors[1])</code>." },
        { type: "choice", question: "لو كتبنا <code>print(colors[2])</code>، هيطبع إيه؟", options: ["Red", "Green", "Blue"], replies: ["لا، Red رقمه 0.", "لا، Green رقمه 1.", "ممتاز! أنت فهمت اللعبة، Blue رقمه 2."] },
        { type: "cody", text: "تحديك: عايزك تطبع العنصر الأول من قائمة اسمها <code>cars</code> فيها (BMW, Audi)." },
        { type: "challenge", expected: "BMW", defaultCode: '# اكتب الكود هنا\n', hint: 'cars = ["BMW", "Audi"]\nprint(cars[0])', check: (code) => code.includes('cars = ["BMW", "Audi"]') && code.includes('print(cars[0])'), successMsg: "أحسنت! عرفت توصل لأول عنصر." }
      ]
    },
    {
      title: "الدرس 3: نضيف ونمسح (Append & Remove)", steps: [
        { type: "cody", text: "أهلاً بك! القوائم مش ثابتة زي الصخور. تقدر تضيف فيها وتشيل منها." },
        { type: "cody", text: "لو عايزين نضيف عنصر جديد في آخر القائمة، بنستخدم <code>.append()</code>." },
        { type: "choice", question: "أنا عندي <code>nums = [1, 2]</code>. وعايز أضيف رقم 3. أكتب إيه؟", options: ["nums + 3", "nums.append(3)"], replies: ["لا، دي طريقة للجمع الحسابي مش إضافة لقائمة.", "بالظبط! append معناها (ألحق أو ضيف في الآخر)."] },
        { type: "cody", text: "طيب لو عايزين نمسح عنصر؟ بنستخدم <code>.remove()</code> ونكتب اسم العنصر اللي عايزين نمسحه بين القوسين." },
        { type: "cody", text: "تحديك: أنشئ قائمة <code>fruits = [\"Apple\"]</code>. بعدين ضيف عليها (Banana) باستخدام append، واطبع القائمة." },
        { type: "challenge", expected: "['Apple', 'Banana']", defaultCode: '# اكتب الكود هنا\n', hint: 'fruits = ["Apple"]\nfruits.append("Banana")\nprint(fruits)', check: (code) => code.includes('fruits = ["Apple"]') && code.includes('fruits.append("Banana")'), successMsg: "رائع! القائمة بقت فيها فاكهتين." }
      ]
    },
    {
      title: "الدرس 4: عدّ العناصر (len)", steps: [
        { type: "cody", text: "آخر درس في الفصل ده! لو أنا سألتك: كام عنصر في القائمة اللي معاك؟" },
        { type: "cody", text: "مش هتعدهم بإيدك. في بايثون في دالة اسمها <code>len()</code> (اختصار Length) بتعدهم لك." },
        { type: "choice", question: "لو عندي قائمة <code>nums = [1, 2, 3, 4]</code>، وكتبت <code>len(nums)</code>، الناتج هيكون كام؟", options: ["3", "4", "5"], replies: ["لا، عد كويس، فيه 4 أرقام.", "ممتاز! len بترجع عدد العناصر اللي جوه القائمة.", "لا، مفيش العنصر الخامس."] },
        { type: "cody", text: "تحديك: اطبع طول قائمة اسمها <code>grades = [80, 90, 85]</code>." },
        { type: "challenge", expected: "3", defaultCode: '# اكتب الكود هنا\n', hint: 'grades = [80, 90, 85]\nprint(len(grades))', check: (code) => code.includes('grades = [80, 90, 85]') && code.includes('len(grades)'), successMsg: "مذهل! عرفت تعرف طول أي قائمة بسهولة." }
      ]
    },
    {
      title: "الامتحان الشامل للفصل", steps: [
        { type: "cody", text: "حان وقت امتحان القوائم! 🎓 متوتر؟" },
        { type: "choice", question: "هل أنت جاهز؟", options: ["جاهز جداً!", "ممكن أراجع الأول؟"], replies: ["عظيم! يلا بينا.", "طبعاً، خد وقتك. القوائم هي أقواس مربعة، والعنصر الأول رقمه 0، والـ append بتضيف."] },
        { type: "quiz", question: "1. إيه رمز الأقواس اللي بنكتب بيها القائمة؟", options: ["( )", "[ ]", "{ }"], correct: 1, explanation: "القوائم بنكتبها بين أقواس مربعة []." },
        { type: "quiz", question: "2. ما رقم العنصر الأول في القائمة؟", options: ["1", "0", "2"], correct: 1, explanation: "بايثون بتبدأ العد من الصفر." },
        { type: "cody", text: "تحدي برمجي أخير: أنشئ قائمة <code>heroes = [\"Batman\"]</code>، ضيف عليها <code>Superman</code>، ثم اطبع العنصر الأول، وبعدين اطبع طول القائمة." },
        { type: "challenge", expected: "Batman\n2", defaultCode: '# اكتب الكود هنا\n', hint: 'heroes = ["Batman"]\nheroes.append("Superman")\nprint(heroes[0])\nprint(len(heroes))', check: (code) => code.includes('heroes = ["Batman"]') && code.includes('heroes.append("Superman")') && code.includes('print(heroes[0])') && code.includes('print(len(heroes))'), successMsg: "🎉 مبروك! لقد أثبت إتقانك للقوائم واجتزت الامتحان." }
      ]
    }
  ]
};