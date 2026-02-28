import { logger } from './logger.js';
import { telegramService } from '../services/telegramService.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DatabaseError extends AppError {
  constructor(message) {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

export class AIError extends AppError {
  constructor(message) {
    super(message, 503);
    this.name = 'AIError';
  }
}

export class TelegramError extends AppError {
  constructor(message) {
    super(message, 502);
    this.name = 'TelegramError';
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export async function handleError(error, context = {}) {
  const { chatId, userId } = context;

  // Log error
  logger.error('Application error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context
  });

  // Send to monitoring (Sentry, etc.)
  if (process.env.SENTRY_DSN) {
    // Sentry.captureException(error, { extra: context });
  }

  // Notify user
  if (chatId) {
    const userMessage = getUserFriendlyMessage(error);
    try {
      await telegramService.sendMessage(chatId, userMessage);
    } catch (telegramError) {
      logger.error('Failed to send error message to user', { telegramError });
    }
  }

  // Save to database
  if (userId) {
    try {
      // await dbService.saveError(userId, error);
    } catch (dbError) {
      logger.error('Failed to save error to database', { dbError });
    }
  }
}

function getUserFriendlyMessage(error) {
  if (error instanceof ValidationError) {
    return `❌ ${error.message}`;
  }
  
  if (error instanceof AIError) {
    return '❌ Ошибка при обработке запроса к AI. Попробуйте еще раз через несколько секунд.';
  }
  
  if (error instanceof DatabaseError) {
    return '❌ Ошибка базы данных. Мы уже работаем над исправлением.';
  }
  
  if (error instanceof TelegramError) {
    return '❌ Ошибка при отправке сообщения. Попробуйте еще раз.';
  }
  
  return '❌ Произошла ошибка. Попробуйте еще раз или обратитесь в поддержку.';
}

export function wrapAsync(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (error) {
      await handleError(error, {
        chatId: req.body?.message?.chat?.id,
        userId: req.body?.message?.from?.id
      });
      
      // Always return 200 to Telegram
      res.status(200).json({ ok: true });
    }
  };
}
