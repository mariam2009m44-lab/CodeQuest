# Existing-game learning verification

## Scope

No new game is added. Existing speed, code-order and image puzzles gain short programming tasks. Browser checks use authentication/Firestore fixtures, not a real learner account. They do not prove cloud persistence, production Cody replies, or phone hardware performance.

## Learning sources

- Python values, strings and lists: https://docs.python.org/3/tutorial/introduction.html
- Python conditions, range, functions and return: https://docs.python.org/3/tutorial/controlflow.html
- Python list behavior: https://docs.python.org/3/tutorial/datastructures.html
- JavaScript loops: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration
- JavaScript functions: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions
- Block-scoped, reassignable let: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let
- C++ virtual dispatch: https://en.cppreference.com/w/cpp/language/virtual.html
- RGB color channels: https://developer.mozilla.org/en-US/docs/Glossary/RGB
- Python applications: https://www.python.org/about/

## Reproducible checks

From repository root:

```
node tests/content/learning-integrity.cjs
node tests/content/speed-learning.cjs
node scripts/validate-js-syntax.mjs
python3 scripts/validate-local-links.py
cd tests/browser
node --test games3d.test.cjs
node --test puzzles.test.cjs
node --test editors.test.cjs languages.test.cjs progress.test.cjs
```

The content tests execute 24 Python speed snippets and all four JavaScript code-order solutions and compare their exact output. The page labels code-order output as expected, not live execution. The browser checks exercise correct/wrong answers, rapid-repeat protection, all speed levels, an actual image tap-placement win, answer retries, and local persistence.

## Child-friendly replay

- Six questions per speed round, with a visible end/review choice.
- Untimed learning selected by default. Optional thinking timer pauses during explanations.
- Manual Continue preserves reading time; no automatic advance past the lesson.
- Speed unlock requires at least four correct answers out of six.
- Wrong answers explain the idea without punishment or streak-loss messaging.
- Replay selects unseen variants first, but there are only eight questions per level. It is not an unlimited adaptive curriculum.
- Image puzzle completion is not treated as programming mastery. A separate contextual check records only local completion.
- New code-order practices never request account XP or currency. The original Hello World server-verified reward route is unchanged.
- No leaderboard competition, purchase, ad, streak pressure, or endless auto-next is added.

## Images

The eight programming pictures are original local SVG concept diagrams. They use shapes and text, with no third-party image downloads. Each is under 12 KB. The gallery combines these with six existing technology pictures and local custom upload. Uploaded photos stay local.

## Account isolation limits

The separate account-sync implementation covers stars for memory, quiz, speed, bug and build only. Image-puzzle records, code-order practice completions, and aggregate device score are still device-local. Do not describe those as account-owned cloud achievements.
