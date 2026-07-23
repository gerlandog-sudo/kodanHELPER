import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CATEGORIES } from '../src/config/categories.js';

describe('Classifier prompt', () => {
  it('should export the system prompt', async () => {
    const mod = await import('../src/prompts/classifier.js');
    assert.ok(mod.CLASSIFIER_SYSTEM_PROMPT, 'System prompt should be defined');
    assert.ok(mod.CLASSIFIER_SYSTEM_PROMPT.includes('CATEGORÍAS PERMITIDAS'), 'Should include categories header');
  });

  it('should include all categories from config', async () => {
    const mod = await import('../src/prompts/classifier.js');
    const prompt = mod.CLASSIFIER_SYSTEM_PROMPT;
    for (const cat of CATEGORIES) {
      assert.ok(prompt.includes(cat.value), `Should reference "${cat.value}" category`);
      assert.ok(prompt.includes(cat.description), `Should include description for "${cat.value}"`);
    }
  });
});
