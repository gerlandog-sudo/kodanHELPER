import OpenAI from 'openai';
import pino from 'pino';
import { CLASSIFIER_SYSTEM_PROMPT } from '../prompts/classifier.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

/**
 * Transcribe audio using Groq Whisper (free tier)
 */
export async function transcribeAudio(audioUrl, groqApiKey) {
  const client = new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: groqApiKey,
  });

  logger.info({ audioUrl }, 'Transcribing audio with Groq Whisper');

  // Download audio from Supabase Storage signed URL
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
  }

  const audioBuffer = await response.arrayBuffer();

  const transcription = await client.audio.transcriptions.create({
    file: new File([audioBuffer], 'audio.webm', { type: 'audio/webm' }),
    model: 'whisper-large-v3-turbo',
    language: 'es',
    response_format: 'text',
  });

  logger.info({ transcriptionLength: transcription.length }, 'Transcription complete');
  return transcription;
}

/**
 * Classify text using Groq LLM (llama-3.3-70b-versatile, free tier)
 */
export async function classifyText(text, groqApiKey) {
  const client = new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: groqApiKey,
  });

  logger.info({ textLength: text.length }, 'Classifying text with Groq LLM');

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const responseText = completion.choices[0]?.message?.content || '';
  logger.info({ responseText }, 'Groq response received');

  try {
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (parseErr) {
    throw new Error(`Failed to parse Groq response as JSON: ${responseText}`);
  }
}
