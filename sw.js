const CACHE_NAME = 'codequest-v2';
const ASSETS = [
    './index.html',
    './dashboard.html',
    './languages.html',
    './levels.html',
    './lecture.html',
    './playground.html',
    './css/variables.css',
    './css/global.css',
    './js/app.js',
    './js/ui.js',
    './js/lecture.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
