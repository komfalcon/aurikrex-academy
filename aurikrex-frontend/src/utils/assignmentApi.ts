/**
 * Assignment API Service
 * 
 * Provides functions for interacting with the assignment and solution APIs.
 * All functions use real backend endpoints - NO MOCK DATA.
 */

import { apiRequest } from './api';
import type { 
  Assignment, 
  AssignmentStats, 
  Solution, 
  SolutionStats,
  AssignmentStatus 
} from '../types';

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// ============================================
// Assignment API Functions
// ============================================

/**
 * Create a new assignment
 */
export async function createAssignment(data: {
  title?: string;
  description?: string;
  assignmentType: 'upload' | 'text';
  textContent?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  deadline?: string;
}): Promise<Assignment> {
  const response = await apiRequest('/assignments', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create assignment');
  }

  const result: ApiResponse<Assignment> = await response.json();
  if (!result.data) {
    throw new Error('No assignment data returned');
  }
  return result.data;
}

/**
 * Get all assignments for the current user
 */
export async function getAssignments(options: {
  status?: AssignmentStatus;
  limit?: number;
  skip?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'deadline';
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<{ assignments: Assignment[]; total: number }> {
  const params = new URLSearchParams();
  if (options.status) params.append('status', options.status);
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.skip) params.append('skip', options.skip.toString());
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);

  const url = `/assignments${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiRequest(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get assignments');
  }

  const result: ApiResponse<{ assignments: Assignment[]; total: number }> = await response.json();
  return result.data || { assignments: [], total: 0 };
}

/**
 * Get a single assignment by ID
 */
export async function getAssignment(id: string): Promise<{ assignment: Assignment; solutions: Solution[] }> {
  const response = await apiRequest(`/assignments/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get assignment');
  }

  const result: ApiResponse<{ assignment: Assignment; solutions: Solution[] }> = await response.json();
  if (!result.data) {
    throw new Error('No assignment data returned');
  }
  return result.data;
}

/**
 * Analyze an assignment using FalkeAI
 */
export async function analyzeAssignment(id: string): Promise<Assignment> {
  const response = await apiRequest(`/assignments/${id}/analyze`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to analyze assignment');
  }

  const result: ApiResponse<Assignment> = await response.json();
  if (!result.data) {
    throw new Error('No assignment data returned');
  }
  return result.data;
}

/**
 * Get assignment statistics for the current user
 */
export async function getAssignmentStats(): Promise<AssignmentStats> {
  const response = await apiRequest('/assignments/stats');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get assignment stats');
  }

  const result: ApiResponse<AssignmentStats> = await response.json();
  return result.data || {
    total: 0,
    pending: 0,
    analyzed: 0,
    attempted: 0,
    submitted: 0,
    graded: 0,
  };
}

/**
 * Delete an assignment
 */
export async function deleteAssignment(id: string): Promise<void> {
  const response = await apiRequest(`/assignments/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete assignment');
  }
}

// ============================================
// Solution API Functions
// ============================================

/**
 * Submit a solution for an assignment
 */
export async function submitSolution(data: {
  assignmentId: string;
  solutionType: 'file' | 'text';
  textContent?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}): Promise<Solution> {
  const response = await apiRequest('/assignments/solutions', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to submit solution');
  }

  const result: ApiResponse<Solution> = await response.json();
  if (!result.data) {
    throw new Error('No solution data returned');
  }
  return result.data;
}

/**
 * Verify a solution using FalkeAI
 */
export async function verifySolution(id: string): Promise<Solution> {
  const response = await apiRequest(`/assignments/solutions/${id}/verify`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to verify solution');
  }

  const result: ApiResponse<Solution> = await response.json();
  if (!result.data) {
    throw new Error('No solution data returned');
  }
  return result.data;
}

/**
 * Get all solutions for the current user
 */
export async function getSolutions(options: {
  limit?: number;
  skip?: number;
} = {}): Promise<{ solutions: Solution[]; total: number }> {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.skip) params.append('skip', options.skip.toString());

  const url = `/assignments/solutions${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiRequest(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get solutions');
  }

  const result: ApiResponse<{ solutions: Solution[]; total: number }> = await response.json();
  return result.data || { solutions: [], total: 0 };
}

/**
 * Get solution statistics for the current user
 */
export async function getSolutionStats(): Promise<SolutionStats> {
  const response = await apiRequest('/assignments/solutions/stats');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get solution stats');
  }

  const result: ApiResponse<SolutionStats> = await response.json();
  return result.data || {
    totalSolutions: 0,
    averageAccuracy: 0,
    totalCorrect: 0,
    averageAttempts: 0,
    conceptsMastered: [],
    conceptsToReview: [],
  };
}

export default {
  createAssignment,
  getAssignments,
  getAssignment,
  analyzeAssignment,
  getAssignmentStats,
  deleteAssignment,
  submitSolution,
  verifySolution,
  getSolutions,
  getSolutionStats,
};
