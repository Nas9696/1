const CACHE_NAME = 'marriage-association-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// تثبيت Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('تم فتح التخزين المؤقت');
        return cache.addAll(urlsToCache);
      })
  );
});

// استرجاع الملفات من التخزين المؤقت
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // إرجاع الملف من التخزين المؤقت إذا وُجد
        if (response) {
          return response;
        }
        
        // إذا لم يوجد في التخزين المؤقت، جلبه من الشبكة
        return fetch(event.request).then(
          function(response) {
            // التحقق من صحة الاستجابة
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // نسخ الاستجابة
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

// تحديث Service Worker
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف التخزين المؤقت القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// معالجة رسائل من التطبيق الرئيسي
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// إشعارات Push (اختيارية)
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'رسالة جديدة من تطبيق جمعية الزواج',
    icon: '/manifest.json',
    badge: '/manifest.json',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'عرض التفاصيل',
        icon: '/manifest.json'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: '/manifest.json'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('تطبيق جمعية الزواج', options)
  );
});

// معالجة النقر على الإشعارات
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'explore') {
    // فتح التطبيق
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // إغلاق الإشعار فقط
    event.notification.close();
  } else {
    // النقر على الإشعار نفسه
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});