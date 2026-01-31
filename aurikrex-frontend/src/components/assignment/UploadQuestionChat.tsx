/**
 * Upload Question Chat Component
 * 
 * Allows users to upload questions (text or file) and receive AI-powered hints from FalkeAI.
 * Messages are displayed in a chat format with proper formatting.
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import { 
  Upload, 
  Send, 
  FileText, 
  X, 
  Loader2, 
  Brain,
  Lightbulb,
  BookOpen,
  Target,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createAssignment, analyzeAssignment } from '@/utils/assignmentApi';
import type { AssignmentHints } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type: 'text' | 'file';
  hints?: AssignmentHints;
}

interface UploadQuestionChatProps {
  onQuestionUploaded?: (questionId: string) => void;
}

/**
 * Format hints into displayable content
 */
function HintsDisplay({ hints }: { hints: AssignmentHints }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">FalkeAI Hints</h3>
        <Badge variant="secondary" className="text-xs">Hints only - solve it yourself!</Badge>
      </div>
      
      {/* Concepts Involved */}
      {hints.conceptsInvolved && hints.conceptsInvolved.length > 0 && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Concepts You'll Need
          </h4>
          <div className="flex flex-wrap gap-2">
            {hints.conceptsInvolved.map((concept, i) => (
              <Badge key={i} variant="outline" className="text-xs">{concept}</Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Approach Suggestion */}
      {hints.approachSuggestion && (
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Suggested Approach
          </h4>
          <p className="text-sm">{hints.approachSuggestion}</p>
        </div>
      )}
      
      {/* Step-by-Step Guidance */}
      {hints.stepByStep && hints.stepByStep.length > 0 && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <h4 className="font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Steps to Solve
          </h4>
          <div className="space-y-2">
            {hints.stepByStep.map((step, i) => (
              <div key={i} className="pl-4 border-l-2 border-green-500/30">
                <p className="text-sm font-medium">Step {step.stepNumber}: {step.guidance}</p>
                <p className="text-xs text-muted-foreground mt-1">💡 {step.keyThink}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Common Mistakes */}
      {hints.commonMistakes && hints.commonMistakes.length > 0 && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <h4 className="font-medium text-orange-600 dark:text-orange-400 mb-2">⚠️ Common Mistakes to Avoid</h4>
          <ul className="space-y-1">
            {hints.commonMistakes.map((mistake, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-orange-500">•</span> {mistake}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Resources */}
      {hints.resources && hints.resources.length > 0 && (
        <div className="p-3 rounded-lg bg-secondary/50">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Helpful Resources
          </h4>
          <ul className="space-y-1">
            {hints.resources.map((resource, i) => (
              <li key={i} className="text-sm text-muted-foreground">• {resource}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function UploadQuestionChat({ onQuestionUploaded }: UploadQuestionChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!inputText.trim() && !inputFile) return;

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
      // Create assignment from question
      const assignment = await createAssignment({
        title: inputText.substring(0, 50) || inputFile?.name || 'My Question',
        description: inputText,
        assignmentType: inputFile ? 'upload' : 'text',
        textContent: inputText,
        fileName: inputFile?.name,
      });
      
      // Analyze with FalkeAI
      const analyzed = await analyzeAssignment(assignment._id);
      
      setQuestionId(analyzed._id);
      onQuestionUploaded?.(analyzed._id);
      
      // Add AI response with hints
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: analyzed.analysis?.description || 'Question analyzed successfully!',
        timestamp: new Date(),
        type: 'text',
        hints: analyzed.analysis?.hints,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Clear inputs
      setInputText('');
      setInputFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error) {
      // Log full error for debugging
      console.error('Full error analyzing question:', error);
      
      // Extract detailed error message
      let errorMsg = 'Failed to analyze question';
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

  return (
    <Card className="h-full flex flex-col border-border">
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="p-4 rounded-2xl bg-primary/10 mb-4">
                <Brain className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Upload Your Question</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Type your question or upload an image/file. FalkeAI will analyze it and provide helpful hints to guide you toward the solution.
              </p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
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
                    className={`max-w-[80%] p-4 rounded-2xl ${
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
                    {msg.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div 
                        className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }}
                      />
                    )}
                    
                    {/* Show hints for assistant messages */}
                    {msg.role === 'assistant' && msg.hints && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <HintsDisplay hints={msg.hints} />
                      </div>
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
                <span className="text-sm">FalkeAI is analyzing your question...</span>
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
                placeholder="Type your question here..."
                disabled={loading}
                rows={2}
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
                title="Get Hints"
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

export default UploadQuestionChat;
