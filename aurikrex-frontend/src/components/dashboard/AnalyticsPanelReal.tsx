/**
 * FalkeAI Analytics Panel Component
 * 
 * Real analytics dashboard with data from backend APIs.
 * NO MOCK DATA - all data from backend APIs.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  Brain,
  Clock,
  BookOpen,
  Target,
  Zap,
  TrendingUp,
  TrendingDown,
  Award,
  Lightbulb,
  Sparkles,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  getDashboardAnalytics,
  refreshAnalytics,
} from '@/utils/analyticsApi';
import activityEventBroadcaster from '@/services/ActivityEventBroadcaster';
import type { DashboardAnalytics } from '@/types';

// Empty state for no data
function NoAnalyticsData({ onStartLearning }: { onStartLearning?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/20"
    >
      <div className="p-4 rounded-2xl bg-primary/10 mb-4">
        <TrendingUp className="w-10 h-10 text-primary" />
      </div>
      <h3 className="font-semibold text-xl mb-2">No Activity Yet</h3>
      <p className="text-muted-foreground text-sm max-w-md mb-4">
        Start learning to see your progress and performance analytics. 
        Your activities will appear here once you begin using FalkeAI.
      </p>
      {onStartLearning && (
        <button
          onClick={onStartLearning}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Start Learning
        </button>
      )}
    </motion.div>
  );
}

// Loading skeleton
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-secondary/50 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-secondary/50 rounded-xl" />
        <div className="h-80 bg-secondary/50 rounded-xl" />
      </div>
    </div>
  );
}

// KPI Card Component
function KPICard({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  color, 
  bgColor 
}: { 
  title: string; 
  value: string | number; 
  change?: string; 
  trend?: 'up' | 'down' | 'stable'; 
  icon: typeof Activity; 
  color: string; 
  bgColor: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!shouldReduceMotion ? { scale: 1.02, y: -4 } : {}}
    >
      <Card className="border-border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <h3 className="text-3xl font-bold mt-2">{value}</h3>
              {change && trend && (
                <div className="flex items-center gap-1 mt-2">
                  {trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : trend === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <span className="w-4 h-4 text-muted-foreground">—</span>
                  )}
                  <span className={`text-sm font-medium ${
                    trend === 'up' ? 'text-green-500' : 
                    trend === 'down' ? 'text-red-500' : 
                    'text-muted-foreground'
                  }`}>
                    {change}
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-xl ${bgColor}`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AnalyticsPanelReal() {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await getDashboardAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Refresh analytics
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshAnalytics();
      await loadAnalytics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh analytics');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial load and activity event subscriptions for real-time updates
  useEffect(() => {
    loadAnalytics();

    // Subscribe to activity events for immediate refresh
    const handleActivity = () => {
      console.log('Activity detected, refreshing analytics...');
      loadAnalytics();
    };

    const unsubQuestions = activityEventBroadcaster.subscribe('question-asked', handleActivity);
    const unsubLessons = activityEventBroadcaster.subscribe('lesson-completed', handleActivity);
    const unsubAssignments = activityEventBroadcaster.subscribe('assignment-submitted', handleActivity);
    const unsubSolutions = activityEventBroadcaster.subscribe('solution-verified', handleActivity);

    // Backup polling every 15 minutes (900 seconds) - less frequent now due to event-based updates
    const pollInterval = setInterval(() => {
      loadAnalytics();
    }, 15 * 60 * 1000);

    return () => {
      unsubQuestions();
      unsubLessons();
      unsubAssignments();
      unsubSolutions();
      clearInterval(pollInterval);
    };
  }, [loadAnalytics]);

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              FalkeAI Analytics
            </h1>
            <p className="text-muted-foreground">Loading your learning insights...</p>
          </div>
        </div>
        <AnalyticsSkeleton />
      </motion.div>
    );
  }

  // No data state
  const hasData = analytics && analytics.overview.totalQuestions > 0;

  // Prepare chart data
  const activityTimelineData = analytics?.trends.activityTimeline.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    count: d.count,
  })) || [];

  const activityByTypeData = Object.entries(analytics?.trends.activitiesByType || {}).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value,
  })).filter(d => d.value > 0);

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            FalkeAI Analytics
          </h1>
          <p className="text-muted-foreground">
            Deep insights into your learning patterns and progress
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <Badge className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
            <Brain className="w-4 h-4 text-primary" />
            <span>Powered by FalkeAI</span>
          </Badge>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
          <p className="text-sm">{error}</p>
          <button onClick={loadAnalytics} className="text-sm underline mt-1">
            Try again
          </button>
        </div>
      )}

      {/* No Data State */}
      {!hasData ? (
        <NoAnalyticsData />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard
              title="Total Questions"
              value={analytics.overview.totalQuestions}
              trend={analytics.trends.engagementTrend === 'increasing' ? 'up' : 
                     analytics.trends.engagementTrend === 'decreasing' ? 'down' : 'stable'}
              change={analytics.trends.engagementTrend}
              icon={Brain}
              color="text-blue-500"
              bgColor="bg-blue-500/10"
            />
            <KPICard
              title="Topics Mastered"
              value={analytics.overview.topicsMastered}
              icon={Award}
              color="text-green-500"
              bgColor="bg-green-500/10"
            />
            <KPICard
              title="Solution Accuracy"
              value={`${analytics.solutions.averageAccuracy}%`}
              icon={Target}
              color="text-purple-500"
              bgColor="bg-purple-500/10"
            />
            <KPICard
              title="Growth Score"
              value={analytics.trends.growthScore}
              trend={analytics.trends.growthScore > 50 ? 'up' : 'stable'}
              change={analytics.trends.growthScore > 50 ? '+growth' : 'steady'}
              icon={Zap}
              color="text-orange-500"
              bgColor="bg-orange-500/10"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Timeline */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Activity Timeline
                </CardTitle>
                <CardDescription>Your learning activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                {activityTimelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={activityTimelineData}>
                      <defs>
                        <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#3B82F6" 
                        fillOpacity={1} 
                        fill="url(#colorActivity)" 
                        name="Activities" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <p className="text-sm">No activity data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity by Type */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-primary" />
                  Activity Breakdown
                </CardTitle>
                <CardDescription>How you spend your learning time</CardDescription>
              </CardHeader>
              <CardContent>
                {activityByTypeData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={activityByTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {activityByTypeData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {activityByTypeData.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                          />
                          <span className="text-xs truncate">{item.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <p className="text-sm">No activity data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assignment Performance */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Assignment Performance
                </CardTitle>
                <CardDescription>Your assignment completion breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Completed', value: analytics.assignments.graded, color: '#10B981' },
                    { label: 'In Progress', value: analytics.assignments.attempted, color: '#3B82F6' },
                    { label: 'Analyzed', value: analytics.assignments.analyzed, color: '#8B5CF6' },
                    { label: 'Pending', value: analytics.assignments.pending, color: '#F59E0B' },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                          <span className="text-sm font-medium">{stat.label}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{stat.value}</span>
                      </div>
                      <Progress 
                        value={analytics.assignments.total > 0 ? (stat.value / analytics.assignments.total) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-2xl font-bold">{analytics.assignments.completionRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Insights */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Learning Insights
                </CardTitle>
                <CardDescription>Your learning patterns and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Peak Learning Time */}
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Peak Learning Time</span>
                  </div>
                  <p className="text-lg font-bold">{analytics.learning.peakLearningTime}</p>
                </div>

                {/* Average Session */}
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Average Session</span>
                  </div>
                  <p className="text-lg font-bold">{analytics.learning.averageSessionDuration} min</p>
                </div>

                {/* Concepts Mastered */}
                {analytics.learning.conceptsMastered.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4 text-green-500" />
                      Concepts Mastered
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analytics.learning.conceptsMastered.slice(0, 5).map((c, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                      {analytics.learning.conceptsMastered.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{analytics.learning.conceptsMastered.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Areas to Review */}
                {analytics.learning.conceptsToReview.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-500" />
                      Areas to Review
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analytics.learning.conceptsToReview.slice(0, 5).map((c, i) => (
                        <Badge key={i} variant="outline" className="text-xs border-orange-500/30 text-orange-500">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    FalkeAI Insights
                    <Badge className="ml-2 bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                      Live
                    </Badge>
                  </CardTitle>
                  <CardDescription>Personalized recommendations based on your analytics</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Recommended Focus */}
                <motion.div 
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-background/50 border border-primary/20 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="font-medium text-primary">Focus Area</span>
                  </div>
                  <p className="text-sm">{analytics.insights.recommendedFocusArea}</p>
                </motion.div>

                {/* Engagement Trend */}
                <motion.div 
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`p-4 rounded-xl bg-background/50 border transition-colors ${
                    analytics.trends.engagementTrend === 'increasing' 
                      ? 'border-green-500/20 hover:border-green-500/40' 
                      : analytics.trends.engagementTrend === 'decreasing'
                        ? 'border-orange-500/20 hover:border-orange-500/40'
                        : 'border-blue-500/20 hover:border-blue-500/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {analytics.trends.engagementTrend === 'increasing' ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : analytics.trends.engagementTrend === 'decreasing' ? (
                      <TrendingDown className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Activity className="w-5 h-5 text-blue-500" />
                    )}
                    <span className={`font-medium ${
                      analytics.trends.engagementTrend === 'increasing' 
                        ? 'text-green-500' 
                        : analytics.trends.engagementTrend === 'decreasing'
                          ? 'text-orange-500'
                          : 'text-blue-500'
                    }`}>
                      Engagement {analytics.trends.engagementTrend}
                    </span>
                  </div>
                  <p className="text-sm">
                    {analytics.trends.engagementTrend === 'increasing' 
                      ? 'Great job! Your learning activity is on the rise.'
                      : analytics.trends.engagementTrend === 'decreasing'
                        ? 'Try to maintain consistency in your learning sessions.'
                        : 'Your engagement is steady. Keep up the good work!'}
                  </p>
                </motion.div>

                {/* Growth Score */}
                <motion.div 
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 rounded-xl bg-background/50 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <span className="font-medium text-purple-500">Growth Score</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">{analytics.trends.growthScore}</span>
                    <span className="text-sm text-muted-foreground mb-1">/ 100</span>
                  </div>
                  <Progress value={analytics.trends.growthScore} className="h-2 mt-2" />
                </motion.div>
              </div>
              
              {/* Last Updated */}
              <div className="mt-4 pt-3 border-t border-primary/10">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  Analytics last updated: {new Date(analytics.lastUpdated).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  );
}
