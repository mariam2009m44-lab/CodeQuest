window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[10] = {
  title: "الفصل 10: القواميس (Dictionaries)",
  lessons: [
    {
      title: "الدرس 1: دفتر الهاتف", steps: [
        { type: "cody", text: "أهلاً بك! 📖 النهاردة هنعمل (دفتر هاتف) برمجي. عارف إزاي بنستخدمه؟" },
        { type: "cody", text: "لو عايز تكلم صاحبك (أحمد)، بتدور على اسمه (أحمد) عشان تلاقي رقمه. الاسم هنا بنسميه (مفتاح Key)، والرقم بنسميه (قيمة Value)." },
        { type: "choice", question: "في القواميس، إحنا بنربط إيه بإيه؟", options: ["رقم برقم", "مفتاح بقيمة (Key: Value)"], replies: ["لا، القواميس بتربط اسم أو مفتاح بحاجة تانية.", "عاش! القواميس بتخزن البيانات على شكل مفتاح وقيمة."] },
        { type: "cody", text: "عشان نعمل قاموس في بايثون، بنستخدم الأقواس المعقوفة <code>{}</code>.<br>مثال: <code>phone = {\"Ahmed\": \"0100\"}</code>" },
        { type: "cody", text: "تحديك: اعمل قاموس اسمه <code>student</code> فيه المفتاح <code>name</code> والقيمة <code>Ali</code>. (يعني name: Ali)." },
        { type: "challenge", expected: "{'name': 'Ali'}", defaultCode: '# اكتب الكود هنا\n', hint: 'student = {"name": "Ali"}\nprint(student)', check: (code) => code.includes('student = {"name": "Ali"}'), successMsg: "ممتاز! عملت أول قاموس ليك." }
      ]
    },
    {
      title: "الدرس 2: البحث عن رقم", steps: [
        { type: "cody", text: "مرحباً بعودتك! دلوقتي عايزين نجيب رقم أحمد من دفتر الهاتف. هنعمل إيه؟" },
        { type: "choice", question: "إزاي بنجيب القيمة من القاموس؟", options: ["بنكتب المفتاح بين أقواس مربعة", "بنستخدم أمر print لوحده"], replies: ["بالظبط! زي ما بتدور في القائمة بالرقم، هنا بتدور بالمفتاح.", "مش كفاية، لازم نقول للكمبيوتر هات القيمة بتاعة المفتاح ده إزاي."] },
        { type: "cody", text: "بنكتب اسم القاموس وبعدين المفتاح بين أقواس مربعة. زي كده: <code>print(phone[\"Ahmed\"])</code>." },
        { type: "cody", text: "تحديك: عندك قاموس <code>student = {\"name\": \"Ali\", \"age\": 15}</code>. اطبع العمر (age)." },
        { type: "challenge", expected: "15", defaultCode: '# اكتب الكود هنا\n', hint: 'student = {"name": "Ali", "age": 15}\nprint(student["age"])', check: (code) => code.includes('student["age"]'), successMsg: "عبقري! عرفت توصل للقيمة عن طريق المفتاح." }
      ]
    },
    {
      title: "الدرس 3: إضافة صفحة جديدة", steps: [
        { type: "cody", text: "أهلاً بك! جالك صاحب جديد وعايز تضيفه في الدفتر." },
        { type: "cody", text: "عشان تضيف مفتاح وقيمة جديدة، بتكتب اسم القاموس والمفتاح الجديد وتساويه بالقيمة." },
        { type: "cody", text: "تحديك: عندك قاموس <code>car = {\"brand\": \"BMW\"}</code>. ضيف مفتاح جديد اسمه <code>color</code> وقيمته <code>Red</code>، واطبع القاموس." },
        { type: "challenge", expected: "{'brand': 'BMW', 'color': 'Red'}", defaultCode: '# اكتب الكود هنا\n', hint: 'car = {"brand": "BMW"}\ncar["color"] = "Red"\nprint(car)', check: (code) => code.includes('car["color"] = "Red"'), successMsg: "رائع! القاموس بقى فيه معلومة جديدة." }
      ]
    },
    {
      title: "الدرس 4: كل المفاتيح", steps: [
        { type: "cody", text: "آخر درس! لو عايز تعرف كل الأسماء اللي في الدفتر، هتعمل إيه؟" },
        { type: "cody", text: "بنستخدم الأداة <code>.keys()</code> عشان تطلعلك كل المفاتيح الموجودة." },
        { type: "cody", text: "تحديك: اطبع كل المفاتيح الموجودة في القاموس <code>student = {\"name\": \"Ali\"}</code>." },
        { type: "challenge", expected: "dict_keys(['name'])", defaultCode: '# اكتب الكود هنا\n', hint: 'student = {"name": "Ali"}\nprint(student.keys())', check: (code) => code.includes('.keys()'), successMsg: "مذهل! استخرجت كل المفاتيح." }
      ]
    },
    {
      title: "الامتحان الشامل", steps: [
        { type: "cody", text: "جاهز لامتحان القواميس؟ 🎓" },
        { type: "quiz", question: "1. بأي أقواس بنكتب القاموس؟", options: ["[]", "()", "{}"], correct: 2, explanation: "القواميس بنكتبها بأقواس معقوفة {}." },
        { type: "cody", text: "تحديك: اعمل قاموس <code>person = {\"name\": \"Sara\"}</code>. اطبع اسمها." },
        { type: "challenge", expected: "Sara", defaultCode: '# اكتب الكود هنا\n', hint: 'person = {"name": "Sara"}\nprint(person["name"])', check: (code) => code.includes('person["name"]'), successMsg: "🎉 مبروك! اجتزت الفصل العاشر." }
      ]
    }
  ]
};