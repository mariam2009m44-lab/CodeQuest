window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[1] = {
  title: "الفصل 1: مقدمة إلى جافا",
  lessons: [
    {
      title: "الدرس 1: أول لقاء مع جافا", steps: [
        { type: "cody", text: "أهلاً بك يا بطل! ☕ أنا كودي، وهنبدأ رحلتنا في عالم جافا، واحدة من أقوى لغات البرمجة في العالم." },
        { type: "cody", text: "تخيل إن جافا هي اللغة اللي بنت بها شركات كبرى زي Netflix و Amazon تطبيقاتها. كمان لعبة Minecraft الشهيرة مكتوبة بجافا!" },
        { type: "choice", question: "هل تعرف ليه سميت جافا بهذا الاسم؟", options: ["لا، عرفني!", "أعتقد بسبب نوع قهوة"], replies: ["ولا يهمك، الحكاية ممتعة! هقولك.", "عبقري! بالفعل، المبرمجين اللي اخترعوها كانوا بيحبو قهوة الجافا، فسموها على اسمها."] },
        { type: "cody", text: "جافا لغة قوية، بس أول حاجة لازم نتعلمها هي إزاي نخلي الكمبيوتر يطبع كلام على الشاشة. هنستخدم أمر اسمه <code>System.out.println</code>." },
        { type: "cody", text: "ده أمر طويل شوية، بس هنحفظه. خد بالك: بنكتبه بحروف كبيرة في أول كل كلمة، وبنحط بعده قوسين، وجوه القوسين بنحط اللي عايزين نطبعه." },
        { type: "choice", question: "لو عايزين نطبع كلمة Hello، هنكتب إيه؟", options: ["print(\"Hello\")", "System.out.println(\"Hello\")", "echo Hello"], replies: ["تقريباً! بس دي في بايثون مش جافا.", "بالظبط! ده الأمر الصح في جافا.", "ده في لغة تانية، إحنا في جافا بنستخدم System.out.println."] },
        { type: "cody", text: "دلوقتي هنكتب أول برنامج حقيقي! أول حاجة لازم نعرفها إن أي برنامج جافا لازم يكون جوه حاجة اسمها (Class) أو فئة." },
        { type: "cody", text: "بص على الكود ده:<br><code>public class Main {<br>&nbsp;&nbsp;public static void main(String[] args) {<br>&nbsp;&nbsp;&nbsp;&nbsp;System.out.println(\"Hello, Java!\");<br>&nbsp;&nbsp;}<br>}</code>" },
        { type: "choice", question: "هل لاحظت إن فيه سطر معين هو اللي بيطبع الكلام؟", options: ["أيوه، سطر System.out.println", "لا، ملاحظتش"], replies: ["ممتاز! عينك قوية.", "ولا يهمك، السطر اللي فيه System.out.println هو اللي بيطبع الكلام."] },
        { type: "cody", text: "دلوقتي دورك! في المحرر اللي هيفتح، اكتب برنامج يطبع الجملة <code>Hello, Java!</code> بالظبط زي المثال." },
        { type: "challenge", expected: "Hello, Java!", defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // اكتب الكود هنا\n    }\n}', hint: 'System.out.println("Hello, Java!");', check: (code) => /System\.out\.println\s*\(\s*(["'])Hello, Java!\1\s*\)/.test(code), successMsg: "🎉 عظيم! لقد كتبت أول برنامج جافا في حياتك. أنت الآن مبرمج جافا رسمياً!" }
      ]
    },
    {
      title: "الدرس 2: الكلاس والـ Main", steps: [
        { type: "cody", text: "مرحباً بعودتك! هنتكلم شوية عن هيكل أي برنامج جافا، عشان تفهم إنت بتكتب إيه." },
        { type: "cody", text: "كل برنامج جافا بيتكون من حاجتين أساسيتين: <b>الكلاس (Class)</b> و <b>الدالة الرئيسية (Main Method)</b>." },
        { type: "choice", question: "إيه رأيك، الكلاس ده بيعمل إيه؟", options: ["بيغلف الكود جواه", "بيطبع الكلام", "بيعمل عمليات حسابية"], replies: ["بالظبط! الكلاس زي الصندوق اللي بنحط فيه الكود.", "لا، الطباعة بيعملها System.out.println مش الكلاس.", "لا، العمليات الحسابية بيعملها الكمبيوتر نفسه."] },
        { type: "cody", text: "والدالة <code>main</code> دي هي نقطة البداية. يعني لما الكمبيوتر يشغل البرنامج، بيبدأ ينفذ من جوه <code>main</code> على طول." },
        { type: "cody", text: "بص على الهيكل ده:<br><code>public class Main {<br>&nbsp;&nbsp;public static void main(String[] args) {<br>&nbsp;&nbsp;&nbsp;&nbsp;// الكود بتاعنا هنا<br>&nbsp;&nbsp;}<br>}</code>" },
        { type: "choice", question: "لو حطينا الكود بتاعنا بره الـ main، هيحصل إيه؟", options: ["مش هيتنفذ", "هيتنفذ عادي", "هيطبع لوحده"], replies: ["صح! الكمبيوتر مش هيلاقيه عشان مش جوه نقطة البداية.", "لا، لازم يكون الكود جوه main عشان يتنفذ.", "لا، الكود مش بيتنفذ لوحده أبداً."] },
        { type: "cody", text: "عظيم! دلوقتي عايزك تطبع جملة <code>I love Java</code> في المحرر، وتتأكد إنها جوه الـ main." },
        { type: "challenge", expected: "I love Java", defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // اكتب الكود هنا\n    }\n}', hint: 'System.out.println("I love Java");', check: (code) => /System\.out\.println\s*\(\s*(["'])I love Java\1\s*\)/.test(code), successMsg: "🌟 ممتاز! أنت فهمت الهيكل صح. كده بقيت تعرف مكان الكود بتاعك." }
      ]
    },
    {
      title: "الدرس 3: الطباعة المتعددة", steps: [
        { type: "cody", text: "أهلاً بك! عارف إني ممكن أطبع أكتر من سطر في نفس البرنامج؟" },
        { type: "cody", text: "كل أمر <code>System.out.println</code> بيطبع سطر لوحده. فلو كتبت الأمر ده مرتين، هيطلع سطرين." },
        { type: "cody", text: "بص على المثال:<br><code>System.out.println(\"Hello\");<br>System.out.println(\"World\");</code>" },
        { type: "choice", question: "إيه اللي هيظهر على الشاشة لو شغلنا الكود ده؟", options: ["Hello World", "Hello في سطر، وWorld في سطر تاني", "خطأ"], replies: ["لا، كل أمر بيطبع في سطر لوحده.", "صح! ده اللي بيحصل بالظبط.", "لا، الكود ده سليم 100%."] },
        { type: "cody", text: "النهاردة هتطبع جملتين: <code>Java</code> في سطر، و<code>Rocks</code> في سطر تحته." },
        { type: "challenge", expected: "Java\nRocks", defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // اكتب الكود هنا\n    }\n}', hint: 'System.out.println("Java");\nSystem.out.println("Rocks");', check: (code) => /System\.out\.println\s*\(\s*(["'])Java\1\s*\)/.test(code) && /System\.out\.println\s*\(\s*(["'])Rocks\1\s*\)/.test(code), successMsg: "🎉 عظيم! جافا بتنفذ الأوامر بالترتيب، سطر ورا سطر." }
      ]
    },
    {
      title: "الدرس 4: الفاصلة المنقوطة", steps: [
        { type: "cody", text: "عندي سؤال مهم! هل لاحظت إن كل سطر في جافا بينتهي بعلامة معينة؟" },
        { type: "choice", question: "ما هي العلامة اللي في آخر كل سطر؟", options: ["النقطة (.)", "الفاصلة المنقوطة (;)", "النجمة (*)"], replies: ["لا، النقطة بتستخدم في حاجات تانية.", "صح! جافا صارمة جداً في موضوع الفاصلة المنقوطة ده.", "لا، النجمة بتستخدم في العمليات الحسابية بس."] },
        { type: "cody", text: "جافا مش بتسامح في الفاصلة المنقوطة. لو نسيتها في آخر السطر، الكمبيوتر هيديك خطأ ومش هينفذ البرنامج." },
        { type: "cody", text: "بص على الفاصلة اللي في آخر سطر <code>System.out.println</code>، هي اللي بتقول للكمبيوتر: (خلاص، الأمر ده كده انتهى)." },
        { type: "choice", question: "لو نسينا الفاصلة، البرنامج هيعمل إيه؟", options: ["هيشتغل عادي", "هيطلع خطأ", "هيطبع رسالة تحذير"], replies: ["لا، جافا مش هتشتغل من غيرها.", "بالظبط! الخطأ ده اسمه Syntax Error.", "لا، هو هيرفض تشغيل البرنامج خالص."] },
        { type: "cody", text: "دلوقتي أنا هديك كود ناقص الفاصلة. عايزك تضيفها وتخلي البرنامج يشتغل ويطبع <code>Fixed</code>." },
        { type: "challenge", expected: "Fixed", defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Fixed")\n    }\n}', hint: 'System.out.println("Fixed");', check: (code) => /System\.out\.println\s*\(\s*(["'])Fixed\1\s*\)\s*;/.test(code), successMsg: "🌟 عبقري! لاحظت إن الفاصلة المنقوطة كانت ناقصة وصلحتها." }
      ]
    },
    {
      title: "امتحان الفصل الأول", steps: [
        { type: "cody", text: "وصلنا لنهاية الفصل الأول! 🎓 جاهز تختبر معلوماتك؟" },
        { type: "quiz", question: "1. ما هو الأمر الصحيح للطباعة في جافا؟", options: ["print()", "System.out.println()", "console.log()"], correct: 1, explanation: "في جافا بنستخدم System.out.println مش print." },
        { type: "quiz", question: "2. أين يجب أن نضع الكود عشان يتنفذ؟", options: ["جوه الكلاس بس", "جوه الدالة main", "بره أي حاجة"], correct: 1, explanation: "الكود لازم يكون جوه main عشان يتنفذ." },
        { type: "quiz", question: "3. ماذا نضع في آخر كل أمر في جافا؟", options: ["نقطة", "فاصلة منقوطة", "مسافة"], correct: 1, explanation: "الفاصلة المنقوطة ضرورية في جافا." },
        { type: "quiz", question: "4. لو كتبنا System.out.println بدون علامات تنصيص حوالين النص، هيحصل إيه؟", options: ["هيشتغل عادي", "هيطلع خطأ", "هيطبع الكلام"], correct: 1, explanation: "علامات التنصيص ضرورية عشان الكمبيوتر يعرف إن ده نص." },
        { type: "cody", text: "تحدي التخرج! اطبع جملة <code>I finished chapter 1</code> في المحرر." },
        { type: "challenge", expected: "I finished chapter 1", defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // اكتب الكود هنا\n    }\n}', hint: 'System.out.println("I finished chapter 1");', check: (code) => /System\.out\.println\s*\(\s*(["'])I finished chapter 1\1\s*\)\s*;/.test(code), successMsg: "🎉 مبروك يا بطل! أنهيت الفصل الأول بنجاح. أنت الآن مبرمج جافا حقيقي!" }
      ]
    }
  ]
};