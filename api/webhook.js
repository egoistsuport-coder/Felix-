export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).send('Bot is running!');
  }

  if (req.method === 'POST') {
    try {
      const update = req.body;
      const message = update.message || {};
      const chatId = message.chat?.id;
      const text = message.text || '';

      // Send response back to Telegram
      return res.status(200).json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `Привет! Ты написал: ${text}\n\nБот работает! 🎉`
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
