
window.CHAPTERS = window.CHAPTERS || {};

window.CHAPTERS[2] = {
  title: "الفصل 2: المتغيرات",

  lessons: [
    {
      title: "الدرس 1: ما هو المتغير؟",
      steps: [
        {
          type: "cody",
          text: "تخيل إن عندك صندوقًا بتخزن فيه معلومة وتقدر ترجع لها بعدين. المتغير في البرمجة بيعمل حاجة شبه كده."
        },
        {
          type: "cody",
          text: "في Java، نقدر ننشئ متغيرًا للأعداد الصحيحة باستخدام int. مثال: <code>int age = 12;</code> معناه إننا أنشأنا متغيرًا اسمه age وقيمته 12."
        },
        {
          type: "cody",
          text: "ولعرض قيمة المتغير، نكتب <code>System.out.println(age);</code> بدل ما نكتب الرقم مباشرة."
        },
        {
          type: "challenge",
          expected: "10",
          defaultCode:
            'public class Main {\n' +
            '    public static void main(String[] args) {\n' +
            '        // أنشئ متغير age بقيمة 10\n' +
            '        // اطبع قيمة المتغير\n' +
            '    }\n' +
            '}',
          hint: "int age = 10;\nSystem.out.println(age);",
          check: code =>
            /\bint\s+age\s*=\s*10\s*;/.test(code) &&
            /System\s*\.\s*out\s*\.\s*println\s*\(\s*age\s*\)\s*;/.test(code),
          successMsg: "ممتاز! 🎉 أنشأت متغيرًا واستخدمته."
        },
        {
          type: "quiz",
          question: "ما نوع البيانات المناسب لتخزين العدد الصحيح 20؟",
          options: ["int", "String", "boolean"],
          correct: 0,
          explanation: "صحيح! int يُستخدم لتخزين الأعداد الصحيحة."
        }
      ]
    },

    {
      title: "الدرس 2: تغيير قيمة المتغير",
      steps: [
        {
          type: "cody",
          text: "قيمة المتغير ممكن تتغير أثناء تشغيل البرنامج. لو خزّنا 5 في points، وبعدها خزّنا 20، فالقيمة الجديدة هتكون 20."
        },
        {
          type: "cody",
          text: "مثال: <code>int points = 5;</code> وبعدها <code>points = 20;</code>. مش محتاجين نكتب int مرة ثانية لأن المتغير اتعرّف بالفعل."
        },
        {
          type: "challenge",
          expected: "20",
          defaultCode:
            'public class Main {\n' +
            '    public static void main(String[] args) {\n' +
            '        int points = 5;\n' +
            '        // غيّر القيمة إلى 20\n' +
            '        // اطبع القيمة الجديدة\n' +
            '    }\n' +
            '}',
          hint: "points = 20;\nSystem.out.println(points);",
          check: code =>
            /\bint\s+points\s*=\s*5\s*;/.test(code) &&
            /\bpoints\s*=\s*20\s*;/.test(code) &&
            /System\s*\.\s*out\s*\.\s*println\s*\(\s*points\s*\)\s*;/.test(code),
          successMsg: "رائع! 🌟 فهمت إزاي تغيّر قيمة المتغير."
        },
        {
          type: "quiz",
          question: "بعد تنفيذ int score = 5; ثم score = 9;، ما قيمة score؟",
          options: ["5", "9", "14"],
          correct: 1,
          explanation: "القيمة الجديدة 9 استبدلت القيمة القديمة."
        },
        {
          type: "cody",
          text: "برافو! كده خلصت درسي المتغيرات. الخطوة التالية هتكون العمليات الحسابية."
        }
      ]
    }
  ]
};
