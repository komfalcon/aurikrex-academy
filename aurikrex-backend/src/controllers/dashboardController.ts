/**
 * Dashboard Controller
 * 
 * Handles dashboard-related HTTP requests for Aurikrex Academy.
 * Provides endpoints for fetching comprehensive dashboard data.
 */

import { Request, Response } from 'express';
import { log } from '../utils/logger.js';
import { DashboardDataService } from '../services/DashboardDataService.js';

/**
 * GET /api/dashboard/data
 * Get comprehensive dashboard data for the current user
 */
export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const dashboardData = await DashboardDataService.getDashboardData(userId);
    
    res.status(200).json({ 
      status: 'success', 
      data: dashboardData 
    });
  } catch (error) {
    log.error('❌ Error getting dashboard data', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ status: 'error', message: 'Failed to get dashboard data' });
  }
};

/**
 * GET /api/dashboard/overview
 * Get overview statistics for the dashboard header
 */
export const getOverviewStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const stats = await DashboardDataService.getOverviewStats(userId);
    
    res.status(200).json({ 
      status: 'success', 
      data: stats 
    });
  } catch (error) {
    log.error('❌ Error getting overview stats', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ status: 'error', message: 'Failed to get overview stats' });
  }
};

/**
 * GET /api/dashboard/activity
 * Get recent activity feed
 */
export const getRecentActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const activity = await DashboardDataService.getRecentActivity(userId, limit);
    
    res.status(200).json({ 
      status: 'success', 
      data: activity 
    });
  } catch (error) {
    log.error('❌ Error getting recent activity', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ status: 'error', message: 'Failed to get recent activity' });
  }
};

/**
 * GET /api/dashboard/analytics
 * Get learning analytics
 */
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const analytics = await DashboardDataService.getAnalytics(userId);
    
    res.status(200).json({ 
      status: 'success', 
      data: analytics 
    });
  } catch (error) {
    log.error('❌ Error getting analytics', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ status: 'error', message: 'Failed to get analytics' });
  }
};

/**
 * GET /api/dashboard/quick-stats
 * Get quick stats for dashboard header
 */
export const getQuickStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const stats = await DashboardDataService.getQuickStats(userId);
    
    res.status(200).json({ 
      status: 'success', 
      data: stats 
    });
  } catch (error) {
    log.error('❌ Error getting quick stats', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ status: 'error', message: 'Failed to get quick stats' });
  }
};
