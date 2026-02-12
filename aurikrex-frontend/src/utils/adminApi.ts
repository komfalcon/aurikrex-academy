/**
 * Admin API utilities
 * 
 * Provides functions for admin dashboard API calls including:
 * - Dashboard statistics
 * - User management
 * - Book management
 * - Admin verification
 */

import { apiRequest, ApiError } from './api';

// Types for admin API responses
export interface AdminStats {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  books: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  questions: {
    total: number;
    sessions: number;
  };
  systemHealth: {
    database: string;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    nodeVersion: string;
  };
}

export interface AdminUser {
  _id: string;
  email: string;
  displayName?: string;
  username?: string;
  role: 'student' | 'instructor' | 'admin';
  disabled: boolean;
  emailVerified: boolean;
  photoURL?: string;
  provider?: string;
  createdAt: string;
  lastLogin: string | null;
  progress?: {
    completedLessons: number;
    totalTimeSpent: number;
  };
}

export interface UserAnalyticsSummary {
  user: AdminUser;
  chatHistory: {
    totalSessions: number;
    activeSessions: number;
    totalMessages: number;
    lastActivityAt: string | null;
    sessionsByPage: Record<string, number>;
  };
  activity: {
    totalActivities: number;
    averageResponseQuality: number;
    topicsExplored: string[];
    engagementTrend: 'increasing' | 'stable' | 'decreasing';
    growthScore: number;
  } | null;
}

export interface AdminBook {
  _id: string;
  title: string;
  author: string;
  description: string;
  category: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  coverImageUrl: string;
  pdfUrl: string;
  fileSize: number;
  pages: number;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  uploadedBy?: string;
  subject?: string;
  fileType?: string;
  createdAt: string;
  updatedAt: string;
  views?: number;
  downloads?: number;
  rating: number;
  reviewCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Admin Verification
// ============================================

/**
 * Verify if current user has admin access
 */
export const verifyAdminAccess = async (): Promise<{ isAdmin: boolean; userId?: string; role?: string }> => {
  try {
    const response = await apiRequest('/admin/verify');
    
    if (!response.ok) {
      if (response.status === 403) {
        return { isAdmin: false };
      }
      throw new ApiError('Failed to verify admin access', { status: response.status });
    }
    
    const result = await response.json();
    return {
      isAdmin: result.isAdmin,
      userId: result.data?.userId,
      role: result.data?.role
    };
  } catch (error) {
    // If 403, user is not admin
    if (error instanceof ApiError && error.status === 403) {
      return { isAdmin: false };
    }
    throw error;
  }
};

// ============================================
// Dashboard Statistics
// ============================================

/**
 * Get admin dashboard statistics
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await apiRequest('/admin/stats');
  
  if (!response.ok) {
    throw new ApiError('Failed to fetch admin stats', { status: response.status });
  }
  
  const result = await response.json();
  return result.data;
};

// ============================================
// User Management
// ============================================

/**
 * Get all users with pagination and filters
 */
export const getAdminUsers = async (options: {
  page?: number;
  limit?: number;
  role?: 'student' | 'instructor' | 'admin';
  disabled?: boolean;
  search?: string;
} = {}): Promise<{ users: AdminUser[]; pagination: PaginatedResponse<AdminUser>['pagination'] }> => {
  const params = new URLSearchParams();
  
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.role) params.append('role', options.role);
  if (options.disabled !== undefined) params.append('disabled', options.disabled.toString());
  if (options.search) params.append('search', options.search);

  const queryString = params.toString();
  const url = `/admin/users${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiRequest(url);
  
  if (!response.ok) {
    throw new ApiError('Failed to fetch users', { status: response.status });
  }
  
  const result = await response.json();
  return result.data;
};

/**
 * Deactivate a user account
 */
export const deactivateUser = async (userId: string): Promise<AdminUser> => {
  const response = await apiRequest(`/admin/users/${userId}/deactivate`, {
    method: 'PUT',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new ApiError(errorData.message || 'Failed to deactivate user', { status: response.status });
  }
  
  const result = await response.json();
  return result.data;
};

/**
 * Reactivate a user account
 */
export const reactivateUser = async (userId: string): Promise<AdminUser> => {
  const response = await apiRequest(`/admin/users/${userId}/reactivate`, {
    method: 'PUT',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new ApiError(errorData.message || 'Failed to reactivate user', { status: response.status });
  }
  
  const result = await response.json();
  return result.data;
};

/**
 * Get analytics summary for a specific user
 */
export const getUserAnalyticsSummary = async (userId: string): Promise<UserAnalyticsSummary> => {
  const response = await apiRequest(`/admin/users/${userId}/analytics`);
  
  if (!response.ok) {
    throw new ApiError('Failed to fetch user analytics', { status: response.status });
  }
  
  const result = await response.json();
  return result.data;
};

// ============================================
// Book Management
// ============================================

/**
 * Get all books with filters (for admin)
 */
export const getAdminBooks = async (options: {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'published';
  search?: string;
  sortBy?: 'title' | 'rating' | 'newest' | 'popular' | 'downloads';
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<{ books: AdminBook[]; pagination: PaginatedResponse<AdminBook>['pagination'] }> => {
  const params = new URLSearchParams();
  
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.status) params.append('status', options.status);
  if (options.search) params.append('search', options.search);
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);

  const queryString = params.toString();
  const url = `/admin/books${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiRequest(url);
  
  if (!response.ok) {
    throw new ApiError('Failed to fetch books', { status: response.status });
  }
  
  const result = await response.json();
  return result.data;
};
