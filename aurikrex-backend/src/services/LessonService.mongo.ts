import OpenAI from 'openai';
import { LessonModel, LessonDocument, LessonProgressModel } from '../models/Lesson.model.js';
import { getErrorMessage } from '../utils/errors.js';
import {
  Lesson,
  LessonInput,
  GeneratedLesson,
  LessonProgress,
  PaginationParams,
  PaginatedResponse
} from '../types/lesson.types.js';

class LessonService {
  private openai: OpenAI;
  private readonly VERSION = '1.0.0';

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  private async generateWithOpenAI(input: LessonInput): Promise<GeneratedLesson> {
    try {
      const prompt = this.constructPrompt(input);
      
      console.log('🤖 Calling OpenAI API for lesson generation...');
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert educational content creator specializing in creating structured, engaging lessons for students."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      console.log('✅ OpenAI API response received');
      
      return {
        ...result,
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: 'OpenAI GPT-4',
          version: this.VERSION
        }
      };
    } catch (error) {
      console.error('❌ OpenAI API error:', getErrorMessage(error));
      const err = error as Error;
      throw new Error(`Lesson generation failed: ${err.message}`);
    }
  }

  // MongoDB CRUD operations
  public async createLesson(authorId: string, lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>): Promise<Lesson> {
    try {
      console.log('📝 Creating new lesson:', lessonData.title);

      const lessonDoc: Omit<LessonDocument, '_id' | 'createdAt' | 'updatedAt'> = {
        ...lessonData,
        authorId
      };

      const created = await LessonModel.create(lessonDoc);
      
      console.log('✅ Lesson created successfully:', created._id?.toString());

      return this.mapDocumentToLesson(created);
    } catch (error) {
      console.error('❌ Error creating lesson:', getErrorMessage(error));
      throw error;
    }
  }

  public async getLessonById(lessonId: string): Promise<Lesson> {
    try {
      console.log('🔍 Fetching lesson by ID:', lessonId);

      const lessonDoc = await LessonModel.findById(lessonId);

      if (!lessonDoc) {
        throw new Error(`Lesson not found: ${lessonId}`);
      }

      console.log('✅ Lesson found:', lessonDoc.title);

      return this.mapDocumentToLesson(lessonDoc);
    } catch (error) {
      console.error(`❌ Error getting lesson ${lessonId}:`, getErrorMessage(error));
      throw error;
    }
  }

  public async updateLesson(lessonId: string, updateData: Partial<Lesson>): Promise<Lesson> {
    try {
      console.log('📝 Updating lesson:', lessonId);

      const updated = await LessonModel.update(lessonId, updateData);

      if (!updated) {
        throw new Error(`Lesson not found: ${lessonId}`);
      }

      console.log('✅ Lesson updated successfully:', updated.title);

      return this.mapDocumentToLesson(updated);
    } catch (error) {
      console.error(`❌ Error updating lesson ${lessonId}:`, getErrorMessage(error));
      throw error;
    }
  }

  public async deleteLesson(lessonId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting lesson:', lessonId);

      const deleted = await LessonModel.delete(lessonId);

      if (!deleted) {
        throw new Error(`Lesson not found: ${lessonId}`);
      }

      console.log('✅ Lesson deleted successfully');
    } catch (error) {
      console.error(`❌ Error deleting lesson ${lessonId}:`, getErrorMessage(error));
      throw error;
    }
  }

  public async listLessons(filters?: {
    authorId?: string;
    status?: Lesson['status'];
    subject?: string;
    difficulty?: Lesson['difficulty'];
  }, pagination?: PaginationParams): Promise<PaginatedResponse<Lesson>> {
    try {
      console.log('📋 Listing lessons with filters:', filters);

      const result = await LessonModel.list({
        page: pagination?.page || 1,
        limit: pagination?.limit || 20,
        ...filters
      });

      const lessons = result.lessons.map(doc => this.mapDocumentToLesson(doc));

      console.log(`✅ Listed ${lessons.length} lessons out of ${result.total} total`);

      return {
        items: lessons,
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore
      };
    } catch (error) {
      console.error('❌ Error listing lessons:', getErrorMessage(error));
      throw error;
    }
  }

  // Progress tracking
  public async updateProgress(userId: string, lessonId: string, data: Partial<LessonProgress>): Promise<LessonProgress> {
    try {
      console.log('📊 Updating lesson progress:', { userId, lessonId });

      const progressDoc = await LessonProgressModel.upsert(userId, lessonId, data);
      
      console.log('✅ Lesson progress updated successfully');

      return this.mapDocumentToProgress(progressDoc);
    } catch (error) {
      console.error(`❌ Error updating progress for user ${userId} lesson ${lessonId}:`, getErrorMessage(error));
      throw error;
    }
  }

  public async getProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
    try {
      console.log('🔍 Getting lesson progress:', { userId, lessonId });

      const progressDoc = await LessonProgressModel.get(userId, lessonId);
      
      if (!progressDoc) {
        console.log('ℹ️ No progress found for this lesson');
        return null;
      }

      console.log('✅ Lesson progress found');

      return this.mapDocumentToProgress(progressDoc);
    } catch (error) {
      console.error(`❌ Error getting progress for user ${userId} lesson ${lessonId}:`, getErrorMessage(error));
      throw error;
    }
  }

  public async getUserProgress(userId: string): Promise<LessonProgress[]> {
    try {
      console.log('📊 Getting all progress for user:', userId);

      const progressDocs = await LessonProgressModel.listByUser(userId);
      
      const progressList = progressDocs.map(doc => this.mapDocumentToProgress(doc));

      console.log(`✅ Retrieved ${progressList.length} progress records`);

      return progressList;
    } catch (error) {
      console.error(`❌ Error getting user progress ${userId}:`, getErrorMessage(error));
      throw error;
    }
  }

  private constructPrompt(input: LessonInput): string {
    return `
      Create a detailed lesson plan with the following specifications:
      
      Subject: ${input.subject}
      Topic: ${input.topic}
      Grade Level: ${input.targetGrade}
      Length: ${input.lessonLength}

      Please provide the response in JSON format with the following structure:
      {
        "title": "Lesson title",
        "subject": "Subject name",
        "targetGrade": grade number,
        "difficulty": "beginner|intermediate|advanced",
        "duration": number (in minutes),
        "keyConcepts": ["concept1", "concept2", ...],
        "sections": [
          {
            "id": "unique-id",
            "title": "Section title",
            "content": "Section content",
            "order": number,
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
            "options": ["option1", "option2", ...],
            "points": number,
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
        ]
      }

      Ensure the content is age-appropriate and engaging for the specified grade level.
    `;
  }

  public async generateAndSaveLesson(authorId: string, input: LessonInput): Promise<Lesson> {
    try {
      console.log(`🎓 Generating lesson for ${input.subject} - ${input.topic} (Grade ${input.targetGrade})`);
      
      const generated = await this.generateWithOpenAI(input);
      
      // Convert GeneratedLesson to Lesson and save to MongoDB
      const lesson = await this.createLesson(authorId, {
        ...generated,
        status: 'draft',
        difficulty: input.difficulty || 'beginner'
      });
      
      console.log(`✅ Successfully generated and saved lesson: ${lesson.title}`);
      return lesson;
    } catch (error) {
      console.error('❌ Error generating lesson:', getErrorMessage(error));
      throw new LessonGenerationError('Failed to generate lesson', {
        cause: error,
        code: 'LESSON_GENERATION_FAILED'
      });
    }
  }

  /**
   * Map MongoDB document to Lesson type
   */
  private mapDocumentToLesson(doc: LessonDocument): Lesson {
    return {
      ...doc,
      id: doc._id!.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  /**
   * Map MongoDB document to LessonProgress type
   */
  private mapDocumentToProgress(doc: any): LessonProgress {
    return {
      userId: doc.userId,
      lessonId: doc.lessonId,
      status: doc.status,
      progress: doc.progress,
      timeSpent: doc.timeSpent,
      startedAt: doc.startedAt,
      completedAt: doc.completedAt || undefined,
      lastAccessedAt: doc.lastAccessedAt,
      completedSections: doc.completedSections || []
    };
  }
}

class LessonGenerationError extends Error {
  code: string;
  details?: unknown;
  cause?: unknown;

  constructor(message: string, options?: { cause?: unknown; code?: string; details?: unknown }) {
    super(message);
    this.name = 'LessonGenerationError';
    this.code = options?.code || 'UNKNOWN_ERROR';
    this.details = options?.details;
    this.cause = options?.cause;
  }
}

export default new LessonService();
