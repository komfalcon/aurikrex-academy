import { Lesson, LessonInput, LessonProgress } from '../types/lesson.types.js';
declare class LessonService {
    private openai;
    private readonly VERSION;
    private readonly lessonsCollection;
    private readonly progressCollection;
    constructor();
    private lessonConverter;
    private progressConverter;
    private generateWithOpenAI;
    createLesson(authorId: string, lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>): Promise<Lesson>;
    getLessonById(lessonId: string): Promise<Lesson>;
    updateLesson(lessonId: string, updateData: Partial<Lesson>): Promise<Lesson>;
    deleteLesson(lessonId: string): Promise<void>;
    listLessons(filters?: {
        authorId?: string;
        status?: Lesson['status'];
        subject?: string;
        difficulty?: Lesson['difficulty'];
    }): Promise<Lesson[]>;
    updateProgress(userId: string, lessonId: string, data: Partial<LessonProgress>): Promise<LessonProgress>;
    getProgress(userId: string, lessonId: string): Promise<LessonProgress | null>;
    private constructPrompt;
    generateAndSaveLesson(authorId: string, input: LessonInput): Promise<Lesson>;
}
declare const _default: LessonService;
export default _default;
