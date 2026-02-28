import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  return response.json();
}

async function getAIResponse(userMessage) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Ты умный ассистент Felix. Отвечай кратко и по делу на русском языке.'
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024
    });
    
    return completion.choices[0]?.message?.content || 'Не могу ответить';
  } catch (error) {
    console.error('Groq API error:', error);
    return 'Ошибка при обработке запроса';
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).send('Felix Bot is running! 🤖');
  }

  if (req.method === 'POST') {
    try {
      const update = req.body;
      const message = update.message || {};
      const chatId = message.chat?.id;
      const text = message.text || '';
      const voice = message.voice;

      if (!chatId) {
        return res.status(200).json({ ok: true });
      }

      // Handle voice messages
      if (voice) {
        await sendMessage(chatId, '🎤 Получил голосовое сообщение! Транскрибация скоро будет добавлена.');
        return res.status(200).json({ ok: true });
      }

      // Handle commands
      if (text === '/start') {
        const welcomeText = `Привет! Я Felix - твой умный ассистент 🤖

Что я умею:
• 💬 Отвечаю на вопросы с помощью AI
• 🎤 Транскрибирую голосовые (скоро)
• 📝 Создаю саммари (скоро)

Просто напиши мне что-нибудь!`;
        await sendMessage(chatId, welcomeText);
        return res.status(200).json({ ok: true });
      }

      // Get AI response
      const aiResponse = await getAIResponse(text);
      await sendMessage(chatId, aiResponse);

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error:', error);
      return res.status(200).json({ ok: true });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
