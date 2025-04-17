// src/cards/BandSummaryCard.js
import eventService, { Events } from '../services/eventService.js';
import bandsModel from '../models/bands.js';
import { Table } from '../components/Table.js';

/**
 * Card for displaying band activity summary
 */
export class BandSummaryCard {
  /**
   * Create a new BandSummaryCard
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
    this.table = null;
    this.statusElement = null;
    
    // Initialize the card UI
    this.initialize();
    
    // Subscribe to data updates
    this.unsubscribe = eventService.subscribe(
      Events.BANDS_UPDATED,
      this.handleDataUpdate.bind(this)
    );
  }

  /**
   * Initialize the card UI
   */
  initialize() {
    // Create card structure
    this.container.innerHTML = `
      <div class="card-header">
        <h2>${this.config.title || 'Band Activity Summary'}</h2>
      </div>
      <div class="card-content">
        <div id="${this.container.id}-table"></div>
      </div>
      <div class="card-footer">
        <div id="${this.container.id}-status" class="status-text"></div>
      </div>
    `;

    // Define columns for band summary table
    const columns = this.config.display.columns || [
      { id: 'band', label: 'BAND', align: 'left' },
      { id: 'activityStars', label: 'ACTIVITY', align: 'center' },
      { id: 'count', label: 'SPOTS', align: 'right' },
      { id: 'maxSignal', label: 'BEST DB', align: 'right', 
        formatter: (val) => val > -999 ? `${val}` : 'N/A' }
    ];

    // Initialize table component with hidden controls
    this.table = new Table(`${this.container.id}-table`, {
      columns: columns,
      pageSize: 15, // Increased page size to show more bands at once
      autoCycle: false,
      showControls: false, // Hide pagination controls
      onRetry: () => bandsModel.refreshData()
    });
    
    // Reference to status element
    this.statusElement = document.getElementById(`${this.container.id}-status`);
    
    // Update with initial data if available
    const initialData = bandsModel.getSortedBandData();
    if (initialData.length > 0) {
      this.table.setData(initialData);
    } else {
      this.table.setLoading(true);
    }
    
    // Update status
    this.updateStatus();
  }

  /**
   * Handle data update events
   * @param {Object} data - Updated data 
   */
  handleDataUpdate(data) {
    if (data.isLoading) {
      this.table.setLoading(true);
    } else if (data.error) {
      this.table.setError(data.error);
    } else {
      const sortedData = bandsModel.getSortedBandData();
      this.table.setData(sortedData);
    }
    
    this.updateStatus();
  }

  /**
   * Update status information
   */
  updateStatus() {
    if (!this.statusElement) return;
    
    const status = bandsModel.getStatus();
    
    if (status.isEmpty) {
      this.statusElement.innerHTML = `
        <div>No band activity data available</div>
      `;
      return;
    }
    
    this.statusElement.innerHTML = `
      <div>
        ${status.bandCount} active bands with ${status.totalSpots} total spots
        ${status.lastUpdate 
          ? `<br>Fetched: ${status.lastUpdate.toLocaleTimeString()}`
          : ''
        }
      </div>
    `;
  }

  /**
   * Resize the card (for responsive layouts)
   * @param {Object} dimensions - New dimensions
   */
  resize(dimensions) {
    // Handle resize if needed
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    if (this.table) {
      this.table.destroy();
    }
    
    this.container = null;
    this.statusElement = null;
  }
}