import { GPTProvider } from '../services/GPTProvider';
import { GeminiProvider } from '../services/GeminiProvider';
import { defaultConfig } from '../services/BaseAIService';
import { log } from '../utils/logger';
import validateEnv from '../utils/env';

async function testAIProviders() {
  // Validate environment variables
  validateEnv();

  const testInput = {
    subject: 'Mathematics',
    topic: 'Introduction to Algebra',
    targetGrade: 7,
    lessonLength: 'medium' as const,
    difficulty: 'intermediate' as const
  };

  // Test GPT Provider
  try {
    log.info('Testing GPT Provider...');
    const gptProvider = new GPTProvider({
      ...defaultConfig,
      model: 'gpt-3.5-turbo'
    });
    const gptResult = await gptProvider.generateLesson(testInput);
    log.info('GPT Provider test successful', { 
      model: gptResult.model,
      cached: gptResult.cached,
      usage: gptResult.usage
    });
  } catch (error) {
    log.error('GPT Provider test failed', { error });
  }

  // Test Gemini Provider
  try {
    log.info('Testing Gemini Provider...');
    const geminiProvider = new GeminiProvider({
      ...defaultConfig,
      model: 'gemini-pro'
    });
    const geminiResult = await geminiProvider.generateLesson(testInput);
    log.info('Gemini Provider test successful', {
      model: geminiResult.model,
      cached: geminiResult.cached
    });
  } catch (error) {
    log.error('Gemini Provider test failed', { error });
  }
}

testAIProviders().catch(error => {
  log.error('Test suite failed', { error });
  process.exit(1);
});