// Analytics API Endpoint
// Получение статистики использования бота

import analytics from '../lib/analytics.js';

export default async function handler(req, res) {
  // Только GET запросы
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, type = 'overall' } = req.query;

    // Статистика конкретного пользователя
    if (type === 'user' && userId) {
      const userStats = analytics.getUserStats(parseInt(userId));
      
      if (!userStats) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        ok: true,
        userId: parseInt(userId),
        stats: userStats
      });
    }

    // Общая статистика
    if (type === 'overall') {
      const stats = analytics.getOverallStats();
      
      return res.status(200).json({
        ok: true,
        stats
      });
    }

    // Экспорт всех метрик
    if (type === 'export') {
      const data = analytics.export();
      
      return res.status(200).json({
        ok: true,
        data
      });
    }

    return res.status(400).json({ error: 'Invalid type parameter' });

  } catch (error) {
    console.error('Analytics API error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
}
