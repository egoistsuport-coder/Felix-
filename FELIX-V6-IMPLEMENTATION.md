# 🚀 Felix Bot v6.0 - Реализация

## ✅ Что реализовано

### 1. API для системы обучения (`api/learning.js`)

#### Функции:
- **Система уровней** (8 уровней: от Новичка до Легенды)
- **Начисление XP** за различные действия
- **Достижения** (10 различных достижений)
- **Ежедневные задания** (3 задания каждый день)
- **Streak система** (отслеживание активности подряд)
- **Прогресс по курсам** (отслеживание пройденных уроков)
- **Рейтинг пользователей** (топ-10)
- **Аналитика активности** (графики за 7 дней)

#### Эндпоинты:
```
GET/POST /api/learning

Actions:
- getUserProgress - получить прогресс пользователя
- addXP - добавить XP
- updateActivity - обновить активность (сообщение/команда/урок)
- getAchievements - получить достижения
- getDailyTasks - получить ежедневные задания
- updateDailyTask - обновить прогресс задания
- getCourseProgress - получить прогресс по курсу
- updateCourseProgress - обновить прогресс по курсу
- getLeaderboard - получить рейтинг
- getAnalytics - получить аналитику
```

#### Система уровней:
```javascript
1. Новичок 🌱 (0-100 XP)
2. Ученик 📚 (100-300 XP)
3. Студент 🎓 (300-600 XP)
4. Продвинутый ⭐ (600-1000 XP)
5. Эксперт 💎 (1000-1500 XP)
6. Мастер 👑 (1500-2500 XP)
7. Гуру 🔥 (2500-5000 XP)
8. Легенда 🏆 (5000+ XP)
```

#### Начисление XP:
- +5 XP за сообщение
- +10 XP за AI команду
- +20 XP за урок
- +50 XP за завершение курса
- +10-1000 XP за достижения
- +10-25 XP за ежедневные задания

#### Достижения:
1. 👣 Первые шаги - 10 сообщений (+20 XP)
2. 💬 Болтун - 100 сообщений (+50 XP)
3. 🤖 AI Энтузиаст - 50 AI команд (+100 XP)
4. 🎓 Студент - 1 курс завершен (+150 XP)
5. 🏆 Мастер - все курсы завершены (+500 XP)
6. 🔥 Неделя подряд - 7 дней активности (+200 XP)
7. 💪 Месяц подряд - 30 дней активности (+1000 XP)
8. 🌅 Ранняя пташка - активность до 8 утра (+50 XP)
9. 🦉 Сова - активность после 23:00 (+50 XP)
10. 💯 Перфекционист - 100% в квизе (+100 XP)

#### Ежедневные задания:
1. Отправить 5 сообщений (+10 XP)
2. Использовать 3 AI команды (+15 XP)
3. Пройти 1 урок (+25 XP)

### 2. API для голосового управления (`api/voice.js`)

#### Функции:
- **Распознавание голосовых команд** (30+ команд)
- **Навигация** по вкладкам
- **Выполнение действий** (обновить, показать, начать)
- **AI команды** через голос
- **Интеллектуальное извлечение намерений**

#### Эндпоинты:
```
GET/POST /api/voice

Actions:
- processCommand - обработать голосовую команду
- getCommands - получить список доступных команд
```

#### Поддерживаемые команды:

**Навигация:**
- "Открыть профиль"
- "Открыть команды"
- "Открыть академию"
- "Открыть партнеров"
- "Открыть настройки"
- "Открыть обучение"
- "Открыть аналитику"
- "Открыть рейтинг"

**Действия:**
- "Обновить профиль"
- "Показать достижения"
- "Показать задания"
- "Начать курс"
- "Сохранить настройки"

**AI команды:**
- "Задать вопрос"
- "Краткое содержание"
- "Анализ текста"
- "Генерация"
- "Перевод"
- "Улучшить текст"
- "Генерация идей"
- "Объяснить"

**Помощь:**
- "Помощь"
- "Что ты умеешь"

## 📱 Интеграция в Mini App

### Шаг 1: Добавить Web Speech API

```javascript
// Проверка поддержки
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    console.error('Speech Recognition not supported');
}

// Создание экземпляра
const recognition = new SpeechRecognition();
recognition.lang = 'ru-RU';
recognition.continuous = false;
recognition.interimResults = false;

// Обработчики
recognition.onresult = async (event) => {
    const text = event.results[0][0].transcript;
    await processVoiceCommand(text);
};

recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
};
```

### Шаг 2: UI для голосового управления

```html
<!-- Плавающая кнопка микрофона -->
<button id="voiceBtn" class="voice-fab">
    <span id="voiceIcon">🎤</span>
</button>

<!-- Индикатор записи -->
<div id="voiceIndicator" class="voice-indicator">
    <div class="voice-wave"></div>
    <div class="voice-text">Слушаю...</div>
</div>
```

```css
.voice-fab {
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    font-size: 28px;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    transition: all 0.3s;
}

.voice-fab:hover {
    transform: scale(1.1);
}

.voice-fab.recording {
    background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
    animation: pulse 1s infinite;
}

.voice-indicator {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    padding: 30px;
    border-radius: 20px;
    display: none;
    z-index: 1001;
}

.voice-indicator.active {
    display: block;
    animation: fadeIn 0.3s;
}

.voice-wave {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    animation: wave 1.5s infinite;
}

@keyframes wave {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
}
```

### Шаг 3: Обработка команд

```javascript
async function processVoiceCommand(text) {
    try {
        const response = await fetch('https://felix-black.vercel.app/api/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'processCommand',
                text
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.recognized) {
            executeCommand(data.command);
        } else {
            tg.showAlert(data.message);
        }
    } catch (error) {
        console.error('Voice command error:', error);
    }
}

function executeCommand(command) {
    switch (command.action) {
        case 'navigate':
            switchTab(command.target);
            break;
        case 'refresh':
            if (command.target === 'profile') loadProfile(user.id);
            break;
        case 'show':
            if (command.target === 'achievements') showAchievements();
            if (command.target === 'daily_tasks') showDailyTasks();
            break;
        case 'ai_command':
            sendCommand(`/${command.command} `);
            break;
        case 'help':
            showVoiceHelp();
            break;
    }
}
```

### Шаг 4: Интеграция системы прогресса

```javascript
// Загрузка прогресса при старте
async function loadUserProgress() {
    try {
        const response = await fetch(`https://felix-black.vercel.app/api/learning?action=getUserProgress&userId=${user.id}`);
        const data = await response.json();
        
        if (data.success) {
            updateProgressUI(data.progress);
        }
    } catch (error) {
        console.error('Failed to load progress:', error);
    }
}

// Обновление UI прогресса
function updateProgressUI(progress) {
    document.getElementById('userLevel').textContent = progress.levelIcon + ' ' + progress.levelName;
    document.getElementById('userXP').textContent = progress.xp + ' XP';
    document.getElementById('xpProgress').style.width = ((progress.xp - progress.level.minXP) / (progress.nextLevelXP - progress.level.minXP) * 100) + '%';
    document.getElementById('achievementsCount').textContent = progress.achievementsCount + '/' + progress.totalAchievements;
}

// Обновление активности
async function updateActivity(type, value) {
    try {
        const response = await fetch('https://felix-black.vercel.app/api/learning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'updateActivity',
                userId: user.id,
                data: { type, value }
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Показать новые достижения
            if (data.newAchievements.length > 0) {
                showAchievementUnlocked(data.newAchievements);
            }
            
            // Обновить прогресс
            loadUserProgress();
        }
    } catch (error) {
        console.error('Failed to update activity:', error);
    }
}
```

## 🎨 Новые вкладки в Mini App

### 1. Вкладка "Обучение"
- Активные курсы с прогрессом
- Рекомендованные курсы
- Ежедневные задания
- Streak счетчик

### 2. Вкладка "Аналитика"
- График активности за 7 дней
- Топ-5 команд
- Топ-5 тем
- Общая статистика

### 3. Вкладка "Рейтинг"
- Топ-10 пользователей
- Ваша позиция
- Сравнение с друзьями

### 4. Улучшенная вкладка "Профиль"
- Уровень и XP с прогресс-баром
- Достижения (с анимацией)
- Streak счетчик
- Статистика

## 🔧 Интеграция с Telegram Bot

### Обновление webhook.js

```javascript
// После каждого сообщения
analyze(userId, text);
await updateLearningProgress(userId, 'message');

// После каждой AI команды
await updateLearningProgress(userId, 'command');

async function updateLearningProgress(userId, type) {
    try {
        await fetch('https://felix-black.vercel.app/api/learning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'updateActivity',
                userId,
                data: { type }
            })
        });
    } catch (e) {
        console.error('Learning update error:', e);
    }
}
```

## 📊 Тестирование

### API Learning
```bash
# Получить прогресс
curl "https://felix-black.vercel.app/api/learning?action=getUserProgress&userId=123"

# Добавить XP
curl -X POST https://felix-black.vercel.app/api/learning \
  -H "Content-Type: application/json" \
  -d '{"action":"addXP","userId":123,"data":{"amount":50,"reason":"Test"}}'

# Получить достижения
curl "https://felix-black.vercel.app/api/learning?action=getAchievements&userId=123"

# Получить рейтинг
curl "https://felix-black.vercel.app/api/learning?action=getLeaderboard"
```

### API Voice
```bash
# Обработать команду
curl -X POST https://felix-black.vercel.app/api/voice \
  -H "Content-Type: application/json" \
  -d '{"action":"processCommand","text":"открыть профиль"}'

# Получить список команд
curl "https://felix-black.vercel.app/api/voice?action=getCommands"
```

## 🚀 Следующие шаги

1. ✅ API для обучения создан
2. ✅ API для голосового управления создан
3. ⏳ Обновить Mini App с новыми функциями
4. ⏳ Добавить новые вкладки
5. ⏳ Интегрировать с Telegram Bot
6. ⏳ Тестирование
7. ⏳ Деплой

## 📝 Примечания

- Все данные хранятся в памяти (Map)
- Для production нужна база данных
- Web Speech API работает только в HTTPS
- Поддержка браузеров: Chrome, Edge, Safari (частично)

---

**Версия:** 6.0.0  
**Статус:** 🔨 В разработке  
**Прогресс:** 30%
