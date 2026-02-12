/**
 * UploadBookModal Component
 * 
 * Production-ready modal for uploading books to the library.
 * 
 * Features:
 * - File type restrictions (PDF, EPUB, PPTX only)
 * - 100MB max file size validation
 * - Progress bar for uploads
 * - Retry logic for failed uploads
 * - Cover image preview after generation
 * - Status display (Pending/Published based on user role)
 * - Cloudinary integration for secure file storage
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  RefreshCw,
  FileType,
  Image as ImageIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { uploadBook } from '@/utils/libraryApi';
import { useAuth } from '@/context/AuthContext';
import type { BookCategoryType, BookFileType } from '@/types';

interface UploadBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

// Only allow PDF, EPUB, and PPTX as per requirements
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/epub+zip',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const FILE_EXTENSION_MAP: Record<string, BookFileType> = {
  'application/pdf': 'pdf',
  'application/epub+zip': 'epub',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};

const FILE_TYPE_LABELS: Record<BookFileType, string> = {
  'pdf': 'PDF Document',
  'epub': 'EPUB eBook',
  'pptx': 'PowerPoint Slides',
};

const CATEGORIES: { value: BookCategoryType; label: string }[] = [
  { value: 'textbook', label: '📚 Textbook' },
  { value: 'reference', label: '📖 Reference' },
  { value: 'notes', label: '📝 Notes' },
  { value: 'slides', label: '📊 Slides' },
  { value: 'research', label: '🔬 Research' },
  { value: 'material', label: '📄 Material' },
  { value: 'other', label: '📁 Other' },
];

// 100MB max file size as per requirements
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Maximum retry attempts for failed uploads
const MAX_RETRIES = 3;

export function UploadBookModal({ open, onOpenChange, onSuccess }: UploadBookModalProps) {
  const { user } = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BookCategoryType>('other');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // Upload state
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  
  // Result state
  const [uploadResult, setUploadResult] = useState<{
    id: string;
    coverImageUrl: string;
    status: string;
    isPublished: boolean;
  } | null>(null);

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setTitle('');
    setAuthor('');
    setDescription('');
    setCategory('other');
    setSubject('');
    setFile(null);
    setStatus('idle');
    setError(null);
    setProgress(0);
    setRetryCount(0);
    setUploadResult(null);
  }, []);

  const handleClose = useCallback(() => {
    if (status !== 'uploading' && status !== 'processing') {
      resetForm();
      onOpenChange(false);
    }
  }, [status, resetForm, onOpenChange]);

  /**
   * Validate file type and size
   */
  const validateFile = useCallback((file: File): string | null => {
    // Check MIME type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Invalid file type. Only PDF, EPUB, and PPTX files are allowed.';
    }
    
    // Check file size (100MB limit)
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      return `File too large. Maximum size is ${sizeMB}MB.`;
    }
    
    // Check file extension as secondary validation
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'epub', 'pptx'].includes(ext)) {
      return 'Invalid file extension. Only .pdf, .epub, and .pptx files are allowed.';
    }
    
    return null;
  }, []);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    
    // Auto-fill title from filename if empty
    if (!title) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      // Clean up the filename for a nicer title
      const cleanTitle = nameWithoutExt
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      setTitle(cleanTitle);
    }
  }, [title, validateFile]);

  /**
   * Handle drag events
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  /**
   * Convert file to base64 with progress tracking
   */
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 30); // 0-30% for reading
          setProgress(percentComplete);
        }
      };
      
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * Upload the book with retry logic
   */
  const performUpload = useCallback(async (): Promise<void> => {
    if (!file || !title.trim()) {
      setError('Title and file are required');
      return;
    }

    setStatus('uploading');
    setError(null);
    setProgress(0);

    try {
      // Step 1: Read file as base64 (0-30%)
      setProgress(5);
      const fileUrl = await fileToBase64(file);
      setProgress(30);

      // Step 2: Upload to backend (30-90%)
      setStatus('processing');
      setProgress(40);

      // Simulate progress during API call
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 85) return prev + 5;
          return prev;
        });
      }, 500);

      const result = await uploadBook({
        title: title.trim(),
        author: author.trim() || undefined,
        description: description.trim() || undefined,
        category,
        subject: subject.trim() || undefined,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: FILE_EXTENSION_MAP[file.type],
      });

      clearInterval(progressInterval);
      setProgress(100);

      // Step 3: Success!
      setUploadResult({
        id: result.id,
        coverImageUrl: result.coverImageUrl,
        status: result.status,
        isPublished: result.isPublished ?? false,
      });
      setStatus('success');
      setRetryCount(0);

      // Notify parent after showing success state
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 3000);

    } catch (err) {
      setStatus('error');
      setProgress(0);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(errorMessage);
    }
  }, [file, title, author, description, category, subject, fileToBase64, handleClose, onSuccess]);

  /**
   * Retry failed upload
   */
  const handleRetry = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount((prev) => prev + 1);
      performUpload();
    } else {
      setError(`Upload failed after ${MAX_RETRIES} attempts. Please try again later.`);
    }
  }, [retryCount, performUpload]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    performUpload();
  }, [title, file, performUpload]);

  /**
   * Get file type icon
   */
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'application/pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'application/epub+zip':
        return <BookOpen className="w-8 h-8 text-purple-500" />;
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return <FileType className="w-8 h-8 text-orange-500" />;
      default:
        return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Check if user is admin (for showing appropriate status message)
  const isAdmin = user?.uid && localStorage.getItem('aurikrex-user')?.includes('"role":"admin"');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Upload Book
          </DialogTitle>
          <DialogDescription>
            Share learning materials with the community. 
            {isAdmin 
              ? ' Your uploads will be published immediately.'
              : ' Files are reviewed before publishing.'}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Success State */}
          {status === 'success' && uploadResult && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="p-4 rounded-full bg-green-500/10 mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Successful!</h3>
              <p className="text-muted-foreground mb-4">
                {uploadResult.isPublished 
                  ? 'Your book has been published and is now visible in the library.'
                  : 'Your book has been submitted and is awaiting admin approval.'}
              </p>
              
              {/* Cover Preview */}
              {uploadResult.coverImageUrl && (
                <div className="mt-4 p-2 border rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-2">Generated Cover</p>
                  <img 
                    src={uploadResult.coverImageUrl} 
                    alt="Book cover" 
                    className="w-24 h-32 object-cover rounded shadow-md mx-auto"
                  />
                </div>
              )}
              
              {/* Status Badge */}
              <div className={`mt-4 px-3 py-1 rounded-full text-sm font-medium ${
                uploadResult.isPublished 
                  ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                  : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
              }`}>
                {uploadResult.isPublished ? '✓ Published' : '⏳ Pending Approval'}
              </div>
            </motion.div>
          )}

          {/* Upload Form */}
          {status !== 'success' && (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* File Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                  dragActive 
                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                    : file 
                      ? 'border-green-500 bg-green-500/5' 
                      : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                } ${(status === 'uploading' || status === 'processing') ? 'pointer-events-none opacity-70' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.epub,.pptx,application/pdf,application/epub+zip,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={status === 'uploading' || status === 'processing'}
                />
                
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    {getFileIcon(file.type)}
                    <div className="text-left">
                      <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)} • {FILE_TYPE_LABELS[FILE_EXTENSION_MAP[file.type]] || 'Unknown'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      disabled={status === 'uploading' || status === 'processing'}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium">Drop file here or click to browse</p>
                      <p className="text-sm text-muted-foreground">
                        PDF, EPUB, or PPTX only (max 100MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {(status === 'uploading' || status === 'processing') && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {status === 'uploading' ? 'Reading file...' : 'Processing upload...'}
                    </span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </motion.div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter book title"
                  disabled={status === 'uploading' || status === 'processing'}
                  required
                />
              </div>

              {/* Author */}
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Enter author name (optional)"
                  disabled={status === 'uploading' || status === 'processing'}
                />
              </div>

              {/* Category & Subject Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={category}
                    onValueChange={(value) => setCategory(value as BookCategoryType)}
                    disabled={status === 'uploading' || status === 'processing'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Math, Physics"
                    disabled={status === 'uploading' || status === 'processing'}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the content (optional)"
                  rows={3}
                  disabled={status === 'uploading' || status === 'processing'}
                />
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm">{error}</p>
                    {status === 'error' && retryCount < MAX_RETRIES && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRetry}
                        className="mt-2 h-7 px-2 text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retry ({MAX_RETRIES - retryCount} attempts left)
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Info Notice */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400">
                <ImageIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs">
                  A cover image will be automatically generated from your file 
                  (first page for PDFs, first slide for PPTX).
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={status === 'uploading' || status === 'processing'}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={status === 'uploading' || status === 'processing' || !file || !title.trim()}
                >
                  {status === 'uploading' || status === 'processing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {status === 'uploading' ? 'Reading...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Book
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default UploadBookModal;
