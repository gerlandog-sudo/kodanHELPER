import OpenAI from 'openai';
import pino from 'pino';
import { CLASSIFIER_SYSTEM_PROMPT } from '../prompts/classifier.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

/**
 * Classify text using NVIDIA Meta Llama 3.1 8B (rápido, soporta JSON mode nativo)
 */
export async function classifyText(text, nvidiaApiKey) {
  const client = new OpenAI({
    baseURL: NVIDIA_BASE_URL,
    apiKey: nvidiaApiKey,
    timeout: 30000,
    maxRetries: 1,
  });

  logger.info({ textLength: text.length }, 'Classifying text with NVIDIA Llama 3.1 8B');

  const completion = await client.chat.completions.create({
    model: 'meta/llama-3.1-8b-instruct',
    messages: [
      { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    temperature: 0.2,
    max_tokens: 512,
    response_format: { type: 'json_object' },
  });

  const responseText = completion.choices[0]?.message?.content || '';
  logger.info({ responseText: responseText.substring(0, 200) }, 'NVIDIA Llama response received');

  try {
    const parsed = JSON.parse(responseText);
    return {
      category: parsed.category || 'Nota',
      title: parsed.title || 'Untitled',
      summary: parsed.summary || text.substring(0, 500),
      metadata: parsed.metadata || {},
    };
  } catch (parseErr) {
    logger.error({ responseText, parseErr: parseErr.message }, 'Failed to parse NVIDIA response as JSON');
    return {
      category: 'Nota',
      title: text.substring(0, 80),
      summary: text.substring(0, 500),
      metadata: {},
    };
  }
}
