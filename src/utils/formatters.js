// src/utils/formatters.js

/**
 * Format date to MM/DD/YYYY format
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  /**
   * Format time with hours, minutes, seconds
   * @param {Date} date - Date to format
   * @param {boolean} useUTC - Whether to use UTC time
   * @returns {string} Formatted time string
   */
  export const formatTime = (date, useUTC = false) => {
    if (useUTC) {
      return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}:${String(date.getUTCSeconds()).padStart(2, '0')}`;
    }
    
    const options = {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    
    return date.toLocaleTimeString('en-US', options);
  };
  
  /**
   * Format age relative to current time
   * @param {number} timestamp - Unix timestamp in seconds
   * @returns {string} Formatted age (now, 5m, 2h, 1d)
   */
  export const formatAge = (timestamp) => {
    if (!timestamp) return '';
    
    const now = Math.floor(Date.now() / 1000);
    // Convert string timestamp to number if needed
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    const diff = now - ts;
    
    if (isNaN(diff)) return '';
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };
  
  /**
   * Format distance with appropriate units
   * @param {string|number} km - Distance in kilometers
   * @param {Object} options - Formatting options
   * @returns {string} Formatted distance
   */
  export const formatDistance = (km, options = {}) => {
    const distance = parseFloat(km);
    if (isNaN(distance)) return '';
    
    const useImperial = options.useImperial || false;
    const includeSuffix = options.includeSuffix !== false;
    
    if (useImperial) {
      const miles = distance * 0.621371;
      return `${Math.round(miles)}${includeSuffix ? ' mi' : ''}`;
    }
    
    return `${Math.round(distance)}${includeSuffix ? ' km' : ''}`;
  };
  
  /**
   * Format grid square
   * @param {string} grid - Grid square
   * @param {Object} options - Formatting options
   * @returns {string} Formatted grid square
   */
  export const formatGrid = (grid, options = {}) => {
    if (!grid) return '';
    
    // Default to 4 characters if not specified
    const maxDigits = options.maxDigits || 4;
    // Uppercase and truncate/pad as needed
    return grid.toUpperCase().padEnd(maxDigits, ' ').substring(0, maxDigits);
  };
  
  /**
   * Format frequency with appropriate units
   * @param {string|number} freq - Frequency in MHz
   * @param {Object} options - Formatting options
   * @returns {string} Formatted frequency
   */
  export const formatFrequency = (freq, options = {}) => {
    const frequency = parseFloat(freq);
    if (isNaN(frequency)) return '';
    
    const precision = options.precision || 3;
    const includeSuffix = options.includeSuffix !== false;
    
    return `${frequency.toFixed(precision)}${includeSuffix ? ' MHz' : ''}`;
  };
  
  /**
   * Format signal strength
   * @param {string|number} db - Signal strength in dB
   * @param {Object} options - Formatting options
   * @returns {string} Formatted signal strength
   */
  export const formatSignalStrength = (db, options = {}) => {
    const signal = parseInt(db, 10);
    if (isNaN(signal)) return '';
    
    const includeSuffix = options.includeSuffix !== false;
    return `${signal}${includeSuffix ? ' dB' : ''}`;
  };
  
  /**
   * Format timestamp as local time
   * @param {number} timestamp - Unix timestamp in seconds
   * @param {Object} options - Formatting options
   * @returns {string} Formatted time
   */
  export const formatTimestamp = (timestamp, options = {}) => {
    if (!timestamp) return '';
    
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    if (isNaN(ts)) return '';
    
    const date = new Date(ts * 1000);
    const useUTC = options.useUTC || false;
    
    return formatTime(date, useUTC);
  };
  
  /**
   * Format a duration in seconds
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  export const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '';
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m${secs > 0 ? ` ${secs}s` : ''}`;
    }
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  };