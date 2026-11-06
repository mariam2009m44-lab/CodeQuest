const CACHE_NAME = "cody-academy-v5";
const START_URL = "./index.html";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.add(START_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name.startsWith("cody-academy-") && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // لا تخزني استجابات Firebase أو الخدمات الخارجية.
  if (url.origin !== self.location.origin) return;

  // التنقل بين الصفحات: جرّبي الشبكة ثم النسخة المخزنة.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            event.waitUntil(
              caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {})
            );
          }

          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);

          if (cachedPage) return cachedPage;

          const startPage = await caches.match(START_URL);

          if (startPage) return startPage;

          return new Response(
            "لا يوجد اتصال بالإنترنت. حاولي مرة أخرى عند عودة الاتصال.",
            {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=utf-8"
              }
            }
          );
        })
    );

    return;
  }

  // الملفات الثابتة: استخدمي النسخة المخزنة إن وجدت،
  // وحدّثيها من الشبكة في الخلفية.
  event.respondWith(
    caches.match(request).then(cached => {
      const networkRequest = fetch(request).then(response => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();

          event.waitUntil(
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {})
          );
        }

        return response;
      });

      if (cached) {
        event.waitUntil(networkRequest.catch(() => {}));
        return cached;
      }
      return networkRequest.catch(() => new Response("Offline", { status: 503 }));
    })
  );
});