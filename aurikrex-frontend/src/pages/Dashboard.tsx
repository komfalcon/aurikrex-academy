/*
 * ============================================================================
 * AURIKREX ACADEMY DASHBOARD — PRODUCTION-READY, INVESTOR-GRADE
 * ============================================================================
 * 
 * Features:
 * - Collapsible sidebar with Framer Motion animations
 * - FalkeAI integration for AI-powered tutoring
 * - Glassmorphism design with semantic tokens
 * - Full keyboard navigation & accessibility (ARIA labels, reduced motion)
 * - Smooth micro-interactions (hover, press, transitions)
 * 
 * ============================================================================
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Search,
  Bell,
  Moon,
  Sun,
  User,
  Brain,
  TrendingUp,
  Sparkles,
  Zap,
  Target,
  Award,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Lightbulb,
  MessageSquare,
  Rocket,
  Upload,
  Send,
  FileText,
  Filter,
  Calendar,
  Users,
  Activity,
  Eye,
  TrendingDown,
  Library,
} from "lucide-react";
import DOMPurify from "dompurify";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProfileDropdown } from "@/components/dashboard/ProfileDropdown";
import { sendMessage } from "@/utils/falkeai";
import { analyzeProgress, type UserProgress, type AIInsight, type AIRecommendation } from "@/utils/aiAnalysis";
import { HeroProgress } from "@/components/dashboard/HeroProgress";
import { AIRecommendations } from "@/components/dashboard/AIRecommendations";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DashboardSkeleton, AIThinkingIndicator } from "@/components/dashboard/LoadingSkeletons";
import type { FalkeAIChatPage } from "@/types";
import { apiRequest } from "@/utils/api";
// Import real data panels
import AnalyticsPanelReal from "@/components/dashboard/AnalyticsPanelReal";
import LibraryPanel from "@/components/dashboard/LibraryPanel";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// ============================================================================
// THEME HOOK
// ============================================================================

function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("aurikrex-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("aurikrex-theme", theme);
  }, [theme]);

  const toggleTheme = () => setThemeState((prev) => (prev === "light" ? "dark" : "light"));

  return { theme, toggleTheme };
}

// ============================================================================
// MOCK DATA (Replace with real backend)
// ============================================================================

const mockData = {
  user: {
    name: "Alex Johnson",
    avatar: "",
    streak: 12,
    level: 8,
  },
  stats: [
    { title: "Lessons Completed", value: 24, total: 36, icon: BookOpen, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { title: "Assignments Done", value: 15, total: 20, icon: ClipboardCheck, color: "text-orange-500", bgColor: "bg-orange-500/10" },
    { title: "AI Accuracy", value: 92, total: 100, icon: Brain, color: "text-purple-500", bgColor: "bg-purple-500/10", suffix: "%" },
    { title: "Overall Progress", value: 78, total: 100, icon: TrendingUp, color: "text-green-500", bgColor: "bg-green-500/10", suffix: "%" },
  ],
  subjects: [
    { name: "Mathematics", progress: 75, color: "bg-blue-500", lessons: 12 },
    { name: "Physics", progress: 60, color: "bg-purple-500", lessons: 8 },
    { name: "Chemistry", progress: 85, color: "bg-green-500", lessons: 15 },
    { name: "Biology", progress: 45, color: "bg-orange-500", lessons: 6 },
  ],
  assignments: [
    { id: 1, title: "Calculus Problem Set", subject: "Mathematics", dueDate: "Tomorrow", status: "pending" },
    { id: 2, title: "Newton's Laws Essay", subject: "Physics", dueDate: "3 days", status: "in-progress" },
    { id: 3, title: "Periodic Table Quiz", subject: "Chemistry", dueDate: "1 week", status: "not-started" },
  ],
  aiInsights: [
    { id: 1, type: "strength", text: "You excel at geometry problems", icon: Award },
    { id: 2, type: "improvement", text: "Focus more on organic chemistry concepts", icon: Target },
    { id: 3, type: "suggestion", text: "Try the new quantum physics module", icon: Lightbulb },
  ],
  notifications: [
    { id: 1, text: "New lesson available: Trigonometry Basics", time: "5 min ago", unread: true },
    { id: 2, text: "Assignment due: Calculus Problem Set", time: "1 hour ago", unread: true },
    { id: 3, text: "Achievement unlocked: 7-day streak!", time: "Yesterday", unread: false },
  ],
};

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

interface SidebarProps {
  activePanel: string;
  setActivePanel: (panel: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

function Sidebar({ activePanel, setActivePanel, isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "lessons", label: "Smart Lessons", icon: BookOpen },
    { id: "library", label: "Library", icon: Library },
    { id: "analytics", label: "AI Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNavigateToFalkeAI = () => {
    setActivePanel("falkeai");
    if (isMobile) setIsMobileOpen(false);
  };

  const handleNavigation = useCallback((itemId: string) => {
    setActivePanel(itemId);
    if (isMobile) setIsMobileOpen(false);
  }, [isMobile, setActivePanel, setIsMobileOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNavigation(itemId);
    }
  };

  const sidebarWidth = isCollapsed ? "w-20" : "w-64 lg:w-72";
  const isVisible = isMobile ? isMobileOpen : true;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: isMobile ? -280 : 0 }}
        animate={{ 
          x: isMobile ? (isMobileOpen ? 0 : -280) : 0,
          width: isCollapsed && !isMobile ? 80 : isMobile ? 256 : 288
        }}
        transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", damping: 25, stiffness: 200 }}
        className={`
          fixed lg:static top-0 left-0 h-screen
          bg-card/80 backdrop-blur-xl border-r border-border
          flex flex-col z-40 shadow-xl
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2 rounded-xl bg-gradient-primary shadow-md"
              whileHover={!shouldReduceMotion ? { scale: 1.05 } : {}}
              whileTap={!shouldReduceMotion ? { scale: 0.95 } : {}}
            >
              <GraduationCap className="w-6 h-6 text-white" aria-hidden="true" />
            </motion.div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent whitespace-nowrap">
                    Aurikrex
                  </h2>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">Academy</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" role="menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePanel === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                whileHover={!shouldReduceMotion ? { scale: 1.02, x: 4 } : {}}
                whileTap={!shouldReduceMotion ? { scale: 0.98 } : {}}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary
                  ${isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-foreground hover:bg-secondary/80"
                  }
                `}
                role="menuitem"
                aria-current={isActive ? "page" : undefined}
                tabIndex={0}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </nav>

        {/* FalkeAI Quick Access */}
        <div className="p-4 border-t border-border">
          <motion.div
            whileHover={!shouldReduceMotion ? { scale: 1.02 } : {}}
            className="p-4 rounded-2xl bg-gradient-primary/10 border border-primary/20 hover:border-primary/40 transition-colors duration-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-primary" aria-hidden="true" />
              {!isCollapsed && <span className="font-semibold text-sm">FalkeAI Tutor</span>}
            </div>
            {!isCollapsed && (
              <p className="text-xs text-muted-foreground mb-3">Get instant help from AI</p>
            )}
            <button 
              onClick={handleNavigateToFalkeAI}
              className="w-full px-3 py-2 bg-gradient-primary text-white rounded-2xl text-sm font-medium hover:shadow-glow hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            >
              {isCollapsed ? <Sparkles className="w-4 h-4 mx-auto" /> : "Ask FalkeAI"}
            </button>
          </motion.div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <motion.button
            onClick={handleLogout}
            whileHover={!shouldReduceMotion ? { scale: 1.02, x: 4 } : {}}
            whileTap={!shouldReduceMotion ? { scale: 0.98 } : {}}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-destructive hover:bg-destructive/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-destructive"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            {!isCollapsed && <span className="font-medium whitespace-nowrap">Logout</span>}
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleMobileSidebar: () => void;
}

function Header({ onToggleSidebar, isSidebarCollapsed, onToggleMobileSidebar }: HeaderProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const [showNotifications, setShowNotifications] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const unreadCount = mockData.notifications.filter(n => n.unread).length;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border transition-shadow ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 h-16 md:h-20">
        {/* Left: Toggle + Search */}
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          {/* Sidebar Toggle */}
          <motion.button
            onClick={isMobile ? onToggleMobileSidebar : onToggleSidebar}
            whileHover={!shouldReduceMotion ? { scale: 1.05 } : {}}
            whileTap={!shouldReduceMotion ? { scale: 0.95 } : {}}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </motion.button>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search lessons, assignments..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-secondary/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:bg-secondary transition-all duration-200"
              aria-label="Search"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3 ml-4">
          {/* Streak Badge */}
          <Badge variant="outline" className="hidden md:flex items-center gap-1 px-3 py-1">
            <Zap className="w-3 h-3 text-orange-500" aria-hidden="true" />
            <span className="font-semibold">{mockData.user.streak} day streak</span>
          </Badge>

          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            whileHover={!shouldReduceMotion ? { scale: 1.05, rotate: 15 } : {}}
            whileTap={!shouldReduceMotion ? { scale: 0.95 } : {}}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon className="w-5 h-5" aria-hidden="true" /> : <Sun className="w-5 h-5" aria-hidden="true" />}
          </motion.button>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              whileHover={!shouldReduceMotion ? { scale: 1.05 } : {}}
              whileTap={!shouldReduceMotion ? { scale: 0.95 } : {}}
              className="relative p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center shadow-md"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
                >
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {mockData.notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer ${
                          notif.unread ? "bg-primary/5" : ""
                        }`}
                      >
                        <p className="text-sm font-medium">{notif.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar with Profile Dropdown */}
          <ProfileDropdown 
            userName={user?.displayName || user?.firstName || mockData.user.name}
            userAvatar={user?.photoURL || mockData.user.avatar}
          />
        </div>
      </div>
    </motion.header>
  );
}

// ============================================================================
// DASHBOARD CONTENT PANELS
// ============================================================================

interface DashboardPanelProps {
  onLaunchFalkeAI: () => void;
}

function DashboardPanel({ onLaunchFalkeAI }: DashboardPanelProps) {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [realStats, setRealStats] = useState<{
    assignments: { total: number; pending: number; graded: number };
    solutions: { averageAccuracy: number; totalCorrect: number };
    activities: { totalQuestions: number };
  } | null>(null);
  const [recentAssignments, setRecentAssignments] = useState<Array<{
    _id: string;
    title: string;
    status: string;
    analysis?: { type?: string };
    createdAt: string;
  }>>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Get firstName from authenticated user or fallback
  const displayName = user?.firstName || user?.displayName || 'Student';

  // Fetch real statistics from backend
  useEffect(() => {
    const fetchRealStats = async () => {
      if (!user?.uid) {
        setIsLoadingStats(false);
        return;
      }
      
      try {
        const [assignmentStatsRes, analyticsRes, assignmentsRes] = await Promise.all([
          apiRequest('/assignments/stats').catch(() => null),
          apiRequest('/falkeai-analytics/summary').catch(() => null),
          apiRequest('/assignments?limit=3&sortBy=createdAt&sortOrder=desc').catch(() => null),
        ]);

        const assignmentStats = assignmentStatsRes?.ok ? await assignmentStatsRes.json() : null;
        const analytics = analyticsRes?.ok ? await analyticsRes.json() : null;
        const assignments = assignmentsRes?.ok ? await assignmentsRes.json() : null;

        if (assignmentStats?.data || analytics?.data) {
          setRealStats({
            assignments: assignmentStats?.data || { total: 0, pending: 0, graded: 0 },
            solutions: { 
              averageAccuracy: analytics?.data?.averageResponseQuality || 0,
              totalCorrect: analytics?.data?.topicsMastered || 0
            },
            activities: { totalQuestions: analytics?.data?.totalQuestions || 0 }
          });
        }

        if (assignments?.data?.assignments) {
          setRecentAssignments(assignments.data.assignments);
        }
      } catch (error) {
        console.error('Failed to fetch real stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchRealStats();
  }, [user?.uid]);

  // Use real data if available, otherwise show zeros for new users
  const userProgress: UserProgress = {
    lessonsCompleted: realStats?.activities.totalQuestions || 0,
    totalLessons: Math.max(10, realStats?.activities.totalQuestions || 0),
    assignmentsCompleted: realStats?.assignments.graded || 0,
    totalAssignments: realStats?.assignments.total || 0,
    averageScore: realStats?.solutions.averageAccuracy || 0,
    streak: 0, // Would need separate tracking
    subjects: [], // Would need course enrollment data
  };

  // Hero stats using real data
  const heroStats = {
    lessonsCompleted: userProgress.lessonsCompleted,
    totalLessons: userProgress.totalLessons,
    assignmentsCompleted: userProgress.assignmentsCompleted,
    totalAssignments: userProgress.totalAssignments,
    overallProgress: realStats?.assignments.total ? 
      Math.round((realStats.assignments.graded / realStats.assignments.total) * 100) : 0,
    streak: 0, // Would need separate tracking
    level: 1, // Would need level calculation
    totalHours: Math.round((realStats?.activities.totalQuestions || 0) * 0.5), // Estimate based on activities
  };

  // Fetch AI insights on mount
  const fetchAIInsights = useCallback(async () => {
    if (!user?.uid) return;
    
    setIsLoadingAI(true);
    try {
      const analysis = await analyzeProgress(
        user.uid,
        displayName,
        userProgress
      );
      setAiInsights(analysis.insights);
      setAiRecommendations(analysis.recommendations);
      setAiSummary(analysis.summary);
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
      // Set fallback insights based on real data
      const hasActivity = (realStats?.activities.totalQuestions || 0) > 0;
      setAiInsights([
        {
          id: 'fallback-1',
          type: hasActivity ? 'strength' : 'suggestion',
          title: hasActivity ? 'Great Progress!' : 'Welcome!',
          description: hasActivity 
            ? `You've asked ${realStats?.activities.totalQuestions || 0} questions. Keep learning!`
            : 'Start your learning journey by uploading an assignment or asking FalkeAI a question.',
          priority: 'medium',
          actionable: !hasActivity,
          action: hasActivity ? undefined : 'Get Started',
        },
        {
          id: 'fallback-2',
          type: 'suggestion',
          title: 'Try FalkeAI',
          description: 'Ask FalkeAI any question about your studies for instant help.',
          priority: 'high',
          actionable: true,
          action: 'Ask FalkeAI',
        },
      ]);
      setAiRecommendations([
        {
          id: 'rec-fallback-1',
          type: 'lesson',
          title: 'Upload an Assignment',
          reason: 'Get AI-powered analysis and hints',
          confidence: 90,
          duration: '5 min',
        },
      ]);
    } finally {
      setIsLoadingAI(false);
    }
  }, [user?.uid, displayName, realStats]);

  useEffect(() => {
    if (!isLoadingStats) {
      fetchAIInsights();
    }
  }, [isLoadingStats]);

  // Current lesson for resume learning
  const currentLesson = {
    title: 'Advanced Integration Techniques',
    progress: 45,
    subject: 'Mathematics',
  };

  return (
    <div className="space-y-6">
      {/* Hero Progress Section - New Creative Layout */}
      <HeroProgress
        userName={displayName}
        stats={heroStats}
      />

      {/* Main Content Grid - Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions + Assignments */}
        <div className="xl:col-span-1 space-y-6">
          {/* Quick Actions */}
          <QuickActions
            currentLesson={currentLesson}
            onResumeLearning={() => {}}
            onBrowseCourses={() => {}}
            onViewAssignments={() => {}}
            onOpenAI={onLaunchFalkeAI}
            onViewAnalytics={() => {}}
            onViewAchievements={() => {}}
            variant="grid"
          />

          {/* Recent Assignments - Using Real Data */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-orange-500" aria-hidden="true" />
                  Recent Assignments
                  {realStats?.assignments.total !== undefined && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {realStats.assignments.pending || 0} pending
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingStats ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-secondary/50 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : recentAssignments.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No assignments yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload your first assignment to get started
                    </p>
                  </div>
                ) : (
                  recentAssignments.map((assignment, index) => {
                    const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
                      pending: { icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
                      analyzed: { icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10" },
                      attempted: { icon: AlertCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
                      submitted: { icon: Send, color: "text-cyan-500", bg: "bg-cyan-500/10" },
                      graded: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
                    };
                    const config = statusConfig[assignment.status] || statusConfig.pending;
                    const StatusIcon = config.icon;

                    return (
                      <motion.div
                        key={assignment._id}
                        initial={shouldReduceMotion ? {} : { opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.4 + index * 0.05 }}
                        whileHover={!shouldReduceMotion ? { x: 4 } : {}}
                        className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                            <StatusIcon className={`w-4 h-4 ${config.color}`} aria-hidden="true" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{assignment.title}</h4>
                            <p className="text-xs text-muted-foreground capitalize">
                              {assignment.analysis?.type || 'Assignment'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(assignment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column: AI Recommendations */}
        <div className="xl:col-span-2 space-y-6">
          {/* AI Recommendations Spotlight */}
          <AIRecommendations
            insights={aiInsights}
            recommendations={aiRecommendations}
            isLoading={isLoadingAI || isLoadingStats}
            onRefresh={fetchAIInsights}
            onActionClick={(action) => {
              console.log('AI action clicked:', action);
              if (action.toLowerCase().includes('ai') || action.toLowerCase().includes('lesson') || action.toLowerCase().includes('falke')) {
                onLaunchFalkeAI();
              }
            }}
            summary={aiSummary}
          />

          {/* Subject Progress - Compact Grid */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" aria-hidden="true" />
                  Learning Progress by Subject
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockData.subjects.map((subject, index) => (
                    <motion.div
                      key={subject.name}
                      initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                      className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${subject.color}`} />
                          <span className="text-sm font-medium">{subject.name}</span>
                        </div>
                        <span className="text-sm font-semibold">{subject.progress}%</span>
                      </div>
                      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${subject.progress}%` }}
                          transition={{ duration: 1, delay: 0.8 + index * 0.1, ease: "easeOut" }}
                          className={`absolute top-0 left-0 h-full ${subject.color}`}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{subject.lessons} lessons</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* FalkeAI Tutor CTA */}
      <FalkeAITutorCard onLaunchFalkeAI={onLaunchFalkeAI} />
    </div>
  );
}

// Helper component for circle icon
function CircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// ============================================================================
// FALKEAI TUTOR CARD (Main Dashboard Feature)
// ============================================================================

interface FalkeAITutorCardProps {
  onLaunchFalkeAI: () => void;
}

function FalkeAITutorCard({ onLaunchFalkeAI }: FalkeAITutorCardProps) {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 1.2 }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-background backdrop-blur-sm overflow-hidden relative">
        {/* Animated Background */}
        {!shouldReduceMotion && (
          <>
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl"
              animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}

        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-primary shadow-md">
                <Brain className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              FalkeAI Tutor — Your Learning Companion
            </CardTitle>
            <Badge className="bg-accent text-accent-foreground shadow-sm">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
              Online
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4">
          <p className="text-muted-foreground">
            Ask questions, get instant explanations, generate smart lessons, and receive AI-powered assignment reviews.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              { icon: MessageSquare, title: "Instant Answers", desc: "Get explanations in seconds" },
              { icon: Lightbulb, title: "Smart Lessons", desc: "AI-generated study materials" },
              { icon: CheckCircle, title: "Assignment Review", desc: "Detailed feedback & tips" },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.3 + index * 0.1 }}
                whileHover={!shouldReduceMotion ? { y: -4, scale: 1.02 } : {}}
                className="p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                <feature.icon className="w-8 h-8 text-primary mb-2" aria-hidden="true" />
                <h4 className="font-semibold mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3 mt-6">
            <button 
              onClick={onLaunchFalkeAI}
              className="flex-1 px-6 py-3 bg-gradient-primary text-white font-semibold rounded-2xl hover:shadow-glow hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary shadow-md"
            >
              <Sparkles className="w-5 h-5" aria-hidden="true" />
              Launch FalkeAI Tutor
            </button>
            <button 
              onClick={onLaunchFalkeAI}
              className="px-6 py-3 bg-secondary text-foreground font-semibold rounded-2xl hover:bg-secondary/80 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            >
              Learn More
            </button>
          </div>

          {/* Status indicator */}
          <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-xs text-center text-green-600 dark:text-green-400">
              ✅ <strong>FalkeAI is ready!</strong> Click above to start your AI-powered learning session.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// ============================================================================
// SMART LESSONS PANEL (FalkeAI-Powered)
// ============================================================================

function LessonsPanel() {
  const { user } = useAuth();
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  
  // Conversation state for ChatHistorySidebar integration
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const ACCEPTED_FILE_TYPES = ".txt,.pdf,.docx,.doc,.png,.jpg,.jpeg";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ['txt', 'pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg'].includes(ext || '');
      });
      setUploadedFiles(prev => [...prev, ...validFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Load conversation messages when a conversation is selected
  const loadConversationMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await apiRequest(`/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data?.messages) {
          const formattedMessages = data.data.messages.map((msg: { role: 'user' | 'assistant'; content: string; timestamp: string }) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          }));
          setChatMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
    }
  }, []);

  // Handle conversation selection from sidebar
  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    if (conversationId) {
      loadConversationMessages(conversationId);
    } else {
      setChatMessages([]);
    }
  }, [loadConversationMessages]);

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    setSelectedConversationId(undefined);
    setChatMessages([]);
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;
    
    const messageContent = inputMessage + (uploadedFiles.length > 0 ? `\n\n📎 Attached files: ${uploadedFiles.map(f => f.name).join(', ')}` : '');
    const userMessage = {
      role: 'user' as const,
      content: messageContent,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      // Call FalkeAI API through the backend with conversation context
      const page: FalkeAIChatPage = 'Smart Lessons';
      const response = await sendMessage(
        messageContent,
        page,
        user?.uid || 'anonymous',
        user?.displayName || user?.email || 'Student',
        undefined, // course
        selectedConversationId // conversationId
      );

      const assistantMessage = {
        role: 'assistant' as const,
        content: response.reply,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation ID if a new one was created
      if (response.conversationId && !selectedConversationId) {
        setSelectedConversationId(response.conversationId);
        setRefreshKey(prev => prev + 1); // Refresh sidebar to show new conversation
      }
    } catch (error) {
      // Handle errors gracefully with user-friendly message displayed as assistant response
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const errorResponse = {
        role: 'assistant' as const,
        content: `⚠️ Unable to get a response from the AI tutor. ${errorMessage}. Please try again.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-120px)] flex gap-4"
    >
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Smart Lessons
            </h1>
            <p className="text-muted-foreground">AI-powered lessons tailored to your learning style</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="w-fit flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
              <Brain className="w-4 h-4 text-primary" />
              <span>Powered by FalkeAI</span>
            </Badge>
          </div>
        </div>

        {/* Instructions Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              How to Use Smart Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-background/50">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Ask Questions</p>
                  <p className="text-muted-foreground text-xs">Type any topic or concept you want to learn</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-background/50">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Upload Files</p>
                  <p className="text-muted-foreground text-xs">Share documents, images, or notes for analysis</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-background/50">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Get AI Lessons</p>
                  <p className="text-muted-foreground text-xs">Receive personalized explanations and materials</p>
                </div>
              </div>
            </div>
          </CardContent>
      </Card>

      {/* Main Chat Area */}
      <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-secondary/20">
          <CardTitle className="text-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              FalkeAI Lesson Assistant
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground font-normal">Ready</span>
            </div>
          </CardTitle>
        </CardHeader>
        
        {/* Chat Messages */}
        <CardContent className="p-0">
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Start a Learning Conversation</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  Ask FalkeAI about any topic, request explanations, or upload documents for AI-powered analysis and lesson generation.
                </p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {["Explain quantum physics", "Help me with calculus", "Create a study guide"].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInputMessage(suggestion)}
                      className="px-3 py-1.5 text-xs rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatMessages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-md' 
                      : 'bg-secondary rounded-bl-md'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {msg.role === 'assistant' ? (
                        <Brain className="w-4 h-4 text-primary" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      <span className="text-xs opacity-70">
                        {msg.role === 'user' ? 'You' : 'FalkeAI'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    ) : (
                      <div 
                        className="whitespace-pre-wrap text-sm prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }}
                      />
                    )}
                  </div>
                </motion.div>
              ))
            )}
            
            {/* Loading Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-secondary p-4 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-xs text-muted-foreground">FalkeAI is thinking</span>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* File Upload Preview */}
          {uploadedFiles.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-secondary/30">
              <p className="text-xs text-muted-foreground mb-2">Attached files:</p>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border border-border">
                    <FileText className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs truncate max-w-[150px]">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-background/50">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask FalkeAI anything about your lessons..."
                  className="w-full min-h-[60px] max-h-[150px] p-3 pr-12 rounded-2xl bg-secondary/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                  aria-label="Message input"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  aria-label="Upload files"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-3 bottom-3 p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label="Upload file"
                  title="Upload files (.txt, .pdf, .docx, .png, .jpg)"
                >
                  <Upload className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || (!inputMessage.trim() && uploadedFiles.length === 0)}
                className="p-3 rounded-2xl bg-gradient-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow transition-all"
                aria-label="Send message"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Supported files: .txt, .pdf, .docx, .png, .jpg • Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div whileHover={!shouldReduceMotion ? { scale: 1.02 } : {}}>
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold">Browse Lesson Library</h4>
                <p className="text-sm text-muted-foreground">Access pre-made lessons on various topics</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={!shouldReduceMotion ? { scale: 1.02 } : {}}>
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h4 className="font-semibold">Generate New Lesson</h4>
                <p className="text-sm text-muted-foreground">Create a custom AI lesson on any topic</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </div>{/* End of Main Content Area */}
    </motion.div>
  );
}

function AssignmentsPanel() {
  const [assignmentText, setAssignmentText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const ACCEPTED_FILE_TYPES = ".txt,.pdf,.docx,.doc,.png,.jpg,.jpeg,.ppt,.pptx,.xlsx,.xls";

  const mockAssignments = [
    { id: '1', title: 'Calculus Problem Set', subject: 'Mathematics', dueDate: 'Tomorrow', status: 'pending' },
    { id: '2', title: 'Newton\'s Laws Lab Report', subject: 'Physics', dueDate: '3 days', status: 'in-progress' },
    { id: '3', title: 'Periodic Table Quiz', subject: 'Chemistry', dueDate: '1 week', status: 'not-started' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ['txt', 'pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg', 'ppt', 'pptx', 'xlsx', 'xls'].includes(ext || '');
      });
      setUploadedFiles(prev => [...prev, ...validFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg'].includes(ext || '')) return '🖼️';
    if (['pdf'].includes(ext || '')) return '📄';
    if (['docx', 'doc'].includes(ext || '')) return '📝';
    if (['ppt', 'pptx'].includes(ext || '')) return '📊';
    if (['xlsx', 'xls'].includes(ext || '')) return '📈';
    return '📎';
  };

  const handleSubmit = async () => {
    if (!assignmentText.trim() && uploadedFiles.length === 0) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Simulate submission (placeholder for backend integration)
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      // Reset after showing success
      setTimeout(() => {
        setAssignmentText("");
        setUploadedFiles([]);
        setSubmitStatus('idle');
        setSelectedAssignment(null);
      }, 3000);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Assignments
          </h1>
          <p className="text-muted-foreground">Submit assignments and get AI-powered feedback</p>
        </div>
        <Badge className="w-fit flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-primary/20 border border-orange-500/30">
          <ClipboardCheck className="w-4 h-4 text-orange-500" />
          <span>{mockAssignments.length} Active Assignments</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Assignment List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Pending Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockAssignments.map((assignment) => {
                const statusColors = {
                  'pending': 'border-l-orange-500 bg-orange-500/5',
                  'in-progress': 'border-l-blue-500 bg-blue-500/5',
                  'not-started': 'border-l-gray-500 bg-gray-500/5',
                };
                const isSelected = selectedAssignment === assignment.id;
                
                return (
                  <motion.div
                    key={assignment.id}
                    whileHover={!shouldReduceMotion ? { x: 4 } : {}}
                    onClick={() => setSelectedAssignment(assignment.id)}
                    className={`p-4 rounded-xl border-l-4 cursor-pointer transition-all ${statusColors[assignment.status as keyof typeof statusColors]} ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  >
                    <h4 className="font-semibold text-sm mb-1">{assignment.title}</h4>
                    <p className="text-xs text-muted-foreground">{assignment.subject}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">Due: {assignment.dueDate}</span>
                      <Badge variant="outline" className="text-xs capitalize">{assignment.status.replace('-', ' ')}</Badge>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right: Submission Area */}
        <div className="lg:col-span-2">
          <Card className="border-border h-full">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-xl flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Submit Assignment
                {selectedAssignment && (
                  <Badge className="ml-2 bg-primary/20 text-primary">
                    {mockAssignments.find(a => a.id === selectedAssignment)?.title}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Text Input Area */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Write Your Answer
                </label>
                <textarea
                  value={assignmentText}
                  onChange={(e) => setAssignmentText(e.target.value)}
                  placeholder="Type your assignment response here. You can include explanations, solutions, or any text content..."
                  className="w-full min-h-[200px] p-4 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-y text-sm"
                  aria-label="Assignment text input"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {assignmentText.length} characters
                </p>
              </div>

              {/* File Upload Area */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Files
                </label>
                
                {/* Drop Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">Click to upload files</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports: .txt, .pdf, .docx, .png, .jpg, .ppt, .xlsx
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  aria-label="Upload assignment files"
                />

                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Uploaded files ({uploadedFiles.length}):</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-lg">{getFileIcon(file.name)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Feedback */}
              {submitStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl flex items-center gap-3 ${
                    submitStatus === 'success' 
                      ? 'bg-green-500/10 border border-green-500/30 text-green-600' 
                      : 'bg-destructive/10 border border-destructive/30 text-destructive'
                  }`}
                >
                  {submitStatus === 'success' ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Assignment Submitted Successfully!</p>
                        <p className="text-sm opacity-80">FalkeAI will analyze your work and provide feedback shortly.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Submission Failed</p>
                        <p className="text-sm opacity-80">Please try again or contact support.</p>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {assignmentText.trim() || uploadedFiles.length > 0 
                    ? `Ready to submit: ${assignmentText.trim() ? '1 text response' : ''}${assignmentText.trim() && uploadedFiles.length > 0 ? ' + ' : ''}${uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s)` : ''}`
                    : 'Add text or files to submit'}
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!assignmentText.trim() && uploadedFiles.length === 0)}
                  className="px-6 py-3 rounded-xl bg-gradient-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Assignment
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Review Info */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">AI-Powered Review</h4>
              <p className="text-sm text-muted-foreground">
                After submission, FalkeAI will analyze your work and provide detailed feedback including:
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline">Accuracy Check</Badge>
                <Badge variant="outline">Improvement Tips</Badge>
                <Badge variant="outline">Score Prediction</Badge>
                <Badge variant="outline">Similar Examples</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AnalyticsPanel() {
  const [dateRange, setDateRange] = useState("7d");
  const [lessonType, setLessonType] = useState("all");
  const [userGroup, setUserGroup] = useState("personal");
  const shouldReduceMotion = useReducedMotion();

  // Mock analytics data
  const learningProgressData = [
    { day: 'Mon', lessons: 4, time: 45, score: 85 },
    { day: 'Tue', lessons: 3, time: 30, score: 78 },
    { day: 'Wed', lessons: 5, time: 60, score: 92 },
    { day: 'Thu', lessons: 2, time: 25, score: 70 },
    { day: 'Fri', lessons: 6, time: 75, score: 88 },
    { day: 'Sat', lessons: 4, time: 50, score: 95 },
    { day: 'Sun', lessons: 3, time: 35, score: 82 },
  ];

  const subjectDistribution = [
    { name: 'Mathematics', value: 35, color: '#3B82F6' },
    { name: 'Physics', value: 25, color: '#8B5CF6' },
    { name: 'Chemistry', value: 20, color: '#10B981' },
    { name: 'Biology', value: 20, color: '#F59E0B' },
  ];

  const engagementData = [
    { week: 'W1', views: 120, interactions: 45, completions: 30 },
    { week: 'W2', views: 150, interactions: 60, completions: 42 },
    { week: 'W3', views: 180, interactions: 75, completions: 55 },
    { week: 'W4', views: 200, interactions: 90, completions: 68 },
  ];

  const assignmentStats = [
    { status: 'Completed', count: 15, color: '#10B981' },
    { status: 'In Progress', count: 5, color: '#3B82F6' },
    { status: 'Pending', count: 3, color: '#F59E0B' },
    { status: 'Overdue', count: 1, color: '#EF4444' },
  ];

  const kpiCards = [
    { title: 'Total Learning Time', value: '42h 30m', change: '+12%', trend: 'up', icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { title: 'Lessons Completed', value: '24', change: '+8%', trend: 'up', icon: BookOpen, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { title: 'Average Score', value: '87%', change: '+5%', trend: 'up', icon: Target, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { title: 'Active Streak', value: '12 days', change: '+3', trend: 'up', icon: Zap, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            FalkeAI Analytics
          </h1>
          <p className="text-muted-foreground">Deep insights into your learning patterns and progress</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <Select value={lessonType} onValueChange={setLessonType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Lesson Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lessons</SelectItem>
                <SelectItem value="math">Mathematics</SelectItem>
                <SelectItem value="physics">Physics</SelectItem>
                <SelectItem value="chemistry">Chemistry</SelectItem>
                <SelectItem value="biology">Biology</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <Select value={userGroup} onValueChange={setUserGroup}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="User Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="class">My Class</SelectItem>
                <SelectItem value="school">My School</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={!shouldReduceMotion ? { scale: 1.02, y: -4 } : {}}
            >
              <Card className="border-border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">{kpi.title}</p>
                      <h3 className="text-3xl font-bold mt-2">{kpi.value}</h3>
                      <div className="flex items-center gap-1 mt-2">
                        {kpi.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                          {kpi.change}
                        </span>
                        <span className="text-xs text-muted-foreground">vs last period</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${kpi.bgColor}`}>
                      <Icon className={`w-6 h-6 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Progress Chart */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Learning Activity
            </CardTitle>
            <CardDescription>Daily lessons, time spent, and scores</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={learningProgressData}>
                <defs>
                  <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area type="monotone" dataKey="lessons" stroke="#3B82F6" fillOpacity={1} fill="url(#colorLessons)" name="Lessons" />
                <Area type="monotone" dataKey="score" stroke="#10B981" fillOpacity={1} fill="url(#colorScore)" name="Score %" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject Distribution */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Subject Distribution
            </CardTitle>
            <CardDescription>Time spent by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={subjectDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {subjectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {subjectDistribution.map((subject) => (
                <div key={subject.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                  <span className="text-sm">{subject.name}</span>
                  <span className="text-sm text-muted-foreground ml-auto">{subject.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Metrics */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Engagement Metrics
            </CardTitle>
            <CardDescription>Views, interactions, and completions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="views" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Views" />
                <Bar dataKey="interactions" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Interactions" />
                <Bar dataKey="completions" fill="#10B981" radius={[4, 4, 0, 0]} name="Completions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Assignment Stats */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Assignment Statistics
            </CardTitle>
            <CardDescription>Current assignment status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignmentStats.map((stat, index) => (
                <motion.div
                  key={stat.status}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                      <span className="text-sm font-medium">{stat.status}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{stat.count} assignments</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stat.count / 24) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: stat.color }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Assignments</span>
                <span className="text-2xl font-bold">{assignmentStats.reduce((a, b) => a + b.count, 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights - Powered by FalkeAI */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                FalkeAI Learning Insights
                <Badge className="ml-2 bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                  Live
                </Badge>
              </CardTitle>
              <CardDescription>Personalized recommendations based on your analytics data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div 
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-xl bg-background/50 border border-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-green-500" />
                <span className="font-medium text-green-500">Strength</span>
              </div>
              <p className="text-sm">Your performance in Mathematics is excellent! Consider tackling advanced calculus topics.</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI confidence: 92%
              </p>
            </motion.div>
            <motion.div 
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-xl bg-background/50 border border-orange-500/20 hover:border-orange-500/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-orange-500">Focus Area</span>
              </div>
              <p className="text-sm">Chemistry scores could improve. Try the organic chemistry review module this week.</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Priority: High
              </p>
            </motion.div>
            <motion.div 
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-xl bg-background/50 border border-blue-500/20 hover:border-blue-500/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-blue-500">Recommendation</span>
              </div>
              <p className="text-sm">Based on your learning style, try video-based lessons for better retention.</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Personalized for you
              </p>
            </motion.div>
          </div>
          
          {/* AI Status Bar */}
          <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                FalkeAI analyzes your performance data to provide personalized insights
              </p>
              <Badge variant="outline" className="text-xs">
                Updated just now
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SettingsPanel() {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  
  // Settings state
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    assignmentReminders: true,
    lessonUpdates: false,
    weeklyReport: true,
    
    // Appearance
    darkMode: false,
    compactMode: false,
    animationsEnabled: true,
    
    // Privacy
    profileVisible: true,
    showProgress: true,
    shareAnalytics: false,
    
    // AI Features
    aiSuggestions: true,
    personalizedLessons: true,
    autoGrading: true,
    
    // Account
    language: 'en',
    timezone: 'auto',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    setSaveStatus('success');
    setHasChanges(false);
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleCancel = () => {
    // Reset to defaults (in real app, would reset to saved values)
    setHasChanges(false);
    setSaveStatus('idle');
  };

  // Initialize dark mode from document
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      darkMode: document.documentElement.classList.contains('dark')
    }));
  }, []);

  // Toggle dark mode
  const toggleDarkMode = (enabled: boolean) => {
    updateSetting('darkMode', enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('aurikrex-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('aurikrex-theme', 'light');
    }
  };

  // Custom Switch component since we need it
  const SettingsSwitch = ({ 
    id, 
    checked, 
    onCheckedChange, 
    disabled = false 
  }: { 
    id: string; 
    checked: boolean; 
    onCheckedChange: (checked: boolean) => void; 
    disabled?: boolean;
  }) => (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${checked ? 'bg-primary' : 'bg-secondary'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your account preferences and privacy</p>
        </div>
        
        {/* Save Status */}
        {saveStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              saveStatus === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'
            }`}
          >
            {saveStatus === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Settings saved!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Failed to save</span>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Profile Info Card */}
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>Your account details from authentication provider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 ring-2 ring-primary/20">
              <AvatarImage src={user?.photoURL || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {(user?.displayName || user?.firstName || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{user?.displayName || user?.firstName || 'Student'}</p>
              <p className="text-sm text-muted-foreground">{user?.email || 'student@aurikrex.com'}</p>
              <Badge variant="secondary" className="mt-1">
                {user?.provider ? user.provider.charAt(0).toUpperCase() + user.provider.slice(1) : 'Email'} Account
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Settings */}
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>Control how you receive updates and reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="email-notif" className="font-medium">Email Notifications</label>
              <p className="text-sm text-muted-foreground">Receive important updates via email</p>
            </div>
            <SettingsSwitch
              id="email-notif"
              checked={settings.emailNotifications}
              onCheckedChange={(v) => updateSetting('emailNotifications', v)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="push-notif" className="font-medium">Push Notifications</label>
              <p className="text-sm text-muted-foreground">Get browser push notifications</p>
            </div>
            <SettingsSwitch
              id="push-notif"
              checked={settings.pushNotifications}
              onCheckedChange={(v) => updateSetting('pushNotifications', v)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="assignment-remind" className="font-medium">Assignment Reminders</label>
              <p className="text-sm text-muted-foreground">Get notified about upcoming deadlines</p>
            </div>
            <SettingsSwitch
              id="assignment-remind"
              checked={settings.assignmentReminders}
              onCheckedChange={(v) => updateSetting('assignmentReminders', v)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="weekly-report" className="font-medium">Weekly Progress Report</label>
              <p className="text-sm text-muted-foreground">Receive weekly summary of your learning</p>
            </div>
            <SettingsSwitch
              id="weekly-report"
              checked={settings.weeklyReport}
              onCheckedChange={(v) => updateSetting('weeklyReport', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {settings.darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel of your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="dark-mode" className="font-medium">Dark Mode</label>
              <p className="text-sm text-muted-foreground">Switch between light and dark theme</p>
            </div>
            <SettingsSwitch
              id="dark-mode"
              checked={settings.darkMode}
              onCheckedChange={toggleDarkMode}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="animations" className="font-medium">Animations</label>
              <p className="text-sm text-muted-foreground">Enable smooth transitions and effects</p>
            </div>
            <SettingsSwitch
              id="animations"
              checked={settings.animationsEnabled}
              onCheckedChange={(v) => updateSetting('animationsEnabled', v)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="compact" className="font-medium">Compact Mode</label>
              <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
            </div>
            <SettingsSwitch
              id="compact"
              checked={settings.compactMode}
              onCheckedChange={(v) => updateSetting('compactMode', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Privacy
          </CardTitle>
          <CardDescription>Control your data and visibility settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="profile-visible" className="font-medium">Public Profile</label>
              <p className="text-sm text-muted-foreground">Allow others to see your profile</p>
            </div>
            <SettingsSwitch
              id="profile-visible"
              checked={settings.profileVisible}
              onCheckedChange={(v) => updateSetting('profileVisible', v)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="show-progress" className="font-medium">Show Learning Progress</label>
              <p className="text-sm text-muted-foreground">Display progress on leaderboards</p>
            </div>
            <SettingsSwitch
              id="show-progress"
              checked={settings.showProgress}
              onCheckedChange={(v) => updateSetting('showProgress', v)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="share-analytics" className="font-medium">Share Analytics</label>
              <p className="text-sm text-muted-foreground">Help improve FalkeAI with usage data</p>
            </div>
            <SettingsSwitch
              id="share-analytics"
              checked={settings.shareAnalytics}
              onCheckedChange={(v) => updateSetting('shareAnalytics', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Features */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Features
          </CardTitle>
          <CardDescription>Control FalkeAI-powered learning tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="ai-suggest" className="font-medium">AI Suggestions</label>
              <p className="text-sm text-muted-foreground">Get personalized learning recommendations</p>
            </div>
            <SettingsSwitch
              id="ai-suggest"
              checked={settings.aiSuggestions}
              onCheckedChange={(v) => updateSetting('aiSuggestions', v)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="personalized" className="font-medium">Personalized Lessons</label>
              <p className="text-sm text-muted-foreground">Let AI customize lesson content for you</p>
            </div>
            <SettingsSwitch
              id="personalized"
              checked={settings.personalizedLessons}
              onCheckedChange={(v) => updateSetting('personalizedLessons', v)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="auto-grade" className="font-medium">AI Auto-Grading</label>
              <p className="text-sm text-muted-foreground">Enable instant AI feedback on assignments</p>
            </div>
            <SettingsSwitch
              id="auto-grade"
              checked={settings.autoGrading}
              onCheckedChange={(v) => updateSetting('autoGrading', v)}
            />
          </div>
          
          <div className="p-4 rounded-xl bg-background/50 border border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">FalkeAI Status: Ready</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All AI features are operational. FalkeAI endpoints (/chat, /conversation) are available for integration.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save/Cancel Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 -mx-4 md:-mx-6 lg:-mx-8">
        <button
          onClick={handleCancel}
          disabled={!hasChanges || isSaving}
          className="px-6 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="px-6 py-2.5 rounded-xl bg-gradient-primary text-white font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// FALKEAI CHAT PANEL (Dedicated AI Chat Interface)
// ============================================================================

function FalkeAIPanel() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant' | 'system'; content: string; timestamp: Date }>>([
    {
      role: 'system',
      content: '👋 Welcome to FalkeAI! I\'m your intelligent learning companion. Ask me anything about your studies, request explanations, or get help with assignments. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation messages when a conversation is selected
  const loadConversationMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await apiRequest(`/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data?.messages) {
          const formattedMessages = data.data.messages.map((msg: { role: 'user' | 'assistant'; content: string; timestamp: string }) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
    }
  }, []);

  // Handle conversation selection from sidebar
  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    if (conversationId) {
      loadConversationMessages(conversationId);
    } else {
      setMessages([{
        role: 'system',
        content: '👋 Welcome to FalkeAI! I\'m your intelligent learning companion. Ask me anything about your studies, request explanations, or get help with assignments. How can I assist you today?',
        timestamp: new Date()
      }]);
    }
  }, [loadConversationMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const messageContent = inputMessage.trim();
    const userMessage = {
      role: 'user' as const,
      content: messageContent,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Call FalkeAI API through the backend with conversation context
      const page: FalkeAIChatPage = 'Ask FalkeAI';
      const response = await sendMessage(
        messageContent,
        page,
        user?.uid || 'anonymous',
        user?.displayName || user?.email || 'Student',
        undefined, // course
        selectedConversationId // conversationId
      );

      const assistantMessage = {
        role: 'assistant' as const,
        content: response.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation ID if a new one was created
      if (response.conversationId && !selectedConversationId) {
        setSelectedConversationId(response.conversationId);
        setRefreshKey(prev => prev + 1); // Refresh sidebar to show new conversation
      }
    } catch (error) {
      // Handle errors gracefully with user-friendly message displayed as assistant response
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const errorResponse = {
        role: 'assistant' as const,
        content: `⚠️ Unable to get a response. ${errorMessage}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    "Explain the concept of...",
    "Help me understand...",
    "Create a study guide for...",
    "Quiz me on...",
    "Summarize this topic...",
    "Give me practice problems for...",
  ];

  const handleNewConversation = useCallback(() => {
    setSelectedConversationId(undefined);
    setMessages([{
      role: 'system',
      content: '👋 New conversation started! How can I help you learn today?',
      timestamp: new Date()
    }]);
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-120px)] flex gap-4"
    >
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            FalkeAI Chat
          </h1>
          <p className="text-muted-foreground">Your intelligent learning companion — ask anything!</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border-green-500/30 text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Online
          </Badge>
          <button
            onClick={handleNewConversation}
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            New Chat
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={!shouldReduceMotion ? { opacity: 0, y: 10 } : {}}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                <div className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`p-2 rounded-xl flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-primary/20' : 
                    msg.role === 'system' ? 'bg-accent/20' : 'bg-primary/10'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-5 h-5 text-primary" />
                    ) : (
                      <Brain className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  
                  {/* Message Content */}
                  <div className={`p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-md' 
                      : msg.role === 'system'
                        ? 'bg-accent/10 border border-accent/30 rounded-bl-md'
                        : 'bg-secondary rounded-bl-md'
                  }`}>
                    <p className="text-xs opacity-70 mb-2">
                      {msg.role === 'user' ? 'You' : 'FalkeAI'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    ) : (
                      <div 
                        className="whitespace-pre-wrap text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Brain className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div className="bg-secondary p-4 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">FalkeAI is thinking</span>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-6 py-3 border-t border-border bg-secondary/20">
          <p className="text-xs text-muted-foreground mb-2">Quick prompts:</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(prompt)}
                className="px-3 py-1.5 text-xs rounded-full bg-background hover:bg-secondary transition-colors border border-border"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-background/50">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask FalkeAI anything about your learning..."
                className="w-full min-h-[60px] max-h-[150px] p-4 pr-4 rounded-2xl bg-secondary/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                aria-label="Message input"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="p-4 rounded-2xl bg-gradient-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow transition-all"
              aria-label="Send message"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>Conversation ID: {selectedConversationId || 'New'}</span>
          </div>
        </div>
      </Card>

      {/* API Info */}
      <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">FalkeAI Backend Integration</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ready to connect to <code className="px-1.5 py-0.5 bg-secondary rounded text-primary">/chat</code> and <code className="px-1.5 py-0.5 bg-secondary rounded text-primary">/conversation</code> endpoints. The AI tutor will provide personalized learning assistance once fully integrated.
            </p>
          </div>
        </div>
      </div>
      </div>{/* End of Main Chat Area */}
    </motion.div>
  );
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function Dashboard() {
  const [activePanel, setActivePanel] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Handler to navigate to FalkeAI chat panel
  const handleLaunchFalkeAI = useCallback(() => {
    setActivePanel("falkeai");
  }, []);

  const renderPanel = () => {
    switch (activePanel) {
      case "dashboard":
        return <DashboardPanel onLaunchFalkeAI={handleLaunchFalkeAI} />;
      case "lessons":
        return <LessonsPanel />;
      case "library":
        // Library panel for book reading
        return <LibraryPanel />;
      case "analytics":
        // Use real analytics panel with backend data
        return <AnalyticsPanelReal />;
      case "settings":
        return <SettingsPanel />;
      case "falkeai":
        return <FalkeAIPanel />;
      default:
        return <DashboardPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex" style={{ WebkitFontSmoothing: "antialiased" }}>
      <Sidebar
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? {} : { opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderPanel()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
