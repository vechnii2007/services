# Service Portal Backend

## Настройка окружения

Создайте файл `.env` в корневой директории backend и добавьте следующие переменные:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/service-portal
JWT_SECRET=your-jwt-secret-key
FRONTEND_URL=http://localhost:3000
WEB_PUSH_CONTACT=mailto:your-email@example.com
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

## Установка

1. Установите зависимости:

```bash
npm install
```

2. Запустите сервер:

```bash
npm start
```

## API Endpoints

### Сообщения

- `GET /api/messages/:userId` - Получение истории сообщений с пользователем
- `GET /api/messages/request/:requestId` - Получение истории сообщений по запросу
- `PUT /api/messages/:userId/read` - Отметка сообщений как прочитанных
- `POST /api/messages` - Отправка сообщения

### Уведомления

- `GET /api/notifications` - Получение уведомлений пользователя
- `GET /api/notifications/unread/count` - Получение количества непрочитанных уведомлений
- `PUT /api/notifications/:id/read` - Отметка уведомления как прочитанного
- `PUT /api/notifications/read/all` - Отметка всех уведомлений как прочитанных
- `POST /api/notifications/subscribe` - Подписка на push-уведомления
- `POST /api/notifications/unsubscribe` - Отписка от push-уведомлений
- `GET /api/notifications/vapid-public-key` - Получение VAPID публичного ключа

## WebSocket Events

### Клиент -> Сервер

- `joinRoom` - Присоединение к комнате чата
- `leaveRoom` - Выход из комнаты чата
- `private_message` - Отправка личного сообщения

### Сервер -> Клиент

- `private_message` - Получение личного сообщения
- `notification` - Получение уведомления
- `messages_read` - Уведомление о прочтении сообщений
- `error` - Получение ошибки

## Безопасность

- Все API endpoints защищены JWT аутентификацией
- WebSocket соединения также требуют JWT токен
- Push-уведомления используют VAPID для безопасной доставки

## Масштабирование

- Используются индексы в MongoDB для оптимизации запросов
- Реализована эффективная структура комнат для WebSocket
- Поддерживается отправка уведомлений через WebSocket и Push API
