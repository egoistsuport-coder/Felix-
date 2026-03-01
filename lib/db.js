import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = {
  // Get or create user
  async getOrCreateUser(telegramUser) {
    const { id, username, first_name, last_name, language_code } = telegramUser;
    const language = language_code === 'en' ? 'en' : 'ru';
    
    const result = await pool.query(
      `INSERT INTO users (id, username, first_name, last_name, language)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
       SET username = $2, first_name = $3, last_name = $4, updated_at = NOW()
       RETURNING *`,
      [id, username, first_name, last_name, language]
    );
    
    return result.rows[0];
  },

  // Save message with transaction
  async saveMessage(userId, role, content, messageType = 'text', metadata = {}) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `INSERT INTO messages (user_id, role, content, message_type, metadata)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, role, content, messageType, JSON.stringify(metadata)]
      );
      
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving message:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Get history with filters and pagination
  async getHistory(userId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      type = null,
      fromDate = null,
      toDate = null
    } = options;

    let query = `
      SELECT m.*, 
        COALESCE(
          json_agg(
            json_build_object('name', t.name, 'is_auto', mt.is_auto_generated)
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as tags
      FROM messages m
      LEFT JOIN message_tags mt ON m.id = mt.message_id
      LEFT JOIN tags t ON mt.tag_id = t.id
      WHERE m.user_id = $1
    `;
    
    const params = [userId];
    let paramCount = 1;

    if (type) {
      paramCount++;
      query += ` AND m.message_type = $${paramCount}`;
      params.push(type);
    }

    if (fromDate) {
      paramCount++;
      query += ` AND m.created_at >= $${paramCount}`;
      params.push(fromDate);
    }

    if (toDate) {
      paramCount++;
      query += ` AND m.created_at <= $${paramCount}`;
      params.push(toDate);
    }

    query += ` GROUP BY m.id ORDER BY m.created_at DESC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM messages WHERE user_id = $1`;
    const countParams = [userId];
    let countParamNum = 1;
    
    if (type) {
      countParamNum++;
      countQuery += ` AND message_type = $${countParamNum}`;
      countParams.push(type);
    }
    if (fromDate) {
      countParamNum++;
      countQuery += ` AND created_at >= $${countParamNum}`;
      countParams.push(fromDate);
    }
    if (toDate) {
      countParamNum++;
      countQuery += ` AND created_at <= $${countParamNum}`;
      countParams.push(toDate);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return {
      messages: result.rows,
      total,
      has_more: offset + limit < total
    };
  },

  // Get user stats with period filter
  async getUserStats(userId, period = 'all') {
    let dateFilter = '';
    
    if (period === 'day') {
      dateFilter = "AND created_at >= NOW() - INTERVAL '1 day'";
    } else if (period === 'week') {
      dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
    } else if (period === 'month') {
      dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
    }

    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN message_type = 'text' THEN 1 END) as text_messages,
        COUNT(CASE WHEN message_type = 'voice' THEN 1 END) as voice_messages,
        COUNT(CASE WHEN message_type = 'image' THEN 1 END) as image_messages,
        COUNT(CASE WHEN message_type = 'document' THEN 1 END) as document_messages,
        SUM((metadata->>'tokens')::int) FILTER (WHERE metadata->>'tokens' IS NOT NULL) as total_tokens,
        AVG((metadata->>'latency')::int) FILTER (WHERE metadata->>'latency' IS NOT NULL) as avg_response_time,
        MIN(created_at) as first_message,
        MAX(created_at) as last_message
      FROM messages
      WHERE user_id = $1 ${dateFilter}
    `, [userId]);

    // Get by command stats
    const commandResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN content LIKE '/organize%' THEN 1 END) as organize,
        COUNT(CASE WHEN content LIKE '/summary%' THEN 1 END) as summary,
        COUNT(CASE WHEN content LIKE '/analyze%' THEN 1 END) as analyze,
        COUNT(CASE WHEN content LIKE '/generate%' THEN 1 END) as generate
      FROM messages
      WHERE user_id = $1 AND role = 'user' ${dateFilter}
    `, [userId]);

    // Get by hour distribution
    const hourResult = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count
      FROM messages
      WHERE user_id = $1 ${dateFilter}
      GROUP BY hour
      ORDER BY hour
    `, [userId]);

    // Get by day distribution
    const dayResult = await pool.query(`
      SELECT 
        DATE(created_at) as day,
        COUNT(*) as count
      FROM messages
      WHERE user_id = $1 ${dateFilter}
      GROUP BY day
      ORDER BY day DESC
      LIMIT 30
    `, [userId]);

    return {
      ...result.rows[0],
      by_type: {
        text: parseInt(result.rows[0].text_messages) || 0,
        voice: parseInt(result.rows[0].voice_messages) || 0,
        image: parseInt(result.rows[0].image_messages) || 0,
        document: parseInt(result.rows[0].document_messages) || 0
      },
      by_command: commandResult.rows[0],
      by_hour: hourResult.rows,
      by_day: dayResult.rows,
      total_tokens: parseInt(result.rows[0].total_tokens) || 0,
      avg_response_time: parseInt(result.rows[0].avg_response_time) || 0
    };
  },

  // Save tags for message
  async saveTags(messageId, tags) {
    if (!tags || tags.length === 0) return;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const tagName of tags) {
        // Insert or get tag
        const tagResult = await client.query(
          `INSERT INTO tags (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = $1
           RETURNING id`,
          [tagName.toLowerCase()]
        );
        
        const tagId = tagResult.rows[0].id;

        // Link tag to message
        await client.query(
          `INSERT INTO message_tags (message_id, tag_id, is_auto_generated)
           VALUES ($1, $2, true)
           ON CONFLICT (message_id, tag_id) DO NOTHING`,
          [messageId, tagId]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving tags:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Get tags for user
  async getTagsForUser(userId) {
    const result = await pool.query(`
      SELECT t.name, COUNT(*) as count
      FROM tags t
      JOIN message_tags mt ON t.id = mt.tag_id
      JOIN messages m ON mt.message_id = m.id
      WHERE m.user_id = $1
      GROUP BY t.name
      ORDER BY count DESC
      LIMIT 50
    `, [userId]);

    return result.rows;
  },

  // Get user settings
  async getUserSettings(userId) {
    const result = await pool.query(
      `SELECT * FROM user_settings WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default settings
      const createResult = await pool.query(
        `INSERT INTO user_settings (user_id)
         VALUES ($1)
         RETURNING *`,
        [userId]
      );
      return createResult.rows[0];
    }

    return result.rows[0];
  },

  // Update user settings
  async updateUserSettings(userId, settings) {
    const {
      ai_temperature,
      ai_model,
      theme,
      notifications_enabled
    } = settings;

    const updates = [];
    const params = [userId];
    let paramCount = 1;

    if (ai_temperature !== undefined) {
      paramCount++;
      updates.push(`ai_temperature = $${paramCount}`);
      params.push(ai_temperature);
    }
    if (ai_model !== undefined) {
      paramCount++;
      updates.push(`ai_model = $${paramCount}`);
      params.push(ai_model);
    }
    if (theme !== undefined) {
      paramCount++;
      updates.push(`theme = $${paramCount}`);
      params.push(theme);
    }
    if (notifications_enabled !== undefined) {
      paramCount++;
      updates.push(`notifications_enabled = $${paramCount}`);
      params.push(notifications_enabled);
    }

    if (updates.length === 0) {
      return await this.getUserSettings(userId);
    }

    const query = `
      UPDATE user_settings
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, params);
    return result.rows[0];
  },

  // Save voice message metadata
  async saveVoiceMetadata(messageId, fileId, fileUrl, duration, fileSize, transcription, language) {
    const result = await pool.query(
      `INSERT INTO voice_messages 
       (message_id, file_id, file_url, duration, file_size, transcription, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [messageId, fileId, fileUrl, duration, fileSize, transcription, language]
    );

    return result.rows[0];
  },

  // Search messages
  async searchMessages(userId, query, filters = {}, searchType = 'fulltext') {
    const { type, tags, fromDate, toDate, limit = 20, offset = 0 } = filters;

    let sqlQuery = `
      SELECT m.*, 
        ts_rank(to_tsvector('russian', m.content), plainto_tsquery('russian', $2)) as relevance,
        COALESCE(
          json_agg(
            json_build_object('name', t.name)
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as tags
      FROM messages m
      LEFT JOIN message_tags mt ON m.id = mt.message_id
      LEFT JOIN tags t ON mt.tag_id = t.id
      WHERE m.user_id = $1
        AND to_tsvector('russian', m.content) @@ plainto_tsquery('russian', $2)
    `;

    const params = [userId, query];
    let paramCount = 2;

    if (type) {
      paramCount++;
      sqlQuery += ` AND m.message_type = $${paramCount}`;
      params.push(type);
    }

    if (fromDate) {
      paramCount++;
      sqlQuery += ` AND m.created_at >= $${paramCount}`;
      params.push(fromDate);
    }

    if (toDate) {
      paramCount++;
      sqlQuery += ` AND m.created_at <= $${paramCount}`;
      params.push(toDate);
    }

    sqlQuery += ` GROUP BY m.id ORDER BY relevance DESC`;
    
    paramCount++;
    sqlQuery += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    sqlQuery += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(sqlQuery, params);

    return {
      results: result.rows,
      total: result.rows.length,
      has_more: result.rows.length === limit
    };
  }
};
