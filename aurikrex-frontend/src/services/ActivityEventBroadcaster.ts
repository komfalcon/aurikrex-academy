/**
 * Activity Event Broadcaster Service
 * 
 * Event system to broadcast when user activities occur.
 * Used for immediate real-time updates to Dashboard and Analytics
 * instead of relying solely on polling intervals.
 * 
 * Events:
 * - 'question-asked': When user asks a question to FalkeAI
 * - 'lesson-completed': When user completes a lesson
 * - 'assignment-submitted': When user submits an assignment
 * - 'solution-verified': When a solution is verified
 * - 'activity-logged': Generic activity logging
 */

export type ActivityEventType = 
  | 'question-asked'
  | 'lesson-completed'
  | 'assignment-submitted'
  | 'solution-verified'
  | 'activity-logged';

export interface ActivityEventData {
  timestamp?: Date;
  message?: string;
  lessonId?: string;
  assignmentId?: string;
  solutionId?: string;
  metadata?: Record<string, unknown>;
}

type EventCallback = (data?: ActivityEventData) => void;

class ActivityEventBroadcaster {
  private listeners: Map<ActivityEventType, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an activity event type
   * @param eventType - The type of event to subscribe to
   * @param callback - The callback function to call when the event is broadcast
   * @returns A cleanup function to unsubscribe
   */
  subscribe(eventType: ActivityEventType, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    const callbacks = this.listeners.get(eventType)!;
    callbacks.add(callback);
    
    // Return unsubscribe function for cleanup
    return () => {
      callbacks.delete(callback);
    };
  }

  /**
   * Unsubscribe from an activity event type
   * @param eventType - The type of event to unsubscribe from
   * @param callback - The callback function to remove
   */
  unsubscribe(eventType: ActivityEventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Broadcast an activity event to all subscribers
   * @param eventType - The type of event to broadcast
   * @param data - Optional data to pass to subscribers
   */
  broadcast(eventType: ActivityEventType, data?: ActivityEventData): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const eventData: ActivityEventData = {
        ...data,
        timestamp: data?.timestamp || new Date(),
      };
      
      console.log(`[ActivityEvent] Broadcasting ${eventType}`, eventData);
      
      callbacks.forEach(cb => {
        try {
          cb(eventData);
        } catch (error) {
          console.error(`[ActivityEvent] Error in callback for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Get the number of subscribers for an event type
   * @param eventType - The event type to check
   * @returns The number of subscribers
   */
  getSubscriberCount(eventType: ActivityEventType): number {
    return this.listeners.get(eventType)?.size || 0;
  }

  /**
   * Clear all subscribers for all event types
   * Useful for testing or cleanup
   */
  clearAll(): void {
    this.listeners.clear();
  }
}

// Export a singleton instance
const activityEventBroadcaster = new ActivityEventBroadcaster();

export default activityEventBroadcaster;
