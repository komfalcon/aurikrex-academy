import { log } from './logger.js';

export interface ContentModerationResult {
  isAppropriate: boolean;
  flags: string[];
  suggestedActions?: string[];
}

export class ContentModerator {
  private static readonly INAPPROPRIATE_PATTERNS = [
    /\b(hate|violence|explicit|offensive)\b/i,
    // Add more patterns as needed
  ];

  private static readonly SENSITIVE_TOPICS = [
    'politics',
    'religion',
    'adult content',
    // Add more topics as needed
  ];

  static async moderateContent(content: string): Promise<ContentModerationResult> {
    const flags: string[] = [];
    const suggestedActions: string[] = [];

    try {
      // Check for inappropriate patterns
      for (const pattern of this.INAPPROPRIATE_PATTERNS) {
        if (pattern.test(content)) {
          flags.push(`Contains inappropriate content matching pattern: ${pattern}`);
        }
      }

      // Check for sensitive topics
      for (const topic of this.SENSITIVE_TOPICS) {
        if (content.toLowerCase().includes(topic.toLowerCase())) {
          flags.push(`Contains sensitive topic: ${topic}`);
          suggestedActions.push(`Review content related to ${topic}`);
        }
      }

      // Add more moderation rules as needed

      // Determine if content is appropriate based on flags
      const isAppropriate = flags.length === 0;

      if (!isAppropriate) {
        log.warn('Content moderation flags raised:', { flags, suggestedActions });
      }

      return {
        isAppropriate,
        flags,
        suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined
      };
    } catch (error) {
      log.error('Content moderation error:', { error: String(error) });
      throw error;
    }
  }
}