// Felix Bot v6.0 - Voice Control API
// Обработка голосовых команд

const voiceCommands = {
    // Навигация
    'открыть профиль': { action: 'navigate', target: 'profile' },
    'открой профиль': { action: 'navigate', target: 'profile' },
    'показать профиль': { action: 'navigate', target: 'profile' },
    
    'открыть команды': { action: 'navigate', target: 'commands' },
    'открой команды': { action: 'navigate', target: 'commands' },
    'показать команды': { action: 'navigate', target: 'commands' },
    
    'открыть академию': { action: 'navigate', target: 'academy' },
    'открой академию': { action: 'navigate', target: 'academy' },
    'показать академию': { action: 'navigate', target: 'academy' },
    
    'открыть партнеров': { action: 'navigate', target: 'partners' },
    'открой партнеров': { action: 'navigate', target: 'partners' },
    'показать партнеров': { action: 'navigate', target: 'partners' },
    
    'открыть настройки': { action: 'navigate', target: 'settings' },
    'открой настройки': { action: 'navigate', target: 'settings' },
    'показать настройки': { action: 'navigate', target: 'settings' },
    
    'открыть обучение': { action: 'navigate', target: 'learning' },
    'открой обучение': { action: 'navigate', target: 'learning' },
    
    'открыть аналитику': { action: 'navigate', target: 'analytics' },
    'открой аналитику': { action: 'navigate', target: 'analytics' },
    'показать статистику': { action: 'navigate', target: 'analytics' },
    
    'открыть рейтинг': { action: 'navigate', target: 'leaderboard' },
    'открой рейтинг': { action: 'navigate', target: 'leaderboard' },
    'показать рейтинг': { action: 'navigate', target: 'leaderboard' },
    
    // Действия
    'обновить профиль': { action: 'refresh', target: 'profile' },
    'обнови профиль': { action: 'refresh', target: 'profile' },
    
    'показать достижения': { action: 'show', target: 'achievements' },
    'покажи достижения': { action: 'show', target: 'achievements' },
    'мои достижения': { action: 'show', target: 'achievements' },
    
    'показать задания': { action: 'show', target: 'daily_tasks' },
    'покажи задания': { action: 'show', target: 'daily_tasks' },
    'ежедневные задания': { action: 'show', target: 'daily_tasks' },
    
    'начать курс': { action: 'start', target: 'course' },
    'начни курс': { action: 'start', target: 'course' },
    
    'сохранить настройки': { action: 'save', target: 'settings' },
    'сохрани настройки': { action: 'save', target: 'settings' },
    
    // AI команды
    'задать вопрос': { action: 'ai_command', command: 'ask' },
    'задай вопрос': { action: 'ai_command', command: 'ask' },
    
    'краткое содержание': { action: 'ai_command', command: 'summary' },
    'сделай краткое содержание': { action: 'ai_command', command: 'summary' },
    
    'анализ текста': { action: 'ai_command', command: 'analyze' },
    'проанализируй текст': { action: 'ai_command', command: 'analyze' },
    
    'генерация': { action: 'ai_command', command: 'generate' },
    'сгенерируй': { action: 'ai_command', command: 'generate' },
    
    'перевод': { action: 'ai_command', command: 'translate' },
    'переведи': { action: 'ai_command', command: 'translate' },
    
    'улучшить текст': { action: 'ai_command', command: 'improve' },
    'улучши текст': { action: 'ai_command', command: 'improve' },
    
    'генерация идей': { action: 'ai_command', command: 'brainstorm' },
    'сгенерируй идеи': { action: 'ai_command', command: 'brainstorm' },
    
    'объяснить': { action: 'ai_command', command: 'explain' },
    'объясни': { action: 'ai_command', command: 'explain' },
    
    // Помощь
    'помощь': { action: 'help' },
    'помоги': { action: 'help' },
    'что ты умеешь': { action: 'help' },
    'что можешь': { action: 'help' }
};

// Нормализация текста
function normalizeText(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[.,!?;:]/g, '')
        .replace(/\s+/g, ' ');
}

// Найти команду в тексте
function findCommand(text) {
    const normalized = normalizeText(text);
    
    // Точное совпадение
    if (voiceCommands[normalized]) {
        return voiceCommands[normalized];
    }
    
    // Поиск частичного совпадения
    for (const [command, action] of Object.entries(voiceCommands)) {
        if (normalized.includes(command) || command.includes(normalized)) {
            return action;
        }
    }
    
    // Если не найдено - попробовать извлечь намерение
    return extractIntent(normalized);
}

// Извлечь намерение из текста
function extractIntent(text) {
    // Навигация
    if (text.includes('открыть') || text.includes('открой') || text.includes('показать') || text.includes('покажи')) {
        if (text.includes('профиль')) return { action: 'navigate', target: 'profile' };
        if (text.includes('команд')) return { action: 'navigate', target: 'commands' };
        if (text.includes('академ')) return { action: 'navigate', target: 'academy' };
        if (text.includes('партнер')) return { action: 'navigate', target: 'partners' };
        if (text.includes('настройк')) return { action: 'navigate', target: 'settings' };
        if (text.includes('обучен')) return { action: 'navigate', target: 'learning' };
        if (text.includes('аналитик') || text.includes('статистик')) return { action: 'navigate', target: 'analytics' };
        if (text.includes('рейтинг')) return { action: 'navigate', target: 'leaderboard' };
        if (text.includes('достижен')) return { action: 'show', target: 'achievements' };
        if (text.includes('задан')) return { action: 'show', target: 'daily_tasks' };
    }
    
    // AI команды
    if (text.includes('вопрос')) return { action: 'ai_command', command: 'ask' };
    if (text.includes('краткое') || text.includes('содержан')) return { action: 'ai_command', command: 'summary' };
    if (text.includes('анализ')) return { action: 'ai_command', command: 'analyze' };
    if (text.includes('генер')) return { action: 'ai_command', command: 'generate' };
    if (text.includes('перевод') || text.includes('переведи')) return { action: 'ai_command', command: 'translate' };
    if (text.includes('улучш')) return { action: 'ai_command', command: 'improve' };
    if (text.includes('идеи') || text.includes('идей')) return { action: 'ai_command', command: 'brainstorm' };
    if (text.includes('объясн')) return { action: 'ai_command', command: 'explain' };
    
    // Действия
    if (text.includes('обнов')) return { action: 'refresh', target: 'profile' };
    if (text.includes('начать') || text.includes('начни')) return { action: 'start', target: 'course' };
    if (text.includes('сохран')) return { action: 'save', target: 'settings' };
    
    // Помощь
    if (text.includes('помощ') || text.includes('помог') || text.includes('умеешь') || text.includes('можешь')) {
        return { action: 'help' };
    }
    
    return null;
}

// Получить список доступных команд
function getAvailableCommands() {
    const commands = {
        navigation: [
            'Открыть профиль',
            'Открыть команды',
            'Открыть академию',
            'Открыть партнеров',
            'Открыть настройки',
            'Открыть обучение',
            'Открыть аналитику',
            'Открыть рейтинг'
        ],
        actions: [
            'Обновить профиль',
            'Показать достижения',
            'Показать задания',
            'Начать курс',
            'Сохранить настройки'
        ],
        ai: [
            'Задать вопрос',
            'Краткое содержание',
            'Анализ текста',
            'Генерация',
            'Перевод',
            'Улучшить текст',
            'Генерация идей',
            'Объяснить'
        ]
    };
    
    return commands;
}

// Валидация
function validateVoiceAction(action) {
    const validActions = ['processCommand', 'getCommands'];
    if (!action) return { valid: false, error: 'action is required' };
    if (!validActions.includes(action)) return { valid: false, error: 'invalid action' };
    return { valid: true };
}

function validateText(text) {
    if (!text || typeof text !== 'string') return { valid: false, error: 'text is required and must be string' };
    if (text.length > 500) return { valid: false, error: 'text too long (max 500 characters)' };
    return { valid: true };
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { action, text } = req.method === 'GET' ? req.query : req.body;
        
        // Валидация action
        const actionValidation = validateVoiceAction(action);
        if (!actionValidation.valid) {
            return res.status(400).json({ success: false, error: actionValidation.error });
        }
        
        switch (action) {
            case 'processCommand':
                const textValidation = validateText(text);
                if (!textValidation.valid) {
                    return res.status(400).json({ success: false, error: textValidation.error });
                }
                return handleProcessCommand(res, text);
            
            case 'getCommands':
                return handleGetCommands(res);
            
            default:
                return res.status(400).json({ success: false, error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Voice API Error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error', 
            message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
        });
    }
}

function handleProcessCommand(res, text) {
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }
    
    const command = findCommand(text);
    
    if (!command) {
        return res.status(200).json({
            success: false,
            message: 'Команда не распознана. Скажите "помощь" для списка команд.',
            recognized: false
        });
    }
    
    return res.status(200).json({
        success: true,
        command,
        recognized: true,
        originalText: text
    });
}

function handleGetCommands(res) {
    const commands = getAvailableCommands();
    
    return res.status(200).json({
        success: true,
        commands
    });
}
