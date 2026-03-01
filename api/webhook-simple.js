import Groq from 'groq-sdk';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// In-memory storage (temporary until DB is set up)
const conversations = new Map();

async function sendMessage(chatId, text, options = {}) {
  await fetch(`${API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options
    })
  });
}

async function downloadVoiceFile(fileId) {
  const fileResponse = await fetch(`${API_URL}/getFile?file_id=${fileId}`);
  const fileData = await fileResponse.json();
  
  if (!fileData.ok) throw new Error('Failed to get file');
  
  const filePath = fileData.result.file_path;
  const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
  
  const audioResponse = await fetch(fileUrl);
  const audioBuffer = await audioResponse.arrayBuffer();
  
  return Buffer.from(audioBuffer);
}

async function transcribeVoice(audioBuffer) {
  const groq = new Groq({ apiKey: GROQ_API_KEY });
  
  const file = new File([audioBuffer], 'voice.ogg', { type: 'audio/ogg' });
  
  const transcription = await groq.audio.transcriptions.create({
    file: file,
    model: 'whisper-large-v3',
    language: 'ru'
  });
  
  return transcription.text;
}

async function getAIResponse(messages) {
  const groq = new Groq({ apiKey: GROQ_API_KEY });
  
  const completion = await groq.chat.completions.create({
    messages: [
      { 
        role: 'system', 
        content: 'Ты Felix - умный AI-ассистент. Помогаешь организовывать информацию, отвечаешь на вопросы, структурируешь текст. Отвечай на русском языке, будь полезным и дружелюбным.'
      },
      ...messages
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 2048
  });
  
  return completion.choices[0]?.message?.content || 'Не могу ответить';
}

async function organizeText(text) {
  const groq = new Groq({ apiKey: GROQ_API_KEY });
  
  const completion = await groq.chat.completions.create({
    messages: [
      { 
        role: 'system', 
        content: 'Ты эксперт по организации текста. Структурируй текст: добавь заголовки, списки, выдели ключевые моменты. Сохрани всю информацию, но сделай её читаемой.'
      },
      { role: 'user', content: text }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 2048
  });
  
  return completion.choices[0]?.message?.content || text;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).send('Felix Bot v3.1 - Working! 🤖');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, callback_query } = req.body;
    
    // Handle callback queries
    if (callback_query) {
      const chatId = callback_query.message.chat.id;
      const data = callback_query.data;
      
      await fetch(`${API_URL}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callback_query.id })
      });
      
      if (data === 'start_chat') {
        await sendMessage(chatId, '💬 Отлично! Напиши мне что-нибудь или отправь голосовое сообщение.');
      }
      
      return res.status(200).json({ ok: true });
    }
    
    if (!message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat?.id;
    const userId = message.from?.id;
    const text = message.text || '';
    const voice = message.voice;

    if (!chatId || !userId) {
      return res.status(200).json({ ok: true });
    }

    // Initialize conversation history
    if (!conversations.has(userId)) {
      conversations.set(userId, []);
    }
    const history = conversations.get(userId);

    // Handle /start command
    if (text === '/start') {
      const keyboard = {
        inline_keyboard: [
          [{ text: '📱 Открыть Mini App', web_app: { url: 'https://felix-black.vercel.app/miniapp/' } }],
          [
            { text: '💬 Начать диалог', callback_data: 'start_chat' }
          ]
        ]
      };

      await sendMessage(chatId, `👋 Привет! Я <b>Felix</b> - твой умный AI-ассистент

<b>🎯 Что я умею:</b>
• 💬 Отвечаю на вопросы с контекстом диалога
• 🎤 Распознаю голосовые сообщения
• 📝 Организую и структурирую текст

<b>📝 Команды:</b>
/organize - структурировать текст
/clear - очистить историю

Просто напиши мне что-нибудь или отправь голосовое!`, { reply_markup: keyboard });

      return res.status(200).json({ ok: true });
    }

    // Handle /organize command
    if (text.startsWith('/organize ')) {
      const textToOrganize = text.replace('/organize ', '');
      
      await sendMessage(chatId, '⏳ Организую текст...');
      
      const organized = await organizeText(textToOrganize);
      
      await sendMessage(chatId, `📝 <b>Организованный текст:</b>\n\n${organized}`);
      
      return res.status(200).json({ ok: true });
    }

    // Handle /clear command
    if (text === '/clear') {
      conversations.set(userId, []);
      await sendMessage(chatId, '🗑 История диалогов очищена');
      return res.status(200).json({ ok: true });
    }

    // Handle voice messages
    if (voice) {
      await sendMessage(chatId, '🎤 Распознаю голосовое сообщение...');
      
      try {
        const audioBuffer = await downloadVoiceFile(voice.file_id);
        const transcription = await transcribeVoice(audioBuffer);
        
        history.push({ role: 'user', content: transcription });
        
        const aiResponse = await getAIResponse(history.slice(-10));
        
        history.push({ role: 'assistant', content: aiResponse });
        
        // Keep only last 20 messages
        if (history.length > 20) {
          conversations.set(userId, history.slice(-20));
        }
        
        await sendMessage(chatId, `🎤 <b>Распознано:</b> ${transcription}\n\n💬 <b>Ответ:</b>\n${aiResponse}`);
      } catch (error) {
        console.error('Voice error:', error);
        await sendMessage(chatId, `❌ Ошибка при обработке голосового сообщения: ${error.message}`);
      }
      
      return res.status(200).json({ ok: true });
    }

    // Handle text messages with context
    if (text && !text.startsWith('/')) {
      history.push({ role: 'user', content: text });
      
      const aiResponse = await getAIResponse(history.slice(-10));
      
      history.push({ role: 'assistant', content: aiResponse });
      
      // Keep only last 20 messages
      if (history.length > 20) {
        conversations.set(userId, history.slice(-20));
      }
      
      await sendMessage(chatId, aiResponse);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    return res.status(200).json({ ok: true });
  }
}
