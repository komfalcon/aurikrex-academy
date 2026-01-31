/**
 * Upload Solution Chat Component
 * 
 * Allows users to upload their solutions for verification by FalkeAI.
 * Displays verification feedback including accuracy, strengths, weaknesses, and correct solution.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import { 
  Upload, 
  Send, 
  FileText, 
  X, 
  Loader2, 
  Brain,
  CheckCircle,
  AlertCircle,
  Target,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { submitSolution, verifySolution, getAssignment } from '@/utils/assignmentApi';
import type { SolutionVerification, Assignment } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type: 'text' | 'file';
  verification?: SolutionVerification;
}

interface UploadSolutionChatProps {
  questionId: string | null;
  onSolutionVerified?: (solutionId: string) => void;
}

/**
 * Display verification results
 */
function VerificationDisplay({ verification }: { verification: SolutionVerification }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">FalkeAI Verification</h3>
      </div>
      
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

      {/* Overall Feedback */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm">{verification.feedback}</p>
      </div>

      {/* Strengths */}
      {verification.strengths && verification.strengths.length > 0 && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <h4 className="font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
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
      {verification.weaknesses && verification.weaknesses.length > 0 && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <h4 className="font-medium text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">
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
      {verification.errors && verification.errors.length > 0 && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <h4 className="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Errors Found
          </h4>
          <div className="space-y-2">
            {verification.errors.map((error, i) => (
              <div key={i} className="p-2 rounded-lg bg-red-500/5 text-sm">
                <p className="font-medium text-red-600 dark:text-red-400">{error.type}: {error.issue}</p>
                <p className="text-muted-foreground mt-1">{error.explanation}</p>
                <p className="text-green-600 dark:text-green-400 mt-1">
                  <strong>Fix:</strong> {error.correction}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correct Solution */}
      {verification.correctSolution && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Correct Solution
          </h4>
          <p className="text-sm whitespace-pre-wrap">{verification.correctSolution.explanation}</p>
          {verification.correctSolution.alternativeApproaches && 
           verification.correctSolution.alternativeApproaches.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-500/20">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Alternative Approaches:</p>
              <ul className="text-xs text-muted-foreground">
                {verification.correctSolution.alternativeApproaches.map((a, i) => (
                  <li key={i}>• {a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Next Steps */}
      {verification.nextSteps && verification.nextSteps.length > 0 && (
        <div className="p-3 rounded-lg bg-secondary/50">
          <h4 className="font-medium mb-2 flex items-center gap-2">
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

      {/* Concepts Mastered / To Review */}
      <div className="grid grid-cols-2 gap-3">
        {verification.conceptsMastered && verification.conceptsMastered.length > 0 && (
          <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/10">
            <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Concepts Mastered</p>
            <div className="flex flex-wrap gap-1">
              {verification.conceptsMastered.map((c, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
              ))}
            </div>
          </div>
        )}
        {verification.conceptsToReview && verification.conceptsToReview.length > 0 && (
          <div className="p-2 rounded-lg bg-orange-500/5 border border-orange-500/10">
            <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">Concepts to Review</p>
            <div className="flex flex-wrap gap-1">
              {verification.conceptsToReview.map((c, i) => (
                <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function UploadSolutionChat({ questionId, onSolutionVerified }: UploadSolutionChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<Assignment | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load question details when questionId changes
  useEffect(() => {
    const loadQuestion = async () => {
      if (!questionId) {
        setQuestion(null);
        return;
      }
      
      try {
        setLoadingQuestion(true);
        const result = await getAssignment(questionId);
        setQuestion(result.assignment);
      } catch (error) {
        console.error('Failed to load question:', error);
      } finally {
        setLoadingQuestion(false);
      }
    };
    
    loadQuestion();
  }, [questionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!questionId || (!inputText.trim() && !inputFile)) return;

    const userContent = inputText.trim() || `Uploaded: ${inputFile?.name}`;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: new Date(),
      type: inputFile ? 'file' : 'text',
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    
    try {
      // Submit solution
      const solution = await submitSolution({
        assignmentId: questionId,
        solutionType: inputFile ? 'file' : 'text',
        textContent: inputText,
        fileName: inputFile?.name,
      });
      
      // Verify with FalkeAI
      const verified = await verifySolution(solution._id);
      
      onSolutionVerified?.(verified._id);
      
      // Add AI response with verification
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: verified.verification?.feedback || 'Solution verified!',
        timestamp: new Date(),
        type: 'text',
        verification: verified.verification,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Clear inputs
      setInputText('');
      setInputFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error) {
      // Log full error for debugging
      console.error('Full error verifying solution:', error);
      
      // Extract detailed error message
      let errorMsg = 'Failed to verify solution';
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle API error responses
        const apiError = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
        errorMsg = apiError.response?.data?.message || apiError.response?.data?.error || apiError.message || errorMsg;
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        timestamp: new Date(),
        type: 'text',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInputFile(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Show message if no question is selected
  if (!questionId) {
    return (
      <Card className="h-full flex flex-col border-border">
        <CardContent className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="p-4 rounded-2xl bg-secondary/50 mb-4">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No Question Selected</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Please upload a question first in the "Upload Question" tab, then come back here to submit your solution for verification.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col border-border">
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Question Context Header */}
        {question && (
          <div className="p-4 border-b border-border bg-secondary/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Solving question:</p>
                <h4 className="font-medium text-sm truncate">{question.title}</h4>
                {question.analysis?.estimatedDifficulty && (
                  <Badge variant="outline" className="text-xs mt-1 capitalize">
                    {question.analysis.estimatedDifficulty}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
        
        {loadingQuestion && (
          <div className="p-4 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading question...</span>
            </div>
          </div>
        )}
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="p-4 rounded-2xl bg-primary/10 mb-4">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Submit Your Solution</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Type your solution or upload a file. FalkeAI will verify it and provide detailed feedback including accuracy score, what you did well, and areas for improvement.
              </p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Brain className="w-3 h-3" />
                Powered by FalkeAI
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 border border-border'
                    }`}
                  >
                    {msg.type === 'file' && msg.role === 'user' && (
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm opacity-80">File attached</span>
                      </div>
                    )}
                    
                    {!msg.verification && (
                      msg.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div 
                          className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }}
                        />
                      )
                    )}
                    
                    {/* Show verification for assistant messages */}
                    {msg.role === 'assistant' && msg.verification && (
                      <VerificationDisplay verification={msg.verification} />
                    )}
                    
                    <p className="text-xs opacity-60 mt-2">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-secondary/50 border border-border p-4 rounded-2xl flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm">FalkeAI is verifying your solution...</span>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card/50">
          {inputFile && (
            <div className="mb-2 p-2 rounded-lg bg-secondary/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm truncate">{inputFile.name}</span>
              </div>
              <button
                onClick={() => {
                  setInputFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1 hover:bg-secondary rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your solution here..."
                disabled={loading}
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="p-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors disabled:opacity-50"
                title="Attach file"
              >
                <Upload className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={loading || (!inputText.trim() && !inputFile)}
                className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                title="Verify Solution"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send or Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default UploadSolutionChat;
