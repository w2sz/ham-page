// src/services/eventService.js

/**
 * Simple event system for decoupling components
 */
class EventService {
    constructor() {
      this.subscribers = {};
    }
  
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Function to call when event is published
     * @param {Object} context - Optional context (this) for the callback
     * @returns {Function} Unsubscribe function
     */
    subscribe(event, callback, context = null) {
      if (!this.subscribers[event]) {
        this.subscribers[event] = [];
      }
      
      const subscriber = { callback, context };
      this.subscribers[event].push(subscriber);
      
      // Return unsubscribe function
      return () => {
        this.subscribers[event] = this.subscribers[event].filter(
          s => s !== subscriber
        );
      };
    }
  
    /**
     * Publish an event with data
     * @param {string} event - Event name
     * @param {*} data - Data to pass to subscribers
     */
    publish(event, data) {
      if (!this.subscribers[event]) return;
      
      this.subscribers[event].forEach(subscriber => {
        const { callback, context } = subscriber;
        callback.call(context || this, data);
      });
    }
}

// Singleton instance
const eventService = new EventService();
export default eventService;

// Import event names from constants
import { CUSTOM_EVENTS } from '../config/constants.js';

// Export events for easier access
export const Events = CUSTOM_EVENTS;