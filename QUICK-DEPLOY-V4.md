# ⚡ Felix Bot v4.0 - Быстрый деплой (5 минут)

## Шаг 1: Supabase (2 минуты)

1. Откройте https://supabase.com
2. Создайте проект: **felix-bot-v4**
3. SQL Editor → вставьте содержимое `database/v4-schema.sql` → Run
4. Storage → создайте buckets:
   - `voices` (20MB)
   - `images` (20MB)
   - `documents` (50MB)
   - `exports` (100MB)
5. Settings → API → скопируйте:
   - Database URL
   - Project URL
   - Anon Key
   - Service Role Key

## Шаг 2: Vercel (1 минута)

Добавьте Environment Variables:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
TELEGRAM_BOT_TOKEN=8623255560:AAE7sC-7-eWA5LD-ebATDUh6nGUG0pYm03U
GROQ_API_KEY=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
```

## Шаг 3: Deploy (1 минута)

```bash
# GitHub Desktop:
1. Commit: "Deploy Felix Bot v4.0"
2. Push to origin
3. Vercel автоматически задеплоит
```

## Шаг 4: Тест (1 минута)

В Telegram боте:
```
/start
Привет!
🎤 [голосовое]
/summary
/analyze текст
/generate идея
```

## Готово! 🎉

Все работает:
- ✅ База данных
- ✅ Голосовые сообщения
- ✅ AI команды
- ✅ Автотеги
- ✅ История
- ✅ Поиск
- ✅ Экспорт

**Подробная инструкция:** DEPLOY-V4.md
