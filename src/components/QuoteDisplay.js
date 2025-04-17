// src/components/QuoteDisplay.js
import eventService, { Events } from '../services/eventService.js';
import quotesModel from '../models/quotes.js';
import { CONFIG } from '../config/config.js';

/**
 * Component to display and animate ham radio quotes
 */
export class QuoteDisplay {
  /**
   * Create a new QuoteDisplay component
   * @param {string} elementId - ID of container element
   */
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    if (!this.element) {
      console.error(`Quote display element with ID "${elementId}" not found`);
      return;
    }
    
    this.fadeTime = CONFIG.display.quotes.fadeTime || 500;
    this.currentQuote = null;
    this.isAnimating = false;
    
    // Subscribe to quote updates
    this.unsubscribe = eventService.subscribe(
      Events.QUOTE_UPDATED, 
      this.handleQuoteUpdate.bind(this)
    );
    
    // Initialize with current quote if available
    const initialQuote = quotesModel.getCurrentQuote();
    if (initialQuote) {
      this.displayQuote(initialQuote);
    } else {
      // Request a new quote if none available
      quotesModel.refreshQuote();
    }
  }

  /**
   * Handle quote update events
   * @param {Object} data - Event data with new quote
   */
  handleQuoteUpdate(data) {
    if (!this.element || !data.quote) return;
    
    this.currentQuote = data.quote;
    this.animateQuoteChange();
  }

  /**
   * Animate quote change with fade effect
   */
  animateQuoteChange() {
    if (!this.element || this.isAnimating) return;
    
    this.isAnimating = true;
    
    // Fade out
    this.element.style.transition = `opacity ${this.fadeTime}ms ease-out`;
    this.element.style.opacity = '0';
    
    // Update content and fade in after timeout
    setTimeout(() => {
      this.displayQuote(this.currentQuote);
      this.element.style.opacity = '1';
      
      // Reset animating flag after fade completes
      setTimeout(() => {
        this.isAnimating = false;
      }, this.fadeTime);
    }, this.fadeTime);
  }

  /**
   * Display a quote without animation
   * @param {Object} quote - Quote object to display
   */
  displayQuote(quote) {
    if (!this.element || !quote) return;
    
    this.element.innerHTML = `"${quote.text}" - ${quote.author}`;
    this.currentQuote = quote;
  }

  /**
   * Manually trigger a quote refresh
   */
  refreshQuote() {
    quotesModel.refreshQuote();
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    this.element = null;
    this.currentQuote = null;
  }
}

/**
 * Create and initialize a QuoteDisplay in the footer
 * @returns {QuoteDisplay} Quote display instance
 */
export function initializeQuoteDisplay() {
  return new QuoteDisplay('quote');
}