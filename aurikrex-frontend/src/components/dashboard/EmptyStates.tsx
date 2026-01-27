/**
 * Empty States Component
 * 
 * Beautiful, consistent empty state displays for various dashboard sections.
 * Used when data is not available or when features are coming soon.
 */

import { motion } from "framer-motion";
import { 
  BookOpen, 
  ClipboardCheck, 
  Brain, 
  Target, 
  Award, 
  Calendar,
  TrendingUp,
  Sparkles,
  MessageSquare,
  FileText,
  type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'minimal' | 'card';
}

export function EmptyState({ icon: Icon, title, description, action, variant = 'default' }: EmptyStateProps) {
  if (variant === 'minimal') {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Icon className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${
        variant === 'card' ? 'bg-card/50 rounded-2xl border border-border' : ''
      }`}
    >
      <div className="p-4 rounded-2xl bg-secondary/50 mb-4">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline" className="gap-2">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

// Pre-configured empty states for common scenarios

export function NoCourses({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <EmptyState
      icon={BookOpen}
      title="No courses yet"
      description="Start your learning journey by exploring our course catalog."
      action={onBrowse ? { label: "Browse Courses", onClick: onBrowse } : undefined}
      variant="card"
    />
  );
}

export function NoAssignments() {
  return (
    <EmptyState
      icon={ClipboardCheck}
      title="All caught up!"
      description="You have no pending assignments. Great job staying on top of your work!"
      variant="card"
    />
  );
}

export function NoLessons({ onExplore }: { onExplore?: () => void }) {
  return (
    <EmptyState
      icon={Brain}
      title="No lessons available"
      description="Check back soon for new AI-powered lessons tailored to your learning goals."
      action={onExplore ? { label: "Explore Topics", onClick: onExplore } : undefined}
      variant="card"
    />
  );
}

export function NoAchievements({ onStartLearning }: { onStartLearning?: () => void }) {
  return (
    <EmptyState
      icon={Award}
      title="Achievements await!"
      description="Complete lessons and assignments to unlock badges and milestones."
      action={onStartLearning ? { label: "Start Learning", onClick: onStartLearning } : undefined}
      variant="card"
    />
  );
}

export function NoAnalytics() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No data yet"
      description="Start learning to see your progress and performance analytics."
      variant="card"
    />
  );
}

export function NoAIInsights() {
  return (
    <EmptyState
      icon={Sparkles}
      title="Insights loading..."
      description="FalkeAI is analyzing your progress. Check back soon for personalized recommendations."
      variant="card"
    />
  );
}

export function NoMessages() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Start a conversation"
      description="Ask FalkeAI anything about your studies to get instant help and explanations."
      variant="card"
    />
  );
}

export function NoNotifications() {
  return (
    <EmptyState
      icon={Calendar}
      title="No notifications"
      description="You're all caught up! We'll notify you of important updates."
      variant="minimal"
    />
  );
}

export function NoRecommendations() {
  return (
    <EmptyState
      icon={Target}
      title="Recommendations coming"
      description="Complete more lessons to receive personalized AI recommendations."
      variant="card"
    />
  );
}

export function NoFiles() {
  return (
    <EmptyState
      icon={FileText}
      title="No files uploaded"
      description="Upload documents or images to get AI-powered analysis and help."
      variant="minimal"
    />
  );
}

// Coming Soon variant
export function ComingSoon({ feature }: { feature: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/20"
    >
      <div className="p-4 rounded-2xl bg-primary/10 mb-4">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{feature}</h3>
      <p className="text-muted-foreground text-sm max-w-sm">
        This feature is being enhanced with AI capabilities. Stay tuned!
      </p>
    </motion.div>
  );
}

export default {
  EmptyState,
  NoCourses,
  NoAssignments,
  NoLessons,
  NoAchievements,
  NoAnalytics,
  NoAIInsights,
  NoMessages,
  NoNotifications,
  NoRecommendations,
  NoFiles,
  ComingSoon,
};
