import { BaseAIProvider } from './BaseAIService.js';
import { AIResponse, AIServiceConfig, ContentValidation, ImageAnalysis } from '../types/ai.types.js';
import { LessonInput, Lesson } from '../types/lesson.types.js';
export declare class GPTProvider extends BaseAIProvider {
    private openai;
    constructor(config: AIServiceConfig);
    generateLesson(input: LessonInput): Promise<AIResponse<Lesson>>;
    validateContent(content: string): Promise<AIResponse<ContentValidation>>;
    generateExplanation(query: string, context?: string): Promise<AIResponse<string>>;
    private constructLessonPrompt;
    analyzeImage(imageUrl: string, prompt: string): Promise<AIResponse<ImageAnalysis>>;
}
