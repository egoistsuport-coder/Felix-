import { db } from '../lib/db.js';
import { exportService } from '../lib/export.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, format, filters } = req.body;

    if (!user_id || !format) {
      return res.status(400).json({ error: 'user_id and format are required' });
    }

    if (!['txt', 'json', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use txt, json, or pdf' });
    }

    const userId = parseInt(user_id);

    // Get messages with filters
    const history = await db.getHistory(userId, {
      limit: 10000, // Large limit for export
      ...filters
    });

    // Apply additional filters
    const filteredMessages = exportService.applyFilters(history.messages, filters);

    // Generate export based on format
    let exportContent;
    if (format === 'txt') {
      exportContent = exportService.exportToTxt(filteredMessages);
    } else if (format === 'json') {
      exportContent = exportService.exportToJson(filteredMessages);
    } else if (format === 'pdf') {
      exportContent = await exportService.exportToPdf(filteredMessages);
    }

    // Convert to buffer if string
    const buffer = Buffer.isBuffer(exportContent) 
      ? exportContent 
      : Buffer.from(exportContent, 'utf-8');

    // Check size and split if needed
    const chunks = exportService.splitLargeExport(buffer.toString(), 50 * 1024 * 1024);

    if (chunks.length > 1) {
      // Multiple files
      const fileUrls = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunkBuffer = Buffer.from(chunks[i], 'utf-8');
        const result = await exportService.uploadExport(userId, chunkBuffer, format);
        fileUrls.push(result);
      }
      return res.status(200).json({ files: fileUrls });
    } else {
      // Single file
      const result = await exportService.uploadExport(userId, buffer, format);
      return res.status(200).json(result);
    }
  } catch (error) {
    console.error('Error in export API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
