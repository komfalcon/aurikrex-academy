import { log } from '../utils/logger.js';
import type { CoverGenerationStatus } from '../models/Book.model.js';

export interface CoverGenerationResult {
  url: string | null;
  status: CoverGenerationStatus;
}

/**
 * CoverGenerationService
 * Handles automatic cover generation for books
 * - Extracts first page from PDFs as cover
 * - Generates placeholder covers with gradient background and title
 */
class CoverGenerationService {
  /**
   * Extract cover from PDF (first page)
   * 
   * PLACEHOLDER: This function returns null as actual PDF-to-image extraction requires
   * additional libraries like pdf-lib, pdfjs-dist, or sharp for rendering.
   * 
   * To implement:
   * 1. Use pdfjs-dist to render the first page to a canvas
   * 2. Convert canvas to image buffer
   * 3. Upload to cloud storage and return URL
   * 
   * For now, the system falls back to generating placeholder covers.
   */
  async extractCoverFromPDF(_fileBuffer: Buffer): Promise<string | null> {
    try {
      // TODO: Implement actual PDF cover extraction
      // Requirements: pdfjs-dist, canvas, sharp
      log.info('📄 PDF cover extraction not implemented - falling back to placeholder');
      return null;
    } catch (error) {
      log.error('❌ Failed to extract cover from PDF', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Generate an SVG placeholder cover
   */
  generatePlaceholderSVG(bookTitle: string): string {
    const width = 300;
    const height = 400;
    
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
      const y = 50 + (index * 12);
      return `<text x="50%" y="${y}%" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="bold">${this.escapeXml(line)}</text>`;
    }).join('\n      ');
    
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
      <rect x="15" y="15" width="${width - 30}" height="${height - 30}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" rx="5"/>
      ${textElements}
      <text x="50%" y="85%" font-size="14" fill="rgba(255,255,255,0.7)" text-anchor="middle" font-family="Arial, sans-serif">📚 Aurikrex Academy</text>
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
   * Generate placeholder cover as data URL
   */
  async generatePlaceholderCover(bookTitle: string): Promise<string | null> {
    try {
      const svg = this.generatePlaceholderSVG(bookTitle);
      const base64 = Buffer.from(svg).toString('base64');
      const dataUrl = `data:image/svg+xml;base64,${base64}`;
      
      log.info('🎨 Placeholder cover generated', { title: bookTitle });
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
   * Handle cover generation
   * Attempts to extract from PDF, falls back to placeholder
   */
  async generateCover(
    fileBuffer: Buffer,
    fileType: string,
    bookTitle: string
  ): Promise<CoverGenerationResult> {
    try {
      // Try to extract cover from PDF
      if (fileType === 'pdf') {
        const coverUrl = await this.extractCoverFromPDF(fileBuffer);
        if (coverUrl) {
          return { url: coverUrl, status: 'generated' };
        }
      }
      
      // If extraction fails or not PDF, generate placeholder
      const placeholderUrl = await this.generatePlaceholderCover(bookTitle);
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
      return { url: null, status: 'failed' };
    }
  }

  /**
   * Generate a cover from image file (PNG/JPG)
   * For when the uploaded file itself is an image
   */
  async generateCoverFromImage(fileBuffer: Buffer, mimeType: string): Promise<string | null> {
    try {
      const base64 = fileBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return dataUrl;
    } catch (error) {
      log.error('❌ Failed to generate cover from image', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
}

export default new CoverGenerationService();
