/*
 * ============================================================================
 * AURIKREX ACADEMY DASHBOARD — PRODUCTION-READY, INVESTOR-GRADE
 * ============================================================================
 * 
 * Features:
 * - Collapsible sidebar with Framer Motion animations
 * - FalkeAI integration placeholders (Tutor, Lessons, Assignments, Analytics)
 * - Glassmorphism design with semantic tokens
 * - Full keyboard navigation & accessibility (ARIA labels, reduced motion)
 * - Mock data for demonstration
 * - Smooth micro-interactions (hover, press, transitions)
 * 
 * Future Integration Points:
 * - TODO: Connect FalkeAI API endpoints
 * - TODO: Replace mockData with real backend hooks
 * - TODO: Add user progress tracking with database
 * - TODO: Implement real-time notifications
 * 
 * ============================================================================
 */

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

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
    { id: "assignments", label: "Assignments", icon: ClipboardCheck },
    { id: "analytics", label: "AI Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
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
            <button className="w-full px-3 py-2 bg-gradient-primary text-white rounded-2xl text-sm font-medium hover:shadow-glow hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm">
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

          {/* User Avatar */}
          <Avatar className="w-9 h-9 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
            <AvatarImage src={mockData.user.avatar} alt={user?.name || mockData.user.name} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {(user?.name || mockData.user.name).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </motion.header>
  );
}

// ============================================================================
// DASHBOARD CONTENT PANELS
// ============================================================================

function DashboardPanel() {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  
  // Get firstName from authenticated user or fallback to mock data
  const displayName = user?.firstName || user?.displayName || mockData.user.name.split(' ')[0];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Welcome back, {displayName}! 👋
        </h1>
        <p className="text-muted-foreground">Here's your learning progress overview</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {mockData.stats.map((stat, index) => {
          const Icon = stat.icon;
          const percentage = (stat.value / stat.total) * 100;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={!shouldReduceMotion ? { scale: 1.02, y: -4 } : {}}
            >
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-border bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold">{stat.value}{stat.suffix || ""}</h3>
                        {!stat.suffix && <span className="text-sm text-muted-foreground">/ {stat.total}</span>}
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor} shadow-sm`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} aria-hidden="true" />
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Subject Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" aria-hidden="true" />
              Learning Progress by Subject
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {mockData.subjects.map((subject, index) => (
              <motion.div
                key={subject.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{subject.name}</span>
                    <Badge variant="secondary" className="text-xs">{subject.lessons} lessons</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground font-semibold">{subject.progress}%</span>
                </div>
                <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${subject.progress}%` }}
                    transition={{ duration: 1, delay: 0.8 + index * 0.1, ease: "easeOut" }}
                    className={`absolute top-0 left-0 h-full ${subject.color}`}
                  />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid: Assignments + AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Assignments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.9 }}
        >
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-orange-500" aria-hidden="true" />
                Upcoming Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockData.assignments.map((assignment, index) => {
                const statusConfig = {
                  pending: { icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
                  "in-progress": { icon: AlertCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
                  "not-started": { icon: CircleIcon, color: "text-gray-500", bg: "bg-gray-500/10" },
                };
                const config = statusConfig[assignment.status as keyof typeof statusConfig];
                const StatusIcon = config.icon;

                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1 + index * 0.1 }}
                    whileHover={!shouldReduceMotion ? { x: 4, scale: 1.01 } : {}}
                    className="p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-all duration-200 cursor-pointer shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{assignment.title}</h4>
                        <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                      </div>
                      <div className={`p-2 rounded-xl ${config.bg}`}>
                        <StatusIcon className={`w-4 h-4 ${config.color}`} aria-hidden="true" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Due: {assignment.dueDate}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1 }}
        >
          <Card className="border-border bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" aria-hidden="true" />
                FalkeAI Insights
                <Badge className="ml-auto bg-primary/20 text-primary border-primary/30">Beta</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockData.aiInsights.map((insight, index) => {
                const InsightIcon = insight.icon;
                const colors = {
                  strength: { icon: "text-green-500", bg: "bg-green-500/10" },
                  improvement: { icon: "text-orange-500", bg: "bg-orange-500/10" },
                  suggestion: { icon: "text-blue-500", bg: "bg-blue-500/10" },
                };
                const color = colors[insight.type as keyof typeof colors];

                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1.1 + index * 0.1 }}
                    whileHover={!shouldReduceMotion ? { x: -4, scale: 1.01 } : {}}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-background/50 hover:bg-background/80 transition-all duration-200 cursor-pointer shadow-sm"
                  >
                    <div className={`p-2 rounded-xl ${color.bg} flex-shrink-0 shadow-sm`}>
                      <InsightIcon className={`w-4 h-4 ${color.icon}`} aria-hidden="true" />
                    </div>
                    <p className="text-sm flex-1">{insight.text}</p>
                  </motion.div>
                );
              })}

              {/* TODO: Connect FalkeAI API for real insights */}
              <div className="mt-4 p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
                <p className="text-xs text-center text-muted-foreground">
                  🚀 More AI insights coming soon with FalkeAI integration
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* FalkeAI Tutor Preview */}
      <FalkeAITutorCard />
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

function FalkeAITutorCard() {
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
            <button className="flex-1 px-6 py-3 bg-gradient-primary text-white font-semibold rounded-2xl hover:shadow-glow hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary shadow-md">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
              Launch FalkeAI Tutor
            </button>
            <button className="px-6 py-3 bg-secondary text-foreground font-semibold rounded-2xl hover:bg-secondary/80 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm">
              Learn More
            </button>
          </div>

          {/* TODO Note */}
          <div className="mt-4 p-3 rounded-xl bg-accent/10 border border-accent/20">
            <p className="text-xs text-center text-muted-foreground">
              💡 <strong>Coming Soon:</strong> Full FalkeAI integration with real-time tutoring, lesson generation, and assignment analysis
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// OTHER PANELS (Placeholders)
// ============================================================================

function LessonsPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold mb-2">Smart Lessons</h1>
        <p className="text-muted-foreground">AI-generated lessons tailored to your learning style</p>
      </div>

      <Card className="border-dashed border-2 border-primary/30 bg-primary/5 p-12 text-center rounded-2xl">
        <Rocket className="w-16 h-16 text-primary mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-xl font-bold mb-2">FalkeAI Lesson Generator</h3>
        <p className="text-muted-foreground mb-6">
          This feature will automatically create personalized lessons based on your progress, interests, and learning goals.
        </p>
        <Badge className="bg-accent text-accent-foreground">Coming with FalkeAI v1.0</Badge>
      </Card>
    </motion.div>
  );
}

function AssignmentsPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold mb-2">Assignment Review</h1>
        <p className="text-muted-foreground">Upload assignments for AI-powered feedback</p>
      </div>

      <Card className="border-dashed border-2 border-primary/30 bg-primary/5 p-12 text-center rounded-2xl">
        <ClipboardCheck className="w-16 h-16 text-primary mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-xl font-bold mb-2">FalkeAI Assignment Reviewer</h3>
        <p className="text-muted-foreground mb-6">
          Upload your work and get instant, detailed feedback with suggestions for improvement powered by advanced AI.
        </p>
        <Badge className="bg-accent text-accent-foreground">Coming with FalkeAI v1.0</Badge>
      </Card>
    </motion.div>
  );
}

function AnalyticsPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Analytics</h1>
        <p className="text-muted-foreground">Deep insights into your learning patterns</p>
      </div>

      <Card className="border-dashed border-2 border-primary/30 bg-primary/5 p-12 text-center rounded-2xl">
        <BarChart3 className="w-16 h-16 text-primary mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-xl font-bold mb-2">FalkeAI Analytics Dashboard</h3>
        <p className="text-muted-foreground mb-6">
          Visualize your strengths, weaknesses, learning velocity, and get personalized recommendations for improvement.
        </p>
        <Badge className="bg-accent text-accent-foreground">Coming with FalkeAI v1.0</Badge>
      </Card>
    </motion.div>
  );
}

function SettingsPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Customize your learning experience</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Settings panel coming soon...</p>
        </CardContent>
      </Card>
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

  const renderPanel = () => {
    switch (activePanel) {
      case "dashboard":
        return <DashboardPanel />;
      case "lessons":
        return <LessonsPanel />;
      case "assignments":
        return <AssignmentsPanel />;
      case "analytics":
        return <AnalyticsPanel />;
      case "settings":
        return <SettingsPanel />;
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
