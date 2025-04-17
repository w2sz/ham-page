// src/cards/SpotterCard.js
import spotsModel from '../models/spots.js';
import { Table } from '../components/Table.js';
import eventService, { Events } from '../services/eventService.js';

/**
 * Card for displaying spotter network data
 */
export class SpotterCard {
  /**
   * Create a new SpotterCard
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
      Events.SPOTS_UPDATED, 
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
        <h2>${this.config.title}</h2>
      </div>
      <div class="card-content">
        <div id="${this.container.id}-table"></div>
      </div>
      <div class="card-footer">
        <div id="${this.container.id}-status" class="status-text"></div>
      </div>
    `;

    // Initialize table component
    this.table = new Table(`${this.container.id}-table`, {
      columns: this.config.display.columns,
      pageSize: 20,
      autoCycle: true,
      onRetry: () => spotsModel.refreshData()
    });
    
    // Reference to status element
    this.statusElement = document.getElementById(`${this.container.id}-status`);
    
    // Update with initial data
    this.updateStatus();
    this.table.setData(spotsModel.spots);
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
      this.table.setData(data.spots);
    }
    
    this.updateStatus();
  }

  /**
   * Update status information
   */
  updateStatus() {
    if (!this.statusElement) return;
    
    const status = spotsModel.getStatus();
    const now = new Date();
    
    this.statusElement.innerHTML = `
      <div>
        Total spots: ${status.totalSpots} in last 24h
        ${status.lastUpdate 
          ? `<br>Last update: ${status.lastUpdate.toLocaleTimeString()}`
          : ''
        }
      </div>
    `;
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