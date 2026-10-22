window.CHAPTERS = window.CHAPTERS || {};
window.CHAPTERS[9] = {
  title: "الفصل 9: الأخطاء",
  lessons: [
    {
      title: "الدرس 1: try/except", steps: [
        { type: "cody", text: "أهلاً بك في الفصل التاسع! النهاردة هنتعلم إزاي نحمي الكود بتاعنا من الانهيار لو حصل خطأ." },
        { type: "cody", text: "لو قسمنا رقم على صفر، البرنامج هيقف فجأة. عشان نمنع ده بنستخدم try (جرب) و except (وإلا)." },
        { type: "choice", question: "إيه أفضل حل عشان نحمي البرنامج من الخطأ؟", options: ["نسيبه يقف", "نستخدم try/except"], replies: ["لا، كده اللعبة هتخلص فجأة.", "بالظبط! try/except بتحمينا من الانهيار."] },
        { type: "challenge", expected: "Error", defaultCode: '# اكتب الكود هنا\n', hint: 'try:\n    print(10 / 0)\nexcept:\n    print("Error")', check: (code) => code.includes('try:') && code.includes('except:') && code.includes('print("Error")'), successMsg: "رائع! لقد حميت طيارتك من السقوط." }
      ]
    },
    {
      title: "الدرس 2: الدرع المخصص", steps: [
        { type: "cody", text: "الدرع اللي عملناه في الدرس الأول ده درع عام. بس إحنا عايزين نعرف نوع الخطأ بالظبط." },
        { type: "choice", question: "إيه اسم الدرع المخصص للقسمة على صفر؟", options: ["except AllErrors", "except ZeroDivisionError"], replies: ["بايثون مش بتعرف الدرع ده.", "بالظبط! كده إحنا بنحدد نوع الخطأ."] },
        { type: "challenge", expected: "Cannot divide by zero", defaultCode: '# اكتب الكود هنا\n', hint: 'try:\n    print(5 / 0)\nexcept ZeroDivisionError:\n    print("Cannot divide by zero")', check: (code) => code.includes('except ZeroDivisionError:') && code.includes('print("Cannot divide by zero")'), successMsg: "عبقري! استخدمت الدرع المخصص بنجاح." }
      ]
    },
    {
      title: "الدرس 3: خطأ في النوع", steps: [
        { type: "cody", text: "لو حاولنا نحول كلمة (Apple) لرقم، الكمبيوتر هيعصب وهيدينا خطأ." },
        { type: "cody", text: "الخطأ ده اسمه ValueError." },
        { type: "challenge", expected: "Invalid input", defaultCode: '# اكتب الكود هنا\n', hint: 'try:\n    int("Hello")\nexcept ValueError:\n    print("Invalid input")', check: (code) => code.includes('except ValueError:') && code.includes('print("Invalid input")'), successMsg: "مذهل! درعك المخصص شغال تمام." }
      ]
    },
    {
      title: "الدرس 4: الدرع المتكامل", steps: [
        { type: "cody", text: "آخر درس! عايزين نحمي الكود من أي خطأ ممكن يحصل." },
        { type: "cody", text: "اكتب try جرب يقسم 10 / int(\"0\")، ولو حصل أي خطأ اطبع Error handled." },
        { type: "challenge", expected: "Error handled", defaultCode: '# اكتب الكود هنا\n', hint: 'try:\n    print(10 / int("0"))\nexcept:\n    print("Error handled")', check: (code) => code.includes('try:') && code.includes('except:') && code.includes('print("Error handled")'), successMsg: "رائع! درعك شغال في أي موقف." }
      ]
    },
    {
      title: "الامتحان الشامل للفصل", steps: [
        { type: "cody", text: "جاهز للامتحان؟ 🎓" },
        { type: "quiz", question: "1. إيه الكلمة اللي بنجرب بيها الكود؟", options: ["try", "except", "catch"], correct: 0, explanation: "بنستخدم try لتجربة الكود." },
        { type: "quiz", question: "2. إيه الكلمة اللي بنستخدمها لو حصل الخطأ؟", options: ["try", "except", "error"], correct: 1, explanation: "بنستخدم except لتنفيذ خطة بديلة." },
        { type: "challenge", expected: "Wrong Data", defaultCode: '# اكتب الكود هنا\n', hint: 'try:\n    int("Cody")\nexcept ValueError:\n    print("Wrong Data")', check: (code) => code.includes('int("Cody")') && code.includes('except ValueError:') && code.includes('print("Wrong Data")'), successMsg: "🎉 مبروك يا كابتن! لقد اجتزت امتحان الأخطاء." }
      ]
    }
  ]
};