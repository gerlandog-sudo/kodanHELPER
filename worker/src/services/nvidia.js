import OpenAI from 'openai';
import pino from 'pino';
import { CLASSIFIER_SYSTEM_PROMPT } from '../prompts/classifier.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

/**
 * Classify text using NVIDIA Gemma (free tier)
 */
export async function classifyText(text, nvidiaApiKey) {
  const client = new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: nvidiaApiKey,
  });

  logger.info({ textLength: text.length }, 'Classifying text with NVIDIA Gemma');

  const completion = await client.chat.completions.create({
    model: 'google/gemma-3-4b-it',
    messages: [
      { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    temperature: 0.2,
    max_tokens: 1024,
  });

  const responseText = completion.choices[0]?.message?.content || '';
  logger.info({ responseText }, 'NVIDIA Gemma response received');

  // Extract JSON from response (Gemma may not support native json_object mode)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : responseText;

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      category: parsed.category || 'UNCATEGORIZED',
      title: parsed.title || 'Untitled',
      summary: parsed.summary || text.substring(0, 500),
      metadata: parsed.metadata || {},
    };
  } catch (parseErr) {
    logger.error({ responseText, parseErr: parseErr.message }, 'Failed to parse NVIDIA response as JSON');
    // Fallback: return raw text as uncategorized
    return {
      category: 'UNCATEGORIZED',
      title: text.substring(0, 80),
      summary: text.substring(0, 500),
      metadata: { raw_response: responseText },
    };
  }
}
