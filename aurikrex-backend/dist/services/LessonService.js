import OpenAI from 'openai';
import { db } from '../config/firebase.js';
import { getErrorMessage } from '../utils/errors.js';
import { Timestamp } from 'firebase-admin/firestore';
class LessonService {
    openai;
    VERSION = '1.0.0';
    lessonsCollection = 'lessons';
    progressCollection = 'lessonProgress';
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set in environment variables');
        }
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    // Firestore Operations
    lessonConverter = {
        toFirestore(lesson) {
            return {
                ...lesson,
                createdAt: Timestamp.fromDate(lesson.createdAt),
                updatedAt: Timestamp.fromDate(lesson.updatedAt)
            };
        },
        fromFirestore(snapshot) {
            const data = snapshot.data();
            return {
                ...data,
                id: snapshot.id,
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate()
            };
        }
    };
    progressConverter = {
        toFirestore(progress) {
            return {
                ...progress,
                startedAt: Timestamp.fromDate(progress.startedAt),
                completedAt: progress.completedAt ? Timestamp.fromDate(progress.completedAt) : null,
                lastAccessedAt: Timestamp.fromDate(progress.lastAccessedAt)
            };
        },
        fromFirestore(snapshot) {
            const data = snapshot.data();
            return {
                ...data,
                startedAt: data.startedAt.toDate(),
                completedAt: data.completedAt?.toDate(),
                lastAccessedAt: data.lastAccessedAt.toDate()
            };
        }
    };
    async generateWithOpenAI(input) {
        try {
            const prompt = this.constructPrompt(input);
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
            return {
                ...result,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    generatedBy: 'OpenAI GPT-4',
                    version: this.VERSION
                }
            };
        }
        catch (error) {
            const err = error;
            throw new Error(`Lesson generation failed: ${err.message}`);
        }
    }
    // Firestore CRUD operations
    async createLesson(authorId, lessonData) {
        try {
            const now = new Date();
            const lessonWithMeta = {
                ...lessonData,
                authorId,
                createdAt: now,
                updatedAt: now
            };
            const docRef = await db.collection(this.lessonsCollection)
                .withConverter(this.lessonConverter)
                .add(lessonWithMeta);
            return await this.getLessonById(docRef.id);
        }
        catch (error) {
            console.error('Error creating lesson:', getErrorMessage(error));
            throw error;
        }
    }
    async getLessonById(lessonId) {
        try {
            const doc = await db.collection(this.lessonsCollection)
                .doc(lessonId)
                .withConverter(this.lessonConverter)
                .get();
            if (!doc.exists) {
                throw new Error(`Lesson not found: ${lessonId}`);
            }
            return doc.data();
        }
        catch (error) {
            console.error(`Error getting lesson ${lessonId}:`, getErrorMessage(error));
            throw error;
        }
    }
    async updateLesson(lessonId, updateData) {
        try {
            const updateWithMeta = {
                ...updateData,
                updatedAt: new Date()
            };
            await db.collection(this.lessonsCollection)
                .doc(lessonId)
                .withConverter(this.lessonConverter)
                .update(updateWithMeta);
            return await this.getLessonById(lessonId);
        }
        catch (error) {
            console.error(`Error updating lesson ${lessonId}:`, getErrorMessage(error));
            throw error;
        }
    }
    async deleteLesson(lessonId) {
        try {
            await db.collection(this.lessonsCollection)
                .doc(lessonId)
                .delete();
        }
        catch (error) {
            console.error(`Error deleting lesson ${lessonId}:`, getErrorMessage(error));
            throw error;
        }
    }
    async listLessons(filters) {
        try {
            let query = db.collection(this.lessonsCollection)
                .withConverter(this.lessonConverter);
            if (filters) {
                if (filters.authorId) {
                    query = query.where('authorId', '==', filters.authorId);
                }
                if (filters.status) {
                    query = query.where('status', '==', filters.status);
                }
                if (filters.subject) {
                    query = query.where('subject', '==', filters.subject);
                }
                if (filters.difficulty) {
                    query = query.where('difficulty', '==', filters.difficulty);
                }
            }
            const snapshot = await query.get();
            return snapshot.docs.map(doc => doc.data());
        }
        catch (error) {
            console.error('Error listing lessons:', getErrorMessage(error));
            throw error;
        }
    }
    // Progress tracking
    async updateProgress(userId, lessonId, data) {
        try {
            const progressRef = db.collection(this.progressCollection)
                .doc(`${userId}_${lessonId}`)
                .withConverter(this.progressConverter);
            const now = new Date();
            const existing = (await progressRef.get()).data();
            const progress = {
                userId,
                lessonId,
                status: 'not-started',
                startedAt: now,
                progress: 0,
                timeSpent: 0,
                lastAccessedAt: now,
                completedSections: [],
                ...existing,
                ...data
            };
            await progressRef.set(progress, { merge: true });
            return progress;
        }
        catch (error) {
            console.error(`Error updating progress for user ${userId} lesson ${lessonId}:`, getErrorMessage(error));
            throw error;
        }
    }
    async getProgress(userId, lessonId) {
        try {
            const doc = await db.collection(this.progressCollection)
                .doc(`${userId}_${lessonId}`)
                .withConverter(this.progressConverter)
                .get();
            return doc.exists ? doc.data() : null;
        }
        catch (error) {
            console.error(`Error getting progress for user ${userId} lesson ${lessonId}:`, getErrorMessage(error));
            throw error;
        }
    }
    constructPrompt(input) {
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
    async generateAndSaveLesson(authorId, input) {
        try {
            console.log(`🎓 Generating lesson for ${input.subject} - ${input.topic} (Grade ${input.targetGrade})`);
            const generated = await this.generateWithOpenAI(input);
            // Convert GeneratedLesson to Lesson and save to Firestore
            const lesson = await this.createLesson(authorId, {
                ...generated,
                status: 'draft',
                difficulty: input.difficulty || 'beginner'
            });
            console.log(`✅ Successfully generated and saved lesson: ${lesson.title}`);
            return lesson;
        }
        catch (error) {
            console.error('❌ Error generating lesson:', error);
            throw new LessonGenerationError('Failed to generate lesson', {
                cause: error,
                code: 'LESSON_GENERATION_FAILED'
            });
        }
    }
}
class LessonGenerationError extends Error {
    code;
    details;
    constructor(message, options) {
        super(message, { cause: options?.cause });
        this.name = 'LessonGenerationError';
        this.code = options?.code || 'UNKNOWN_ERROR';
        this.details = options?.details;
    }
}
export default new LessonService();
//# sourceMappingURL=LessonService.js.map