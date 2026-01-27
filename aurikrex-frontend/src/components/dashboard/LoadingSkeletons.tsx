/**
 * Loading Skeletons Component
 * 
 * Modern loading placeholder components for async operations.
 * Provides visual feedback while data is being fetched.
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

// Base skeleton with shimmer animation
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-secondary via-secondary/50 to-secondary bg-[length:200%_100%]",
        className
      )}
    />
  );
}

// Stats card skeleton
export function StatsCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 rounded-2xl border border-border bg-card/50"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
      <Skeleton className="h-2 w-full" />
    </motion.div>
  );
}

// Stats grid skeleton (4 cards)
export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Course card skeleton
export function CourseCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-xl border border-border bg-card/50"
    >
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    </motion.div>
  );
}

// Assignment item skeleton
export function AssignmentSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-xl bg-secondary/50"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-3 w-24" />
    </motion.div>
  );
}

// AI insight skeleton
export function AIInsightSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-xl bg-background/50 flex items-start gap-3"
    >
      <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </motion.div>
  );
}

// Progress bar skeleton
export function ProgressSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-8" />
      </div>
      <Skeleton className="h-2 w-full" />
    </motion.div>
  );
}

// Chart skeleton
export function ChartSkeleton({ height = 250 }: { height?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full rounded-xl bg-secondary/30 flex items-center justify-center"
      style={{ height }}
    >
      <div className="flex items-end gap-2">
        {[40, 60, 80, 50, 70, 90, 55].map((h, i) => (
          <Skeleton key={i} className="w-8" style={{ height: `${h}%` }} />
        ))}
      </div>
    </motion.div>
  );
}

// Notification skeleton
export function NotificationSkeleton() {
  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
}

// Profile info skeleton
export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

// Chat message skeleton
export function ChatMessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[80%] flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
        <div className={`space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
          <Skeleton className="h-3 w-24" />
          <div className={`p-4 rounded-2xl ${isUser ? 'bg-primary/20' : 'bg-secondary'}`}>
            <div className="space-y-2">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Lesson card skeleton
export function LessonSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-xl border border-border bg-card/50"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-xl mt-3" />
    </motion.div>
  );
}

// Hero section skeleton
export function HeroSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-5 w-48" />
    </motion.div>
  );
}

// Full dashboard loading skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero */}
      <HeroSkeleton />
      
      {/* Stats Grid */}
      <StatsGridSkeleton />
      
      {/* Progress Section */}
      <div className="p-6 rounded-2xl border border-border bg-card/50">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <ProgressSkeleton key={i} />
          ))}
        </div>
      </div>
      
      {/* Two Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          {[1, 2, 3].map((i) => (
            <AssignmentSkeleton key={i} />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          {[1, 2, 3].map((i) => (
            <AIInsightSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Thinking indicator for AI
export function AIThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 text-primary"
    >
      <div className="flex gap-1">
        <motion.span
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
        />
        <motion.span
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
        />
        <motion.span
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
        />
      </div>
      <span className="text-sm font-medium">FalkeAI is thinking...</span>
    </motion.div>
  );
}

export default {
  Skeleton,
  StatsCardSkeleton,
  StatsGridSkeleton,
  CourseCardSkeleton,
  AssignmentSkeleton,
  AIInsightSkeleton,
  ProgressSkeleton,
  ChartSkeleton,
  NotificationSkeleton,
  ProfileSkeleton,
  ChatMessageSkeleton,
  LessonSkeleton,
  HeroSkeleton,
  DashboardSkeleton,
  AIThinkingIndicator,
};
