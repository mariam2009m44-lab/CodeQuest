/* Each Python snippet is executed by tests/content/speed-learning.cjs.
   Sources: Python tutorial, introduction, control flow and data structures. */
window.CQSpeedBank = (() => {
 const q=(id,level,concept,code,output,claim,explain)=>({id,level,concept,code,output,q:'هل الناتج التالي صحيح؟',claim,a:output===claim,explain});
 const bank=[];
 for(let n=1;n<=4;n++){
  bank.push(q('variable-'+n,'easy','المتغيرات',`coins = ${n}\ncoins = coins + 2\nprint(coins)`,String(n+2),String(n%2?n+2:n),'المتغير يحفظ قيمة. أضفنا 2 إلى قيمته ثم طبعنا القيمة الجديدة.'));
  bank.push(q('text-'+n,'easy','النصوص والأرقام',`print("${n}" + "2")`,`${n}2`,n%2?String(n+2):`${n}2`,'علامتا التنصيص تعنيان نصًا. علامة + هنا تصل النصين، ولا تجمع رقمين.'));
  bank.push(q('condition-'+n,'medium','الشروط',`score = ${n}\nif score >= 3:\n    print("win")\nelse:\n    print("try")`,n>=3?'win':'try',n%2?'win':'try','ينفذ if الفرع الأول إذا تحقق الشرط، وإلا ينفذ else. قارن قيمة score بالعدد 3.'));
  bank.push(q('loop-'+n,'medium','حلقات التكرار',`total = 0\nfor i in range(${n+1}):\n    total = total + i\nprint(total)`,String(n*(n+1)/2),String(n%2?n*(n+1)/2:n),'تبدأ range من 0 ولا تشمل حد النهاية. نجمع قيم i ثم نطبع بعد انتهاء الحلقة.'));
  bank.push(q('function-'+n,'hard','الدوال والقيم المعادة',`def double(x):\n    return x * 2\nprint(double(${n}) + 1)`,String(n*2+1),String(n%2?n*2:n*2+1),'return تعيد القيمة إلى موضع استدعاء الدالة. نضاعف العدد داخل الدالة، ثم نضيف 1 خارجها.'));
  bank.push(q('list-'+n,'hard','القوائم والفهرسة',`values = [${n}, ${n+2}, ${n+4}]\nvalues[1] = values[0] + 1\nprint(values[1])`,String(n+1),String(n%2?n+1:n+2),'يبدأ الفهرس من 0. values[1] هو العنصر الثاني، وقد استبدلناه بقيمة العنصر الأول زائد 1.'));
 }
 return bank;
})();
