import json,re
b=json.load(open('/tmp/cq/learning-studio/lesson-tests.json'))
def tok(s): return set(x for x in re.sub(r'[^\w]+',' ',s.lower()).split(' ') if len(x)>1)
def jac(a,b):
    A,B=tok(a),tok(b);i=len(A&B);return i/max(1,len(A)+len(B)-i)
all=[(k,i,it['q']+' '+it.get('code',''),' '.join(it['options'])) for k,v in b.items() for i,it in enumerate(v)]
for x in range(len(all)):
    for y in range(x+1,len(all)):
        if all[x][3]==all[y][3] and jac(all[x][2],all[y][2])>=0.9: print('DUP',all[x][:2],all[y][:2])
