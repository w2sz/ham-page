// src/app.js
import { CONFIG } from './config/config.js';
import eventService, { Events } from './services/eventService.js';
import refreshService from './services/refreshService.js';
import spotsModel from './models/spots.js';
import solarModel from './models/solar.js';
import bandsModel from './models/bands.js';
import quotesModel from './models/quotes.js';
import { SpotterCard } from './cards/SpotterCard.js';
import { BandSummaryCard } from './cards/BandSummaryCard.js';
import { SolarCard } from './cards/SolarCard.js';
import { updateHeaderInfo } from './components/Header.js';
import { initializeQuoteDisplay } from './components/QuoteDisplay.js';

/**
 * Main application class
 */
class HamDashboard {
  constructor() {
    this.cards = {};
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   */
  initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing Ham Dashboard');
    
    // Initialize theme
    this.initializeTheme();
    
    // Initialize header with station info
    this.initializeHeader();
    
    // Create all dashboard cards
    this.createCards();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start data refresh service
    refreshService.start();
    
    // Mark as initialized
    this.isInitialized = true;
    console.log('Ham Dashboard initialized');
  }

  /**
   * Initialize theme settings
   */
  initializeTheme() {
    const theme = CONFIG.display.theme;
    
    // Set CSS variables from config
    const root = document.documentElement;
    root.style.setProperty('--accent-hue', theme.accent.hue);
    root.style.setProperty('--accent-saturation', `${theme.accent.saturation}%`);
    root.style.setProperty('--accent-lightness', `${theme.accent.lightness}%`);
    root.style.setProperty('--font-size-base', theme.fontSize.base);
    root.style.setProperty('--font-size-large', theme.fontSize.large);
    root.style.setProperty('--font-size-small', theme.fontSize.small);
    root.style.setProperty('--spacing-sm', theme.spacing.sm);
    root.style.setProperty('--spacing-md', theme.spacing.md);
    root.style.setProperty('--spacing-lg', theme.spacing.lg);
    
    // Set data-theme attribute on body
    document.body.setAttribute('data-theme', 'dark');
  }

  /**
   * Initialize header with station info and clock
   */
  initializeHeader() {
    // Initial update
    updateHeaderInfo();
    
    // Update clock every second
    setInterval(updateHeaderInfo, 1000);
  }

  /**
   * Create all dashboard cards
   */
  createCards() {
    // Create cards based on config
    this.cards.spotter = new SpotterCard('psk-reporter', CONFIG.cards.pskReporter);
    this.cards.bands = new BandSummaryCard('band-summary', CONFIG.cards.bandSummary);
    this.cards.solar = new SolarCard('solar-data', CONFIG.cards.solarData);
    
    // Initialize quote display in footer
    this.quote = initializeQuoteDisplay();
  }

  /**
   * Set up event listeners for data refresh events
   */
  setupEventListeners() {
    // Connect refresh events to data models
    eventService.subscribe(Events.REFRESH_SPOTS, () => {
      spotsModel.refreshData();
    });
    
    eventService.subscribe(Events.REFRESH_SOLAR, () => {
      solarModel.refreshData();
    });
    
    eventService.subscribe(Events.REFRESH_BANDS, () => {
      bandsModel.refreshData(spotsModel.spots);
    });
    
    eventService.subscribe(Events.REFRESH_QUOTE, () => {
      quotesModel.refreshQuote();
    });
    
    // Connect spots update to bands update
    eventService.subscribe(Events.SPOTS_UPDATED, (data) => {
      if (!data.isLoading && !data.error) {
        bandsModel.refreshData(data.spots);
      }
    });
    
    // Handle screen saver
    this.setupScreenSaver();
  }

  /**
   * Set up screen saver functionality
   */
  setupScreenSaver() {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      document.body.classList.remove('screen-saver-active');
      timeout = setTimeout(() => {
        document.body.classList.add('screen-saver-active');
      }, CONFIG.display.screenSaverDelay * 1000);
    };

    document.addEventListener('mousemove', resetTimer);
    document.addEventListener('keydown', resetTimer);
    resetTimer();
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // Stop refresh service
    refreshService.stop();
    
    // Destroy all cards
    Object.values(this.cards).forEach(card => {
      if (card && typeof card.destroy === 'function') {
        card.destroy();
      }
    });
    
    this.cards = {};
    this.isInitialized = false;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Ham Dashboard...');
  
  try {
    const app = new HamDashboard();
    app.initialize();
    
    // Store app instance for debugging
    window.hamDashboard = app;
    console.log('Ham Dashboard initialized successfully');
  } catch (error) {
    console.error('Error initializing Ham Dashboard:', error);
    document.body.innerHTML += `
      <div class="global-error">
        <h3>Error Initializing Application</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
  }
});