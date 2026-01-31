/**
 * Library Page
 * 
 * Standalone page for browsing the book library with search, filter, and sort functionality.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { BookCard } from '@/components/library/BookCard';
import { BookSearch, type BookFilters } from '@/components/library/BookSearch';
import { Card } from '@/components/ui/card';
import { getBooks, getCategoriesFormatted } from '@/utils/libraryApi';
import type { Book, BookCategory } from '@/types';

// Loading skeleton
function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-secondary/50 rounded-xl h-80" />
      ))}
    </div>
  );
}

// Empty state
function EmptyLibrary({ message }: { message: string }) {
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
      <p className="text-muted-foreground text-sm max-w-sm">{message}</p>
    </motion.div>
  );
}

export function Library() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [filters, setFilters] = useState<BookFilters>({
    search: '',
    category: '',
    difficulty: '',
    subject: '',
    sortBy: 'newest',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategoriesFormatted();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Load books when filters or page change
  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);

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
    } catch (error) {
      console.error('Failed to load books:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Reset page when filters change
  const handleFiltersChange = (newFilters: BookFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Handle book click - book detail page can be implemented later
  const handleBookClick = (book: Book) => {
    // TODO: Navigate to book detail page when implemented
    // For now, log the book for debugging
    console.log('Selected book:', book._id, book.title);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">📚 Learning Library</h1>
          </div>
          <p className="text-muted-foreground">
            Discover books, notes, slides, and materials from our community
          </p>
        </motion.div>

        {/* Search & Filters */}
        <BookSearch
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories.length > 0 ? categories : undefined}
        />

        {/* Results Count */}
        {!loading && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {books.length} of {total} books
          </div>
        )}

        {/* Books Grid */}
        <div className="min-h-[400px]">
          {loading ? (
            <LibrarySkeleton />
          ) : books.length === 0 ? (
            <EmptyLibrary
              message={
                filters.search || filters.category || filters.difficulty || filters.subject
                  ? "No books match your filters. Try adjusting your search criteria."
                  : "The library is empty. Be the first to upload a book!"
              }
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

        {/* Pagination */}
        {!loading && totalPages > 1 && (
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
    </div>
  );
}

export default Library;
