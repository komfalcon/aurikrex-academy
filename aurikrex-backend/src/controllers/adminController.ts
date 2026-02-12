/**
 * Admin Controller
 * 
 * Handles all admin-related API endpoints including:
 * - Dashboard statistics
 * - User management (list, deactivate, reactivate)
 * - Book management (list all books)
 * - System health overview
 */

import { Request, Response } from 'express';
import { log } from '../utils/logger.js';
import { getErrorMessage } from '../utils/errors.js';
import { UserModel } from '../models/User.model.js';
import { BookModel } from '../models/Book.model.js';
import { ChatHistoryModel } from '../models/ChatHistory.model.js';
import { FalkeAIActivityModel } from '../models/FalkeAIActivity.model.js';
import { getDB } from '../config/mongodb.js';

/**
 * Get admin dashboard statistics
 * Returns total users, total questions asked, total books, and system health
 */
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    log.info('📊 Admin requesting dashboard stats');

    // Get total users count
    const { total: totalUsers } = await UserModel.list({ limit: 1 });
    
    // Get total books count (all statuses)
    const allBooks = await BookModel.list({ limit: 1 });
    const totalBooks = allBooks.total;
    
    // Get pending books count
    const pendingBooks = await BookModel.list({ limit: 1, status: 'pending' });
    const pendingBooksCount = pendingBooks.total;
    
    // Get approved books count
    const approvedBooks = await BookModel.list({ limit: 1, status: 'approved' });
    const approvedBooksCount = approvedBooks.total;

    // Get total questions from chat history
    const db = getDB();
    const chatHistoryCollection = db.collection('chat_history');
    const totalSessionsResult = await chatHistoryCollection.aggregate([
      {
        $group: {
          _id: null,
          totalMessages: { $sum: '$messageCount' },
          totalSessions: { $sum: 1 }
        }
      }
    ]).toArray();
    
    const totalQuestions = totalSessionsResult[0]?.totalMessages || 0;
    const totalChatSessions = totalSessionsResult[0]?.totalSessions || 0;

    // Get active users (users who logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const usersCollection = db.collection('users');
    const activeUsersCount = await usersCollection.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }
    });

    // System health (basic checks)
    const systemHealth = {
      database: 'healthy',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    };

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsersCount,
        inactive: totalUsers - activeUsersCount
      },
      books: {
        total: totalBooks,
        pending: pendingBooksCount,
        approved: approvedBooksCount,
        rejected: totalBooks - pendingBooksCount - approvedBooksCount
      },
      questions: {
        total: totalQuestions,
        sessions: totalChatSessions
      },
      systemHealth
    };

    log.info('✅ Dashboard stats retrieved', { 
      totalUsers, 
      totalBooks, 
      totalQuestions 
    });

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    log.error('❌ Error getting dashboard stats', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Get all users with pagination and filters
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const role = req.query.role as string;
    const disabled = req.query.disabled as string;
    const search = req.query.search as string;

    log.info('👥 Admin requesting user list', { page, limit, role, disabled, search });

    const filter: any = {};

    if (role && ['student', 'instructor', 'admin'].includes(role)) {
      filter.role = role;
    }

    if (disabled !== undefined) {
      filter.disabled = disabled === 'true';
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { email: { $regex: searchRegex } },
        { displayName: { $regex: searchRegex } },
        { username: { $regex: searchRegex } }
      ];
    }

    const result = await UserModel.list({ page, limit, filter });

    // Remove sensitive fields (passwords) from response
    const users = result.users.map(user => ({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      username: user.username,
      role: user.role,
      disabled: user.disabled,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL,
      provider: user.provider,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      progress: user.progress
    }));

    log.info('✅ User list retrieved', { count: users.length, total: result.total });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      }
    });
  } catch (error) {
    log.error('❌ Error getting users', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Deactivate a user account
 */
export const deactivateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const adminId = req.user?.userId;

    log.info('🔒 Admin deactivating user', { userId, adminId });

    // Prevent self-deactivation
    if (userId === adminId) {
      res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check if user is already disabled
    if (user.disabled) {
      res.status(400).json({
        success: false,
        message: 'User is already deactivated'
      });
      return;
    }

    // Deactivate the user
    const updatedUser = await UserModel.update(userId, { disabled: true });

    log.info('✅ User deactivated', { userId, email: user.email });

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      data: {
        _id: updatedUser?._id,
        email: updatedUser?.email,
        displayName: updatedUser?.displayName,
        disabled: updatedUser?.disabled
      }
    });
  } catch (error) {
    log.error('❌ Error deactivating user', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Reactivate a user account
 */
export const reactivateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;

    log.info('🔓 Admin reactivating user', { userId });

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check if user is already active
    if (!user.disabled) {
      res.status(400).json({
        success: false,
        message: 'User is already active'
      });
      return;
    }

    // Reactivate the user
    const updatedUser = await UserModel.update(userId, { disabled: false });

    log.info('✅ User reactivated', { userId, email: user.email });

    res.status(200).json({
      success: true,
      message: 'User reactivated successfully',
      data: {
        _id: updatedUser?._id,
        email: updatedUser?.email,
        displayName: updatedUser?.displayName,
        disabled: updatedUser?.disabled
      }
    });
  } catch (error) {
    log.error('❌ Error reactivating user', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate user',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Get user analytics summary for a specific user
 */
export const getUserAnalyticsSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;

    log.info('📈 Admin requesting user analytics', { userId });

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Get chat statistics
    const chatStats = await ChatHistoryModel.getUserStats(userId);

    // Get FalkeAI activity analytics (if available)
    let activityAnalytics = null;
    try {
      activityAnalytics = await FalkeAIActivityModel.getUserAnalytics(userId);
    } catch {
      // Activity analytics may not exist for all users
    }

    const summary = {
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        progress: user.progress
      },
      chatHistory: chatStats,
      activity: activityAnalytics ? {
        totalActivities: activityAnalytics.totalActivities,
        averageResponseQuality: activityAnalytics.averageResponseQuality,
        topicsExplored: activityAnalytics.topicsExplored,
        engagementTrend: activityAnalytics.engagementTrend,
        growthScore: activityAnalytics.growthScore
      } : null
    };

    log.info('✅ User analytics retrieved', { userId });

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    log.error('❌ Error getting user analytics', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to get user analytics',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Get all books with filters (pending, approved, rejected, all)
 */
export const getAllBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string;
    const search = req.query.search as string;
    const sortBy = req.query.sortBy as 'title' | 'rating' | 'newest' | 'popular' | 'downloads';
    const sortOrder = req.query.sortOrder as 'asc' | 'desc';

    log.info('📚 Admin requesting books list', { page, limit, status, search });

    const options: any = { page, limit };

    if (status && ['pending', 'approved', 'rejected', 'published'].includes(status)) {
      options.status = status;
    }

    if (search) {
      options.search = search;
    }

    if (sortBy) {
      options.sortBy = sortBy;
    }

    if (sortOrder) {
      options.sortOrder = sortOrder;
    }

    const result = await BookModel.list(options);

    log.info('✅ Books list retrieved', { count: result.books.length, total: result.total });

    res.status(200).json({
      success: true,
      data: {
        books: result.books,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      }
    });
  } catch (error) {
    log.error('❌ Error getting books', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to get books',
      error: getErrorMessage(error)
    });
  }
};

/**
 * Verify if current user has admin access
 */
export const verifyAdminAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    log.info('🔐 Verifying admin access', { userId, role: userRole });

    if (userRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'You do not have admin access',
        isAdmin: false
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Admin access verified',
      isAdmin: true,
      data: {
        userId,
        role: userRole
      }
    });
  } catch (error) {
    log.error('❌ Error verifying admin access', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to verify admin access',
      error: getErrorMessage(error)
    });
  }
};
