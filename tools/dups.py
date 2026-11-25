import json,re
b=json.load(open('/tmp/cq/learning-studio/lesson-tests.json'))
B={'public','class','main','static','void','string','args','system','out','println','include','iostream','std','cout','endl','int','return'}
def tok(s): return set(x for x in re.sub(r'[^\w]+',' ',s.lower()).split(' ') if len(x)>1 and x not in B)
def jac(a,b):
    A,B=tok(a),tok(b);i=len(A&B);return i/max(1,len(A)+len(B)-i)
all=[(k,i,it['q']+' '+it.get('code',''),' '.join(it['options'])) for k,v in b.items() for i,it in enumerate(v)]
for x in range(len(all)):
    for y in range(x+1,len(all)):
        if all[x][3]==all[y][3] and jac(all[x][2],all[y][2])>=0.9: print('DUP',all[x][:2],all[y][:2])
q=json.load(open('/tmp/cq/learning-studio/quizzes.json'));u=json.load(open('/tmp/cq/learning-studio/units.json'))
ex=[m['q']+' '+(m.get('code') or '') for v in q.values() for m in v['mcq']]
for k,i,t,o in all:
    for e in ex:
        if jac(t,e)>=0.8: print('EXAM',k,i,'|',t[:80].replace('\n','\\n'),'~',e[:80].replace('\n','\\n'))
pred={l['id']:next((s.get('question','') for s in l['steps'] if s['type']=='prediction'),None) for p in u for l in p['lessons']}
for k,i,t,o in all:
    if pred.get(k) and jac(b[k][i]['q'],pred[k])>=0.8: print('PRED',k,i)
