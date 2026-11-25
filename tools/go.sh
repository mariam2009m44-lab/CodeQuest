cd /tmp/cq/tools && for f in "$@"; do python3 $f.py | grep -E "^BAD|^Trace|^SHORT"; done
cd /tmp/cq && git checkout learning-studio/lesson-tests.json && python3 tools/merge.py $(for f in "$@"; do echo /tmp/${f}.json; done) >/dev/null; python3 tools/merge.py >/dev/null
node --test tests/learning-studio/lesson-tests.test.mjs 2>&1 | grep -E "^# (pass|fail)|error:"
