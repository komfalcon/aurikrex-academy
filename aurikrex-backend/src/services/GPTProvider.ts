import OpenAI from 'openai';
import { BaseAIProvider } from './BaseAIService.js';
import { 
  AIResponse, 
  AIServiceConfig,
  ContentValidation,
  ImageAnalysis
} from '../types/ai.types.js';
import { LessonInput, Lesson } from '../types/lesson.types.js';

export class GPTProvider extends BaseAIProvider {
  private openai: OpenAI | null = null;
  private openAIEnabled: boolean = false;
  
  constructor(config: AIServiceConfig) {
    super(config);
    
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY not set. GPTProvider features disabled.');
      this.openAIEnabled = false;
    } else {
      this.openAIEnabled = true;
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  /**
   * Check if OpenAI is available and configured
   * @returns boolean indicating if OpenAI features are available
   */
  private checkOpenAIAvailable(): boolean {
    if (!this.openAIEnabled || !this.openai) {
      console.warn('GPTProvider called but OpenAI is not configured');
      return false;
    }
    return true;
  }

  async generateLesson(input: LessonInput): Promise<AIResponse<Lesson>> {
    if (!this.checkOpenAIAvailable()) {
      throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY or use FalkeAI for lesson generation.');
    }

    const cacheKey = `lesson:${JSON.stringify(input)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const response = await this.withRetry(async () => {
      const prompt = this.constructLessonPrompt(input);
      
      const completion = await this.openai!.chat.completions.create({
        model: this.config.model === 'gpt-4' ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo',
        messages: [
          {
            role: "system",
            content: "You are an expert educational content creator specializing in creating structured, engaging lessons."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        data: result,
        model: this.config.model,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0
        },
        generatedAt: new Date()
      };
    });

    await this.cache.set(cacheKey, response, this.config.cacheDuration);
    return response;
  }

  async validateContent(content: string): Promise<AIResponse<ContentValidation>> {
    if (!this.checkOpenAIAvailable()) {
      throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY to use content validation.');
    }

    const response = await this.withRetry(async () => {
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: "system",
            content: "You are an expert content reviewer focused on educational appropriateness and quality."
          },
          {
            role: "user",
            content: `Please review the following educational content for appropriateness, bias, and complexity. Respond in JSON format with fields: isAppropriate (boolean), confidenceScore (0-1), flags (array of issues found), and suggestions (array of improvement ideas).\n\nContent to review:\n${content}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        data: result,
        model: this.config.model,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0
        },
        generatedAt: new Date()
      };
    });

    return response;
  }

  async generateExplanation(query: string, context?: string): Promise<AIResponse<string>> {
    if (!this.checkOpenAIAvailable()) {
      throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY to use explanation generation.');
    }

    const response = await this.withRetry(async () => {
      const messages = [
        {
          role: "system" as const,
          content: "You are a helpful educational assistant providing clear, concise explanations."
        },
        {
          role: "user" as const,
          content: context ? 
            `Context: ${context}\n\nQuestion: ${query}` : 
            query
        }
      ];

      const completion = await this.openai!.chat.completions.create({
        model: this.config.model === 'gpt-4' ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo',
        messages,
        temperature: 0.5,
        max_tokens: 500
      });

      return {
        data: completion.choices[0].message.content || '',
        model: this.config.model,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0
        },
        generatedAt: new Date()
      };
    });

    return response;
  }

  private constructLessonPrompt(input: LessonInput): string {
    return `
      Create a detailed lesson plan with the following specifications:
      
      Subject: ${input.subject}
      Topic: ${input.topic}
      Grade Level: ${input.targetGrade}
      Length: ${input.lessonLength}
      ${input.difficulty ? `Difficulty: ${input.difficulty}` : ''}
      ${input.additionalInstructions ? `\nAdditional Instructions: ${input.additionalInstructions}` : ''}

      Please provide the response in JSON format with the following structure:
      {
        "title": "Lesson title",
        "subject": "Subject name",
        "topic": "${input.topic}",
        "targetGrade": ${input.targetGrade},
        "difficulty": "${input.difficulty || 'beginner'}",
        "duration": "number (in minutes)",
        "prerequisites": ["prerequisite1", "prerequisite2"],
        "keyConcepts": ["concept1", "concept2"],
        "sections": [
          {
            "id": "unique-id",
            "title": "Section title",
            "content": "Section content in markdown format",
            "order": "number",
            "type": "introduction|content|summary|practice"
          }
        ],
        "exercises": [
          {
            "id": "unique-id",
            "question": "Question text",
            "type": "multiple-choice|open-ended|true-false|coding",
            "difficulty": "easy|medium|hard",
            "answer": "Correct answer",
            "options": ["option1", "option2"],
            "points": "number",
            "hint": "Optional hint",
            "explanation": "Answer explanation"
          }
        ],
        "resources": [
          {
            "id": "unique-id",
            "type": "video|document|code|link",
            "url": "resource-url",
            "title": "Resource title",
            "description": "Optional description"
          }
        ],
        "metadata": {
          "estimatedDuration": "number",
          "readingLevel": "string",
          "tags": ["tag1", "tag2"]
        }
      }

      Ensure the content is age-appropriate and engaging for grade ${input.targetGrade}.
      Use clear language and include practical examples.
    `;
  }

  // Note: This provider does not support direct image analysis
  async analyzeImage(imageUrl: string, prompt: string): Promise<AIResponse<ImageAnalysis>> {
    // Used in error message to clarify what was attempted
    const errorDetails = `Attempted image analysis: URL=${imageUrl}, prompt=${prompt}`;
    throw new Error(`Image analysis is not supported by GPT Provider. Please use Gemini Provider for image analysis. ${errorDetails}`);
  }
}