import { aiService } from '../services/AIService.js';
import { log } from '../utils/logger.js';
import validateEnv from '../utils/env.mongo.js';

async function testAIProviders() {
  // Validate environment variables
  validateEnv();

  // Test AI Service
  try {
    log.info('Testing AI Service (OpenRouter/Groq)...');
    
    if (!aiService.isConfigured()) {
      log.warn('AI Service is not configured. Skipping test.');
      log.warn('Set OPENROUTER_API_KEY or GROQ_API_KEY to enable AI features.');
      return;
    }

    const testMessage = 'Hello! Can you help me understand basic algebra?';
    
    const response = await aiService.sendChatMessage({
      message: testMessage,
      context: {
        page: 'Smart Lessons',
        username: 'test-user',
        userId: 'test-user-id'
      }
    });

    log.info('AI Service test successful', { 
      replyLength: response.reply.length,
      timestamp: response.timestamp,
      provider: response.provider,
      model: response.model,
      modelType: response.modelType
    });
    
    console.log('\n✅ AI Service test passed!');
    console.log('Provider:', response.provider);
    console.log('Model:', response.model);
    console.log('Model Type:', response.modelType);
    console.log('Response preview:', response.reply.substring(0, 200) + '...');
    
  } catch (error) {
    log.error('AI Service test failed', { error });
    console.error('\n❌ AI Service test failed:', error);
  }
}

testAIProviders().catch(error => {
  log.error('Test suite failed', { error });
  process.exit(1);
});