import { BaseAIProvider } from './BaseAIService.js';
import { AIResponse, AIServiceConfig, ContentValidation, ImageAnalysis } from '../types/ai.types.js';
import { LessonInput, Lesson } from '../types/lesson.types.js';
export declare class GeminiProvider extends BaseAIProvider {
    private genAI;
    private model;
    constructor(config: AIServiceConfig);
    generateLesson(input: LessonInput): Promise<AIResponse<Lesson>>;
    validateContent(content: string): Promise<AIResponse<ContentValidation>>;
    generateExplanation(query: string, context?: string): Promise<AIResponse<string>>;
    analyzeImage(imageUrl: string, prompt: string): Promise<AIResponse<ImageAnalysis>>;
    private constructLessonPrompt;
}
