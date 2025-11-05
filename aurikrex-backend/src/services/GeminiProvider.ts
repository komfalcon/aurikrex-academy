import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './BaseAIService.js';
import { 
  AIResponse, 
  AIServiceConfig,
  ContentValidation,
  ImageAnalysis
} from '../types/ai.types.js';
import { LessonInput, Lesson } from '../types/lesson.types.js';

export class GeminiProvider extends BaseAIProvider {
  private genAI: GoogleGenerativeAI;
  private model: any; // Proper type to be added when available

  constructor(config: AIServiceConfig) {
    super(config);
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required for GeminiProvider');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateLesson(input: LessonInput): Promise<AIResponse<Lesson>> {
    const cacheKey = `gemini:lesson:${JSON.stringify(input)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const response = await this.withRetry(async () => {
      const prompt = this.constructLessonPrompt(input);
      
      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: this.config.temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      });

      const lesson = JSON.parse(result.response.text());
      
      return {
        data: lesson,
        model: this.config.model,
        usage: {
          promptTokens: 0, // Not provided by Gemini API yet
          completionTokens: 0,
          totalTokens: 0
        },
        generatedAt: new Date()
      };
    });

    await this.cache.set(cacheKey, response, this.config.cacheDuration);
    return response;
  }

  async validateContent(content: string): Promise<AIResponse<ContentValidation>> {
    const response = await this.withRetry(async () => {
      const result = await this.model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Please review the following educational content for appropriateness, bias, and complexity. 
                   Respond in JSON format with fields: isAppropriate (boolean), confidenceScore (0-1), 
                   flags (array of issues found), and suggestions (array of improvement ideas).
                   
                   Content to review:
                   ${content}`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
        },
      });

      const validation = JSON.parse(result.response.text());
      
      return {
        data: validation,
        model: this.config.model,
        generatedAt: new Date()
      };
    });

    return response;
  }

  async generateExplanation(query: string, context?: string): Promise<AIResponse<string>> {
    const response = await this.withRetry(async () => {
      const prompt = context ? 
        `Context: ${context}\n\nQuestion: ${query}` : 
        query;

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1024,
        },
      });

      return {
        data: result.response.text(),
        model: this.config.model,
        generatedAt: new Date()
      };
    });

    return response;
  }

  async analyzeImage(imageUrl: string, prompt: string): Promise<AIResponse<ImageAnalysis>> {
    const response = await this.withRetry(async () => {
      // Use Gemini Pro Vision when available
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro-vision" });
      
      const imageData = await fetch(imageUrl).then(r => r.arrayBuffer());
      
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg", // Adjust based on actual image type
                data: Buffer.from(imageData).toString('base64')
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      });

      const analysis = JSON.parse(result.response.text());
      
      return {
        data: analysis,
        model: this.config.model,
        generatedAt: new Date()
      };
    });

    return response;
  }

  private constructLessonPrompt(input: LessonInput): string {
    return `
      Create an engaging, multimedia-rich lesson plan with the following specifications:
      
      Subject: ${input.subject}
      Topic: ${input.topic}
      Grade Level: ${input.targetGrade}
      Length: ${input.lessonLength}
      ${input.difficulty ? `Difficulty: ${input.difficulty}` : ''}
      ${input.additionalInstructions ? `\nAdditional Instructions: ${input.additionalInstructions}` : ''}

      Please provide a detailed lesson plan in JSON format that includes:
      - Clear learning objectives
      - Key concepts with visual examples
      - Interactive exercises
      - Multimedia resources (videos, images, diagrams)
      - Practice activities
      - Assessment questions

      Include relevant images, diagrams, or visual aids where appropriate.
      Ensure the content is age-appropriate and engaging for grade ${input.targetGrade}.
      
      Follow the exact same JSON schema as provided in the previous prompts.
    `;
  }
}