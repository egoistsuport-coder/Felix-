import Groq from 'groq-sdk';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// In-memory storage
const conversations = new Map();
const userSettings = new Map();

const groq = new Groq({ apiKey: GROQ_API_KEY });

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

async function transcribeVoice(audioBuffer, language = 'ru') {
  const file = new File([audioBuffer], 'voice.ogg', { type: 'audio/ogg' });
  
  const transcription = await groq.audio.transcriptions.create({
    file: file,
    model: 'whisper-large-v3',
    language: language
  });
  
  return transcription.text;
}

async function getAIResponse(messages, settings = {}) {
  const { temperature = 0.7, model = 'llama-3.3-70b-versatile' } = settings;
  
  const completion = await groq.chat.completions.create({
    messages: [
      { 
        role: 'system', 
        content: 'Ты Felix - умный AI-ассистент. Помогаешь организовывать информацию, отвечаешь на вопросы, структурируешь текст. Отвечай на русском языке, будь полезным и дружелюбным.'
      },
      ...messages
    ],
    model,
    temperature,
    max_tokens: 2048
  });
  
  return completion.choices[0]?.message?.content || 'Не могу ответить';
}

async function organizeText(text) {
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

async function createSummary(messages) {
  const text = messages
    .map(m => `${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${m.content}`)
    .join('\n\n');

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Создай краткое саммари диалога с основными темами, решениями и важными моментами.'
      },
      {
        role: 'user',
        content: text.substring(0, 8000)
      }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 1024
  });

  return completion.choices[0]?.message?.content;
}

async function analyzeText(text) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Проанализируй текст: определи тональность, ключевые слова, темы, читаемость и язык. Верни результат в структурированном формате.'
      },
      {
        role: 'user',
        content: text.substring(0, 2000)
      }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    max_tokens: 512
  });

  return completion.choices[0]?.message?.content;
}

async function generateContent(prompt, contentType = 'article') {
  const templates = {
    article: `Напиши статью на тему: "${prompt}".`,
    email: `Напиши email на тему: "${prompt}".`,
    social: `Напиши пост для соцсетей на тему: "${prompt}".`,
    code: `Напиши код для: "${prompt}". Добавь комментарии.`,
    ideas: `Сгенерируй список идей на тему: "${prompt}".`
  };

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Ты профессиональный копирайтер и генератор контента.'
      },
      {
        role: 'user',
        content: templates[contentType] || templates.article
      }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 1024
  });

  return completion.choices[0]?.message?.content;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).send('Felix Bot v4.0 Simple - Working! 🤖');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, callback_query } = req.body;
    
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

    // Initialize user settings
    if (!userSettings.has(userId)) {
      userSettings.set(userId, { temperature: 0.7, model: 'llama-3.3-70b-versatile' });
    }
    const settings = userSettings.get(userId);

    // Handle /start command
    if (text === '/start') {
      const keyboard = {
        inline_keyboard: [
          [{ text: '📱 Открыть Mini App', web_app: { url: 'https://felix-black.vercel.app/miniapp/' } }],
          [{ text: '💬 Начать диалог', callback_data: 'start_chat' }]
        ]
      };

      await sendMessage(chatId, `👋 Привет! Я <b>Felix</b> - твой умный AI-ассистент

<b>🎯 Что я умею:</b>
• 💬 Отвечаю на вопросы с контекстом диалога
• 🎤 Распознаю голосовые сообщения
• 📝 Организую и структурирую текст
• 📊 Создаю саммари диалогов
• 🔍 Анализирую тексты
• ✨ Генерирую контент

<b>📝 Команды:</b>
/organize <текст> - структурировать текст
/summary - создать саммари диалога
/analyze <текст> - анализ текста
/generate <промпт> - генерация контента
/clear - очистить историю

Просто напиши мне что-нибудь или отправь голосовое!`, { reply_markup: keyboard });

      return res.status(200).json({ ok: true });
    }

    // Handle /organize command
    if (text.startsWith('/organize ')) {
      const textToOrganize = text.replace('/organize ', '');
      
      if (!textToOrganize) {
        await sendMessage(chatId, 'Используйте: /organize <текст>');
        return res.status(200).json({ ok: true });
      }
      
      await sendMessage(chatId, '⏳ Организую текст...');
      
      const organized = await organizeText(textToOrganize);
      
      await sendMessage(chatId, `📝 <b>Организованный текст:</b>\n\n${organized}`);
      
      return res.status(200).json({ ok: true });
    }

    // Handle /summary command
    if (text.startsWith('/summary')) {
      if (history.length < 5) {
        await sendMessage(chatId, '❌ Недостаточно сообщений для создания саммари (минимум 5)');
        return res.status(200).json({ ok: true });
      }
      
      await sendMessage(chatId, '⏳ Создаю саммари...');
      
      try {
        const summary = await createSummary(history.slice(-20));
        await sendMessage(chatId, `📊 <b>Саммари диалога:</b>\n\n${summary}`);
      } catch (error) {
        console.error('Summary error:', error);
        await sendMessage(chatId, '❌ Ошибка при создании саммари');
      }
      
      return res.status(200).json({ ok: true });
    }

    // Handle /analyze command
    if (text.startsWith('/analyze ')) {
      const textToAnalyze = text.replace('/analyze ', '');
      
      if (!textToAnalyze || textToAnalyze.split(/\s+/).length < 10) {
        await sendMessage(chatId, 'Используйте: /analyze <текст> (минимум 10 слов)');
        return res.status(200).json({ ok: true });
      }
      
      await sendMessage(chatId, '⏳ Анализирую текст...');
      
      try {
        const analysis = await analyzeText(textToAnalyze);
        await sendMessage(chatId, `🔍 <b>Анализ текста:</b>\n\n${analysis}`);
      } catch (error) {
        console.error('Analysis error:', error);
        await sendMessage(chatId, '❌ Ошибка при анализе текста');
      }
      
      return res.status(200).json({ ok: true });
    }

    // Handle /generate command
    if (text.startsWith('/generate ')) {
      const prompt = text.replace('/generate ', '');
      
      if (!prompt) {
        await sendMessage(chatId, 'Используйте: /generate <промпт>');
        return res.status(200).json({ ok: true });
      }
      
      await sendMessage(chatId, '⏳ Генерирую контент...');
      
      try {
        const generated = await generateContent(prompt);
        await sendMessage(chatId, `✨ <b>Сгенерированный контент:</b>\n\n${generated}`);
      } catch (error) {
        console.error('Generation error:', error);
        await sendMessage(chatId, '❌ Ошибка при генерации контента');
      }
      
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
        
        const aiResponse = await getAIResponse(history.slice(-10), settings);
        
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
      
      const aiResponse = await getAIResponse(history.slice(-10), settings);
      
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
