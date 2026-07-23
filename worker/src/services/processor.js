import pino from 'pino';
import { transcribeAudio } from './whisper.js';
import { classifyText } from './gemini.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

export async function processRawInput(supabase, record) {
  const { id, type, content_url, content_text, user_id } = record;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // Step 1: Get plain text
  let text;
  if (type === 'audio') {
    if (!content_url) {
      throw new Error('Audio record has no content_url');
    }

    // Generate a signed URL for the audio file
    const { data: { signedUrl }, error: signedUrlError } = await supabase
      .storage
      .from('audio-uploads')
      .createSignedUrl(content_url, 300); // 5 minute expiry

    if (signedUrlError) {
      throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
    }

    text = await transcribeAudio(signedUrl, geminiApiKey);
  } else {
    if (!content_text) {
      throw new Error('Text record has no content_text');
    }
    text = content_text;
  }

  // Step 2: Classify with Gemini
  const classification = await classifyText(text, geminiApiKey);

  // Step 3: Insert into items table
  const { error: insertError } = await supabase
    .from('items')
    .insert({
      raw_input_id: id,
      user_id,
      category: classification.category || 'UNCATEGORIZED',
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
