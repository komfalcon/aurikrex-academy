/**
 * Prompt Enhancer Service
 * 
 * Layer 1: REQUEST ENHANCEMENT (Pre-Processing)
 * Transforms user input into optimal model prompts with:
 * - Intent detection
 * - Complexity estimation
 * - System prompt selection
 * - User context building
 * - Input validation with graceful error handling
 */

import { log } from '../utils/logger.js';
import {
  AIRequestType,
  UserLearningContext,
  PromptEnhancement,
  DEFAULT_USER_LEARNING_CONTEXT,
} from '../types/ai.types.js';
import { getSystemPrompt } from './prompts/systemPrompts.js';

/**
 * Validation constraints for prompt enhancement
 */
const VALIDATION_LIMITS = {
  MIN_MESSAGE_LENGTH: 1,
  MAX_MESSAGE_LENGTH: 10000,
  MAX_CONTEXT_STRING_LENGTH: 500,
  MAX_ARRAY_LENGTH: 50,
};

/**
 * Graceful fallback message for validation failures
 */
export const FALKEAI_VALIDATION_ERROR_MESSAGE = "I'm having trouble thinking right now — try again.";

/**
 * Custom error class for validation errors
 */
export class PromptValidationError extends Error {
  public readonly code: string;
  public readonly field?: string;
  
  constructor(message: string, code: string, field?: string) {
    super(message);
    this.name = 'PromptValidationError';
    this.code = code;
    this.field = field;
  }
}

/**
 * Keywords for detecting request intent
 */
const INTENT_KEYWORDS = {
  teach: ['teach', 'learn', 'explain how', 'show me how', 'help me understand', 'introduction to', 'tutorial', 'guide me through', 'what is'],
  question: ['what', 'why', 'how', 'when', 'where', 'which', 'is it', 'does', 'can', 'should', 'would', 'could'],
  hint: ['hint', 'clue', 'help me solve', 'stuck on', 'don\'t understand', 'give me a tip', 'point me', 'guide'],
  review: ['review', 'check', 'evaluate', 'grade', 'feedback', 'correct', 'is this right', 'did i do this correctly', 'assess'],
  explanation: ['explain', 'clarify', 'define', 'meaning of', 'difference between', 'elaborate', 'break down'],
};

/**
 * Keywords for estimating complexity
 */
const COMPLEXITY_INDICATORS = {
  high: ['quantum', 'advanced', 'complex', 'deep learning', 'neural', 'differential', 'integral', 'theorem', 'proof', 'algorithm', 'optimization', 'theory', 'mechanism', 'derive'],
  medium: ['implement', 'analyze', 'compare', 'design', 'solve', 'calculate', 'function', 'method', 'class', 'system', 'process', 'concept'],
  low: ['basic', 'simple', 'beginner', 'introduction', 'what is', 'define', 'example', 'hello', 'hi', 'thanks'],
};

/**
 * Prompt Enhancer Service
 * Enhances user requests with context, system prompts, and instructions
 */
export class PromptEnhancerService {
  /**
   * Validate the user request input
   * @throws PromptValidationError if validation fails
   */
  public validateRequest(userRequest: string): void {
    // DEBUG: Log the exact incoming payload before any validation
    log.info('🔍 [DEBUG] validateRequest() - Incoming request payload:', {
      receivedType: typeof userRequest,
      isNull: userRequest === null,
      isUndefined: userRequest === undefined,
      rawValue: userRequest === null ? 'null' : 
                userRequest === undefined ? 'undefined' : 
                typeof userRequest === 'string' ? 
                  (userRequest.length > 200 ? userRequest.substring(0, 200) + '...[truncated]' : userRequest) :
                  JSON.stringify(userRequest),
      rawLength: typeof userRequest === 'string' ? userRequest.length : 'N/A',
      validationRules: {
        mustBeString: true,
        mustNotBeNullOrUndefined: true,
        minLength: VALIDATION_LIMITS.MIN_MESSAGE_LENGTH,
        maxLength: VALIDATION_LIMITS.MAX_MESSAGE_LENGTH,
      },
    });

    // Check for null/undefined
    if (userRequest === null || userRequest === undefined) {
      const error = new PromptValidationError(
        'User request is required',
        'MISSING_REQUEST',
        'userRequest'
      );
      log.error('❌ [DEBUG] Validation FAILED: missing request', { 
        code: error.code,
        field: error.field,
        receivedValue: userRequest === null ? 'null' : 'undefined',
        receivedType: typeof userRequest,
      });
      throw error;
    }

    // Check type
    if (typeof userRequest !== 'string') {
      const error = new PromptValidationError(
        'User request must be a string',
        'INVALID_TYPE',
        'userRequest'
      );
      log.error('❌ [DEBUG] Validation FAILED: invalid type', { 
        code: error.code,
        field: error.field,
        receivedType: typeof userRequest,
        receivedValue: JSON.stringify(userRequest),
        expectedType: 'string',
      });
      throw error;
    }

    // Check minimum length
    const trimmedRequest = userRequest.trim();
    if (trimmedRequest.length < VALIDATION_LIMITS.MIN_MESSAGE_LENGTH) {
      const error = new PromptValidationError(
        'User request cannot be empty',
        'EMPTY_REQUEST',
        'userRequest'
      );
      log.error('❌ [DEBUG] Validation FAILED: empty request', { 
        code: error.code,
        field: error.field,
        originalLength: userRequest.length,
        trimmedLength: trimmedRequest.length,
        minRequired: VALIDATION_LIMITS.MIN_MESSAGE_LENGTH,
        rawValue: userRequest.length > 50 ? userRequest.substring(0, 50) + '...' : userRequest,
      });
      throw error;
    }

    // Check maximum length
    if (trimmedRequest.length > VALIDATION_LIMITS.MAX_MESSAGE_LENGTH) {
      const error = new PromptValidationError(
        `User request exceeds maximum length of ${VALIDATION_LIMITS.MAX_MESSAGE_LENGTH} characters`,
        'REQUEST_TOO_LONG',
        'userRequest'
      );
      log.error('❌ [DEBUG] Validation FAILED: request too long', { 
        code: error.code,
        field: error.field,
        length: trimmedRequest.length,
        maxLength: VALIDATION_LIMITS.MAX_MESSAGE_LENGTH,
        excess: trimmedRequest.length - VALIDATION_LIMITS.MAX_MESSAGE_LENGTH,
      });
      throw error;
    }

    log.info('✅ [DEBUG] Request validation PASSED', { 
      length: trimmedRequest.length,
    });
  }

  /**
   * Validate user learning context
   * @returns Sanitized context or default context if invalid
   */
  public validateAndSanitizeContext(
    userContext?: Partial<UserLearningContext>
  ): UserLearningContext {
    // DEBUG: Log incoming context payload
    log.info('🔍 [DEBUG] validateAndSanitizeContext() - Incoming context payload:', {
      hasContext: !!userContext,
      contextType: typeof userContext,
      contextValue: userContext ? JSON.stringify(userContext).substring(0, 500) : 'undefined/null',
    });

    try {
      // If no context provided, use defaults
      if (!userContext) {
        log.info('📋 [DEBUG] No user context provided, using defaults');
        return { ...DEFAULT_USER_LEARNING_CONTEXT };
      }

      // Validate and sanitize learning style
      const validLearningStyles = ['visual', 'textual', 'kinesthetic', 'auditory'];
      const learningStyle = validLearningStyles.includes(userContext.learningStyle || '')
        ? userContext.learningStyle!
        : DEFAULT_USER_LEARNING_CONTEXT.learningStyle;

      // Validate and sanitize knowledge level
      const validKnowledgeLevels = ['beginner', 'intermediate', 'advanced'];
      const knowledgeLevel = validKnowledgeLevels.includes(userContext.knowledgeLevel || '')
        ? userContext.knowledgeLevel!
        : DEFAULT_USER_LEARNING_CONTEXT.knowledgeLevel;

      // Validate and sanitize preferred pace
      const validPaces = ['fast', 'moderate', 'slow'];
      const preferredPace = validPaces.includes(userContext.preferredPace || '')
        ? userContext.preferredPace!
        : DEFAULT_USER_LEARNING_CONTEXT.preferredPace;

      // Sanitize arrays (limit length and ensure string items)
      const sanitizeStringArray = (arr: unknown[] | undefined, maxLength: number): string[] => {
        if (!Array.isArray(arr)) return [];
        return arr
          .filter((item): item is string => typeof item === 'string')
          .slice(0, maxLength)
          .map(s => s.substring(0, VALIDATION_LIMITS.MAX_CONTEXT_STRING_LENGTH));
      };

      // Validate preferences
      const validDetailLevels = ['brief', 'moderate', 'detailed'];
      const preferences = {
        includeExamples: typeof userContext.preferences?.includeExamples === 'boolean'
          ? userContext.preferences.includeExamples
          : DEFAULT_USER_LEARNING_CONTEXT.preferences.includeExamples,
        includeFormulas: typeof userContext.preferences?.includeFormulas === 'boolean'
          ? userContext.preferences.includeFormulas
          : DEFAULT_USER_LEARNING_CONTEXT.preferences.includeFormulas,
        detailLevel: validDetailLevels.includes(userContext.preferences?.detailLevel || '')
          ? userContext.preferences!.detailLevel
          : DEFAULT_USER_LEARNING_CONTEXT.preferences.detailLevel,
        codeExamples: typeof userContext.preferences?.codeExamples === 'boolean'
          ? userContext.preferences.codeExamples
          : DEFAULT_USER_LEARNING_CONTEXT.preferences.codeExamples,
        historicalContext: typeof userContext.preferences?.historicalContext === 'boolean'
          ? userContext.preferences.historicalContext
          : DEFAULT_USER_LEARNING_CONTEXT.preferences.historicalContext,
      };

      const sanitizedContext: UserLearningContext = {
        userId: typeof userContext.userId === 'string' 
          ? userContext.userId.substring(0, 100) 
          : DEFAULT_USER_LEARNING_CONTEXT.userId,
        learningStyle,
        knowledgeLevel,
        preferredPace,
        previousTopics: sanitizeStringArray(userContext.previousTopics, VALIDATION_LIMITS.MAX_ARRAY_LENGTH),
        strengths: sanitizeStringArray(userContext.strengths, VALIDATION_LIMITS.MAX_ARRAY_LENGTH),
        weaknesses: sanitizeStringArray(userContext.weaknesses, VALIDATION_LIMITS.MAX_ARRAY_LENGTH),
        preferences,
      };

      log.info('✅ [DEBUG] Context validation PASSED, sanitized context:', {
        hasUserId: !!sanitizedContext.userId,
        learningStyle: sanitizedContext.learningStyle,
        knowledgeLevel: sanitizedContext.knowledgeLevel,
        preferredPace: sanitizedContext.preferredPace,
        previousTopicsCount: sanitizedContext.previousTopics.length,
        strengthsCount: sanitizedContext.strengths.length,
        weaknessesCount: sanitizedContext.weaknesses.length,
      });

      return sanitizedContext;
    } catch (error) {
      log.warn('⚠️ [DEBUG] Error validating user context, using defaults', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      return { ...DEFAULT_USER_LEARNING_CONTEXT };
    }
  }

  /**
   * Detect the intent of the user request
   */
  public detectIntent(userRequest: string): AIRequestType {
    const lower = userRequest.toLowerCase();
    
    // Check each intent type
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          log.debug(`Detected intent: ${intent} (keyword: ${keyword})`);
          return intent as AIRequestType;
        }
      }
    }
    
    // Default to question for short requests, teach for longer ones
    const wordCount = userRequest.trim().split(/\s+/).filter(w => w.length > 0).length;
    return wordCount < 10 ? 'question' : 'teach';
  }

  /**
   * Estimate the complexity of the user request
   */
  public estimateComplexity(userRequest: string): 'low' | 'medium' | 'high' {
    const lower = userRequest.toLowerCase();
    
    // Check high complexity first
    for (const keyword of COMPLEXITY_INDICATORS.high) {
      if (lower.includes(keyword)) {
        log.debug(`Estimated complexity: high (keyword: ${keyword})`);
        return 'high';
      }
    }
    
    // Check medium complexity
    for (const keyword of COMPLEXITY_INDICATORS.medium) {
      if (lower.includes(keyword)) {
        log.debug(`Estimated complexity: medium (keyword: ${keyword})`);
        return 'medium';
      }
    }
    
    // Check low complexity indicators
    for (const keyword of COMPLEXITY_INDICATORS.low) {
      if (lower.includes(keyword)) {
        log.debug(`Estimated complexity: low (keyword: ${keyword})`);
        return 'low';
      }
    }
    
    // Default based on message length
    const wordCount = userRequest.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > 30) return 'high';
    if (wordCount > 15) return 'medium';
    return 'low';
  }

  /**
   * Build user profile string for the prompt
   */
  public buildUserProfile(context: UserLearningContext): string {
    return `Learning Profile:
- Learning Style: ${context.learningStyle}
- Level: ${context.knowledgeLevel}
- Pace: ${context.preferredPace}
- Strengths: ${context.strengths.length > 0 ? context.strengths.join(', ') : 'Not specified'}
- Areas to improve: ${context.weaknesses.length > 0 ? context.weaknesses.join(', ') : 'Not specified'}
- Previous knowledge: ${context.previousTopics.length > 0 ? context.previousTopics.join(', ') : 'Not specified'}
- Preferences:
  - Detail level: ${context.preferences.detailLevel}
  - Include worked examples: ${context.preferences.includeExamples}
  - Include code examples: ${context.preferences.codeExamples}
  - Include formulas: ${context.preferences.includeFormulas}
  - Historical context: ${context.preferences.historicalContext}

Please tailor your response to this profile.`;
  }

  /**
   * Build type-specific instructions
   */
  public buildInstructions(requestType: AIRequestType, _userRequest: string, context: UserLearningContext): string {
    const level = context.knowledgeLevel;
    const pace = context.preferredPace;
    
    switch (requestType) {
      case 'teach':
        return `TEACHING INSTRUCTIONS:
- Adapt content to ${level} level
- Use ${pace === 'fast' ? 'concise' : pace === 'slow' ? 'detailed with many examples' : 'balanced'} explanations
${context.preferences.includeExamples ? '- Include worked examples with step-by-step solutions' : ''}
${context.preferences.includeFormulas ? '- Include mathematical formulas with explanations' : ''}
${context.preferences.codeExamples ? '- Include relevant code examples where applicable' : ''}
- Structure with clear sections and headers
- End with practice problems or next steps`;

      case 'question':
        return `QUESTION ANSWERING INSTRUCTIONS:
- Give a direct, ${level === 'beginner' ? 'simple and accessible' : level === 'advanced' ? 'detailed and thorough' : 'clear'} answer
- Explain reasoning appropriate for ${level} level
${context.preferences.includeExamples ? '- Include a concrete example' : ''}
- Point out any assumptions made
- Suggest follow-up topics if relevant`;

      case 'hint':
        return `HINT INSTRUCTIONS:
- Do NOT solve the problem completely
- Break down into smaller steps the user can attempt
- Ask guiding questions to lead them to understanding
- Suggest relevant concepts/formulas without applying them
- Encourage independent thinking
- Say "Try this next..." and let them work`;

      case 'review':
        return `REVIEW INSTRUCTIONS:
- Identify what's correct first (be encouraging)
- Find and explain errors clearly
- Provide the correct approach
- Give constructive suggestions for improvement
- Rate the work fairly (be honest but supportive)
- End with encouragement and next steps`;

      case 'explanation':
        return `EXPLANATION INSTRUCTIONS:
- Start with a ${level === 'beginner' ? 'simple, everyday' : level === 'advanced' ? 'precise, technical' : 'clear'} definition
- Build up complexity gradually
- Use ${level === 'beginner' ? 'relatable analogies' : 'appropriate technical comparisons'}
${context.preferences.includeExamples ? '- Provide concrete examples' : ''}
- Distinguish from similar concepts if relevant
- Highlight key takeaways`;

      default:
        return '';
    }
  }

  /**
   * Enhance a user prompt with context, system prompt, and instructions
   * @throws PromptValidationError if validation fails
   */
  public enhancePrompt(
    userRequest: string,
    requestType: AIRequestType | undefined,
    userContext?: Partial<UserLearningContext>
  ): PromptEnhancement {
    // Validate the user request
    this.validateRequest(userRequest);
    
    // Trim the request after validation for consistent processing
    const trimmedRequest = userRequest.trim();
    
    // Validate and sanitize context
    const fullContext = this.validateAndSanitizeContext(userContext);

    // Detect intent if not specified
    const detectedIntent = this.detectIntent(trimmedRequest);
    const finalRequestType = requestType || detectedIntent;
    
    // Estimate complexity
    const complexity = this.estimateComplexity(trimmedRequest);
    
    // Get system prompt
    const systemPrompt = getSystemPrompt(finalRequestType);
    
    // Build instructions
    const instructions = this.buildInstructions(finalRequestType, trimmedRequest, fullContext);
    
    // Build user profile
    const userProfile = this.buildUserProfile(fullContext);
    
    // Build enhanced request
    const enhancedRequest = `${instructions}

USER CONTEXT:
${userProfile}

USER REQUEST:
${trimmedRequest}`;

    log.info(`📋 Prompt enhanced`, {
      requestType: finalRequestType,
      detectedIntent,
      complexity,
      originalLength: trimmedRequest.length,
      enhancedLength: enhancedRequest.length,
    });

    return {
      originalRequest: trimmedRequest,
      enhancedRequest,
      systemPrompt,
      context: userProfile,
      instructions,
      requestType: finalRequestType,
      detectedIntent,
      estimatedComplexity: complexity,
    };
  }

  /**
   * Safely enhance a user prompt with graceful error handling
   * Returns a fallback response instead of throwing errors
   * 
   * DEBUG MODE: This method now includes detailed logging and returns
   * rejected value information for debugging purposes.
   */
  public safeEnhancePrompt(
    userRequest: string,
    requestType: AIRequestType | undefined,
    userContext?: Partial<UserLearningContext>
  ): { success: true; enhancement: PromptEnhancement } | { success: false; error: string; fallbackMessage: string; debugInfo?: object } {
    // DEBUG: Log entry point with full payload
    log.info('🔍 [DEBUG] safeEnhancePrompt() - Entry point:', {
      step: 'INCOMING_REQUEST',
      hasUserRequest: userRequest !== null && userRequest !== undefined,
      userRequestType: typeof userRequest,
      userRequestLength: typeof userRequest === 'string' ? userRequest.length : 'N/A',
      requestType: requestType || 'auto-detect',
      hasUserContext: !!userContext,
    });

    try {
      const enhancement = this.enhancePrompt(userRequest, requestType, userContext);
      
      log.info('✅ [DEBUG] safeEnhancePrompt() - Success:', {
        step: 'ENHANCEMENT_COMPLETE',
        finalRequestType: enhancement.requestType,
        detectedIntent: enhancement.detectedIntent,
        complexity: enhancement.estimatedComplexity,
        enhancedRequestLength: enhancement.enhancedRequest.length,
      });
      
      return { success: true, enhancement };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = error instanceof PromptValidationError ? error.code : 'UNKNOWN_ERROR';
      
      // DEBUG: Create detailed debug info for the rejection (no sensitive content logged)
      const debugInfo = {
        rejectedValue: {
          type: typeof userRequest,
          isNull: userRequest === null,
          isUndefined: userRequest === undefined,
          length: typeof userRequest === 'string' ? userRequest.length : 'N/A',
          trimmedLength: typeof userRequest === 'string' ? userRequest.trim().length : 'N/A',
          // NOTE: Content removed for security - only log metadata
        },
        validationRules: {
          mustBeString: true,
          mustNotBeNullOrUndefined: true,
          minLength: VALIDATION_LIMITS.MIN_MESSAGE_LENGTH,
          maxLength: VALIDATION_LIMITS.MAX_MESSAGE_LENGTH,
        },
        errorCode,
        errorField: error instanceof PromptValidationError ? error.field : undefined,
        timestamp: new Date().toISOString(),
      };
      
      log.error('❌ [DEBUG] safeEnhancePrompt() - Validation FAILED:', {
        step: 'VALIDATION_FAILED',
        error: errorMessage,
        code: errorCode,
        field: error instanceof PromptValidationError ? error.field : undefined,
        debugInfo,
      });
      
      return {
        success: false,
        error: errorMessage,
        fallbackMessage: FALKEAI_VALIDATION_ERROR_MESSAGE,
        debugInfo, // Include debug info for development debugging (not exposed to frontend)
      };
    }
  }
}

// Export singleton instance
export const promptEnhancerService = new PromptEnhancerService();
