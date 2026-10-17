const curriculumData = {
    "javascript": [
        { level: 1, title: "طباعة النصوص", task: "اكتب كود يطبع الجملة دي: Hello CodeQuest", starter: "// اكتب الكود هنا\n", expected: "Hello CodeQuest" },
        { level: 2, title: "المتغيرات", task: "اعمل متغير اسمه name وخليه يساوي 'Cody' واطبعه.", starter: "let name = ;\nconsole.log(name);", expected: "Cody" },
        { level: 3, title: "الشروط (If)", task: "اكتب شرط لو الرقم 10 أكبر من 5، يطبع 'Yes'.", starter: "if ( ) {\n  console.log('Yes');\n}", expected: "Yes" },
        { level: 4, title: "الحلقات (Loops)", task: "استخدم حلقة for عشان تطبع الأرقام من 1 لـ 3.", starter: "for (let i = 1; i <= ; i++) {\n  console.log(i);\n}", expected: "1\n2\n3" },
        { level: 5, title: "الدوال (Functions)", task: "اعمل دالة اسمها greet تطبع 'Welcome'.", starter: "function greet() {\n  // اكتب هنا\n}\ngreet();", expected: "Welcome" }
    ],
    "python": [
        { level: 1, title: "طباعة النصوص", task: "استخدم دالة print لتطبع: Hello CodeQuest", starter: "# اكتب الكود هنا\n", expected: "Hello CodeQuest" },
        { level: 2, title: "المتغيرات", task: "اعمل متغير name = 'Cody' واطبعه.", starter: "name = \nprint(name)", expected: "Cody" },
        { level: 3, title: "الشروط (If)", task: "لو 10 > 5 اطبع 'Yes'.", starter: "if 10 > :\n    print('Yes')", expected: "Yes" },
        { level: 4, title: "الحلقات (Loops)", task: "اطبع الأرقام من 1 لـ 3 باستخدام for.", starter: "for i in range(1, ):\n    print(i)", expected: "1\n2\n3" },
        { level: 5, title: "الدوال (Functions)", task: "اعمل دالة تطبع 'Welcome'.", starter: "def greet():\n    pass\ngreet()", expected: "Welcome" }
    ],
    "cpp": [
        { level: 1, title: "طباعة النصوص", task: "اطبع الجملة: Hello CodeQuest", starter: "#include <iostream>\nusing namespace std;\nint main() {\n  // اكتب الكود\n  return 0;\n}", expected: "Hello CodeQuest" },
        { level: 2, title: "المتغيرات", task: "اعمل متغير int x = 5 واطبعه.", starter: "#include <iostream>\nusing namespace std;\nint main() {\n  int x = ;\n  cout << x;\n  return 0;\n}", expected: "5" },
        { level: 3, title: "الشروط (If)", task: "لو 10 > 5 اطبع 'Yes'.", starter: "#include <iostream>\nusing namespace std;\nint main() {\n  if (10 > 5) {\n    // اكتب هنا\n  }\n  return 0;\n}", expected: "Yes" }
    ]
};
