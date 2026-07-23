import { GoogleGenerativeAI } from '@google/generative-ai';
import pino from 'pino';
import { CLASSIFIER_SYSTEM_PROMPT } from '../prompts/classifier.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

export async function classifyText(text, geminiApiKey) {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  logger.info({ textLength: text.length }, 'Classifying text with Gemini');

  const result = await model.generateContent({
    systemInstruction: CLASSIFIER_SYSTEM_PROMPT,
    contents: [{ role: 'user', parts: [{ text }] }],
  });

  const responseText = result.response.text();
  logger.info({ responseText }, 'Gemini response received');

  // Parse the JSON response
  try {
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (parseErr) {
    throw new Error(`Failed to parse Gemini response as JSON: ${responseText}`);
  }
}
