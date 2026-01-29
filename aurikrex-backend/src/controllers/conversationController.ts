/**
 * Conversation Controller
 * 
 * Handles conversation and chat message HTTP requests.
 * Integrates with FalkeAI to maintain conversation context.
 */

import { Request, Response } from 'express';
import { log } from '../utils/logger.js';
import { 
  ConversationModel, 
  ChatMessageModel, 
  ChatMessageDocument,
  CreateConversationInput,
} from '../models/Conversation.model.js';
import { aiService } from '../services/AIService.js';
import { EnhancedAIChatRequest, AIRequestType } from '../types/ai.types.js';

// Helper to extract string from params (handles both string and string[])
const getParamId = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

/**
 * Build conversation context from recent messages
 * This provides continuity in conversations with FalkeAI
 */
function buildConversationContext(messages: ChatMessageDocument[]): string {
  if (messages.length === 0) return '';

  const contextMessages = messages.map(m => 
    `${m.role.toUpperCase()}: ${m.content}`
  ).join('\n\n');

  return `
CONVERSATION HISTORY (for context):
${contextMessages}

Please consider this history when responding to the current question.
  `.trim();
}

/**
 * POST /api/conversations
 * Create a new conversation
 */
export const createConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, topic, userPreferences } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const input: CreateConversationInput = {
      userId,
      title: title || 'New Conversation',
      topic,
      userPreferences,
    };

    const conversation = await ConversationModel.create(input);
    
    log.info('✅ Conversation created via API', { 
      conversationId: conversation._id, 
      userId,
    });

    res.status(201).json({ 
      status: 'success', 
      data: conversation,
    });
  } catch (error) {
    log.error('❌ Error creating conversation', { 
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ status: 'error', message: 'Failed to create conversation' });
  }
};

/**
 * GET /api/conversations
 * Get all conversations for the current user
 */
export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { limit, skip } = req.query;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const result = await ConversationModel.findByUserId(userId, {
      limit: limit ? parseInt(limit as string) : 20,
      skip: skip ? parseInt(skip as string) : 0,
    });

    res.status(200).json({ 
      status: 'success', 
      data: result.conversations,
      total: result.total,
    });
  } catch (error) {
    log.error('❌ Error getting conversations', { 
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ status: 'error', message: 'Failed to get conversations' });
  }
};

/**
 * GET /api/conversations/:id
 * Get a conversation with its messages
 */
export const getConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    const userId = (req as any).user?.userId;
    const { messageLimit } = req.query;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const conversation = await ConversationModel.getWithMessages(
      id, 
      messageLimit ? parseInt(messageLimit as string) : 50
    );

    if (!conversation) {
      res.status(404).json({ status: 'error', message: 'Conversation not found' });
      return;
    }

    // Verify ownership
    if (conversation.userId !== userId) {
      res.status(403).json({ status: 'error', message: 'Not authorized to view this conversation' });
      return;
    }

    res.status(200).json({ status: 'success', data: conversation });
  } catch (error) {
    log.error('❌ Error getting conversation', { 
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ status: 'error', message: 'Failed to get conversation' });
  }
};

/**
 * GET /api/conversations/:id/messages
 * Get messages for a conversation
 */
export const getConversationMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    const userId = (req as any).user?.userId;
    const { limit, before } = req.query;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    // Verify conversation exists and belongs to user
    const conversation = await ConversationModel.findById(id);
    if (!conversation) {
      res.status(404).json({ status: 'error', message: 'Conversation not found' });
      return;
    }

    if (conversation.userId !== userId) {
      res.status(403).json({ status: 'error', message: 'Not authorized to view this conversation' });
      return;
    }

    const messages = await ChatMessageModel.findByConversationId(id, {
      limit: limit ? parseInt(limit as string) : 50,
      before: before ? new Date(before as string) : undefined,
    });

    res.status(200).json({ status: 'success', data: messages });
  } catch (error) {
    log.error('❌ Error getting conversation messages', { 
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ status: 'error', message: 'Failed to get conversation messages' });
  }
};

/**
 * POST /api/conversations/:id/message
 * Send a message in a conversation and get AI response
 * This is the main endpoint for chat with history
 */
export const sendMessageInConversation = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const id = getParamId(req.params.id);
    const { message, requestType } = req.body;
    const userId = (req as any).user?.userId;
    const username = (req as any).user?.name || 'User';

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    if (!message || typeof message !== 'string') {
      res.status(400).json({ status: 'error', message: 'Message is required' });
      return;
    }

    // Get conversation and verify ownership
    const conversation = await ConversationModel.findById(id);
    if (!conversation) {
      res.status(404).json({ status: 'error', message: 'Conversation not found' });
      return;
    }

    if (conversation.userId !== userId) {
      res.status(403).json({ status: 'error', message: 'Not authorized to use this conversation' });
      return;
    }

    // Get recent messages for context
    const recentMessages = await ChatMessageModel.getRecentMessages(id, 10);
    const conversationContext = buildConversationContext(recentMessages);

    // Save user message first
    const userMessage = await ChatMessageModel.create({
      conversationId: id,
      userId,
      role: 'user',
      content: message,
      requestType: requestType as AIRequestType,
    });

    log.info('📤 Sending message with conversation history', {
      conversationId: id,
      userId,
      messageLength: message.length,
      historyMessageCount: recentMessages.length,
    });

    // Build enhanced request with conversation context
    const aiRequest: EnhancedAIChatRequest = {
      message: conversationContext ? `${conversationContext}\n\nCURRENT MESSAGE:\n${message}` : message,
      context: {
        page: 'Ask FalkeAI',
        userId,
        username,
        course: conversation.topic,
      },
      requestType: requestType as AIRequestType,
      userLearningContext: conversation.userPreferences ? {
        learningStyle: conversation.userPreferences.learningStyle as any,
        knowledgeLevel: conversation.userPreferences.knowledgeLevel as any,
        preferredPace: conversation.userPreferences.pace as any,
      } : undefined,
    };

    // Get AI response
    const aiResponse = await aiService.sendEnhancedChatMessage(aiRequest);
    const processingTimeMs = Date.now() - startTime;

    // Save AI response
    const assistantMessage = await ChatMessageModel.create({
      conversationId: id,
      userId,
      role: 'assistant',
      content: aiResponse.reply,
      requestType: aiResponse.requestType,
      metadata: {
        provider: aiResponse.provider,
        model: aiResponse.model,
        modelType: aiResponse.modelType,
        processingTimeMs,
      },
    });

    // Auto-generate title from first message if still default
    if (conversation.title === 'New Conversation' && conversation.messageCount === 0) {
      const autoTitle = message.length > 50 
        ? message.substring(0, 47) + '...' 
        : message;
      await ConversationModel.updateTitle(id, autoTitle);
    }

    log.info('✅ Conversation message processed', {
      conversationId: id,
      userId,
      processingTimeMs,
      provider: aiResponse.provider,
    });

    res.status(200).json({
      status: 'success',
      data: {
        userMessage,
        assistantMessage,
        aiResponse: {
          reply: aiResponse.reply,
          provider: aiResponse.provider,
          model: aiResponse.model,
          modelType: aiResponse.modelType,
          requestType: aiResponse.requestType,
          refined: aiResponse.refined,
        },
      },
    });
  } catch (error) {
    log.error('❌ Error sending conversation message', { 
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ status: 'error', message: 'Failed to send message' });
  }
};

/**
 * PUT /api/conversations/:id
 * Update a conversation (title, topic)
 */
export const updateConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    const { title, topic } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const conversation = await ConversationModel.findById(id);
    if (!conversation) {
      res.status(404).json({ status: 'error', message: 'Conversation not found' });
      return;
    }

    if (conversation.userId !== userId) {
      res.status(403).json({ status: 'error', message: 'Not authorized to update this conversation' });
      return;
    }

    if (title) {
      await ConversationModel.updateTitle(id, title);
    }
    if (topic) {
      await ConversationModel.updateTopic(id, topic);
    }

    const updated = await ConversationModel.findById(id);
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    log.error('❌ Error updating conversation', { 
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ status: 'error', message: 'Failed to update conversation' });
  }
};

/**
 * DELETE /api/conversations/:id
 * Delete a conversation and all its messages
 */
export const deleteConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const conversation = await ConversationModel.findById(id);
    if (!conversation) {
      res.status(404).json({ status: 'error', message: 'Conversation not found' });
      return;
    }

    if (conversation.userId !== userId) {
      res.status(403).json({ status: 'error', message: 'Not authorized to delete this conversation' });
      return;
    }

    await ConversationModel.delete(id);
    res.status(200).json({ status: 'success', message: 'Conversation deleted' });
  } catch (error) {
    log.error('❌ Error deleting conversation', { 
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ status: 'error', message: 'Failed to delete conversation' });
  }
};
