/**
 * Quick Actions Component
 * 
 * A compact sidebar/section with quick-access buttons for common actions.
 * Provides one-click access to key features.
 */

import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  BookOpen, 
  ClipboardCheck, 
  Brain, 
  Trophy, 
  Settings,
  BarChart3,
  Sparkles,
  ChevronRight,
  Clock,
  Zap
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  onClick: () => void;
  badge?: string;
  description?: string;
}

interface QuickActionsProps {
  currentLesson?: {
    title: string;
    progress: number;
    subject: string;
  };
  onResumeLearning?: () => void;
  onBrowseCourses?: () => void;
  onViewAssignments?: () => void;
  onOpenAI?: () => void;
  onViewAnalytics?: () => void;
  onViewAchievements?: () => void;
  onOpenSettings?: () => void;
  variant?: 'sidebar' | 'horizontal' | 'grid';
}

export function QuickActions({
  currentLesson,
  onResumeLearning,
  onBrowseCourses,
  onViewAssignments,
  onOpenAI,
  onViewAnalytics,
  onViewAchievements,
  onOpenSettings,
  variant = 'grid'
}: QuickActionsProps) {
  const shouldReduceMotion = useReducedMotion();
  
  const actions: QuickAction[] = [
    {
      id: 'resume',
      label: 'Resume Learning',
      icon: Play,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10 hover:bg-green-500/20',
      onClick: onResumeLearning || (() => {}),
      badge: currentLesson ? `${currentLesson.progress}%` : undefined,
      description: currentLesson?.title || 'Continue where you left off'
    },
    {
      id: 'courses',
      label: 'Browse Courses',
      icon: BookOpen,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
      onClick: onBrowseCourses || (() => {}),
      description: 'Explore new learning paths'
    },
    {
      id: 'assignments',
      label: 'Assignments',
      icon: ClipboardCheck,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10 hover:bg-orange-500/20',
      onClick: onViewAssignments || (() => {}),
      badge: '3 pending',
      description: 'View and submit work'
    },
    {
      id: 'ai',
      label: 'Ask FalkeAI',
      icon: Brain,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
      onClick: onOpenAI || (() => {}),
      description: 'Get instant AI help'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20',
      onClick: onViewAnalytics || (() => {}),
      description: 'Track your progress'
    },
    {
      id: 'achievements',
      label: 'Achievements',
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10 hover:bg-yellow-500/20',
      onClick: onViewAchievements || (() => {}),
      badge: '2 new',
      description: 'View your badges'
    },
  ];
  
  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                initial={shouldReduceMotion ? {} : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={shouldReduceMotion ? {} : { x: 4 }}
                onClick={action.onClick}
                className={`w-full flex items-center gap-3 p-3 rounded-xl ${action.bgColor} transition-all duration-200`}
              >
                <Icon className={`w-5 h-5 ${action.color}`} />
                <span className="font-medium text-sm flex-1 text-left">{action.label}</span>
                {action.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {action.badge}
                  </Badge>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            );
          })}
        </CardContent>
      </Card>
    );
  }
  
  // Horizontal variant
  if (variant === 'horizontal') {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${action.bgColor} whitespace-nowrap transition-all`}
            >
              <Icon className={`w-4 h-4 ${action.color}`} />
              <span className="text-sm font-medium">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    );
  }
  
  // Grid variant (default)
  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Resume Learning Card (Featured) */}
          {currentLesson && (
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              onClick={onResumeLearning}
              className="p-4 mb-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 cursor-pointer transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Play className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">Resume Learning</h4>
                    <Badge variant="secondary" className="text-xs">
                      {currentLesson.progress}% complete
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {currentLesson.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentLesson.subject}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </motion.div>
          )}
          
          {/* Action Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {actions.slice(1).map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={action.onClick}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl ${action.bgColor} transition-all duration-200`}
                >
                  <div className="relative">
                    <Icon className={`w-6 h-6 ${action.color}`} />
                    {action.badge && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-center">{action.label}</span>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Mini floating action button version
export function QuickActionFab({ onClick, icon: Icon = Brain, label = "Ask FalkeAI" }: {
  onClick: () => void;
  icon?: React.ElementType;
  label?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.button
      initial={shouldReduceMotion ? {} : { scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-glow transition-all z-50 flex items-center gap-2"
      aria-label={label}
    >
      <Icon className="w-6 h-6" />
      <span className="hidden md:inline font-medium">{label}</span>
    </motion.button>
  );
}

export default QuickActions;
