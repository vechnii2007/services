// Версия сервис-воркера для кэширования
const CACHE_VERSION = "v1";
const CACHE_NAME = `uniserv-cache-${CACHE_VERSION}`;

// Список URL, которые будут кэшироваться для оффлайн-режима
const urlsToCache = ["/", "/index.html", "/manifest.json", "/favicon.ico"];

// TTL для кэша (5 минут)
const CACHE_TTL = 5 * 60 * 1000;

// Установка сервис-воркера и кэширование ресурсов
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          urlsToCache.map((url) =>
            cache.add(url).catch(() => {
              return Promise.resolve(); // Продолжаем несмотря на ошибку
            })
          )
        );
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Активация сервис-воркера и очистка старых кэшей
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Обработка fetch-запросов с использованием стратегии network-first
self.addEventListener("fetch", (event) => {
  // Не кэшируем API, сервисы и категории
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("/services/") ||
    event.request.url.includes("/categories")
  ) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) {
        // Проверяем TTL
        const cachedTime = await cache.match(event.request.url + ":ts");
        const now = Date.now();
        if (cachedTime) {
          const ts = await cachedTime.text();
          if (now - Number(ts) < CACHE_TTL) {
            return cached;
          } else {
            // Устарело — удаляем
            await cache.delete(event.request);
            await cache.delete(event.request.url + ":ts");
          }
        } else {
          // Нет метки времени — считаем устаревшим
          await cache.delete(event.request);
        }
      }
      // Нет валидного кэша — идём в сеть
      const response = await fetch(event.request);
      if (response && response.status === 200 && response.type === "basic") {
        cache.put(event.request, response.clone());
        cache.put(
          event.request.url + ":ts",
          new Response(Date.now().toString())
        );
      }
      return response;
    })
  );
});

// Обработка push-уведомлений
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: "Новое уведомление",
      message: event.data ? event.data.text() : "Получено уведомление",
    };
  }

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
  }
});

// Обработка команды CLEAR_CACHE
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }
});
