// Pagination parameters
export interface PaginationParams {
  page: number;
  limit: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Base lesson structure
export interface Lesson {
  id: string;
  title: string;
  subject: string;
  topic: string;
  targetGrade: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
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

// Input for lesson generation
export interface LessonInput {
  subject: string;
  topic: string;
  targetGrade: number;
  lessonLength: 'short' | 'medium' | 'long';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  additionalInstructions?: string;
}

// Lesson section with content
export interface LessonSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'introduction' | 'content' | 'summary' | 'practice';
  resources?: LessonResource[];
}

// Exercise/Quiz structure
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

// Resource attachment
export interface LessonResource {
  id: string;
  type: 'video' | 'document' | 'code' | 'link';
  url: string;
  title: string;
  description?: string;
  format?: string;
  duration?: number; // for videos
  size?: number; // in bytes
}

// Lesson metadata
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

// Progress tracking
export interface LessonProgress {
  userId: string;
  lessonId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  startedAt: Date;
  completedAt?: Date;
  progress: number; // 0-100
  timeSpent: number; // in seconds
  lastAccessedAt: Date;
  completedSections: string[]; // section IDs
  exerciseResults?: {
    exerciseId: string;
    completed: boolean;
    score?: number;
    attempts: number;
    lastAttemptAt: Date;
  }[];
}

// Generated lesson from AI
export interface GeneratedLesson extends Omit<Lesson, 'id' | 'createdAt' | 'updatedAt' | 'authorId'> {
  metadata: LessonMetadata & {
    generatedAt: string;
    generatedBy: string;
    version: string;
    isAIGenerated: true;
  };
}

// Error handling
export interface LessonGenerationError extends Error {
  code: string;
  details?: unknown;
  timestamp: Date;
  inputData?: Partial<LessonInput>;
}