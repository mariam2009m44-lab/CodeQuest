import json,subprocess,os,sys,tempfile,re
J=' ثم '
def C(code,d1,d2,why): return ('C',code,d1,d2,why)
def Q(q,r,w1,w2,why): return ('Q',q,r,w1,w2,why)
def run(lang,code):
    if lang=='python': o=subprocess.run(['python3','-c',code],capture_output=True,text=True,timeout=5,input='')
    elif lang=='javascript': o=subprocess.run(['node','-e',code],capture_output=True,text=True,timeout=5)
    elif lang=='cpp':
        d=tempfile.mkdtemp();open(d+'/a.cpp','w').write(code)
        c=subprocess.run(['g++','-std=c++17','-o',d+'/a',d+'/a.cpp'],capture_output=True,text=True)
        assert c.returncode==0,c.stderr+code
        o=subprocess.run([d+'/a'],capture_output=True,text=True,timeout=5)
    else:
        d=tempfile.mkdtemp();open(d+'/Main.java','w').write(code)
        o=subprocess.run(['java',d+'/Main.java'],capture_output=True,text=True,timeout=30)
    assert o.returncode==0,o.stderr+code
    return o.stdout.rstrip('\n').replace('\n',J)
def build(lang,spec,bank,units):
    lid_lang={l['id']:p['language'] for p in units for l in p['lessons']}
    for lid,items in spec.items():
        if os.environ.get('ONLY') and lid not in os.environ['ONLY'].split(','): continue
        assert lid_lang[lid]==lang,lid
        assert len(items)==4,lid
        out=[]
        for i,it in enumerate(items):
            pos=(hash_(lid)+i)%3
            if it[0]=='C':
                _,code,d1,d2,why=it
                real=run(lang,code)
                ds=[x.replace('|',J) for x in (d1,d2)]
                if real in ds or ds[0]==ds[1]:
                    print('BAD',lid,i,repr(real),ds);continue
                opts=ds[:];opts.insert(pos,real)
                out.append({'q':'إيه اللي هيظهر على الشاشة؟','code':code,'run':lang,'options':opts,'answer':pos,'why':why})
            else:
                _,q,r,w1,w2,why=it
                opts=[w1,w2];opts.insert(pos,r)
                out.append({'q':q,'options':opts,'answer':pos,'why':why})
        [print('SHORTWHY',lid) for o in out if len(o['why'])<15]
        bank[lid]=out
def hash_(s): return sum(ord(c) for c in s)
