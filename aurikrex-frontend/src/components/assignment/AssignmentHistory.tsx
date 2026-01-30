/**
 * Assignment History Component
 * 
 * Displays a list of past questions and solutions with expand/collapse functionality.
 * Shows status badges and allows selecting items to view full conversation.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  FileQuestion,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Brain,
  CheckCircle,
  AlertCircle,
  Eye,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAssignments, getSolutions } from '@/utils/assignmentApi';
import type { Assignment, Solution, AssignmentStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface HistoryItem {
  id: string;
  type: 'question' | 'solution';
  title: string;
  content: string;
  createdAt: string;
  status: AssignmentStatus | 'verified' | 'pending';
  relatedId?: string; // For solutions, this is the assignmentId
  accuracy?: number;
}

interface AssignmentHistoryProps {
  onSelectQuestion?: (questionId: string) => void;
}

const statusConfig = {
  pending: { 
    icon: Clock, 
    color: 'text-orange-500', 
    bg: 'bg-orange-500/10', 
    label: 'Pending' 
  },
  analyzed: { 
    icon: Brain, 
    color: 'text-purple-500', 
    bg: 'bg-purple-500/10', 
    label: 'Analyzed' 
  },
  attempted: { 
    icon: AlertCircle, 
    color: 'text-blue-500', 
    bg: 'bg-blue-500/10', 
    label: 'Attempted' 
  },
  submitted: { 
    icon: CheckCircle, 
    color: 'text-cyan-500', 
    bg: 'bg-cyan-500/10', 
    label: 'Submitted' 
  },
  graded: { 
    icon: CheckCircle, 
    color: 'text-green-500', 
    bg: 'bg-green-500/10', 
    label: 'Completed' 
  },
  verified: { 
    icon: CheckCircle, 
    color: 'text-green-500', 
    bg: 'bg-green-500/10', 
    label: 'Verified' 
  },
};

function HistoryItemCard({
  item,
  isExpanded,
  onToggle,
  onSelect,
}: {
  item: HistoryItem;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  const config = statusConfig[item.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const ItemIcon = item.type === 'question' ? FileQuestion : CheckSquare;
  
  const formattedDate = formatDistanceToNow(new Date(item.createdAt), {
    addSuffix: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-xl overflow-hidden"
    >
      {/* Header - Always visible */}
      <div
        onClick={onToggle}
        className="p-4 bg-card/50 hover:bg-secondary/50 cursor-pointer transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${item.type === 'question' ? 'bg-primary/10' : 'bg-green-500/10'}`}>
            <ItemIcon className={`w-4 h-4 ${item.type === 'question' ? 'text-primary' : 'text-green-500'}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {item.type === 'question' ? '❓ Question' : '✍️ Solution'}
              </Badge>
              <Badge className={`${config.bg} ${config.color} text-xs`}>
                {config.label}
              </Badge>
              {item.type === 'solution' && item.accuracy !== undefined && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    item.accuracy >= 80 ? 'bg-green-500/10 text-green-500' :
                    item.accuracy >= 60 ? 'bg-orange-500/10 text-orange-500' :
                    'bg-red-500/10 text-red-500'
                  }`}
                >
                  {item.accuracy}%
                </Badge>
              )}
            </div>
            
            <h4 className="font-medium text-sm truncate">{item.title}</h4>
            
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-border bg-secondary/30">
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Content Preview</p>
                <p className="text-sm line-clamp-4 whitespace-pre-wrap">
                  {item.content || 'No content available'}
                </p>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Full Conversation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function AssignmentHistory({ onSelectQuestion }: AssignmentHistoryProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'question' | 'solution'>('all');

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both assignments and solutions
      const [assignmentsResult, solutionsResult] = await Promise.all([
        getAssignments({ sortBy: 'createdAt', sortOrder: 'desc', limit: 50 }),
        getSolutions({ limit: 50 }),
      ]);
      
      // Transform assignments to history items
      const questionItems: HistoryItem[] = assignmentsResult.assignments.map(a => ({
        id: a._id,
        type: 'question' as const,
        title: a.title,
        content: a.textContent || a.description || '',
        createdAt: a.createdAt,
        status: a.status,
      }));
      
      // Transform solutions to history items
      const solutionItems: HistoryItem[] = solutionsResult.solutions.map(s => ({
        id: s._id,
        type: 'solution' as const,
        title: `Solution for ${s.assignmentId}`,
        content: s.textContent || '',
        createdAt: s.submittedAt,
        status: s.verification ? 'verified' : 'pending' as const,
        relatedId: s.assignmentId,
        accuracy: s.verification?.accuracy,
      }));
      
      // Combine and sort by date
      const allItems = [...questionItems, ...solutionItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setItems(allItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const handleSelect = (item: HistoryItem) => {
    if (item.type === 'question') {
      onSelectQuestion?.(item.id);
    } else if (item.relatedId) {
      onSelectQuestion?.(item.relatedId);
    }
  };

  if (loading) {
    return (
      <Card className="h-full border-border">
        <CardContent className="flex flex-col items-center justify-center h-full py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border-border">
        <CardContent className="flex flex-col items-center justify-center h-full py-12 text-center">
          <div className="p-4 rounded-2xl bg-destructive/10 mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="font-semibold mb-2">Error Loading History</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={loadHistory}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="h-full border-border">
        <CardContent className="flex flex-col items-center justify-center h-full py-12 text-center">
          <div className="p-4 rounded-2xl bg-secondary/50 mb-4">
            <History className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No History Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Upload your first question to get started. Your questions and solutions will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-border flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Assignment History
          </CardTitle>
          <button
            onClick={loadHistory}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
            title="Refresh history"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4">
          {(['all', 'question', 'solution'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 hover:bg-secondary'
              }`}
            >
              {f === 'all' ? 'All' : f === 'question' ? 'Questions' : 'Solutions'}
              <span className="ml-1 opacity-70">
                ({items.filter(i => f === 'all' || i.type === f).length})
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <HistoryItemCard
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onSelect={() => handleSelect(item)}
            />
          ))}
        </AnimatePresence>
        
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No {filter === 'question' ? 'questions' : 'solutions'} found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AssignmentHistory;
