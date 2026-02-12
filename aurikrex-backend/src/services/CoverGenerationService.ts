import { log } from '../utils/logger.js';
import type { CoverGenerationStatus } from '../models/Book.model.js';
import { 
  isCloudinaryConfigured, 
  uploadBase64ToCloudinary,
  generateCoverUrl
} from '../config/cloudinary.js';

export interface CoverGenerationResult {
  url: string | null;
  status: CoverGenerationStatus;
}

/**
 * CoverGenerationService
 * 
 * Handles automatic cover generation for uploaded books:
 * - PDF: Renders first page as cover image via Cloudinary transformation
 * - PPTX: Generates cover from first slide (placeholder until OCR/render implemented)
 * - EPUB: Extracts cover image or generates placeholder
 * 
 * Uses Cloudinary's built-in PDF rendering capabilities when available.
 */
class CoverGenerationService {

  /**
   * Extract cover from PDF using Cloudinary's PDF rendering
   * Cloudinary can automatically render the first page of a PDF as an image
   */
  async extractCoverFromPDF(pdfUrl: string, publicId?: string): Promise<string | null> {
    try {
      if (!isCloudinaryConfigured()) {
        log.info('📄 Cloudinary not configured - cannot extract PDF cover');
        return null;
      }

      // If we have a Cloudinary public ID, use transformation to get first page as image
      if (publicId) {
        // Cloudinary can render PDF pages as images using transformations
        // pg_1 = page 1, f_jpg = format jpg, w_400 = width 400px
        const coverUrl = generateCoverUrl(publicId, {
          width: 400,
          height: 600,
          page: 1,
          format: 'jpg'
        });

        if (coverUrl) {
          log.info('✅ PDF cover extracted via Cloudinary transformation', { coverUrl });
          return coverUrl;
        }
      }

      // Alternative: If PDF is already uploaded, we can derive the cover URL
      if (pdfUrl && pdfUrl.includes('cloudinary')) {
        // Transform the PDF URL to get first page as image
        const coverUrl = pdfUrl
          .replace('/upload/', '/upload/pg_1,w_400,h_600,c_fill,q_auto,f_jpg/')
          .replace('.pdf', '.jpg');
        
        log.info('✅ PDF cover URL derived from PDF URL', { coverUrl });
        return coverUrl;
      }

      log.info('📄 PDF cover extraction - no Cloudinary URL available');
      return null;
    } catch (error) {
      log.error('❌ Failed to extract cover from PDF', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Generate cover from PPTX first slide
   * Uses Cloudinary's document processing if available
   */
  async extractCoverFromPPTX(pptxUrl: string, publicId?: string): Promise<string | null> {
    try {
      if (!isCloudinaryConfigured()) {
        log.info('📊 Cloudinary not configured - cannot extract PPTX cover');
        return null;
      }

      // Cloudinary supports rendering PPTX slides as images
      if (publicId) {
        const coverUrl = generateCoverUrl(publicId, {
          width: 400,
          height: 300, // 4:3 aspect ratio for slides
          page: 1,
          format: 'jpg'
        });

        if (coverUrl) {
          log.info('✅ PPTX cover extracted via Cloudinary transformation', { coverUrl });
          return coverUrl;
        }
      }

      // Alternative: Transform PPTX URL
      if (pptxUrl && pptxUrl.includes('cloudinary')) {
        const coverUrl = pptxUrl
          .replace('/upload/', '/upload/pg_1,w_400,h_300,c_fill,q_auto,f_jpg/')
          .replace('.pptx', '.jpg');
        
        log.info('✅ PPTX cover URL derived from PPTX URL', { coverUrl });
        return coverUrl;
      }

      log.info('📊 PPTX cover extraction - no Cloudinary URL available');
      return null;
    } catch (error) {
      log.error('❌ Failed to extract cover from PPTX', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Extract cover from EPUB
   * EPUB files typically contain a cover image in their metadata
   * Since Cloudinary doesn't natively process EPUB, we generate a placeholder
   */
  async extractCoverFromEPUB(_epubUrl: string): Promise<string | null> {
    try {
      // EPUB cover extraction requires parsing the EPUB file
      // This would need a library like epub-parser or jszip
      // For now, return null to trigger placeholder generation
      log.info('📚 EPUB cover extraction - generating placeholder');
      return null;
    } catch (error) {
      log.error('❌ Failed to extract cover from EPUB', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Generate an SVG placeholder cover with gradient background
   */
  generatePlaceholderSVG(bookTitle: string, fileType: string = 'pdf'): string {
    const width = 300;
    const height = 400;
    
    // Choose gradient based on file type
    const gradients: Record<string, { start: string; end: string }> = {
      pdf: { start: '#667eea', end: '#764ba2' },  // Purple gradient
      epub: { start: '#f093fb', end: '#f5576c' }, // Pink gradient  
      pptx: { start: '#4facfe', end: '#00f2fe' }, // Blue gradient
    };
    const gradient = gradients[fileType] || gradients.pdf;
    
    // File type icon
    const icons: Record<string, string> = {
      pdf: '📄',
      epub: '📚',
      pptx: '📊',
    };
    const icon = icons[fileType] || '📁';
    
    // Truncate title for display
    const displayTitle = bookTitle.length > 30 
      ? bookTitle.substring(0, 27) + '...'
      : bookTitle;
    
    // Split title into lines if too long
    const words = displayTitle.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + ' ' + word).length > 15) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      }
    });
    if (currentLine) lines.push(currentLine);
    
    // Generate text elements for each line
    const textElements = lines.map((line, index) => {
      const y = 45 + (index * 12);
      return `<text x="50%" y="${y}%" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="bold">${this.escapeXml(line)}</text>`;
    }).join('\n      ');
    
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)" rx="8"/>
      <rect x="15" y="15" width="${width - 30}" height="${height - 30}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" rx="5"/>
      <text x="50%" y="20%" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle">${icon}</text>
      ${textElements}
      <text x="50%" y="85%" font-size="12" fill="rgba(255,255,255,0.7)" text-anchor="middle" font-family="Arial, sans-serif">Aurikrex Academy</text>
      <text x="50%" y="90%" font-size="10" fill="rgba(255,255,255,0.5)" text-anchor="middle" font-family="Arial, sans-serif">${fileType.toUpperCase()}</text>
    </svg>`;

    return svg;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generate placeholder cover as data URL or upload to Cloudinary
   */
  async generatePlaceholderCover(bookTitle: string, fileType: string = 'pdf'): Promise<string | null> {
    try {
      const svg = this.generatePlaceholderSVG(bookTitle, fileType);
      const base64 = Buffer.from(svg).toString('base64');
      const dataUrl = `data:image/svg+xml;base64,${base64}`;
      
      // If Cloudinary is configured, upload the placeholder for CDN distribution
      if (isCloudinaryConfigured()) {
        try {
          const timestamp = Date.now();
          const sanitizedTitle = bookTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
          const result = await uploadBase64ToCloudinary(dataUrl, {
            folder: 'aurikrex/covers',
            publicId: `placeholder-${timestamp}-${sanitizedTitle}`,
            resourceType: 'image',
          });

          if (result) {
            log.info('🎨 Placeholder cover uploaded to Cloudinary', { 
              title: bookTitle,
              url: result.secure_url 
            });
            return result.secure_url;
          }
        } catch (error) {
          log.warn('⚠️ Failed to upload placeholder to Cloudinary, using data URL', {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      log.info('🎨 Placeholder cover generated as data URL', { title: bookTitle });
      return dataUrl;
    } catch (error) {
      log.error('❌ Failed to generate placeholder cover', { 
        error: error instanceof Error ? error.message : String(error),
        title: bookTitle 
      });
      return null;
    }
  }

  /**
   * Main cover generation method
   * Attempts to extract cover from file, falls back to placeholder
   * 
   * @param fileUrl - URL of the uploaded file
   * @param fileType - Type of file (pdf, epub, pptx)
   * @param bookTitle - Title for placeholder generation
   * @param publicId - Cloudinary public ID if available
   */
  async generateCover(
    fileUrl: string,
    fileType: string,
    bookTitle: string,
    publicId?: string
  ): Promise<CoverGenerationResult> {
    try {
      let coverUrl: string | null = null;

      // Try to extract cover based on file type
      switch (fileType.toLowerCase()) {
        case 'pdf':
          coverUrl = await this.extractCoverFromPDF(fileUrl, publicId);
          break;
        case 'pptx':
          coverUrl = await this.extractCoverFromPPTX(fileUrl, publicId);
          break;
        case 'epub':
          coverUrl = await this.extractCoverFromEPUB(fileUrl);
          break;
        default:
          log.info(`📁 Unknown file type: ${fileType}, generating placeholder`);
      }

      // If extraction successful, return the cover
      if (coverUrl) {
        return { url: coverUrl, status: 'generated' };
      }
      
      // If extraction fails, generate placeholder
      const placeholderUrl = await this.generatePlaceholderCover(bookTitle, fileType);
      return {
        url: placeholderUrl,
        status: placeholderUrl ? 'generated' : 'failed'
      };
    } catch (error) {
      log.error('❌ Cover generation error', { 
        error: error instanceof Error ? error.message : String(error),
        fileType,
        title: bookTitle 
      });
      
      // Last resort: try placeholder
      const placeholderUrl = await this.generatePlaceholderCover(bookTitle, fileType);
      return { 
        url: placeholderUrl, 
        status: placeholderUrl ? 'generated' : 'failed' 
      };
    }
  }

  /**
   * Legacy method for backward compatibility
   * Now delegates to main generateCover method
   */
  async extractCoverFromPDFBuffer(_fileBuffer: Buffer): Promise<string | null> {
    log.info('📄 Legacy PDF buffer cover extraction called - use generateCover instead');
    return null;
  }
}

export default new CoverGenerationService();
