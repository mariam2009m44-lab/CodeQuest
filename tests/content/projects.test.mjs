// Every project: reference solutions pass all tests, the empty starter fails them (real python3), starters do not contain the solution.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
const P = JSON.parse(fs.readFileSync(new URL("../../learning-studio/projects.json", import.meta.url), "utf8"));
const REF = JSON.parse(fs.readFileSync(new URL("./project-references.json", import.meta.url), "utf8"));
const norm = s => String(s).replace(/\r/g, "").split("\n").map(l => l.replace(/\s+$/, "")).join("\n").trim();
const run = code => { const r = spawnSync("python3", ["-c", code], { encoding: "utf8", timeout: 8000 }); return { ok: r.status === 0, out: r.stdout }; };
const full = (p, t, code) => (t.prelude ?? "") + code + (t.append ? "\n" + t.append : "");
test("projects.json shape: unique ids, python units, levels get less guidance, hidden tests exist", () => {
  const ids = new Set();
  for (const p of P) {
    assert.ok(!ids.has(p.id)); ids.add(p.id);
    assert.equal(p.language, "python");
    assert.ok(p.requirements.length >= 3 && p.hints.length >= 1 && p.tests.length >= 4);
    assert.ok(p.tests.some(t => t.visible) && p.tests.some(t => !t.visible), p.id + " needs visible and hidden tests");
    assert.ok(!("reference" in p), "no reference solution is shipped to the browser");
  }
  assert.ok(P[0].hints.length > P[1].hints.length && P[1].hints.length > P[2].hints.length, "guidance decreases");
  assert.ok(P[0].starter.length > P[2].starter.length);
});
test("reference solutions pass every test; the untouched starter does not", () => {
  for (const p of P) {
    for (const t of p.tests) {
      const r = run(full(p, t, REF[p.id]));
      assert.ok(r.ok && norm(r.out) === norm(t.expected), p.id + " reference " + JSON.stringify(t.expected) + " got " + JSON.stringify(r.out));
    }
    const failing = p.tests.filter(t => { const r = run(full(p, t, p.starter)); return !(r.ok && norm(r.out) === norm(t.expected)); });
    assert.equal(failing.length, p.tests.length, p.id + " starter must not pass any test");
  }
});
test("plausible wrong solutions are caught by the hidden tests", () => {
  const wrong = {
    "py-p1": "if fuel > 50:\n    print(\"Ready\")\nelif fuel > 20:\n    print(\"Low\")\nelse:\n    print(\"Refuel\")\n",
    "py-p2": "def report(items):\n    longest = max(items, key=len)\n    return \"items: \" + str(len(items)) + \", longest: \" + longest\n",
    "py-p3": "def add_points(scores, name, points):\n    scores[name] = points\n\ndef top_player(scores):\n    best = max(scores, key=scores.get)\n    return best + \": \" + str(scores[best])\n",
  };
  for (const p of P) {
    const failed = p.tests.some(t => { const r = run(full(p, t, wrong[p.id])); return !(r.ok && norm(r.out) === norm(t.expected)); });
    assert.ok(failed, p.id + " wrong solution must fail at least one test");
  }
});
