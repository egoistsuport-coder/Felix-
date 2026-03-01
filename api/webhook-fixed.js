// Felix Bot v5.0 - With Admin Command
import Groq from 'groq-sdk';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8623255560:AAE7sC-7-eWA5LD-ebATDUh6nGUG0pYm03U';
const GROQ_KEY = process.env.GROQ_API_KEY || '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';
const ADMIN_ID = 8264612178;

let groq;
try {
    groq = new Groq({ apiKey: GROQ_KEY });
} catch (e) {
    console.error('Groq:', e);
}

const users = new Map();
const groups = new Map();

async function send(chatId, text, buttons) {
    try {
        const body = { chat_id: chatId, text, parse_mode: 'HTML' };
        if (buttons) body.reply_markup = { inline_keyboard: buttons };
        const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch (e) {
        console.error('Send:', e);
    }
}

async function ai(prompt, userId) {
    try {
        if (!groq) return 'AI недоступен';
        let sys = 'You are Felix. ';
        const u = users.get(userId);
        if (u?.style === 'formal') sys += 'Be formal. ';
        else if (u?.style === 'casual') sys += 'Be casual. ';
        sys += 'Respond in Russian.';
        const r = await groq.chat.completions.create({
            messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1024
        });
        return r.choices[0]?.message?.content || 'Нет ответа';
    } catch (e) {
        console.error('AI:', e);
        return 'Ошибка AI';
    }
}

function getUser(id) {
    if (!users.has(id)) {
        users.set(id, { id, msgs: 0, cmds: new Map(), style: 'casual', topics: new Map(), score: 0, created: Date.now() });
    }
    return users.get(id);
}

function analyze(id, text) {
    const u = getUser(id);
    u.msgs++;
    const formal = ['пожалуйста', 'спасибо'].filter(w => text.toLowerCase().includes(w)).length;
    const casual = ['привет', 'пока', 'ок'].filter(w => text.toLowerCase().includes(w)).length;
    u.style = formal > casual ? 'formal' : casual > formal ? 'casual' : 'mixed';
    const words = text.toLowerCase().replace(/[^\wа-яё\s]/gi, '').split(/\s+/).filter(w => w.length > 3);
    words.forEach(w => u.topics.set(w, (u.topics.get(w) || 0) + 1));
    u.score = Math.min(100, Math.floor(u.msgs / 10));
}

function getGroup(id) {
    if (!groups.has(id)) {
        groups.set(id, { id, msgs: 0, users: new Set(), top: new Map(), created: Date.now() });
    }
    return groups.get(id);
}

function moderate(text) {
    if (/(.)\1{5,}/.test(text)) return { ok: false, reason: 'spam' };
    const caps = (text.match(/[A-ZА-Я]/g) || []).length / text.length;
    if (caps > 0.7 && text.length > 10) return { ok: false, reason: 'CAPS' };
    return { ok: true };
}

export default async function handler(req, res) {
    if (req.method === 'GET') {
        return res.json({ status: 'ok', bot: 'Felix v5.0' });
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Not allowed' });
    }

    try {
        const { message, callback_query } = req.body;

        // Callback Query Handler
        if (callback_query) {
            const chatId = callback_query.message.chat.id;
            const userId = callback_query.from.id;
            const data = callback_query.data;
            const user = getUser(userId);

            if (data === 'help') {
                const buttons = [[{text: '🤖 AI Команды', callback_data: 'ai_cmds'}], [{text: '👤 Профиль', callback_data: 'profile'}, {text: '📊 Статистика', callback_data: 'stats'}], [{text: '📱 Mini App', web_app: {url: 'https://felix-black.vercel.app/miniapp/'}}]];
                await send(chatId, '📚 <b>Felix Bot v5.0</b>\n\nВыберите раздел:', buttons);
            } else if (data === 'ai_cmds') {
                const buttons = [[{text: '💬 Задать вопрос', callback_data: 'cmd_ask'}], [{text: '📝 Краткое содержание', callback_data: 'cmd_summary'}, {text: '🔍 Анализ', callback_data: 'cmd_analyze'}], [{text: '✨ Генерация', callback_data: 'cmd_generate'}, {text: '🌐 Перевод', callback_data: 'cmd_translate'}], [{text: '✍️ Улучшить', callback_data: 'cmd_improve'}, {text: '💡 Идеи', callback_data: 'cmd_brainstorm'}], [{text: '📖 Объяснить', callback_data: 'cmd_explain'}], [{text: '« Назад', callback_data: 'help'}]];
                await send(chatId, '🤖 <b>AI Команды</b>\n\nВыберите команду:', buttons);
            } else if (data === 'profile') {
                const emoji = user.style === 'formal' ? '🎩' : '😎';
                let msg = `👤 <b>Ваш профиль обучения</b>\n\n📊 Прогресс: ${user.score}%\n💬 Сообщений: ${user.msgs}\n${emoji} Стиль: ${user.style}`;
                if (user.topics.size > 0) {
                    const top = [...user.topics.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
                    msg += '\n\n🎯 <b>Интересы:</b>\n' + top.map(([t, c]) => `• ${t} (${c})`).join('\n');
                }
                const buttons = [[{text: '« Назад', callback_data: 'help'}]];
                await send(chatId, msg, buttons);
            } else if (data === 'stats') {
                const buttons = [[{text: '« Назад', callback_data: 'help'}]];
                await send(chatId, `📊 <b>Статистика</b>\n\n💬 Сообщений: ${user.msgs}\n⚡ Команд: ${user.cmds.size}\n🎯 Тем: ${user.topics.size}\n📈 Прогресс: ${user.score}%`, buttons);
            } else if (data.startsWith('cmd_')) {
                const cmd = data.replace('cmd_', '');
                const cmdNames = {ask: 'Задать вопрос', summary: 'Краткое содержание', analyze: 'Анализ текста', generate: 'Генерация контента', translate: 'Перевод текста', improve: 'Улучшить текст', brainstorm: 'Генерация идей', explain: 'Объяснение'};
                const buttons = [[{text: '« Назад', callback_data: 'ai_cmds'}]];
                await send(chatId, `📝 <b>${cmdNames[cmd]}</b>\n\nИспользование:\n<code>/${cmd} [ваш текст]</code>\n\nПример:\n<code>/${cmd} привет как дела</code>`, buttons);
            }
            return res.json({ ok: true });
        }

        if (!message?.text) return res.json({ ok: true });

        const { chat: { id: chatId, type }, from: { id: userId }, text } = message;
        const isGroup = type !== 'private';
        const user = getUser(userId);
        analyze(userId, text);

        // Group moderation
        if (isGroup) {
            const g = getGroup(chatId);
            g.msgs++;
            g.users.add(userId);
            g.top.set(userId, (g.top.get(userId) || 0) + 1);
            const mod = moderate(text);
            if (!mod.ok) {
                await send(chatId, `⚠️ Нарушение: ${mod.reason}`);
                return res.json({ ok: true });
            }
        }

        // Command handlers
        if (text.startsWith('/')) {
            const [cmd, ...args] = text.split(' ');
            const arg = args.join(' ');
            user.cmds.set(cmd, (user.cmds.get(cmd) || 0) + 1);

            // /start
            if (cmd === '/start') {
                const buttons = [[{text: '📱 Открыть Mini App', web_app: {url: 'https://felix-black.vercel.app/miniapp/'}}], [{text: '📚 Помощь', callback_data: 'help'}]];
                await send(chatId, `👋 Привет, ${message.from.first_name}!\n\n🤖 Я Felix - AI-ассистент с самообучением.\n\n✨ Я адаптируюсь под ваш стиль общения и запоминаю ваши интересы.\n\n📱 Откройте Mini App для полного функционала!`, buttons);
                return res.json({ ok: true });
            }

            // /help
            if (cmd === '/help') {
                const buttons = [[{text: '🤖 AI Команды', callback_data: 'ai_cmds'}], [{text: '👤 Профиль', callback_data: 'profile'}, {text: '📊 Статистика', callback_data: 'stats'}], [{text: '📱 Mini App', web_app: {url: 'https://felix-black.vercel.app/miniapp/'}}]];
                await send(chatId, '📚 <b>Felix Bot v5.0</b>\n\nВыберите раздел:', buttons);
                return res.json({ ok: true });
            }

            // /profile
            if (cmd === '/profile') {
                const emoji = user.style === 'formal' ? '🎩' : '😎';
                let msg = `👤 <b>Ваш профиль обучения</b>\n\n📊 Прогресс: ${user.score}%\n💬 Сообщений: ${user.msgs}\n${emoji} Стиль: ${user.style}`;
                if (user.topics.size > 0) {
                    const top = [...user.topics.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
                    msg += '\n\n🎯 <b>Интересы:</b>\n' + top.map(([t, c]) => `• ${t} (${c})`).join('\n');
                }
                const buttons = [[{text: '📱 Mini App', web_app: {url: 'https://felix-black.vercel.app/miniapp/'}}]];
                await send(chatId, msg, buttons);
                return res.json({ ok: true });
            }

            // /stats
            if (cmd === '/stats') {
                const buttons = [[{text: '📱 Mini App', web_app: {url: 'https://felix-black.vercel.app/miniapp/'}}]];
                await send(chatId, `📊 <b>Статистика</b>\n\n💬 Сообщений: ${user.msgs}\n⚡ Команд: ${user.cmds.size}\n🎯 Тем: ${user.topics.size}\n📈 Прогресс: ${user.score}%`, buttons);
                return res.json({ ok: true });
            }

            // /groupstats (только для групп)
            if (cmd === '/groupstats' && isGroup) {
                const g = getGroup(chatId);
                const top = [...g.top.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
                let msg = `📊 <b>Статистика группы</b>\n\n💬 Сообщений: ${g.msgs}\n👥 Участников: ${g.users.size}`;
                if (top.length > 0) {
                    msg += '\n\n🏆 <b>Топ активных:</b>\n' + top.map(([id, c], i) => `${i + 1}. ID ${id}: ${c} сообщений`).join('\n');
                }
                await send(chatId, msg);
                return res.json({ ok: true });
            }

            // /admin - только для администратора
            if (cmd === '/admin') {
                if (userId !== ADMIN_ID) {
                    await send(chatId, '❌ Доступ запрещен. Эта команда доступна только администратору.');
                    return res.json({ ok: true });
                }
                const buttons = [[{text: '🔐 Открыть Admin Panel', web_app: {url: 'https://felix-black.vercel.app/miniapp/admin.html'}}]];
                await send(chatId, '🔐 <b>Admin Panel</b>\n\nДобро пожаловать, администратор!\n\nВы можете управлять:\n• 📝 Заявками на партнерство\n• 🎓 Курсами академии\n• 🤝 Партнерами\n\nНажмите кнопку ниже для доступа:', buttons);
                return res.json({ ok: true });
            }

            // AI Commands
            if (cmd === '/ask' && arg) {
                const resp = await ai(arg, userId);
                await send(chatId, `💬 <b>Ответ:</b>\n\n${resp}`);
                return res.json({ ok: true });
            }

            if (cmd === '/summary' && arg) {
                const resp = await ai(`Сделай краткое содержание этого текста: ${arg}`, userId);
                await send(chatId, `📝 <b>Краткое содержание:</b>\n\n${resp}`);
                return res.json({ ok: true });
            }

            if (cmd === '/analyze' && arg) {
                const resp = await ai(`Проанализируй этот текст и определи тональность: ${arg}`, userId);
                await send(chatId, `🔍 <b>Анализ:</b>\n\n${resp}`);
                return res.json({ ok: true });
            }

            if (cmd === '/generate' && arg) {
                const resp = await ai(`Сгенерируй контент на тему: ${arg}`, userId);
                await send(chatId, `✨ <b>Сгенерировано:</b>\n\n${resp}`);
                return res.json({ ok: true });
            }

            if (cmd === '/translate' && arg) {
                const resp = await ai(`Переведи этот текст на английский: ${arg}`, userId);
                await send(chatId, `🌐 <b>Перевод:</b>\n\n${resp}`);
                return res.json({ ok: true });
            }

            if (cmd === '/improve' && arg) {
                const resp = await ai(`Улучши этот текст, сделай его более профессиональным: ${arg}`, userId);
                await send(chatId, `✍️ <b>Улучшенный текст:</b>\n\n${resp}`);
                return res.json({ ok: true });
            }

            if (cmd === '/brainstorm' && arg) {
                const resp = await ai(`Сгенерируй 5 креативных идей на тему: ${arg}`, userId);
                await send(chatId, `💡 <b>Идеи:</b>\n\n${resp}`);
                return res.json({ ok: true });
            }

            if (cmd === '/explain' && arg) {
                const resp = await ai(`Объясни простыми словами: ${arg}`, userId);
                await send(chatId, `📖 <b>Объяснение:</b>\n\n${resp}`);
                return res.json({ ok: true });
            }

            // Unknown command
            const buttons = [[{text: '📚 Помощь', callback_data: 'help'}]];
            await send(chatId, '❓ Неизвестная команда. Нажмите "Помощь" для списка команд.', buttons);
            return res.json({ ok: true });
        }

        // Regular message - AI response
        const resp = await ai(text, userId);
        await send(chatId, resp);
        return res.json({ ok: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ error: 'Internal error' });
    }
}
