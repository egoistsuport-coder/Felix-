import { searchService } from '../lib/search.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, query, filters, search_type, limit, offset } = req.body;

    if (!user_id || !query) {
      return res.status(400).json({ error: 'user_id and query are required' });
    }

    const userId = parseInt(user_id);
    const searchFilters = {
      ...filters,
      limit: limit || 20,
      offset: offset || 0
    };

    const searchType = search_type || 'fulltext';

    let result;
    if (searchType === 'semantic') {
      result = await searchService.semanticSearch(userId, query, searchFilters);
    } else {
      result = await searchService.fulltextSearch(userId, query, searchFilters);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in search API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
