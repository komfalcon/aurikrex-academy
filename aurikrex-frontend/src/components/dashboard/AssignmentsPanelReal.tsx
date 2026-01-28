/**
 * Assignments Panel Component
 * 
 * Complete assignment system with real data, FalkeAI analysis, and solution verification.
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
} from '@/utils/assignmentApi';
import type { Assignment, Solution, AssignmentStats, SolutionVerification } from '@/types';

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

// Main panel type
type PanelView = 'list' | 'create' | 'detail' | 'solution' | 'history';

export default function AssignmentsPanelReal() {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [view, setView] = useState<PanelView>('list');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [stats, setStats] = useState<AssignmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [assignmentText, setAssignmentText] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [solutionText, setSolutionText] = useState('');
  const [solutionFiles, setSolutionFiles] = useState<File[]>([]);

  const ACCEPTED_FILE_TYPES = ".txt,.pdf,.docx,.doc,.png,.jpg,.jpeg";

  // Load assignments
  const loadAssignments = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const [assignmentsResult, statsResult] = await Promise.all([
        getAssignments({ sortBy: 'createdAt', sortOrder: 'desc' }),
        getAssignmentStats(),
      ]);
      setAssignments(assignmentsResult.assignments);
      setStats(statsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // Load single assignment with solutions
  const loadAssignmentDetail = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const result = await getAssignment(id);
      setSelectedAssignment(result.assignment);
      setSolutions(result.solutions);
      setView('detail');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignment');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'assignment' | 'solution') => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ['txt', 'pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg'].includes(ext || '');
      });
      if (type === 'assignment') {
        setUploadedFiles(prev => [...prev, ...validFiles]);
      } else {
        setSolutionFiles(prev => [...prev, ...validFiles]);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Create and analyze assignment
  const handleCreateAssignment = async () => {
    if (!user?.uid || (!assignmentText.trim() && uploadedFiles.length === 0)) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Create assignment
      const assignment = await createAssignment({
        title: assignmentTitle || 'New Assignment',
        description: assignmentText,
        assignmentType: uploadedFiles.length > 0 ? 'upload' : 'text',
        textContent: assignmentText,
        // Note: File upload would need a separate file upload endpoint
        // For now, we just use text content
      });

      // Immediately analyze
      setIsAnalyzing(true);
      const analyzed = await analyzeAssignment(assignment._id);

      // Reset form
      setAssignmentText('');
      setAssignmentTitle('');
      setUploadedFiles([]);
      
      // Show the analyzed assignment
      setSelectedAssignment(analyzed);
      setSolutions([]);
      setView('detail');
      
      // Refresh list
      loadAssignments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setIsSubmitting(false);
      setIsAnalyzing(false);
    }
  };

  // Submit solution
  const handleSubmitSolution = async () => {
    if (!user?.uid || !selectedAssignment || (!solutionText.trim() && solutionFiles.length === 0)) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Submit solution
      const solution = await submitSolution({
        assignmentId: selectedAssignment._id,
        solutionType: solutionFiles.length > 0 ? 'file' : 'text',
        textContent: solutionText,
      });

      // Verify solution
      setIsVerifying(true);
      const verified = await verifySolution(solution._id);

      // Update solutions list
      setSolutions(prev => [...prev, verified]);
      
      // Reset form
      setSolutionText('');
      setSolutionFiles([]);
      
      // Refresh assignment
      loadAssignmentDetail(selectedAssignment._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit solution');
    } finally {
      setIsSubmitting(false);
      setIsVerifying(false);
    }
  };

  // Render based on view
  const renderContent = () => {
    // Loading state
    if (isLoading && view === 'list') {
      return <AssignmentsSkeleton />;
    }

    // Error state
    if (error) {
      return (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => { setError(null); loadAssignments(); }}
            className="mt-2 text-sm underline"
          >
            Try again
          </button>
        </div>
      );
    }

    switch (view) {
      case 'list':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Assignment List */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-primary" />
                      My Assignments
                    </span>
                    <button
                      onClick={() => setView('create')}
                      className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </CardTitle>
                  {stats && (
                    <CardDescription>
                      {stats.total} total • {stats.graded} completed
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {assignments.length === 0 ? (
                    <EmptyAssignments onCreateNew={() => setView('create')} />
                  ) : (
                    assignments.map((assignment) => (
                      <AssignmentCard
                        key={assignment._id}
                        assignment={assignment}
                        isSelected={selectedAssignment?._id === assignment._id}
                        onClick={() => loadAssignmentDetail(assignment._id)}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Stats & Quick Actions */}
            <div className="lg:col-span-2 space-y-4">
              {/* Stats Cards */}
              {stats && stats.total > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-border bg-card/50">
                    <CardContent className="p-4">
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card/50">
                    <CardContent className="p-4">
                      <p className="text-2xl font-bold text-purple-500">{stats.analyzed}</p>
                      <p className="text-xs text-muted-foreground">Analyzed</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card/50">
                    <CardContent className="p-4">
                      <p className="text-2xl font-bold text-blue-500">{stats.attempted}</p>
                      <p className="text-xs text-muted-foreground">Attempted</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card/50">
                    <CardContent className="p-4">
                      <p className="text-2xl font-bold text-green-500">{stats.graded}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Quick Create */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Quick Upload Assignment
                  </CardTitle>
                  <CardDescription>
                    Upload or type your assignment and FalkeAI will analyze it
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <button
                    onClick={() => setView('create')}
                    className="w-full p-6 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-primary" />
                    <span className="font-medium">Click to create new assignment</span>
                    <span className="text-xs text-muted-foreground">
                      Supports: .txt, .pdf, .docx, .png, .jpg
                    </span>
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'create':
        return (
          <div className="space-y-6">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to assignments
            </button>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Create New Assignment
                </CardTitle>
                <CardDescription>
                  Upload or type your assignment and FalkeAI will analyze it to provide hints and guidance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title (Optional)</label>
                  <input
                    type="text"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    placeholder="e.g., Calculus Problem Set, Essay Draft..."
                    className="w-full p-3 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assignment Content</label>
                  <textarea
                    value={assignmentText}
                    onChange={(e) => setAssignmentText(e.target.value)}
                    placeholder="Type or paste your assignment here. Include the full problem statement, questions, or essay prompt..."
                    className="w-full min-h-[200px] p-4 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-y text-sm"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {assignmentText.length} characters
                  </p>
                </div>

                {/* File Upload */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Or Upload Files</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium">Click to upload files</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports: .txt, .pdf, .docx, .png, .jpg
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'assignment')}
                  />

                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm truncate">{file.name}</span>
                          </div>
                          <button
                            onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
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
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setView('list')}
                    className="px-6 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAssignment}
                    disabled={isSubmitting || (!assignmentText.trim() && uploadedFiles.length === 0)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow transition-all flex items-center gap-2"
                  >
                    {isSubmitting || isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {isAnalyzing ? 'Analyzing...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        Create & Analyze
                      </>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'detail':
        if (!selectedAssignment) return null;
        
        return (
          <div className="space-y-6">
            <button
              onClick={() => { setView('list'); setSelectedAssignment(null); }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to assignments
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Assignment Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-border">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{selectedAssignment.title}</CardTitle>
                        <CardDescription>
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
                  <CardContent className="space-y-4">
                    {/* Original content */}
                    {selectedAssignment.textContent && (
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                        <p className="text-sm whitespace-pre-wrap">{selectedAssignment.textContent}</p>
                      </div>
                    )}

                    {/* AI Analysis */}
                    {selectedAssignment.analysis && (
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Brain className="w-5 h-5 text-primary" />
                          FalkeAI Analysis
                        </h3>

                        <p className="text-sm text-muted-foreground">
                          {selectedAssignment.analysis.description}
                        </p>

                        {/* Hints */}
                        {selectedAssignment.analysis.hints && (
                          <div className="space-y-3">
                            {/* Concepts */}
                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                              <h4 className="font-medium text-blue-500 mb-2 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" />
                                Concepts to Know
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedAssignment.analysis.hints.conceptsInvolved.map((c, i) => (
                                  <Badge key={i} variant="secondary">{c}</Badge>
                                ))}
                              </div>
                            </div>

                            {/* Approach */}
                            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                              <h4 className="font-medium text-purple-500 mb-2 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Suggested Approach
                              </h4>
                              <p className="text-sm">{selectedAssignment.analysis.hints.approachSuggestion}</p>
                            </div>

                            {/* Step by Step */}
                            {selectedAssignment.analysis.hints.stepByStep.length > 0 && (
                              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                                <h4 className="font-medium text-green-500 mb-3 flex items-center gap-2">
                                  <Award className="w-4 h-4" />
                                  Step-by-Step Guidance
                                </h4>
                                <div className="space-y-3">
                                  {selectedAssignment.analysis.hints.stepByStep.map((step) => (
                                    <div key={step.stepNumber} className="flex gap-3">
                                      <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        {step.stepNumber}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">{step.guidance}</p>
                                        <p className="text-xs text-muted-foreground italic">
                                          Think: {step.keyThink}
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
                  </CardContent>
                </Card>

                {/* Solution Submission */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5 text-primary" />
                      Submit Your Solution
                    </CardTitle>
                    <CardDescription>
                      Type or upload your solution for FalkeAI verification
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <textarea
                      value={solutionText}
                      onChange={(e) => setSolutionText(e.target.value)}
                      placeholder="Type your solution here..."
                      className="w-full min-h-[150px] p-4 rounded-xl bg-secondary/30 border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-y text-sm"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSubmitSolution}
                        disabled={isSubmitting || isVerifying || !solutionText.trim()}
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

              {/* Right: Previous Solutions */}
              <div className="lg:col-span-1">
                <Card className="border-border sticky top-4">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" />
                      Solution History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {solutions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No solutions submitted yet
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {solutions.map((solution, index) => (
                          <div key={solution._id} className="p-4 rounded-xl bg-secondary/30 border border-border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Attempt #{solution.attempt}</span>
                              {solution.verification && (
                                <Badge className={solution.verification.isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}>
                                  {solution.verification.accuracy}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {new Date(solution.submittedAt).toLocaleString()}
                            </p>
                            {solution.verification && (
                              <button
                                onClick={() => {
                                  // Could expand to show full verification
                                }}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                View feedback
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Latest Verification Result */}
                {solutions.length > 0 && solutions[solutions.length - 1].verification && (
                  <Card className="border-border mt-4">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="w-5 h-5 text-primary" />
                        Latest Feedback
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <VerificationDisplay verification={solutions[solutions.length - 1].verification!} />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      {view === 'list' && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Assignments
            </h1>
            <p className="text-muted-foreground">
              Upload assignments and get AI-powered analysis, hints, and solution verification
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAssignments}
              className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <Badge className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
              <Brain className="w-4 h-4 text-primary" />
              <span>Powered by FalkeAI</span>
            </Badge>
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
