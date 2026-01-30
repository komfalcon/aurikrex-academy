/**
 * Response Formatter Service
 * 
 * Transforms raw AI responses into clean, formatted output.
 * 
 * Purpose:
 * - Clean raw AI text (remove excessive symbols, fix spacing)
 * - Parse into structured sections
 * - Format based on response type (teach, question, hint, review)
 * - Convert to clean markdown, HTML, and plain text
 * 
 * This service complements ResponseRefinerService by providing
 * additional formatting utilities and output formats.
 */

import { log } from '../utils/logger.js';
import { 
  AIRequestType, 
  SectionType, 
  ResponseSection, 
  ResponseStructure 
} from '../types/ai.types.js';

/**
 * Formatted response output
 */
export interface FormattedResponse {
  /** Clean markdown-formatted text */
  formatted: string;
  /** HTML-formatted text (sanitized) */
  html: string;
  /** Plain text without formatting */
  plainText: string;
  /** Structured representation of the response */
  structure: ResponseStructure;
  /** Original raw text */
  raw: string;
}

/**
 * Response Formatter Service
 * Cleans and formats raw AI responses for display
 */
export class ResponseFormatterService {

  /**
   * Transform raw AI response into clean, formatted output
   */
  static formatResponse(
    rawText: string,
    responseType: AIRequestType
  ): FormattedResponse {
    log.info(`📝 Formatting response for type: ${responseType}`);

    // Step 1: Clean raw text
    const cleaned = this.cleanRawText(rawText);

    // Step 2: Parse into sections
    const sections = this.parseIntoSections(cleaned);

    // Step 3: Format based on type
    let formatted: string;
    switch (responseType) {
      case 'teach':
        formatted = this.formatTeachingResponse(sections);
        break;
      case 'question':
        formatted = this.formatQuestionResponse(sections);
        break;
      case 'hint':
        formatted = this.formatHintResponse(sections);
        break;
      case 'review':
        formatted = this.formatReviewResponse(sections);
        break;
      case 'explanation':
        formatted = this.formatExplanationResponse(sections);
        break;
      default:
        formatted = cleaned;
    }

    // Step 4: Convert to clean markdown
    const markdown = this.ensureCleanMarkdown(formatted);

    // Step 5: Convert to HTML
    const html = this.markdownToHTML(markdown);

    // Step 6: Plain text version
    const plainText = this.markdownToPlainText(markdown);

    // Step 7: Extract structure
    const structure = this.extractStructure(sections);

    log.info(`✅ Response formatted`, {
      responseType,
      rawLength: rawText.length,
      formattedLength: markdown.length,
      sectionCount: sections.length,
    });

    return {
      formatted: markdown,
      html,
      plainText,
      structure,
      raw: rawText,
    };
  }

  /**
   * Clean raw AI output
   * Removes excessive formatting, fixes spacing, normalizes structure
   */
  static cleanRawText(text: string): string {
    return text
      .trim()
      // Fix excessive newlines (max 2)
      .replace(/\n{3,}/g, '\n\n')
      // Remove trailing spaces on each line
      .replace(/\s+$/gm, '')
      // Normalize bold formatting (** to **)
      .replace(/\*\*\*+/g, '**')
      // Fix broken bold (e.g., ** text ** -> **text**)
      .replace(/\*\*\s+/g, '**')
      .replace(/\s+\*\*/g, '**')
      // Fix multiple consecutive asterisks without text
      .replace(/\*{3,}/g, '**')
      // Fix emoji spacing
      .replace(/\s+([🔴🟡🟢✅❌📚💡🎯📝🔑⚠️🚀])\s*/g, '\n$1 ')
      // Normalize list markers
      .replace(/^[•●○]\s*/gm, '- ')
      // Fix numbered lists with inconsistent spacing
      .replace(/^(\d+)\.\s{2,}/gm, '$1. ')
      // Remove HTML comments if any
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove markdown escape characters that might be excessive
      .replace(/\\([*_`#])/g, '$1')
      // Ensure headers have proper spacing
      .replace(/^(#{1,6})([^\s#])/gm, '$1 $2')
      // Remove duplicate spaces
      .replace(/  +/g, ' ');
  }

  /**
   * Parse text into structured sections
   */
  static parseIntoSections(text: string): ResponseSection[] {
    const sections: ResponseSection[] = [];
    const lines = text.split('\n');
    
    let currentSection: ResponseSection | null = null;
    let contentBuffer: string[] = [];

    for (const line of lines) {
      // Header detection
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.content = contentBuffer.join('\n').trim();
          if (currentSection.content || currentSection.heading) {
            sections.push(currentSection);
          }
        }
        
        const title = headerMatch[2].trim();
        currentSection = {
          heading: title,
          content: '',
          type: this.categorizeSection(title),
        };
        contentBuffer = [];
      } else {
        contentBuffer.push(line);
      }
    }

    // Don't forget the last section
    if (currentSection) {
      currentSection.content = contentBuffer.join('\n').trim();
      if (currentSection.content || currentSection.heading) {
        sections.push(currentSection);
      }
    } else if (contentBuffer.length > 0) {
      // No headers found - treat entire text as one section
      const content = contentBuffer.join('\n').trim();
      if (content) {
        sections.push({
          heading: '',
          content,
          type: 'text',
        });
      }
    }

    return sections;
  }

  /**
   * Categorize section type based on heading
   */
  static categorizeSection(heading: string): SectionType {
    const h = heading.toLowerCase();
    
    // Map keywords to section types
    if (h.includes('example') || h.includes('worked') || h.includes('demonstration')) {
      return 'example';
    }
    if (h.includes('formula') || h.includes('equation') || h.includes('math')) {
      return 'math';
    }
    if (h.includes('code') || h.includes('implementation')) {
      return 'example';
    }
    if (h.includes('summary') || h.includes('key') || h.includes('takeaway')) {
      return 'text';
    }
    if (h.includes('practice') || h.includes('exercise') || h.includes('try')) {
      return 'practice';
    }
    if (h.includes('concept') || h.includes('overview') || h.includes('introduction')) {
      return 'concept';
    }
    if (h.includes('error') || h.includes('mistake') || h.includes('wrong')) {
      return 'error';
    }
    if (h.includes('solution') || h.includes('answer') || h.includes('correct')) {
      return 'solution';
    }
    if (h.includes('hint') || h.includes('approach') || h.includes('strategy')) {
      return 'approach';
    }
    if (h.includes('resource') || h.includes('further') || h.includes('learn more')) {
      return 'resource';
    }
    if (h.includes('strength') || h.includes('well done') || h.includes('good')) {
      return 'strength';
    }
    if (h.includes('improve') || h.includes('suggestion') || h.includes('recommend')) {
      return 'improvement';
    }
    if (h.includes('feedback') || h.includes('assessment') || h.includes('review')) {
      return 'feedback';
    }
    
    return 'text';
  }

  /**
   * Format teaching response
   */
  static formatTeachingResponse(sections: ResponseSection[]): string {
    let result = '';
    
    // Find key sections
    const conceptSections = sections.filter(s => s.type === 'concept');
    const mathSections = sections.filter(s => s.type === 'math');
    const exampleSections = sections.filter(s => s.type === 'example');
    const practiceSections = sections.filter(s => s.type === 'practice');
    const resourceSections = sections.filter(s => s.type === 'resource');
    const otherSections = sections.filter(s => 
      !['concept', 'math', 'example', 'practice', 'resource'].includes(s.type)
    );

    // Build structured output
    // Title from first section with heading
    const titleSection = sections.find(s => s.heading);
    if (titleSection?.heading) {
      result += `# ${titleSection.heading}\n\n`;
    }

    // Concepts first
    if (conceptSections.length > 0) {
      for (const section of conceptSections) {
        if (section.heading && section.heading !== titleSection?.heading) {
          result += `## ${section.heading}\n\n`;
        }
        result += `${section.content}\n\n`;
      }
    }

    // Mathematical framework
    if (mathSections.length > 0) {
      result += `## Mathematical Framework\n\n`;
      for (const section of mathSections) {
        result += `${section.content}\n\n`;
      }
    }

    // Examples
    if (exampleSections.length > 0) {
      result += `## Worked Examples\n\n`;
      exampleSections.forEach((section, i) => {
        if (exampleSections.length > 1) {
          result += `### Example ${i + 1}\n\n`;
        }
        result += `${section.content}\n\n`;
      });
    }

    // Other sections
    for (const section of otherSections) {
      if (section !== titleSection && section.content) {
        if (section.heading) {
          result += `## ${section.heading}\n\n`;
        }
        result += `${section.content}\n\n`;
      }
    }

    // Practice
    if (practiceSections.length > 0) {
      result += `## Practice Problems\n\n`;
      for (const section of practiceSections) {
        result += `${section.content}\n\n`;
      }
    }

    // Resources
    if (resourceSections.length > 0) {
      result += `## Further Resources\n\n`;
      for (const section of resourceSections) {
        result += `${section.content}\n\n`;
      }
    }

    return result.trim();
  }

  /**
   * Format question response
   */
  static formatQuestionResponse(sections: ResponseSection[]): string {
    let result = '';
    
    // Find answer section
    const answerSection = sections.find(s => 
      s.type === 'solution' || 
      s.heading?.toLowerCase().includes('answer')
    );

    // Put answer first if found
    if (answerSection) {
      result += `## Answer\n\n${answerSection.content}\n\n`;
    }

    // Include other sections
    for (const section of sections) {
      if (section !== answerSection && section.content) {
        if (section.heading) {
          result += `## ${section.heading}\n\n`;
        }
        result += `${section.content}\n\n`;
      }
    }

    return result.trim() || sections.map(s => s.content).join('\n\n').trim();
  }

  /**
   * Format hint response
   */
  static formatHintResponse(sections: ResponseSection[]): string {
    let result = `# Working Through This Problem\n\n`;

    const understandingSection = sections.find(s => s.type === 'understanding');
    const conceptSection = sections.find(s => s.type === 'concept');
    const approachSection = sections.find(s => s.type === 'approach');
    
    if (understandingSection) {
      result += `## Understanding the Problem\n\n${understandingSection.content}\n\n`;
    }
    
    if (conceptSection) {
      result += `## Key Concepts Involved\n\n${conceptSection.content}\n\n`;
    }
    
    if (approachSection) {
      result += `## Suggested Approach\n\n${approachSection.content}\n\n`;
    }

    // Step-by-step hints
    const stepSections = sections.filter(s => 
      s.heading?.toLowerCase().includes('step') || 
      s.heading?.toLowerCase().includes('hint')
    );
    
    if (stepSections.length > 0) {
      result += `## Step-by-Step Hints\n\n`;
      stepSections.forEach((step, i) => {
        result += `### ${step.heading || `Step ${i + 1}`}\n\n${step.content}\n\n`;
      });
    }

    // Other sections
    const processedSections = [understandingSection, conceptSection, approachSection, ...stepSections];
    const otherSections = sections.filter(s => !processedSections.includes(s));
    
    for (const section of otherSections) {
      if (section.content) {
        if (section.heading) {
          result += `## ${section.heading}\n\n`;
        }
        result += `${section.content}\n\n`;
      }
    }

    result += `\n> ⚠️ **Remember:** Try to solve it yourself first. These are hints, not solutions!\n\n`;
    result += `## Next Step\n\nTry the approach above. When you get stuck, I can help with the next hint!\n`;

    return result.trim();
  }

  /**
   * Format review response
   */
  static formatReviewResponse(sections: ResponseSection[]): string {
    let result = `# Solution Review\n\n`;

    const assessmentSection = sections.find(s => s.type === 'assessment' || s.type === 'feedback');
    const strengthSections = sections.filter(s => s.type === 'strength');
    const errorSections = sections.filter(s => s.type === 'error');
    const solutionSection = sections.find(s => s.type === 'solution');
    const improvementSection = sections.find(s => s.type === 'improvement');

    if (assessmentSection) {
      result += `## Overall Assessment\n\n${assessmentSection.content}\n\n`;
    }

    if (strengthSections.length > 0) {
      result += `## ✅ What You Did Well\n\n`;
      for (const s of strengthSections) {
        result += `${s.content}\n\n`;
      }
    }

    if (errorSections.length > 0) {
      result += `## ❌ Errors Found\n\n`;
      for (const e of errorSections) {
        result += `${e.content}\n\n`;
      }
    }

    if (solutionSection) {
      result += `## Correct Solution\n\n${solutionSection.content}\n\n`;
    }

    if (improvementSection) {
      result += `## How to Improve\n\n${improvementSection.content}\n\n`;
    }

    // Include other sections
    const processedSections = [
      assessmentSection, 
      ...strengthSections, 
      ...errorSections, 
      solutionSection, 
      improvementSection
    ].filter(Boolean);
    
    const otherSections = sections.filter(s => !processedSections.includes(s));
    
    for (const section of otherSections) {
      if (section.content) {
        if (section.heading) {
          result += `## ${section.heading}\n\n`;
        }
        result += `${section.content}\n\n`;
      }
    }

    return result.trim();
  }

  /**
   * Format explanation response
   */
  static formatExplanationResponse(sections: ResponseSection[]): string {
    let result = '';

    for (const section of sections) {
      if (section.heading) {
        result += `## ${section.heading}\n\n`;
      }
      result += `${section.content}\n\n`;
    }

    return result.trim() || sections.map(s => s.content).join('\n\n').trim();
  }

  /**
   * Ensure markdown is clean and properly formatted
   */
  static ensureCleanMarkdown(markdown: string): string {
    return markdown
      // Ensure proper header spacing
      .replace(/^(#{1,6})\s+/gm, (_match, hashes) => `${hashes} `)
      // Ensure proper list spacing
      .replace(/^(-|\*|\d+\.)\s+/gm, (_match, marker) => `${marker} `)
      // Remove empty list items
      .replace(/^(-|\*)\s*$/gm, '')
      // Fix excessive blank lines
      .replace(/\n{3,}/g, '\n\n')
      // Ensure file ends with single newline
      .trim() + '\n';
  }

  /**
   * Convert markdown to clean HTML
   */
  static markdownToHTML(markdown: string): string {
    let html = markdown
      // Headers (process in reverse order to avoid ## matching # first)
      .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
      .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Bold (before italic to avoid conflicts)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```(\w*)\n([\s\S]+?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      // Inline code
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      // Blockquotes
      .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // Horizontal rules
      .replace(/^---+$/gm, '<hr>')
      // Line breaks within paragraphs
      .replace(/\n(?=[^\n])/g, '<br>\n');

    // Process lists (bullet and numbered)
    html = this.processLists(html);

    // Wrap remaining text in paragraphs
    html = this.wrapParagraphs(html);

    // Clean up consecutive blockquotes
    html = html.replace(/<\/blockquote>\s*<blockquote>/g, '<br>');

    return html;
  }

  /**
   * Process markdown lists to HTML
   */
  private static processLists(html: string): string {
    // Process bullet lists
    html = html.replace(/(^[-*]\s+.+$\n?)+/gm, (match) => {
      const items = match
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<li>${line.replace(/^[-*]\s+/, '')}</li>`)
        .join('\n');
      return `<ul>\n${items}\n</ul>\n`;
    });

    // Process numbered lists
    html = html.replace(/(^\d+\.\s+.+$\n?)+/gm, (match) => {
      const items = match
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<li>${line.replace(/^\d+\.\s+/, '')}</li>`)
        .join('\n');
      return `<ol>\n${items}\n</ol>\n`;
    });

    return html;
  }

  /**
   * Wrap text content in paragraph tags
   */
  private static wrapParagraphs(html: string): string {
    // Split by block elements
    const blocks = html.split(/(<(?:h[1-6]|ul|ol|pre|blockquote|hr)[^>]*>[\s\S]*?<\/(?:h[1-6]|ul|ol|pre|blockquote)>|<hr>)/);
    
    const result = blocks.map(block => {
      // Skip if already a block element
      if (block.match(/^<(?:h[1-6]|ul|ol|pre|blockquote|hr|p)/)) {
        return block;
      }
      // Skip empty blocks
      if (!block.trim()) {
        return '';
      }
      // Wrap text content in paragraphs
      const paragraphs = block.split(/\n\n+/).filter(p => p.trim());
      return paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
    });

    return result.join('\n').replace(/\n{3,}/g, '\n\n');
  }

  /**
   * Convert markdown to plain text
   */
  static markdownToPlainText(markdown: string): string {
    return markdown
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
      // Remove code blocks (keep content)
      .replace(/```\w*\n([\s\S]+?)```/g, '$1')
      // Remove inline code markers
      .replace(/`([^`]+)`/g, '$1')
      // Remove links (keep text)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove blockquote markers
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules
      .replace(/^---+$/gm, '')
      // Convert list markers to bullet
      .replace(/^[-*]\s+/gm, '• ')
      // Keep numbered lists as-is
      // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Extract structured representation from sections
   */
  static extractStructure(sections: ResponseSection[]): ResponseStructure {
    // Extract title
    const titleSection = sections.find(s => s.heading);
    const title = titleSection?.heading;

    // Extract summary (first 200 chars of first content section)
    const contentSection = sections.find(s => s.content);
    const summary = contentSection?.content.substring(0, 200);

    // Extract key takeaways
    const keyTakeaways = this.extractKeyTakeaways(sections);

    // Extract next steps
    const nextSteps = this.extractNextSteps(sections);

    return {
      title,
      sections,
      summary,
      keyTakeaways,
      nextSteps,
    };
  }

  /**
   * Extract key takeaways from sections
   */
  private static extractKeyTakeaways(sections: ResponseSection[]): string[] {
    const takeaways: string[] = [];

    // Look for explicit takeaways section
    const takeawaySection = sections.find(s => 
      s.heading?.toLowerCase().includes('takeaway') ||
      s.heading?.toLowerCase().includes('key point') ||
      s.heading?.toLowerCase().includes('summary')
    );

    if (takeawaySection) {
      // Extract bullet points
      const bullets = takeawaySection.content.match(/^[-*•]\s*(.+)$/gm);
      if (bullets) {
        takeaways.push(...bullets.map(b => b.replace(/^[-*•]\s*/, '').trim()));
      }
    }

    // If no explicit takeaways, try to extract from concepts
    if (takeaways.length === 0) {
      const conceptSection = sections.find(s => s.type === 'concept');
      if (conceptSection) {
        const sentences = conceptSection.content
          .split(/[.!?]+/)
          .filter(s => s.trim().length > 20);
        takeaways.push(...sentences.slice(0, 3).map(s => s.trim()));
      }
    }

    return takeaways.slice(0, 5);
  }

  /**
   * Extract next steps from sections
   */
  private static extractNextSteps(sections: ResponseSection[]): string[] {
    const nextSteps: string[] = [];

    // Look for explicit next steps section
    const nextStepSection = sections.find(s => 
      s.heading?.toLowerCase().includes('next step') ||
      s.heading?.toLowerCase().includes('further') ||
      s.heading?.toLowerCase().includes('practice')
    );

    if (nextStepSection) {
      const bullets = nextStepSection.content.match(/^[-*•]\s*(.+)$/gm);
      if (bullets) {
        nextSteps.push(...bullets.map(b => b.replace(/^[-*•]\s*/, '').trim()));
      }
    }

    return nextSteps.slice(0, 5);
  }
}

// Export singleton instance for convenience
export const responseFormatterService = ResponseFormatterService;

export default ResponseFormatterService;
