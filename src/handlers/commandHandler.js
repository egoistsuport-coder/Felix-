import { dbService } from '../services/dbService.js';
import { telegramService } from '../services/telegramService.js';
import { aiService } from '../services/aiService.js';
import { logger } from '../middleware/logger.js';

const COMMANDS = {
  START: '/start',
  CLEAR: '/clear',
  STATS: '/stats',
  SUMMARY: '/summary',
  HELP: '/help'
};

export async function handleCommand(message, user) {
  const { chat, text } = message;
  const chatId = chat.id;
  const userId = user.id;

  try {
    switch (text) {
      case COMMANDS.START:
        await handleStartCommand(chatId, user);
        break;
      case COMMANDS.CLEAR:
        await handleClearCommand(chatId, userId);
        break;
      case COMMANDS.STATS:
        await handleStatsCommand(chatId, userId);
        break;
      case COMMANDS.SUMMARY:
        await handleSummaryCommand(chatId, userId);
        break;
      case COMMANDS.HELP:
        await handleHelpCommand(chatId);
        break;
      default:
        await telegramService.sendMessage(chatId, 'Неизвестная команда. Используйте /help');
    }
    
    logger.info('Command handled', { command: text, userId });
  } catch (error) {
    logger.error('Error handling command', { error, command: text, userId });
    throw error;
  }
}

async function handleStartCommand(chatId, user) {
  const keyboard = telegramService.createKeyboard([
    [
      { text: '📱 Открыть Mini App', web_app: { url: process.env.MINIAPP_URL || 'https://felix-black.vercel.app/miniapp/' } }
    ],
    [
      { text: '📊 Статистика', callback_data: 'get_stats' },
      { text: '📝 Саммари', callback_data: 'get_summary' }
    ],
    [
      { text: '🗑 Очистить историю', callback_data: 'clear_history' }
    ]
  ]);

  const welcomeText = `Привет, ${user.first_name}! Я Felix - твой умный ассистент 🤖

<b>Что я умею:</b>
• 💬 Отвечаю на вопросы с помощью AI
• 🧠 Помню контекст диалога
• 🎤 Транскрибирую голосовые сообщения
• 📝 Создаю саммари диалогов
• 📱 Mini App для удобного просмотра истории

<b>Команды:</b>
/start - это сообщение
/clear - очистить историю
/stats - статистика
/summary - саммари диалога
/help - справка

Просто напиши мне что-нибудь или отправь голосовое!`;

  await telegramService.sendMessage(chatId, welcomeText, { replyMarkup: keyboard });
}

async function handleClearCommand(chatId, userId) {
  await dbService.clearHistory(userId);
  await telegramService.sendMessage(chatId, '✅ История диалога очищена!');
}

async function handleStatsCommand(chatId, userId) {
  const stats = await dbService.getUserStats(userId);
  
  const statsText = `📊 <b>Твоя статистика:</b>

💬 Всего сообщений: ${stats.total_messages || 0}
👤 Твоих: ${stats.user_messages || 0}
🤖 Моих: ${stats.bot_messages || 0}
🎤 Голосовых: ${stats.voice_messages || 0}
📅 Первое сообщение: ${stats.first_message_at ? new Date(stats.first_message_at).toLocaleDateString('ru') : 'Нет данных'}
🕐 Последнее: ${stats.last_message_at ? new Date(stats.last_message_at).toLocaleDateString('ru') : 'Нет данных'}`;

  await telegramService.sendMessage(chatId, statsText);
}

async function handleSummaryCommand(chatId, userId) {
  const history = await dbService.getHistory(userId, 50);
  
  if (history.length === 0) {
    await telegramService.sendMessage(chatId, 'История пуста. Напиши мне что-нибудь!');
    return;
  }

  await telegramService.sendTyping(chatId);
  const summary = await aiService.createSummary(history);
  await telegramService.sendMessage(chatId, `📝 <b>Саммари диалога:</b>\n\n${summary}`);
}

async function handleHelpCommand(chatId) {
  const helpText = `ℹ️ <b>Справка по Felix Bot</b>

<b>Команды:</b>
/start - главное меню
/clear - очистить историю диалога
/stats - показать статистику
/summary - создать саммари диалога
/help - эта справка

<b>Возможности:</b>
• Отправь текстовое сообщение - получишь AI-ответ с учетом контекста
• Отправь голосовое - получишь транскрипцию и ответ
• Используй кнопки для быстрого доступа к функциям
• Открой Mini App для просмотра полной истории

<b>Технологии:</b>
• AI: Groq LLaMA 3.3 70B
• Транскрибация: Groq Whisper Large v3
• База данных: PostgreSQL
• Хостинг: Vercel Serverless`;

  await telegramService.sendMessage(chatId, helpText);
}
