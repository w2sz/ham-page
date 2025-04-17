// src/config/constants.js

/**
 * Amateur radio band frequency ranges
 */
export const BAND_RANGES = [
    { name: '160m', min: 1.8, max: 2.0 },
    { name: '80m', min: 3.5, max: 4.0 },
    { name: '40m', min: 7.0, max: 7.3 },
    { name: '30m', min: 10.1, max: 10.15 },
    { name: '20m', min: 14.0, max: 14.35 },
    { name: '17m', min: 18.068, max: 18.168 },
    { name: '15m', min: 21.0, max: 21.45 },
    { name: '12m', min: 24.89, max: 24.99 },
    { name: '10m', min: 28.0, max: 29.7 },
    { name: '6m', min: 50.0, max: 54.0 },
    { name: '2m', min: 144.0, max: 148.0 },
    { name: '70cm', min: 420.0, max: 450.0 }
  ];
  
  /**
   * Digital modes recognized by the app
   */
  export const DIGITAL_MODES = [
    'FT8',
    'FT4',
    'JT65',
    'JT9',
    'WSPR',
    'PSK31',
    'PSK63',
    'RTTY',
    'MFSK',
    'OLIVIA',
    'CONTESTIA',
    'THOR',
    'DOMINOEX',
    'JS8',
    'VARA',
    'PACKET',
    'PACTOR',
    'ARDOP'
  ];
  
  /**
   * Ham radio operating modes
   */
  export const OPERATING_MODES = [
    'CW',
    'SSB',
    'AM',
    'FM',
    ...DIGITAL_MODES
  ];
  
  /**
   * Solar condition quality levels and their CSS classes
   */
  export const SOLAR_CONDITION_CLASSES = {
    'Poor': 'condition-poor',
    'Fair': 'condition-fair',
    'Good': 'condition-good',
    'Very Good': 'condition-very-good',
    'Excellent': 'condition-excellent',
    'Band Closed': 'condition-band-closed'
  };
  
  /**
   * Common time periods for data refresh
   */
  export const REFRESH_INTERVALS = {
    REALTIME: 5,         // 5 seconds
    FAST: 30,            // 30 seconds
    MEDIUM: 5 * 60,      // 5 minutes
    SLOW: 15 * 60,       // 15 minutes
    VERY_SLOW: 60 * 60   // 1 hour
  };
  
  /**
   * Map of colors for different themes
   */
  export const THEME_COLORS = {
    DARK: {
      bg: '#1a1a1a',
      bgDarker: '#141414',
      textPrimary: '#ffffff',
      textSecondary: '#777777',
      border: '#333333'
    },
    LIGHT: {
      bg: '#f0f0f0',
      bgDarker: '#e0e0e0',
      textPrimary: '#111111',
      textSecondary: '#555555',
      border: '#cccccc'
    },
    ACCENT_COLORS: {
      GOLD: { hue: 51, saturation: 100, lightness: 50 },
      BLUE: { hue: 210, saturation: 100, lightness: 50 },
      GREEN: { hue: 120, saturation: 70, lightness: 45 },
      RED: { hue: 0, saturation: 100, lightness: 50 }
    }
  };
  
  /**
   * Standard breakpoints for responsive design
   */
  export const BREAKPOINTS = {
    MOBILE: 480,
    TABLET: 768,
    DESKTOP: 1024,
    LARGE: 1440
  };
  
  /**
   * Custom event names for the event service
   */
  export const CUSTOM_EVENTS = {
    SPOTS_UPDATED: 'spots_updated',
    SOLAR_UPDATED: 'solar_updated',
    BANDS_UPDATED: 'bands_updated',
    QUOTE_UPDATED: 'quote_updated',
    THEME_CHANGED: 'theme_changed',
    ERROR: 'error',
    REFRESH_SPOTS: 'refresh_spots',
    REFRESH_SOLAR: 'refresh_solar',
    REFRESH_BANDS: 'refresh_bands',
    REFRESH_QUOTE: 'refresh_quote'
  };