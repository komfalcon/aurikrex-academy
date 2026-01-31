/**
 * BookSearch Component
 * 
 * Provides search and filter controls for the book library.
 */

import { useState } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BookDifficulty, BookCategoryType } from '@/types';

export interface BookFilters {
  search: string;
  category: string;
  difficulty: BookDifficulty | '';
  subject: string;
  sortBy: 'newest' | 'popular' | 'rated' | 'title' | 'downloads';
}

interface BookSearchProps {
  filters: BookFilters;
  onFiltersChange: (filters: BookFilters) => void;
  categories?: Array<{ name: string; icon: string; color: string }>;
}

const defaultCategories = [
  { name: 'textbook', icon: '📖', color: '#667eea' },
  { name: 'reference', icon: '📚', color: '#764ba2' },
  { name: 'notes', icon: '📝', color: '#f093fb' },
  { name: 'slides', icon: '🎯', color: '#4facfe' },
  { name: 'research', icon: '🔬', color: '#43e97b' },
  { name: 'material', icon: '📄', color: '#fa709a' },
  { name: 'other', icon: '📋', color: '#30cfd0' },
];

const difficultyOptions: Array<{ value: BookDifficulty | ''; label: string }> = [
  { value: '', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rated', label: 'Highest Rated' },
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'title', label: 'Title A-Z' },
];

export function BookSearch({ filters, onFiltersChange, categories = defaultCategories }: BookSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  
  const updateFilter = <K extends keyof BookFilters>(key: K, value: BookFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };
  
  const clearFilters = () => {
    onFiltersChange({
      search: '',
      category: '',
      difficulty: '',
      subject: '',
      sortBy: 'newest',
    });
  };
  
  const hasActiveFilters = filters.category || filters.difficulty || filters.subject;
  
  return (
    <Card className="p-4 mb-6 bg-card/80 backdrop-blur-sm border border-border">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search books by title, author, or description..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          {/* Sort By */}
          <Select
            value={filters.sortBy}
            onValueChange={(value) => updateFilter('sortBy', value as BookFilters['sortBy'])}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-input hover:border-primary/50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {[filters.category, filters.difficulty, filters.subject].filter(Boolean).length}
              </Badge>
            )}
          </button>
        </div>
      </div>
      
      {/* Expandable Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          {/* Category Pills */}
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilter('category', '')}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  !filters.category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => updateFilter('category', cat.name)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1 ${
                    filters.category === cat.name
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="capitalize">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Difficulty & Subject Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <Select
                value={filters.difficulty}
                onValueChange={(value) => updateFilter('difficulty', value as BookDifficulty | '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyOptions.map((option) => (
                    <SelectItem key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <input
                type="text"
                placeholder="e.g., Mathematics, Physics..."
                value={filters.subject}
                onChange={(e) => updateFilter('subject', e.target.value)}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>
          
          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default BookSearch;
