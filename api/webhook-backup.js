import Groq from 'groq-sdk';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8623255560:AAE7sC-7-eWA5LD-ebATDUh6nGUG0pYm03U';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
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
        content: '╨в╤Л Felix - ╤Г╨╝╨╜╤Л╨╣ AI-╨░╤Б╤Б╨╕╤Б╤В╨╡╨╜╤В. ╨Я╨╛╨╝╨╛╨│╨░╨╡╤И╤М ╨╛╤А╨│╨░╨╜╨╕╨╖╨╛╨▓╤Л╨▓╨░╤В╤М ╨╕╨╜╤Д╨╛╤А╨╝╨░╤Ж╨╕╤О, ╨╛╤В╨▓╨╡╤З╨░╨╡╤И╤М ╨╜╨░ ╨▓╨╛╨┐╤А╨╛╤Б╤Л, ╤Б╤В╤А╤Г╨║╤В╤Г╤А╨╕╤А╤Г╨╡╤И╤М ╤В╨╡╨║╤Б╤В. ╨Ю╤В╨▓╨╡╤З╨░╨╣ ╨╜╨░ ╤А╤Г╤Б╤Б╨║╨╛╨╝ ╤П╨╖╤Л╨║╨╡, ╨▒╤Г╨┤╤М ╨┐╨╛╨╗╨╡╨╖╨╜╤Л╨╝ ╨╕ ╨┤╤А╤Г╨╢╨╡╨╗╤О╨▒╨╜╤Л╨╝.'
      },
      ...messages
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 2048
  });
  
  return completion.choices[0]?.message?.content || '╨Э╨╡ ╨╝╨╛╨│╤Г ╨╛╤В╨▓╨╡╤В╨╕╤В╤М';
}

async function organizeText(text) {
  const groq = new Groq({ apiKey: GROQ_API_KEY });
  
  const completion = await groq.chat.completions.create({
    messages: [
      { 
        role: 'system', 
        content: '╨в╤Л ╤Н╨║╤Б╨┐╨╡╤А╤В ╨┐╨╛ ╨╛╤А╨│╨░╨╜╨╕╨╖╨░╤Ж╨╕╨╕ ╤В╨╡╨║╤Б╤В╨░. ╨б╤В╤А╤Г╨║╤В╤Г╤А╨╕╤А╤Г╨╣ ╤В╨╡╨║╤Б╤В: ╨┤╨╛╨▒╨░╨▓╤М ╨╖╨░╨│╨╛╨╗╨╛╨▓╨║╨╕, ╤Б╨┐╨╕╤Б╨║╨╕, ╨▓╤Л╨┤╨╡╨╗╨╕ ╨║╨╗╤О╤З╨╡╨▓╤Л╨╡ ╨╝╨╛╨╝╨╡╨╜╤В╤Л. ╨б╨╛╤Е╤А╨░╨╜╨╕ ╨▓╤Б╤О ╨╕╨╜╤Д╨╛╤А╨╝╨░╤Ж╨╕╤О, ╨╜╨╛ ╤Б╨┤╨╡╨╗╨░╨╣ ╨╡╤С ╤З╨╕╤В╨░╨╡╨╝╨╛╨╣.'
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
    return res.status(200).send('Felix Bot v3.1 - Working! ЁЯдЦ');
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
        await sendMessage(chatId, 'ЁЯТм ╨Ю╤В╨╗╨╕╤З╨╜╨╛! ╨Э╨░╨┐╨╕╤И╨╕ ╨╝╨╜╨╡ ╤З╤В╨╛-╨╜╨╕╨▒╤Г╨┤╤М ╨╕╨╗╨╕ ╨╛╤В╨┐╤А╨░╨▓╤М ╨│╨╛╨╗╨╛╤Б╨╛╨▓╨╛╨╡ ╤Б╨╛╨╛╨▒╤Й╨╡╨╜╨╕╨╡.');
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
          [{ text: 'ЁЯУ▒ ╨Ю╤В╨║╤А╤Л╤В╤М Mini App', web_app: { url: 'https://felix-black.vercel.app/miniapp/' } }],
          [
            { text: 'ЁЯТм ╨Э╨░╤З╨░╤В╤М ╨┤╨╕╨░╨╗╨╛╨│', callback_data: 'start_chat' }
          ]
        ]
      };

      await sendMessage(chatId, `ЁЯСЛ ╨Я╤А╨╕╨▓╨╡╤В! ╨п <b>Felix</b> - ╤В╨▓╨╛╨╣ ╤Г╨╝╨╜╤Л╨╣ AI-╨░╤Б╤Б╨╕╤Б╤В╨╡╨╜╤В

<b>ЁЯОп ╨з╤В╨╛ ╤П ╤Г╨╝╨╡╤О:</b>
тАв ЁЯТм ╨Ю╤В╨▓╨╡╤З╨░╤О ╨╜╨░ ╨▓╨╛╨┐╤А╨╛╤Б╤Л ╤Б ╨║╨╛╨╜╤В╨╡╨║╤Б╤В╨╛╨╝ ╨┤╨╕╨░╨╗╨╛╨│╨░
тАв ЁЯОд ╨а╨░╤Б╨┐╨╛╨╖╨╜╨░╤О ╨│╨╛╨╗╨╛╤Б╨╛╨▓╤Л╨╡ ╤Б╨╛╨╛╨▒╤Й╨╡╨╜╨╕╤П
тАв ЁЯУЭ ╨Ю╤А╨│╨░╨╜╨╕╨╖╤Г╤О ╨╕ ╤Б╤В╤А╤Г╨║╤В╤Г╤А╨╕╤А╤Г╤О ╤В╨╡╨║╤Б╤В

<b>ЁЯУЭ ╨Ъ╨╛╨╝╨░╨╜╨┤╤Л:</b>
/organize - ╤Б╤В╤А╤Г╨║╤В╤Г╤А╨╕╤А╨╛╨▓╨░╤В╤М ╤В╨╡╨║╤Б╤В
/clear - ╨╛╤З╨╕╤Б╤В╨╕╤В╤М ╨╕╤Б╤В╨╛╤А╨╕╤О

╨Я╤А╨╛╤Б╤В╨╛ ╨╜╨░╨┐╨╕╤И╨╕ ╨╝╨╜╨╡ ╤З╤В╨╛-╨╜╨╕╨▒╤Г╨┤╤М ╨╕╨╗╨╕ ╨╛╤В╨┐╤А╨░╨▓╤М ╨│╨╛╨╗╨╛╤Б╨╛╨▓╨╛╨╡!`, { reply_markup: keyboard });

      return res.status(200).json({ ok: true });
    }

    // Handle /organize command
    if (text.startsWith('/organize ')) {
      const textToOrganize = text.replace('/organize ', '');
      
      await sendMessage(chatId, 'тП│ ╨Ю╤А╨│╨░╨╜╨╕╨╖╤Г╤О ╤В╨╡╨║╤Б╤В...');
      
      const organized = await organizeText(textToOrganize);
      
      await sendMessage(chatId, `ЁЯУЭ <b>╨Ю╤А╨│╨░╨╜╨╕╨╖╨╛╨▓╨░╨╜╨╜╤Л╨╣ ╤В╨╡╨║╤Б╤В:</b>\n\n${organized}`);
      
      return res.status(200).json({ ok: true });
    }

    // Handle /clear command
    if (text === '/clear') {
      conversations.set(userId, []);
      await sendMessage(chatId, 'ЁЯЧС ╨Ш╤Б╤В╨╛╤А╨╕╤П ╨┤╨╕╨░╨╗╨╛╨│╨╛╨▓ ╨╛╤З╨╕╤Й╨╡╨╜╨░');
      return res.status(200).json({ ok: true });
    }

    // Handle voice messages
    if (voice) {
      await sendMessage(chatId, 'ЁЯОд ╨а╨░╤Б╨┐╨╛╨╖╨╜╨░╤О ╨│╨╛╨╗╨╛╤Б╨╛╨▓╨╛╨╡ ╤Б╨╛╨╛╨▒╤Й╨╡╨╜╨╕╨╡...');
      
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
        
        await sendMessage(chatId, `ЁЯОд <b>╨а╨░╤Б╨┐╨╛╨╖╨╜╨░╨╜╨╛:</b> ${transcription}\n\nЁЯТм <b>╨Ю╤В╨▓╨╡╤В:</b>\n${aiResponse}`);
      } catch (error) {
        console.error('Voice error:', error);
        await sendMessage(chatId, `тЭМ ╨Ю╤И╨╕╨▒╨║╨░ ╨┐╤А╨╕ ╨╛╨▒╤А╨░╨▒╨╛╤В╨║╨╡ ╨│╨╛╨╗╨╛╤Б╨╛╨▓╨╛╨│╨╛ ╤Б╨╛╨╛╨▒╤Й╨╡╨╜╨╕╤П: ${error.message}`);
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

