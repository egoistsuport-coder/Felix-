import { db } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, limit, offset, type, from_date, to_date } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const userId = parseInt(user_id);
    const options = {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      type: type || null,
      fromDate: from_date || null,
      toDate: to_date || null
    };

    const result = await db.getHistory(userId, options);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in history API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
