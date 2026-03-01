import { db } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, period } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const userId = parseInt(user_id);
    const statsPeriod = period || 'all';

    const stats = await db.getUserStats(userId, statsPeriod);

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error in stats API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
