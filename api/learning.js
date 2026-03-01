// Felix Bot v6.0 - Learning Progress API
// Система прогресса обучения, достижений и аналитики

const userProgress = new Map(); // Прогресс пользователей
const achievements = new Map(); // Достижения пользователей
const courseProgress = new Map(); // Прогресс по курсам
const dailyTasks = new Map(); // Ежедневные задания

// Определение уровней
const LEVELS = [
    { level: 1, name: 'Новичок', minXP: 0, maxXP: 100, icon: '🌱' },
    { level: 2, name: 'Ученик', minXP: 100, maxXP: 300, icon: '📚' },
    { level: 3, name: 'Студент', minXP: 300, maxXP: 600, icon: '🎓' },
    { level: 4, name: 'Продвинутый', minXP: 600, maxXP: 1000, icon: '⭐' },
    { level: 5, name: 'Эксперт', minXP: 1000, maxXP: 1500, icon: '💎' },
    { level: 6, name: 'Мастер', minXP: 1500, maxXP: 2500, icon: '👑' },
    { level: 7, name: 'Гуру', minXP: 2500, maxXP: 5000, icon: '🔥' },
    { level: 8, name: 'Легенда', minXP: 5000, maxXP: Infinity, icon: '🏆' }
];

// Определение достижений
const ACHIEVEMENT_DEFINITIONS = {
    first_steps: { id: 'first_steps', name: 'Первые шаги', description: 'Отправьте 10 сообщений', icon: '👣', xp: 20, requirement: { type: 'messages', count: 10 } },
    chatterbox: { id: 'chatterbox', name: 'Болтун', description: 'Отправьте 100 сообщений', icon: '💬', xp: 50, requirement: { type: 'messages', count: 100 } },
    ai_enthusiast: { id: 'ai_enthusiast', name: 'AI Энтузиаст', description: 'Используйте 50 AI команд', icon: '🤖', xp: 100, requirement: { type: 'commands', count: 50 } },
    student: { id: 'student', name: 'Студент', description: 'Завершите 1 курс', icon: '🎓', xp: 150, requirement: { type: 'courses', count: 1 } },
    master: { id: 'master', name: 'Мастер', description: 'Завершите все курсы', icon: '🏆', xp: 500, requirement: { type: 'courses', count: 'all' } },
    streak_7: { id: 'streak_7', name: 'Неделя подряд', description: '7 дней активности подряд', icon: '🔥', xp: 200, requirement: { type: 'streak', count: 7 } },
    streak_30: { id: 'streak_30', name: 'Месяц подряд', description: '30 дней активности подряд', icon: '💪', xp: 1000, requirement: { type: 'streak', count: 30 } },
    early_bird: { id: 'early_bird', name: 'Ранняя пташка', description: 'Активность до 8 утра', icon: '🌅', xp: 50, requirement: { type: 'time', hour: 8 } },
    night_owl: { id: 'night_owl', name: 'Сова', description: 'Активность после 23:00', icon: '🦉', xp: 50, requirement: { type: 'time', hour: 23 } },
    perfectionist: { id: 'perfectionist', name: 'Перфекционист', description: 'Получите 100% в квизе', icon: '💯', xp: 100, requirement: { type: 'quiz', score: 100 } }
};

// Получить уровень по XP
function getLevelByXP(xp) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].minXP) {
            return LEVELS[i];
        }
    }
    return LEVELS[0];
}

// Получить прогресс пользователя
function getUserProgressData(userId) {
    if (!userProgress.has(userId)) {
        userProgress.set(userId, {
            userId,
            xp: 0,
            level: 1,
            totalMessages: 0,
            totalCommands: 0,
            coursesCompleted: [],
            coursesInProgress: [],
            lessonsCompleted: [],
            streak: 0,
            lastActive: Date.now(),
            createdAt: Date.now(),
            activityByDay: {},
            topTopics: [],
            commandsUsage: {},
            quizScores: []
        });
    }
    return userProgress.get(userId);
}

// Добавить XP пользователю
function addXP(userId, amount, reason) {
    const progress = getUserProgressData(userId);
    const oldLevel = getLevelByXP(progress.xp);
    
    progress.xp += amount;
    const newLevel = getLevelByXP(progress.xp);
    
    const leveledUp = newLevel.level > oldLevel.level;
    
    return {
        xp: progress.xp,
        addedXP: amount,
        reason,
        oldLevel: oldLevel.level,
        newLevel: newLevel.level,
        leveledUp,
        nextLevelXP: newLevel.maxXP
    };
}

// Проверить и разблокировать достижения
function checkAchievements(userId) {
    const progress = getUserProgressData(userId);
    const userAchievements = achievements.get(userId) || [];
    const newAchievements = [];
    
    for (const [id, achievement] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
        // Пропустить уже полученные
        if (userAchievements.some(a => a.id === id)) continue;
        
        let unlocked = false;
        const req = achievement.requirement;
        
        switch (req.type) {
            case 'messages':
                unlocked = progress.totalMessages >= req.count;
                break;
            case 'commands':
                unlocked = progress.totalCommands >= req.count;
                break;
            case 'courses':
                if (req.count === 'all') {
                    // Проверить все курсы (нужно знать общее количество)
                    unlocked = progress.coursesCompleted.length >= 5; // Предположим 5 курсов
                } else {
                    unlocked = progress.coursesCompleted.length >= req.count;
                }
                break;
            case 'streak':
                unlocked = progress.streak >= req.count;
                break;
            case 'time':
                const hour = new Date().getHours();
                if (req.hour === 8) {
                    unlocked = hour < 8;
                } else if (req.hour === 23) {
                    unlocked = hour >= 23;
                }
                break;
            case 'quiz':
                unlocked = progress.quizScores.some(s => s >= req.score);
                break;
        }
        
        if (unlocked) {
            const unlockedAchievement = {
                ...achievement,
                unlockedAt: Date.now()
            };
            userAchievements.push(unlockedAchievement);
            newAchievements.push(unlockedAchievement);
            
            // Добавить XP за достижение
            addXP(userId, achievement.xp, `Достижение: ${achievement.name}`);
        }
    }
    
    achievements.set(userId, userAchievements);
    return newAchievements;
}

// Обновить streak
function updateStreak(userId) {
    const progress = getUserProgressData(userId);
    const now = Date.now();
    const lastActive = progress.lastActive;
    const dayInMs = 24 * 60 * 60 * 1000;
    
    const daysSinceLastActive = Math.floor((now - lastActive) / dayInMs);
    
    if (daysSinceLastActive === 0) {
        // Сегодня уже был активен
        return progress.streak;
    } else if (daysSinceLastActive === 1) {
        // Вчера был активен - продолжить streak
        progress.streak++;
    } else {
        // Пропустил дни - сбросить streak
        progress.streak = 1;
    }
    
    progress.lastActive = now;
    return progress.streak;
}

// Получить ежедневные задания
function getDailyTasksForUser(userId) {
    const today = new Date().toDateString();
    const key = `${userId}_${today}`;
    
    if (!dailyTasks.has(key)) {
        dailyTasks.set(key, {
            userId,
            date: today,
            tasks: [
                { id: 'messages_5', name: 'Отправить 5 сообщений', progress: 0, target: 5, xp: 10, completed: false },
                { id: 'commands_3', name: 'Использовать 3 AI команды', progress: 0, target: 3, xp: 15, completed: false },
                { id: 'lesson_1', name: 'Пройти 1 урок', progress: 0, target: 1, xp: 25, completed: false }
            ]
        });
    }
    
    return dailyTasks.get(key);
}

// Обновить прогресс ежедневного задания
function updateDailyTask(userId, taskId, increment = 1) {
    const tasks = getDailyTasksForUser(userId);
    const task = tasks.tasks.find(t => t.id === taskId);
    
    if (task && !task.completed) {
        task.progress = Math.min(task.progress + increment, task.target);
        
        if (task.progress >= task.target) {
            task.completed = true;
            addXP(userId, task.xp, `Ежедневное задание: ${task.name}`);
            return { completed: true, xp: task.xp };
        }
    }
    
    return { completed: false };
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
        const { action, userId, data } = req.method === 'GET' ? { ...req.query, data: null } : req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        switch (action) {
            case 'getUserProgress':
                return handleGetUserProgress(res, userId);
            
            case 'addXP':
                return handleAddXP(res, userId, data);
            
            case 'updateActivity':
                return handleUpdateActivity(res, userId, data);
            
            case 'getAchievements':
                return handleGetAchievements(res, userId);
            
            case 'getDailyTasks':
                return handleGetDailyTasks(res, userId);
            
            case 'updateDailyTask':
                return handleUpdateDailyTask(res, userId, data);
            
            case 'getCourseProgress':
                return handleGetCourseProgress(res, userId, data);
            
            case 'updateCourseProgress':
                return handleUpdateCourseProgress(res, userId, data);
            
            case 'getLeaderboard':
                return handleGetLeaderboard(res);
            
            case 'getAnalytics':
                return handleGetAnalytics(res, userId);
            
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Learning API Error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}

// Handlers
function handleGetUserProgress(res, userId) {
    const progress = getUserProgressData(userId);
    const level = getLevelByXP(progress.xp);
    const userAchievements = achievements.get(userId) || [];
    
    return res.status(200).json({
        success: true,
        progress: {
            ...progress,
            level: level.level,
            levelName: level.name,
            levelIcon: level.icon,
            xpToNextLevel: level.maxXP - progress.xp,
            nextLevelXP: level.maxXP,
            achievementsCount: userAchievements.length,
            totalAchievements: Object.keys(ACHIEVEMENT_DEFINITIONS).length
        }
    });
}

function handleAddXP(res, userId, data) {
    const { amount, reason } = data;
    const result = addXP(userId, amount, reason);
    const newAchievements = checkAchievements(userId);
    
    return res.status(200).json({
        success: true,
        result,
        newAchievements
    });
}

function handleUpdateActivity(res, userId, data) {
    const { type, value } = data; // type: 'message', 'command', 'lesson'
    const progress = getUserProgressData(userId);
    
    // Обновить streak
    const streak = updateStreak(userId);
    
    // Обновить счетчики
    if (type === 'message') {
        progress.totalMessages++;
        addXP(userId, 5, 'Сообщение');
        updateDailyTask(userId, 'messages_5', 1);
    } else if (type === 'command') {
        progress.totalCommands++;
        addXP(userId, 10, 'AI команда');
        updateDailyTask(userId, 'commands_3', 1);
    } else if (type === 'lesson') {
        progress.lessonsCompleted.push(value);
        addXP(userId, 20, 'Урок завершен');
        updateDailyTask(userId, 'lesson_1', 1);
    }
    
    // Обновить активность по дням
    const today = new Date().toDateString();
    progress.activityByDay[today] = (progress.activityByDay[today] || 0) + 1;
    
    // Проверить достижения
    const newAchievements = checkAchievements(userId);
    
    return res.status(200).json({
        success: true,
        streak,
        newAchievements
    });
}

function handleGetAchievements(res, userId) {
    const userAchievements = achievements.get(userId) || [];
    const allAchievements = Object.values(ACHIEVEMENT_DEFINITIONS).map(achievement => {
        const unlocked = userAchievements.find(a => a.id === achievement.id);
        return {
            ...achievement,
            unlocked: !!unlocked,
            unlockedAt: unlocked?.unlockedAt || null
        };
    });
    
    return res.status(200).json({
        success: true,
        achievements: allAchievements,
        unlockedCount: userAchievements.length,
        totalCount: allAchievements.length
    });
}

function handleGetDailyTasks(res, userId) {
    const tasks = getDailyTasksForUser(userId);
    
    return res.status(200).json({
        success: true,
        tasks: tasks.tasks,
        completedCount: tasks.tasks.filter(t => t.completed).length,
        totalCount: tasks.tasks.length
    });
}

function handleUpdateDailyTask(res, userId, data) {
    const { taskId, increment } = data;
    const result = updateDailyTask(userId, taskId, increment);
    
    return res.status(200).json({
        success: true,
        ...result
    });
}

function handleGetCourseProgress(res, userId, data) {
    const { courseId } = data;
    const key = `${userId}_${courseId}`;
    const progress = courseProgress.get(key) || {
        userId,
        courseId,
        lessonsCompleted: [],
        quizScores: [],
        startedAt: Date.now(),
        completedAt: null,
        progress: 0
    };
    
    return res.status(200).json({
        success: true,
        progress
    });
}

function handleUpdateCourseProgress(res, userId, data) {
    const { courseId, lessonId, quizScore, completed } = data;
    const key = `${userId}_${courseId}`;
    const progress = courseProgress.get(key) || {
        userId,
        courseId,
        lessonsCompleted: [],
        quizScores: [],
        startedAt: Date.now(),
        completedAt: null,
        progress: 0
    };
    
    if (lessonId && !progress.lessonsCompleted.includes(lessonId)) {
        progress.lessonsCompleted.push(lessonId);
    }
    
    if (quizScore !== undefined) {
        progress.quizScores.push(quizScore);
        
        // Сохранить в прогресс пользователя
        const userProg = getUserProgressData(userId);
        userProg.quizScores.push(quizScore);
    }
    
    if (completed) {
        progress.completedAt = Date.now();
        progress.progress = 100;
        
        // Добавить в завершенные курсы
        const userProg = getUserProgressData(userId);
        if (!userProg.coursesCompleted.includes(courseId)) {
            userProg.coursesCompleted.push(courseId);
            addXP(userId, 50, `Курс завершен: ${courseId}`);
        }
    }
    
    courseProgress.set(key, progress);
    
    // Проверить достижения
    const newAchievements = checkAchievements(userId);
    
    return res.status(200).json({
        success: true,
        progress,
        newAchievements
    });
}

function handleGetLeaderboard(res) {
    const leaderboard = Array.from(userProgress.values())
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 10)
        .map((user, index) => {
            const level = getLevelByXP(user.xp);
            return {
                rank: index + 1,
                userId: user.userId,
                xp: user.xp,
                level: level.level,
                levelName: level.name,
                levelIcon: level.icon,
                totalMessages: user.totalMessages,
                coursesCompleted: user.coursesCompleted.length
            };
        });
    
    return res.status(200).json({
        success: true,
        leaderboard
    });
}

function handleGetAnalytics(res, userId) {
    const progress = getUserProgressData(userId);
    
    // Активность за последние 7 дней
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        last7Days.push({
            date: dateStr,
            activity: progress.activityByDay[dateStr] || 0
        });
    }
    
    // Топ команды
    const topCommands = Object.entries(progress.commandsUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cmd, count]) => ({ command: cmd, count }));
    
    return res.status(200).json({
        success: true,
        analytics: {
            activityLast7Days: last7Days,
            topCommands,
            topTopics: progress.topTopics.slice(0, 5),
            totalActivity: Object.values(progress.activityByDay).reduce((a, b) => a + b, 0),
            averageDaily: Object.values(progress.activityByDay).reduce((a, b) => a + b, 0) / Object.keys(progress.activityByDay).length || 0
        }
    });
}
