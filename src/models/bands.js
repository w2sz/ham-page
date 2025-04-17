// src/models/bands.js
import eventService, { Events } from '../services/eventService.js';
import { BAND_RANGES } from '../config/constants.js';

class BandsModel {
  constructor() {
    this.bandSummary = {};
    this.lastUpdate = null;
    this.isLoading = false;
    this.error = null;
  }

  /**
   * Process spot data to generate band summary
   * @param {Array} spots - Array of spot data objects
   */
  refreshData(spots) {
    this.isLoading = true;
    
    try {
      if (!Array.isArray(spots) || spots.length === 0) {
        this.bandSummary = {};
        this.error = null;
        this.lastUpdate = new Date();
        
        eventService.publish(Events.BANDS_UPDATED, {
          bandSummary: this.bandSummary,
          lastUpdate: this.lastUpdate,
          isLoading: false,
          isEmpty: true
        });
        
        return;
      }
      
      // Process spots and group by band
      const bandSummary = spots.reduce((summary, spot) => {
        const freq = parseFloat(spot.freq);
        const band = this.getBandName(freq);
        
        if (!summary[band]) {
          summary[band] = { 
            count: 0, 
            maxSignal: -999, 
            frequencies: [],
            modes: new Set()
          };
        }
        
        summary[band].count++;
        summary[band].frequencies.push(freq);
        
        if (spot.mode) {
          summary[band].modes.add(spot.mode);
        }
        
        // Update max signal if available
        if (spot.db && !isNaN(parseInt(spot.db))) {
          summary[band].maxSignal = Math.max(summary[band].maxSignal, parseInt(spot.db));
        }
        
        return summary;
      }, {});
      
      // Post-process each band
      Object.keys(bandSummary).forEach(band => {
        const bandData = bandSummary[band];
        
        // Calculate average frequency
        if (bandData.frequencies.length > 0) {
          bandData.avgFreq = bandData.frequencies.reduce((sum, freq) => sum + freq, 0) / 
                             bandData.frequencies.length;
        }
        
        // Convert Set to Array for modes
        bandData.modes = Array.from(bandData.modes);
        
        // Calculate activity level (1-5)
        const activity = Math.min(5, Math.ceil(bandData.count / 5));
        bandData.activity = activity;
        
        // Format as stars
        bandData.activityStars = '★'.repeat(activity) + '☆'.repeat(5 - activity);
        
        // Remove raw frequency list to save memory
        delete bandData.frequencies;
      });
      
      this.bandSummary = bandSummary;
      this.lastUpdate = new Date();
      this.error = null;
      
      // Publish updated data
      eventService.publish(Events.BANDS_UPDATED, {
        bandSummary: this.bandSummary,
        lastUpdate: this.lastUpdate,
        isLoading: false
      });
      
    } catch (error) {
      console.error('Error processing band data:', error);
      this.error = error.message;
      
      eventService.publish(Events.BANDS_UPDATED, {
        bandSummary: this.bandSummary,
        lastUpdate: this.lastUpdate,
        isLoading: false,
        error: this.error
      });
      
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get band name based on frequency
   * @param {number} freqMHz - Frequency in MHz
   * @returns {string} Band name (e.g., '20m') or 'Unknown'
   */
  getBandName(freqMHz) {
    const band = BAND_RANGES.find(b => freqMHz >= b.min && freqMHz <= b.max);
    return band ? band.name : 'Unknown';
  }

  /**
   * Get summary data in sorted array format for display
   * @returns {Array} Sorted array of band summary objects
   */
  getSortedBandData() {
    return Object.entries(this.bandSummary)
      .filter(([band]) => band !== 'Unknown')
      .map(([bandName, data]) => ({
        band: bandName,
        ...data
      }))
      .sort((a, b) => {
        // Get band range info for sorting by frequency
        const bandA = BAND_RANGES.find(r => r.name === a.band);
        const bandB = BAND_RANGES.find(r => r.name === b.band);
        
        if (!bandA || !bandB) return 0;
        return bandA.min - bandB.min; // Sort by increasing frequency
      });
  }

  /**
   * Get status information
   * @returns {Object} Status information
   */
  getStatus() {
    const bandCount = Object.keys(this.bandSummary).filter(b => b !== 'Unknown').length;
    const totalSpots = Object.values(this.bandSummary).reduce((sum, band) => sum + band.count, 0);
    
    return {
      bandCount,
      totalSpots,
      lastUpdate: this.lastUpdate,
      isLoading: this.isLoading,
      error: this.error,
      isEmpty: bandCount === 0
    };
  }
}

// Export a singleton instance
export default new BandsModel();