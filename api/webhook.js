import Groq from 'groq-sdk';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export default async function handler(req, res) {
  // Handle GET requests
  if (req.method === 'GET') {
    return res.status(200).send('Felix Bot v2.0 is running! 🤖');
  }

  // Handle POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat?.id;
    const text = message.text || '';

    if (!chatId) {
      return res.status(200).json({ ok: true });
    }

    const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

    // Handle /start command
    if (text === '/start') {
      const keyboard = {
        inline_keyboard: [
          [{ text: '📱 Открыть Mini App', web_app: { url: 'https://felix-black.vercel.app/miniapp/' } }],
          [{ text: '💬 Начать диалог', callback_data: 'start_chat' }]
        ]
      };

      await fetch(`${API_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Привет! Я Felix - твой умный ассистент 🤖

<b>Что я умею:</b>
• 💬 Отвечаю на вопросы с помощью AI
• 📱 Mini App для удобного интерфейса

Просто напиши мне что-нибудь!`,
          parse_mode: 'HTML',
          reply_markup: keyboard
        })
      });

      return res.status(200).json({ ok: true });
    }

    // Handle text messages with AI
    if (text && !text.startsWith('/')) {
      const groq = new Groq({ apiKey: GROQ_API_KEY });
      
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'Ты Felix - умный ассистент. Отвечай кратко на русском.' },
          { role: 'user', content: text }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024
      });

      const aiResponse = completion.choices[0]?.message?.content || 'Не могу ответить';

      await fetch(`${API_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: aiResponse,
          parse_mode: 'HTML'
        })
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    return res.status(200).json({ ok: true });
  }
}
