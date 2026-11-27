import { test } from "node:test";
import assert from "node:assert/strict";
import { parentErrorText } from "../../js/parent-api.js";
test("specific parent-link messages; generic fallbacks unchanged", () => {
  assert.match(parentErrorText({ status: 400, data: { message: "self_link" } }), /نفس الحساب/);
  assert.match(parentErrorText({ status: 429, data: { message: "too_many_active_codes" } }), /3 رموز/);
  assert.match(parentErrorText({ status: 429, data: { message: "too_many_attempts" } }), /ساعة/);
  assert.match(parentErrorText({ status: 404, data: { message: "code_expired" } }), /انتهت صلاحية/); assert.match(parentErrorText({ status: 404, data: { message: "code_used" } }), /استُخدم من قبل/); assert.match(parentErrorText({ status: 404, data: { message: "code_invalid" } }), /غير صحيح/);
  assert.match(parentErrorText({ off: true, status: 503, data: {} }), /غير مفعّلة/);
});
