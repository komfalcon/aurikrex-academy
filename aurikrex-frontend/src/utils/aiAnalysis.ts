/**
 * AI Analysis Utility
 * 
 * Provides functions for dashboard-wide FalkeAI integration.
 * Used for generating insights, recommendations, and analysis across the dashboard.
 */

import { sendMessage } from './falkeai';
import type { FalkeAIChatPage } from '@/types';

/**
 * Types for AI analysis
 */
export interface UserProgress {
  lessonsCompleted: number;
  totalLessons: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  averageScore: number;
  streak: number;
  subjects: Array<{
    name: string;
    progress: number;
    lessons: number;
    score?: number;
  }>;
}

export interface AIInsight {
  id: string;
  type: 'strength' | 'improvement' | 'suggestion' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable?: boolean;
  action?: string;
}

export interface AIRecommendation {
  id: string;
  type: 'lesson' | 'course' | 'practice' | 'review' | 'break';
  title: string;
  reason: string;
  confidence: number;
  duration?: string;
  subject?: string;
}

export interface LearningAnalysis {
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  summary: string;
  nextSteps: string[];
  strengths: string[];
  areasToImprove: string[];
}

/**
 * Cache for AI analysis results to avoid redundant API calls
 */
const analysisCache = new Map<string, { data: LearningAnalysis; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a cache key from user data
 */
function generateCacheKey(userId: string, dataHash: string): string {
  return `${userId}-${dataHash}`;
}

/**
 * Analyze user progress and generate AI insights
 */
export async function analyzeProgress(
  userId: string,
  username: string,
  progress: UserProgress
): Promise<LearningAnalysis> {
  const dataHash = JSON.stringify(progress).slice(0, 50);
  const cacheKey = generateCacheKey(userId, dataHash);
  
  // Check cache
  const cached = analysisCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  // Build analysis prompt
  const prompt = buildAnalysisPrompt(username, progress);
  
  try {
    const page: FalkeAIChatPage = 'Dashboard';
    const response = await sendMessage(prompt, page, userId, username);
    
    // Parse AI response into structured insights
    const analysis = parseAnalysisResponse(response.reply, progress);
    
    // Cache the result
    analysisCache.set(cacheKey, { data: analysis, timestamp: Date.now() });
    
    return analysis;
  } catch (error) {
    console.error('[AI Analysis] Failed to analyze progress:', error);
    // Return fallback analysis
    return generateFallbackAnalysis(progress);
  }
}

/**
 * Build the analysis prompt for FalkeAI
 */
function buildAnalysisPrompt(username: string, progress: UserProgress): string {
  const subjectSummary = progress.subjects
    .map(s => `${s.name}: ${s.progress}% complete (${s.lessons} lessons)`)
    .join(', ');
    
  return `You are an AI learning coach analyzing ${username}'s learning progress. Please provide a brief, actionable analysis in a friendly tone.

Current Progress:
- Lessons: ${progress.lessonsCompleted}/${progress.totalLessons} completed (${Math.round((progress.lessonsCompleted/progress.totalLessons)*100)}%)
- Assignments: ${progress.assignmentsCompleted}/${progress.totalAssignments} done
- Average Score: ${progress.averageScore}%
- Current Streak: ${progress.streak} days
- Subjects: ${subjectSummary}

Please provide:
1. One key strength based on the data
2. One specific area to focus on
3. One personalized recommendation for today

Keep response under 200 words, focus on actionable insights.`;
}

/**
 * Parse AI response into structured analysis
 */
function parseAnalysisResponse(reply: string, progress: UserProgress): LearningAnalysis {
  // Extract insights from the AI response
  const insights: AIInsight[] = [];
  const recommendations: AIRecommendation[] = [];
  const strengths: string[] = [];
  const areasToImprove: string[] = [];
  const nextSteps: string[] = [];
  
  // Generate insights based on progress data + AI response
  
  // Strength insight
  const bestSubject = progress.subjects.reduce((a, b) => a.progress > b.progress ? a : b);
  strengths.push(`Strong performance in ${bestSubject.name}`);
  insights.push({
    id: 'strength-1',
    type: 'strength',
    title: `Excelling in ${bestSubject.name}`,
    description: `You've completed ${bestSubject.progress}% of ${bestSubject.name} lessons. Keep up the great work!`,
    priority: 'medium',
    actionable: false,
  });
  
  // Improvement insight
  const weakestSubject = progress.subjects.reduce((a, b) => a.progress < b.progress ? a : b);
  if (weakestSubject.progress < 50) {
    areasToImprove.push(`Focus more on ${weakestSubject.name}`);
    insights.push({
      id: 'improvement-1',
      type: 'improvement',
      title: `${weakestSubject.name} Needs Attention`,
      description: `Only ${weakestSubject.progress}% complete. Try dedicating 30 minutes today.`,
      priority: 'high',
      actionable: true,
      action: `Study ${weakestSubject.name}`,
    });
  }
  
  // Streak insight
  if (progress.streak >= 7) {
    insights.push({
      id: 'streak-1',
      type: 'strength',
      title: `${progress.streak}-Day Streak! 🔥`,
      description: `Amazing consistency! You're building strong learning habits.`,
      priority: 'low',
      actionable: false,
    });
  }
  
  // Recommendations based on progress
  recommendations.push({
    id: 'rec-1',
    type: 'lesson',
    title: `Continue ${weakestSubject.name}`,
    reason: 'Based on your progress, this will help balance your knowledge',
    confidence: 85,
    duration: '30 min',
    subject: weakestSubject.name,
  });
  
  recommendations.push({
    id: 'rec-2',
    type: 'practice',
    title: `${bestSubject.name} Advanced Practice`,
    reason: 'Challenge yourself in your strongest subject',
    confidence: 78,
    duration: '20 min',
    subject: bestSubject.name,
  });
  
  // Next steps
  nextSteps.push(`Complete one more ${weakestSubject.name} lesson`);
  nextSteps.push(`Maintain your ${progress.streak}-day streak`);
  if (progress.assignmentsCompleted < progress.totalAssignments) {
    nextSteps.push('Submit pending assignments before deadlines');
  }
  
  return {
    insights,
    recommendations,
    summary: reply || 'Keep up the great learning momentum!',
    nextSteps,
    strengths,
    areasToImprove,
  };
}

/**
 * Generate fallback analysis when AI is unavailable
 */
function generateFallbackAnalysis(progress: UserProgress): LearningAnalysis {
  const completionRate = Math.round((progress.lessonsCompleted / progress.totalLessons) * 100);
  const bestSubject = progress.subjects.reduce((a, b) => a.progress > b.progress ? a : b);
  const weakestSubject = progress.subjects.reduce((a, b) => a.progress < b.progress ? a : b);
  
  return {
    insights: [
      {
        id: 'fallback-1',
        type: 'strength',
        title: `${bestSubject.name} Excellence`,
        description: `You're performing well in ${bestSubject.name} with ${bestSubject.progress}% progress.`,
        priority: 'medium',
        actionable: false,
      },
      {
        id: 'fallback-2',
        type: 'improvement',
        title: 'Focus Area Identified',
        description: `Consider spending more time on ${weakestSubject.name} to improve.`,
        priority: 'high',
        actionable: true,
        action: `Study ${weakestSubject.name}`,
      },
      {
        id: 'fallback-3',
        type: 'suggestion',
        title: 'Keep Your Streak',
        description: `You're on a ${progress.streak}-day streak. Study today to maintain it!`,
        priority: 'low',
        actionable: false,
      },
    ],
    recommendations: [
      {
        id: 'rec-fallback-1',
        type: 'lesson',
        title: `${weakestSubject.name} Lesson`,
        reason: 'Improve your understanding in this subject',
        confidence: 80,
        duration: '30 min',
        subject: weakestSubject.name,
      },
    ],
    summary: `You've completed ${completionRate}% of your lessons with an average score of ${progress.averageScore}%. Great progress!`,
    nextSteps: [
      `Continue learning ${weakestSubject.name}`,
      'Complete pending assignments',
      'Review difficult topics',
    ],
    strengths: [bestSubject.name],
    areasToImprove: [weakestSubject.name],
  };
}

/**
 * Get quick AI recommendation for next learning action
 */
export async function getQuickRecommendation(
  userId: string,
  username: string,
  currentSubject?: string
): Promise<string> {
  try {
    const prompt = currentSubject
      ? `Give me a one-sentence tip for studying ${currentSubject} effectively.`
      : `Give me a one-sentence motivational tip for learning today.`;
      
    const page: FalkeAIChatPage = 'Dashboard';
    const response = await sendMessage(prompt, page, userId, username);
    return response.reply;
  } catch (error) {
    console.error('[AI Analysis] Failed to get recommendation:', error);
    return currentSubject
      ? `Focus on understanding the core concepts of ${currentSubject} before moving to advanced topics.`
      : 'Take small steps consistently - 30 minutes of focused study is better than hours of distracted learning.';
  }
}

/**
 * Clear the analysis cache
 */
export function clearAnalysisCache(): void {
  analysisCache.clear();
}

export default {
  analyzeProgress,
  getQuickRecommendation,
  clearAnalysisCache,
};
