export const curriculum = {
    "javascript": [
        {
            "title": "الفصل الأول: مقدمة إلى البرمجة وJavaScript",
            "lessons": [
                {
                    "title": "مفهوم البرمجة والبرنامج",
                    "desc": "تعرّف على ما هي البرمجة وكيف يعمل الكمبيوتر.",
                    "code": "// مرحباً بك في عالم البرمجة!\nconsole.log('Hello World');\n\n// الكود ده بيطبع جملة على الشاشة"
                },
                {
                    "title": "ما هي JavaScript؟",
                    "desc": "لغة برمجة تستخدم لبناء المواقع التفاعلية.",
                    "code": "// JavaScript هي لغة البرمجة اللي بتشغل المتصفح\nconsole.log('JavaScript is awesome!');"
                },
                {
                    "title": "عرض النتائج باستخدام console.log",
                    "desc": "كيف نطبع النصوص على الشاشة.",
                    "code": "// console.log هي أداة الطباعة\nconsole.log('أنا أتعلم البرمجة');\nconsole.log('وهذا أول كود ليا!');"
                },
                {
                    "title": "التعليقات وقواعد الكتابة",
                    "desc": "كيف نكتب ملاحظات في الكود.",
                    "code": "// ده تعليق سطر واحد\n/* وده تعليق\n   متعدد الأسطر */\nconsole.log('التعليقات مش بتتنفذ');"
                }
            ]
        },
        {
            "title": "الفصل الثاني: المتغيرات وأنواع البيانات",
            "lessons": [
                {
                    "title": "مفهوم المتغير",
                    "desc": "المتغير هو صندوق لحفظ البيانات.",
                    "code": "// المتغير هو صندوق بنحط فيه قيمة\nlet name = 'أحمد';\nconsole.log(name);"
                },
                {
                    "title": "استخدام let و const",
                    "desc": "الفرق بين المتغيرات الثابتة والمتغيرة.",
                    "code": "// let بتسمح بتغيير القيمة\nlet age = 12;\nage = 13;\nconsole.log(age);\n// const مش بتسمح\nconst country = 'Egypt';"
                },
                {
                    "title": "الأرقام والنصوص",
                    "desc": "أنواع البيانات الأساسية.",
                    "code": "let score = 100;\nlet message = 'فوز';\nconsole.log(typeof score);"
                },
                {
                    "title": "القيم المنطقية",
                    "desc": "استخدام true و false.",
                    "code": "let isLogged = true;\nlet isGuest = false;\nconsole.log(isLogged);"
                }
            ]
        },
        {
            "title": "الفصل الثالث: العمليات والتعبيرات",
            "lessons": [
                {
                    "title": "العمليات الحسابية",
                    "desc": "الجمع والطرح والضرب والقسمة.",
                    "code": "let x = 10;\nlet y = 5;\nconsole.log(x + y);\nconsole.log(x - y);\nconsole.log(x * y);\nconsole.log(x / y);"
                },
                {
                    "title": "ترتيب العمليات",
                    "desc": "كيف يحسب الكمبيوتر التعبيرات الرياضية.",
                    "code": "console.log(10 + 5 * 2); // 20\nconsole.log((10 + 5) * 2); // 30"
                },
                {
                    "title": "عمليات المقارنة",
                    "desc": "مقارنة القيم ببعضها.",
                    "code": "console.log(10 > 5); // true\nconsole.log(10 < 5); // false\nconsole.log(10 === 10); // true"
                }
            ]
        }
    ],
    "python": [
        {
            "title": "الفصل الأول: مقدمة إلى البرمجة وPython",
            "lessons": [
                {
                    "title": "ما البرمجة؟",
                    "desc": "كيف ينفّذ الكمبيوتر التعليمات.",
                    "code": "# أول أمر في بايثون\nprint('Hello World')"
                },
                {
                    "title": "كتابة أول أمر باستخدام print",
                    "desc": "دالة الطباعة الأساسية.",
                    "code": "print('أنا أتعلم بايثون')\nprint('وهذا أول كود ليا!')"
                },
                {
                    "title": "التعليقات في بايثون",
                    "desc": "كيف نكتب ملاحظات.",
                    "code": "# ده تعليق في بايثون\nprint('التعليقات مش بتتنفذ')"
                }
            ]
        },
        {
            "title": "الفصل الثاني: المتغيرات والبيانات",
            "lessons": [
                {
                    "title": "إنشاء المتغيرات",
                    "desc": "تخزين القيم داخل متغيرات.",
                    "code": "name = 'مريم'\nprint(name)"
                },
                {
                    "title": "الأرقام والنصوص",
                    "desc": "أنواع البيانات في بايثون.",
                    "code": "age = 12\nprint(age)\nprint(type(age))"
                },
                {
                    "title": "القيم المنطقية",
                    "desc": "استخدام True و False.",
                    "code": "is_student = True\nprint(is_student)"
                }
            ]
        },
        {
            "title": "الفصل الثالث: العمليات والتعبيرات",
            "lessons": [
                {
                    "title": "العمليات الحسابية",
                    "desc": "الجمع والطرح والضرب والقسمة.",
                    "code": "x = 10\ny = 5\nprint(x + y)\nprint(x - y)\nprint(x * y)\nprint(x / y)"
                },
                {
                    "title": "ترتيب العمليات",
                    "desc": "كيف يحسب بايثون التعبيرات.",
                    "code": "print(10 + 5 * 2)\nprint((10 + 5) * 2)"
                }
            ]
        }
    ],
    "cpp": [
        {
            "title": "الفصل الأول: مقدمة إلى C++",
            "lessons": [
                {
                    "title": "بنية البرنامج الأساسية",
                    "desc": "شرح main و cout.",
                    "code": "#include <iostream>\nusing namespace std;\nint main() {\n    cout << 'Hello World';\n    return 0;\n}"
                },
                {
                    "title": "المتغيرات والأنواع",
                    "desc": "استخدام int و double و string.",
                    "code": "#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    int age = 12;\n    string name = 'Ahmed';\n    cout << name << ' is ' << age;\n    return 0;\n}"
                }
            ]
        },
        {
            "title": "الفصل الثاني: الإدخال والإخراج",
            "lessons": [
                {
                    "title": "استقبال البيانات باستخدام cin",
                    "desc": "قراءة المدخلات من المستخدم.",
                    "code": "#include <iostream>\nusing namespace std;\nint main() {\n    int age;\n    cout << 'Enter age: ';\n    cin >> age;\n    cout << 'You are ' << age;\n    return 0;\n}"
                }
            ]
        }
    ]
};