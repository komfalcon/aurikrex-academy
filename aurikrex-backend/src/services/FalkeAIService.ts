/**
 * FalkeAI Service
 * 
 * This service acts as a bridge between Aurikrex Academy and the FalkeAI backend.
 * It handles all communication with the FalkeAI REST API, including:
 * - Request forwarding with proper authentication
 * - Error handling for downtime, timeouts, and invalid responses
 * - System identity injection (model details not exposed to frontend)
 * 
 * IMPORTANT: The frontend should never call FalkeAI directly.
 * All AI calls must go through this internal backend service.
 */

import { log } from '../utils/logger.js';
import {
  FalkeAIChatRequest,
  FalkeAIChatResponse,
} from '../types/ai.types.js';

// Configuration constants
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 512;

/**
 * Error codes for FalkeAI errors
 */
export enum FalkeAIErrorCode {
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom error class that carries HTTP status code and error code information
 * Used to determine if an error is retryable based on status code
 */
export class FalkeAIError extends Error {
  public readonly statusCode?: number;
  public readonly isRetryable: boolean;
  public readonly errorCode: FalkeAIErrorCode;

  constructor(message: string, statusCode?: number, errorCode?: FalkeAIErrorCode) {
    super(message);
    this.name = 'FalkeAIError';
    this.statusCode = statusCode;
    this.errorCode = errorCode || FalkeAIErrorCode.UNKNOWN;
    // Client errors (4xx) are not retryable, server errors (5xx) are retryable
    this.isRetryable = statusCode === undefined || statusCode >= 500;
  }
}

/**
 * FalkeAI Service class
 * Handles all communication with the FalkeAI backend
 */
class FalkeAIService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor() {
    // Get configuration from environment variables (no hardcoded secrets)
    this.baseUrl = process.env.FALKEAI_API_BASE_URL || '';
    this.apiKey = process.env.FALKEAI_API_KEY || '';
    this.timeout = DEFAULT_TIMEOUT;

    // Log initialization status (without exposing secrets)
    if (this.baseUrl && this.apiKey) {
      log.info('✅ FalkeAI Service initialized successfully', {
        baseUrl: this.baseUrl,
        apiKeyConfigured: true,
        timeout: this.timeout,
      });
    } else {
      log.warn('⚠️ FalkeAI Service: Missing configuration', {
        baseUrlSet: !!this.baseUrl,
        apiKeySet: !!this.apiKey,
        hint: 'Set FALKEAI_API_BASE_URL and FALKEAI_API_KEY environment variables',
      });
    }
  }

  /**
   * Check if the service is properly configured
   */
  public isConfigured(): boolean {
    return !!(this.baseUrl && this.apiKey);
  }

  /**
   * Send a chat message to FalkeAI
   * 
   * @param request - The chat request containing message and context
   * @returns Promise<FalkeAIChatResponse> - The response from FalkeAI
   * @throws Error if FalkeAI is unavailable or returns an invalid response
   */
  public async sendChatMessage(request: FalkeAIChatRequest): Promise<FalkeAIChatResponse> {
    // Validate service configuration
    if (!this.isConfigured()) {
      log.error('❌ FalkeAI Service not configured', {
        baseUrl: this.baseUrl || 'NOT SET',
        apiKeySet: !!this.apiKey,
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

    log.info('📤 Sending message to FalkeAI', {
      endpoint: `${this.baseUrl}/chat`,
      page: request.context.page,
      userId: request.context.userId,
      messageLength: request.message.length,
      timestamp: new Date().toISOString(),
    });

    let lastError: Error | null = null;

    // Retry logic for transient failures
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        log.info(`🔄 FalkeAI request attempt ${attempt}/${MAX_RETRIES}`, {
          attempt,
          maxRetries: MAX_RETRIES,
        });
        
        const response = await this.makeRequest(request);
        
        log.info('✅ FalkeAI response received', {
          page: request.context.page,
          userId: request.context.userId,
          replyLength: response.reply.length,
          attempt,
        });

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry for non-retryable errors (client errors 4xx)
        if (error instanceof FalkeAIError && !error.isRetryable) {
          log.error('❌ FalkeAI request failed (non-retryable)', {
            error: lastError.message,
            statusCode: error.statusCode,
          });
          throw lastError;
        }

        log.warn(`⚠️ FalkeAI request attempt ${attempt} failed`, {
          error: lastError.message,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          willRetry: attempt < MAX_RETRIES,
          nextRetryIn: attempt < MAX_RETRIES ? `${RETRY_DELAY * attempt}ms` : 'N/A',
        });

        // Wait before retrying
        if (attempt < MAX_RETRIES) {
          await this.sleep(RETRY_DELAY * attempt);
        }
      }
    }

    // All retries exhausted
    log.error('❌ FalkeAI request failed after all retries', {
      error: lastError?.message,
      totalAttempts: MAX_RETRIES,
      userId: request.context.userId,
    });

    throw new Error('AI service is temporarily unavailable. Please try again later.');
  }

  /**
   * Make the actual HTTP request to FalkeAI
   */
  private async makeRequest(request: FalkeAIChatRequest): Promise<FalkeAIChatResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    const requestStartTime = Date.now();

    try {
      // Build the request payload
      // FalkeAI expects: { message, temperature, max_tokens }
      // with optional context information
      const payload = {
        message: request.message,
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: DEFAULT_MAX_TOKENS,
        context: {
          page: request.context.page,
          course: request.context.course,
          username: request.context.username,
          userId: request.context.userId,
        },
        // FalkeAI system identity (internal, not exposed to frontend)
        systemContext: {
          source: 'aurikrex-academy',
          version: '1.0',
        },
      };

      const endpoint = `${this.baseUrl}/chat`;
      
      log.info('📡 Making HTTP request to FalkeAI', {
        endpoint,
        method: 'POST',
        timeout: this.timeout,
        payloadSize: JSON.stringify(payload).length,
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const requestDuration = Date.now() - requestStartTime;

      log.info('📥 FalkeAI HTTP response received', {
        status: response.status,
        statusText: response.statusText,
        durationMs: requestDuration,
        ok: response.ok,
      });

      // Handle non-OK responses
      if (!response.ok) {
        const errorMessage = await this.parseErrorResponse(response);
        log.error('❌ FalkeAI returned error response', {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          durationMs: requestDuration,
        });
        // Throw FalkeAIError with status code for proper retry logic
        throw new FalkeAIError(errorMessage, response.status);
      }

      // Parse response
      // FalkeAI returns: { response: string, model: string, timestamp: string }
      const data = await response.json() as { response?: string; reply?: string; model?: string; timestamp?: string };

      // Log the raw response for debugging
      log.info('📥 FalkeAI raw response data:', {
        data: data,
        dataType: typeof data,
        keys: data ? Object.keys(data) : [],
      });

      // Validate response structure (null check before typeof since typeof null === 'object')
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        log.error('❌ FalkeAI response is not an object:', {
          dataType: typeof data,
          isNull: data === null,
          isArray: Array.isArray(data),
          data: data,
        });
        throw new FalkeAIError('Invalid response: not an object', undefined, FalkeAIErrorCode.INVALID_RESPONSE);
      }

      // Get the response text - FalkeAI uses 'response', but we also support 'reply' for compatibility
      const responseText = data.response || data.reply;

      // Check that 'response' field exists and is a string
      if (!responseText || typeof responseText !== 'string') {
        log.error('❌ FalkeAI response field missing or invalid:', {
          field: 'response',
          responseValue: data.response,
          responseType: typeof data.response,
          replyValue: data.reply,
          replyType: typeof data.reply,
          receivedKeys: Object.keys(data),
        });
        throw new FalkeAIError('Invalid response: missing "response" field', undefined, FalkeAIErrorCode.INVALID_RESPONSE);
      }

      // Check that 'model' field exists and is a string (optional but log if missing)
      if (!data.model || typeof data.model !== 'string') {
        log.warn('⚠️ FalkeAI model field missing or invalid (non-critical):', {
          field: 'model',
          modelValue: data.model,
          modelType: typeof data.model,
        });
      }

      // Success! Log the validated response
      log.info('✅ FalkeAI Response valid:', {
        responseLength: responseText.length,
        model: data.model || 'unknown',
        timestamp: data.timestamp || 'generated',
        durationMs: requestDuration,
      });

      return {
        reply: responseText,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const requestDuration = Date.now() - requestStartTime;

      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        log.error('❌ FalkeAI request timed out', {
          timeout: this.timeout,
          durationMs: requestDuration,
        });
        throw new FalkeAIError('AI service request timed out. Please try again.', undefined, FalkeAIErrorCode.TIMEOUT);
      }

      // Handle network errors (TypeError with specific patterns)
      if (error instanceof TypeError) {
        log.error('❌ FalkeAI network error', {
          error: error.message,
          baseUrl: this.baseUrl,
          durationMs: requestDuration,
          hint: 'Check if FalkeAI service is running and accessible',
        });
        throw new FalkeAIError(`Network error: Unable to reach AI service at ${this.baseUrl}`, undefined, FalkeAIErrorCode.NETWORK_ERROR);
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Parse error response from FalkeAI
   */
  private async parseErrorResponse(response: Response): Promise<string> {
    try {
      const data = await response.json() as { message?: string; error?: string };
      return data.message || data.error || `AI service error (${response.status})`;
    } catch {
      // If we can't parse the error response, return a generic message
      return `AI service error (${response.status})`;
    }
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export a singleton instance
export const falkeAIService = new FalkeAIService();

export default FalkeAIService;
