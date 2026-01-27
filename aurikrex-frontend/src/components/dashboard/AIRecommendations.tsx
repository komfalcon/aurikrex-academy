/**
 * AI Recommendations Component
 * 
 * Spotlight section for FalkeAI-powered recommendations and insights.
 * Displays personalized suggestions, learning tips, and focus areas.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Sparkles, 
  Target, 
  Award, 
  Lightbulb,
  ChevronRight,
  RefreshCw,
  Clock,
  BookOpen,
  Zap,
  TrendingUp
} from "lucide-react";
import { AIInsightSkeleton } from "./LoadingSkeletons";
import type { AIInsight, AIRecommendation } from "@/utils/aiAnalysis";

interface AIRecommendationsProps {
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onActionClick?: (action: string) => void;
  summary?: string;
}

// Icon mapping for insight types
const insightIcons = {
  strength: Award,
  improvement: Target,
  suggestion: Lightbulb,
  prediction: TrendingUp,
  recommendation: Sparkles,
};

// Color mapping for insight types
const insightColors = {
  strength: { 
    icon: "text-green-500", 
    bg: "bg-green-500/10", 
    border: "border-green-500/20" 
  },
  improvement: { 
    icon: "text-orange-500", 
    bg: "bg-orange-500/10", 
    border: "border-orange-500/20" 
  },
  suggestion: { 
    icon: "text-blue-500", 
    bg: "bg-blue-500/10", 
    border: "border-blue-500/20" 
  },
  prediction: { 
    icon: "text-purple-500", 
    bg: "bg-purple-500/10", 
    border: "border-purple-500/20" 
  },
  recommendation: { 
    icon: "text-primary", 
    bg: "bg-primary/10", 
    border: "border-primary/20" 
  },
};

// Recommendation type icons
const recommendationIcons = {
  lesson: BookOpen,
  course: BookOpen,
  practice: Target,
  review: RefreshCw,
  break: Clock,
};

// Single insight card
function InsightCard({ insight, index, onAction }: { 
  insight: AIInsight; 
  index: number;
  onAction?: (action: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const Icon = insightIcons[insight.type] || Sparkles;
  const colors = insightColors[insight.type] || insightColors.recommendation;
  
  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={shouldReduceMotion ? {} : { x: 4, scale: 1.01 }}
      className={`p-4 rounded-xl ${colors.bg} border ${colors.border} cursor-pointer transition-all duration-200 hover:shadow-md`}
      onClick={() => insight.action && onAction?.(insight.action)}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon className={`w-4 h-4 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">{insight.title}</h4>
            {insight.priority === 'high' && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 bg-orange-500/10 text-orange-500 border-orange-500/30">
                Priority
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {insight.description}
          </p>
          {insight.actionable && insight.action && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 mt-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onAction?.(insight.action!);
              }}
            >
              {insight.action}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Single recommendation card
function RecommendationCard({ recommendation, index, onAction }: {
  recommendation: AIRecommendation;
  index: number;
  onAction?: (action: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const Icon = recommendationIcons[recommendation.type] || Sparkles;
  
  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1 }}
      whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
      className="p-4 rounded-xl bg-card border border-border cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
      onClick={() => onAction?.(recommendation.title)}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1">{recommendation.title}</h4>
          <p className="text-xs text-muted-foreground mb-2">
            {recommendation.reason}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {recommendation.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {recommendation.duration}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" />
              {recommendation.confidence}% match
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </motion.div>
  );
}

export function AIRecommendations({ 
  insights, 
  recommendations, 
  isLoading, 
  onRefresh,
  onActionClick,
  summary
}: AIRecommendationsProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showAll, setShowAll] = useState(false);
  
  const displayedInsights = showAll ? insights : insights.slice(0, 3);
  const displayedRecommendations = showAll ? recommendations : recommendations.slice(0, 2);
  
  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden relative">
        {/* Decorative background */}
        {!shouldReduceMotion && (
          <motion.div
            className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        )}
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  FalkeAI Insights
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                    AI-Powered
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Personalized recommendations based on your progress
                </CardDescription>
              </div>
            </div>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10 space-y-6">
          {/* Summary */}
          {summary && (
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-xl bg-background/50 border border-border"
            >
              <p className="text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 inline-block mr-2 text-primary" />
                {summary}
              </p>
            </motion.div>
          )}
          
          {/* Insights Section */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Learning Insights
            </h3>
            
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <AIInsightSkeleton key={i} />
                  ))}
                </div>
              ) : displayedInsights.length > 0 ? (
                <div className="space-y-3">
                  {displayedInsights.map((insight, index) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      index={index}
                      onAction={onActionClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No insights available yet</p>
                </div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Recommendations Section */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Recommended For You
            </h3>
            
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <AIInsightSkeleton key={i} />
                  ))}
                </div>
              ) : displayedRecommendations.length > 0 ? (
                <div className="space-y-3">
                  {displayedRecommendations.map((rec, index) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      index={index}
                      onAction={onActionClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Complete more lessons to get recommendations</p>
                </div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Show More / Less */}
          {(insights.length > 3 || recommendations.length > 2) && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Show Less" : "View All Insights"}
              <ChevronRight className={`w-4 h-4 ml-2 transition-transform ${showAll ? 'rotate-90' : ''}`} />
            </Button>
          )}
          
          {/* AI Status */}
          <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
            <p className="text-xs text-center text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              FalkeAI is actively analyzing your learning patterns
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default AIRecommendations;
