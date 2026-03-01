# Felix Bot v4.0 - Deployment Guide

## Что нового в v4.0

✅ **Реализовано:**
- PostgreSQL база данных через Supabase
- Полная история сообщений с тегами
- Голосовые сообщения с хранением в Supabase Storage
- Команды: /summary, /analyze, /generate
- API endpoints: history, stats, search, export, settings
- Автоматическая генерация тегов
- Мультиязычность (русский/английский)
- Настройки AI (temperature, model)

## Шаг 1: Настройка Supabase

### 1.1 Создание проекта
1. Перейдите на https://supabase.com
2. Создайте новый проект: **felix-bot-v4-production**
3. Выберите регион (ближайший к пользователям)
4. Сохраните пароль БД

### 1.2 Применение схемы
1. Откройте SQL Editor в Supabase Dashboard
2. Скопируйте содержимое `database/v4-schema.sql`
3. Выполните SQL скрипт
4. Проверьте что все таблицы созданы:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 1.3 Создание Storage Buckets
Создайте следующие buckets в разделе Storage:

1. **voices** (audio/ogg, 20MB limit)
2. **images** (image/*, 20MB limit)
3. **documents** (application/pdf, application/vnd.*, 50MB limit)
4. **exports** (text/plain, application/json, application/pdf, 100MB limit)

Для каждого bucket установите:
- Public: false
- File size limit: как указано выше

### 1.4 Получение credentials
Перейдите в Settings → API и скопируйте:
- Project URL
- API Key (anon, public)
- API Key (service_role, secret)
- Database URL (Connection string → URI)

## Шаг 2: Настройка Vercel

### 2.1 Установка зависимостей
```bash
npm install
```

Новые зависимости в v4.0:
- `@supabase/supabase-js` - Supabase клиент
- `pg` - PostgreSQL драйвер (уже был)
- `groq-sdk` - Groq API (уже был)

### 2.2 Environment Variables
Добавьте в Vercel следующие переменные:

```bash
# Telegram
TELEGRAM_BOT_TOKEN=8623255560:AAE7sC-7-eWA5LD-ebATDUh6nGUG0pYm03U

# Groq API
GROQ_API_KEY=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

# Supabase (НОВОЕ)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
```

## Шаг 3: Deployment

### 3.1 Через GitHub Desktop
1. Откройте GitHub Desktop
2. Commit changes: "Deploy Felix Bot v4.0"
3. Push to origin
4. Vercel автоматически задеплоит

### 3.2 Проверка deployment
1. Откройте Vercel Dashboard
2. Дождитесь завершения deployment
3. Проверьте логи на ошибки

## Шаг 4: Тестирование

### 4.1 Проверка webhook
```bash
curl https://felix-black.vercel.app/api/webhook
# Должно вернуть: Felix Bot v4.0 - Working! 🤖
```

### 4.2 Проверка базы данных
Отправьте боту сообщение в Telegram, затем проверьте в Supabase:
```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;
```

### 4.3 Тестирование функций
В Telegram боте:
1. `/start` - проверка приветствия
2. Отправьте текстовое сообщение - проверка AI ответа
3. Отправьте голосовое - проверка транскрипции
4. `/organize текст` - проверка организации
5. `/summary` - проверка саммари (нужно минимум 5 сообщений)
6. `/analyze текст` - проверка анализа
7. `/generate идея` - проверка генерации

### 4.4 Проверка Mini App
1. Откройте Mini App через кнопку в боте
2. Проверьте что история загружается
3. Проверьте поиск
4. Проверьте статистику

## Шаг 5: Мониторинг

### 5.1 Vercel Logs
Следите за логами в Vercel Dashboard:
- Functions → webhook.js → Logs
- Проверяйте на ошибки

### 5.2 Supabase Logs
Следите за запросами в Supabase:
- Logs → Postgres Logs
- Проверяйте медленные запросы

### 5.3 Groq API Usage
Следите за использованием API:
- https://console.groq.com
- Проверяйте лимиты токенов

## Troubleshooting

### Ошибка подключения к БД
```
Error: connect ETIMEDOUT
```
**Решение:**
- Проверьте DATABASE_URL
- Убедитесь что SSL включен в коде: `ssl: { rejectUnauthorized: false }`
- Проверьте что Vercel IP не заблокирован в Supabase

### Ошибка Storage
```
Error: Storage upload error
```
**Решение:**
- Проверьте что buckets созданы
- Проверьте SUPABASE_SERVICE_KEY
- Проверьте file size limits

### Голосовые не распознаются
```
Error: Failed to transcribe
```
**Решение:**
- Проверьте GROQ_API_KEY
- Проверьте лимиты Groq API
- Проверьте формат файла (должен быть OGG)

### Теги не генерируются
**Решение:**
- Это нормально, теги генерируются асинхронно
- Проверьте логи на ошибки
- Теги появятся через несколько секунд

## Rollback Plan

Если что-то пошло не так:

### Откат на v3.1
1. В Vercel Dashboard → Deployments
2. Найдите последний рабочий deployment v3.1
3. Нажмите "..." → "Promote to Production"

### Откат базы данных
1. Supabase не поддерживает автоматический rollback
2. Используйте backup если создавали
3. Или пересоздайте проект

## Performance Optimization

### Индексы
Проверьте что все индексы созданы:
```sql
SELECT indexname FROM pg_indexes WHERE schemaname = 'public';
```

### Materialized View
Обновляйте статистику периодически:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
```

### Connection Pooling
Текущие настройки:
- max: 20 connections
- idleTimeoutMillis: 30000
- connectionTimeoutMillis: 10000

## Next Steps

После успешного deployment v4.0:

1. **Мониторинг** - следите за метриками первые 24 часа
2. **Feedback** - собирайте отзывы пользователей
3. **Optimization** - оптимизируйте медленные запросы
4. **P2 Features** - планируйте следующие функции:
   - Image Recognition
   - Document Processing
   - Google Drive Integration
   - Notion Integration

## Support

При возникновении проблем:
1. Проверьте логи в Vercel
2. Проверьте логи в Supabase
3. Проверьте environment variables
4. Проверьте что все сервисы доступны

## Готово!

Felix Bot v4.0 успешно задеплоен и готов к использованию! 🎉

Основные улучшения:
- ✅ Persistent storage (PostgreSQL)
- ✅ Voice message history
- ✅ Advanced AI commands
- ✅ Auto-tagging
- ✅ Search functionality
- ✅ Export capabilities
- ✅ Multilingual support
- ✅ User settings

Наслаждайтесь новыми возможностями!
