// src/services/refreshService.js
import { CONFIG } from '../config/config.js';
import eventService, { Events } from './eventService.js';

/**
 * Service to manage refresh schedules for all data sources
 */
class RefreshService {
  constructor() {
    this.refreshTimers = {};
    this.isActive = false;
  }

  /**
   * Start the refresh service
   */
  start() {
    if (this.isActive) return;
    this.isActive = true;
    
    // Schedule refreshes based on config intervals
    this.scheduleRefresh('spots', 
      () => eventService.publish(Events.REFRESH_SPOTS), 
      CONFIG.refreshIntervals.pskReporter * 1000
    );
    
    this.scheduleRefresh('solar', 
      () => eventService.publish(Events.REFRESH_SOLAR), 
      CONFIG.refreshIntervals.solar * 1000
    );
    
    this.scheduleRefresh('bands', 
      () => eventService.publish(Events.REFRESH_BANDS), 
      CONFIG.refreshIntervals.bandSummary * 1000
    );
    
    this.scheduleRefresh('quotes', 
      () => eventService.publish(Events.REFRESH_QUOTE), 
      CONFIG.refreshIntervals.quotes * 1000
    );
    
    console.log('Refresh service started');
  }

  /**
   * Stop the refresh service
   */
  stop() {
    if (!this.isActive) return;
    
    // Clear all timers
    Object.keys(this.refreshTimers).forEach(key => {
      if (this.refreshTimers[key]) {
        clearInterval(this.refreshTimers[key]);
        this.refreshTimers[key] = null;
      }
    });
    
    this.isActive = false;
    console.log('Refresh service stopped');
  }

  /**
   * Schedule a regular refresh
   * @param {string} name - Name of the refresh timer
   * @param {Function} callback - Function to call on refresh
   * @param {number} interval - Interval in milliseconds
   */
  scheduleRefresh(name, callback, interval) {
    // Clear any existing timer
    if (this.refreshTimers[name]) {
      clearInterval(this.refreshTimers[name]);
    }
    
    // Immediate first call
    callback();
    
    // Schedule regular refreshes
    this.refreshTimers[name] = setInterval(callback, interval);
    
    console.log(`Scheduled ${name} refresh every ${interval/1000} seconds`);
  }

  /**
   * Trigger an immediate refresh of a data source
   * @param {string} source - Name of the data source
   */
  refreshNow(source) {
    switch (source) {
      case 'spots':
        eventService.publish(Events.REFRESH_SPOTS);
        break;
      case 'solar':
        eventService.publish(Events.REFRESH_SOLAR);
        break;
      case 'bands':
        eventService.publish(Events.REFRESH_BANDS);
        break;
      case 'quotes':
        eventService.publish(Events.REFRESH_QUOTE);
        break;
      default:
        console.warn(`Unknown data source: ${source}`);
    }
  }
}

// Export singleton instance
const refreshService = new RefreshService();
export default refreshService;