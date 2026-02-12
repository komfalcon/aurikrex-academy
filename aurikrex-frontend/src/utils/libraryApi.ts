/**
 * Library API utilities for books and user library operations
 */

import { apiRequest, ApiError } from './api';
import type {
  Book,
  BooksResponse,
  UserLibraryEntry,
  UserLibraryResponse,
  ReadingStats,
  BookDifficulty,
  ReadingStatus,
  BookReview,
  BookCategory,
} from '@/types';

// ============================================
// Books API
// ============================================

/**
 * Get all books with pagination and filters
 */
export const getBooks = async (options: {
  page?: number;
  limit?: number;
  category?: string;
  difficulty?: BookDifficulty;
  search?: string;
  sortBy?: 'title' | 'rating' | 'newest' | 'popular';
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<BooksResponse> => {
  const params = new URLSearchParams();
  
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.category) params.append('category', options.category);
  if (options.difficulty) params.append('difficulty', options.difficulty);
  if (options.search) params.append('search', options.search);
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);

  const queryString = params.toString();
  const url = `/books${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiRequest(url);
  
  if (!response.ok) {
    throw new ApiError('Failed to fetch books', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

/**
 * Get a single book by ID
 */
export const getBook = async (bookId: string): Promise<Book> => {
  const response = await apiRequest(`/books/${bookId}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError('Book not found', { status: 404 });
    }
    throw new ApiError('Failed to fetch book', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

/**
 * Search books by title, author, or description
 */
export const searchBooks = async (
  query: string,
  page: number = 1,
  limit: number = 12
): Promise<BooksResponse> => {
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    limit: limit.toString(),
  });
  
  const response = await apiRequest(`/books/search?${params}`);
  
  if (!response.ok) {
    throw new ApiError('Failed to search books', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

/**
 * Get books by category
 */
export const getBooksByCategory = async (
  category: string,
  page: number = 1,
  limit: number = 12
): Promise<BooksResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  const response = await apiRequest(`/books/category/${encodeURIComponent(category)}?${params}`);
  
  if (!response.ok) {
    throw new ApiError('Failed to fetch books by category', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

/**
 * Get all unique book categories
 */
export const getCategories = async (): Promise<string[]> => {
  const response = await apiRequest('/books/categories');
  
  if (!response.ok) {
    throw new ApiError('Failed to fetch categories', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

// ============================================
// User Library API
// ============================================

/**
 * Get user's library with filters
 */
export const getUserLibrary = async (options: {
  page?: number;
  limit?: number;
  status?: ReadingStatus;
  sortBy?: 'lastReadAt' | 'startedAt' | 'progress' | 'personalRating';
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<UserLibraryResponse> => {
  const params = new URLSearchParams();
  
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.status) params.append('status', options.status);
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);

  const queryString = params.toString();
  const url = `/user-library${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiRequest(url);
  
  if (!response.ok) {
    throw new ApiError('Failed to fetch library', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

/**
 * Get currently reading books
 */
export const getCurrentlyReading = async (): Promise<UserLibraryEntry[]> => {
  const response = await apiRequest('/user-library/reading');
  
  if (!response.ok) {
    throw new ApiError('Failed to fetch reading list', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

/**
 * Get user's reading stats
 */
export const getReadingStats = async (): Promise<ReadingStats> => {
  const response = await apiRequest('/user-library/stats');
  
  if (!response.ok) {
    throw new ApiError('Failed to fetch reading stats', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

/**
 * Check if a book is in user's library
 */
export const checkBookInLibrary = async (bookId: string): Promise<{ inLibrary: boolean; entry: UserLibraryEntry | null }> => {
  const response = await apiRequest(`/user-library/${bookId}/check`);
  
  if (!response.ok) {
    throw new ApiError('Failed to check library', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

/**
 * Start reading a book
 */
export const startReading = async (bookId: string): Promise<UserLibraryEntry> => {
  const response = await apiRequest(`/user-library/${bookId}/start`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError('Book not found', { status: 404 });
    }
    throw new ApiError('Failed to start reading', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

/**
 * Add book to want-to-read list
 */
export const addToWantToRead = async (bookId: string): Promise<UserLibraryEntry> => {
  const response = await apiRequest(`/user-library/${bookId}/want-to-read`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError('Book not found', { status: 404 });
    }
    throw new ApiError('Failed to add to reading list', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

/**
 * Update reading progress
 */
export const updateProgress = async (bookId: string, currentPage: number): Promise<UserLibraryEntry> => {
  const response = await apiRequest(`/user-library/${bookId}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ currentPage }),
  });
  
  if (!response.ok) {
    throw new ApiError('Failed to update progress', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

/**
 * Mark book as complete
 */
export const markComplete = async (bookId: string): Promise<UserLibraryEntry> => {
  const response = await apiRequest(`/user-library/${bookId}/complete`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new ApiError('Failed to mark as complete', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

/**
 * Update book status
 */
export const updateBookStatus = async (bookId: string, status: ReadingStatus): Promise<UserLibraryEntry> => {
  const response = await apiRequest(`/user-library/${bookId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  
  if (!response.ok) {
    throw new ApiError('Failed to update status', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

/**
 * Rate a book
 */
export const rateBook = async (bookId: string, rating: number): Promise<UserLibraryEntry> => {
  const response = await apiRequest(`/user-library/${bookId}/rate`, {
    method: 'PUT',
    body: JSON.stringify({ rating }),
  });
  
  if (!response.ok) {
    throw new ApiError('Failed to rate book', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

/**
 * Update notes for a book
 */
export const updateNotes = async (bookId: string, notes: string): Promise<UserLibraryEntry> => {
  const response = await apiRequest(`/user-library/${bookId}/notes`, {
    method: 'PUT',
    body: JSON.stringify({ notes }),
  });
  
  if (!response.ok) {
    throw new ApiError('Failed to update notes', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};

/**
 * Remove book from library
 */
export const removeFromLibrary = async (bookId: string): Promise<void> => {
  const response = await apiRequest(`/user-library/${bookId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new ApiError('Failed to remove book', { status: response.status });
  }
};

// ============================================
// Book Upload & Review API
// ============================================

/**
 * Upload a new book
 * Returns the book details including status and whether it was immediately published
 */
export const uploadBook = async (data: {
  title: string;
  author?: string;
  description?: string;
  category?: string;
  subject?: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  publicId?: string; // Cloudinary public ID for cover generation
}): Promise<{ id: string; title: string; status: string; coverImageUrl: string; fileUrl: string; isPublished: boolean }> => {
  const response = await apiRequest('/books/upload', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new ApiError(errorData.message || 'Failed to upload book', { status: response.status });
  }
  
  const result = await response.json();
  return result.data;
};

/**
 * Download a book (tracks download count)
 */
export const downloadBook = async (bookId: string): Promise<{ downloadUrl: string; fileName: string }> => {
  const response = await apiRequest(`/books/${bookId}/download`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new ApiError('Failed to download book', { status: response.status });
  }
  
  const result = await response.json();
  return result.data;
};

/**
 * Add a review to a book
 */
export const addBookReview = async (
  bookId: string,
  data: { rating: number; reviewText?: string }
): Promise<BookReview> => {
  const response = await apiRequest(`/books/${bookId}/review`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new ApiError('Failed to add review', { status: response.status });
  }
  
  const result = await response.json();
  return result.data;
};

/**
 * Get reviews for a book
 */
export const getBookReviews = async (
  bookId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ reviews: BookReview[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  const response = await apiRequest(`/books/${bookId}/reviews?${params}`);
  
  if (!response.ok) {
    throw new ApiError('Failed to fetch reviews', { status: response.status });
  }
  
  const result = await response.json();
  return result.data;
};

/**
 * Get all categories with formatting
 */
export const getCategoriesFormatted = async (): Promise<BookCategory[]> => {
  const response = await apiRequest('/books/categories/all');
  
  if (!response.ok) {
    throw new ApiError('Failed to fetch categories', { status: response.status });
  }
  
  const result = await response.json();
  return result.data;
};

// ============================================
// Admin API
// ============================================

/**
 * Get pending books for approval (admin only)
 */
export const getPendingBooks = async (
  page: number = 1,
  limit: number = 20
): Promise<{ count: number; books: Book[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  const response = await apiRequest(`/books/admin/pending?${params}`);
  
  if (!response.ok) {
    throw new ApiError('Failed to fetch pending books', { status: response.status });
  }
  
  const result = await response.json();
  return result.data;
};

/**
 * Approve a book (admin only)
 */
export const approveBook = async (bookId: string): Promise<Book> => {
  const response = await apiRequest(`/books/admin/${bookId}/approve`, {
    method: 'PUT',
  });
  
  if (!response.ok) {
    throw new ApiError('Failed to approve book', { status: response.status });
  }
  
  const result = await response.json();
  return result.data;
};

/**
 * Reject a book (admin only)
 */
export const rejectBook = async (bookId: string, reason?: string): Promise<Book> => {
  const response = await apiRequest(`/books/admin/${bookId}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
  
  if (!response.ok) {
    throw new ApiError('Failed to reject book', { status: response.status });
  }
  
  const result = await response.json();
  return result.data;
};

// ============================================
// User Uploads API
// ============================================

/**
 * Get user's uploaded books (to track upload status)
 * Returns all books uploaded by the authenticated user
 */
export const getMyUploads = async (options: {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'published';
} = {}): Promise<BooksResponse> => {
  const params = new URLSearchParams();
  
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.status) params.append('status', options.status);

  const queryString = params.toString();
  const url = `/books/my-uploads${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiRequest(url);
  
  if (!response.ok) {
    throw new ApiError('Failed to fetch uploads', { status: response.status });
  }
  
  const data = await response.json();
  return data.data;
};
