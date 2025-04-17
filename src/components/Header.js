// src/components/Header.js
import { CONFIG } from '../config/config.js';
import { formatDate, formatTime } from '../utils/formatters.js';
import eventService, { Events } from '../services/eventService.js';

/**
 * Class to manage the header component
 */
export class Header {
  /**
   * Create a new Header component
   */
  constructor() {
    this.callsignElement = document.getElementById('callsign');
    this.gridsquareElement = document.getElementById('gridsquare');
    this.timeDisplayElement = document.getElementById('time-display');
    
    if (!this.callsignElement || !this.gridsquareElement || !this.timeDisplayElement) {
      console.error('Header elements not found');
      return;
    }
    
    // Set initial values
    this.callsignElement.innerText = CONFIG.station.callsign;
    this.gridsquareElement.innerText = CONFIG.station.gridsquare;
    
    // Start clock updates
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    this.updateClock(); // Initial update
    
    // Subscribe to theme changes
    this.unsubscribe = eventService.subscribe(
      Events.THEME_CHANGED,
      this.handleThemeChange.bind(this)
    );
  }

  /**
   * Update clock display
   */
  updateClock() {
    if (!this.timeDisplayElement) return;
    
    const now = new Date();
    
    this.timeDisplayElement.innerHTML = `
      <div class="time-item local-time">
        <div>${formatDate(now)}</div>
        <div>${formatTime(now)}</div>
      </div>
      <div class="time-item utc-time">UTC: ${formatTime(now, true)}</div>
    `;
  }

  /**
   * Handle theme change events
   * @param {Object} theme - Theme data
   */
  handleThemeChange(theme) {
    // Optional: Update header styling based on theme
  }

  /**
   * Update station information
   * @param {Object} station - Station information
   */
  updateStation(station) {
    if (!this.callsignElement || !this.gridsquareElement) return;
    
    if (station.callsign) {
      this.callsignElement.innerText = station.callsign;
    }
    
    if (station.gridsquare) {
      this.gridsquareElement.innerText = station.gridsquare;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
    
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    this.callsignElement = null;
    this.gridsquareElement = null;
    this.timeDisplayElement = null;
  }
}

/**
 * Standalone function to update header info
 * (For compatibility with legacy code)
 */
export function updateHeaderInfo() {
  const callsignElement = document.getElementById('callsign');
  const gridsquareElement = document.getElementById('gridsquare');
  const timeDisplayElement = document.getElementById('time-display');
  
  if (!callsignElement || !gridsquareElement || !timeDisplayElement) return;
  
  const now = new Date();
  
  callsignElement.innerText = CONFIG.station.callsign;
  gridsquareElement.innerText = CONFIG.station.gridsquare;
  
  timeDisplayElement.innerHTML = `
    <div class="time-item local-time">
      <div>${formatDate(now)}</div>
      <div>${formatTime(now)}</div>
    </div>
    <div class="time-item utc-time">UTC: ${formatTime(now, true)}</div>
  `;
}