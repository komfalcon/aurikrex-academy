/**
 * Admin Dashboard Page
 * 
 * Comprehensive admin dashboard with:
 * - Overview statistics (users, books, questions, system health)
 * - User management (list, deactivate/reactivate, view analytics)
 * - Book management (pending + published, approve/reject)
 * - Responsive design with Tailwind animations
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  Activity,
  Shield,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserX,
  UserCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Home,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Server,
  Database,
  Cpu,
  MemoryStick,
  Calendar,
  User,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  getAdminStats,
  getAdminUsers,
  getAdminBooks,
  deactivateUser,
  reactivateUser,
  getUserAnalyticsSummary,
  verifyAdminAccess,
  type AdminStats,
  type AdminUser,
  type AdminBook,
  type UserAnalyticsSummary,
} from '@/utils/adminApi';
import { approveBook, rejectBook } from '@/utils/libraryApi';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Stats Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendValue,
  color = 'blue',
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    red: 'bg-red-500/10 text-red-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <motion.div variants={fadeInUp}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
              <Icon className="w-6 h-6" />
            </div>
            {trend && (
              <div className={`flex items-center gap-1 text-sm ${
                trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {trend === 'up' && <TrendingUp className="w-4 h-4" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4" />}
                {trendValue}
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-2">{description}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// User Row Component
function UserRow({
  user,
  onDeactivate,
  onReactivate,
  onViewAnalytics,
  isProcessing,
}: {
  user: AdminUser;
  onDeactivate: (user: AdminUser) => void;
  onReactivate: (user: AdminUser) => void;
  onViewAnalytics: (user: AdminUser) => void;
  isProcessing: boolean;
}) {
  return (
    <motion.tr
      variants={fadeInUp}
      className="border-b hover:bg-muted/50 transition-colors"
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || user.email}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
          )}
          <div>
            <p className="font-medium">{user.displayName || 'No name'}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <Badge variant={user.role === 'admin' ? 'default' : user.role === 'instructor' ? 'secondary' : 'outline'}>
          {user.role}
        </Badge>
      </td>
      <td className="py-4 px-4">
        <Badge variant={user.disabled ? 'destructive' : 'default'} className={!user.disabled ? 'bg-green-500' : ''}>
          {user.disabled ? 'Disabled' : 'Active'}
        </Badge>
      </td>
      <td className="py-4 px-4 text-sm text-muted-foreground">
        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewAnalytics(user)}
            disabled={isProcessing}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {user.disabled ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReactivate(user)}
              disabled={isProcessing}
              className="text-green-500 hover:text-green-600"
            >
              <UserCheck className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDeactivate(user)}
              disabled={isProcessing || user.role === 'admin'}
              className="text-red-500 hover:text-red-600"
            >
              <UserX className="w-4 h-4" />
            </Button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

// Book Row Component
function BookRow({
  book,
  onApprove,
  onReject,
  isProcessing,
}: {
  book: AdminBook;
  onApprove: (book: AdminBook) => void;
  onReject: (book: AdminBook) => void;
  isProcessing: boolean;
}) {
  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    approved: 'bg-green-500/10 text-green-500 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    published: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  return (
    <motion.tr
      variants={fadeInUp}
      className="border-b hover:bg-muted/50 transition-colors"
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          {book.coverImageUrl ? (
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className="w-12 h-16 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-16 rounded bg-secondary flex items-center justify-center">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium line-clamp-1">{book.title}</p>
            <p className="text-sm text-muted-foreground">by {book.author || 'Unknown'}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <Badge className={statusColors[book.status] || ''}>
          {book.status}
        </Badge>
      </td>
      <td className="py-4 px-4 text-sm">
        <Badge variant="outline" className="uppercase">
          {book.fileType || 'PDF'}
        </Badge>
      </td>
      <td className="py-4 px-4 text-sm text-muted-foreground">
        {new Date(book.createdAt).toLocaleDateString()}
      </td>
      <td className="py-4 px-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {book.views || 0}
          </span>
          <span className="flex items-center gap-1">
            ⭐ {book.rating.toFixed(1)}
          </span>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          {book.pdfUrl && (
            <Button size="sm" variant="ghost" asChild>
              <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4" />
              </a>
            </Button>
          )}
          {book.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onApprove(book)}
                disabled={isProcessing}
                className="text-green-500 hover:text-green-600"
              >
                <CheckCircle2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onReject(book)}
                disabled={isProcessing}
                className="text-red-500 hover:text-red-600"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

// No Admin Access Component
function NoAdminAccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="p-6 rounded-full bg-red-500/10 mx-auto w-fit mb-6">
          <Shield className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8">
          You do not have admin access. This area is restricted to administrators only.
          If you believe this is an error, please contact the system administrator.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate('/dashboard')} className="gap-2">
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/login')} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Main Admin Dashboard Component
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  // Books state
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [bookPage, setBookPage] = useState(1);
  const [bookTotalPages, setBookTotalPages] = useState(0);
  const [bookSearch, setBookSearch] = useState('');
  const [bookStatusFilter, setBookStatusFilter] = useState<string>('all');
  const [processingBookId, setProcessingBookId] = useState<string | null>(null);

  // User analytics dialog
  const [analyticsDialog, setAnalyticsDialog] = useState<{
    open: boolean;
    user: AdminUser | null;
    data: UserAnalyticsSummary | null;
    loading: boolean;
  }>({
    open: false,
    user: null,
    data: null,
    loading: false,
  });

  // Rejection dialog
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    book: AdminBook | null;
    reason: string;
    loading: boolean;
  }>({
    open: false,
    book: null,
    reason: '',
    loading: false,
  });

  // Verify admin access on mount
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const result = await verifyAdminAccess();
        setIsAdmin(result.isAdmin);
        
        if (result.isAdmin) {
          // Load initial data
          const statsData = await getAdminStats();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error verifying admin access:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  // Load users when tab changes or filters change
  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const result = await getAdminUsers({
        page: userPage,
        limit: 10,
        role: userRoleFilter !== 'all' ? userRoleFilter as 'student' | 'instructor' | 'admin' : undefined,
        disabled: userStatusFilter !== 'all' ? userStatusFilter === 'disabled' : undefined,
        search: userSearch || undefined,
      });
      setUsers(result.users);
      setUserTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setUsersLoading(false);
    }
  }, [userPage, userRoleFilter, userStatusFilter, userSearch, toast]);

  // Load books when tab changes or filters change
  const loadBooks = useCallback(async () => {
    try {
      setBooksLoading(true);
      const result = await getAdminBooks({
        page: bookPage,
        limit: 10,
        status: bookStatusFilter !== 'all' ? bookStatusFilter as 'pending' | 'approved' | 'rejected' | 'published' : undefined,
        search: bookSearch || undefined,
        sortBy: 'newest',
        sortOrder: 'desc',
      });
      setBooks(result.books);
      setBookTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error('Error loading books:', error);
      toast({
        title: 'Error',
        description: 'Failed to load books',
        variant: 'destructive',
      });
    } finally {
      setBooksLoading(false);
    }
  }, [bookPage, bookStatusFilter, bookSearch, toast]);

  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      loadUsers();
    }
  }, [isAdmin, activeTab, loadUsers]);

  useEffect(() => {
    if (isAdmin && activeTab === 'books') {
      loadBooks();
    }
  }, [isAdmin, activeTab, loadBooks]);

  // Handlers
  const handleRefreshStats = async () => {
    try {
      setLoading(true);
      const statsData = await getAdminStats();
      setStats(statsData);
      toast({
        title: 'Refreshed',
        description: 'Dashboard statistics updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateUser = async (userToDeactivate: AdminUser) => {
    try {
      setProcessingUserId(userToDeactivate._id);
      await deactivateUser(userToDeactivate._id);
      setUsers(prev => prev.map(u => 
        u._id === userToDeactivate._id ? { ...u, disabled: true } : u
      ));
      toast({
        title: 'User Deactivated',
        description: `${userToDeactivate.email} has been deactivated`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to deactivate user',
        variant: 'destructive',
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReactivateUser = async (userToReactivate: AdminUser) => {
    try {
      setProcessingUserId(userToReactivate._id);
      await reactivateUser(userToReactivate._id);
      setUsers(prev => prev.map(u => 
        u._id === userToReactivate._id ? { ...u, disabled: false } : u
      ));
      toast({
        title: 'User Reactivated',
        description: `${userToReactivate.email} has been reactivated`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reactivate user',
        variant: 'destructive',
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleViewUserAnalytics = async (userToView: AdminUser) => {
    setAnalyticsDialog({ open: true, user: userToView, data: null, loading: true });
    try {
      const data = await getUserAnalyticsSummary(userToView._id);
      setAnalyticsDialog(prev => ({ ...prev, data, loading: false }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load user analytics',
        variant: 'destructive',
      });
      setAnalyticsDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleApproveBook = async (book: AdminBook) => {
    try {
      setProcessingBookId(book._id);
      await approveBook(book._id);
      setBooks(prev => prev.map(b => 
        b._id === book._id ? { ...b, status: 'approved' } : b
      ));
      toast({
        title: 'Book Approved',
        description: `"${book.title}" has been approved`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve book',
        variant: 'destructive',
      });
    } finally {
      setProcessingBookId(null);
    }
  };

  const handleRejectBook = (book: AdminBook) => {
    setRejectDialog({ open: true, book, reason: '', loading: false });
  };

  const confirmRejectBook = async () => {
    if (!rejectDialog.book) return;
    
    setRejectDialog(prev => ({ ...prev, loading: true }));
    try {
      await rejectBook(rejectDialog.book._id, rejectDialog.reason || undefined);
      setBooks(prev => prev.map(b => 
        b._id === rejectDialog.book?._id ? { ...b, status: 'rejected' } : b
      ));
      toast({
        title: 'Book Rejected',
        description: `"${rejectDialog.book.title}" has been rejected`,
      });
      setRejectDialog({ open: false, book: null, reason: '', loading: false });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject book',
        variant: 'destructive',
      });
      setRejectDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return <NoAdminAccess />;
  }

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed left-0 top-0 h-full w-64 bg-card border-r z-40 lg:z-0"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">Admin Panel</h1>
                  <p className="text-xs text-muted-foreground">Aurikrex Academy</p>
                </div>
              </div>

              <nav className="space-y-2">
                {[
                  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                  { id: 'users', label: 'Users', icon: Users },
                  { id: 'books', label: 'Books', icon: BookOpen },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user?.displayName || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate('/dashboard')}
                >
                  <Home className="w-4 h-4 mr-1" />
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="lg:ml-64 p-6 pt-16 lg:pt-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'books' && 'Book Management'}
              </h1>
              <p className="text-muted-foreground">
                {activeTab === 'overview' && 'Monitor your platform at a glance'}
                {activeTab === 'users' && 'Manage user accounts and permissions'}
                {activeTab === 'books' && 'Review and manage book uploads'}
              </p>
            </div>
            {activeTab === 'overview' && (
              <Button onClick={handleRefreshStats} variant="outline" className="gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </motion.div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <motion.div
              variants={staggerChildren}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Main Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Users"
                  value={stats.users.total}
                  icon={Users}
                  description={`${stats.users.active} active, ${stats.users.inactive} inactive`}
                  color="blue"
                />
                <StatCard
                  title="Total Books"
                  value={stats.books.total}
                  icon={BookOpen}
                  description={`${stats.books.pending} pending approval`}
                  color="purple"
                />
                <StatCard
                  title="Questions Asked"
                  value={stats.questions.total}
                  icon={MessageSquare}
                  description={`${stats.questions.sessions} chat sessions`}
                  color="green"
                />
                <StatCard
                  title="Active Users (30d)"
                  value={stats.users.active}
                  icon={Activity}
                  description={`${((stats.users.active / stats.users.total) * 100).toFixed(1)}% engagement`}
                  color="yellow"
                />
              </div>

              {/* Books Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <motion.div variants={fadeInUp}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Book Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            Pending
                          </span>
                          <span className="font-semibold">{stats.books.pending}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            Approved
                          </span>
                          <span className="font-semibold">{stats.books.approved}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            Rejected
                          </span>
                          <span className="font-semibold">{stats.books.rejected}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* System Health */}
                <motion.div variants={fadeInUp} className="lg:col-span-2">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Server className="w-5 h-5" />
                        System Health
                      </CardTitle>
                      <CardDescription>Server and database status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                          <Database className="w-5 h-5 text-green-500 mb-2" />
                          <p className="text-sm font-medium">Database</p>
                          <p className="text-xs text-green-500 capitalize">{stats.systemHealth.database}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <Clock className="w-5 h-5 text-blue-500 mb-2" />
                          <p className="text-sm font-medium">Uptime</p>
                          <p className="text-xs text-blue-500">{formatUptime(stats.systemHealth.uptime)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <MemoryStick className="w-5 h-5 text-purple-500 mb-2" />
                          <p className="text-sm font-medium">Heap Used</p>
                          <p className="text-xs text-purple-500">{formatBytes(stats.systemHealth.memoryUsage.heapUsed)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <Cpu className="w-5 h-5 text-yellow-500 mb-2" />
                          <p className="text-sm font-medium">Node.js</p>
                          <p className="text-xs text-yellow-500">{stats.systemHealth.nodeVersion}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          value={userSearch}
                          onChange={(e) => {
                            setUserSearch(e.target.value);
                            setUserPage(1);
                          }}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={userRoleFilter} onValueChange={(v) => { setUserRoleFilter(v); setUserPage(1); }}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={userStatusFilter} onValueChange={(v) => { setUserStatusFilter(v); setUserPage(1); }}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={loadUsers} variant="outline" disabled={usersLoading}>
                      <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Users Table */}
              <Card>
                <CardContent className="p-0">
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Users className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No users found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium">User</th>
                            <th className="text-left py-3 px-4 font-medium">Role</th>
                            <th className="text-left py-3 px-4 font-medium">Status</th>
                            <th className="text-left py-3 px-4 font-medium">Last Login</th>
                            <th className="text-left py-3 px-4 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <motion.tbody variants={staggerChildren} initial="initial" animate="animate">
                          {users.map((u) => (
                            <UserRow
                              key={u._id}
                              user={u}
                              onDeactivate={handleDeactivateUser}
                              onReactivate={handleReactivateUser}
                              onViewAnalytics={handleViewUserAnalytics}
                              isProcessing={processingUserId === u._id}
                            />
                          ))}
                        </motion.tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pagination */}
              {userTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                    disabled={userPage === 1 || usersLoading}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {userPage} of {userTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))}
                    disabled={userPage === userTotalPages || usersLoading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Books Tab */}
          {activeTab === 'books' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search books..."
                          value={bookSearch}
                          onChange={(e) => {
                            setBookSearch(e.target.value);
                            setBookPage(1);
                          }}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={bookStatusFilter} onValueChange={(v) => { setBookStatusFilter(v); setBookPage(1); }}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={loadBooks} variant="outline" disabled={booksLoading}>
                      <RefreshCw className={`w-4 h-4 ${booksLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Books Table */}
              <Card>
                <CardContent className="p-0">
                  {booksLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : books.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No books found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium">Book</th>
                            <th className="text-left py-3 px-4 font-medium">Status</th>
                            <th className="text-left py-3 px-4 font-medium">Type</th>
                            <th className="text-left py-3 px-4 font-medium">Uploaded</th>
                            <th className="text-left py-3 px-4 font-medium">Stats</th>
                            <th className="text-left py-3 px-4 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <motion.tbody variants={staggerChildren} initial="initial" animate="animate">
                          {books.map((book) => (
                            <BookRow
                              key={book._id}
                              book={book}
                              onApprove={handleApproveBook}
                              onReject={handleRejectBook}
                              isProcessing={processingBookId === book._id}
                            />
                          ))}
                        </motion.tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pagination */}
              {bookTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setBookPage(p => Math.max(1, p - 1))}
                    disabled={bookPage === 1 || booksLoading}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {bookPage} of {bookTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setBookPage(p => Math.min(bookTotalPages, p + 1))}
                    disabled={bookPage === bookTotalPages || booksLoading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* User Analytics Dialog */}
      <Dialog open={analyticsDialog.open} onOpenChange={(open) => setAnalyticsDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Analytics</DialogTitle>
            <DialogDescription>
              {analyticsDialog.user?.displayName || analyticsDialog.user?.email}
            </DialogDescription>
          </DialogHeader>
          
          {analyticsDialog.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : analyticsDialog.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Chat Sessions</p>
                  <p className="text-2xl font-bold">{analyticsDialog.data.chatHistory.totalSessions}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold">{analyticsDialog.data.chatHistory.totalMessages}</p>
                </div>
              </div>
              {analyticsDialog.data.activity && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Growth Score</p>
                    <p className="text-2xl font-bold">{analyticsDialog.data.activity.growthScore}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Engagement</p>
                    <p className="text-2xl font-bold capitalize">{analyticsDialog.data.activity.engagementTrend}</p>
                  </div>
                </div>
              )}
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-2">Sessions by Page</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analyticsDialog.data.chatHistory.sessionsByPage).map(([page, count]) => (
                    <Badge key={page} variant="secondary">
                      {page}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No analytics data available
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => !rejectDialog.loading && setRejectDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject "{rejectDialog.book?.title}"?
              You can optionally provide a reason.
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
              onClick={confirmRejectBook}
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
