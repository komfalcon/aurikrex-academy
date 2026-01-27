/**
 * AI Service
 * 
 * Smart AI Model Router with OpenRouter (PRIMARY) + Groq (FALLBACK)
 * 
 * PRIMARY: OpenRouter (4 FREE models - NO EXPIRY - smart routing)
 *   - Simple questions → Google Gemma 3 2B (FAST, 32K context)
 *   - Balanced questions → Qwen 2.5 32B (GENERAL, 256K context)
 *   - Complex/Reasoning → Qwen3 Next 80B (SMART, 262K context)
 *   - Coding questions → Moonshot Kimi K2 (EXPERT, 128K context)
 * 
 * FALLBACK: Groq API (if OpenRouter completely fails)
 *   - Uses: Mixtral 8x7B (free)
 *   - Cost: $0
 * 
 * Features:
 *   - Smart question analysis to select best model
 *   - Automatic fallback from OpenRouter to Groq on failure
 *   - Request queuing to prevent overload
 *   - Detailed logging showing which provider succeeded
 *   - 100% FREE - All models have $0/M input & output with NO EXPIRY
 */

import axios, { AxiosError } from 'axios';
import { log } from '../utils/logger.js';
import {
  AIChatRequest,
  AIChatResponse,
} from '../types/ai.types.js';

// Configuration constants
const DEFAULT_TIMEOUT = 90000; // 90 seconds for complex questions
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1024;

/**
 * Error codes for AI service errors
 */
export enum AIErrorCode {
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMITED = 'RATE_LIMITED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Response from the AI service
 */
export interface AIServiceResponse {
  response: string;
  model: string;
  modelType: string;
  provider: 'openrouter' | 'groq';
  latency: number;
}

/**
 * Selected model info
 */
interface SelectedModel {
  id: string;
  name: string;
  type: string;
}

/**
 * Custom error class for AI service errors
 */
export class AIServiceError extends Error {
  public readonly statusCode?: number;
  public readonly isRetryable: boolean;
  public readonly errorCode: AIErrorCode;

  constructor(message: string, statusCode?: number, errorCode?: AIErrorCode) {
    super(message);
    this.name = 'AIServiceError';
    this.statusCode = statusCode;
    this.errorCode = errorCode || AIErrorCode.UNKNOWN;
    // Client errors (4xx) are not retryable, server errors (5xx) and rate limits are retryable
    this.isRetryable = statusCode === undefined || statusCode >= 500 || statusCode === 429;
  }
}

/**
 * AI Service class
 * Handles communication with OpenRouter and Groq backends
 */
class AIService {
  private readonly openrouterKey: string;
  private readonly groqKey: string;
  private readonly openrouterBaseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly groqBaseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly timeout: number;

  // OpenRouter models - 4 FREE models with NO EXPIRY
  // See: https://openrouter.ai/models (filter by free)
  private readonly models = {
    // Fast, lightweight - Good for simple questions (32K context)
    fast: 'google/gemma-3-2b-instruct:free',
    // Balanced - General purpose, best ratio (256K context)
    balanced: 'alibaba/qwen-2.5-32b-instruct:free',
    // Smart - Complex reasoning, better quality (262K context)
    smart: 'alibaba/qwen-3-next-80b-a3b-instruct:free',
    // Expert - Best reasoning & coding (128K context)
    expert: 'moonshot/kimi-k2-0711:free',
  };

  // Groq fallback model
  private readonly groqFallbackModel = 'mixtral-8x7b-32768';

  // Request queue for processing requests one at a time
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  constructor() {
    // Load API keys from environment
    this.openrouterKey = process.env.OPENROUTER_API_KEY || '';
    this.groqKey = process.env.GROQ_API_KEY || '';

    this.timeout = DEFAULT_TIMEOUT;

    // Log initialization status
    log.info('✅ AIService initialized successfully', {
      openrouterConfigured: !!this.openrouterKey,
      groqConfigured: !!this.groqKey,
      timeout: this.timeout,
    });

    if (!this.openrouterKey && !this.groqKey) {
      log.warn('⚠️ AIService: No API keys configured', {
        hint: 'Set OPENROUTER_API_KEY and/or GROQ_API_KEY environment variables',
      });
    }
  }

  /**
   * Check if the service is properly configured
   */
  public isConfigured(): boolean {
    return !!this.openrouterKey || !!this.groqKey;
  }

  /**
   * Send a chat message to the AI service
   * 
   * @param request - The chat request containing message and context
   * @returns Promise<AIChatResponse> - The response from the AI
   */
  public async sendChatMessage(request: AIChatRequest): Promise<AIChatResponse> {
    // Validate service configuration
    if (!this.isConfigured()) {
      log.error('❌ AIService not configured', {
        openrouterKey: !!this.openrouterKey,
        groqKey: !!this.groqKey,
      });
      throw new Error('AI service is not available. Please contact support.');
    }

    // Validate request
    if (!request.message || typeof request.message !== 'string') {
      throw new Error('Message is required and must be a string');
    }

    if (!request.context || !request.context.userId || !request.context.username) {
      throw new Error('Context with userId and username is required');
    }

    log.info('📤 Sending message to AI Service', {
      page: request.context.page,
      userId: request.context.userId,
      messageLength: request.message.length,
      timestamp: new Date().toISOString(),
    });

    // Queue the request to prevent overload
    return new Promise<AIChatResponse>((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const response = await this.executeRequestWithRetry(request);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });

      log.info(`📋 Request queued. Queue length: ${this.requestQueue.length}`, {
        userId: request.context.userId,
        queueLength: this.requestQueue.length,
      });

      // Start processing the queue if not already processing
      this.processQueue();
    });
  }

  /**
   * Process the request queue - handles one request at a time (FIFO)
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          log.error('❌ Queued request failed:', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Select the best model based on question analysis
   * 
   * Routes questions to appropriate models:
   * - Coding questions → Expert (Kimi K2) - Best for code/algorithms
   * - Complex/Reasoning → Smart (Qwen3 80B) - Deep analysis
   * - General questions → Balanced (Qwen 32B) - Good for most queries
   * - Simple/short → Fast (Gemma 3 2B) - Quick responses
   */
  private selectBestModel(message: string): SelectedModel {
    const lower = message.toLowerCase();

    // CODING DETECTION → Expert Model (Kimi K2)
    if (/code|function|javascript|typescript|python|debug|implement|algorithm|syntax|program|variable|class|method/.test(lower)) {
      log.info('🔍 Detected: CODING question');
      return {
        id: this.models.expert,
        name: 'Moonshot Kimi K2 (Expert)',
        type: 'coding',
      };
    }

    // COMPLEX/REASONING DETECTION → Smart Model (Qwen3 80B)
    if (/explain|why|how|analyze|compare|theory|concept|research|mechanism|complex|quantum|difference/.test(lower)) {
      log.info('🔍 Detected: COMPLEX/REASONING question');
      return {
        id: this.models.smart,
        name: 'Qwen3 Next 80B (Smart)',
        type: 'smart',
      };
    }

    // BALANCED DETECTION → General Purpose (Qwen 32B)
    if (/what|tell|describe|define|list|summarize/.test(lower)) {
      log.info('🔍 Detected: BALANCED question');
      return {
        id: this.models.balanced,
        name: 'Qwen 2.5 32B (Balanced)',
        type: 'balanced',
      };
    }

    // SIMPLE DETECTION (short questions < 10 words) → Fast Model (Gemma 3 2B)
    if (message.split(' ').length < 10) {
      log.info('🔍 Detected: SIMPLE/QUICK question');
      return {
        id: this.models.fast,
        name: 'Google Gemma 3 2B (Fast)',
        type: 'simple',
      };
    }

    // DEFAULT: Use balanced model for medium complexity
    log.info('🔍 Detected: BALANCED question (default)');
    return {
      id: this.models.balanced,
      name: 'Qwen 2.5 32B (Balanced)',
      type: 'balanced',
    };
  }

  /**
   * Execute request with retry logic and provider fallback
   */
  private async executeRequestWithRetry(request: AIChatRequest): Promise<AIChatResponse> {
    const startTime = Date.now();
    let openrouterError: Error | null = null;
    let groqError: Error | null = null;

    // Try OpenRouter first (PRIMARY)
    if (this.openrouterKey) {
      try {
        log.info('📨 Trying OpenRouter (PRIMARY)...');
        const selectedModel = this.selectBestModel(request.message);
        log.info(`🧠 Question analysis suggests: ${selectedModel.type} model`);
        log.info(`📊 Using OpenRouter model: ${selectedModel.name}`);

        const response = await this.callOpenRouter(request.message, selectedModel.id);
        const latency = Date.now() - startTime;
        log.info(`✅ OpenRouter response received in ${latency}ms`);

        return {
          reply: response.text,
          timestamp: new Date().toISOString(),
          provider: 'openrouter',
          model: selectedModel.name,
          modelType: selectedModel.type,
        };
      } catch (error) {
        openrouterError = error instanceof Error ? error : new Error(String(error));
        log.warn('⚠️ OpenRouter failed, trying Groq fallback...', {
          error: openrouterError.message,
        });
      }
    }

    // Fallback to Groq (if OpenRouter fails completely)
    if (this.groqKey) {
      try {
        log.info('📨 Trying Groq (FALLBACK)...');
        const response = await this.callGroq(request.message);
        const latency = Date.now() - startTime;
        log.info(`✅ Groq response received in ${latency}ms`);

        return {
          reply: response.text,
          timestamp: new Date().toISOString(),
          provider: 'groq',
          model: 'Mixtral 8x7B (Groq Fallback)',
          modelType: 'fallback',
        };
      } catch (error) {
        groqError = error instanceof Error ? error : new Error(String(error));
        log.error('❌ Groq also failed', {
          error: groqError.message,
        });
      }
    }

    // Both providers failed
    const openrouterMsg = openrouterError?.message || 'No OpenRouter key configured';
    const groqMsg = groqError?.message || 'No Groq key configured';

    log.error('❌ All AI providers failed', {
      openrouterError: openrouterMsg,
      groqError: groqMsg,
    });

    throw new AIServiceError(
      `All AI providers failed. OpenRouter: ${openrouterMsg}, Groq: ${groqMsg}`,
      503,
      AIErrorCode.SERVICE_UNAVAILABLE
    );
  }

  /**
   * Call OpenRouter API
   */
  private async callOpenRouter(message: string, modelId: string): Promise<{ text: string }> {
    log.info(`📡 Calling OpenRouter with model: ${modelId}`);

    try {
      const response = await axios.post(
        this.openrouterBaseUrl,
        {
          model: modelId,
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
          max_tokens: DEFAULT_MAX_TOKENS,
          temperature: DEFAULT_TEMPERATURE,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openrouterKey}`,
            'HTTP-Referer': 'https://aurikrex.tech',
            'X-Title': 'Aurikrex Academy',
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        }
      );

      // Validate response structure
      const choices = response.data?.choices;
      if (!choices || !Array.isArray(choices) || choices.length === 0) {
        log.warn('⚠️ OpenRouter returned malformed response structure', {
          hasData: !!response.data,
          hasChoices: !!choices,
          isArray: Array.isArray(choices),
          choicesLength: Array.isArray(choices) ? choices.length : 'N/A',
        });
        throw new AIServiceError('Malformed response structure from OpenRouter', undefined, AIErrorCode.INVALID_RESPONSE);
      }

      const responseText = choices[0]?.message?.content || '';

      log.info(`📥 Raw response received (${responseText.length} chars)`);

      if (!responseText) {
        log.warn('⚠️ OpenRouter returned empty content', {
          hasMessage: !!choices[0]?.message,
          hasContent: !!choices[0]?.message?.content,
        });
        throw new AIServiceError('Empty response from OpenRouter', undefined, AIErrorCode.INVALID_RESPONSE);
      }

      log.info('✅ OpenRouter response valid');
      return { text: responseText };
    } catch (error) {
      // Re-throw AIServiceError as-is
      if (error instanceof AIServiceError) {
        throw error;
      }

      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data as { error?: { message?: string } } | undefined;
      const statusCode = axiosError.response?.status;
      const errorMessage = errorData?.error?.message || axiosError.message;

      log.error('❌ OpenRouter API error:', {
        status: statusCode,
        message: errorMessage,
      });

      // Check for specific error types
      if (statusCode === 429) {
        throw new AIServiceError('OpenRouter rate limited', 429, AIErrorCode.RATE_LIMITED);
      }

      if (statusCode === 401 || statusCode === 403) {
        throw new AIServiceError('OpenRouter authentication failed', statusCode, AIErrorCode.AUTHENTICATION_ERROR);
      }

      if (axiosError.code === 'ECONNABORTED' || errorMessage.includes('timeout')) {
        throw new AIServiceError('OpenRouter request timed out', undefined, AIErrorCode.TIMEOUT);
      }

      throw new AIServiceError(
        `OpenRouter error: ${errorMessage}`,
        statusCode,
        AIErrorCode.UNKNOWN
      );
    }
  }

  /**
   * Call Groq API
   */
  private async callGroq(message: string): Promise<{ text: string }> {
    log.info(`📡 Calling Groq with model: ${this.groqFallbackModel}`);

    try {
      const response = await axios.post(
        this.groqBaseUrl,
        {
          model: this.groqFallbackModel,
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
          max_tokens: DEFAULT_MAX_TOKENS,
          temperature: DEFAULT_TEMPERATURE,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.groqKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        }
      );

      // Validate response structure
      const choices = response.data?.choices;
      if (!choices || !Array.isArray(choices) || choices.length === 0) {
        log.warn('⚠️ Groq returned malformed response structure', {
          hasData: !!response.data,
          hasChoices: !!choices,
          isArray: Array.isArray(choices),
          choicesLength: Array.isArray(choices) ? choices.length : 'N/A',
        });
        throw new AIServiceError('Malformed response structure from Groq', undefined, AIErrorCode.INVALID_RESPONSE);
      }

      const responseText = choices[0]?.message?.content || '';

      log.info(`📥 Raw response received (${responseText.length} chars)`);

      if (!responseText) {
        log.warn('⚠️ Groq returned empty content', {
          hasMessage: !!choices[0]?.message,
          hasContent: !!choices[0]?.message?.content,
        });
        throw new AIServiceError('Empty response from Groq', undefined, AIErrorCode.INVALID_RESPONSE);
      }

      log.info('✅ Groq response valid');
      return { text: responseText };
    } catch (error) {
      // Re-throw AIServiceError as-is
      if (error instanceof AIServiceError) {
        throw error;
      }

      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data as { error?: { message?: string } } | undefined;
      const statusCode = axiosError.response?.status;
      const errorMessage = errorData?.error?.message || axiosError.message;

      log.error('❌ Groq API error:', {
        status: statusCode,
        message: errorMessage,
      });

      // Check for specific error types
      if (statusCode === 429) {
        throw new AIServiceError('Groq rate limited', 429, AIErrorCode.RATE_LIMITED);
      }

      if (statusCode === 401 || statusCode === 403) {
        throw new AIServiceError('Groq authentication failed', statusCode, AIErrorCode.AUTHENTICATION_ERROR);
      }

      if (axiosError.code === 'ECONNABORTED' || errorMessage.includes('timeout')) {
        throw new AIServiceError('Groq request timed out', undefined, AIErrorCode.TIMEOUT);
      }

      throw new AIServiceError(
        `Groq error: ${errorMessage}`,
        statusCode,
        AIErrorCode.UNKNOWN
      );
    }
  }
}

// Export a singleton instance
export const aiService = new AIService();

export default AIService;
