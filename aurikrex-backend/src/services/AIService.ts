/**
 * AI Service
 * 
 * Unified AI service that handles both Google Gemini and OpenAI providers.
 * - Primary: Google Gemini (3 API keys, free tier, load-balanced)
 * - Fallback: OpenAI (2 API keys, paid backup, load-balanced)
 * 
 * Features:
 * - Smart routing with load-balancing across all API keys
 * - Automatic fallback from Gemini to OpenAI on failure
 * - Retry logic for rate-limited requests
 * - Request queuing to prevent overload
 * - Detailed logging at each step
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { log } from '../utils/logger.js';
import {
  AIChatRequest,
  AIChatResponse,
} from '../types/ai.types.js';

// Configuration constants
const DEFAULT_TIMEOUT = 90000; // 90 seconds for complex questions
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 512;

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
  provider: 'gemini' | 'openai';
  latency: number;
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
 * Handles communication with Gemini and OpenAI backends
 */
class AIService {
  private readonly geminiKeys: string[];
  private readonly openaiKeys: string[];
  private geminiKeyIndex = 0;
  private openaiKeyIndex = 0;
  private readonly timeout: number;

  // Request queue for processing requests one at a time
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  constructor() {
    // Load Gemini API keys from environment
    this.geminiKeys = [
      process.env.GEMINI_API_KEY_1 || '',
      process.env.GEMINI_API_KEY_2 || '',
      process.env.GEMINI_API_KEY_3 || '',
    ].filter(key => key);

    // Load OpenAI API keys from environment
    this.openaiKeys = [
      process.env.OPENAI_API_KEY_1 || '',
      process.env.OPENAI_API_KEY_2 || '',
    ].filter(key => key);

    this.timeout = DEFAULT_TIMEOUT;

    // Log initialization status
    log.info('✅ AIService initialized successfully', {
      geminiKeysLoaded: this.geminiKeys.length,
      openaiKeysLoaded: this.openaiKeys.length,
      timeout: this.timeout,
    });

    if (this.geminiKeys.length === 0 && this.openaiKeys.length === 0) {
      log.warn('⚠️ AIService: No API keys configured', {
        hint: 'Set GEMINI_API_KEY_1/2/3 and/or OPENAI_API_KEY_1/2 environment variables',
      });
    }
  }

  /**
   * Check if the service is properly configured
   */
  public isConfigured(): boolean {
    return this.geminiKeys.length > 0 || this.openaiKeys.length > 0;
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
        geminiKeys: this.geminiKeys.length,
        openaiKeys: this.openaiKeys.length,
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
   * Execute request with retry logic and provider fallback
   */
  private async executeRequestWithRetry(request: AIChatRequest): Promise<AIChatResponse> {
    const startTime = Date.now();
    let geminiError: Error | null = null;
    let openaiError: Error | null = null;

    // Try Gemini first (free tier)
    if (this.geminiKeys.length > 0) {
      try {
        log.info('📨 Trying Gemini (free tier)...');
        const response = await this.tryGeminiWithRetry(request.message);
        const latency = Date.now() - startTime;
        log.info(`✅ Gemini success in ${latency}ms`);

        return {
          reply: response.response,
          timestamp: new Date().toISOString(),
          provider: response.provider,
          model: response.model,
        };
      } catch (error) {
        geminiError = error instanceof Error ? error : new Error(String(error));
        log.warn('⚠️ Gemini failed, trying OpenAI fallback...', {
          error: geminiError.message,
        });
      }
    }

    // Fallback to OpenAI
    if (this.openaiKeys.length > 0) {
      try {
        log.info('📨 Trying OpenAI (paid backup)...');
        const response = await this.tryOpenAIWithRetry(request.message);
        const latency = Date.now() - startTime;
        log.info(`✅ OpenAI success in ${latency}ms`);

        return {
          reply: response.response,
          timestamp: new Date().toISOString(),
          provider: response.provider,
          model: response.model,
        };
      } catch (error) {
        openaiError = error instanceof Error ? error : new Error(String(error));
        log.error('❌ OpenAI also failed', {
          error: openaiError.message,
        });
      }
    }

    // Both providers failed
    const geminiMsg = geminiError?.message || 'No Gemini keys configured';
    const openaiMsg = openaiError?.message || 'No OpenAI keys configured';

    log.error('❌ All AI providers failed', {
      geminiError: geminiMsg,
      openaiError: openaiMsg,
    });

    throw new AIServiceError(
      'AI service is temporarily unavailable. Please try again later.',
      503,
      AIErrorCode.SERVICE_UNAVAILABLE
    );
  }

  /**
   * Try Gemini with retry logic across all keys
   */
  private async tryGeminiWithRetry(message: string, attempt = 0): Promise<Omit<AIServiceResponse, 'latency'>> {
    if (this.geminiKeys.length === 0) {
      throw new AIServiceError('No Gemini API keys configured', undefined, AIErrorCode.AUTHENTICATION_ERROR);
    }

    // Load-balance across Gemini keys
    const keyIndex = this.geminiKeyIndex;
    const apiKey = this.geminiKeys[keyIndex];
    this.geminiKeyIndex = (this.geminiKeyIndex + 1) % this.geminiKeys.length;

    log.info(`🔑 Using Gemini key ${keyIndex + 1}/${this.geminiKeys.length}`);

    try {
      const client = new GoogleGenerativeAI(apiKey);
      const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const result = await model.generateContent(message);
        clearTimeout(timeoutId);

        const response = result.response;
        const responseText = response.text();

        if (!responseText) {
          throw new AIServiceError('Empty response from Gemini', undefined, AIErrorCode.INVALID_RESPONSE);
        }

        return {
          response: responseText,
          model: 'gemini-2.0-flash',
          provider: 'gemini',
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const errorMessage = err.message || '';

      // Check if rate-limited
      if (errorMessage.includes('RESOURCE_EXHAUSTED') ||
          errorMessage.includes('429') ||
          errorMessage.includes('rate') ||
          errorMessage.includes('quota')) {
        log.warn(`⚠️ Gemini key ${keyIndex + 1} rate-limited`);

        // Try next key if we haven't tried all keys
        const keysTriedSoFar = attempt + 1;
        if (keysTriedSoFar < this.geminiKeys.length) {
          log.info(`🔄 Trying next Gemini key (attempt ${keysTriedSoFar + 1}/${this.geminiKeys.length})`);
          return this.tryGeminiWithRetry(message, keysTriedSoFar);
        }

        throw new AIServiceError(
          'All Gemini API keys are rate-limited',
          429,
          AIErrorCode.RATE_LIMITED
        );
      }

      // Handle timeout
      if (err.name === 'AbortError' || errorMessage.includes('timeout')) {
        throw new AIServiceError('Gemini request timed out', undefined, AIErrorCode.TIMEOUT);
      }

      // Re-throw for other errors
      throw new AIServiceError(
        `Gemini error: ${errorMessage}`,
        undefined,
        AIErrorCode.UNKNOWN
      );
    }
  }

  /**
   * Try OpenAI with retry logic across all keys
   */
  private async tryOpenAIWithRetry(message: string, attempt = 0): Promise<Omit<AIServiceResponse, 'latency'>> {
    if (this.openaiKeys.length === 0) {
      throw new AIServiceError('No OpenAI API keys configured', undefined, AIErrorCode.AUTHENTICATION_ERROR);
    }

    // Load-balance across OpenAI keys
    const keyIndex = this.openaiKeyIndex;
    const apiKey = this.openaiKeys[keyIndex];
    this.openaiKeyIndex = (this.openaiKeyIndex + 1) % this.openaiKeys.length;

    log.info(`🔑 Using OpenAI key ${keyIndex + 1}/${this.openaiKeys.length}`);

    try {
      const client = new OpenAI({ 
        apiKey,
        timeout: this.timeout,
      });

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
        max_tokens: DEFAULT_MAX_TOKENS,
        temperature: DEFAULT_TEMPERATURE,
      });

      const responseText = response.choices[0]?.message?.content || '';

      if (!responseText) {
        throw new AIServiceError('Empty response from OpenAI', undefined, AIErrorCode.INVALID_RESPONSE);
      }

      return {
        response: responseText,
        model: 'gpt-3.5-turbo',
        provider: 'openai',
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const errorMessage = err.message || '';

      // Check if it's an OpenAI API error with status code
      let statusCode: number | undefined;
      if ('status' in err && typeof (err as { status: unknown }).status === 'number') {
        statusCode = (err as { status: number }).status;
      }

      // Check if rate-limited
      if (statusCode === 429 || errorMessage.includes('rate_limit')) {
        log.warn(`⚠️ OpenAI key ${keyIndex + 1} rate-limited`);

        // Try next key if we haven't tried all keys
        const keysTriedSoFar = attempt + 1;
        if (keysTriedSoFar < this.openaiKeys.length) {
          log.info(`🔄 Trying next OpenAI key (attempt ${keysTriedSoFar + 1}/${this.openaiKeys.length})`);
          return this.tryOpenAIWithRetry(message, keysTriedSoFar);
        }

        throw new AIServiceError(
          'All OpenAI API keys are rate-limited',
          429,
          AIErrorCode.RATE_LIMITED
        );
      }

      // Handle timeout
      if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        throw new AIServiceError('OpenAI request timed out', undefined, AIErrorCode.TIMEOUT);
      }

      // Re-throw for other errors
      throw new AIServiceError(
        `OpenAI error: ${errorMessage}`,
        statusCode,
        AIErrorCode.UNKNOWN
      );
    }
  }
}

// Export a singleton instance
export const aiService = new AIService();

export default AIService;
