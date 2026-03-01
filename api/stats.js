export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    // Return zeros for now - will work after DB setup
    return res.status(200).json({
      ok: true,
      total_messages: 0,
      user_messages: 0,
      bot_messages: 0,
      voice_messages: 0,
      first_message_at: null,
      last_message_at: null
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
