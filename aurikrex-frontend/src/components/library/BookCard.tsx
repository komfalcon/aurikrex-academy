/**
 * BookCard Component
 * 
 * Displays a single book card with cover, title, author, and rating.
 */

import { motion } from 'framer-motion';
import { Star, Download, Eye, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Book, BookDifficulty } from '@/types';

interface BookCardProps {
  book: Book;
  onClick?: (book: Book) => void;
  onDownload?: (book: Book) => void;
}

// Difficulty badge configuration
const difficultyConfig: Record<BookDifficulty, { color: string; bg: string; label: string }> = {
  beginner: { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Beginner' },
  intermediate: { color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Intermediate' },
  advanced: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Advanced' },
};

export function BookCard({ book, onClick, onDownload }: BookCardProps) {
  const difficulty = difficultyConfig[book.difficulty] || difficultyConfig.beginner;
  
  // Generate placeholder cover if none exists
  const coverUrl = book.coverImageUrl || `https://via.placeholder.com/200x300?text=${encodeURIComponent(book.title)}`;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="overflow-hidden cursor-pointer bg-card/80 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300"
        onClick={() => onClick?.(book)}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img 
            src={coverUrl} 
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://via.placeholder.com/200x300?text=${encodeURIComponent(book.title)}`;
            }}
          />
          
          {/* Status badge for pending/approved/rejected */}
          {book.status && book.status !== 'approved' && (
            <Badge 
              variant="secondary" 
              className={`absolute top-2 right-2 ${
                book.status === 'pending' 
                  ? 'bg-yellow-500/90 text-yellow-100' 
                  : 'bg-red-500/90 text-red-100'
              }`}
            >
              {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
            </Badge>
          )}
          
          {/* Difficulty badge */}
          <Badge 
            variant="outline" 
            className={`absolute top-2 left-2 ${difficulty.color} ${difficulty.bg}`}
          >
            {difficulty.label}
          </Badge>
        </div>
        
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
            {book.title}
          </h3>
          
          <p className="text-xs text-muted-foreground line-clamp-1">
            {book.author || 'Unknown Author'}
          </p>
          
          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= Math.round(book.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({book.reviewCount || 0})
            </span>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            {book.views !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{book.views}</span>
              </div>
            )}
            {book.downloads !== undefined && (
              <div className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                <span>{book.downloads}</span>
              </div>
            )}
            {book.pages > 0 && (
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>{book.pages}p</span>
              </div>
            )}
          </div>
          
          {/* Category tags */}
          {book.category && book.category.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {book.category.slice(0, 2).map((cat, idx) => (
                <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0">
                  {cat}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default BookCard;
