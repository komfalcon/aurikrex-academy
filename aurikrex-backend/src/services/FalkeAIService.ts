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

/**
 * Custom error class that carries HTTP status code information
 * Used to determine if an error is retryable based on status code
 */
class FalkeAIError extends Error {
  public readonly statusCode?: number;
  public readonly isRetryable: boolean;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'FalkeAIError';
    this.statusCode = statusCode;
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
      log.info('✅ FalkeAI Service initialized successfully');
    } else {
      log.warn('⚠️ FalkeAI Service: Missing configuration. FALKEAI_API_BASE_URL and FALKEAI_API_KEY required.');
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
      log.error('❌ FalkeAI Service not configured');
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
      page: request.context.page,
      userId: request.context.userId,
      messageLength: request.message.length,
    });

    let lastError: Error | null = null;

    // Retry logic for transient failures
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.makeRequest(request);
        
        log.info('✅ FalkeAI response received', {
          page: request.context.page,
          userId: request.context.userId,
          replyLength: response.reply.length,
        });

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry for non-retryable errors (client errors 4xx)
        if (error instanceof FalkeAIError && !error.isRetryable) {
          throw lastError;
        }

        log.warn(`⚠️ FalkeAI request attempt ${attempt} failed`, {
          error: lastError.message,
          willRetry: attempt < MAX_RETRIES,
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
    });

    throw new Error('AI service is temporarily unavailable. Please try again later.');
  }

  /**
   * Make the actual HTTP request to FalkeAI
   */
  private async makeRequest(request: FalkeAIChatRequest): Promise<FalkeAIChatResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Build the request payload
      // Note: System identity is injected here (not exposed to frontend)
      const payload = {
        message: request.message,
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

      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorMessage = await this.parseErrorResponse(response);
        // Throw FalkeAIError with status code for proper retry logic
        throw new FalkeAIError(errorMessage, response.status);
      }

      // Parse response
      const data = await response.json() as { reply?: string };

      // Validate response structure
      if (!data || typeof data.reply !== 'string') {
        throw new FalkeAIError('Invalid response from AI service');
      }

      return {
        reply: data.reply,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new FalkeAIError('AI service request timed out. Please try again.');
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
