/**
 * Library Page
 * 
 * Rebuilt from scratch to guarantee upload button visibility and proper
 * integration with the backend file upload API.
 * 
 * Features:
 * - Prominent upload button always visible in the header
 * - Search, filter, and sort functionality  
 * - Pagination for book browsing
 * - Error handling for uploads and confirmations for success
 * - Clear loading states and empty state messaging
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Plus,
  Upload,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { BookCard } from '@/components/library/BookCard';
import { BookSearch, type BookFilters } from '@/components/library/BookSearch';
import { UploadBookModal } from '@/components/library/UploadBookModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getBooks, getCategoriesFormatted } from '@/utils/libraryApi';
import { useAuth } from '@/context/AuthContext';
import type { Book, BookCategory } from '@/types';

// ============================================
// Loading Skeleton Component
// ============================================
function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-secondary/50 rounded-xl h-80" />
      ))}
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================
function EmptyLibrary({ 
  message, 
  onUploadClick,
  showUploadButton = true 
}: { 
  message: string;
  onUploadClick?: () => void;
  showUploadButton?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center bg-card/50 rounded-2xl border border-border"
    >
      <div className="p-4 rounded-2xl bg-secondary/50 mb-4">
        <BookOpen className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">No books found</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-4">{message}</p>
      {showUploadButton && onUploadClick && (
        <Button onClick={onUploadClick} className="gap-2">
          <Upload className="w-4 h-4" />
          Be the first to upload
        </Button>
      )}
    </motion.div>
  );
}

// ============================================
// Error State Component
// ============================================
function LibraryError({ 
  message, 
  onRetry 
}: { 
  message: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center bg-destructive/5 rounded-2xl border border-destructive/20"
    >
      <div className="p-4 rounded-2xl bg-destructive/10 mb-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
      </div>
      <h3 className="font-semibold text-lg mb-2 text-destructive">Failed to load books</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-4">{message}</p>
      <Button onClick={onRetry} variant="outline" className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
    </motion.div>
  );
}

// ============================================
// Main Library Component
// ============================================
export function Library() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for books and pagination
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  
  // State for filters
  const [filters, setFilters] = useState<BookFilters>({
    search: '',
    category: '',
    difficulty: '',
    subject: '',
    sortBy: 'newest',
  });
  
  // Upload modal state - explicit boolean for guaranteed visibility control
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // ============================================
  // Load categories on mount
  // ============================================
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategoriesFormatted();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
        // Non-critical error, don't show to user
      }
    };
    loadCategories();
  }, []);

  // ============================================
  // Load books when filters or page change
  // ============================================
  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Map sortBy to API format
      let sortBy: 'title' | 'rating' | 'newest' | 'popular' | undefined;
      let sortOrder: 'asc' | 'desc' | undefined = 'desc';
      
      switch (filters.sortBy) {
        case 'newest':
          sortBy = 'newest';
          break;
        case 'popular':
        case 'downloads':
          sortBy = 'popular';
          break;
        case 'rated':
          sortBy = 'rating';
          break;
        case 'title':
          sortBy = 'title';
          sortOrder = 'asc';
          break;
      }

      const response = await getBooks({
        page,
        limit: 12,
        search: filters.search || undefined,
        category: filters.category || undefined,
        difficulty: filters.difficulty || undefined,
        sortBy,
        sortOrder,
      });

      setBooks(response.books || []);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      console.error('Failed to load books:', err);
      setError(err instanceof Error ? err.message : 'Failed to load books. Please try again.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // ============================================
  // Event Handlers
  // ============================================
  
  // Reset page when filters change
  const handleFiltersChange = (newFilters: BookFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Handle book click - book detail page can be implemented later
  const handleBookClick = (_book: Book) => {
    // TODO: Navigate to book detail page when implemented
  };

  // Handle upload button click
  const handleUploadClick = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to upload books to the library.',
        variant: 'destructive',
      });
      return;
    }
    setIsUploadModalOpen(true);
  };

  // Handle upload success
  const handleUploadSuccess = () => {
    toast({
      title: 'Upload successful!',
      description: 'Your book has been submitted and is awaiting approval.',
    });
    // Refresh the books list
    loadBooks();
  };

  // ============================================
  // Render
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ============================================ */}
        {/* Header with Upload Button - GUARANTEED VISIBLE */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">📚 Learning Library</h1>
            </div>
            
            {/* Upload Button - ALWAYS RENDERED */}
            <Button 
              onClick={handleUploadClick}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
              data-testid="upload-book-button"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Upload Book</span>
            </Button>
          </div>
          <p className="text-muted-foreground">
            Discover books, notes, slides, and materials from our community
          </p>
        </motion.div>

        {/* ============================================ */}
        {/* Search & Filters */}
        {/* ============================================ */}
        <BookSearch
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories.length > 0 ? categories : undefined}
        />

        {/* ============================================ */}
        {/* Results Count */}
        {/* ============================================ */}
        {!loading && !error && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {books.length} of {total} books
          </div>
        )}

        {/* ============================================ */}
        {/* Books Grid / Loading / Error / Empty States */}
        {/* ============================================ */}
        <div className="min-h-[400px]">
          {loading ? (
            <LibrarySkeleton />
          ) : error ? (
            <LibraryError 
              message={error}
              onRetry={loadBooks}
            />
          ) : books.length === 0 ? (
            <EmptyLibrary
              message={
                filters.search || filters.category || filters.difficulty || filters.subject
                  ? "No books match your filters. Try adjusting your search criteria."
                  : "The library is empty. Be the first to upload a book!"
              }
              onUploadClick={handleUploadClick}
              showUploadButton={!filters.search && !filters.category && !filters.difficulty && !filters.subject}
            />
          ) : (
            <motion.div
              key={page}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {books.map((book) => (
                <BookCard
                  key={book._id}
                  book={book}
                  onClick={handleBookClick}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* ============================================ */}
        {/* Pagination */}
        {/* ============================================ */}
        {!loading && !error && totalPages > 1 && (
          <Card className="mt-8 p-4 flex items-center justify-between bg-card/80 backdrop-blur-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg transition-colors ${
                      page === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </Card>
        )}
      </div>

      {/* ============================================ */}
      {/* Upload Book Modal */}
      {/* ============================================ */}
      <UploadBookModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}

export default Library;
