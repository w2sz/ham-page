// src/models/spots.js
import { fetchPskReporterData } from '../api/pskReporter.js';
import eventService, { Events } from '../services/eventService.js';
import { formatTime, formatGrid, formatAge } from '../utils/formatters.js';

class SpotModel {
  constructor() {
    this.spots = [];
    this.lastUpdate = null;
    this.nextUpdate = null;
    this.isLoading = false;
    this.error = null;
  }

  /**
   * Parse ADIF text into spot objects
   * @param {string} adifText - ADIF-formatted text
   * @returns {Array} Parsed spot objects
   */
  parseAdif(adifText) {
    if (!adifText) return [];
    
    const spots = [];
    const records = adifText.split('<eor>');
    
    for (const record of records) {
      if (!record.trim()) continue;
      
      const spot = {};
      const matches = record.matchAll(/<(\w+)(?::\d+(?::[A-Z])?)?>(.*?)(?=<|$)/g);
      
      for (const match of matches) {
        const [, field, value] = match;
        spot[field.toLowerCase()] = value;
      }
      
      if (spot.qso_date && spot.time_on && spot.freq) {
        const timestamp = new Date(
          spot.qso_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') + 
          'T' + 
          spot.time_on.replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3') + 
          'Z'
        ).getTime() / 1000;

        spots.push({
          timestamp,
          time: formatTime(new Date(timestamp * 1000), true),
          call: spot.operator?.toUpperCase() || '',
          freq: parseFloat(spot.freq).toFixed(3),
          mode: spot.mode || '',
          grid: formatGrid(spot.my_gridsquare || '', { maxDigits: 4 }),
          db: spot.app_pskrep_snr ? `${spot.app_pskrep_snr}` : '?',
          distance: spot.distance ? `${Math.round(parseFloat(spot.distance))}` : '?',
          age: formatAge(timestamp)
        });
      }
    }
    
    return spots;
  }

  /**
   * Fetch and process spot data
   */
  async refreshData() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.error = null;
    
    // Notify UI that loading began
    eventService.publish(Events.SPOTS_UPDATED, { 
      isLoading: true, 
      spots: this.spots
    });
    
    try {
      const adifText = await fetchPskReporterData();
      this.spots = this.parseAdif(adifText)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      this.lastUpdate = new Date();
      this.nextUpdate = new Date(Date.now() + 300000); // 5 minutes
      
      // Success! Publish the updated data
      eventService.publish(Events.SPOTS_UPDATED, {
        isLoading: false,
        spots: this.spots,
        lastUpdate: this.lastUpdate,
        nextUpdate: this.nextUpdate
      });
      
    } catch (error) {
      console.error('Error fetching spot data:', error);
      this.error = error.message;
      
      // Publish error state
      eventService.publish(Events.SPOTS_UPDATED, {
        isLoading: false,
        error: this.error,
        spots: this.spots
      });
      
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get status information for display
   */
  getStatus() {
    const now = new Date();
    const remainingSeconds = this.nextUpdate ? 
      Math.max(0, Math.floor((this.nextUpdate - now) / 1000)) : 0;

    return {
      totalSpots: this.spots.length,
      lastUpdate: this.lastUpdate,
      nextUpdate: this.nextUpdate,
      remainingSeconds,
      isLoading: this.isLoading,
      error: this.error
    };
  }
}

// Export a singleton instance
export default new SpotModel();