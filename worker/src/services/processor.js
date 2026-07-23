import pino from 'pino';
import { classifyText } from './nvidia.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

export async function processRawInput(supabase, record) {
  const { id, content_text, user_id } = record;
  const nvidiaApiKey = process.env.NVIDIA_API_KEY || process.env.GEMINI_API_KEY;

  if (!nvidiaApiKey) {
    throw new Error('NVIDIA_API_KEY environment variable is not set');
  }

  // Get plain text — only text inputs supported (SpeechRecognition client-side)
  if (!content_text) {
    throw new Error('Text record has no content_text. Audio uploads no longer supported — use browser SpeechRecognition.');
  }
  const text = content_text;

  // Step 2: Classify with NVIDIA Gemma
  const classification = await classifyText(text, nvidiaApiKey);

  // Step 3: Insert into items table
  const { error: insertError } = await supabase
    .from('items')
    .insert({
      raw_input_id: id,
      user_id,
      category: classification.category || 'Nota',
      title: classification.title || 'Untitled',
      summary: classification.summary || text.substring(0, 500),
      metadata: classification.metadata || {},
      status: 'inbox',
    });

  if (insertError) {
    throw new Error(`Failed to insert item: ${insertError.message}`);
  }

  // Step 4: Mark raw_input as processed
  const { error: updateError } = await supabase
    .from('raw_inputs')
    .update({ status: 'processed' })
    .eq('id', id);

  if (updateError) {
    logger.error({ error: updateError }, 'Failed to update raw_input status');
    // Non-fatal — item was inserted successfully
  }

  logger.info({ id, category: classification.category, title: classification.title }, 'Item processed and saved');
}
