/**
 * MyUploadsPanel Component
 * 
 * Displays the user's uploaded books with status tracking.
 * Users can see their pending, published, approved, and rejected uploads.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  BookOpen,
  Loader2,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookCard } from './BookCard';
import { getMyUploads } from '@/utils/libraryApi';
import { useAuth } from '@/context/AuthContext';
import type { Book, BookStatus } from '@/types';

// Status configuration for display
const statusConfig: Record<BookStatus, { icon: React.ElementType; color: string; bg: string; label: string; description: string }> = {
  pending: { 
    icon: Clock, 
    color: 'text-yellow-500', 
    bg: 'bg-yellow-500/10', 
    label: 'Pending Review',
    description: 'Awaiting admin approval'
  },
  approved: { 
    icon: CheckCircle2, 
    color: 'text-green-500', 
    bg: 'bg-green-500/10', 
    label: 'Approved',
    description: 'Book has been approved'
  },
  published: { 
    icon: CheckCircle2, 
    color: 'text-blue-500', 
    bg: 'bg-blue-500/10', 
    label: 'Published',
    description: 'Visible in the library'
  },
  rejected: { 
    icon: XCircle, 
    color: 'text-red-500', 
    bg: 'bg-red-500/10', 
    label: 'Rejected',
    description: 'Book was not approved'
  },
};

// Summary card for upload status
function StatusSummaryCard({ status, count }: { status: BookStatus; count: number }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={`border-border ${config.bg}/50`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs text-muted-foreground">{config.label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty state component
function NoUploads({ onUploadClick }: { onUploadClick?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center bg-card/50 rounded-2xl border border-dashed border-border"
    >
      <div className="p-4 rounded-2xl bg-secondary/50 mb-4">
        <Upload className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">No uploads yet</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-4">
        You haven't uploaded any books yet. Share your knowledge with the community!
      </p>
      {onUploadClick && (
        <Button onClick={onUploadClick} className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Your First Book
        </Button>
      )}
    </motion.div>
  );
}

interface MyUploadsPanelProps {
  onUploadClick?: () => void;
}

export function MyUploadsPanel({ onUploadClick }: MyUploadsPanelProps) {
  const { user } = useAuth();
  
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BookStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Summary counts
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    approved: 0,
    published: 0,
    rejected: 0,
  });

  // Load uploads
  const loadUploads = useCallback(async (refresh = false) => {
    if (!user?.uid) return;

    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const response = await getMyUploads({
        page,
        limit: 8,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      setBooks(response.books);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);

      // Calculate status counts from all uploads (not filtered)
      if (statusFilter === 'all' && page === 1) {
        const counts = {
          pending: 0,
          approved: 0,
          published: 0,
          rejected: 0,
        };
        response.books.forEach((book) => {
          if (book.status && book.status in counts) {
            counts[book.status as keyof typeof counts]++;
          }
        });
        // This is a simple estimate - ideally we'd fetch counts from a separate endpoint
        // For now, we use the total and assume proportional distribution if filtered
        if (statusFilter === 'all') {
          setStatusCounts(counts);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load uploads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid, page, statusFilter]);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  // Handle refresh
  const handleRefresh = () => {
    loadUploads(true);
  };

  // Handle book click (could open detail view)
  const handleBookClick = (book: Book) => {
    // For now, just log - could open a modal or navigate
    console.log('Book clicked:', book._id);
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Uploads</h2>
            <p className="text-muted-foreground">Loading your uploads...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-secondary/50 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 bg-secondary/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Upload className="w-6 h-6 text-primary" />
            My Uploads
          </h2>
          <p className="text-muted-foreground">
            Track the status of your uploaded books
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
          
          {onUploadClick && (
            <Button onClick={onUploadClick} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload New
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={() => loadUploads()}>
            Try Again
          </Button>
        </div>
      )}

      {/* Status summary cards */}
      {total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatusSummaryCard status="pending" count={statusCounts.pending} />
          <StatusSummaryCard status="approved" count={statusCounts.approved} />
          <StatusSummaryCard status="published" count={statusCounts.published} />
          <StatusSummaryCard status="rejected" count={statusCounts.rejected} />
        </div>
      )}

      {/* Filter */}
      {total > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by status:</span>
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as BookStatus | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <span className="text-sm text-muted-foreground ml-auto">
            Showing {books.length} of {total}
          </span>
        </div>
      )}

      {/* Books grid or empty state */}
      {books.length === 0 ? (
        <NoUploads onUploadClick={onUploadClick} />
      ) : (
        <>
          <motion.div
            key={`${statusFilter}-${page}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Info card for rejected books */}
      {books.some(b => b.status === 'rejected') && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Some uploads were rejected</p>
              <p className="text-xs text-muted-foreground mt-1">
                You can check the rejection reason by clicking on the book. Common reasons include: 
                inappropriate content, copyright issues, or quality concerns.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MyUploadsPanel;
