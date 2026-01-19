import { falkeAIService } from '../services/FalkeAIService.js';
import { log } from '../utils/logger.js';
import validateEnv from '../utils/env.mongo.js';

async function testAIProviders() {
  // Validate environment variables
  validateEnv();

  // Test FalkeAI Service
  try {
    log.info('Testing FalkeAI Service...');
    
    if (!falkeAIService.isConfigured()) {
      log.warn('FalkeAI Service is not configured. Skipping test.');
      log.warn('Set FALKEAI_API_BASE_URL and FALKEAI_API_KEY to enable FalkeAI features.');
      return;
    }

    const testMessage = 'Hello, FalkeAI! Can you help me understand basic algebra?';
    
    const response = await falkeAIService.sendChatMessage({
      message: testMessage,
      context: {
        page: 'Smart Lessons',
        username: 'test-user',
        userId: 'test-user-id'
      }
    });

    log.info('FalkeAI Service test successful', { 
      replyLength: response.reply.length,
      timestamp: response.timestamp
    });
    
    console.log('\n✅ FalkeAI test passed!');
    console.log('Response preview:', response.reply.substring(0, 200) + '...');
    
  } catch (error) {
    log.error('FalkeAI Service test failed', { error });
    console.error('\n❌ FalkeAI test failed:', error);
  }
}

testAIProviders().catch(error => {
  log.error('Test suite failed', { error });
  process.exit(1);
});