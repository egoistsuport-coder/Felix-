// Temporary in-memory storage
const conversations = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    // Return empty for now - will work after DB setup
    return res.status(200).json({
      ok: true,
      messages: []
    });
  } catch (error) {
    console.error('History API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
