import { Router } from 'express';
import pino from 'pino';
import { authenticate } from '../middleware/auth.js';
import { getSupabase } from '../services/supabase.js';

const logger = pino({ transport: { target: 'pino-pretty' } });
export const ingestRouter = Router();

ingestRouter.post('/', authenticate, async (req, res) => {
  const { type, content } = req.body;

  // Validate input
  if (!type || !['audio', 'text'].includes(type)) {
    return res.status(400).json({ error: 'type must be "audio" or "text"' });
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'content is required and must be a non-empty string' });
  }

  if (type === 'audio' && content.length > 50 * 1024 * 1024) {
    return res.status(400).json({ error: 'audio content exceeds 50MB limit' });
  }

  if (type === 'text' && content.length > 10000) {
    return res.status(400).json({ error: 'text content exceeds 10,000 character limit' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    // Insert into raw_inputs
    const insertData = {
      user_id: req.user.id,
      type,
      content_url: type === 'audio' ? content : null,
      content_text: type === 'text' ? content.trim() : null,
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('raw_inputs')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'failed to insert raw_input');
      return res.status(500).json({ error: 'Failed to save input' });
    }

    logger.info({ id: data.id, type }, 'raw_input saved');

    // Respond immediately — worker processes async
    return res.status(201).json({
      id: data.id,
      status: data.status,
      message: 'Capture saved, processing will complete shortly',
    });
  } catch (err) {
    logger.error({ err }, 'unexpected error in ingest');
    return res.status(500).json({ error: 'Internal server error' });
  }
});
