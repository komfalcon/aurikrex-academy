import { GeneratedLesson } from '../types/lesson.types.js';
/**
 * Content enhancement service to improve lesson quality
 */
export declare class ContentEnhancer {
    /**
     * Enhances lesson content with additional features
     */
    static enhanceContent(lesson: GeneratedLesson): Promise<GeneratedLesson>;
    /**
     * Adds interactive elements to section content
     */
    private static addInteractiveElements;
    /**
     * Generates adaptive exercises based on difficulty
     */
    private static generateAdaptiveExercises;
    /**
     * Enriches learning resources with metadata and recommendations
     */
    private static enrichResources;
    private static calculateSkillLevel;
    private static identifyPrerequisites;
    private static estimateResourceTime;
    private static assessResourceDifficulty;
    private static detectResourceFormat;
    private static isInteractiveResource;
    private static generateResourceRecommendations;
}
