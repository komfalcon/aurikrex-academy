/**
 * Prompt Enhancer Service
 * 
 * Layer 1: REQUEST ENHANCEMENT (Pre-Processing)
 * Transforms user input into optimal model prompts with:
 * - Intent detection
 * - Complexity estimation
 * - System prompt selection
 * - User context building
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
   */
  public enhancePrompt(
    userRequest: string,
    requestType: AIRequestType | undefined,
    userContext?: Partial<UserLearningContext>
  ): PromptEnhancement {
    // Build full user context with defaults
    const fullContext: UserLearningContext = {
      ...DEFAULT_USER_LEARNING_CONTEXT,
      ...userContext,
      preferences: {
        ...DEFAULT_USER_LEARNING_CONTEXT.preferences,
        ...userContext?.preferences,
      },
    };

    // Detect intent if not specified
    const detectedIntent = this.detectIntent(userRequest);
    const finalRequestType = requestType || detectedIntent;
    
    // Estimate complexity
    const complexity = this.estimateComplexity(userRequest);
    
    // Get system prompt
    const systemPrompt = getSystemPrompt(finalRequestType);
    
    // Build instructions
    const instructions = this.buildInstructions(finalRequestType, userRequest, fullContext);
    
    // Build user profile
    const userProfile = this.buildUserProfile(fullContext);
    
    // Build enhanced request
    const enhancedRequest = `${instructions}

USER CONTEXT:
${userProfile}

USER REQUEST:
${userRequest}`;

    log.info(`📋 Prompt enhanced`, {
      requestType: finalRequestType,
      detectedIntent,
      complexity,
      originalLength: userRequest.length,
      enhancedLength: enhancedRequest.length,
    });

    return {
      originalRequest: userRequest,
      enhancedRequest,
      systemPrompt,
      context: userProfile,
      instructions,
      requestType: finalRequestType,
      detectedIntent,
      estimatedComplexity: complexity,
    };
  }
}

// Export singleton instance
export const promptEnhancerService = new PromptEnhancerService();
