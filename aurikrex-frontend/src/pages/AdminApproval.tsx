/**
 * Admin Approval Page
 * 
 * Allows administrators to view and approve/reject pending book uploads.
 * Features:
 * - List of pending books with details
 * - Approve/reject actions with confirmation
 * - Real-time status updates
 * - Pagination for large lists
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  FileText,
  User,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getPendingBooks, approveBook, rejectBook } from '@/utils/libraryApi';
import type { Book } from '@/types';

// Loading skeleton for pending books
function PendingBooksSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-secondary/50 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// Empty state component
function EmptyPendingBooks() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-full bg-green-500/10 mb-4">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </div>
      <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
      <p className="text-muted-foreground max-w-sm">
        There are no pending books waiting for approval. New uploads will appear here.
      </p>
    </div>
  );
}

// Pending book card component
interface PendingBookCardProps {
  book: Book;
  onApprove: (book: Book) => void;
  onReject: (book: Book) => void;
  isProcessing: boolean;
}

function PendingBookCard({ book, onApprove, onReject, isProcessing }: PendingBookCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Cover Image */}
            <div className="flex-shrink-0 w-24 h-32 rounded-lg overflow-hidden bg-secondary">
              {book.coverImageUrl ? (
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Book Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1">{book.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    by {book.author || 'Unknown'}
                  </p>
                </div>
                <Badge variant="outline" className="uppercase flex-shrink-0">
                  {book.fileType || 'PDF'}
                </Badge>
              </div>

              {book.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {book.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Uploaded by: {book.uploadedBy || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(book.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {formatFileSize(book.fileSize)}
                </span>
                {book.subject && (
                  <Badge variant="secondary" className="text-xs">
                    {book.subject}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={() => onApprove(book)}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(book)}
                disabled={isProcessing}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
              {book.pdfUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Main Admin Approval component
export function AdminApproval() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Rejection dialog state
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    book: Book | null;
    reason: string;
    loading: boolean;
  }>({
    open: false,
    book: null,
    reason: '',
    loading: false
  });

  // Check if user is admin (UI/UX only - backend enforces actual authorization)
  // NOTE: This client-side check is only for user experience (redirecting non-admins).
  // The actual security is enforced by the backend API which verifies JWT tokens
  // and user roles before allowing any admin operations.
  useEffect(() => {
    const storedUser = localStorage.getItem('aurikrex-user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role !== 'admin') {
          navigate('/');
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
            variant: 'destructive'
          });
        }
      } catch {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate, toast]);

  // Load pending books
  const loadPendingBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getPendingBooks(page, 10);
      setBooks(response.books);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.count);
    } catch (err) {
      console.error('Failed to load pending books:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pending books');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadPendingBooks();
  }, [loadPendingBooks]);

  // Handle approve
  const handleApprove = async (book: Book) => {
    if (!book._id) return;
    
    setProcessingId(book._id);
    try {
      await approveBook(book._id);
      
      toast({
        title: 'Book Approved',
        description: `"${book.title}" has been approved and is now visible in the library.`,
      });
      
      // Remove from list
      setBooks(prev => prev.filter(b => b._id !== book._id));
      setTotalCount(prev => prev - 1);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve book',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject
  const handleReject = (book: Book) => {
    setRejectDialog({
      open: true,
      book,
      reason: '',
      loading: false
    });
  };

  const confirmReject = async () => {
    if (!rejectDialog.book?._id) return;
    
    setRejectDialog(prev => ({ ...prev, loading: true }));
    try {
      await rejectBook(rejectDialog.book._id, rejectDialog.reason || undefined);
      
      toast({
        title: 'Book Rejected',
        description: `"${rejectDialog.book.title}" has been rejected.`,
      });
      
      // Remove from list
      setBooks(prev => prev.filter(b => b._id !== rejectDialog.book?._id));
      setTotalCount(prev => prev - 1);
      
      setRejectDialog({ open: false, book: null, reason: '', loading: false });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject book',
        variant: 'destructive'
      });
      setRejectDialog(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Admin Approval</h1>
                <p className="text-muted-foreground">
                  Review and approve pending book uploads
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {totalCount} Pending
              </Badge>
              <Button
                variant="outline"
                size="icon"
                onClick={loadPendingBooks}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Pending Book Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <PendingBooksSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-destructive/10 mb-4">
                  <AlertCircle className="w-12 h-12 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Failed to load</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadPendingBooks} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : books.length === 0 ? (
              <EmptyPendingBooks />
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {books.map(book => (
                    <PendingBookCard
                      key={book._id}
                      book={book}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      isProcessing={processingId === book._id}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rejection Dialog */}
      <Dialog 
        open={rejectDialog.open} 
        onOpenChange={(open) => !rejectDialog.loading && setRejectDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject "{rejectDialog.book?.title}"? 
              You can optionally provide a reason which will be shared with the uploader.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection (optional)"
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
              rows={3}
              disabled={rejectDialog.loading}
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, book: null, reason: '', loading: false })}
              disabled={rejectDialog.loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectDialog.loading}
            >
              {rejectDialog.loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Book
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminApproval;
