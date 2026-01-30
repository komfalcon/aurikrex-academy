/**
 * Assignments Panel Component
 * 
 * CORRECTED: Students upload THEIR OWN questions, FalkeAI helps them solve.
 * Structure:
 * - Sidebar: Upload Question | My Solutions | History
 * - Main Content: Changes based on selected section
 * 
 * Flow:
 * 1. Upload Question → FalkeAI analyzes → Provides HINTS (no full solution)
 * 2. Upload Solution → FalkeAI reviews → Full feedback + correct solution revealed
 * 
 * NO MOCK DATA - all data from backend APIs.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ClipboardCheck,
  Upload,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  Send,
  X,
  ChevronRight,
  Lightbulb,
  Target,
  Award,
  RefreshCw,
  Eye,
  History,
  Plus,
  ArrowLeft,
  BookOpen,
  HelpCircle,
  FileQuestion,
  CheckSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import {
  createAssignment,
  getAssignments,
  getAssignment,
  analyzeAssignment,
  getAssignmentStats,
  submitSolution,
  verifySolution,
  getSolutions,
} from '@/utils/assignmentApi';
import type { Assignment, Solution, AssignmentStats, SolutionVerification } from '@/types';

// Import chat-based components for Assignment Tab
import { UploadQuestionChat, UploadSolutionChat, AssignmentHistory } from '@/components/assignment';

// Empty state component
function EmptyAssignments({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center bg-card/50 rounded-2xl border border-border"
    >
      <div className="p-4 rounded-2xl bg-secondary/50 mb-4">
        <ClipboardCheck className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">No assignments yet</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-4">
        Upload an assignment or type a problem to get started. FalkeAI will analyze it and provide helpful hints.
      </p>
      <button
        onClick={onCreateNew}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Create First Assignment
      </button>
    </motion.div>
  );
}

// Loading skeleton
function AssignmentsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 bg-secondary/50 rounded-xl" />
      <div className="h-20 bg-secondary/50 rounded-xl" />
      <div className="h-20 bg-secondary/50 rounded-xl" />
    </div>
  );
}

// Status configuration
const statusConfig = {
  pending: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Pending Analysis' },
  analyzed: { icon: Brain, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Analyzed' },
  attempted: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Attempted' },
  submitted: { icon: Send, color: 'text-cyan-500', bg: 'bg-cyan-500/10', label: 'Submitted' },
  graded: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Completed' },
};

// Assignment card component
function AssignmentCard({ 
  assignment, 
  isSelected,
  onClick 
}: { 
  assignment: Assignment; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const config = statusConfig[assignment.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <motion.div
      whileHover={!shouldReduceMotion ? { x: 4 } : {}}
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected 
          ? 'border-primary bg-primary/5 ring-2 ring-primary' 
          : 'border-border bg-card/50 hover:bg-secondary/50'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{assignment.title}</h4>
          <p className="text-xs text-muted-foreground">
            {assignment.analysis?.type || assignment.assignmentType}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <StatusIcon className={`w-4 h-4 ${config.color}`} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">{config.label}</Badge>
        {assignment.analysis?.estimatedDifficulty && (
          <Badge variant="secondary" className="text-xs capitalize">
            {assignment.analysis.estimatedDifficulty}
          </Badge>
        )}
      </div>
      {assignment.deadline && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Due: {new Date(assignment.deadline).toLocaleDateString()}
        </p>
      )}
    </motion.div>
  );
}

// Solution verification display
function VerificationDisplay({ verification }: { verification: SolutionVerification }) {
  return (
    <div className="space-y-4">
      {/* Accuracy Score */}
      <div className="p-4 rounded-xl bg-secondary/50">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Accuracy Score</span>
          <span className={`text-2xl font-bold ${
            verification.accuracy >= 80 ? 'text-green-500' : 
            verification.accuracy >= 60 ? 'text-orange-500' : 'text-red-500'
          }`}>
            {verification.accuracy}%
          </span>
        </div>
        <Progress value={verification.accuracy} className="h-2" />
      </div>

      {/* Feedback */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm">{verification.feedback}</p>
      </div>

      {/* Strengths */}
      {verification.strengths.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-green-500 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            What You Did Well
          </h4>
          <ul className="space-y-1">
            {verification.strengths.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-green-500">✓</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {verification.weaknesses.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-orange-500 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Areas for Improvement
          </h4>
          <ul className="space-y-1">
            {verification.weaknesses.map((w, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-orange-500">•</span> {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors */}
      {verification.errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-red-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Errors Found
          </h4>
          <div className="space-y-2">
            {verification.errors.map((error, i) => (
              <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-sm">
                <p className="font-medium text-red-500">{error.type}: {error.issue}</p>
                <p className="text-muted-foreground mt-1">{error.explanation}</p>
                <p className="text-green-600 mt-1">
                  <strong>Fix:</strong> {error.correction}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correct Solution */}
      <div className="space-y-2">
        <h4 className="font-medium text-blue-500 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Correct Solution
        </h4>
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <p className="text-sm whitespace-pre-wrap">{verification.correctSolution.explanation}</p>
          {verification.correctSolution.alternativeApproaches && 
           verification.correctSolution.alternativeApproaches.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-500/20">
              <p className="text-xs font-medium text-blue-500 mb-1">Alternative Approaches:</p>
              <ul className="text-xs text-muted-foreground">
                {verification.correctSolution.alternativeApproaches.map((a, i) => (
                  <li key={i}>• {a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Next Steps */}
      {verification.nextSteps.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            Next Steps
          </h4>
          <ul className="space-y-1">
            {verification.nextSteps.map((step, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="font-medium">{i + 1}.</span> {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Sidebar section type - matches the spec
type SidebarSection = 'upload-question' | 'my-solutions' | 'history';

// Sub-view within each section
type SubView = 'list' | 'detail' | 'create';

// Sidebar navigation items
const sidebarItems: Array<{
  id: SidebarSection;
  label: string;
  icon: typeof Upload;
  description: string;
}> = [
  { 
    id: 'upload-question', 
    label: 'Upload Question', 
    icon: FileQuestion,
    description: 'Upload your questions for FalkeAI hints'
  },
  { 
    id: 'my-solutions', 
    label: 'My Solutions', 
    icon: CheckSquare,
    description: 'Submit and review your solutions'
  },
  { 
    id: 'history', 
    label: 'History', 
    icon: History,
    description: 'View all past questions and solutions'
  },
];

// Sidebar component
function AssignmentsSidebar({ 
  activeSection, 
  setActiveSection,
  stats 
}: { 
  activeSection: SidebarSection;
  setActiveSection: (section: SidebarSection) => void;
  stats: AssignmentStats | null;
}) {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <div className="w-full lg:w-64 space-y-2">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        
        // Show count badge for each section
        let count: number | undefined;
        if (stats) {
          if (item.id === 'upload-question') count = stats.analyzed + stats.pending;
          else if (item.id === 'my-solutions') count = stats.attempted + stats.graded;
          else if (item.id === 'history') count = stats.total;
        }
        
        return (
          <motion.button
            key={item.id}
            whileHover={!shouldReduceMotion ? { x: 2 } : {}}
            whileTap={!shouldReduceMotion ? { scale: 0.98 } : {}}
            onClick={() => setActiveSection(item.id)}
            className={`
              w-full p-4 rounded-xl border text-left transition-all
              ${isActive 
                ? 'border-primary bg-primary/5 ring-2 ring-primary shadow-md' 
                : 'border-border bg-card/50 hover:bg-secondary/50 hover:border-primary/30'}
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`font-medium ${isActive ? 'text-primary' : ''}`}>
                  {item.label}
                </span>
              </div>
              {count !== undefined && count > 0 && (
                <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                  {count}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground ml-11">{item.description}</p>
          </motion.button>
        );
      })}
      
      {/* Stats Summary */}
      {stats && (
        <Card className="border-border mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Questions Analyzed</span>
              <span className="font-medium">{stats.analyzed}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Solutions Submitted</span>
              <span className="font-medium">{stats.attempted + stats.graded}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-medium text-green-500">{stats.graded}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AssignmentsPanelReal() {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const solutionFileInputRef = useRef<HTMLInputElement>(null);

  // Navigation state - sidebar section + sub-view
  const [activeSection, setActiveSection] = useState<SidebarSection>('upload-question');
  const [subView, setSubView] = useState<SubView>('list');
  
  // Data state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allSolutions, setAllSolutions] = useState<Solution[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSolutions, setSelectedSolutions] = useState<Solution[]>([]);
  const [stats, setStats] = useState<AssignmentStats | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for uploading questions
  const [questionText, setQuestionText] = useState('');
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionFiles, setQuestionFiles] = useState<File[]>([]);
  
  // Form state for uploading solutions
  const [solutionText, setSolutionText] = useState('');
  const [solutionFiles, setSolutionFiles] = useState<File[]>([]);
  const [selectedQuestionForSolution, setSelectedQuestionForSolution] = useState<Assignment | null>(null);
  
  // Chat integration state - tracks the most recently uploaded question ID for the solution chat
  const [chatQuestionId, setChatQuestionId] = useState<string | null>(null);

  const ACCEPTED_FILE_TYPES = ".txt,.pdf,.docx,.doc,.png,.jpg,.jpeg";

  // Load all data
  const loadAllData = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const [assignmentsResult, statsResult, solutionsResult] = await Promise.all([
        getAssignments({ sortBy: 'createdAt', sortOrder: 'desc' }),
        getAssignmentStats(),
        getSolutions({ limit: 100 }),
      ]);
      setAssignments(assignmentsResult.assignments);
      setStats(statsResult);
      setAllSolutions(solutionsResult.solutions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Load single assignment with its solutions
  const loadQuestionDetail = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const result = await getAssignment(id);
      setSelectedAssignment(result.assignment);
      setSelectedSolutions(result.solutions);
      setSubView('detail');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle file upload for questions
  const handleQuestionFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ['txt', 'pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg'].includes(ext || '');
      });
      setQuestionFiles(prev => [...prev, ...validFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle file upload for solutions
  const handleSolutionFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ['txt', 'pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg'].includes(ext || '');
      });
      setSolutionFiles(prev => [...prev, ...validFiles]);
    }
    if (solutionFileInputRef.current) solutionFileInputRef.current.value = '';
  };

  // Upload and analyze a new question
  const handleUploadQuestion = async () => {
    if (!user?.uid || (!questionText.trim() && questionFiles.length === 0)) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Create assignment (question)
      const question = await createAssignment({
        title: questionTitle || 'My Question',
        description: questionText,
        assignmentType: questionFiles.length > 0 ? 'upload' : 'text',
        textContent: questionText,
      });

      // Immediately analyze with FalkeAI
      setIsAnalyzing(true);
      const analyzed = await analyzeAssignment(question._id);

      // Reset form
      setQuestionText('');
      setQuestionTitle('');
      setQuestionFiles([]);
      
      // Show the analyzed question with hints
      setSelectedAssignment(analyzed);
      setSelectedSolutions([]);
      setSubView('detail');
      
      // Refresh data
      loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload question');
    } finally {
      setIsSubmitting(false);
      setIsAnalyzing(false);
    }
  };

  // Submit solution for verification
  const handleSubmitSolution = async () => {
    const targetQuestion = selectedQuestionForSolution || selectedAssignment;
    if (!user?.uid || !targetQuestion || (!solutionText.trim() && solutionFiles.length === 0)) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Submit solution
      const solution = await submitSolution({
        assignmentId: targetQuestion._id,
        solutionType: solutionFiles.length > 0 ? 'file' : 'text',
        textContent: solutionText,
      });

      // Verify solution with FalkeAI
      setIsVerifying(true);
      const verified = await verifySolution(solution._id);

      // Update solutions list
      setSelectedSolutions(prev => [...prev, verified]);
      
      // Reset form
      setSolutionText('');
      setSolutionFiles([]);
      setSelectedQuestionForSolution(null);
      
      // Refresh data
      loadAllData();
      
      // If in detail view, reload
      if (selectedAssignment) {
        loadQuestionDetail(selectedAssignment._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit solution');
    } finally {
      setIsSubmitting(false);
      setIsVerifying(false);
    }
  };

  // Reset to list view
  const goBack = () => {
    setSubView('list');
    setSelectedAssignment(null);
    setSelectedSolutions([]);
  };

  // Render error state
  const renderError = () => (
    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">Error</span>
      </div>
      <p className="text-sm">{error}</p>
      <button 
        onClick={() => { setError(null); loadAllData(); }}
        className="mt-2 text-sm underline"
      >
        Try again
      </button>
    </div>
  );

  // Render Upload Question section
  const renderUploadQuestion = () => {
    if (subView === 'detail' && selectedAssignment) {
      // Show question analysis with hints
      return (
        <div className="space-y-6">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to questions
          </button>

          <Card className="border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileQuestion className="w-5 h-5 text-primary" />
                    {selectedAssignment.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {selectedAssignment.analysis?.type && (
                      <Badge variant="secondary" className="capitalize mr-2">
                        {selectedAssignment.analysis.type}
                      </Badge>
                    )}
                    {selectedAssignment.analysis?.estimatedDifficulty && (
                      <Badge variant="outline" className="capitalize">
                        {selectedAssignment.analysis.estimatedDifficulty}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <Badge className={statusConfig[selectedAssignment.status]?.bg}>
                  {statusConfig[selectedAssignment.status]?.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Original question content */}
              {selectedAssignment.textContent && (
                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Your Question
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedAssignment.textContent}</p>
                </div>
              )}

              {/* FalkeAI Analysis - HINTS ONLY (no full solution) */}
              {selectedAssignment.analysis && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    FalkeAI Hints & Guidance
                    <Badge variant="outline" className="ml-2 text-xs">
                      Hints only - work on it yourself!
                    </Badge>
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {selectedAssignment.analysis.description}
                  </p>

                  {/* Hints Section */}
                  {selectedAssignment.analysis.hints && (
                    <div className="space-y-3">
                      {/* Concepts to Know */}
                      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                        <h4 className="font-medium text-blue-500 mb-2 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Concepts You'll Need
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedAssignment.analysis.hints.conceptsInvolved.map((c, i) => (
                            <Badge key={i} variant="secondary">{c}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Approach Suggestion */}
                      <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                        <h4 className="font-medium text-purple-500 mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Suggested Approach
                        </h4>
                        <p className="text-sm">{selectedAssignment.analysis.hints.approachSuggestion}</p>
                      </div>

                      {/* Step-by-Step Hints */}
                      {selectedAssignment.analysis.hints.stepByStep.length > 0 && (
                        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                          <h4 className="font-medium text-green-500 mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Step-by-Step Hints
                          </h4>
                          <div className="space-y-3">
                            {selectedAssignment.analysis.hints.stepByStep.map((step) => (
                              <div key={step.stepNumber} className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {step.stepNumber}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{step.guidance}</p>
                                  <p className="text-xs text-muted-foreground italic mt-1">
                                    💭 Think: {step.keyThink}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Common Mistakes */}
                      {selectedAssignment.analysis.hints.commonMistakes.length > 0 && (
                        <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                          <h4 className="font-medium text-orange-500 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Common Mistakes to Avoid
                          </h4>
                          <ul className="space-y-1">
                            {selectedAssignment.analysis.hints.commonMistakes.map((m, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-orange-500">⚠</span> {m}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Resources */}
                      {selectedAssignment.analysis.hints.resources.length > 0 && (
                        <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                          <h4 className="font-medium text-cyan-500 mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Resources to Review
                          </h4>
                          <ul className="space-y-1">
                            {selectedAssignment.analysis.hints.resources.map((r, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-cyan-500">📚</span> {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Estimated time */}
                  {selectedAssignment.analysis.estimatedTime && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Estimated time: {selectedAssignment.analysis.estimatedTime} minutes
                    </p>
                  )}
                </div>
              )}

              {/* Ready to submit solution? */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-2">Ready to submit your solution?</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Work through the problem using the hints above, then submit your solution to get full feedback!
                  </p>
                  <button
                    onClick={() => {
                      setSelectedQuestionForSolution(selectedAssignment);
                      setActiveSection('my-solutions');
                      setSubView('create');
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit My Solution
                  </button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Chat view for uploading questions - use the UploadQuestionChat component
    return (
      <div className="space-y-6">
        {/* Chat-based Question Upload Interface */}
        <div className="min-h-[500px] h-[60vh] max-h-[700px]">
          <UploadQuestionChat
            onQuestionUploaded={(questionId) => {
              // Track the question ID for the solution chat
              setChatQuestionId(questionId);
              // Update the selected question state and refresh data
              loadQuestionDetail(questionId).catch(() => {
                // Error is already handled in loadQuestionDetail
              });
              loadAllData();
            }}
          />
        </div>

        {/* List of Previous Questions */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-primary" />
              My Questions
            </CardTitle>
            <CardDescription>
              Questions you've uploaded for analysis - click to view details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileQuestion className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No questions uploaded yet</p>
                <p className="text-xs mt-1">Use the chat above to upload your first question</p>
              </div>
            ) : (
              assignments.map((assignment) => (
                <AssignmentCard
                  key={assignment._id}
                  assignment={assignment}
                  isSelected={chatQuestionId === assignment._id}
                  onClick={() => {
                    setChatQuestionId(assignment._id);
                    loadQuestionDetail(assignment._id).catch(() => {
                      // Error is already handled in loadQuestionDetail
                    });
                  }}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render My Solutions section  
  const renderMySolutions = () => {
    if (subView === 'create' || selectedQuestionForSolution) {
      // Show solution submission form
      return (
        <div className="space-y-6">
          <button
            onClick={() => {
              setSubView('list');
              setSelectedQuestionForSolution(null);
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to solutions
          </button>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Submit Your Solution
              </CardTitle>
              <CardDescription>
                {selectedQuestionForSolution 
                  ? `Submitting solution for: ${selectedQuestionForSolution.title}`
                  : 'Select a question and submit your solution for FalkeAI verification'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Select question if not pre-selected */}
              {!selectedQuestionForSolution && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Question</label>
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {assignments.filter(a => a.status === 'analyzed').map((assignment) => (
                      <button
                        key={assignment._id}
                        onClick={() => setSelectedQuestionForSolution(assignment)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedQuestionForSolution?._id === assignment._id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-secondary/50'
                        }`}
                      >
                        <p className="font-medium text-sm">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {assignment.textContent?.substring(0, 100)}...
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Show selected question */}
              {selectedQuestionForSolution && (
                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{selectedQuestionForSolution.title}</h4>
                    <button
                      onClick={() => setSelectedQuestionForSolution(null)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedQuestionForSolution.textContent?.substring(0, 150)}...
                  </p>
                </div>
              )}

              {/* Solution content */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Solution</label>
                <textarea
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  placeholder="Type your solution here. Show all your work and explain your reasoning..."
                  className="w-full min-h-[200px] p-4 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-y text-sm"
                />
              </div>

              {/* File upload for solution */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Or Upload Solution File</label>
                <div
                  onClick={() => solutionFileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm">Upload solution files</p>
                </div>
                <input
                  ref={solutionFileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  multiple
                  className="hidden"
                  onChange={handleSolutionFileUpload}
                />

                {solutionFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {solutionFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                        <button
                          onClick={() => setSolutionFiles(prev => prev.filter((_, i) => i !== index))}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitSolution}
                  disabled={isSubmitting || isVerifying || !selectedQuestionForSolution || (!solutionText.trim() && solutionFiles.length === 0)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow transition-all flex items-center gap-2"
                >
                  {isSubmitting || isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isVerifying ? 'Verifying...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit & Verify
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (subView === 'detail' && selectedAssignment) {
      // Show solution verification results
      const latestSolution = selectedSolutions[selectedSolutions.length - 1];
      
      return (
        <div className="space-y-6">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to solutions
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main: Verification Results */}
            <div className="lg:col-span-2">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    FalkeAI Verification
                  </CardTitle>
                  <CardDescription>
                    Complete solution review for: {selectedAssignment.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {latestSolution?.verification ? (
                    <VerificationDisplay verification={latestSolution.verification} />
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No verification results yet. Submit a solution to get feedback.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar: Solution History */}
            <div className="lg:col-span-1">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Attempt History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSolutions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No attempts yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedSolutions.map((solution) => (
                        <div key={solution._id} className="p-3 rounded-xl bg-secondary/30 border border-border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Attempt #{solution.attempt}</span>
                            {solution.verification && (
                              <Badge className={solution.verification.isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}>
                                {solution.verification.accuracy}%
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(solution.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Try Again */}
                  <button
                    onClick={() => {
                      setSelectedQuestionForSolution(selectedAssignment);
                      setSubView('create');
                    }}
                    className="w-full mt-4 px-4 py-2 rounded-xl border border-primary text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    // Chat-based view for uploading solutions
    return (
      <div className="space-y-6">
        {/* Chat-based Solution Upload Interface */}
        <div className="min-h-[500px] h-[60vh] max-h-[700px]">
          <UploadSolutionChat
            questionId={chatQuestionId || selectedAssignment?._id || null}
            onSolutionVerified={() => {
              // Refresh the data after solution is verified
              loadAllData();
            }}
          />
        </div>

        {/* Question Selection for Solutions */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              Select Question
            </CardTitle>
            <CardDescription>
              Select a question to submit your solution for. Click on any analyzed question below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignments.filter(a => a.status === 'analyzed').length === 0 ? (
              <div className="text-center py-8">
                <FileQuestion className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No analyzed questions yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a question first in the "Upload Question" tab
                </p>
              </div>
            ) : (
              assignments.filter(a => a.status === 'analyzed').map((assignment) => (
                <AssignmentCard
                  key={assignment._id}
                  assignment={assignment}
                  isSelected={chatQuestionId === assignment._id}
                  onClick={() => {
                    setChatQuestionId(assignment._id);
                    setSelectedAssignment(assignment);
                  }}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* List of Previously Submitted Solutions */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              My Solutions
            </CardTitle>
            <CardDescription>
              View your submitted solutions and FalkeAI feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignments.filter(a => a.solutionIds.length > 0).length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No solutions submitted yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Submit your first solution above
                </p>
              </div>
            ) : (
              assignments.filter(a => a.solutionIds.length > 0).map((assignment) => (
                <AssignmentCard
                  key={assignment._id}
                  assignment={assignment}
                  isSelected={false}
                  onClick={() => {
                    loadQuestionDetail(assignment._id)
                      .then(() => setActiveSection('my-solutions'))
                      .catch(() => {
                        // Error is already handled in loadQuestionDetail
                      });
                  }}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render History section - use the AssignmentHistory chat component
  const renderHistory = () => {
    return (
      <div className="min-h-[600px] h-[70vh] max-h-[800px]">
        <AssignmentHistory
          onSelectQuestion={(questionId) => {
            // When a question is selected from history, navigate to its detail view
            setChatQuestionId(questionId);
            loadQuestionDetail(questionId).catch(() => {
              // Error is already handled in loadQuestionDetail
            });
            setActiveSection('upload-question');
          }}
        />
      </div>
    );
  };

  // Main render content based on active section
  const renderMainContent = () => {
    if (isLoading && assignments.length === 0) {
      return <AssignmentsSkeleton />;
    }

    if (error) {
      return renderError();
    }

    switch (activeSection) {
      case 'upload-question':
        return renderUploadQuestion();
      case 'my-solutions':
        return renderMySolutions();
      case 'history':
        return renderHistory();
      default:
        return renderUploadQuestion();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Assignments
          </h1>
          <p className="text-muted-foreground">
            Upload your questions, get AI-powered hints, and submit solutions for verification
          </p>
        </div>
        <Badge className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
          <Brain className="w-4 h-4 text-primary" />
          <span>Powered by FalkeAI</span>
        </Badge>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <AssignmentsSidebar
          activeSection={activeSection}
          setActiveSection={(section) => {
            setActiveSection(section);
            setSubView('list');
            setSelectedAssignment(null);
          }}
          stats={stats}
        />

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeSection}-${subView}`}
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderMainContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
