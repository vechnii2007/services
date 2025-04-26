// Версия сервис-воркера для кэширования
const CACHE_VERSION = "v1";
const CACHE_NAME = `uniserv-cache-${CACHE_VERSION}`;

// Список URL, которые будут кэшироваться для оффлайн-режима
const urlsToCache = ["/", "/index.html", "/manifest.json", "/favicon.ico"];

// Установка сервис-воркера и кэширование ресурсов
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Caching app shell");
        // Попытка кэшировать каждый файл отдельно, чтобы избежать ошибки при отсутствии некоторых файлов
        return Promise.all(
          urlsToCache.map((url) =>
            cache.add(url).catch((error) => {
              console.warn(`[ServiceWorker] Failed to cache: ${url}`, error);
              return Promise.resolve(); // Продолжаем несмотря на ошибку
            })
          )
        );
      })
      .then(() => {
        console.log("[ServiceWorker] Install completed");
        return self.skipWaiting();
      })
  );
});

// Активация сервис-воркера и очистка старых кэшей
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[ServiceWorker] Removing old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("[ServiceWorker] Activate completed");
        return self.clients.claim();
      })
  );
});

// Обработка fetch-запросов с использованием стратегии network-first
self.addEventListener("fetch", (event) => {
  // Пропускаем запросы к API без кэширования
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("/services/")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Проверяем, что ответ валидный
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Клонируем ответ, так как он может быть использован только один раз
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // При ошибке сети, пытаемся получить из кэша
        return caches.match(event.request);
      })
  );
});

// Обработка push-уведомлений
self.addEventListener("push", (event) => {
  console.log("[ServiceWorker] Push received:", event);

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: "Новое уведомление",
      message: event.data ? event.data.text() : "Получено уведомление",
    };
  }

  console.log("[ServiceWorker] Push data:", data);

  const title = data.title || "Новое уведомление";
  const options = {
    body: data.message,
    icon: "/logo192.png",
    badge: "/logo192.png",
    data: {
      url: data.url || "/notifications",
      notificationId: data.notificationId,
    },
    actions: [
      {
        action: "view",
        title: "Просмотреть",
      },
      {
        action: "close",
        title: "Закрыть",
      },
    ],
    // Показываем уведомление, даже если приложение открыто
    requireInteraction: true,
    // Вибрация для мобильных устройств
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Обработка клика по уведомлению
self.addEventListener("notificationclick", (event) => {
  console.log("[ServiceWorker] Notification click received:", event);

  event.notification.close();

  // Получаем данные из уведомления
  const url = event.notification.data?.url || "/notifications";
  const notificationId = event.notification.data?.notificationId;

  // Если клик был по кнопке "Закрыть", ничего не делаем
  if (event.action === "close") {
    return;
  }

  // Открываем окно с соответствующим URL
  event.waitUntil(
    clients
      .matchAll({ type: "window" })
      .then((clientList) => {
        // Если есть открытые окна, перенаправляем в одно из них
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) {
              client.navigate(url);
              return;
            } else {
              // Для старых браузеров
              client.postMessage({
                type: "NAVIGATE",
                url: url,
              });
              return;
            }
          }
        }

        // Если нет открытых окон, открываем новое
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
      .then(() => {
        // Если в данных уведомления есть ID, отмечаем его как прочитанное
        if (notificationId) {
          return fetch(`/api/services/notifications/${notificationId}/read`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${self.CACHED_TOKEN || ""}`,
            },
          });
        }
      })
  );
});

// Сохраняем токен в переменной сервис-воркера для использования в запросах
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_TOKEN") {
    self.CACHED_TOKEN = event.data.token;
    console.log("[ServiceWorker] Token updated");
  }
});
