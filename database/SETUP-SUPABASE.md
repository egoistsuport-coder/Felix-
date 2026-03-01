# Настройка Supabase для Felix Bot v4.0

## Шаг 1: Создание проекта

1. Перейдите на https://supabase.com
2. Создайте новый проект: **felix-bot-v4**
3. Выберите регион (ближайший к пользователям)
4. Установите надежный пароль для БД

## Шаг 2: Применение схемы

1. Откройте SQL Editor в Supabase Dashboard
2. Скопируйте содержимое файла `database/v4-schema.sql`
3. Выполните SQL скрипт
4. Проверьте что все таблицы созданы

## Шаг 3: Настройка Storage

1. Перейдите в раздел Storage
2. Создайте следующие buckets:

### Bucket: voices
- **Name**: voices
- **Public**: false
- **File size limit**: 20MB
- **Allowed MIME types**: audio/ogg, audio/mpeg, audio/wav

### Bucket: images
- **Name**: images
- **Public**: false
- **File size limit**: 20MB
- **Allowed MIME types**: image/jpeg, image/png, image/webp

### Bucket: documents
- **Name**: documents
- **Public**: false
- **File size limit**: 50MB
- **Allowed MIME types**: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document

### Bucket: exports
- **Name**: exports
- **Public**: false
- **File size limit**: 100MB
- **Allowed MIME types**: text/plain, application/json, application/pdf

## Шаг 4: Настройка Storage Policies

Для каждого bucket создайте следующие policies:

### Policy: User can upload own files
```sql
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voices' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Policy: User can read own files
```sql
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
USING (bucket_id = 'voices' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Policy: User can delete own files
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'voices' AND auth.uid()::text = (storage.foldername(name))[1]);
```

Повторите для buckets: images, documents, exports

## Шаг 5: Получение credentials

1. Перейдите в Settings → API
2. Скопируйте следующие значения:

```
Project URL: https://[your-project].supabase.co
API Key (anon, public): eyJ...
API Key (service_role, secret): eyJ...
Database URL: postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

## Шаг 6: Настройка Environment Variables в Vercel

Добавьте в Vercel следующие переменные:

```bash
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
STORAGE_BUCKET=felix-bot-storage
```

## Шаг 7: Тестирование подключения

Выполните тестовый запрос в SQL Editor:

```sql
-- Проверка таблиц
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Проверка indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public';

-- Тест вставки пользователя
INSERT INTO users (id, username, first_name, language)
VALUES (123456789, 'testuser', 'Test', 'ru')
RETURNING *;

-- Тест вставки сообщения
INSERT INTO messages (user_id, role, content, message_type)
VALUES (123456789, 'user', 'Test message', 'text')
RETURNING *;

-- Очистка тестовых данных
DELETE FROM messages WHERE user_id = 123456789;
DELETE FROM users WHERE id = 123456789;
```

## Шаг 8: Настройка автоматического обновления статистики

Создайте Supabase Edge Function для периодического обновления:

```sql
-- Создать cron job для обновления статистики каждые 5 минут
SELECT cron.schedule(
  'refresh-user-stats',
  '*/5 * * * *',
  $$SELECT refresh_user_stats()$$
);
```

## Готово!

База данных настроена и готова к использованию. Можно переходить к разработке сервисов.

## Troubleshooting

### Ошибка подключения
- Проверьте что DATABASE_URL правильный
- Убедитесь что SSL включен: `ssl: { rejectUnauthorized: false }`
- Проверьте что IP адрес Vercel не заблокирован

### Ошибка Storage
- Проверьте что buckets созданы
- Убедитесь что policies настроены
- Проверьте MIME types

### Медленные запросы
- Проверьте что indexes созданы: `\di` в psql
- Обновите статистику: `ANALYZE messages;`
- Проверьте query plan: `EXPLAIN ANALYZE SELECT ...`
