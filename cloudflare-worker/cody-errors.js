// Provider metadata only. Never include prompts, API keys or upstream error text in responses.
export function describeGeminiFailure(status) {
  if (status === 400) return { errorCode: 'CODY_PROVIDER_REQUEST_INVALID', message: 'تعذّر إرسال السؤال بسبب إعداد طلب كودي على الخادم. المشكلة ليست في صياغة سؤالك، وتحتاج مراجعة إعدادات الخدمة.' };
  if (status === 404) return { errorCode: 'CODY_MODEL_UNAVAILABLE', message: 'نموذج كودي المحدد غير متاح لهذا المشروع. تحتاج إدارة المنصة إلى مراجعة إعداد النموذج.' };
  if (status === 402) return { errorCode: 'CODY_PROVIDER_BILLING_REQUIRED', message: 'خدمة كودي متوقفة بسبب حالة حساب مزوّد الذكاء الاصطناعي. تحتاج إدارة المنصة إلى مراجعتها.' };
  if ([408, 500, 502, 503, 504].includes(status)) return { errorCode: 'CODY_PROVIDER_TEMPORARY', message: 'مزوّد كودي غير متاح مؤقتًا رغم إعادة المحاولة. احتفظنا بسؤالك؛ يمكنك المحاولة لاحقًا.' };
  return { errorCode: 'CODY_PROVIDER_REJECTED', message: 'مزوّد كودي رفض الطلب. تحتاج إدارة المنصة إلى مراجعة رمز التشخيص، وليس إعادة تسجيل دخولك.' };
}
