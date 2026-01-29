/**
 * Conversation Model
 * 
 * Stores chat conversations between users and FalkeAI.
 * Conversations group related messages together for context continuity.
 */

import { ObjectId, Collection, WithId, Document } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { log } from '../utils/logger.js';

/**
 * User learning preferences stored with conversation
 */
export interface ConversationPreferences {
  learningStyle?: string;
  knowledgeLevel?: string;
  pace?: string;
}

/**
 * Conversation document structure
 */
export interface ConversationDocument {
  _id?: ObjectId;
  userId: string;
  title: string;
  topic?: string;
  messageIds: ObjectId[];
  userPreferences?: ConversationPreferences;
  messageCount: number;
  createdAt: Date;
  lastUpdatedAt: Date;
}

/**
 * Chat message document structure
 */
export interface ChatMessageDocument {
  _id?: ObjectId;
  userId: string;
  conversationId: ObjectId;
  role: 'user' | 'assistant';
  content: string;
  requestType?: 'teach' | 'question' | 'hint' | 'review' | 'explanation';
  metadata?: {
    provider?: string;
    model?: string;
    modelType?: string;
    processingTimeMs?: number;
  };
  timestamp: Date;
}

/**
 * Input for creating a new conversation
 */
export interface CreateConversationInput {
  userId: string;
  title?: string;
  topic?: string;
  userPreferences?: ConversationPreferences;
}

/**
 * Input for adding a message to a conversation
 */
export interface AddMessageInput {
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  requestType?: 'teach' | 'question' | 'hint' | 'review' | 'explanation';
  metadata?: ChatMessageDocument['metadata'];
}

/**
 * Conversation with messages
 */
export interface ConversationWithMessages extends ConversationDocument {
  messages: ChatMessageDocument[];
}

/**
 * Get the conversations collection
 */
function getConversationsCollection(): Collection<ConversationDocument> {
  return getDB().collection<ConversationDocument>('conversations');
}

/**
 * Get the chat messages collection
 */
function getChatMessagesCollection(): Collection<ChatMessageDocument> {
  return getDB().collection<ChatMessageDocument>('chat_messages');
}

/**
 * Conversation Model
 */
export const ConversationModel = {
  /**
   * Create a new conversation
   */
  async create(input: CreateConversationInput): Promise<WithId<ConversationDocument>> {
    const collection = getConversationsCollection();
    const now = new Date();

    const conversation: ConversationDocument = {
      userId: input.userId,
      title: input.title || 'New Conversation',
      topic: input.topic,
      messageIds: [],
      userPreferences: input.userPreferences,
      messageCount: 0,
      createdAt: now,
      lastUpdatedAt: now,
    };

    const result = await collection.insertOne(conversation);
    log.info('✅ Conversation created', { conversationId: result.insertedId, userId: input.userId });

    return { ...conversation, _id: result.insertedId };
  },

  /**
   * Find a conversation by ID
   */
  async findById(id: string): Promise<WithId<ConversationDocument> | null> {
    const collection = getConversationsCollection();
    return collection.findOne({ _id: new ObjectId(id) }) as Promise<WithId<ConversationDocument> | null>;
  },

  /**
   * Find all conversations for a user
   */
  async findByUserId(
    userId: string,
    options?: { limit?: number; skip?: number }
  ): Promise<{ conversations: WithId<ConversationDocument>[]; total: number }> {
    const collection = getConversationsCollection();
    const filter = { userId };

    const total = await collection.countDocuments(filter);
    const cursor = collection
      .find(filter)
      .sort({ lastUpdatedAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 20);

    const conversations = await cursor.toArray() as WithId<ConversationDocument>[];
    return { conversations, total };
  },

  /**
   * Update conversation title
   */
  async updateTitle(id: string, title: string): Promise<boolean> {
    const collection = getConversationsCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          title,
          lastUpdatedAt: new Date(),
        } 
      }
    );
    return result.modifiedCount > 0;
  },

  /**
   * Update conversation topic
   */
  async updateTopic(id: string, topic: string): Promise<boolean> {
    const collection = getConversationsCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          topic,
          lastUpdatedAt: new Date(),
        } 
      }
    );
    return result.modifiedCount > 0;
  },

  /**
   * Add a message reference to conversation
   */
  async addMessageReference(conversationId: string, messageId: ObjectId): Promise<void> {
    const collection = getConversationsCollection();
    await collection.updateOne(
      { _id: new ObjectId(conversationId) },
      { 
        $push: { messageIds: messageId },
        $inc: { messageCount: 1 },
        $set: { lastUpdatedAt: new Date() },
      }
    );
  },

  /**
   * Delete a conversation and its messages
   */
  async delete(id: string): Promise<boolean> {
    const conversationsCollection = getConversationsCollection();
    const messagesCollection = getChatMessagesCollection();
    const conversationId = new ObjectId(id);

    // Delete all messages
    await messagesCollection.deleteMany({ conversationId });

    // Delete conversation
    const result = await conversationsCollection.deleteOne({ _id: conversationId });
    log.info('🗑️ Conversation deleted', { conversationId: id });
    
    return result.deletedCount > 0;
  },

  /**
   * Get conversation with messages
   */
  async getWithMessages(
    id: string,
    messageLimit?: number
  ): Promise<ConversationWithMessages | null> {
    const conversation = await this.findById(id);
    if (!conversation) return null;

    const messagesCollection = getChatMessagesCollection();
    const messages = await messagesCollection
      .find({ conversationId: new ObjectId(id) })
      .sort({ timestamp: -1 })
      .limit(messageLimit || 50)
      .toArray() as ChatMessageDocument[];

    // Reverse to get chronological order
    messages.reverse();

    return {
      ...conversation,
      messages,
    };
  },
};

/**
 * Chat Message Model
 */
export const ChatMessageModel = {
  /**
   * Create a new chat message
   */
  async create(input: AddMessageInput): Promise<WithId<ChatMessageDocument>> {
    const collection = getChatMessagesCollection();
    const conversationId = new ObjectId(input.conversationId);

    const message: ChatMessageDocument = {
      userId: input.userId,
      conversationId,
      role: input.role,
      content: input.content,
      requestType: input.requestType,
      metadata: input.metadata,
      timestamp: new Date(),
    };

    const result = await collection.insertOne(message);
    
    // Add reference to conversation
    await ConversationModel.addMessageReference(input.conversationId, result.insertedId);

    log.debug('💬 Chat message created', { 
      messageId: result.insertedId, 
      conversationId: input.conversationId,
      role: input.role,
    });

    return { ...message, _id: result.insertedId };
  },

  /**
   * Get messages for a conversation
   */
  async findByConversationId(
    conversationId: string,
    options?: { limit?: number; before?: Date }
  ): Promise<ChatMessageDocument[]> {
    const collection = getChatMessagesCollection();
    const filter: Document = { conversationId: new ObjectId(conversationId) };

    if (options?.before) {
      filter.timestamp = { $lt: options.before };
    }

    const messages = await collection
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(options?.limit || 50)
      .toArray() as ChatMessageDocument[];

    // Reverse to get chronological order
    return messages.reverse();
  },

  /**
   * Get the last N messages for context building
   */
  async getRecentMessages(
    conversationId: string,
    limit: number = 10
  ): Promise<ChatMessageDocument[]> {
    return this.findByConversationId(conversationId, { limit });
  },

  /**
   * Delete a message
   */
  async delete(id: string): Promise<boolean> {
    const collection = getChatMessagesCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  },
};

/**
 * Initialize indexes for conversations and messages
 */
export async function initializeConversationIndexes(): Promise<void> {
  const conversationsCollection = getConversationsCollection();
  const messagesCollection = getChatMessagesCollection();

  // Conversation indexes
  await conversationsCollection.createIndex({ userId: 1, lastUpdatedAt: -1 });
  await conversationsCollection.createIndex({ createdAt: 1 });

  // Message indexes
  await messagesCollection.createIndex({ conversationId: 1, timestamp: -1 });
  await messagesCollection.createIndex({ userId: 1, timestamp: -1 });

  log.info('✅ Conversation indexes created');
}
