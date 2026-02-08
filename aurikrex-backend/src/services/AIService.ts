/**
 * AI Service
 * 
 * Smart AI Model Router with OpenRouter (PRIMARY) + Groq (FALLBACK)
 * 
 * PRIMARY: OpenRouter (2 TESTED & WORKING FREE models - NO EXPIRY - smart routing)
 *   - Simple questions → Google Gemma 3 4B (FAST)
 *   - Balanced questions → Google Gemma 3 4B (RELIABLE)
 *   - Complex/Reasoning → Meta Llama 3.3 70B (SMART)
 *   - Coding questions → Meta Llama 3.3 70B (EXPERT)
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
  EnhancedAIChatRequest,
  EnhancedAIChatResponse,
} from '../types/ai.types.js';
import { promptEnhancerService } from './PromptEnhancerService.js';
import { responseRefinerService } from './ResponseRefinerService.js';

// Configuration constants
const DEFAULT_TIMEOUT = 90000; // 90 seconds for complex questions
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1024;
const ENHANCED_MAX_TOKENS = 2000; // More tokens for enhanced responses
const MAX_RETRIES = 3; // Maximum number of retry attempts
const INITIAL_BACKOFF_MS = 1000; // Initial backoff delay (1 second)

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
  provider?: 'openrouter' | 'groq';
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

  // OpenRouter models - Updated Phase 4 Model Configuration
  // Primary: NVIDIA Nemotron Nano 12B 2 VL (multimodal, 128K context, free tier)
  // Fallback: Google Gemma 3 12B (text + image, 33K context, free tier)
  // See: https://openrouter.ai/models (filter by free)
  private readonly models = {
    // Fast model - Google Gemma 3 12B (Reliable fallback for simple tasks)
    fast: 'google/gemma-3-12b-it:free',
    
    // Balanced model - Google Gemma 3 12B (Good for most queries)
    balanced: 'google/gemma-3-12b-it:free',
    
    // Smart model - NVIDIA Nemotron Nano 12B (Primary for complex reasoning)
    smart: 'nvidia/llama-3.1-nemotron-nano-12b-v1:free',
    
    // Expert model - NVIDIA Nemotron Nano 12B (Best for coding/complex tasks)
    expert: 'nvidia/llama-3.1-nemotron-nano-12b-v1:free',

    // Legacy models kept as additional fallbacks
    legacyGemma4b: 'google/gemma-3-4b-it:free',
    legacyLlama70b: 'meta-llama/llama-3.3-70b-instruct:free',
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
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate exponential backoff delay
   * @param attempt - Current attempt number (1-indexed)
   * @returns Delay in milliseconds with jitter
   */
  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, etc.
    const exponentialDelay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
    // Add jitter (±20%) to prevent thundering herd
    const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  /**
   * Check if an error is retryable
   * @param error - The error to check
   * @returns Boolean indicating if the error can be retried
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof AIServiceError) {
      // Rate limits and server errors are retryable
      return error.errorCode === AIErrorCode.RATE_LIMITED ||
             error.errorCode === AIErrorCode.SERVICE_UNAVAILABLE ||
             error.errorCode === AIErrorCode.TIMEOUT ||
             (error.statusCode !== undefined && error.statusCode >= 500);
    }
    // Network errors are generally retryable
    if (error instanceof Error) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNRESET' || 
          axiosError.code === 'ENOTFOUND' ||
          axiosError.code === 'ETIMEDOUT' ||
          axiosError.code === 'ECONNABORTED') {
        return true;
      }
    }
    return false;
  }

  /**
   * Execute a function with retry logic and exponential backoff
   * @param fn - The async function to execute
   * @param operationName - Name for logging purposes
   * @returns The result of the function
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry
        if (attempt < MAX_RETRIES && this.isRetryableError(error)) {
          const backoffMs = this.calculateBackoff(attempt);
          log.warn(`⚠️ ${operationName} attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${Math.round(backoffMs)}ms...`, {
            error: lastError.message,
            attempt,
            backoffMs: Math.round(backoffMs),
          });
          await this.sleep(backoffMs);
          continue;
        }
        
        // Not retryable or max retries reached
        log.error(`❌ ${operationName} failed after ${attempt} attempt(s)`, {
          error: lastError.message,
          finalAttempt: attempt,
        });
        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error(`${operationName} failed after ${MAX_RETRIES} attempts`);
  }

  /**
   * Send a chat message to the AI service
   * 
   * @param request - The chat request containing message and context
   * @param messageHistory - Optional array of previous messages for context
   * @returns Promise<AIChatResponse> - The response from the AI
   */
  public async sendChatMessage(
    request: AIChatRequest,
    messageHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<AIChatResponse> {
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
      historyLength: messageHistory?.length || 0,
      timestamp: new Date().toISOString(),
    });

    // Queue the request to prevent overload
    return new Promise<AIChatResponse>((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const response = await this.executeRequestWithRetry(request, messageHistory);
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
   * Send an enhanced chat message to the AI service with prompt engineering
   * 
   * This method implements a three-layer system:
   * 1. REQUEST ENHANCEMENT (Pre-Processing) - Transforms user input into optimal model prompt
   * 2. AI MODEL CALL - Sends enhanced prompt to the AI model with system prompt
   * 3. RESPONSE REFINEMENT (Post-Processing) - Cleans up and structures the response
   * 
   * @param request - The enhanced chat request containing message, context, and optional request type
   * @returns Promise<EnhancedAIChatResponse> - The refined response from the AI
   */
  public async sendEnhancedChatMessage(request: EnhancedAIChatRequest): Promise<EnhancedAIChatResponse> {
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

    log.info('📤 Sending ENHANCED message to AI Service', {
      page: request.context.page,
      userId: request.context.userId,
      messageLength: request.message.length,
      requestType: request.requestType || 'auto-detect',
      timestamp: new Date().toISOString(),
    });

    // Queue the request to prevent overload
    return new Promise<EnhancedAIChatResponse>((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const response = await this.executeEnhancedRequestWithRetry(request);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });

      log.info(`📋 Enhanced request queued. Queue length: ${this.requestQueue.length}`, {
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
   * Routes questions to appropriate models (Phase 4 Configuration):
   * - Coding questions → Expert (NVIDIA Nemotron Nano 12B) - Best for code/algorithms
   * - Complex/Reasoning → Smart (NVIDIA Nemotron Nano 12B) - Deep analysis  
   * - General questions → Balanced (Google Gemma 3 12B) - Good for most queries
   * - Simple/short → Fast (Google Gemma 3 12B) - Quick responses
   */
  private selectBestModel(message: string): SelectedModel {
    const lower = message.toLowerCase();

    // CODING DETECTION → Expert Model (NVIDIA Nemotron Nano 12B)
    // Uses word boundaries to avoid false positives (e.g., "classical" won't match "class")
    if (/\b(code|function|javascript|typescript|python|debug|implement|algorithm|syntax|program|variable|class|method)\b/.test(lower)) {
      log.info('🔍 Detected: CODING question → Using NVIDIA Nemotron Nano 12B');
      return {
        id: this.models.expert,
        name: 'NVIDIA Nemotron Nano 12B (Expert)',
        type: 'coding',
      };
    }

    // COMPLEX/REASONING DETECTION → Smart Model (NVIDIA Nemotron Nano 12B)
    // Uses word boundaries to avoid false positives
    if (/\b(explain|why|how|analyze|compare|theory|concept|research|mechanism|complex|quantum|difference)\b/.test(lower)) {
      log.info('🔍 Detected: COMPLEX/REASONING question → Using NVIDIA Nemotron Nano 12B');
      return {
        id: this.models.smart,
        name: 'NVIDIA Nemotron Nano 12B (Smart)',
        type: 'smart',
      };
    }

    // BALANCED DETECTION → General Purpose (Google Gemma 3 12B)
    // Uses word boundaries to avoid false positives
    if (/\b(what|tell|describe|define|list|summarize)\b/.test(lower)) {
      log.info('🔍 Detected: BALANCED question → Using Google Gemma 3 12B');
      return {
        id: this.models.balanced,
        name: 'Google Gemma 3 12B (Balanced)',
        type: 'balanced',
      };
    }

    // SIMPLE DETECTION (short questions < 10 words) → Fast Model (Google Gemma 3 12B)
    // Use robust word counting that handles multiple whitespace correctly
    const wordCount = message.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < 10) {
      log.info('🔍 Detected: SIMPLE/QUICK question → Using Google Gemma 3 12B');
      return {
        id: this.models.fast,
        name: 'Google Gemma 3 12B (Fast)',
        type: 'fast',
      };
    }

    // DEFAULT: Use balanced model for medium complexity
    log.info('🔍 Detected: BALANCED question (default) → Using Google Gemma 3 12B');
    return {
      id: this.models.balanced,
      name: 'Google Gemma 3 12B (Balanced)',
      type: 'balanced',
    };
  }

  /**
   * Get fallback chain of models based on question complexity
   * 
   * Phase 4 Model Configuration:
   * - Primary: NVIDIA Nemotron Nano 12B (complex/coding tasks)
   * - Fallback: Google Gemma 3 12B (simpler tasks or when primary fails)
   * - Legacy fallback: Gemma 4B, Llama 70B, Groq Mixtral
   * 
   * The chain is built dynamically based on which providers have valid API keys.
   */
  private getModelChain(type: string): SelectedModel[] {
    const chain: SelectedModel[] = [];

    if (type === 'fast' || type === 'balanced') {
      // For simple/balanced questions: Gemma 12B is the primary, with fallbacks
      if (this.openrouterKey) {
        chain.push({ id: this.models.balanced, name: 'Google Gemma 3 12B', type: 'balanced', provider: 'openrouter' });
        chain.push({ id: this.models.legacyGemma4b, name: 'Google Gemma 3 4B (Fallback)', type: 'fast', provider: 'openrouter' });
      }
      // Add Groq as fallback if OpenRouter fails
      if (this.groqKey) {
        chain.push({ id: 'mixtral-8x7b-32768', name: 'Groq Mixtral', type: 'fallback', provider: 'groq' });
      }
    } else {
      // For complex/coding questions: Nemotron → Gemma 12B → Legacy Llama → Groq
      if (this.openrouterKey) {
        chain.push({ id: this.models.expert, name: 'NVIDIA Nemotron Nano 12B', type: 'smart', provider: 'openrouter' });
        chain.push({ id: this.models.balanced, name: 'Google Gemma 3 12B (Fallback)', type: 'balanced', provider: 'openrouter' });
        chain.push({ id: this.models.legacyLlama70b, name: 'Meta Llama 3.3 70B (Fallback)', type: 'smart', provider: 'openrouter' });
        chain.push({ id: this.models.legacyGemma4b, name: 'Google Gemma 3 4B (Fallback)', type: 'fast', provider: 'openrouter' });
      }
      // Groq is last resort only
      if (this.groqKey) {
        chain.push({ id: 'mixtral-8x7b-32768', name: 'Groq Mixtral', type: 'fallback', provider: 'groq' });
      }
    }

    return chain;
  }

  /**
   * Call AI with smart fallback chain
   * Tries each model in the chain until one succeeds
   */
  private async callAIWithFallback(
    message: string,
    messageHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{ text: string; model: SelectedModel }> {
    const selectedModel = this.selectBestModel(message);
    const modelChain = this.getModelChain(selectedModel.type);
    
    // Handle case when no providers are configured
    if (modelChain.length === 0) {
      log.error('❌ No AI providers available for this question type');
      throw new AIServiceError(
        'No AI providers available. Please configure OPENROUTER_API_KEY and/or GROQ_API_KEY',
        503,
        AIErrorCode.SERVICE_UNAVAILABLE
      );
    }
    
    log.info(`🔄 Starting AI call chain for ${selectedModel.type} question (${modelChain.length} models available)`);

    let lastError: Error | null = null;

    for (let i = 0; i < modelChain.length; i++) {
      const model = modelChain[i];
      
      try {
        log.info(`📊 Attempting (${i + 1}/${modelChain.length}): ${model.name}`);
        
        let response: { text: string };
        
        if (model.provider === 'groq') {
          response = await this.callGroq(message, messageHistory);
        } else {
          response = await this.callOpenRouter(message, model.id, messageHistory);
        }
        
        log.info(`✅ ${model.name} succeeded!`);
        return { text: response.text, model };
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMsg = lastError.message;
        log.warn(`⚠️ ${model.name} failed: ${errorMsg}`);
        
        // If this is the last model, throw error
        if (i === modelChain.length - 1) {
          log.error(`❌ All models failed. Chain exhausted.`);
          throw new AIServiceError(
            `All AI providers failed: ${errorMsg}`,
            503,
            AIErrorCode.SERVICE_UNAVAILABLE
          );
        }
        
        // Otherwise, continue to next model
        log.info(`🔄 Trying next model in chain...`);
        continue;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new AIServiceError('All AI providers failed', 503, AIErrorCode.SERVICE_UNAVAILABLE);
  }

  /**
   * Execute request with smart fallback chain
   */
  private async executeRequestWithRetry(
    request: AIChatRequest,
    messageHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<AIChatResponse> {
    const startTime = Date.now();

    // Check if at least one provider is configured
    if (!this.openrouterKey && !this.groqKey) {
      log.error('❌ No AI providers configured');
      throw new AIServiceError(
        'No AI providers configured. Please set OPENROUTER_API_KEY and/or GROQ_API_KEY',
        503,
        AIErrorCode.SERVICE_UNAVAILABLE
      );
    }

    try {
      // Use smart fallback chain - the chain itself handles fallback logic
      const result = await this.callAIWithFallback(request.message, messageHistory);
      
      const latency = Date.now() - startTime;
      log.info(`✅ AI response received in ${latency}ms from ${result.model.name}`);

      return {
        reply: result.text,
        timestamp: new Date().toISOString(),
        provider: result.model.provider || 'openrouter',
        model: result.model.name,
        modelType: result.model.type,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.error('❌ All AI providers failed', {
        error: errorMsg,
      });

      throw new AIServiceError(
        `All AI providers failed: ${errorMsg}`,
        503,
        AIErrorCode.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Execute enhanced request with prompt engineering, retry logic, and provider fallback
   * 
   * This implements the three-layer prompt engineering system:
   * 1. Pre-processing: Enhance the prompt with system instructions and user context
   * 2. Model call: Send enhanced prompt to AI with system prompt
   * 3. Post-processing: Refine and structure the response
   */
  private async executeEnhancedRequestWithRetry(request: EnhancedAIChatRequest): Promise<EnhancedAIChatResponse> {
    const startTime = Date.now();
    let openrouterError: Error | null = null;
    let groqError: Error | null = null;

    // Layer 1: PROMPT ENHANCEMENT (Pre-Processing) with safe validation
    const enhancementResult = promptEnhancerService.safeEnhancePrompt(
      request.message,
      request.requestType,
      request.userLearningContext
    );

    // If enhancement failed, return graceful fallback response
    if (!enhancementResult.success) {
      log.error('❌ Prompt enhancement failed, returning fallback response', {
        error: enhancementResult.error,
        userId: request.context.userId,
        messagePreview: typeof request.message === 'string'
          ? request.message.substring(0, 50)
          : 'Invalid message type',
      });

      return {
        reply: enhancementResult.fallbackMessage,
        timestamp: new Date().toISOString(),
        provider: 'openrouter',
        model: 'N/A (validation failed)',
        modelType: 'fallback',
        requestType: 'question',
      };
    }

    const enhancement = enhancementResult.enhancement;

    log.info(`📋 Prompt enhanced`, {
      requestType: enhancement.requestType,
      detectedIntent: enhancement.detectedIntent,
      complexity: enhancement.estimatedComplexity,
      originalLength: request.message.length,
      enhancedLength: enhancement.enhancedRequest.length,
    });

    // Try OpenRouter first (PRIMARY) with retry logic
    if (this.openrouterKey) {
      try {
        log.info('📨 Trying OpenRouter with ENHANCED prompt (PRIMARY) with retry logic...');
        const selectedModel = this.selectBestModel(request.message);
        log.info(`🧠 Question analysis suggests: ${selectedModel.type} model`);
        log.info(`📊 Using OpenRouter model: ${selectedModel.name}`);

        // Layer 2: MODEL CALL with system prompt (with retry)
        const response = await this.executeWithRetry(
          () => this.callOpenRouterEnhanced(
            enhancement.enhancedRequest,
            enhancement.systemPrompt,
            selectedModel.id
          ),
          'OpenRouter Enhanced API call'
        );
        const latency = Date.now() - startTime;
        log.info(`✅ OpenRouter enhanced response received in ${latency}ms`);

        // Layer 3: RESPONSE REFINEMENT (Post-Processing)
        const refined = responseRefinerService.refineResponse(response.text, enhancement.requestType);

        return {
          reply: refined.refined,
          timestamp: new Date().toISOString(),
          provider: 'openrouter',
          model: selectedModel.name,
          modelType: selectedModel.type,
          refined,
          requestType: enhancement.requestType,
        };
      } catch (error) {
        openrouterError = error instanceof Error ? error : new Error(String(error));
        log.warn('⚠️ OpenRouter failed after retries, trying Groq fallback...', {
          error: openrouterError.message,
        });
      }
    }

    // Fallback to Groq (if OpenRouter fails completely) with retry logic
    if (this.groqKey) {
      try {
        log.info('📨 Trying Groq with ENHANCED prompt (FALLBACK) with retry logic...');
        
        // Layer 2: MODEL CALL with system prompt (with retry)
        const response = await this.executeWithRetry(
          () => this.callGroqEnhanced(
            enhancement.enhancedRequest,
            enhancement.systemPrompt
          ),
          'Groq Enhanced API call'
        );
        const latency = Date.now() - startTime;
        log.info(`✅ Groq enhanced response received in ${latency}ms`);

        // Layer 3: RESPONSE REFINEMENT (Post-Processing)
        const refined = responseRefinerService.refineResponse(response.text, enhancement.requestType);

        return {
          reply: refined.refined,
          timestamp: new Date().toISOString(),
          provider: 'groq',
          model: 'Mixtral 8x7B (Groq Fallback)',
          modelType: 'fallback',
          refined,
          requestType: enhancement.requestType,
        };
      } catch (error) {
        groqError = error instanceof Error ? error : new Error(String(error));
        log.error('❌ Groq also failed after retries', {
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
  private async callOpenRouter(
    message: string,
    modelId: string,
    messageHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{ text: string }> {
    // Use message history if provided, otherwise create a single message array
    // Note: When messageHistory is provided, it already includes the current message from the controller
    const messages = messageHistory && messageHistory.length > 0
      ? messageHistory.map(msg => ({ role: msg.role, content: msg.content }))
      : [{ role: 'user' as const, content: message }];

    log.info(`📡 Calling OpenRouter with model: ${modelId}, history: ${messageHistory?.length || 0} messages`);

    try {
      const response = await axios.post(
        this.openrouterBaseUrl,
        {
          model: modelId,
          messages: messages,
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
  private async callGroq(
    message: string,
    messageHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{ text: string }> {
    // Use message history if provided, otherwise create a single message array
    // Note: When messageHistory is provided, it already includes the current message from the controller
    const messages = messageHistory && messageHistory.length > 0
      ? messageHistory.map(msg => ({ role: msg.role, content: msg.content }))
      : [{ role: 'user' as const, content: message }];

    log.info(`📡 Calling Groq with model: ${this.groqFallbackModel}, history: ${messageHistory?.length || 0} messages`);

    try {
      const response = await axios.post(
        this.groqBaseUrl,
        {
          model: this.groqFallbackModel,
          messages: messages,
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

  /**
   * Call OpenRouter API with system prompt for enhanced requests
   */
  private async callOpenRouterEnhanced(
    message: string,
    systemPrompt: string,
    modelId: string
  ): Promise<{ text: string }> {
    log.info(`📡 Calling OpenRouter ENHANCED with model: ${modelId}`);

    try {
      // CRITICAL: Free tier models (Gemma, Llama) ignore system role messages.
      // Embed the system prompt directly in the user message for identity to work.
      const response = await axios.post(
        this.openrouterBaseUrl,
        {
          model: modelId,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${message}`,
            },
          ],
          max_tokens: ENHANCED_MAX_TOKENS,
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

      log.info(`📥 Enhanced raw response received (${responseText.length} chars)`);

      if (!responseText) {
        log.warn('⚠️ OpenRouter returned empty content', {
          hasMessage: !!choices[0]?.message,
          hasContent: !!choices[0]?.message?.content,
        });
        throw new AIServiceError('Empty response from OpenRouter', undefined, AIErrorCode.INVALID_RESPONSE);
      }

      log.info('✅ OpenRouter enhanced response valid');
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
   * Call Groq API with system prompt for enhanced requests
   */
  private async callGroqEnhanced(
    message: string,
    systemPrompt: string
  ): Promise<{ text: string }> {
    log.info(`📡 Calling Groq ENHANCED with model: ${this.groqFallbackModel}`);

    try {
      // CRITICAL: Free tier models may ignore system role messages.
      // Embed the system prompt directly in the user message for identity to work.
      const response = await axios.post(
        this.groqBaseUrl,
        {
          model: this.groqFallbackModel,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${message}`,
            },
          ],
          max_tokens: ENHANCED_MAX_TOKENS,
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

      log.info(`📥 Enhanced raw response received (${responseText.length} chars)`);

      if (!responseText) {
        log.warn('⚠️ Groq returned empty content', {
          hasMessage: !!choices[0]?.message,
          hasContent: !!choices[0]?.message?.content,
        });
        throw new AIServiceError('Empty response from Groq', undefined, AIErrorCode.INVALID_RESPONSE);
      }

      log.info('✅ Groq enhanced response valid');
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
