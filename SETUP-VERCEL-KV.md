# 🗄️ Настройка Vercel KV для Felix Bot

**Дата:** 02.03.2026  
**Время:** 5-10 минут  
**Статус:** Опционально (работает без KV)

---

## 📋 Что такое Vercel KV?

Vercel KV - это Redis-совместимое хранилище от Vercel для персистентных данных.

### Преимущества:
- ✅ Быстрое (Redis)
- ✅ Персистентное (данные не теряются)
- ✅ Бесплатный tier (30 000 команд/день)
- ✅ Автоматическая интеграция с Vercel
- ✅ Нет настройки - работает из коробки

### Без KV:
- ⚠️ Данные в памяти (теряются при перезапуске)
- ⚠️ Каждый instance имеет свои данные
- ✅ Работает сразу (fallback)

---

## 🚀 Быстрая настройка (5 минут)

### Шаг 1: Открыть Vercel Dashboard

1. Перейти на https://vercel.com/dashboard
2. Выбрать проект Felix Bot
3. Перейти в Storage

### Шаг 2: Создать KV Database

1. Нажать "Create Database"
2. Выбрать "KV (Redis)"
3. Название: `felix-bot-kv`
4. Region: выбрать ближайший
5. Нажать "Create"

### Шаг 3: Подключить к проекту

1. После создания нажать "Connect to Project"
2. Выбрать проект Felix Bot
3. Нажать "Connect"
4. Vercel автоматически добавит environment variables:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### Шаг 4: Redeploy

1. Vercel автоматически предложит redeploy
2. Нажать "Redeploy"
3. Дождаться завершения (1-2 минуты)

### Шаг 5: Проверить

1. Открыть бота в Telegram
2. Отправить `/start`
3. Отправить несколько сообщений
4. Проверить логи в Vercel - должно быть:
   ```
   ✅ Vercel KV storage initialized
   ```

---

## 📊 Что хранится в KV?

### User Data
```javascript
Key: user:{userId}
Value: {
  id: 123456789,
  msgs: 42,
  cmds: { '/ask': 5, '/help': 2 },
  style: 'casual',
  topics: { 'ai': 10, 'coding': 5 },
  score: 42,
  created: 1709395200000
}
```

### Learning Progress
```javascript
Key: learning:{userId}
Value: {
  userId: 123456789,
  xp: 250,
  level: 2,
  achievements: ['first_steps', 'chatterbox'],
  streak: 5,
  lastActive: 1709395200000
}
```

### Messages (last 100)
```javascript
Key: messages:{userId}
Value: [
  {
    role: 'user',
    content: 'Привет!',
    type: 'text',
    timestamp: 1709395200000
  },
  {
    role: 'assistant',
    content: 'Привет! Как дела?',
    type: 'text',
    timestamp: 1709395201000
  }
]
```

### Group Data
```javascript
Key: group:{groupId}
Value: {
  id: -1001234567890,
  msgs: 1000,
  users: [123, 456, 789],
  top: { '123': 500, '456': 300 },
  created: 1709395200000
}
```

### Stats
```javascript
Key: stat:total_messages
Value: 10000

Key: stat:total_users
Value: 500
```

---

## 🔍 Мониторинг

### Vercel Dashboard

1. Storage → KV Database
2. Metrics:
   - Commands per day
   - Storage used
   - Response time

### Логи

```javascript
// В коде уже добавлено
console.log(`Storage: ${simpleStorage.isKVAvailable() ? 'Vercel KV (Redis)' : 'In-Memory (fallback)'}`);
```

---

## 💰 Pricing

### Free Tier (Hobby)
- ✅ 30,000 commands/day
- ✅ 256 MB storage
- ✅ Достаточно для ~1000 активных пользователей

### Pro Tier ($20/month)
- ✅ 500,000 commands/day
- ✅ 1 GB storage
- ✅ Достаточно для ~10,000 активных пользователей

### Расчет для Felix Bot

Средний пользователь:
- 50 сообщений/день
- 2 команды на сообщение (get + set)
- = 100 commands/день

Free tier: 30,000 / 100 = 300 активных пользователей/день

---

## 🔧 Troubleshooting

### Проблема: KV не инициализируется

**Решение:**
1. Проверить что KV database создана
2. Проверить что подключена к проекту
3. Проверить environment variables в Vercel
4. Redeploy проекта

### Проблема: Данные не сохраняются

**Решение:**
1. Проверить логи - должно быть "Vercel KV storage initialized"
2. Если "In-Memory fallback" - KV не настроен
3. Проверить что `@vercel/kv` установлен в package.json

### Проблема: Rate limit exceeded

**Решение:**
1. Проверить Metrics в Vercel Dashboard
2. Оптимизировать количество запросов
3. Добавить кэширование
4. Upgrade на Pro tier

---

## 🎯 Альтернативы

### Если не хотите использовать KV:

#### 1. Supabase (PostgreSQL)
- ✅ Бесплатный tier
- ✅ Полноценная БД
- ✅ SQL queries
- ⚠️ Требует настройки

См. `database/SETUP-SUPABASE.md`

#### 2. In-Memory (текущий fallback)
- ✅ Работает сразу
- ✅ Быстро
- ⚠️ Данные теряются при перезапуске
- ⚠️ Каждый instance свои данные

#### 3. Upstash Redis
- ✅ Бесплатный tier
- ✅ Redis-совместимый
- ✅ REST API
- ⚠️ Требует регистрации

---

## 📚 API Reference

### simpleStorage

```javascript
// User
await simpleStorage.getUser(userId)
await simpleStorage.setUser(userId, userData)
await simpleStorage.updateUser(userId, updates)

// Learning
await simpleStorage.getLearningProgress(userId)
await simpleStorage.setLearningProgress(userId, progress)

// Messages
await simpleStorage.addMessage(userId, message)
await simpleStorage.getMessages(userId, limit)

// Group
await simpleStorage.getGroup(groupId)
await simpleStorage.setGroup(groupId, groupData)
await simpleStorage.updateGroup(groupId, updates)

// Stats
await simpleStorage.incrementStat(key, amount)
await simpleStorage.getStat(key)

// Utility
simpleStorage.isKVAvailable()
await simpleStorage.getAllUsers()
```

---

## ✅ Готово!

После настройки KV:
- ✅ Данные сохраняются между перезапусками
- ✅ Все instances используют одни данные
- ✅ Быстрый доступ (Redis)
- ✅ Автоматическое масштабирование

**Без KV:**
- ✅ Бот работает (fallback на in-memory)
- ⚠️ Данные теряются при перезапуске

---

**Создано:** 02.03.2026  
**Версия:** 6.0.0  
**Рекомендация:** Настроить KV для production
