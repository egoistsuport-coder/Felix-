# 🚀 Felix v6.0 - Следующие шаги

## ✅ Что уже сделано

### API (100%)
- ✅ `api/learning.js` - система обучения (10 эндпоинтов)
- ✅ `api/voice.js` - голосовое управление (2 эндпоинта)
- ✅ `api/admin.js` - админ панель (13 эндпоинтов)
- ✅ `api/webhook.js` - Telegram bot (все команды)

### Дизайн (80%)
- ✅ Элитарный дизайн спецификация
- ✅ Квадратные карточки курсов (CSS)
- ✅ Стили для голосового управления
- ✅ Стили для системы прогресса
- ⏳ HTML разметка новых вкладок (добавлена, но без данных)

### Документация (100%)
- ✅ Roadmap v6.0
- ✅ Implementation guide
- ✅ Elite design spec
- ✅ Optimization plan

## ⏳ Что нужно сделать СЕЙЧАС

### Приоритет 1: JavaScript функции Mini App
Нужно добавить в `miniapp/index.html` перед `</script>`:

```javascript
// === LEARNING API FUNCTIONS ===

async function loadUserProgress() {
    if (!user.id) return;
    try {
        const res = await fetch(`https://felix-black.vercel.app/api/learning?action=getUserProgress&userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
            updateProgressUI(data.progress);
        }
    } catch (e) {
        console.error('Load progress error:', e);
    }
}

async function loadDailyTasks() {
    if (!user.id) return;
    try {
        const res = await fetch(`https://felix-black.vercel.app/api/learning?action=getDailyTasks&userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
            displayDailyTasks(data.tasks);
        }
    } catch (e) {
        console.error('Load tasks error:', e);
    }
}

async function loadAchievements() {
    if (!user.id) return;
    try {
        const res = await fetch(`https://felix-black.vercel.app/api/learning?action=getAchievements&userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
            displayAchievements(data.achievements);
        }
    } catch (e) {
        console.error('Load achievements error:', e);
    }
}

async function loadLeaderboard() {
    try {
        const res = await fetch(`https://felix-black.vercel.app/api/learning?action=getLeaderboard`);
        const data = await res.json();
        if (data.success) {
            displayLeaderboard(data.leaderboard);
        }
    } catch (e) {
        console.error('Load leaderboard error:', e);
    }
}

async function loadAnalytics() {
    if (!user.id) return;
    try {
        const res = await fetch(`https://felix-black.vercel.app/api/learning?action=getAnalytics&userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
            displayAnalytics(data.analytics);
        }
    } catch (e) {
        console.error('Load analytics error:', e);
    }
}

// === VOICE CONTROL ===

let recognition;
let isListening = false;

function initVoiceControl() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error('Speech Recognition not supported');
        document.getElementById('voiceBtn').style.display = 'none';
        return;
    }
    
    recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        document.getElementById('voiceResult').textContent = `"${text}"`;
        await processVoiceCommand(text);
    };
    
    recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        stopVoiceControl();
    };
    
    recognition.onend = () => {
        stopVoiceControl();
    };
}

function toggleVoiceControl() {
    if (isListening) {
        stopVoiceControl();
    } else {
        startVoiceControl();
    }
}

function startVoiceControl() {
    if (!recognition) return;
    isListening = true;
    document.getElementById('voiceBtn').classList.add('listening');
    document.getElementById('voiceOverlay').classList.add('active');
    document.getElementById('voiceText').textContent = 'Слушаю...';
    document.getElementById('voiceResult').textContent = '';
    recognition.start();
    tg.HapticFeedback.impactOccurred('medium');
}

function stopVoiceControl() {
    isListening = false;
    document.getElementById('voiceBtn').classList.remove('listening');
    document.getElementById('voiceOverlay').classList.remove('active');
    if (recognition) recognition.stop();
}

async function processVoiceCommand(text) {
    try {
        const res = await fetch('https://felix-black.vercel.app/api/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'processCommand', text })
        });
        const data = await res.json();
        
        if (data.success && data.recognized) {
            executeVoiceCommand(data.command);
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            tg.showAlert(data.message || 'Команда не распознана');
            tg.HapticFeedback.notificationOccurred('error');
        }
    } catch (e) {
        console.error('Voice command error:', e);
        tg.showAlert('Ошибка обработки команды');
    }
    stopVoiceControl();
}

function executeVoiceCommand(command) {
    switch (command.action) {
        case 'navigate':
            switchTab(command.target);
            break;
        case 'refresh':
            if (command.target === 'profile') loadUserProgress();
            break;
        case 'show':
            if (command.target === 'achievements') {
                switchTab('learning');
                setTimeout(() => {
                    document.getElementById('achievementsList').scrollIntoView({ behavior: 'smooth' });
                }, 300);
            }
            if (command.target === 'daily_tasks') {
                switchTab('learning');
            }
            break;
        case 'help':
            showVoiceHelp();
            break;
    }
}

function showVoiceHelp() {
    tg.showAlert('Доступные команды:\n\n' +
        '• Открыть [профиль/обучение/аналитику/рейтинг]\n' +
        '• Показать [достижения/задания]\n' +
        '• Обновить профиль\n' +
        '• Помощь');
}

// === DISPLAY FUNCTIONS ===

function displayDailyTasks(tasks) {
    const html = tasks.map(task => `
        <div class="achievement-item ${task.completed ? 'unlocked' : ''}">
            <div class="achievement-icon">${task.completed ? '✅' : '⏳'}</div>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">${task.name}</div>
                <div style="font-size: 12px; opacity: 0.8;">
                    Прогресс: ${task.progress}/${task.target} • +${task.xp} XP
                </div>
                <div class="xp-bar" style="margin-top: 8px;">
                    <div class="xp-fill" style="width: ${(task.progress / task.target) * 100}%"></div>
                </div>
            </div>
        </div>
    `).join('');
    document.getElementById('dailyTasksList').innerHTML = html;
}

function displayAchievements(achievements) {
    const unlocked = achievements.filter(a => a.unlocked).length;
    document.getElementById('achievementsProgress').textContent = `${unlocked}/${achievements.length}`;
    
    const html = achievements.map(ach => `
        <div class="achievement-item ${ach.unlocked ? 'unlocked' : ''}">
            <div class="achievement-icon">${ach.icon}</div>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">
                    ${ach.name}
                    ${ach.unlocked ? '<span style="color: #4caf50; margin-left: 8px;">✓</span>' : ''}
                </div>
                <div style="font-size: 12px; opacity: 0.8;">${ach.description}</div>
                <div style="font-size: 11px; color: #ffd700; margin-top: 4px;">+${ach.xp} XP</div>
            </div>
        </div>
    `).join('');
    document.getElementById('achievementsList').innerHTML = html;
}

function displayLeaderboard(leaderboard) {
    const html = leaderboard.map((user, index) => `
        <div class="achievement-item" style="background: ${index < 3 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};">
            <div style="font-size: 24px; font-weight: 700; width: 40px; text-align: center;">
                ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">
                    ${user.levelIcon} Пользователь ${user.userId}
                </div>
                <div style="font-size: 12px; opacity: 0.8;">
                    ${user.levelName} • ${user.xp} XP • ${user.coursesCompleted} курсов
                </div>
            </div>
        </div>
    `).join('');
    document.getElementById('leaderboardList').innerHTML = html;
}

function displayAnalytics(analytics) {
    // Топ команды
    const commandsHtml = analytics.topCommands.map(cmd => `
        <div class="achievement-item">
            <div style="font-size: 24px;">⚡</div>
            <div style="flex: 1;">
                <div style="font-weight: 600;">${cmd.command}</div>
                <div style="font-size: 12px; opacity: 0.8;">Использовано: ${cmd.count} раз</div>
            </div>
        </div>
    `).join('');
    document.getElementById('topCommandsList').innerHTML = commandsHtml || '<p style="text-align: center; opacity: 0.7;">Нет данных</p>';
    
    // Топ темы
    const topicsHtml = analytics.topTopics.map(topic => `
        <div class="achievement-item">
            <div style="font-size: 24px;">🎯</div>
            <div style="flex: 1;">
                <div style="font-weight: 600;">${topic.topic}</div>
                <div style="font-size: 12px; opacity: 0.8;">Упоминаний: ${topic.count}</div>
            </div>
        </div>
    `).join('');
    document.getElementById('topTopicsList').innerHTML = topicsHtml || '<p style="text-align: center; opacity: 0.7;">Нет данных</p>';
    
    // Общая статистика
    document.getElementById('totalActivity').textContent = Math.round(analytics.totalActivity);
    document.getElementById('averageDaily').textContent = Math.round(analytics.averageDaily);
}

// === INIT ===
if (user.id) {
    loadUserProgress();
    loadDailyTasks();
    loadAchievements();
    loadLeaderboard();
    loadAnalytics();
}

initVoiceControl();
```

### Приоритет 2: Обновить webhook.js
Добавить кнопку Mini App во все ответы:

```javascript
// В начале файла после констант
const MINIAPP_BUTTON = {
    text: '📱 Открыть Felix App',
    web_app: { url: 'https://felix-black.vercel.app/miniapp/' }
};

function addMiniAppButton(buttons = []) {
    return [...buttons, [MINIAPP_BUTTON]];
}

// Использовать везде вместо обычных buttons
await send(chatId, message, addMiniAppButton(otherButtons));
```

### Приоритет 3: Обновить Admin Panel
Добавить новые вкладки в `miniapp/admin.html`

## 📊 Текущий прогресс

- API: 100% ✅
- Дизайн: 80% ⏳
- Mini App функционал: 30% ⏳
- Admin Panel: 60% ⏳
- Bot интеграция: 50% ⏳

## 🎯 Цель
Довести все до 100% и убрать все заглушки!

---

Готов продолжить реализацию?
