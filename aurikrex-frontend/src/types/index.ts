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
export type FalkeAIChatPage = 'Study Partner' | 'Assignment' | 'Dashboard' | 'Ask FalkeAI';

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
// Enhanced AI Chat Types (Prompt Engineering)
// ============================================

/**
 * Request types for AI interactions
 * Each type triggers different system prompts and response formatting
 */
export type AIRequestType = 'teach' | 'question' | 'review' | 'hint' | 'explanation';

/**
 * Learning style preferences
 */
export type LearningStyle = 'visual' | 'textual' | 'kinesthetic' | 'auditory';

/**
 * Knowledge level for content adaptation
 */
export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Preferred learning pace
 */
export type LearningPace = 'fast' | 'moderate' | 'slow';

/**
 * Detail level for responses
 */
export type DetailLevel = 'brief' | 'moderate' | 'detailed';

/**
 * User preferences for AI responses
 */
export interface UserPreferences {
  includeExamples: boolean;
  includeFormulas: boolean;
  detailLevel: DetailLevel;
  codeExamples: boolean;
  historicalContext: boolean;
}

/**
 * User learning context for personalized AI responses
 */
export interface UserLearningContext {
  userId: string;
  learningStyle: LearningStyle;
  knowledgeLevel: KnowledgeLevel;
  preferredPace: LearningPace;
  previousTopics: string[];
  strengths: string[];
  weaknesses: string[];
  preferences: UserPreferences;
}

/**
 * Section type for parsed response content
 */
export type SectionType = 
  | 'text'
  | 'concept'
  | 'math'
  | 'example'
  | 'error'
  | 'solution'
  | 'misconception'
  | 'practice'
  | 'resource'
  | 'understanding'
  | 'approach'
  | 'assessment'
  | 'strength'
  | 'improvement'
  | 'feedback';

/**
 * Parsed section from AI response
 */
export interface ResponseSection {
  heading: string;
  content: string;
  type: SectionType;
}

/**
 * Structured response from AI
 */
export interface ResponseStructure {
  title?: string;
  sections: ResponseSection[];
  summary?: string;
  keyTakeaways?: string[];
  nextSteps?: string[];
}

/**
 * Refined AI response with formatting
 */
export interface RefinedResponse {
  raw: string;
  refined: string;
  formattedHtml: string;
  structure: ResponseStructure;
  requestType: AIRequestType;
}

/**
 * Enhanced request body for AI chat with prompt engineering
 */
export interface EnhancedFalkeAIChatRequest extends FalkeAIChatRequest {
  requestType?: AIRequestType;
  userLearningContext?: Partial<UserLearningContext>;
}

/**
 * Enhanced response from AI chat with refined content
 */
export interface EnhancedFalkeAIChatResponse extends FalkeAIChatResponse {
  refined?: RefinedResponse;
  requestType?: AIRequestType;
  provider?: string;
  model?: string;
  modelType?: string;
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
export type BookStatus = 'pending' | 'approved' | 'rejected';
export type BookFileType = 'pdf' | 'epub' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'txt' | 'png' | 'jpg';
export type BookCategoryType = 'textbook' | 'reference' | 'notes' | 'slides' | 'research' | 'material' | 'other';
export type CoverGenerationStatus = 'pending' | 'generated' | 'failed' | 'manual';

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
  // Upload workflow fields
  uploadedBy?: string;
  subject?: string;
  bookCategory?: BookCategoryType;
  fileName?: string;
  fileType?: BookFileType;
  coverGenerationStatus?: CoverGenerationStatus;
  status?: BookStatus;
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
  views?: number;
  downloads?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookReview {
  _id: string;
  bookId: string;
  userId: string;
  rating: number;
  reviewText?: string;
  helpfulVotes: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookCategory {
  name: string;
  icon: string;
  color: string;
  description?: string;
  bookCount: number;
}

export interface BookUploadData {
  title: string;
  author?: string;
  description?: string;
  category?: BookCategoryType;
  subject?: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  fileType?: BookFileType;
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

// ============================================
// User Analytics Types (Phase 1)
// ============================================

/**
 * Activity types tracked for user analytics
 */
export type UserActivityType = 'chat' | 'login' | 'library_view' | 'book_upload';

/**
 * Activity timeline entry (date with count)
 */
export interface ActivityTimelineEntry {
  date: string; // YYYY-MM-DD format
  count: number;
}

/**
 * Daily breakdown by activity type
 */
export interface DailyBreakdown {
  chat: number;
  login: number;
  library_view: number;
  book_upload: number;
}

/**
 * User Analytics Data from GET /api/user/analytics
 */
export interface UserAnalyticsData {
  totalQuestions: number;
  dailyStreak: number;
  totalDaysSpent: number;
  activityTimeline: ActivityTimelineEntry[];
  dailyBreakdown: DailyBreakdown;
}

// ============================================
// Chat History Types
// ============================================

/**
 * Sender types for chat messages
 */
export type MessageSender = 'user' | 'AI';

/**
 * Message types for categorization
 */
export type MessageType = 'question' | 'answer' | 'system' | 'error' | 'context';

/**
 * Individual chat message structure
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  _id?: string;
  /** Sender of the message ('user' or 'AI') */
  sender: MessageSender;
  /** Content of the message */
  content: string;
  /** Timestamp when the message was created */
  timestamp: string;
  /** Type of message for categorization */
  messageType: MessageType;
  /** Optional metadata (e.g., AI model, provider, tokens used) */
  metadata?: {
    provider?: string;
    model?: string;
    modelType?: string;
    responseTimeMs?: number;
    [key: string]: unknown;
  };
}

/**
 * Chat session summary (without full messages) for listing
 */
export interface ChatSessionSummary {
  /** Unique MongoDB ID for the session */
  _id: string;
  /** User ID who owns this session */
  userId: string;
  /** Unique identifier for this chat session */
  sessionId: string;
  /** Title of the session */
  title: string;
  /** Whether this session is currently active */
  isActive: boolean;
  /** Page/context where the chat was initiated */
  page: FalkeAIChatPage;
  /** Optional course context */
  course?: string;
  /** Total number of messages in the session */
  messageCount: number;
  /** Timestamp when the session was created */
  createdAt: string;
  /** Timestamp when the session was last updated */
  updatedAt: string;
  /** Timestamp of the last message */
  lastMessageAt: string;
  /** Preview of the last message */
  lastMessage?: string;
}

/**
 * Full chat session with messages
 */
export interface ChatSession extends ChatSessionSummary {
  /** Array of messages in this session */
  messages: ChatMessage[];
}

/**
 * Pagination info returned by API
 */
export interface ChatPagination {
  page?: number;
  skip?: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/**
 * Response from GET /chat/history/:userId
 */
export interface ChatHistoryResponse {
  success: boolean;
  sessions: ChatSessionSummary[];
  pagination: ChatPagination;
}

/**
 * Response from GET /chat/session/:sessionId
 */
export interface ChatSessionResponse {
  success: boolean;
  session: ChatSession;
  pagination: ChatPagination;
}

/**
 * Response from POST /chat/save
 */
export interface SaveMessageResponse {
  success: boolean;
  session: {
    sessionId: string;
    title: string;
    messageCount: number;
    page: FalkeAIChatPage;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  isNewSession: boolean;
}

/**
 * Response from POST /chat/session/create
 */
export interface CreateSessionResponse {
  success: boolean;
  session: {
    sessionId: string;
    title: string;
    page: FalkeAIChatPage;
    course?: string;
    isActive: boolean;
    messageCount: number;
    createdAt: string;
  };
}

/**
 * Response from GET /chat/session/:sessionId/context
 */
export interface ChatContextResponse {
  success: boolean;
  context: {
    sessionId: string;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
    totalMessages: number;
  };
}

/**
 * Response from GET /chat/stats
 */
export interface ChatStatsResponse {
  success: boolean;
  stats: {
    totalSessions: number;
    activeSessions: number;
    totalMessages: number;
    lastActivityAt: string | null;
    sessionsByPage: Record<string, number>;
  };
}

/**
 * Input for saving a message exchange
 */
export interface SaveMessageInput {
  sessionId?: string;
  userMessage: string;
  aiResponse: string;
  page: FalkeAIChatPage;
  course?: string;
  metadata?: ChatMessage['metadata'];
}

/**
 * Input for creating a new session
 */
export interface CreateSessionInput {
  page: FalkeAIChatPage;
  course?: string;
  title?: string;
}