// src/types/index.ts
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  firstName?: string;
  provider?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

// ============================================
// FalkeAI Chat Types
// ============================================

/**
 * Valid page values for the FalkeAI chat context
 */
export type FalkeAIChatPage = 'Smart Lessons' | 'Assignment' | 'Dashboard' | 'Ask FalkeAI';

/**
 * Context information for the FalkeAI chat request
 * Used to provide contextual information about where the chat is being used
 */
export interface FalkeAIChatContext {
  page: FalkeAIChatPage;
  course?: string;
  username: string;
  userId: string;
}

/**
 * Request body for the AI chat endpoint
 */
export interface FalkeAIChatRequest {
  message: string;
  context: FalkeAIChatContext;
}

/**
 * Response from the AI chat endpoint
 */
export interface FalkeAIChatResponse {
  reply: string;
  timestamp: string;
}

/**
 * Error response from the AI chat endpoint
 */
export interface FalkeAIErrorResponse {
  status: 'error';
  message: string;
  code?: string;
}

// ============================================
// Assignment Types
// ============================================

export type AssignmentType = 'problem' | 'essay' | 'code' | 'math' | 'creative';
export type AssignmentStatus = 'pending' | 'analyzed' | 'attempted' | 'submitted' | 'graded';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AssignmentHints {
  conceptsInvolved: string[];
  approachSuggestion: string;
  commonMistakes: string[];
  stepByStep: {
    stepNumber: number;
    guidance: string;
    keyThink: string;
  }[];
  resources: string[];
}

export interface AssignmentAnalysis {
  type: AssignmentType;
  title: string;
  description: string;
  hints: AssignmentHints;
  estimatedDifficulty: Difficulty;
  estimatedTime: number;
  rubric?: {
    criteria: string;
    points: number;
  }[];
}

export interface Assignment {
  _id: string;
  studentId: string;
  title: string;
  description: string;
  assignmentType: 'upload' | 'text';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  textContent?: string;
  analysis?: AssignmentAnalysis;
  status: AssignmentStatus;
  solutionIds: string[];
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  lastAttemptAt?: string;
}

export interface AssignmentStats {
  total: number;
  pending: number;
  analyzed: number;
  attempted: number;
  submitted: number;
  graded: number;
}

// ============================================
// Solution Types
// ============================================

export interface SolutionError {
  type: string;
  location: string;
  issue: string;
  correction: string;
  explanation: string;
}

export interface SolutionVerification {
  isCorrect: boolean;
  accuracy: number;
  strengths: string[];
  weaknesses: string[];
  errors: SolutionError[];
  correctSolution: {
    code?: string;
    explanation: string;
    alternativeApproaches?: string[];
  };
  rating: number;
  feedback: string;
  nextSteps: string[];
  conceptsMastered: string[];
  conceptsToReview: string[];
}

export interface Solution {
  _id: string;
  assignmentId: string;
  studentId: string;
  solutionType: 'file' | 'text';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  textContent?: string;
  verification?: SolutionVerification;
  submittedAt: string;
  gradedAt?: string;
  attempt: number;
}

export interface SolutionStats {
  totalSolutions: number;
  averageAccuracy: number;
  totalCorrect: number;
  averageAttempts: number;
  conceptsMastered: string[];
  conceptsToReview: string[];
}

// ============================================
// FalkeAI Analytics Types
// ============================================

export type FalkeAIActivityType = 
  | 'chat_question'
  | 'assignment_upload'
  | 'assignment_analysis'
  | 'solution_upload'
  | 'solution_verification'
  | 'quiz_explanation'
  | 'progress_analysis'
  | 'recommendation'
  | 'concept_explanation'
  | 'performance_review'
  | 'lesson_generation';

export type ResultType = 'success' | 'needs_improvement' | 'not_attempted' | 'error';

export interface FalkeAIActivity {
  _id: string;
  userId: string;
  timestamp: string;
  activityType: FalkeAIActivityType;
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  quizId?: string;
  question?: string;
  questionType?: string;
  responseLength?: number;
  userSatisfaction?: 1 | 2 | 3 | 4 | 5;
  timeSpent: number;
  helpfulRating?: number;
  resultType?: ResultType;
  resultScore?: number;
  metadata?: Record<string, unknown>;
}

export interface UserAnalytics {
  userId: string;
  totalActivities: number;
  activitiesByType: Record<FalkeAIActivityType, number>;
  averageResponseQuality: number;
  assignmentCompletionRate: number;
  averageSolutionAccuracy: number;
  topicsExplored: string[];
  conceptsMastered: string[];
  conceptsStruggling: string[];
  peakLearningTime: string;
  averageSessionDuration: number;
  activityTimeline: {
    date: string;
    count: number;
    types: Record<string, number>;
  }[];
  growthScore: number;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  predictedNextChallenge?: string;
  estimatedMasteryDate?: string;
  recommendedFocusArea?: string;
  lastUpdated: string;
}

export interface DashboardAnalytics {
  overview: {
    totalQuestions: number;
    averageResponseQuality: number;
    topicsMastered: number;
    topicsStruggling: number;
  };
  assignments: AssignmentStats & {
    completionRate: number;
  };
  solutions: SolutionStats;
  learning: {
    topicsExplored: string[];
    conceptsMastered: string[];
    conceptsToReview: string[];
    peakLearningTime: string;
    averageSessionDuration: number;
  };
  trends: {
    activityTimeline: {
      date: string;
      count: number;
      types: Record<string, number>;
    }[];
    growthScore: number;
    engagementTrend: 'increasing' | 'stable' | 'decreasing';
    activitiesByType: Record<string, number>;
  };
  insights: {
    predictedNextChallenge?: string;
    estimatedMasteryDate?: string;
    recommendedFocusArea: string;
  };
  recentActivity: FalkeAIActivity[];
  lastUpdated: string;
}

export interface ActivitySummary {
  totalQuestions: number;
  averageResponseQuality: number;
  topicsMastered: number;
  topicsStruggling: number;
  recentActivity: FalkeAIActivity[];
  activityByDay: { date: string; count: number }[];
}

// ============================================
// Library Types
// ============================================

export type BookDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ReadingStatus = 'want-to-read' | 'reading' | 'completed';

export interface Book {
  _id: string;
  title: string;
  author: string;
  description: string;
  category: string[];
  difficulty: BookDifficulty;
  coverImageUrl: string;
  pdfUrl: string;
  fileSize: number;
  pages: number;
  yearPublished: number;
  rating: number;
  reviewCount: number;
  relatedCourses: string[];
  concepts: string[];
  targetAudience: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserLibraryEntry {
  _id: string;
  userId: string;
  bookId: string;
  status: ReadingStatus;
  progress: number;
  currentPage: number;
  totalPages: number;
  startedAt: string;
  completedAt?: string;
  lastReadAt: string;
  personalRating?: number;
  notes?: string;
  book?: Book | null;
}

export interface ReadingStats {
  totalBooks: number;
  reading: number;
  completed: number;
  wantToRead: number;
  totalPagesRead: number;
}

export interface BooksResponse {
  books: Book[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserLibraryResponse {
  entries: UserLibraryEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}