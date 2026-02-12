/**
 * ChatHistory Model
 * 
 * Manages persistent chat history for FalkeAI conversations in MongoDB.
 * Stores chat sessions with messages, timestamps, and metadata for each user.
 * Provides methods for creating, retrieving, and managing chat history.
 * 
 * Features:
 * - Session-based chat storage
 * - Message batching for efficient storage
 * - Pagination support for large histories
 * - Context retrieval for AI continuity
 * 
 * @module ChatHistory.model
 */

import { Collection, ObjectId, Filter } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { log } from '../utils/logger.js';

/**
 * Sender types for chat messages
 */
export type MessageSender = 'user' | 'AI';

/**
 * Message types for categorization
 */
export type MessageType = 'question' | 'answer' | 'system' | 'error' | 'context';

/**
 * Individual chat message document structure
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  _id?: ObjectId;
  /** Sender of the message ('user' or 'AI') */
  sender: MessageSender;
  /** Content of the message */
  content: string;
  /** Timestamp when the message was created */
  timestamp: Date;
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
 * Chat session document structure stored in MongoDB
 */
export interface ChatSessionDocument {
  /** Unique MongoDB ID for the session */
  _id?: ObjectId;
  /** User ID who owns this session (ObjectId string) */
  userId: string;
  /** Unique identifier for this chat session */
  sessionId: string;
  /** Title of the session (auto-generated or user-defined) */
  title: string;
  /** Array of messages in this session */
  messages: ChatMessage[];
  /** Whether this session is currently active */
  isActive: boolean;
  /** Page/context where the chat was initiated */
  page: 'Smart Lessons' | 'Assignment' | 'Dashboard' | 'Ask FalkeAI';
  /** Optional course context */
  course?: string;
  /** Total number of messages in the session */
  messageCount: number;
  /** Timestamp when the session was created */
  createdAt: Date;
  /** Timestamp when the session was last updated */
  updatedAt: Date;
  /** Timestamp of the last message */
  lastMessageAt: Date;
}

/**
 * Input for creating a new chat session
 */
export interface CreateSessionInput {
  userId: string;
  page: 'Smart Lessons' | 'Assignment' | 'Dashboard' | 'Ask FalkeAI';
  course?: string;
  title?: string;
}

/**
 * Input for adding a message to a session
 */
export interface AddMessageInput {
  sessionId: string;
  sender: MessageSender;
  content: string;
  messageType: MessageType;
  metadata?: ChatMessage['metadata'];
}

/**
 * Options for retrieving messages with pagination
 */
export interface GetMessagesOptions {
  limit?: number;
  skip?: number;
  before?: Date;
  after?: Date;
}

/**
 * Response structure for paginated results
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Context messages for AI processing
 */
export interface AIContextMessages {
  sessionId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  totalMessages: number;
}

/**
 * ChatHistory Model Class
 * 
 * Provides static methods for managing chat history in MongoDB.
 * All methods are asynchronous and handle errors appropriately.
 */
export class ChatHistoryModel {
  private static collectionName = 'chat_history';

  /**
   * Get the MongoDB collection for chat history
   * @returns Collection instance for chat history documents
   */
  private static getCollection(): Collection<ChatSessionDocument> {
    return getDB().collection<ChatSessionDocument>(this.collectionName);
  }

  /**
   * Generate a unique session ID
   * @returns A unique session identifier string
   */
  private static generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `sess_${timestamp}_${randomPart}`;
  }

  /**
   * Generate a title from the first message
   * @param content - First message content
   * @returns Generated title (truncated if necessary)
   */
  private static generateTitle(content: string): string {
    const maxLength = 50;
    const cleaned = content.replace(/[\n\r]+/g, ' ').trim();
    if (cleaned.length <= maxLength) {
      return cleaned;
    }
    return cleaned.substring(0, maxLength - 3) + '...';
  }

  /**
   * Create a new chat session
   * 
   * @param input - Session creation parameters
   * @returns The created chat session document
   * @throws Error if creation fails
   */
  static async createSession(input: CreateSessionInput): Promise<ChatSessionDocument> {
    try {
      const collection = this.getCollection();
      const now = new Date();

      const session: ChatSessionDocument = {
        userId: input.userId,
        sessionId: this.generateSessionId(),
        title: input.title || 'New Chat',
        messages: [],
        isActive: true,
        page: input.page,
        course: input.course,
        messageCount: 0,
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
      };

      const result = await collection.insertOne(session);

      log.info('✅ Chat session created', {
        sessionId: session.sessionId,
        userId: input.userId,
        page: input.page,
      });

      return { ...session, _id: result.insertedId };
    } catch (error) {
      log.error('❌ Error creating chat session', {
        error: error instanceof Error ? error.message : String(error),
        userId: input.userId,
      });
      throw error;
    }
  }

  /**
   * Add a message to an existing session
   * Creates a new session if sessionId is not found
   * 
   * @param input - Message input parameters
   * @returns The updated session document
   * @throws Error if operation fails
   */
  static async addMessage(input: AddMessageInput): Promise<ChatSessionDocument> {
    try {
      const collection = this.getCollection();
      const now = new Date();

      const message: ChatMessage = {
        _id: new ObjectId(),
        sender: input.sender,
        content: input.content,
        timestamp: now,
        messageType: input.messageType,
        metadata: input.metadata,
      };

      // Find and update the session, adding the message
      const result = await collection.findOneAndUpdate(
        { sessionId: input.sessionId },
        {
          $push: { messages: message },
          $inc: { messageCount: 1 },
          $set: {
            updatedAt: now,
            lastMessageAt: now,
          },
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error(`Session not found: ${input.sessionId}`);
      }

      // Update title if this is the first user message
      if (input.sender === 'user' && result.messageCount === 1) {
        await collection.updateOne(
          { sessionId: input.sessionId },
          { $set: { title: this.generateTitle(input.content) } }
        );
      }

      log.info('✅ Message added to session', {
        sessionId: input.sessionId,
        sender: input.sender,
        messageType: input.messageType,
        messageCount: result.messageCount,
      });

      return result;
    } catch (error) {
      log.error('❌ Error adding message', {
        error: error instanceof Error ? error.message : String(error),
        sessionId: input.sessionId,
      });
      throw error;
    }
  }

  /**
   * Save a complete message exchange (user question + AI answer)
   * Creates a new session if needed, or adds to existing session
   * 
   * @param userId - User ID
   * @param sessionId - Optional existing session ID
   * @param userMessage - User's message content
   * @param aiResponse - AI's response content
   * @param page - Page context
   * @param course - Optional course context
   * @param metadata - Optional metadata for AI response
   * @returns The session document with updated messages
   */
  static async saveMessageExchange(params: {
    userId: string;
    sessionId?: string;
    userMessage: string;
    aiResponse: string;
    page: 'Smart Lessons' | 'Assignment' | 'Dashboard' | 'Ask FalkeAI';
    course?: string;
    metadata?: ChatMessage['metadata'];
  }): Promise<{ session: ChatSessionDocument; isNewSession: boolean }> {
    try {
      let session: ChatSessionDocument;
      let isNewSession = false;

      // If sessionId provided, try to find existing session
      if (params.sessionId) {
        const existing = await this.getSession(params.sessionId);
        if (existing) {
          session = existing;
        } else {
          // Session not found, create new one
          session = await this.createSession({
            userId: params.userId,
            page: params.page,
            course: params.course,
          });
          isNewSession = true;
        }
      } else {
        // No sessionId, create new session
        session = await this.createSession({
          userId: params.userId,
          page: params.page,
          course: params.course,
        });
        isNewSession = true;
      }

      // Add user message
      await this.addMessage({
        sessionId: session.sessionId,
        sender: 'user',
        content: params.userMessage,
        messageType: 'question',
      });

      // Add AI response
      const updatedSession = await this.addMessage({
        sessionId: session.sessionId,
        sender: 'AI',
        content: params.aiResponse,
        messageType: 'answer',
        metadata: params.metadata,
      });

      log.info('✅ Message exchange saved', {
        sessionId: session.sessionId,
        userId: params.userId,
        isNewSession,
        totalMessages: updatedSession.messageCount,
      });

      return { session: updatedSession, isNewSession };
    } catch (error) {
      log.error('❌ Error saving message exchange', {
        error: error instanceof Error ? error.message : String(error),
        userId: params.userId,
      });
      throw error;
    }
  }

  /**
   * Get a specific session by sessionId
   * 
   * @param sessionId - The session identifier
   * @returns The session document or null if not found
   */
  static async getSession(sessionId: string): Promise<ChatSessionDocument | null> {
    try {
      const collection = this.getCollection();
      const session = await collection.findOne({ sessionId });

      if (session) {
        log.info('✅ Session retrieved', { sessionId });
      }

      return session;
    } catch (error) {
      log.error('❌ Error retrieving session', {
        error: error instanceof Error ? error.message : String(error),
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Get all chat sessions for a user with pagination
   * 
   * @param userId - The user's ID
   * @param options - Pagination and filter options
   * @returns Paginated list of sessions (without full message content for efficiency)
   */
  static async getUserSessions(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      isActive?: boolean;
      pageFilter?: ChatSessionDocument['page'];
    } = {}
  ): Promise<PaginatedResponse<Omit<ChatSessionDocument, 'messages'> & { lastMessage?: string }>> {
    try {
      const collection = this.getCollection();
      const page = options.page || 1;
      const limit = Math.min(options.limit || 20, 100);
      const skip = (page - 1) * limit;

      const filter: Filter<ChatSessionDocument> = { userId };

      if (options.isActive !== undefined) {
        filter.isActive = options.isActive;
      }

      if (options.pageFilter) {
        filter.page = options.pageFilter;
      }

      // Get sessions with only the last message for preview
      const pipeline = [
        { $match: filter },
        { $sort: { lastMessageAt: -1 as const } },
        {
          $project: {
            _id: 1,
            userId: 1,
            sessionId: 1,
            title: 1,
            isActive: 1,
            page: 1,
            course: 1,
            messageCount: 1,
            createdAt: 1,
            updatedAt: 1,
            lastMessageAt: 1,
            lastMessage: { $arrayElemAt: ['$messages.content', -1] },
          },
        },
        { $skip: skip },
        { $limit: limit },
      ];

      const [sessions, totalResult] = await Promise.all([
        collection.aggregate(pipeline).toArray(),
        collection.countDocuments(filter),
      ]);

      log.info('✅ User sessions retrieved', {
        userId,
        count: sessions.length,
        total: totalResult,
        page,
        limit,
      });

      return {
        data: sessions as Array<Omit<ChatSessionDocument, 'messages'> & { lastMessage?: string }>,
        total: totalResult,
        page,
        limit,
        hasMore: skip + sessions.length < totalResult,
      };
    } catch (error) {
      log.error('❌ Error retrieving user sessions', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Get messages from a session with pagination
   * Useful for loading history incrementally
   * 
   * @param sessionId - The session identifier
   * @param options - Pagination options
   * @returns Paginated list of messages
   */
  static async getSessionMessages(
    sessionId: string,
    options: GetMessagesOptions = {}
  ): Promise<PaginatedResponse<ChatMessage>> {
    try {
      const collection = this.getCollection();
      const limit = Math.min(options.limit || 50, 100);
      const skip = options.skip || 0;

      const session = await collection.findOne({ sessionId });

      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      let messages = session.messages;

      // Apply date filters if provided
      if (options.before) {
        messages = messages.filter(m => m.timestamp < options.before!);
      }
      if (options.after) {
        messages = messages.filter(m => m.timestamp > options.after!);
      }

      const total = messages.length;
      const paginatedMessages = messages.slice(skip, skip + limit);

      log.info('✅ Session messages retrieved', {
        sessionId,
        count: paginatedMessages.length,
        total,
      });

      return {
        data: paginatedMessages,
        total,
        page: Math.floor(skip / limit) + 1,
        limit,
        hasMore: skip + paginatedMessages.length < total,
      };
    } catch (error) {
      log.error('❌ Error retrieving session messages', {
        error: error instanceof Error ? error.message : String(error),
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Get recent messages for AI context
   * Returns messages in a format suitable for AI conversation history
   * 
   * @param sessionId - The session identifier
   * @param maxMessages - Maximum number of messages to retrieve (default: 20)
   * @returns Messages formatted for AI context
   */
  static async getAIContext(
    sessionId: string,
    maxMessages: number = 20
  ): Promise<AIContextMessages> {
    try {
      const collection = this.getCollection();
      const session = await collection.findOne({ sessionId });

      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Get the most recent messages, limited to maxMessages
      const recentMessages = session.messages.slice(-maxMessages);

      const contextMessages = recentMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      log.info('✅ AI context retrieved', {
        sessionId,
        messagesReturned: contextMessages.length,
        totalMessages: session.messageCount,
      });

      return {
        sessionId,
        messages: contextMessages,
        totalMessages: session.messageCount,
      };
    } catch (error) {
      log.error('❌ Error retrieving AI context', {
        error: error instanceof Error ? error.message : String(error),
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Delete a chat session
   * 
   * @param sessionId - The session identifier
   * @param userId - The user ID (for authorization)
   * @returns True if deleted, false if not found
   */
  static async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const collection = this.getCollection();
      
      // Ensure user owns the session
      const result = await collection.deleteOne({ sessionId, userId });

      if (result.deletedCount > 0) {
        log.info('✅ Chat session deleted', { sessionId, userId });
        return true;
      }

      log.warn('⚠️ Session not found or not owned by user', { sessionId, userId });
      return false;
    } catch (error) {
      log.error('❌ Error deleting session', {
        error: error instanceof Error ? error.message : String(error),
        sessionId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Mark a session as inactive (soft delete)
   * 
   * @param sessionId - The session identifier
   * @param userId - The user ID (for authorization)
   * @returns The updated session or null
   */
  static async deactivateSession(sessionId: string, userId: string): Promise<ChatSessionDocument | null> {
    try {
      const collection = this.getCollection();

      const result = await collection.findOneAndUpdate(
        { sessionId, userId },
        { $set: { isActive: false, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ Session deactivated', { sessionId, userId });
      }

      return result;
    } catch (error) {
      log.error('❌ Error deactivating session', {
        error: error instanceof Error ? error.message : String(error),
        sessionId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Clear all messages from a session while keeping the session
   * 
   * @param sessionId - The session identifier
   * @param userId - The user ID (for authorization)
   * @returns The updated session or null
   */
  static async clearSessionMessages(sessionId: string, userId: string): Promise<ChatSessionDocument | null> {
    try {
      const collection = this.getCollection();
      const now = new Date();

      const result = await collection.findOneAndUpdate(
        { sessionId, userId },
        {
          $set: {
            messages: [],
            messageCount: 0,
            title: 'New Chat',
            updatedAt: now,
          },
        },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ Session messages cleared', { sessionId, userId });
      }

      return result;
    } catch (error) {
      log.error('❌ Error clearing session messages', {
        error: error instanceof Error ? error.message : String(error),
        sessionId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get user's chat statistics
   * 
   * @param userId - The user's ID
   * @returns Statistics about user's chat history
   */
  static async getUserStats(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    totalMessages: number;
    lastActivityAt: Date | null;
    sessionsByPage: Record<string, number>;
  }> {
    try {
      const collection = this.getCollection();

      const pipeline = [
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            activeSessions: {
              $sum: { $cond: ['$isActive', 1, 0] },
            },
            totalMessages: { $sum: '$messageCount' },
            lastActivityAt: { $max: '$lastMessageAt' },
          },
        },
      ];

      const [stats] = await collection.aggregate(pipeline).toArray();

      // Get sessions by page
      const pageStats = await collection.aggregate([
        { $match: { userId } },
        { $group: { _id: '$page', count: { $sum: 1 } } },
      ]).toArray();

      const sessionsByPage: Record<string, number> = {};
      for (const stat of pageStats) {
        if (stat._id) {
          sessionsByPage[stat._id] = stat.count;
        }
      }

      log.info('✅ User stats retrieved', { userId });

      return {
        totalSessions: stats?.totalSessions || 0,
        activeSessions: stats?.activeSessions || 0,
        totalMessages: stats?.totalMessages || 0,
        lastActivityAt: stats?.lastActivityAt || null,
        sessionsByPage,
      };
    } catch (error) {
      log.error('❌ Error retrieving user stats', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Create indexes for optimal query performance
   * Should be called during database initialization
   */
  static async createIndexes(): Promise<void> {
    try {
      const collection = this.getCollection();

      await Promise.all([
        // Index for finding sessions by user
        collection.createIndex({ userId: 1 }),
        // Index for finding specific session
        collection.createIndex({ sessionId: 1 }, { unique: true }),
        // Compound index for user's sessions sorted by recent activity
        collection.createIndex({ userId: 1, lastMessageAt: -1 }),
        // Index for filtering by page context
        collection.createIndex({ userId: 1, page: 1 }),
        // Index for active sessions
        collection.createIndex({ userId: 1, isActive: 1 }),
        // Index for cleanup of old sessions
        collection.createIndex({ updatedAt: 1 }),
      ]);

      log.info('✅ ChatHistory indexes created successfully');
    } catch (error) {
      log.error('❌ Error creating ChatHistory indexes', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
