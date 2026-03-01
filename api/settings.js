import { db } from '../lib/db.js';

export default async function handler(req, res) {
  try {
    const { user_id } = req.method === 'GET' ? req.query : req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const userId = parseInt(user_id);

    if (req.method === 'GET') {
      // Get settings
      const settings = await db.getUserSettings(userId);
      return res.status(200).json(settings);
    } else if (req.method === 'PUT') {
      // Update settings
      const { ai_temperature, ai_model, theme, notifications_enabled } = req.body;

      // Validate temperature
      if (ai_temperature !== undefined) {
        const temp = parseFloat(ai_temperature);
        if (temp < 0 || temp > 2) {
          return res.status(400).json({ error: 'Temperature must be between 0 and 2' });
        }
      }

      const settings = await db.updateUserSettings(userId, {
        ai_temperature,
        ai_model,
        theme,
        notifications_enabled
      });

      return res.status(200).json({
        success: true,
        settings
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in settings API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
