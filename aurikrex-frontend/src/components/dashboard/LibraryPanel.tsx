/**
 * Library Panel Component
 * 
 * Displays books available for students to read with search, filter, and progress tracking.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  BookOpen,
  Search,
  Filter,
  Star,
  Clock,
  CheckCircle,
  BookMarked,
  Play,
  Bookmark,
  X,
  ChevronRight,
  FileText,
  Users,
  Calendar,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import {
  getBooks,
  getCategories,
  getUserLibrary,
  getReadingStats,
  startReading,
  addToWantToRead,
  updateProgress,
  markComplete,
  removeFromLibrary,
  checkBookInLibrary,
} from '@/utils/libraryApi';
import type { Book, UserLibraryEntry, ReadingStats, BookDifficulty, ReadingStatus } from '@/types';

// ============================================
// Sub-components
// ============================================

// Loading skeleton
function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
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
      className="flex flex-col items-center justify-center py-12 px-6 text-center bg-card/50 rounded-2xl border border-border"
    >
      <div className="p-4 rounded-2xl bg-secondary/50 mb-4">
        <BookOpen className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">No books found</h3>
      <p className="text-muted-foreground text-sm max-w-sm">{message}</p>
    </motion.div>
  );
}

// Difficulty badge
function DifficultyBadge({ difficulty }: { difficulty: BookDifficulty }) {
  const config = {
    beginner: { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Beginner' },
    intermediate: { color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Intermediate' },
    advanced: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Advanced' },
  };
  const c = config[difficulty];
  return (
    <Badge variant="outline" className={`${c.color} ${c.bg} text-xs`}>
      {c.label}
    </Badge>
  );
}

// Rating stars
function RatingStars({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${star <= Math.round(rating) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {rating.toFixed(1)} {count !== undefined && `(${count})`}
      </span>
    </div>
  );
}

// Book card
function BookCard({
  book,
  libraryEntry,
  onClick,
  onStartReading,
  onAddToList,
}: {
  book: Book;
  libraryEntry?: UserLibraryEntry | null;
  onClick: () => void;
  onStartReading: () => void;
  onAddToList: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={!shouldReduceMotion ? { y: -4, scale: 1.02 } : {}}
      className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer group transition-shadow hover:shadow-lg"
      onClick={onClick}
    >
      {/* Cover Image */}
      <div className="relative aspect-[3/4] bg-secondary/50 overflow-hidden">
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Progress overlay */}
        {libraryEntry && libraryEntry.status === 'reading' && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="flex items-center gap-2 text-white text-xs mb-1">
              <Play className="w-3 h-3" />
              <span>{libraryEntry.progress}% complete</span>
            </div>
            <Progress value={libraryEntry.progress} className="h-1 bg-white/20" />
          </div>
        )}
        
        {/* Status badge */}
        {libraryEntry && (
          <div className="absolute top-2 right-2">
            {libraryEntry.status === 'completed' && (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Read
              </Badge>
            )}
            {libraryEntry.status === 'reading' && (
              <Badge className="bg-blue-500 text-white">
                <Play className="w-3 h-3 mr-1" />
                Reading
              </Badge>
            )}
            {libraryEntry.status === 'want-to-read' && (
              <Badge className="bg-purple-500 text-white">
                <Bookmark className="w-3 h-3 mr-1" />
                Listed
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{book.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
        
        <div className="flex items-center justify-between">
          <RatingStars rating={book.rating} count={book.reviewCount} />
          <DifficultyBadge difficulty={book.difficulty} />
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {book.category.slice(0, 2).map((cat) => (
            <Badge key={cat} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
          {book.category.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{book.category.length - 2}
            </Badge>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          {!libraryEntry || libraryEntry.status === 'want-to-read' ? (
            <button
              onClick={onStartReading}
              className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
            >
              <Play className="w-3 h-3" />
              Start Reading
            </button>
          ) : libraryEntry.status === 'reading' ? (
            <button
              onClick={onStartReading}
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
            >
              <Play className="w-3 h-3" />
              Continue
            </button>
          ) : (
            <button
              onClick={onStartReading}
              className="flex-1 px-3 py-2 bg-secondary text-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Read Again
            </button>
          )}
          
          {!libraryEntry && (
            <button
              onClick={onAddToList}
              className="px-3 py-2 bg-secondary text-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors"
              title="Add to reading list"
            >
              <Bookmark className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Book detail modal
function BookDetailModal({
  book,
  libraryEntry,
  onClose,
  onStartReading,
  onAddToList,
  onMarkComplete,
  onRemove,
  onUpdateProgress,
}: {
  book: Book;
  libraryEntry?: UserLibraryEntry | null;
  onClose: () => void;
  onStartReading: () => void;
  onAddToList: () => void;
  onMarkComplete: () => void;
  onRemove: () => void;
  onUpdateProgress: (page: number) => void;
}) {
  const [currentPage, setCurrentPage] = useState(libraryEntry?.currentPage || 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-semibold">Book Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-6 flex-col sm:flex-row">
            {/* Cover */}
            <div className="w-full sm:w-48 flex-shrink-0">
              <div className="aspect-[3/4] bg-secondary rounded-xl overflow-hidden">
                {book.coverImageUrl ? (
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-xl font-bold">{book.title}</h1>
                <p className="text-muted-foreground">{book.author}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <RatingStars rating={book.rating} count={book.reviewCount} />
                <DifficultyBadge difficulty={book.difficulty} />
              </div>

              <div className="flex flex-wrap gap-2">
                {book.category.map((cat) => (
                  <Badge key={cat} variant="secondary">{cat}</Badge>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">{book.description}</p>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span>{book.pages} pages</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{book.yearPublished}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span>{book.fileSize} MB</span>
                </div>
                {book.targetAudience && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{book.targetAudience}</span>
                  </div>
                )}
              </div>

              {/* Concepts */}
              {book.concepts && book.concepts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Key Concepts</h4>
                  <div className="flex flex-wrap gap-1">
                    {book.concepts.map((concept) => (
                      <Badge key={concept} variant="outline" className="text-xs">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reading progress section */}
          {libraryEntry && libraryEntry.status === 'reading' && (
            <div className="mt-6 p-4 rounded-xl bg-secondary/50">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Play className="w-4 h-4" />
                Your Progress
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Page {currentPage} of {book.pages}</span>
                  <span>{Math.round((currentPage / book.pages) * 100)}%</span>
                </div>
                <Progress value={(currentPage / book.pages) * 100} className="h-2" />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={book.pages}
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Math.min(book.pages, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-20 px-2 py-1 text-sm rounded-lg border border-border bg-background"
                  />
                  <button
                    onClick={() => onUpdateProgress(currentPage)}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            {!libraryEntry ? (
              <>
                <button
                  onClick={onStartReading}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Reading
                </button>
                <button
                  onClick={onAddToList}
                  className="px-4 py-2 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                >
                  <Bookmark className="w-4 h-4" />
                  Add to List
                </button>
              </>
            ) : libraryEntry.status === 'want-to-read' ? (
              <>
                <button
                  onClick={onStartReading}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Reading
                </button>
                <button
                  onClick={onRemove}
                  className="px-4 py-2 bg-destructive/10 text-destructive rounded-xl font-medium hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              </>
            ) : libraryEntry.status === 'reading' ? (
              <>
                {book.pdfUrl && (
                  <a
                    href={book.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Open Book
                  </a>
                )}
                <button
                  onClick={onMarkComplete}
                  className="px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Complete
                </button>
              </>
            ) : (
              <>
                {book.pdfUrl && (
                  <a
                    href={book.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Read Again
                  </a>
                )}
                <button
                  onClick={onRemove}
                  className="px-4 py-2 bg-destructive/10 text-destructive rounded-xl font-medium hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Stats cards
function StatsCards({ stats }: { stats: ReadingStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Play className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.reading}</p>
              <p className="text-xs text-muted-foreground">Currently Reading</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Bookmark className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.wantToRead}</p>
              <p className="text-xs text-muted-foreground">Want to Read</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <FileText className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalPagesRead.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Pages Read</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function LibraryPanel() {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  
  // State
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [userLibrary, setUserLibrary] = useState<Map<string, UserLibraryEntry>>(new Map());
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<BookDifficulty | 'all'>('all');
  const [selectedTab, setSelectedTab] = useState<'all' | ReadingStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'popular' | 'title'>('newest');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [booksRes, categoriesRes, libraryRes, statsRes] = await Promise.all([
        getBooks({
          page,
          limit: 12,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
          search: searchQuery || undefined,
          sortBy,
        }),
        getCategories(),
        getUserLibrary({ limit: 100 }),
        getReadingStats(),
      ]);

      setBooks(booksRes.books);
      setTotalPages(booksRes.pagination.totalPages);
      setCategories(categoriesRes);
      
      // Build library map for quick lookup
      const libraryMap = new Map<string, UserLibraryEntry>();
      libraryRes.entries.forEach((entry) => {
        libraryMap.set(entry.bookId, entry);
      });
      setUserLibrary(libraryMap);
      setStats(statsRes);
    } catch (error) {
      console.error('Error fetching library data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, page, selectedCategory, selectedDifficulty, searchQuery, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get filtered books based on selected tab
  const getDisplayedBooks = useCallback(() => {
    if (selectedTab === 'all') return books;
    
    // Filter books that are in user's library with the selected status
    return books.filter((book) => {
      const entry = userLibrary.get(book._id);
      return entry && entry.status === selectedTab;
    });
  }, [books, userLibrary, selectedTab]);

  // Handlers
  const handleStartReading = async (bookId: string) => {
    try {
      const entry = await startReading(bookId);
      setUserLibrary((prev) => {
        const newMap = new Map(prev);
        newMap.set(bookId, entry);
        return newMap;
      });
      setStats((prev) => prev ? {
        ...prev,
        reading: prev.reading + 1,
        totalBooks: prev.totalBooks + (userLibrary.has(bookId) ? 0 : 1),
      } : null);
    } catch (error) {
      console.error('Error starting reading:', error);
    }
  };

  const handleAddToList = async (bookId: string) => {
    try {
      const entry = await addToWantToRead(bookId);
      setUserLibrary((prev) => {
        const newMap = new Map(prev);
        newMap.set(bookId, entry);
        return newMap;
      });
      setStats((prev) => prev ? {
        ...prev,
        wantToRead: prev.wantToRead + 1,
        totalBooks: prev.totalBooks + 1,
      } : null);
    } catch (error) {
      console.error('Error adding to list:', error);
    }
  };

  const handleMarkComplete = async (bookId: string) => {
    try {
      const entry = await markComplete(bookId);
      setUserLibrary((prev) => {
        const newMap = new Map(prev);
        newMap.set(bookId, entry);
        return newMap;
      });
      setStats((prev) => prev ? {
        ...prev,
        reading: prev.reading - 1,
        completed: prev.completed + 1,
      } : null);
    } catch (error) {
      console.error('Error marking complete:', error);
    }
  };

  const handleRemove = async (bookId: string) => {
    try {
      const existingEntry = userLibrary.get(bookId);
      await removeFromLibrary(bookId);
      setUserLibrary((prev) => {
        const newMap = new Map(prev);
        newMap.delete(bookId);
        return newMap;
      });
      setStats((prev) => {
        if (!prev || !existingEntry) return prev;
        return {
          ...prev,
          totalBooks: prev.totalBooks - 1,
          reading: existingEntry.status === 'reading' ? prev.reading - 1 : prev.reading,
          completed: existingEntry.status === 'completed' ? prev.completed - 1 : prev.completed,
          wantToRead: existingEntry.status === 'want-to-read' ? prev.wantToRead - 1 : prev.wantToRead,
        };
      });
      setSelectedBook(null);
    } catch (error) {
      console.error('Error removing from library:', error);
    }
  };

  const handleUpdateProgress = async (bookId: string, currentPage: number) => {
    try {
      const entry = await updateProgress(bookId, currentPage);
      setUserLibrary((prev) => {
        const newMap = new Map(prev);
        newMap.set(bookId, entry);
        return newMap;
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const displayedBooks = getDisplayedBooks();

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookMarked className="w-7 h-7 text-primary" />
            Library
          </h1>
          <p className="text-muted-foreground text-sm">
            Discover and track your reading progress
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && <StatsCards stats={stats} />}

      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search books by title or author..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Category filter */}
            <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Difficulty filter */}
            <Select value={selectedDifficulty} onValueChange={(v) => { setSelectedDifficulty(v as BookDifficulty | 'all'); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v as typeof sortBy); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status tabs */}
          <div className="flex flex-wrap gap-2 mt-4">
            {(['all', 'reading', 'want-to-read', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-foreground hover:bg-secondary'
                }`}
              >
                {tab === 'all' && 'All Books'}
                {tab === 'reading' && `Reading (${stats?.reading || 0})`}
                {tab === 'want-to-read' && `Want to Read (${stats?.wantToRead || 0})`}
                {tab === 'completed' && `Completed (${stats?.completed || 0})`}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Books grid */}
      {loading ? (
        <LibrarySkeleton />
      ) : displayedBooks.length === 0 ? (
        <EmptyLibrary
          message={
            selectedTab !== 'all'
              ? `You don't have any books in your "${selectedTab}" list yet.`
              : searchQuery
              ? `No books found matching "${searchQuery}".`
              : 'No books available at the moment.'
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedBooks.map((book) => (
              <BookCard
                key={book._id}
                book={book}
                libraryEntry={userLibrary.get(book._id)}
                onClick={() => setSelectedBook(book)}
                onStartReading={() => handleStartReading(book._id)}
                onAddToList={() => handleAddToList(book._id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-secondary text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80 transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg bg-secondary text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Book detail modal */}
      <AnimatePresence>
        {selectedBook && (
          <BookDetailModal
            book={selectedBook}
            libraryEntry={userLibrary.get(selectedBook._id)}
            onClose={() => setSelectedBook(null)}
            onStartReading={() => handleStartReading(selectedBook._id)}
            onAddToList={() => handleAddToList(selectedBook._id)}
            onMarkComplete={() => handleMarkComplete(selectedBook._id)}
            onRemove={() => handleRemove(selectedBook._id)}
            onUpdateProgress={(page) => handleUpdateProgress(selectedBook._id, page)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
