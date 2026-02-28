import { aiService } from '../services/aiService.js';
import { dbService } from '../services/dbService.js';
import { telegramService } from '../services/telegramService.js';
import { logger } from '../middleware/logger.js';

export async function handleTextMessage(message, user) {
  const { chat, text } = message;
  const chatId = chat.id;
  const userId = user.id;

  try {
    // Save user message
    await dbService.saveMessage(userId, 'user', text);
    
    // Get conversation history
    const history = await dbService.getHistory(userId, 10);
    
    // Show typing indicator
    await telegramService.sendTyping(chatId);
    
    // Get AI response with context
    const aiResponse = await aiService.getChatResponse(text, history);
    
    // Save assistant response
    await dbService.saveMessage(userId, 'assistant', aiResponse);
    
    // Send response
    await telegramService.sendMessage(chatId, aiResponse);
    
    logger.info('Message handled successfully', { userId, chatId });
  } catch (error) {
    logger.error('Error handling message', { error, userId, chatId });
    throw error;
  }
}
