# Developer Guide: Adding a New Module to the Ham Radio Dashboard

This guide provides detailed instructions for adding new functionality to the Ham Radio Dashboard. Our architecture is designed to be modular and extensible, making it straightforward to add new features without disrupting existing functionality.

## Understanding the Architecture

Our dashboard follows a clean, layered architecture:

1. **API Layer** - Handles data fetching from external sources
2. **Models Layer** - Processes and stores data, manages state
3. **Components Layer** - Reusable UI elements
4. **Cards Layer** - Self-contained dashboard panels
5. **Services Layer** - Cross-cutting concerns like events and refresh scheduling

Data flows from external sources through these layers:
```
External API → API Layer → Models → Events → Cards/Components → UI
```

## Step-by-Step Guide to Adding a New Feature

Let's walk through adding a new feature module, using a hypothetical "DX Cluster" module as an example.

### Step 1: Define Requirements

First, clearly define what your module will do:
- What data will it display?
- Where will the data come from?
- How often should it refresh?
- What UI components will it need?

### Step 2: Add API Layer Module

Create a new file in the `src/api` directory:

```javascript
// src/api/dxCluster.js
import { CONFIG } from '../config/config.js';

/**
 * Fetches DX cluster data from the specified source
 * @returns {Promise<Object>} DX cluster data
 * @throws {Error} If fetch fails
 */
export async function fetchDXClusterData() {
  try {
    const dxURL = CONFIG.dxCluster.baseUrl + CONFIG.dxCluster.queryPath;
    
    // Try each proxy until one works
    for (const proxyUrl of CONFIG.proxyUrls) {
      try {
        const response = await fetch(proxyUrl + encodeURIComponent(dxURL));
        
        if (!response.ok) {
          console.warn(`Proxy ${proxyUrl} returned status ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.warn(`Proxy ${proxyUrl} failed:`, error);
      }
    }
    
    throw new Error('All proxies failed to fetch DX cluster data');
  } catch (error) {
    console.error('Error fetching DX cluster data:', error);
    throw error;
  }
}
```

### Step 3: Add Data Model

Create a new file in the `src/models` directory:

```javascript
// src/models/dxCluster.js
import { fetchDXClusterData } from '../api/dxCluster.js';
import eventService, { Events } from '../services/eventService.js';
import { CUSTOM_EVENTS } from '../config/constants.js';

// Add your new event type to constants
// In src/config/constants.js:
// export const CUSTOM_EVENTS = {
//   ...
//   DX_CLUSTER_UPDATED: 'dx_cluster_updated',
//   REFRESH_DX_CLUSTER: 'refresh_dx_cluster'
// };

class DXClusterModel {
  constructor() {
    this.dxSpots = [];
    this.lastUpdate = null;
    this.nextUpdate = null;
    this.isLoading = false;
    this.error = null;
  }

  /**
   * Fetch and process DX cluster data
   */
  async refreshData() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.error = null;
    
    // Notify UI that loading began
    eventService.publish(Events.DX_CLUSTER_UPDATED, { 
      isLoading: true, 
      dxSpots: this.dxSpots 
    });
    
    try {
      const data = await fetchDXClusterData();
      this.dxSpots = this.processDXData(data);
      
      this.lastUpdate = new Date();
      this.nextUpdate = new Date(Date.now() + 300000); // 5 minutes
      
      // Success! Publish the updated data
      eventService.publish(Events.DX_CLUSTER_UPDATED, {
        isLoading: false,
        dxSpots: this.dxSpots,
        lastUpdate: this.lastUpdate,
        nextUpdate: this.nextUpdate
      });
      
    } catch (error) {
      this.error = error.message;
      
      // Publish error state
      eventService.publish(Events.DX_CLUSTER_UPDATED, {
        isLoading: false,
        error: this.error,
        dxSpots: this.dxSpots
      });
      
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Process raw DX cluster data
   * @param {Object} data - Raw data from API
   * @returns {Array} Processed DX spots
   */
  processDXData(data) {
    // Process the data according to your requirements
    return data.spots.map(spot => ({
      frequency: parseFloat(spot.frequency),
      dxCall: spot.dxCall,
      comment: spot.comment,
      time: new Date(spot.time),
      spotter: spot.spotter,
      band: this.getBandFromFrequency(parseFloat(spot.frequency))
    }));
  }

  /**
   * Determine band from frequency
   * @param {number} freq - Frequency in MHz
   * @returns {string} Band name
   */
  getBandFromFrequency(freq) {
    // Implementation similar to bandsModel
  }

  /**
   * Get status information
   * @returns {Object} Status object
   */
  getStatus() {
    const now = new Date();
    const remainingSeconds = this.nextUpdate ? 
      Math.max(0, Math.floor((this.nextUpdate - now) / 1000)) : 0;

    return {
      spotCount: this.dxSpots.length,
      lastUpdate: this.lastUpdate,
      nextUpdate: this.nextUpdate,
      remainingSeconds,
      isLoading: this.isLoading,
      error: this.error
    };
  }
}

// Export a singleton instance
export default new DXClusterModel();
```

### Step 4: Register Event Types

Add your new event types to the constants file:

```javascript
// src/config/constants.js
export const CUSTOM_EVENTS = {
  // Existing events...
  DX_CLUSTER_UPDATED: 'dx_cluster_updated',
  REFRESH_DX_CLUSTER: 'refresh_dx_cluster'
};
```

### Step 5: Create Card Component

Create a new file in the `src/cards` directory:

```javascript
// src/cards/DXClusterCard.js
import eventService, { Events } from '../services/eventService.js';
import dxClusterModel from '../models/dxCluster.js';
import { Table } from '../components/Table.js';

export class DXClusterCard {
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
      Events.DX_CLUSTER_UPDATED,
      this.handleDataUpdate.bind(this)
    );
  }

  initialize() {
    // Create card structure
    this.container.innerHTML = `
      <div class="card-header">
        <h2>${this.config.title || 'DX Cluster'}</h2>
      </div>
      <div class="card-content">
        <div id="${this.container.id}-table"></div>
      </div>
      <div class="card-footer">
        <div id="${this.container.id}-status" class="status-text"></div>
      </div>
    `;

    // Define columns for DX cluster table
    const columns = this.config.display.columns || [
      { id: 'frequency', label: 'FREQ', align: 'right', 
        formatter: val => val.toFixed(1) },
      { id: 'dxCall', label: 'DX', align: 'left' },
      { id: 'spotter', label: 'SPOTTER', align: 'left' },
      { id: 'time', label: 'TIME', align: 'right',
        formatter: val => val.toLocaleTimeString() },
      { id: 'comment', label: 'COMMENT', align: 'left' }
    ];

    // Initialize table component
    this.table = new Table(`${this.container.id}-table`, {
      columns: columns,
      pageSize: 10,
      autoCycle: true,
      onRetry: () => dxClusterModel.refreshData()
    });
    
    // Reference to status element
    this.statusElement = document.getElementById(`${this.container.id}-status`);
    
    // Update status
    this.updateStatus();
  }

  handleDataUpdate(data) {
    if (data.isLoading) {
      this.table.setLoading(true);
    } else if (data.error) {
      this.table.setError(data.error);
    } else {
      this.table.setData(data.dxSpots);
    }
    
    this.updateStatus();
  }

  updateStatus() {
    if (!this.statusElement) return;
    
    const status = dxClusterModel.getStatus();
    
    this.statusElement.innerHTML = `
      <div>
        ${status.spotCount} spots
        ${status.lastUpdate 
          ? `<span class="divider">|</span> Last update: ${status.lastUpdate.toLocaleTimeString()}`
          : ''
        }
      </div>
    `;
  }

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
```

### Step 6: Update Configuration

Add your module's configuration to the config file:

```javascript
// src/config/config.js
export const CONFIG = {
  // ... existing config
  
  refreshIntervals: {
    // ... existing refresh intervals
    dxCluster: REFRESH_INTERVALS.MEDIUM,  // 5 minutes
  },
  
  cards: {
    // ... existing cards
    dxCluster: {
      id: 'dx-cluster',
      title: 'DX Cluster',
      display: {
        showLastUpdate: true,
        columns: [
          { id: 'frequency', label: 'FREQ', align: 'right' },
          { id: 'dxCall', label: 'DX', align: 'left' },
          { id: 'spotter', label: 'SPOTTER', align: 'left' },
          { id: 'time', label: 'TIME', align: 'right' },
          { id: 'comment', label: 'COMMENT', align: 'left' }
        ]
      }
    }
  },
  
  // Add your API configuration
  dxCluster: {
    baseUrl: 'https://example.com/api',
    queryPath: '/dxcluster',
    params: {
      limit: 50
    }
  }
};
```

### Step 7: Update HTML

Add a container for your card in index.html:

```html
<!-- In the cards-container div -->
<div class="card" id="dx-cluster">
    <h2>DX Cluster</h2>
    <div id="dx-cluster-table"></div>
    <div id="dx-cluster-status" class="status-text"></div>
</div>
```

### Step 8: Update Main Application

Register your card and refresh handler in app.js:

```javascript
// In the createCards method of HamDashboard class
createCards() {
  // ... existing cards
  this.cards.dxCluster = new DXClusterCard('dx-cluster', CONFIG.cards.dxCluster);
}

// In the setupEventListeners method
setupEventListeners() {
  // ... existing event listeners
  
  eventService.subscribe(Events.REFRESH_DX_CLUSTER, () => {
    dxClusterModel.refreshData();
  });
}
```

### Step 9: Register with Refresh Service

Add your module to the refresh service:

```javascript
// In refreshService.js, start method
start() {
  if (this.isActive) return;
  this.isActive = true;
  
  // ... existing refreshes
  
  this.scheduleRefresh('dxCluster', 
    () => eventService.publish(Events.REFRESH_DX_CLUSTER), 
    CONFIG.refreshIntervals.dxCluster * 1000
  );
}
```

### Step 10: Import Your Module

Update your imports in app.js:

```javascript
import { DXClusterCard } from './cards/DXClusterCard.js';
import dxClusterModel from './models/dxCluster.js';
```

## Best Practices for Module Development

1. **Consistency**: Follow the established patterns for API, models, and UI components
2. **Error Handling**: Always handle errors gracefully at each layer
3. **Events**: Use the event system for communication between components
4. **Cleanup**: Implement destroy methods to clean up resources
5. **Configuration**: Make your module configurable through the CONFIG object
6. **Testing**: Test each layer individually before integration

## Key Points to Remember

- **Single Responsibility**: Each file should have a clear, focused purpose
- **Data Flow**: Data should flow in one direction: API → Model → UI
- **Events**: Components communicate through events, not direct function calls
- **Error States**: Always handle loading/error states for better UX
- **Unsubscribe**: Always unsubscribe from events when components are destroyed

By following these guidelines, you can seamlessly integrate new modules into our Ham Radio Dashboard while maintaining the clean architecture and ensuring a consistent user experience.