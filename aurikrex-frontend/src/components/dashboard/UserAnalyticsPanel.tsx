/**
 * User Analytics Panel Component
 * 
 * Displays user-specific analytics based on real event data.
 * Phase 1 Metrics:
 * - Total Questions (chat events)
 * - Daily Streak (consecutive days)
 * - Total Days Spent (distinct activity dates)
 * - Activity Timeline (activity grouped by date)
 * - Daily Breakdown (count by type for today)
 * 
 * Extended Metrics (Phase 2):
 * - Learning insights (peak learning time, session length)
 * - Assignment performance
 * - FalkeAI insights (strengths, weaknesses, growth score)
 * - Topics mastered
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Flame,
  Calendar,
  Activity,
  LogIn,
  Library,
  Upload,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Loader2,
  Target,
  Award,
  Clock,
  Brain,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
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
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { getUserAnalytics, getExtendedUserAnalytics } from '@/utils/userAnalyticsApi';
import type { ExtendedUserAnalyticsData } from '@/types';

// Poll interval for auto-refresh (5 minutes)
const POLL_INTERVAL_MS = 5 * 60 * 1000;

// Empty state for no data
function NoAnalyticsData() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/20"
    >
      <div className="p-4 rounded-2xl bg-primary/10 mb-4">
        <Activity className="w-10 h-10 text-primary" />
      </div>
      <h3 className="font-semibold text-xl mb-2">No Activity Yet</h3>
      <p className="text-muted-foreground text-sm max-w-md">
        Start learning to see your activity analytics. Your questions, logins, and library usage will appear here.
      </p>
    </motion.div>
  );
}

// Loading skeleton
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
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

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bgColor,
  description,
}: { 
  title: string; 
  value: string | number; 
  icon: typeof Activity; 
  color: string; 
  bgColor: string;
  description?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
    >
      <Card className="border-border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <h3 className="text-3xl font-bold mt-2">{value}</h3>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
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

// Daily Breakdown Bar
function DailyBreakdownCard({ breakdown }: { breakdown: UserAnalyticsData['dailyBreakdown'] }) {
  const data = [
    { name: 'Chat', value: breakdown.chat, color: '#3B82F6', icon: MessageSquare },
    { name: 'Login', value: breakdown.login, color: '#10B981', icon: LogIn },
    { name: 'Library', value: breakdown.library_view, color: '#8B5CF6', icon: Library },
    { name: 'Upload', value: breakdown.book_upload, color: '#F59E0B', icon: Upload },
  ];

  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Today's Activity
        </CardTitle>
        <CardDescription>Your activity breakdown for today</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <p className="text-sm">No activity today yet</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={60} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {data.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className="text-xs">{item.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// FalkeAI Insights Card
function FalkeAIInsightsCard({ insights }: { insights: ExtendedUserAnalyticsData['falkeAIInsights'] }) {
  if (!insights) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            FalkeAI Insights
          </CardTitle>
          <CardDescription>AI-powered learning analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Not enough data yet. Keep learning!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trendIcon = insights.engagementTrend === 'increasing' 
    ? <TrendingUp className="w-4 h-4 text-green-500" /> 
    : insights.engagementTrend === 'decreasing'
    ? <TrendingDown className="w-4 h-4 text-red-500" />
    : <Activity className="w-4 h-4 text-yellow-500" />;

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          FalkeAI Insights
        </CardTitle>
        <CardDescription>AI-powered learning analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Growth Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Growth Score</span>
            <span className="text-sm font-bold text-primary">{insights.growthScore}%</span>
          </div>
          <Progress value={insights.growthScore} className="h-2" />
        </div>

        {/* Engagement Trend */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
          <span className="text-sm">Engagement Trend</span>
          <div className="flex items-center gap-2">
            {trendIcon}
            <span className="text-sm font-medium capitalize">{insights.engagementTrend}</span>
          </div>
        </div>

        {/* Focus Area */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Focus Area</span>
          </div>
          <p className="text-sm text-muted-foreground">{insights.focusArea}</p>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" /> Strengths
            </p>
            <div className="flex flex-wrap gap-1">
              {insights.strengths.length > 0 ? (
                insights.strengths.slice(0, 3).map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                    {s}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Building...</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-orange-500" /> To Improve
            </p>
            <div className="flex flex-wrap gap-1">
              {insights.weaknesses.length > 0 ? (
                insights.weaknesses.slice(0, 3).map((w, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-orange-500/10 text-orange-600">
                    {w}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Great job!</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Assignment Performance Card
function AssignmentPerformanceCard({ performance }: { performance: ExtendedUserAnalyticsData['assignmentPerformance'] }) {
  if (!performance) {
    return null;
  }

  const total = performance.completed + performance.inProgress + performance.pending;
  const completionRate = total > 0 ? Math.round((performance.completed / total) * 100) : 0;

  const pieData = [
    { name: 'Completed', value: performance.completed, color: '#10B981' },
    { name: 'In Progress', value: performance.inProgress, color: '#3B82F6' },
    { name: 'Pending', value: performance.pending, color: '#6B7280' },
  ].filter(d => d.value > 0);

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Assignments
        </CardTitle>
        <CardDescription>Track your assignment progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 ? (
          <div className="h-[150px] flex items-center justify-center text-muted-foreground">
            <p className="text-sm">No assignments yet</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={40}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completed</span>
                  <span className="text-sm font-medium text-green-500">{performance.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">In Progress</span>
                  <span className="text-sm font-medium text-blue-500">{performance.inProgress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending</span>
                  <span className="text-sm font-medium text-gray-500">{performance.pending}</span>
                </div>
              </div>
            </div>
            
            {/* Accuracy */}
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Solution Accuracy</span>
                <span className="text-sm font-bold">{performance.accuracy}%</span>
              </div>
              <Progress value={performance.accuracy} className="h-2" />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Learning Insights Card
function LearningInsightsCard({ 
  insights, 
  topicsMastered 
}: { 
  insights: ExtendedUserAnalyticsData['learningInsights'];
  topicsMastered: string[];
}) {
  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Learning Insights
        </CardTitle>
        <CardDescription>Your learning patterns and achievements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Peak Time</span>
                </div>
                <p className="text-sm font-medium">{insights.peakLearningTime}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Avg Session</span>
                </div>
                <p className="text-sm font-medium">{insights.averageSessionLength} min</p>
              </div>
            </div>
          </>
        )}

        {/* Topics Mastered */}
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Topics Mastered ({topicsMastered.length})
          </p>
          {topicsMastered.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topicsMastered.slice(0, 6).map((topic, i) => (
                <Badge key={i} variant="outline" className="bg-green-500/10 border-green-500/20">
                  {topic}
                </Badge>
              ))}
              {topicsMastered.length > 6 && (
                <Badge variant="outline">+{topicsMastered.length - 6} more</Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Complete lessons to master topics!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserAnalyticsPanel() {
  const { user } = useAuth();
  
  const [analytics, setAnalytics] = useState<ExtendedUserAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights'>('overview');

  // Load extended analytics
  const loadAnalytics = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setError(null);
      // Try to get extended analytics first, fall back to basic if not available
      try {
        const data = await getExtendedUserAnalytics();
        setAnalytics(data);
      } catch {
        // Fall back to basic analytics
        const basicData = await getUserAnalytics();
        setAnalytics(basicData);
      }
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
      await loadAnalytics();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial load and polling
  useEffect(() => {
    loadAnalytics();

    // Polling for updates
    const pollInterval = setInterval(() => {
      loadAnalytics();
    }, POLL_INTERVAL_MS);

    return () => {
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
              Your Analytics
            </h1>
            <p className="text-muted-foreground">Loading your activity data...</p>
          </div>
        </div>
        <AnalyticsSkeleton />
      </motion.div>
    );
  }

  // Check if there's any data
  const hasData = analytics && (
    analytics.totalQuestions > 0 || 
    analytics.totalDaysSpent > 0 ||
    analytics.dailyStreak > 0
  );

  // Prepare timeline data with locale-aware date formatting
  const timelineData = analytics?.activityTimeline.map(d => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count: d.count,
  })) || [];

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
            Your Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your learning activity and progress
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
            title="Refresh analytics"
          >
            {isRefreshing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </button>
          <Badge className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
            <Activity className="w-4 h-4 text-primary" />
            <span>Live Data</span>
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
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <StatCard
              title="Total Questions"
              value={analytics?.totalQuestions || 0}
              icon={MessageSquare}
              color="text-blue-500"
              bgColor="bg-blue-500/10"
              description="Questions asked to FalkeAI"
            />
            <StatCard
              title="Daily Streak"
              value={analytics?.dailyStreak || 0}
              icon={Flame}
              color="text-orange-500"
              bgColor="bg-orange-500/10"
              description={analytics?.dailyStreak ? `${analytics.dailyStreak} days in a row!` : 'Start your streak today'}
            />
            <StatCard
              title="Total Days Active"
              value={analytics?.totalDaysSpent || 0}
              icon={Calendar}
              color="text-green-500"
              bgColor="bg-green-500/10"
              description="Days you've been learning"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Timeline */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Activity Timeline
                </CardTitle>
                <CardDescription>Your learning activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="colorUserActivity" x1="0" y1="0" x2="0" y2="1">
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
                        fill="url(#colorUserActivity)" 
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

            {/* Daily Breakdown */}
            {analytics && (
              <DailyBreakdownCard breakdown={analytics.dailyBreakdown} />
            )}
          </div>

          {/* Extended Analytics Section */}
          {(analytics?.falkeAIInsights || analytics?.assignmentPerformance || analytics?.learningInsights) && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Deep Insights
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* FalkeAI Insights */}
                <FalkeAIInsightsCard insights={analytics?.falkeAIInsights} />
                
                {/* Learning Insights */}
                <LearningInsightsCard 
                  insights={analytics?.learningInsights} 
                  topicsMastered={analytics?.topicsMastered || []} 
                />
                
                {/* Assignment Performance */}
                {analytics?.assignmentPerformance && (
                  <AssignmentPerformanceCard performance={analytics.assignmentPerformance} />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
