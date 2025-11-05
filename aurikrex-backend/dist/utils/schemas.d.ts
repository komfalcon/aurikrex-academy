import { ValidationSchema } from './validation.js';
import type { LoginRequest, RegisterRequest } from '../types/auth.types.js';
import type { LessonInput, Exercise, LessonResource, LessonProgress } from '../types/lesson.types.js';
export declare const loginSchema: ValidationSchema<LoginRequest>;
export declare const registerSchema: ValidationSchema<RegisterRequest>;
export declare const lessonInputSchema: ValidationSchema<LessonInput>;
export declare const exerciseSchema: ValidationSchema<Exercise>;
export declare const resourceSchema: ValidationSchema<LessonResource>;
export declare const lessonProgressSchema: ValidationSchema<LessonProgress>;
