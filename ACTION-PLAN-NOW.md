# ⚡ Felix Bot - План действий СЕЙЧАС

**Дата:** 02.03.2026  
**Приоритет:** 🔥 Критический  
**Время выполнения:** 6-8 часов

---

## 🎯 Цель

Интегрировать базу данных Supabase и систему прогресса обучения (Learning System) для перехода от in-memory хранилища к персистентному.

---

## 📋 Чек-лист задач

### Фаза 1: Настройка Supabase (1-1.5 часа)

#### 1.1 Создать проект Supabase
- [ ] Зайти на https://supabase.com
- [ ] Создать новый проект "felix-bot-v6"
- [ ] Выбрать регион (ближайший)
- [ ] Установить пароль БД
- [ ] Дождаться создания проекта

#### 1.2 Применить схему базы данных
- [ ] Открыть SQL Editor в Supabase
- [ ] Скопировать содержимое `database/v4-schema.sql`
- [ ] Выполнить SQL скрипт
- [ ] Проверить создание таблиц (10 таблиц)
- [ ] Проверить создание индексов

#### 1.3 Настроить Storage
- [ ] Создать bucket "voices" (audio files)
- [ ] Создать bucket "images" (image files)
- [ ] Создать bucket "documents" (document files)
- [ ] Создать bucket "exports" (export files)
- [ ] Настроить policies для каждого bucket

#### 1.4 Получить credentials
- [ ] Settings → API
- [ ] Скопировать Project URL
- [ ] Скопировать anon key
- [ ] Скопировать service_role key
- [ ] Скопировать Database URL (pooled)

---

### Фаза 2: Обновление конфигурации (0.5 часа)

#### 2.1 Обновить .env.local
```env
# Telegram
TELEGRAM_BOT_TOKEN=8623255560:AAE7sC-7-eWA5LD-ebATDUh6nGUG0pYm03U

# Groq
GROQ_API_KEY=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

# Supabase (ЗАПОЛНИТЬ)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Admin
ADMIN_ID=8264612178

# URLs
MINIAPP_URL=https://felix-black.vercel.app/miniapp/
LEARNING_API=https://felix-black.vercel.app/api/learning
```

#### 2.2 Обновить Vercel Environment Variables
- [ ] Открыть Vercel Dashboard
- [ ] Settings → Environment Variables
- [ ] Добавить все переменные из .env.local
- [ ] Сохранить

---

### Фаза 3: Интеграция БД в webhook.js (2-3 часа)

#### 3.1 Импортировать db модуль
```javascript
import { db } from '../lib/db.js';
```

#### 3.2 Заменить Map на DB - Пользователи
```javascript
// Было:
function getUser(id) {
    if (!users.has(id)) {
        users.set(id, { id, msgs: 0, ... });
    }
    return users.get(id);
}

// Стало:
async function getUser(telegramUser) {
    return await db.getOrCreateUser(telegramUser);
}
```

#### 3.3 Заменить Map на DB - Сообщения
```javascript
// После получения AI ответа
await db.saveMessage(
    userId,
    'user',
    text,
    'text',
    {}
);

await db.saveMessage(
    userId,
    'assistant',
    aiResponse.content,
    'text',
    {
        tokens: aiResponse.tokens,
        latency: aiResponse.latency,
        model: aiResponse.model
    }
);
```


#### 3.4 Обновить команды для работы с БД
```javascript
// /profile
if (cmd === '/profile') {
    const stats = await db.getUserStats(userId, 'all');
    const settings = await db.getUserSettings(userId);
    
    let msg = `👤 <b>Ваш профиль</b>\n\n`;
    msg += `💬 Сообщений: ${stats.total_messages}\n`;
    msg += `📊 Токенов: ${stats.total_tokens}\n`;
    msg += `⚡ Среднее время ответа: ${stats.avg_response_time}ms\n`;
    
    await send(chatId, msg);
}

// /stats
if (cmd === '/stats') {
    const stats = await db.getUserStats(userId, 'week');
    // Показать статистику за неделю
}
```

---

### Фаза 4: Интеграция Learning System (2-3 часа)

#### 4.1 Добавить вызовы Learning API в webhook.js
```javascript
// После каждого сообщения
async function updateLearningProgress(userId, type, value = null) {
    try {
        const response = await fetch(LEARNING_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'updateActivity',
                userId,
                data: { type, value }
            })
        });
        
        const data = await response.json();
        
        // Если есть новые достижения - уведомить
        if (data.success && data.newAchievements && data.newAchievements.length > 0) {
            for (const achievement of data.newAchievements) {
                await send(userId, `🎉 <b>Новое достижение!</b>\n\n${achievement.icon} <b>${achievement.name}</b>\n${achievement.description}\n\n+${achievement.xp} XP`);
            }
        }
        
        return data;
    } catch (e) {
        console.error('Learning update error:', e);
    }
}

// В обработчике сообщений
analyze(userId, text);
await updateLearningProgress(userId, 'message'); // ДОБАВИТЬ

// В обработчике команд
user.cmds.set(cmd, (user.cmds.get(cmd) || 0) + 1);
await updateLearningProgress(userId, 'command'); // ДОБАВИТЬ
```

#### 4.2 Добавить новые команды
```javascript
// /level - показать уровень и XP
if (cmd === '/level') {
    const response = await fetch(`${LEARNING_API}?action=getUserProgress&userId=${userId}`);
    const data = await response.json();
    
    if (data.success) {
        const p = data.progress;
        let msg = `${p.levelIcon} <b>Уровень ${p.level}: ${p.levelName}</b>\n\n`;
        msg += `✨ XP: ${p.xp} / ${p.nextLevelXP}\n`;
        msg += `📈 До следующего уровня: ${p.xpToNextLevel} XP\n`;
        msg += `🏆 Достижений: ${p.achievementsCount} / ${p.totalAchievements}\n`;
        
        await send(chatId, msg);
    }
}

// /achievements - показать достижения
if (cmd === '/achievements') {
    const response = await fetch(`${LEARNING_API}?action=getAchievements&userId=${userId}`);
    const data = await response.json();
    
    if (data.success) {
        let msg = `🏆 <b>Достижения</b>\n\n`;
        msg += `Получено: ${data.unlockedCount} / ${data.totalCount}\n\n`;
        
        data.achievements.forEach(a => {
            const status = a.unlocked ? '✅' : '⬜';
            msg += `${status} ${a.icon} <b>${a.name}</b>\n`;
            msg += `   ${a.description} (+${a.xp} XP)\n\n`;
        });
        
        await send(chatId, msg);
    }
}

// /tasks - показать ежедневные задания
if (cmd === '/tasks') {
    const response = await fetch(`${LEARNING_API}?action=getDailyTasks&userId=${userId}`);
    const data = await response.json();
    
    if (data.success) {
        let msg = `📋 <b>Ежедневные задания</b>\n\n`;
        msg += `Выполнено: ${data.completedCount} / ${data.totalCount}\n\n`;
        
        data.tasks.forEach(t => {
            const status = t.completed ? '✅' : '⏳';
            const progress = `${t.progress}/${t.target}`;
            msg += `${status} <b>${t.name}</b>\n`;
            msg += `   Прогресс: ${progress} (+${t.xp} XP)\n\n`;
        });
        
        await send(chatId, msg);
    }
}
```

---

### Фаза 5: Тестирование (1 час)

#### 5.1 Тестирование базы данных
- [ ] Отправить /start - проверить создание пользователя
- [ ] Отправить сообщение - проверить сохранение
- [ ] Отправить команду - проверить сохранение
- [ ] Проверить в Supabase Table Editor

#### 5.2 Тестирование Learning System
- [ ] Отправить 10 сообщений - проверить начисление XP
- [ ] Использовать команду - проверить начисление XP
- [ ] Проверить /level - должен показать уровень
- [ ] Проверить /achievements - должен показать достижения
- [ ] Проверить /tasks - должен показать задания

#### 5.3 Тестирование уведомлений
- [ ] Получить первое достижение - проверить уведомление
- [ ] Повысить уровень - проверить уведомление
- [ ] Выполнить задание - проверить уведомление

---

### Фаза 6: Деплой (0.5 часа)

#### 6.1 Коммит изменений
```bash
git add .
git commit -m "feat: integrate Supabase DB and Learning System

- Add Supabase PostgreSQL integration
- Replace in-memory Map with persistent DB
- Integrate Learning System API
- Add new commands: /level, /achievements, /tasks
- Add achievement and level-up notifications
- Update environment variables"
```

#### 6.2 Push и деплой
```bash
git push origin main
```

#### 6.3 Проверить деплой
- [ ] Открыть Vercel Dashboard
- [ ] Проверить статус деплоя
- [ ] Проверить логи
- [ ] Протестировать бота

---

## 🎯 Ожидаемый результат

После выполнения всех задач:

✅ База данных Supabase настроена и работает  
✅ Все данные сохраняются персистентно  
✅ Система прогресса обучения интегрирована  
✅ Пользователи получают XP за действия  
✅ Работают достижения и уведомления  
✅ Новые команды: /level, /achievements, /tasks  
✅ Данные не теряются при перезапуске  

---

## 📊 Метрики успеха

- Uptime: 99.9%
- Response time: <500ms
- Database queries: <100ms
- Error rate: <0.1%
- User satisfaction: 90%+

---

## 🚨 Возможные проблемы и решения

### Проблема 1: Supabase connection timeout
**Решение:** Использовать pooled connection string, увеличить timeout

### Проблема 2: Rate limiting на Supabase
**Решение:** Использовать кэширование, оптимизировать запросы

### Проблема 3: Медленные запросы
**Решение:** Добавить индексы, использовать materialized views

### Проблема 4: Ошибки при миграции
**Решение:** Создать backup, тестировать на staging

---

## 📚 Полезные ссылки

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

**Начать сейчас?** Да! 🚀

**Следующий шаг:** Создать проект Supabase
