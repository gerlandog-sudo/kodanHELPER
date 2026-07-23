import { GoogleGenerativeAI } from '@google/generative-ai';
import pino from 'pino';

const logger = pino({ transport: { target: 'pino-pretty' } });

export async function transcribeAudio(audioUrl, geminiApiKey) {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.1,
    },
  });

  logger.info({ audioUrl }, 'Transcribing audio with Gemini');

  // Download audio from Supabase Storage signed URL
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString('base64');

  // Detect mime type (default to webm)
  const mimeType = response.headers.get('content-type') || 'audio/webm';

  // Send to Gemini for transcription
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64Audio,
      },
    },
    { text: 'Transcribe este audio al español. Devuelve SOLO el texto transcrito, sin explicaciones ni prefijos.' },
  ]);

  const transcription = result.response.text();
  logger.info({ transcriptionLength: transcription.length }, 'Gemini transcription complete');

  return transcription;
}
