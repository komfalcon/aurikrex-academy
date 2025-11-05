import { Request, Response } from 'express';
/**
 * Generate a new lesson
 */
export declare const generateLesson: (req: Request, res: Response) => Promise<void>;
/**
 * Get a lesson by ID
 */
export declare const getLessonById: (req: Request, res: Response) => Promise<void>;
/**
 * List lessons with filters
 */
export declare const listLessons: (req: Request, res: Response) => Promise<void>;
/**
 * Get lesson progress for current user
 */
export declare const getLessonProgress: (req: Request, res: Response) => Promise<void>;
/**
 * Update lesson progress
 */
export declare const updateLessonProgress: (req: Request, res: Response) => Promise<void>;
