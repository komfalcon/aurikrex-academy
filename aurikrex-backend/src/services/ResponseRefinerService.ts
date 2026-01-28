/**
 * Response Refiner Service
 * 
 * Layer 2: RESPONSE REFINEMENT (Post-Processing)
 * Cleans up and structures the raw AI response:
 * - Text cleanup
 * - Section parsing
 * - Response formatting by type
 * - Key takeaways extraction
 */

import { log } from '../utils/logger.js';
import {
  AIRequestType,
  SectionType,
  ResponseSection,
  ResponseStructure,
  RefinedResponse,
} from '../types/ai.types.js';

/**
 * Section heading to type mapping
 * Maps keywords to section types for categorization
 */
const SECTION_TYPE_KEYWORDS: Record<string, string[]> = {
  concept: ['concept', 'overview', 'introduction', 'what is', 'definition'],
  math: ['math', 'equation', 'formula', 'calculation', 'mathematical'],
  example: ['example', 'worked', 'demonstration', 'illustration', 'case study'],
  error: ['error', 'wrong', 'mistake', 'incorrect'],
  solution: ['correct', 'solution', 'answer', 'result'],
  misconception: ['misconception', 'common mistake', 'pitfall', 'confusion'],
  practice: ['practice', 'exercise', 'problem', 'challenge', 'quiz'],
  resource: ['resource', 'further reading', 'reference', 'learn more'],
  understanding: ['understanding', 'clarification', 'explanation'],
  approach: ['approach', 'strategy', 'method', 'technique', 'step'],
  assessment: ['assessment', 'evaluation', 'grade', 'score', 'rating'],
  strength: ['strength', 'well done', 'correct', 'good', 'excellent'],
  improvement: ['improve', 'area', 'work on', 'suggestion', 'recommend'],
  feedback: ['feedback', 'comment', 'note', 'encouragement'],
};

/**
 * Response Refiner Service
 * Processes and formats raw AI responses
 */
export class ResponseRefinerService {
  /**
   * Categorize a section based on its heading
   */
  public categorizeSection(heading: string): SectionType {
    const lower = heading.toLowerCase();
    
    for (const [type, keywords] of Object.entries(SECTION_TYPE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          return type as SectionType;
        }
      }
    }
    
    return 'text';
  }

  /**
   * Parse raw response into sections
   */
  public parseIntoSections(text: string): ResponseSection[] {
    // Split by markdown headers
    const headerRegex = /^(#{1,3})\s+(.+)$/gm;
    const sections: ResponseSection[] = [];
    let match;
    
    // Find all headers
    const matches: { heading: string; startIndex: number; endIndex: number }[] = [];
    while ((match = headerRegex.exec(text)) !== null) {
      matches.push({
        heading: match[2].trim(),
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
    
    // Build sections
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const nextStart = matches[i + 1]?.startIndex ?? text.length;
      const content = text.substring(current.endIndex, nextStart).trim();
      
      sections.push({
        heading: current.heading,
        content,
        type: this.categorizeSection(current.heading),
      });
    }
    
    // If no headers found, treat entire text as one section
    if (sections.length === 0 && text.trim()) {
      sections.push({
        heading: '',
        content: text.trim(),
        type: 'text',
      });
    }
    
    // Check for content before first header
    if (matches.length > 0 && matches[0].startIndex > 0) {
      const preHeaderContent = text.substring(0, matches[0].startIndex).trim();
      if (preHeaderContent) {
        sections.unshift({
          heading: 'Introduction',
          content: preHeaderContent,
          type: 'text',
        });
      }
    }
    
    return sections;
  }

  /**
   * Extract title from sections
   */
  private extractTitle(sections: ResponseSection[]): string | undefined {
    if (sections.length > 0) {
      // Check first section heading
      const firstHeading = sections[0].heading;
      if (firstHeading && !firstHeading.toLowerCase().includes('introduction')) {
        return firstHeading;
      }
      // Try to extract from content
      const firstLine = sections[0].content.split('\n')[0];
      if (firstLine && firstLine.length < 100) {
        return firstLine;
      }
    }
    return undefined;
  }

  /**
   * Find a section by type
   */
  private findSection(sections: ResponseSection[], type: SectionType): ResponseSection | undefined {
    return sections.find(s => s.type === type);
  }

  /**
   * Find multiple sections by type
   */
  private findSections(sections: ResponseSection[], type: SectionType): ResponseSection[] {
    return sections.filter(s => s.type === type);
  }

  /**
   * Generate key takeaways from sections
   */
  private generateKeyTakeaways(sections: ResponseSection[]): string[] {
    const takeaways: string[] = [];
    
    // Look for explicit takeaways section
    const takeawaySection = sections.find(s => 
      s.heading.toLowerCase().includes('takeaway') || 
      s.heading.toLowerCase().includes('key point') ||
      s.heading.toLowerCase().includes('summary')
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
      const conceptSection = this.findSection(sections, 'concept');
      if (conceptSection) {
        const sentences = conceptSection.content.split(/[.!?]+/).filter(s => s.trim().length > 20);
        takeaways.push(...sentences.slice(0, 3).map(s => s.trim()));
      }
    }
    
    return takeaways.slice(0, 5); // Limit to 5 takeaways
  }

  /**
   * Generate next steps from sections
   */
  private generateNextSteps(sections: ResponseSection[], requestType: AIRequestType): string[] {
    const nextSteps: string[] = [];
    
    // Look for explicit next steps section
    const nextStepSection = sections.find(s => 
      s.heading.toLowerCase().includes('next step') || 
      s.heading.toLowerCase().includes('further') ||
      s.heading.toLowerCase().includes('resource') ||
      s.heading.toLowerCase().includes('practice')
    );
    
    if (nextStepSection) {
      const bullets = nextStepSection.content.match(/^[-*•]\s*(.+)$/gm);
      if (bullets) {
        nextSteps.push(...bullets.map(b => b.replace(/^[-*•]\s*/, '').trim()));
      }
    }
    
    // Add type-specific suggestions
    if (nextSteps.length === 0) {
      switch (requestType) {
        case 'teach':
          nextSteps.push('Try the practice problems above');
          nextSteps.push('Review the worked examples');
          break;
        case 'hint':
          nextSteps.push('Attempt the problem with the hints provided');
          nextSteps.push('Ask for another hint if still stuck');
          break;
        case 'review':
          nextSteps.push('Address the errors identified');
          nextSteps.push('Resubmit for another review');
          break;
      }
    }
    
    return nextSteps.slice(0, 5);
  }

  /**
   * Clean up raw response text
   */
  private cleanupText(text: string): string {
    return text
      .trim()
      .replace(/\n{3,}/g, '\n\n')        // Remove excessive newlines
      .replace(/\{\{.*?\}\}/g, '')       // Remove template tags
      .replace(/\[\[.*?\]\]/g, '')       // Remove bracket tags
      .replace(/^\s+$/gm, '');           // Remove whitespace-only lines
  }

  /**
   * Format teaching response
   */
  private formatTeachingResponse(sections: ResponseSection[]): string {
    const title = this.extractTitle(sections) || 'Lesson';
    const concept = this.findSection(sections, 'concept');
    const math = this.findSection(sections, 'math');
    const examples = this.findSections(sections, 'example');
    const misconceptions = this.findSection(sections, 'misconception');
    const practice = this.findSection(sections, 'practice');
    const resources = this.findSection(sections, 'resource');
    const allSections = sections.filter(s => 
      !['concept', 'math', 'example', 'misconception', 'practice', 'resource'].includes(s.type)
    );

    let formatted = `# ${title}\n\n`;
    
    if (concept) {
      formatted += `## Core Concepts\n${concept.content}\n\n`;
    }
    
    if (math) {
      formatted += `## Mathematical Framework\n${math.content}\n\n`;
    }
    
    if (examples.length > 0) {
      formatted += `## Worked Examples\n`;
      examples.forEach((ex, i) => {
        formatted += `### Example ${i + 1}\n${ex.content}\n\n`;
      });
    }
    
    if (misconceptions) {
      formatted += `## Common Misconceptions\n${misconceptions.content}\n\n`;
    }
    
    // Include other sections
    allSections.forEach(section => {
      if (section.heading && section.content) {
        formatted += `## ${section.heading}\n${section.content}\n\n`;
      }
    });
    
    if (practice) {
      formatted += `## Practice Problems\n${practice.content}\n\n`;
    }
    
    if (resources) {
      formatted += `## Further Resources\n${resources.content}\n\n`;
    }
    
    return formatted;
  }

  /**
   * Format question response
   */
  private formatQuestionResponse(sections: ResponseSection[]): string {
    let formatted = '';
    
    // Put the main answer first
    const answerSection = sections.find(s => 
      s.type === 'solution' || s.heading.toLowerCase().includes('answer')
    );
    
    if (answerSection) {
      formatted += `## Answer\n${answerSection.content}\n\n`;
    }
    
    // Include other sections
    sections.forEach(section => {
      if (section !== answerSection && section.content) {
        if (section.heading) {
          formatted += `## ${section.heading}\n${section.content}\n\n`;
        } else {
          formatted += `${section.content}\n\n`;
        }
      }
    });
    
    return formatted || sections.map(s => s.content).join('\n\n');
  }

  /**
   * Format hint response
   */
  private formatHintResponse(sections: ResponseSection[]): string {
    const understanding = this.findSection(sections, 'understanding');
    const concept = this.findSection(sections, 'concept');
    const approach = this.findSection(sections, 'approach');
    
    let formatted = `# Working Through This Problem\n\n`;
    
    if (understanding) {
      formatted += `## Understanding the Problem\n${understanding.content}\n\n`;
    }
    
    if (concept) {
      formatted += `## Key Concepts Involved\n${concept.content}\n\n`;
    }
    
    if (approach) {
      formatted += `## Suggested Approach\n${approach.content}\n\n`;
    }
    
    // Include step-by-step hints
    const stepSections = sections.filter(s => 
      s.heading.toLowerCase().includes('step') || s.heading.toLowerCase().includes('hint')
    );
    
    if (stepSections.length > 0) {
      formatted += `## Step-by-Step Hints\n`;
      stepSections.forEach((step, i) => {
        formatted += `### ${step.heading || `Step ${i + 1}`}\n${step.content}\n\n`;
      });
    }
    
    // Include remaining sections
    const otherSections = sections.filter(s => 
      s !== understanding && 
      s !== concept && 
      s !== approach && 
      !stepSections.includes(s)
    );
    
    otherSections.forEach(section => {
      if (section.content) {
        if (section.heading) {
          formatted += `## ${section.heading}\n${section.content}\n\n`;
        } else {
          formatted += `${section.content}\n\n`;
        }
      }
    });
    
    formatted += `\n> ⚠️ **Remember:** Try to solve it yourself first. These are hints, not solutions!\n\n`;
    formatted += `## Next Step\nTry the approach above. When you get stuck, I can help with the next hint!\n`;
    
    return formatted;
  }

  /**
   * Format review response
   */
  private formatReviewResponse(sections: ResponseSection[]): string {
    const assessment = this.findSection(sections, 'assessment');
    const strengths = this.findSections(sections, 'strength');
    const errors = this.findSections(sections, 'error');
    const solution = this.findSection(sections, 'solution');
    const improvement = this.findSection(sections, 'improvement');
    const feedback = this.findSection(sections, 'feedback');
    
    let formatted = `# Solution Review\n\n`;
    
    if (assessment) {
      formatted += `## Overall Assessment\n${assessment.content}\n\n`;
    }
    
    if (strengths.length > 0) {
      formatted += `## ✅ What You Did Well\n`;
      strengths.forEach(s => {
        formatted += `${s.content}\n`;
      });
      formatted += '\n';
    }
    
    if (errors.length > 0) {
      formatted += `## ❌ Errors Found\n`;
      errors.forEach(e => {
        formatted += `${e.content}\n`;
      });
      formatted += '\n';
    }
    
    if (solution) {
      formatted += `## Correct Solution\n${solution.content}\n\n`;
    }
    
    if (improvement) {
      formatted += `## How to Improve\n${improvement.content}\n\n`;
    }
    
    // Include other sections
    const processedSections = [assessment, ...strengths, ...errors, solution, improvement, feedback].filter(Boolean);
    const otherSections = sections.filter(s => !processedSections.includes(s));
    
    otherSections.forEach(section => {
      if (section.content) {
        if (section.heading) {
          formatted += `## ${section.heading}\n${section.content}\n\n`;
        }
      }
    });
    
    if (feedback) {
      formatted += `## Encouragement\n${feedback.content}\n`;
    }
    
    return formatted;
  }

  /**
   * Format explanation response
   */
  private formatExplanationResponse(sections: ResponseSection[]): string {
    let formatted = '';
    
    // Simple structure for explanations
    sections.forEach(section => {
      if (section.heading) {
        formatted += `## ${section.heading}\n${section.content}\n\n`;
      } else {
        formatted += `${section.content}\n\n`;
      }
    });
    
    return formatted || sections.map(s => s.content).join('\n\n');
  }

  /**
   * Convert markdown to basic HTML
   * Note: This is a simple converter. For production, consider using a library like marked.
   */
  private markdownToHtml(markdown: string): string {
    let html = markdown
      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Bullet lists
      .replace(/^[-*•]\s+(.+)$/gm, '<li>$1</li>')
      // Numbered lists
      .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Blockquotes
      .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
      // Paragraphs (double newlines)
      .replace(/\n\n/g, '</p><p>')
      // Line breaks
      .replace(/\n/g, '<br>');
    
    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<h') && !html.startsWith('<p>')) {
      html = '<p>' + html + '</p>';
    }
    
    // Wrap consecutive li elements in ul
    html = html.replace(/(<li>[\s\S]*?<\/li>)+/g, '<ul>$&</ul>');
    
    return html;
  }

  /**
   * Refine a raw AI response
   */
  public refineResponse(rawResponse: string, requestType: AIRequestType): RefinedResponse {
    log.info(`🔧 Refining response for type: ${requestType}`);
    
    // Step 1: Clean up text
    const cleaned = this.cleanupText(rawResponse);
    
    // Step 2: Parse into sections
    const sections = this.parseIntoSections(cleaned);
    
    log.debug(`Parsed ${sections.length} sections from response`);
    
    // Step 3: Format based on type
    let formatted: string;
    
    switch (requestType) {
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
    
    // Step 4: Convert to HTML
    const html = this.markdownToHtml(formatted);
    
    // Step 5: Build structure
    const structure: ResponseStructure = {
      title: this.extractTitle(sections),
      sections,
      summary: sections[0]?.content?.substring(0, 200),
      keyTakeaways: this.generateKeyTakeaways(sections),
      nextSteps: this.generateNextSteps(sections, requestType),
    };
    
    log.info(`✅ Response refined`, {
      requestType,
      rawLength: rawResponse.length,
      refinedLength: formatted.length,
      sectionCount: sections.length,
      takeawayCount: structure.keyTakeaways?.length || 0,
    });
    
    return {
      raw: rawResponse,
      refined: formatted,
      formattedHtml: html,
      structure,
      requestType,
    };
  }
}

// Export singleton instance
export const responseRefinerService = new ResponseRefinerService();
