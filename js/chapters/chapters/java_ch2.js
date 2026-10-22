window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[2] = {
  title: "الفصل 2: المتغيرات",
  lessons: [
    {
      title: "الدرس 1: صندوق المتغيرات", steps: [
        { type: "cody", text: "أهلاً بك في الفصل الثاني! هنعلمك إزاي نخزن البيانات في جافا." },
        { type: "cody", text: "تخيل إن المتغير ده صندوق، بنحط فيه قيمة، وبنكتب عليه اسم، عشان نستخدمه بعدين." },
        { type: "cody", text: "في جافا، لازم نحدد نوع البيانات الأول. لو عايزين نخزن رقم صحيح، بنكتب <code>int</code>." },
        { type: "cody", text: "مثال: <code>int age = 10;</code>. كده أنشأنا متغير اسمه age من نوع int وقيمته 10." },
        { type: "choice", question: "لو عايزين نطبع المتغير age، هنكتب إيه؟", options: ["print(age)", "System.out.println(age)", "echo age"], replies: ["دي في بايثون.", "بالظبط! ده الأمر الصح.", "دي في لغات تانية."] },
        { type: "cody", text: "تحديك: أنشئ متغير اسمه <code>myAge</code> قيمته <code>12</code>، واطبعه." },
        { type: "challenge", expected: "12", defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // اكتب الكود هنا\n    }\n}', hint: 'int myAge = 12;\nSystem.out.println(myAge);', check: (code) => /int\s+myAge\s*=\s*12\s*;/.test(code) && /System\.out\.println\s*\(\s*myAge\s*\)\s*;/.test(code), successMsg: "🎉 ممتاز! أنشأت متغيرك الأول وطبعته." }
      ]
    },
    {
      title: "الدرس 2: النصوص", steps: [
        { type: "cody", text: "المتغيرات مش بس أرقام! ممكن نخزن نصوص كمان باستخدام نوع <code>String</code>." },
        { type: "cody", text: "مثال: <code>String name = \"Ali\";</code>. لاحظ حرف S الكبير في String." },
        { type: "choice", question: "إيه الفرق بين int و String؟", options: ["مفيش فرق", "int للأرقام و String للنصوص", "int للنصوص و String للأرقام"], replies: ["لا، في فرق كبير.", "صح! كل واحد ليه استخدامه.", "العكس هو الصح."] },
        { type: "cody", text: "تحديك: أنشئ متغير <code>String hero = \"Cody\";</code> واطبعه." },
        { type: "challenge", expected: "Cody", defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // اكتب الكود هنا\n    }\n}', hint: 'String hero = "Cody";\nSystem.out.println(hero);', check: (code) => /String\s+hero\s*=\s*(["'])Cody\1\s*;/.test(code) && /System\.out\.println\s*\(\s*hero\s*\)\s*;/.test(code), successMsg: "🌟 عظيم! النصوص كمان بتتخزن في متغيرات." }
      ]
    },
    {
      title: "الدرس 3: القيم المنطقية", steps: [
        { type: "cody", text: "نوع تالت مهم جداً هو <code>boolean</code>. ده بيخزن قيمة صح أو خطأ (true أو false)." },
        { type: "choice", question: "القيمة المنطقية بتاخد إيه؟", options: ["أرقام", "نصوص", "true أو false"], replies: ["لا، الأرقام نوعها int.", "لا، النصوص نوعها String.", "صح! دي القيمتين الوحيدتين لـ boolean."] },
        { type: "cody", text: "تحديك: أنشئ متغير <code>boolean isFun = true;</code> واطبعه." },
        { type: "challenge", expected: "true", defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // اكتب الكود هنا\n    }\n}', hint: 'boolean isFun = true;\nSystem.out.println(isFun);', check: (code) => /boolean\s+isFun\s*=\s*true\s*;/.test(code) && /System\.out\.println\s*\(\s*isFun\s*\)\s*;/.test(code), successMsg: "🎉 عبقري! boolean بيستخدم كتير في الشروط." }
      ]
    },
    {
      title: "الدرس 4: تغيير القيم", steps: [
        { type: "cody", text: "المتغير ممكن نغير قيمته بعدين! لو كتبنا <code>int x = 5;</code> وبعدين <code>x = 10;</code>، القيمة بتتغير." },
        { type: "choice", question: "لو طبعنا x بعد التغيير، هتطلع كام؟", options: ["5", "10", "خطأ"], replies: ["لا، القيمة اتغيرت.", "صح! الكمبيوتر بياخد آخر قيمة.", "لا، التغيير مسموح."] },
        { type: "cody", text: "تحديك: أنشئ متغير <code>int score = 0;</code>، بعدين غيره لـ <code>100</code>، واطبعه." },
        { type: "challenge", expected: "100", defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // اكتب الكود هنا\n    }\n}', hint: 'int score = 0;\nscore = 100;\nSystem.out.println(score);', check: (code) => /int\s+score\s*=\s*0\s*;/.test(code) && /score\s*=\s*100\s*;/.test(code) && /System\.out\.println\s*\(\s*score\s*\)\s*;/.test(code), successMsg: "🌟 رائع! المتغيرات مرنة وبتتغير." }
      ]
    },
    {
      title: "امتحان الفصل الثاني", steps: [
        { type: "cody", text: "جاهز لامتحان الفصل الثاني؟ 🎓" },
        { type: "quiz", question: "1. أي نوع بيانات نستخدم لتخزين رقم صحيح؟", options: ["String", "int", "boolean"], correct: 1, explanation: "int هو النوع الصح للأرقام الصحيحة." },
        { type: "quiz", question: "2. أي نوع بيانات نستخدم لتخزين نص؟", options: ["int", "String", "boolean"], correct: 1, explanation: "String للنصوص." },
        { type: "quiz", question: "3. كم مرة ممكن نغير قيمة المتغير؟", options: ["مرة واحدة", "لا نهائي", "مش ممكن نغيرها"], correct: 1, explanation: "المتغير ممكن نغير قيمته كذا مرة." },
        { type: "cody", text: "تحدي التخرج! أنشئ متغير <code>String playerName = \"Ali\";</code> واطبعه." },
        { type: "challenge", expected: "Ali", defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // اكتب الكود هنا\n    }\n}', hint: 'String playerName = "Ali";\nSystem.out.println(playerName);', check: (code) => /String\s+playerName\s*=\s*(["'])Ali\1\s*;/.test(code) && /System\.out\.println\s*\(\s*playerName\s*\)\s*;/.test(code), successMsg: "🎉 مبروك! أنهيت الفصل الثاني. أنت الآن محترف في المتغيرات!" }
      ]
    }
  ]
};