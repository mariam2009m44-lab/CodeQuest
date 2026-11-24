window.CQPuzzleLearning = [
  {
    "id": "learn-variables",
    "name": "صناديق المتغيرات",
    "sub": "قيمة لها اسم",
    "category": "programming",
    "src": "assets/games/learning/variables.svg",
    "learning": {
      "title": "صناديق المتغيرات",
      "intro": "المتغير اسم نربطه بقيمة. يمكن تغيير القيمة أثناء تنفيذ البرنامج.",
      "facts": [
        [
          "اقرأ الكود",
          "score = 5"
        ],
        [
          "ثم تتبّع التغيير",
          "score = score + 2"
        ]
      ],
      "fact": "القيمة الأولى 5. أضفنا إليها 2 وأعدنا حفظها في score، فأصبحت 7.",
      "question": "ما قيمة score بعد السطرين؟",
      "answer": "7",
      "choices": [
        "5",
        "7",
        "2"
      ],
      "correct": 1,
      "explain": "القيمة الأولى 5. أضفنا إليها 2 وأعدنا حفظها في score، فأصبحت 7."
    }
  },
  {
    "id": "learn-loops",
    "name": "مصنع التكرار",
    "sub": "كرر أوامر واضحة",
    "category": "programming",
    "src": "assets/games/learning/loops.svg",
    "learning": {
      "title": "مصنع التكرار",
      "intro": "حلقة for تكرر أوامرها لكل عنصر. حد النهاية في range غير مشمول.",
      "facts": [
        [
          "اقرأ الكود",
          "for step in range(3):"
        ],
        [
          "ثم تتبّع التغيير",
          "    print(step)"
        ]
      ],
      "fact": "range(3) تعطي 0 ثم 1 ثم 2. لهذا ينفذ print ثلاث مرات.",
      "question": "كم مرة ينفذ print في الكود؟",
      "answer": "ثلاث مرات",
      "choices": [
        "مرتين",
        "ثلاث مرات",
        "أربع مرات"
      ],
      "correct": 1,
      "explain": "range(3) تعطي 0 ثم 1 ثم 2. لهذا ينفذ print ثلاث مرات."
    }
  },
  {
    "id": "learn-conditions",
    "name": "مفترق الشروط",
    "sub": "اختر الطريق بالمنطق",
    "category": "programming",
    "src": "assets/games/learning/conditions.svg",
    "learning": {
      "title": "مفترق الشروط",
      "intro": "الشرط تعبير نتيجته True أو False. نستخدمه لاتخاذ قرار في البرنامج.",
      "facts": [
        [
          "اقرأ الكود",
          "coins = 4"
        ],
        [
          "ثم تتبّع التغيير",
          "print(coins >= 3)"
        ]
      ],
      "fact": "العدد 4 أكبر من 3، لذلك المقارنة تعطي True.",
      "question": "هل قيمة coins أكبر من أو تساوي 3؟",
      "answer": "نعم، True",
      "choices": [
        "نعم، True",
        "لا، False",
        "النتيجة نص"
      ],
      "correct": 0,
      "explain": "العدد 4 أكبر من 3، لذلك المقارنة تعطي True."
    }
  },
  {
    "id": "learn-functions",
    "name": "آلة الدوال",
    "sub": "مدخل، عمل، ناتج",
    "category": "programming",
    "src": "assets/games/learning/functions.svg",
    "learning": {
      "title": "آلة الدوال",
      "intro": "الدالة تجمع خطوات تحت اسم. تستقبل مدخلات وقد تعيد ناتجًا باستخدام return.",
      "facts": [
        [
          "اقرأ الكود",
          "def double(x):"
        ],
        [
          "ثم تتبّع التغيير",
          "    return x * 2"
        ]
      ],
      "fact": "الدالة تضرب المدخل 4 في 2، فتعيد 8.",
      "question": "ماذا تعيد double(4)؟",
      "answer": "8",
      "choices": [
        "4",
        "6",
        "8"
      ],
      "correct": 2,
      "explain": "الدالة تضرب المدخل 4 في 2، فتعيد 8."
    }
  },
  {
    "id": "learn-lists",
    "name": "قطار القوائم",
    "sub": "عناصر بترتيب محدد",
    "category": "programming",
    "src": "assets/games/learning/lists.svg",
    "learning": {
      "title": "قطار القوائم",
      "intro": "القائمة تحفظ عناصر مرتبة. يبدأ فهرس أول عنصر من 0 في Python.",
      "facts": [
        [
          "اقرأ الكود",
          "colors = [\"red\", \"blue\"]"
        ],
        [
          "ثم تتبّع التغيير",
          "print(colors[0])"
        ]
      ],
      "fact": "colors[0] هو العنصر الأول وقيمته red. الفهرس رقم المكان وليس قيمة العنصر.",
      "question": "ما أول عنصر في القائمة؟",
      "answer": "red",
      "choices": [
        "red",
        "blue",
        "0"
      ],
      "correct": 0,
      "explain": "colors[0] هو العنصر الأول وقيمته red. الفهرس رقم المكان وليس قيمة العنصر."
    }
  },
  {
    "id": "learn-pixels",
    "name": "شبكة البكسلات",
    "sub": "صور من نقاط لون",
    "category": "programming",
    "src": "assets/games/learning/pixels.svg",
    "learning": {
      "title": "شبكة البكسلات",
      "intro": "الصورة الرقمية تتكون من بكسلات. في RGB تتكون ألوان الشاشة من الأحمر والأخضر والأزرق.",
      "facts": [
        [
          "اقرأ الكود",
          "pixel = [40, 160, 255]"
        ],
        [
          "ثم تتبّع التغيير",
          "# red, green, blue"
        ]
      ],
      "fact": "RGB اختصار Red وGreen وBlue. مزج شدات هذه القنوات يعطي ألوانًا كثيرة.",
      "question": "ما القنوات الثلاث في RGB؟",
      "answer": "أحمر وأخضر وأزرق",
      "choices": [
        "أحمر وأخضر وأزرق",
        "أسود وأبيض فقط",
        "صوت وصورة ونص"
      ],
      "correct": 0,
      "explain": "RGB اختصار Red وGreen وBlue. مزج شدات هذه القنوات يعطي ألوانًا كثيرة."
    }
  },
  {
    "id": "learn-input",
    "name": "محطة الإدخال",
    "sub": "من المستخدم للبرنامج",
    "category": "programming",
    "src": "assets/games/learning/input.svg",
    "learning": {
      "title": "محطة الإدخال",
      "intro": "الإدخال يزود البرنامج ببيانات، والإخراج يعرض النتيجة. هنا name يحمل الاسم المستخدم في التحية.",
      "facts": [
        [
          "اقرأ الكود",
          "name = \"Cody\""
        ],
        [
          "ثم تتبّع التغيير",
          "print(\"Hi \" + name)"
        ]
      ],
      "fact": "نصل النص Hi والمسافة بقيمة name وهي Cody، فيظهر Hi Cody.",
      "question": "ماذا يظهر عند تشغيل السطرين؟",
      "answer": "Hi Cody",
      "choices": [
        "Hi name",
        "Hi Cody",
        "Cody Hi"
      ],
      "correct": 1,
      "explain": "نصل النص Hi والمسافة بقيمة name وهي Cody، فيظهر Hi Cody."
    }
  },
  {
    "id": "learn-debug",
    "name": "مختبر الأخطاء",
    "sub": "اختبر ثم أصلح",
    "category": "programming",
    "src": "assets/games/learning/debug.svg",
    "learning": {
      "title": "مختبر الأخطاء",
      "intro": "نختبر الناتج المتوقع ونقارنه بالناتج الفعلي. فهم الخطأ خطوة طبيعية في التعلم.",
      "facts": [
        [
          "اقرأ الكود",
          "total = 2 + 3"
        ],
        [
          "ثم تتبّع التغيير",
          "print(total)"
        ]
      ],
      "fact": "الجمع 2 + 3 يعطي 5. الضرب يعطي 6 والطرح يعطي -1.",
      "question": "الناتج المتوقع 5. أي عملية تناسبه؟",
      "answer": "2 + 3",
      "choices": [
        "2 * 3",
        "2 + 3",
        "2 - 3"
      ],
      "correct": 1,
      "explain": "الجمع 2 + 3 يعطي 5. الضرب يعطي 6 والطرح يعطي -1."
    }
  }
];
