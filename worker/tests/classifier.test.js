import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Classifier prompt', () => {
  it('should export the system prompt', async () => {
    const mod = await import('../src/prompts/classifier.js');
    assert.ok(mod.CLASSIFIER_SYSTEM_PROMPT, 'System prompt should be defined');
    assert.ok(mod.CLASSIFIER_SYSTEM_PROMPT.includes('TASK'), 'Should reference TASK category');
    assert.ok(mod.CLASSIFIER_SYSTEM_PROMPT.includes('IDEA'), 'Should reference IDEA category');
    assert.ok(mod.CLASSIFIER_SYSTEM_PROMPT.includes('MEETING'), 'Should reference MEETING category');
  });
});
