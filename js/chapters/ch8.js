window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[8] = {
  title: "الفصل 8: سحر النصوص",
  lessons: [
    {
      title: "الدرس 1: عدّ الحروف (len)", steps: [
        { type: "cody", text: "أهلاً بك يا بطل! ✨ الفصل ده هنلعب فيه بالكلمات والنصوص (Strings)." },
        { type: "cody", text: "تخيل إنك بتكتب رسالة طويلة جداً لصاحبك، وفجأة وقفت وأنا سألتك: (كام حرف في الرسالة دي؟). هتعمل إيه؟" },
        { type: "choice", question: "هتعد الحروف إزاي؟", options: ["هعدهم واحد واحد بإيدي", "مش هعرف أعدهم، الرسالة طويلة جداً"], replies: ["تعبك هيضيع! في بايثون في أداة سحرية هتعدهم لك في لحظة.", "عشان كده إحنا بنتعلم البرمجة! عشان تخلي الكمبيوتر يعدهم بدالك في أجزاء من الثانية."] },
        { type: "cody", text: "الأداة السحرية دي اسمها <code>len()</code> (اختصار Length يعني طول)." },
        { type: "cody", text: "بص هنا، لو كتبنا <code>print(len(\"Python\"))</code>، الكمبيوتر هيعد الحروف وهيطبع (6)." },
        { type: "choice", question: "هل تعتقد إن الأداة دي بتعد المسافات كمان ولا بتعد الحروف بس؟", options: ["بتعد الحروف بس", "بتعد الحروف والمسافات"], replies: ["لا، المسافة بتعتبر حرف في بايثون، والكمبيوتر بيعدها.", "صح! المسافة بتاخد مكان في الذاكرة، فبتتحسب كحرف."] },
        { type: "cody", text: "دلوقتي دورك في الحكاية دي: أنا عايزك تعرف كام حرف في كلمة <code>Programming</code> وتطبع النتيجة." },
        { type: "challenge", expected: "11", defaultCode: '# اكتب الكود هنا\n', hint: 'print(len("Programming"))', check: (code) => code.includes('len("Programming")'), successMsg: "مذهل! 🌟 الكمبيوتر عد الحروف الـ 11 في لمح البصر." }
      ]
    },
    {
      title: "الدرس 2: تحويل الحروف (upper / lower)", steps: [
        { type: "cody", text: "مرحباً بعودتك! في الدرس ده هنغير شكل الكلام." },
        { type: "cody", text: "تخيل إنك بتكتب خطاب رسمي لمدير المدرسة. لازم يكون الخطاب محترم والكلمات كلها بحروف كبيرة عشان تدي هيبة." },
        { type: "choice", question: "هل تعرف إزاي البرمجة بتخلي كل الكلام بحروف كبيرة؟", options: ["بأداة .upper()", "بنكتب الكلام بإيدينا بحروف كبيرة"], replies: ["عاش! دي بالظبط الأداة اللي بنستخدمها.", "تعبك هيضيع لو النص طويل. البرمجة بتوفر علينا المجهود ده."] },
        { type: "cody", text: "بالظبط! الأداة <code>.upper()</code> بتحول كل الحروف لكبيرة (CAPITAL)." },
        { type: "cody", text: "والعكس صحيح، لو عايز تهمس لصاحبك، ممكن تستخدم <code>.lower()</code> عشان تخلي كل الحروف صغيرة." },
        { type: "choice", question: "لو النص ده <code>\"HELLO\"</code>، وطبقنا عليه <code>.lower()</code>، هيبقى شكله إيه؟", options: ["HELLO", "hello"], replies: ["لا، .lower() بتحول الكبير لصغير.", "تمام! .lower() هتخلي الكلام كله صغير."] },
        { type: "cody", text: "تحديك: اكتب كود يطبع كلمة <code>python</code> بس بحروف كبيرة." },
        { type: "challenge", expected: "PYTHON", defaultCode: '# اكتب الكود هنا\n', hint: 'print("python".upper())', check: (code) => code.includes('.upper()'), successMsg: "رائع! غيرت شكل النص بضغطة زر." }
      ]
    },
    {
      title: "الدرس 3: التعديل على النص (replace)", steps: [
        { type: "cody", text: "أهلاً بك! جيت في الوقت المناسب، أنا كنت بكتب جملة وفيها غلطة إملائية." },
        { type: "cody", text: "الجملة هي: <code>\"I love Java\"</code>. لكن أنا قصدت أكتب (Python) مش (Java)." },
        { type: "choice", question: "هل لازم أمسح الجملة كلها وأكتبها من الأول عشان أصلح الغلطة؟", options: ["أيوه، امسحها واكتبها تاني", "لأ، في أداة بتستبدل الكلمة الغلط بالصح"], replies: ["مش محتاج كل ده، البرمجة بتحل المشاكل دي بسهولة.", "بالضبط! في أداة اسمها replace بتعمل ده في لحظة."] },
        { type: "cody", text: "أداة <code>.replace()</code> بتدور على كلمة معينة وتستبدلها بكلمة تانية." },
        { type: "cody", text: "بنكتبها كده: <code>text.replace(\"القديم\", \"الجديد\")</code>. هي تدور على (القديم) وتحط مكانها (الجديد)." },
        { type: "cody", text: "تحديك: أنشئ متغير <code>sentence = \"I love cats\"</code>. استبدل كلمة cats بكلمة dogs واطبع الجملة الجديدة." },
        { type: "challenge", expected: "I love dogs", defaultCode: '# اكتب الكود هنا\n', hint: 'sentence = "I love cats"\nprint(sentence.replace("cats", "dogs"))', check: (code) => code.includes('sentence = "I love cats"') && code.includes('.replace("cats", "dogs")'), successMsg: "عبقري! استبدلت الكلمة بنجاح." }
      ]
    },
    {
      title: "الدرس 4: تقطيع النص (split)", steps: [
        { type: "cody", text: "آخر درس في الحكاية دي! تخيل إنك عندك جملة طويلة، وعايز تفصلها لكلمات عشان تحللها." },
        { type: "cody", text: "زي ما تكون بتقص ورقة مقسمة لخانات." },
        { type: "choice", question: "إيه الأداة اللي بتقسم النص لمجموعة كلمات؟", options: [".split()", ".cut()"], replies: ["عاش! هي دي الأداة اللي بنستخدمها.", "لا، .cut() مش موجودة في بايثون، إحنا بنستخدم .split()"] },
        { type: "cody", text: "أداة <code>.split()</code> بتاخد النص وتقسمه بناءً على المسافات، وبترجع لك (قائمة) فيها كل الكلمات منفصلة." },
        { type: "cody", text: "تحديك: عندك جملة <code>\"Hello World\"</code>. استخدم الأداة عشان تقسمها لكلمات واطبع النتيجة." },
        { type: "challenge", expected: "['Hello', 'World']", defaultCode: '# اكتب الكود هنا\n', hint: 'print("Hello World".split())', check: (code) => code.includes('.split()'), successMsg: "مذهل! قطعت النص كأنك ساحر." }
      ]
    },
    {
      title: "الامتحان الشامل للفصل", steps: [
        { type: "cody", text: "وصلنا لنهاية الرحلة دي! 🎓 جاهز للامتحان؟" },
        { type: "choice", question: "هل تريد مراجعة سريعة قبل البدء؟", options: ["نعم، عايز أتأكد", "لا، أنا جاهز وواثق"], replies: ["تمام: len للطول، upper للكبير، lower للصغير، replace للاستبدال، split للتقسيم.", "عاش! الحماس ده هو سر النجاح. يلا بينا."] },
        { type: "quiz", question: "1. ما هي الأداة التي تُرجع طول النص؟", options: [".size()", "len()", ".length"], correct: 1, explanation: "نستخدم دالة len() لمعرفة طول النص." },
        { type: "quiz", question: "2. كيف نحول النص إلى حروف كبيرة؟", options: [".upper()", ".capital()", ".lower()"], correct: 0, explanation: "الأداة .upper() تحول الحروف إلى كبيرة." },
        { type: "cody", text: "تحدي برمجي أخير: عندك نص <code>\"The quick brown fox\"</code>. أريدك أن تقسم هذا النص إلى كلمات باستخدام الأداة المناسبة." },
        { type: "challenge", expected: "['The', 'quick', 'brown', 'fox']", defaultCode: '# اكتب الكود هنا\n', hint: 'text = "The quick brown fox"\nprint(text.split())', check: (code) => code.includes('text = "The quick brown fox"') && code.includes('text.split()'), successMsg: "🎉 مبروك! لقد أتممت الفصل الثامن واجتزت الامتحان بنجاح." }
      ]
    }
  ]
};