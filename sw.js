const CACHE_NAME = 'codequest-v1';
const ASSETS = [
    'index.html', 'login.html', 'dashboard.html', 'lessons.html', 
    'css/global.css', 'js/app.js', 'js/ui.js',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});