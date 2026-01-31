/**
 * Chat History Sidebar Component
 * 
 * Displays a list of user's conversations with FalkeAI.
 * Allows users to:
 * - View recent conversations
 * - Select a conversation to continue
 * - Create new conversations
 * - Delete old conversations
 * 
 * Uses real data from the backend API - NO MOCK DATA.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Clock,
  ChevronRight,
  X,
  Loader2,
  History,
  Brain,
} from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

/**
 * Conversation type from the API
 */
interface Conversation {
  _id: string;
  title: string;
  topic?: string;
  messageCount: number;
  lastUpdatedAt: string;
  createdAt: string;
}

/**
 * Props for the ChatHistorySidebar component
 */
interface ChatHistorySidebarProps {
  /** Currently selected conversation ID */
  selectedConversationId?: string;
  /** Callback when a conversation is selected */
  onSelectConversation: (conversationId: string) => void;
  /** Callback when a new conversation is requested */
  onNewConversation: () => void;
  /** Whether the sidebar is open (mobile) */
  isOpen?: boolean;
  /** Callback to close the sidebar (mobile) */
  onClose?: () => void;
}

/**
 * Empty state component
 */
function EmptyConversations({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="p-3 rounded-xl bg-primary/10 mb-3">
        <MessageSquare className="w-6 h-6 text-primary" />
      </div>
      <h4 className="font-medium text-sm mb-1">No conversations yet</h4>
      <p className="text-xs text-muted-foreground mb-3">
        Start a conversation with FalkeAI
      </p>
      <button
        onClick={onCreateNew}
        className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        New Chat
      </button>
    </div>
  );
}

/**
 * Loading skeleton for conversations
 */
function ConversationsSkeleton() {
  return (
    <div className="space-y-2 p-2 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-3 rounded-lg bg-secondary/30">
          <div className="h-3 bg-secondary/50 rounded w-3/4 mb-2" />
          <div className="h-2 bg-secondary/40 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

/**
 * Single conversation item
 */
function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  onDelete,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = formatDistanceToNow(new Date(conversation.lastUpdatedAt), {
    addSuffix: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      whileHover={!shouldReduceMotion ? { x: 2 } : {}}
      onClick={onSelect}
      className={`
        group relative p-3 rounded-lg cursor-pointer transition-all
        ${isSelected 
          ? 'bg-primary/10 border border-primary/30' 
          : 'hover:bg-secondary/50 border border-transparent'
        }
      `}
    >
      <div className="flex items-start gap-2">
        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-secondary/50'}`}>
          <MessageSquare className={`w-3.5 h-3.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">
            {conversation.title || 'New Conversation'}
          </h4>
          {conversation.topic && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {conversation.topic}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formattedDate}</span>
            <span>•</span>
            <span>{conversation.messageCount} msgs</span>
          </div>
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={`
          absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg
          opacity-0 group-hover:opacity-100 transition-opacity
          hover:bg-destructive/10 text-muted-foreground hover:text-destructive
          ${isDeleting ? 'opacity-100' : ''}
        `}
        aria-label="Delete conversation"
      >
        {isDeleting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </button>
    </motion.div>
  );
}

/**
 * Chat History Sidebar Component
 */
export function ChatHistorySidebar({
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen = true,
  onClose,
}: ChatHistorySidebarProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Load conversations from API
   */
  const loadConversations = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading conversations...');
      const response = await apiRequest('/conversations?limit=50');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to load conversations`);
      }

      const data = await response.json();
      console.log('Conversations response data:', data);
      
      // Handle different response formats:
      // Backend returns { status, data: [conversations], total }
      // But also handle { conversations: [] } or just [] for flexibility
      const conversations: Conversation[] = Array.isArray(data) 
        ? data 
        : Array.isArray(data.data) 
          ? data.data 
          : data.data?.conversations && Array.isArray(data.data.conversations)
            ? data.data.conversations
            : Array.isArray(data.conversations)
              ? data.conversations
              : [];
      
      console.log('Parsed conversations count:', conversations.length);
      setConversations(conversations);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Full error loading conversations:', err);
      setError(`Failed to load conversations: ${message}`);
      setConversations([]);  // Clear on error
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  /**
   * Create a new conversation
   */
  const handleNewConversation = async () => {
    try {
      const response = await apiRequest('/conversations', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Conversation' }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      const newConversation = data.data;
      
      // Add to list and select it
      setConversations(prev => [newConversation, ...prev]);
      onSelectConversation(newConversation._id);
      onNewConversation();
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  /**
   * Delete a conversation
   */
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await apiRequest(`/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      // Remove from list
      setConversations(prev => prev.filter(c => c._id !== conversationId));
      
      // If this was selected, clear selection
      if (selectedConversationId === conversationId) {
        onSelectConversation('');
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Filter conversations by search query
  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.topic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={`
        flex flex-col h-full
        bg-card/50 backdrop-blur-sm border-r border-border
        ${isOpen ? 'w-72' : 'w-0 overflow-hidden'}
        transition-all duration-300
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm">Conversations</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewConversation}
              className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
              aria-label="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors lg:hidden"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-secondary/30 border border-border focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <ConversationsSkeleton />
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <button
              onClick={loadConversations}
              className="text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredConversations.length === 0 ? (
          searchQuery ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No conversations found</p>
            </div>
          ) : (
            <EmptyConversations onCreateNew={handleNewConversation} />
          )
        ) : (
          <div className="p-2 space-y-1">
            <AnimatePresence mode="popLayout">
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation._id}
                  conversation={conversation}
                  isSelected={selectedConversationId === conversation._id}
                  onSelect={() => onSelectConversation(conversation._id)}
                  onDelete={() => handleDeleteConversation(conversation._id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <button
          onClick={loadConversations}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          Refresh History
        </button>
      </div>
    </aside>
  );
}

export default ChatHistorySidebar;
