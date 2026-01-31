/**
 * UploadBookModal Component
 * 
 * Modal for uploading books to the library.
 * Supports file upload with metadata (title, author, description, category, subject).
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  BookOpen 
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { uploadBook } from '@/utils/libraryApi';
import type { BookCategoryType, BookFileType } from '@/types';

interface UploadBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/epub+zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/png',
  'image/jpeg',
];

const FILE_EXTENSION_MAP: Record<string, BookFileType> = {
  'application/pdf': 'pdf',
  'application/epub+zip': 'epub',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'image/png': 'png',
  'image/jpeg': 'jpg',
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

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function UploadBookModal({ open, onOpenChange, onSuccess }: UploadBookModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BookCategoryType>('other');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setDescription('');
    setCategory('other');
    setSubject('');
    setFile(null);
    setStatus('idle');
    setError(null);
  };

  const handleClose = () => {
    if (status !== 'uploading') {
      resetForm();
      onOpenChange(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Invalid file type. Allowed: PDF, EPUB, DOC, DOCX, PPT, PPTX, TXT, PNG, JPG';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 100MB limit';
    }
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
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
      setTitle(nameWithoutExt);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setStatus('uploading');
    setError(null);

    try {
      // Convert file to base64 data URL for upload
      const fileUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      await uploadBook({
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

      setStatus('success');
      
      // Close modal after success message
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to upload book');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Upload Book
          </DialogTitle>
          <DialogDescription>
            Share learning materials with the community. Files are reviewed before publishing.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {status === 'success' ? (
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
              <p className="text-muted-foreground">
                Your book has been submitted and is awaiting admin approval.
              </p>
            </motion.div>
          ) : (
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
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : file 
                      ? 'border-green-500 bg-green-500/5' 
                      : 'border-border hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={status === 'uploading'}
                />
                
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-green-500" />
                    <div className="text-left">
                      <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      disabled={status === 'uploading'}
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
                        PDF, EPUB, DOC, PPT, TXT, PNG, JPG (max 100MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter book title"
                  disabled={status === 'uploading'}
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
                  disabled={status === 'uploading'}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(value) => setCategory(value as BookCategoryType)}
                  disabled={status === 'uploading'}
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

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Mathematics, Physics (optional)"
                  disabled={status === 'uploading'}
                />
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
                  disabled={status === 'uploading'}
                />
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={status === 'uploading'}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={status === 'uploading' || !file || !title.trim()}
                >
                  {status === 'uploading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
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
