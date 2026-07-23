import OpenAI from 'openai';
import pino from 'pino';
import { CLASSIFIER_SYSTEM_PROMPT } from '../prompts/classifier.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

export async function classifyText(text, nvidiaApiKey) {
  const client = new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: nvidiaApiKey,
  });

  logger.info({ textLength: text.length }, 'Classifying text with NVIDIA LLM');

  const completion = await client.chat.completions.create({
    model: 'meta/llama-3.3-70b-instruct',
    messages: [
      { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const responseText = completion.choices[0]?.message?.content || '';
  logger.info({ responseText }, 'NVIDIA response received');

  // Parse the JSON response
  try {
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (parseErr) {
    throw new Error(`Failed to parse NVIDIA response as JSON: ${responseText}`);
  }
}
