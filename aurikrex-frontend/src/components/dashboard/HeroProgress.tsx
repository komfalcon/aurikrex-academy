/**
 * Hero Progress Component
 * 
 * A visually striking hero section with circular progress indicators,
 * key metrics, and streak information displayed at a glance.
 */

import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Trophy, 
  BookOpen, 
  Target, 
  Clock,
  TrendingUp,
  Flame,
  Star
} from "lucide-react";

interface HeroProgressProps {
  userName: string;
  stats: {
    lessonsCompleted: number;
    totalLessons: number;
    assignmentsCompleted: number;
    totalAssignments: number;
    overallProgress: number;
    streak: number;
    level: number;
    totalHours: number;
  };
  onQuickAction?: (action: string) => void;
}

// Circular progress indicator component
function CircularProgress({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8,
  color = "text-primary",
  bgColor = "text-secondary",
  label,
  sublabel,
  icon: Icon
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label: string;
  sublabel?: string;
  icon?: React.ElementType;
}) {
  const shouldReduceMotion = useReducedMotion();
  const percentage = Math.round((value / max) * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            className={bgColor}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress circle */}
          <motion.circle
            className={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.5, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {Icon && <Icon className={`w-5 h-5 ${color} mb-1`} />}
          <span className="text-2xl font-bold">{percentage}%</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-center">{label}</p>
      {sublabel && (
        <p className="text-xs text-muted-foreground text-center">{sublabel}</p>
      )}
    </div>
  );
}

// Metric badge component
function MetricBadge({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/50 border border-border">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

export function HeroProgress({ userName, stats, onQuickAction }: HeroProgressProps) {
  const shouldReduceMotion = useReducedMotion();
  const firstName = userName.split(' ')[0];
  
  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };
  
  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 backdrop-blur-sm">
        {/* Decorative background elements */}
        {!shouldReduceMotion && (
          <>
            <motion.div
              className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
              animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl"
              animate={{ x: [0, -15, 0], y: [0, 15, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}
        
        <CardContent className="relative z-10 p-6 md:p-8">
          {/* Header row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            {/* Welcome message */}
            <div>
              <motion.div
                initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {getGreeting()},{" "}
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    {firstName}! 
                  </span>
                  {" "}👋
                </h1>
                <p className="text-muted-foreground">
                  Here's your learning progress at a glance
                </p>
              </motion.div>
            </div>
            
            {/* Streak & Level badges */}
            <div className="flex flex-wrap items-center gap-3">
              <motion.div
                initial={shouldReduceMotion ? {} : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400"
                >
                  <Flame className="w-4 h-4" />
                  <span className="font-semibold">{stats.streak} Day Streak</span>
                </Badge>
              </motion.div>
              
              <motion.div
                initial={shouldReduceMotion ? {} : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 border-primary/30"
                >
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Level {stats.level}</span>
                </Badge>
              </motion.div>
            </div>
          </div>
          
          {/* Progress circles row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CircularProgress
                value={stats.lessonsCompleted}
                max={stats.totalLessons}
                color="text-blue-500"
                bgColor="text-blue-500/20"
                label="Lessons"
                sublabel={`${stats.lessonsCompleted}/${stats.totalLessons}`}
                icon={BookOpen}
              />
            </motion.div>
            
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <CircularProgress
                value={stats.assignmentsCompleted}
                max={stats.totalAssignments}
                color="text-orange-500"
                bgColor="text-orange-500/20"
                label="Assignments"
                sublabel={`${stats.assignmentsCompleted}/${stats.totalAssignments}`}
                icon={Target}
              />
            </motion.div>
            
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <CircularProgress
                value={stats.overallProgress}
                max={100}
                color="text-green-500"
                bgColor="text-green-500/20"
                label="Overall"
                sublabel="Progress"
                icon={TrendingUp}
              />
            </motion.div>
            
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <CircularProgress
                value={stats.level * 10}
                max={100}
                color="text-purple-500"
                bgColor="text-purple-500/20"
                label="XP Level"
                sublabel={`Level ${stats.level}`}
                icon={Star}
              />
            </motion.div>
          </div>
          
          {/* Quick metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <MetricBadge
                icon={Clock}
                label="Total Learning Time"
                value={`${stats.totalHours}h`}
                color="bg-blue-500/10 text-blue-500"
              />
            </motion.div>
            
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <MetricBadge
                icon={Zap}
                label="Current Streak"
                value={`${stats.streak} days`}
                color="bg-orange-500/10 text-orange-500"
              />
            </motion.div>
            
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <MetricBadge
                icon={BookOpen}
                label="Lessons This Week"
                value={Math.min(stats.lessonsCompleted, 5)}
                color="bg-green-500/10 text-green-500"
              />
            </motion.div>
            
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <MetricBadge
                icon={Trophy}
                label="Achievements"
                value={Math.floor(stats.level * 1.5)}
                color="bg-purple-500/10 text-purple-500"
              />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default HeroProgress;
