import OpenAI from 'openai';
import pino from 'pino';
import { CLASSIFIER_SYSTEM_PROMPT } from '../prompts/classifier.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

/**
 * Parse JSON from NVIDIA Gemma response (may include markdown fences)
 */
function extractJson(text) {
  // Try to extract from ```json ... ``` block
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1].trim());
    } catch {}
  }

  // Try to find standalone {...} JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {}
  }

  // Try direct parse
  try {
    return JSON.parse(text.trim());
  } catch {}

  return null;
}

/**
 * Classify text using NVIDIA Gemma 4 31B
 */
export async function classifyText(text, nvidiaApiKey) {
  const client = new OpenAI({
    baseURL: NVIDIA_BASE_URL,
    apiKey: nvidiaApiKey,
  });

  logger.info({ textLength: text.length }, 'Classifying text with NVIDIA Gemma 4');

  const completion = await client.chat.completions.create({
    model: 'google/gemma-4-31b-it',
    messages: [
      { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    temperature: 0.2,
    max_tokens: 1024,
    extra_body: {
      chat_template_kwargs: { enable_thinking: false },
    },
  });

  const responseText = completion.choices[0]?.message?.content || '';
  logger.info({ responseText }, 'NVIDIA Gemma response received');

  const parsed = extractJson(responseText);
  if (parsed) {
    return {
      category: parsed.category || 'UNCATEGORIZED',
      title: parsed.title || 'Untitled',
      summary: parsed.summary || text.substring(0, 500),
      metadata: parsed.metadata || {},
    };
  }

  logger.error({ responseText }, 'Failed to parse NVIDIA response as JSON');
  // Fallback: return raw text as uncategorized
  return {
    category: 'UNCATEGORIZED',
    title: text.substring(0, 80),
    summary: text.substring(0, 500),
    metadata: { raw_response: responseText },
  };
}
