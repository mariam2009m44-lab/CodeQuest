import json,sys
b=json.load(open('/tmp/cq/learning-studio/lesson-tests.json'))
for f in sys.argv[1:]:
    b.update(json.load(open(f)))
open('/tmp/cq/learning-studio/lesson-tests.json','w').write(json.dumps(b,ensure_ascii=False,indent=1)+'\n')
print(len(b))
