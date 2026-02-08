/**
 * Weekly Progress Card Component
 * 
 * Displays "You improved this week" feedback based on FalkeAI analytics.
 * Shows weekly learning growth, streak, and actionable nudges.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Target, 
  Sparkles, 
  X,
  ChevronRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/utils/api';

interface WeeklyProgressData {
  hasProgress: boolean;
  message: string;
  questionsThisWeek: number;
  questionsLastWeek: number;
  percentageChange: number;
  streak: number;
  conceptsLearned: number;
  topImprovement: string | null;
  nudge: string | null;
}

interface WeeklyProgressCardProps {
  onDismiss?: () => void;
  className?: string;
}

export function WeeklyProgressCard({ onDismiss, className = '' }: WeeklyProgressCardProps) {
  const [data, setData] = useState<WeeklyProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchWeeklyProgress = async () => {
      try {
        const response = await apiRequest('/dashboard/weekly-progress');
        
        if (!response.ok) {
          throw new Error('Failed to fetch weekly progress');
        }
        
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load progress');
        console.error('Weekly progress fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyProgress();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Don't show if dismissed or no progress data
  if (dismissed || loading || error || !data) {
    return null;
  }

  const isPositive = data.percentageChange >= 0;
  const showStreakBadge = data.streak >= 3;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/10 border-primary/20">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/50 transition-colors z-10"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <CardContent className="pt-5 pb-4 px-5 relative">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`p-3 rounded-xl ${isPositive ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                {isPositive ? (
                  <TrendingUp className="w-6 h-6 text-green-500" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-orange-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">
                    Weekly Progress
                  </h3>
                  {showStreakBadge && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 text-xs font-medium">
                      <Flame className="w-3 h-3" />
                      {data.streak} day streak
                    </span>
                  )}
                </div>

                <p className="text-sm text-foreground/90 mb-3">
                  {data.message}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    <span>{data.questionsThisWeek} questions this week</span>
                  </div>
                  {data.conceptsLearned > 0 && (
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      <span>{data.conceptsLearned} concepts mastered</span>
                    </div>
                  )}
                </div>

                {/* Nudge */}
                {data.nudge && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-sm text-muted-foreground">
                      💡 {data.nudge}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                    >
                      Continue
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}

                {/* Top improvement */}
                {data.topImprovement && !data.nudge && (
                  <div className="text-xs text-muted-foreground">
                    🎯 Latest topic: <span className="font-medium text-foreground">{data.topImprovement}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export default WeeklyProgressCard;
