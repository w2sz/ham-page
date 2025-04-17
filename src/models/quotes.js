// src/models/quotes.js
import { getRandomQuotes } from '../data/quotes.js';
import eventService, { Events } from '../services/eventService.js';

class QuotesModel {
  constructor() {
    this.currentQuote = null;
    this.history = [];
    this.historyMaxSize = 10;
  }

  /**
   * Refresh with a new random quote
   * Avoids repeating quotes recently displayed
   */
  refreshQuote() {
    // Get a random quote
    let [newQuote] = getRandomQuotes(1);
    
    // Try to avoid recent repeats
    if (this.history.length > 0) {
      // Try up to 3 times to get a quote not in recent history
      let attempts = 0;
      while (this.isInHistory(newQuote) && attempts < 3) {
        [newQuote] = getRandomQuotes(1);
        attempts++;
      }
    }
    
    // Update current quote and history
    this.currentQuote = newQuote;
    this.addToHistory(newQuote);
    
    // Publish event with new quote
    eventService.publish(Events.QUOTE_UPDATED, {
      quote: this.currentQuote
    });
    
    return this.currentQuote;
  }

  /**
   * Check if quote is in recent history
   * @param {Object} quote - Quote object
   * @returns {boolean} True if in history
   */
  isInHistory(quote) {
    if (!quote || !quote.text) return false;
    return this.history.some(historyQuote => 
      historyQuote.text === quote.text && historyQuote.author === quote.author);
  }

  /**
   * Add quote to history, maintaining max size
   * @param {Object} quote - Quote object
   */
  addToHistory(quote) {
    if (!quote) return;
    
    this.history.unshift(quote);
    
    // Trim history if it exceeds max size
    if (this.history.length > this.historyMaxSize) {
      this.history = this.history.slice(0, this.historyMaxSize);
    }
  }

  /**
   * Get the current quote
   * @returns {Object} Current quote
   */
  getCurrentQuote() {
    return this.currentQuote;
  }
}

// Export a singleton instance
export default new QuotesModel();