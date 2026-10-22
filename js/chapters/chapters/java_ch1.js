
window.CHAPTERS = window.CHAPTERS || {};

window.CHAPTERS[1] = {
  title: "الفصل 1: البداية مع Java",

  lessons: [
    {
      title: "الدرس 1: أول برنامج",
      steps: [
        {
          type: "cody",
          text: "أهلاً يا بطل! 🤖 النهارده هنكتب أول برنامج بلغة Java. كل برنامج بيبدأ بفكرة، وإحنا هنحوّل فكرتنا لكود."
        },
        {
          type: "cody",
          text: "علشان نعرض رسالة على الشاشة، بنستخدم System.out.println(). النص اللي عايزين نعرضه بنكتبه بين علامتي تنصيص."
        },
        {
          type: "cody",
          text: "مثال: <code>System.out.println(\"Hello\");</code> هيعرض كلمة Hello. لاحظ إننا بننهي الأمر بعلامة الفاصلة المنقوطة ;"
        },
        {
          type: "quiz",
          question: "إيه وظيفة System.out.println()؟",
          options: [
            "عرض رسالة على الشاشة",
            "حذف البرنامج",
            "إنشاء صورة"
          ],
          correct: 0,
          explanation: "ممتاز! الأمر بيعرض النص أو القيمة على الشاشة."
        },
        {
          type: "challenge",
          expected: "Hello, World!",
          defaultCode:
            'public class Main {\n' +
            '    public static void main(String[] args) {\n' +
            '        // اكتب أمر الطباعة هنا\n' +
            '    }\n' +
            '}',
          hint: 'System.out.println("Hello, World!");',
          check: code =>
            /System\s*\.\s*out\s*\.\s*println\s*\(\s*"Hello,\s*World!"\s*\)\s*;/.test(code),
          successMsg: "رائع! 🎉 كتبت أول أمر طباعة بلغة Java."
        },
        {
          type: "cody",
          text: "عاش! كده عرفت إزاي تعرض رسالة باستخدام Java. في الدرس التالي هنتعلم نطبع الأرقام."
        }
      ]
    },

    {
      title: "الدرس 2: طباعة الأرقام",
      steps: [
        {
          type: "cody",
          text: "أهلاً بعودتك! System.out.println() مش للنصوص بس، نقدر نستخدمه كمان لعرض الأرقام."
        },
        {
          type: "cody",
          text: "مثال: <code>System.out.println(25);</code> هيعرض الرقم 25. لاحظ إن الرقم مش محتاج علامات تنصيص."
        },
        {
          type: "cody",
          text: "نقدر كمان نعرض نتيجة عملية حسابية: <code>System.out.println(5 + 3);</code> والناتج هيكون 8."
        },
        {
          type: "challenge",
          expected: "25\n8",
          defaultCode:
            'public class Main {\n' +
            '    public static void main(String[] args) {\n' +
            '        // اطبع الرقم 25\n' +
            '        // اطبع ناتج 5 + 3\n' +
            '    }\n' +
            '}',
          hint: "System.out.println(25);\nSystem.out.println(5 + 3);",
          check: code =>
            /System\s*\.\s*out\s*\.\s*println\s*\(\s*25\s*\)\s*;/.test(code) &&
            /System\s*\.\s*out\s*\.\s*println\s*\(\s*5\s*\+\s*3\s*\)\s*;/.test(code),
          successMsg: "ممتاز! 🌟 اتعلمت تعرض الأرقام وتستخدم العمليات الحسابية."
        },
        {
          type: "quiz",
          question: "ما الناتج من System.out.println(10 + 5);؟",
          options: ["105", "15", "10 + 5"],
          correct: 1,
          explanation: "لأننا كتبنا أرقامًا وعملية جمع من غير علامات تنصيص، فالناتج 15."
        },
        {
          type: "cody",
          text: "أحسنت! خلصت أول درسين في Java. راجع اللي اتعلمته قبل ما تنتقل للدرس التالي."
        }
      ]
    }
  ]
};
