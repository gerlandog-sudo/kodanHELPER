import OpenAI from 'openai';
import pino from 'pino';

const logger = pino({ transport: { target: 'pino-pretty' } });

export async function transcribeAudio(audioUrl, openaiApiKey) {
  const openai = new OpenAI({ apiKey: openaiApiKey });

  logger.info({ audioUrl }, 'Transcribing audio with Whisper');

  // Download audio from Supabase Storage URL
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
  }

  const audioBuffer = await response.arrayBuffer();

  // Send to Whisper API
  const transcription = await openai.audio.transcriptions.create({
    file: new File([audioBuffer], 'audio.webm', { type: 'audio/webm' }),
    model: 'whisper-1',
    language: 'es',
    response_format: 'text',
  });

  logger.info({ transcriptionLength: transcription.length }, 'Transcription complete');
  return transcription;
}
