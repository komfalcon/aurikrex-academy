export interface Lesson {
    id: string;
    title: string;
    subject: string;
    topic: string;
    targetGrade: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
    prerequisites?: string[];
    keyConcepts: string[];
    sections: LessonSection[];
    exercises: Exercise[];
    resources: LessonResource[];
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    status: 'draft' | 'published' | 'archived';
    metadata: LessonMetadata;
}
export interface LessonInput {
    subject: string;
    topic: string;
    targetGrade: number;
    lessonLength: 'short' | 'medium' | 'long';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    additionalInstructions?: string;
}
export interface LessonSection {
    id: string;
    title: string;
    content: string;
    order: number;
    type: 'introduction' | 'content' | 'summary' | 'practice';
    resources?: LessonResource[];
}
export interface Exercise {
    id: string;
    question: string;
    type: 'multiple-choice' | 'open-ended' | 'true-false' | 'coding';
    difficulty: 'easy' | 'medium' | 'hard';
    answer?: string;
    options?: string[];
    hint?: string;
    explanation?: string;
    points: number;
}
export interface LessonResource {
    id: string;
    type: 'video' | 'document' | 'code' | 'link';
    url: string;
    title: string;
    description?: string;
    format?: string;
    duration?: number;
    size?: number;
}
export interface LessonMetadata {
    generatedAt?: string;
    generatedBy?: string;
    version: string;
    tags?: string[];
    estimatedDuration: number;
    readingLevel?: string;
    lastModifiedBy?: string;
    isAIGenerated: boolean;
}
export interface LessonProgress {
    userId: string;
    lessonId: string;
    status: 'not-started' | 'in-progress' | 'completed';
    startedAt: Date;
    completedAt?: Date;
    progress: number;
    timeSpent: number;
    lastAccessedAt: Date;
    completedSections: string[];
    exerciseResults?: {
        exerciseId: string;
        completed: boolean;
        score?: number;
        attempts: number;
        lastAttemptAt: Date;
    }[];
}
export interface GeneratedLesson extends Omit<Lesson, 'id' | 'createdAt' | 'updatedAt' | 'authorId'> {
    metadata: LessonMetadata & {
        generatedAt: string;
        generatedBy: string;
        version: string;
        isAIGenerated: true;
    };
}
export interface LessonGenerationError extends Error {
    code: string;
    details?: unknown;
    timestamp: Date;
    inputData?: Partial<LessonInput>;
}
