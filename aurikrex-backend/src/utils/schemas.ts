import { rules, ValidationSchema } from './validation.js';
import type { LoginRequest, RegisterRequest } from '../types/auth.types.js';
import type { 
  LessonInput,
  Exercise,
  LessonResource,
  LessonProgress
} from '../types/lesson.types.js';

// Auth validation schemas
export const loginSchema: ValidationSchema<LoginRequest> = {
  email: [rules.required('Email'), rules.email('Email')],
  password: [
    rules.required('Password'),
    rules.minLength('Password', 8),
    rules.maxLength('Password', 100)
  ]
};

export const registerSchema: ValidationSchema<RegisterRequest> = {
  ...loginSchema,
  displayName: [
    rules.required('Display name'),
    rules.minLength('Display name', 2),
    rules.maxLength('Display name', 50)
  ],
  role: [{
    validate: (value: string | undefined) => value === undefined || ['student', 'instructor'].includes(value),
    message: 'Role must be either "student" or "instructor"'
  }]
};

// Lesson validation schemas
export const lessonInputSchema: ValidationSchema<LessonInput> = {
  subject: [
    rules.required('Subject'),
    rules.minLength('Subject', 2),
    rules.maxLength('Subject', 100)
  ],
  topic: [
    rules.required('Topic'),
    rules.minLength('Topic', 2),
    rules.maxLength('Topic', 200)
  ],
  targetGrade: [
    rules.required('Target grade'),
    rules.number('Target grade'),
    rules.min('Target grade', 1),
    rules.max('Target grade', 12)
  ],
  lessonLength: [rules.enum('Lesson length', ['short', 'medium', 'long'])],
  difficulty: [{
    validate: (value: string | undefined) => value === undefined || ['beginner', 'intermediate', 'advanced'].includes(value),
    message: 'Difficulty must be "beginner", "intermediate", or "advanced"'
  }]
};

export const exerciseSchema: ValidationSchema<Exercise> = {
  id: [rules.required('Exercise ID')],
  question: [
    rules.required('Question'),
    rules.minLength('Question', 10),
    rules.maxLength('Question', 1000)
  ],
  type: [rules.enum('Exercise type', ['multiple-choice', 'open-ended', 'true-false', 'coding'])],
  difficulty: [rules.enum('Exercise difficulty', ['easy', 'medium', 'hard'])],
  answer: [{
    validate: (value: string | undefined) => value === undefined || value.length <= 2000,
    message: 'Answer must not exceed 2000 characters'
  }],
  points: [
    rules.required('Points'),
    rules.number('Points'),
    rules.min('Points', 1)
  ]
};

export const resourceSchema: ValidationSchema<LessonResource> = {
  id: [rules.required('Resource ID')],
  type: [rules.enum('Resource type', ['video', 'document', 'code', 'link'])],
  url: [rules.required('URL'), rules.url('URL')],
  title: [
    rules.required('Title'),
    rules.minLength('Title', 2),
    rules.maxLength('Title', 200)
  ]
};

export const lessonProgressSchema: ValidationSchema<LessonProgress> = {
  userId: [rules.required('User ID')],
  lessonId: [rules.required('Lesson ID')],
  status: [rules.enum('Status', ['not-started', 'in-progress', 'completed'])],
  startedAt: [rules.required('Start date')],
  progress: [
    rules.required('Progress'),
    rules.number('Progress'),
    rules.min('Progress', 0),
    rules.max('Progress', 100)
  ],
  timeSpent: [
    rules.required('Time spent'),
    rules.number('Time spent'),
    rules.min('Time spent', 0)
  ],
    completedSections: [{
    validate: (value: string[] | undefined) => Array.isArray(value) || value === undefined,
    message: 'completedSections must be an array'
  }],
  lastAccessedAt: [{
    validate: (value: Date | undefined) => value instanceof Date || value === undefined,
    message: 'lastAccessedAt must be a valid date'
  }]
};