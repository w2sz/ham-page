// src/cards/SolarCard.js
import eventService, { Events } from '../services/eventService.js';
import solarModel from '../models/solar.js';

/**
 * Compact card for displaying solar data
 * Optimized for passive viewing on fixed displays without scrolling
 */
export class SolarCard {
  /**
   * Create a new SolarCard
   * @param {string} containerId - ID of container element
   * @param {Object} config - Card configuration
   */
  constructor(containerId, config) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container element with ID "${containerId}" not found`);
      return;
    }
    
    this.config = config;
    this.contentElement = null;
    this.statusElement = null;

    this.isDay = () => { 
      const hours = new Date().getHours(); 
      return hours >= 6 && hours < 18; 
    };
    
    // Initialize the card UI
    this.initialize();
    
    // Subscribe to data updates
    this.unsubscribe = eventService.subscribe(
      Events.SOLAR_UPDATED,
      this.handleDataUpdate.bind(this)
    );
  }

  /**
   * Initialize the card UI
   */
  initialize() {
    // Create card structure (simple header and content area)
    this.container.innerHTML = `
      <div class="card-header">
        <h2>${this.config.title || 'Solar Data'}</h2>
      </div>
      <div class="card-content">
        <div id="${this.container.id}-content"></div>
      </div>
      <div class="card-footer">
        <div id="${this.container.id}-status" class="status-text"></div>
      </div>
    `;

    this.statusElement = document.getElementById(`${this.container.id}-status`);

    // Get content element
    this.contentElement = document.getElementById(`${this.container.id}-content`);
    
    // Show loading initially
    this.showLoading();
    
    // Try to update with current data if available
    const status = solarModel.getStatus();
    if (status.solarData) {
      this.updateDisplay(status.solarData);
    }
  }

  /**
   * Handle data update events
   * @param {Object} data - Updated data 
   */
  handleDataUpdate(data) {
    if (!this.contentElement) return;
    
    if (data.isLoading) {
      this.showLoading();
    } else if (data.error) {
      this.showError(data.error);
    } else if (data.solarData) {
      this.updateDisplay(data.solarData);
    }

    this.updateStatus();
  }

  /**
   * Update status information
   */
  updateStatus() {
    if (!this.statusElement) return;
    
    const status = solarModel.getStatus();
    
    if (status.isEmpty) {
      this.statusElement.innerHTML = `
        <div>No solar activity data available</div>
      `;
      return;
    }
    
    this.statusElement.innerHTML = `
      <div>
        ${status.lastUpdate 
          ? `<br>Fetched: ${status.lastUpdate.toLocaleTimeString()}`
          : ``
        }
      </div>
    `;
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (!this.contentElement) return;
    
    this.contentElement.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading solar data...</p>
      </div>
    `;
  }

  /**
   * Show error state
   * @param {string} error - Error message
   */
  showError(error) {
    if (!this.contentElement) return;
    
    this.contentElement.innerHTML = `
      <div class="error-state">
        <p>${error || 'Failed to load solar data'}</p>
      </div>
    `;
  }

  /**
   * Compute overall condition from band conditions
   * @param {Object} bandConditions - Band conditions data
   * @returns {string} Overall condition
   */
  computeOverallCondition(bandConditions) {
    if (!bandConditions || (!bandConditions.day && !bandConditions.night)) {
      return 'Unknown';
    }
    
    // Count occurrences of each condition
    const conditionCounts = {};
    const timeOfDay = this.isDay() ? 'day' : 'night';
    const relevantConditions = bandConditions[timeOfDay] || {};
    
    Object.values(relevantConditions).forEach(condition => {
      conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
    });
    
    // Find the most common condition
    let maxCount = 0;
    let mostCommonCondition = 'Unknown';
    
    for (const [condition, count] of Object.entries(conditionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonCondition = condition;
      }
    }
    
    return mostCommonCondition;
  }
/**
 * Update display with solar data
 * @param {Object} data - Solar data
 */
updateDisplay(data) {
  if (!this.contentElement || !data) return;
  
  // Calculate overall condition if not provided
  const overallCondition = data.overallCondition || this.computeOverallCondition(data.bandConditions);
  
  // Determine which time of day to display
  const timeOfDay = this.isDay() ? 'day' : 'night';
  
  // Tooltip explanations for various metrics
  const tooltips = {
    overall: "Overall propagation conditions based on solar indices and band reports.",
    sfi: "Solar Flux Index (SFI) measures solar radiation at 2800 MHz. Higher values generally indicate better HF propagation.",
    ssn: "Sunspot Number (SSN) indicates the number of visible sunspots. Higher values correlate with better HF conditions.",
    aIndex: "A-Index measures geomagnetic activity over 24 hours. Lower values (under 10) are better for HF propagation.",
    kIndex: "K-Index measures geomagnetic disturbance over 3 hours. Values of 0-3 are good for HF, while 5+ can disrupt propagation.",
    xRay: "X-Ray flux indicates solar flare activity. Higher values can cause radio blackouts.",
    wind: "Solar Wind speed in km/s. Higher values may indicate incoming geomagnetic disturbances.",
    magF: "Interplanetary Magnetic Field strength in nT. Higher values can indicate disruptions.",
    geoM: "Geomagnetic field condition affects radio propagation. 'Quiet' is best for stable conditions.",
    proton: "Proton Flux measures solar radiation. Elevated levels can disrupt HF propagation.",
    electron: "Electron Flux measures radiation. Elevated levels can affect satellite communications.",
    muf: "Maximum Usable Frequency is the highest frequency reliably reflected by the ionosphere.",
    signalNoise: "Signal-to-Noise Ratio estimate for typical HF conditions.",
    aurora: "Aurora activity level. Higher values indicate possible VHF aurora propagation but HF disruption."
  };
  
  // Create HTML content for compact viewing
  const html = `
    <div class="solar-compact">
      <!-- Top row: Main indices, overall condition and source -->
      <div class="top-row">
        <!-- Overall condition -->
        <div class="overall-block">
          <div class="overall-value ${this.getConditionClass(overallCondition)}">${overallCondition || 'Unknown'}</div>
          <div class="index-label tooltip-container">
            Overall
            <div class="tooltip-content">${tooltips.overall}</div>
          </div>
        </div>
        
        <!-- Main indices -->
        <div class="indices-block">
          <div class="index-item">
            <div class="index-value">${data.solarFlux || 'N/A'}</div>
            <div class="index-bar"><span class="${this.getIndexClass('SFI', data.solarFlux)}" style="width:${this.calculateGaugeWidth('SFI', data.solarFlux)}%"></span></div>
            <div class="index-label tooltip-container">
              SFI
              <div class="tooltip-content">${tooltips.sfi}</div>
            </div>
          </div>
          <div class="index-item">
            <div class="index-value">${data.sunspots || 'N/A'}</div>
            <div class="index-bar"><span class="${this.getIndexClass('SSN', data.sunspots)}" style="width:${this.calculateGaugeWidth('SSN', data.sunspots)}%"></span></div>
            <div class="index-label tooltip-container">
              SSN
              <div class="tooltip-content">${tooltips.ssn}</div>
            </div>
          </div>
          <div class="index-item">
            <div class="index-value">${data.aIndex || 'N/A'}</div>
            <div class="index-bar"><span class="${this.getIndexClass('A', data.aIndex)}" style="width:${this.calculateGaugeWidth('A', data.aIndex)}%"></span></div>
            <div class="index-label tooltip-container">
              A
              <div class="tooltip-content">${tooltips.aIndex}</div>
            </div>
          </div>
          <div class="index-item">
            <div class="index-value">${data.kIndex || 'N/A'}</div>
            <div class="index-bar"><span class="${this.getIndexClass('K', data.kIndex)}" style="width:${this.calculateGaugeWidth('K', data.kIndex)}%"></span></div>
            <div class="index-label tooltip-container">
              K
              <div class="tooltip-content">${tooltips.kIndex}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Middle row: Additional metrics in compact form -->
      <div class="middle-row">
        <div class="metrics-group">
          <div class="metric-item">
            <span class="tooltip-container">X-Ray:
              <div class="tooltip-content">${tooltips.xRay}</div>
            </span>
            ${data.xRay || 'N/A'}
          </div>
          <div class="metric-item">
            <span class="tooltip-container">Wind:
              <div class="tooltip-content">${tooltips.wind}</div>
            </span>
            ${data.solarWind || 'N/A'}
          </div>
          <div class="metric-item">
            <span class="tooltip-container">MagF:
              <div class="tooltip-content">${tooltips.magF}</div>
            </span>
            ${data.magneticField || 'N/A'}
          </div>
          <div class="metric-item">
            <span class="tooltip-container">GeoM:
              <div class="tooltip-content">${tooltips.geoM}</div>
            </span>
            <span class="${this.getGeomagClass(data.geomagField)}">${data.geomagField || 'N/A'}</span>
          </div>
        </div>
        <div class="metrics-group">
          <div class="metric-item">
            <span class="tooltip-container">PrFlux:
              <div class="tooltip-content">${tooltips.proton}</div>
            </span>
            ${data.protonFlux || 'N/A'}
          </div>            
          <div class="metric-item">
            <span class="tooltip-container">ElFlux:
              <div class="tooltip-content">${tooltips.electron}</div>
            </span>
            ${data.electronFlux || 'N/A'}
          </div>
          <div class="metric-item">
            <span class="tooltip-container">MUF:
              <div class="tooltip-content">${tooltips.muf}</div>
            </span>
            ${data.muf || 'N/A'}
          </div>
          <div class="metric-item">
            <span class="tooltip-container">S/N:
              <div class="tooltip-content">${tooltips.signalNoise}</div>
            </span>
            ${data.signalNoise || 'N/A'}
          </div>
          <div class="metric-item">
            <span class="tooltip-container">Aurora:
              <div class="tooltip-content">${tooltips.aurora}</div>
            </span>
            ${data.aurora || 'N/A'}
          </div>
        </div>
      </div>
      
      <!-- Bottom row: Band conditions -->
      <div class="bottom-row">
        <div class="conditions-section">
          <div class="section-title">${this.isDay ? 'Day' : 'Night'} Band Conditions</div>
          <div class="band-conditions">
            ${this.renderCompactBandConditions(data.bandConditions?.[timeOfDay] || {})}
          </div>
        </div>
        
        <div class="vhf-section">
          <div class="section-title">VHF</div>
          <div class="vhf-conditions">
            ${this.renderCompactVhfConditions(data.vhfConditions || {})}
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Update the container
  this.contentElement.innerHTML = html;
}

  /**
   * Calculate gauge width percentage based on index value
   * @param {string} indexType - Type of index (SFI, A, K, SSN)
   * @param {string|number} value - Index value
   * @returns {number} Width percentage (0-100)
   */
  calculateGaugeWidth(indexType, value) {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return 0;
    
    // Different scales for different indices
    switch (indexType) {
      case 'SFI':
        // Scale: typically 70-300 (higher is better)
        return Math.min(100, Math.max(0, (numValue - 70) / (300 - 70) * 100));
      case 'A':
        // Scale: typically 0-30 (lower is better)
        // Invert the scale since lower is better
        return Math.min(100, Math.max(0, (30 - numValue) / 30 * 100));
      case 'K':
        // Scale: 0-9 (lower is better)
        // Invert the scale since lower is better
        return Math.min(100, Math.max(0, (9 - numValue) / 9 * 100));
      case 'SSN':
        // Scale: typically 0-150 (higher is better)
        return Math.min(100, Math.max(0, numValue / 150 * 100));
      default:
        return 0;
    }
  }

  /**
   * Get CSS class for index value
   * @param {string} indexType - Type of index
   * @param {string|number} value - Index value
   * @returns {string} CSS class
   */
  getIndexClass(indexType, value) {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return 'gauge-unknown';
    
    switch (indexType) {
      case 'SFI':
        if (numValue < 90) return 'gauge-poor';
        if (numValue < 120) return 'gauge-fair';
        if (numValue < 150) return 'gauge-good';
        return 'gauge-excellent';
      case 'A':
        // A-index is inverse (lower is better)
        if (numValue < 7) return 'gauge-excellent';
        if (numValue < 15) return 'gauge-good';
        if (numValue < 30) return 'gauge-fair';
        return 'gauge-poor';
      case 'K':
        // K-index is inverse (lower is better)
        if (numValue < 3) return 'gauge-excellent';
        if (numValue < 5) return 'gauge-good';
        if (numValue < 7) return 'gauge-fair';
        return 'gauge-poor';
      case 'SSN':
        if (numValue < 30) return 'gauge-poor';
        if (numValue < 60) return 'gauge-fair';
        if (numValue < 100) return 'gauge-good';
        return 'gauge-excellent';
      default:
        return 'gauge-unknown';
    }
  }
  
  /**
   * Render band conditions in compact form
   * @param {Object} conditions - Band condition data
   * @returns {string} HTML markup
   */
  renderCompactBandConditions(conditions) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return '<div class="no-data">No data</div>';
    }
    
    return Object.entries(conditions).map(([band, condition]) => {
      const conditionClass = this.getConditionClass(condition);
      
      return `
        <div class="band-item">
          <div class="band-label">${band}</div>
          <div class="band-value ${conditionClass}">${condition}</div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render VHF conditions in compact form
   * @param {Object} conditions - VHF condition data
   * @returns {string} HTML markup
   */
  renderCompactVhfConditions(conditions) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return '<div class="no-data">No data</div>';
    }
    
    let html = '';
    let count = 0;
    const maxItems = 3; // Limit to save space
    
    // Flatten the structure for display
    for (const phenomenonKey in conditions) {
      if (conditions.hasOwnProperty(phenomenonKey) && count < maxItems) {
        const phenomenon = conditions[phenomenonKey];
        
        for (const locationKey in phenomenon) {
          if (phenomenon.hasOwnProperty(locationKey) && count < maxItems) {
            const status = phenomenon[locationKey];
            const conditionClass = this.getConditionClass(status);
            const shortName = this.getShortPhenomenonName(phenomenonKey, locationKey);
            
            html += `
              <div class="vhf-item">
                <div class="vhf-label">${shortName}</div>
                <div class="vhf-value ${conditionClass}">${status}</div>
              </div>
            `;
            
            count++;
          }
        }
      }
    }
    
    return html || '<div class="no-data">No data</div>';
  }

  /**
   * Get short name for VHF phenomenon
   * @param {string} phenomenon - Phenomenon name
   * @param {string} location - Location name
   * @returns {string} Short name
   */
  getShortPhenomenonName(phenomenon, location) {
    // Shorten to save space
    if (phenomenon === 'vhf-aurora') return 'Aurora';
    if (phenomenon === 'E-Skip') {
      if (location.includes('europe_6m')) return 'E-Skip 6m';
      if (location.includes('europe_4m')) return 'E-Skip 4m';
      if (location.includes('north_america')) return 'E-Skip NA';
      if (location.includes('europe')) return 'E-Skip EU';
    }
    
    return phenomenon;
  }

  /**
   * Get CSS class for condition
   * @param {string} condition - Condition text
   * @returns {string} CSS class
   */
  getConditionClass(condition) {
    if (!condition) return 'condition-unknown';
    
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('poor') || conditionLower.includes('closed')) return 'condition-poor';
    if (conditionLower.includes('fair')) return 'condition-fair';
    if (conditionLower.includes('good') && conditionLower.includes('very')) return 'condition-very-good';
    if (conditionLower.includes('good')) return 'condition-good';
    if (conditionLower.includes('excellent')) return 'condition-excellent';
    
    return 'condition-unknown';
  }

  /**
   * Get CSS class for geomagnetic field
   * @param {string} geomagField - Geomagnetic field status
   * @returns {string} CSS class
   */
  getGeomagClass(geomagField) {
    if (!geomagField) return '';
    
    const fieldLower = geomagField.toLowerCase();
    
    if (fieldLower.includes('quiet')) return 'geomag-quiet';
    if (fieldLower.includes('unsettled')) return 'geomag-unsettled';
    if (fieldLower.includes('active')) return 'geomag-active';
    if (fieldLower.includes('storm')) return 'geomag-storm';
    
    return '';
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    this.container = null;
    this.contentElement = null;
  }
}