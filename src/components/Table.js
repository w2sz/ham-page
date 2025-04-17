// src/components/Table.js

/**
 * Reusable table component with pagination
 */
export class Table {
    /**
     * Create a new Table component
     * @param {string} elementId - ID of container element
     * @param {Object} options - Configuration options
     */
    constructor(elementId, options = {}) {
        this.element = document.getElementById(elementId);
        if (!this.element) {
          console.error(`Element with ID "${elementId}" not found`);
          return;
        }
        
        this.options = {
          pageSize: 20,
          autoCycle: false,
          cycleDuration: 8000,
          columns: [],
          showControls: true, // New option to show/hide pagination controls
          ...options
        };
        
        this.data = [];
        this.currentPage = 0;
        this.isLoading = false;
        this.error = null;
        this.autoCycleInterval = null;
        
        // Start auto-cycle if enabled
        if (this.options.autoCycle) {
          this.startAutoCycle();
        }
      }
  
    /**
     * Set loading state and re-render
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
      this.isLoading = loading;
      this.render();
    }
  
    /**
     * Set error state and re-render
     * @param {string} error - Error message
     */
    setError(error) {
      this.error = error;
      this.render();
    }
  
    /**
     * Update table data and re-render
     * @param {Array} data - Table data
     */
    setData(data) {
      this.data = Array.isArray(data) ? data : [];
      this.isLoading = false;
      this.error = null;
      this.render();
    }
  
    /**
     * Go to a specific page
     * @param {number} page - Page number (0-based)
     */
    goToPage(page) {
      const totalPages = this.getTotalPages();
      this.currentPage = Math.max(0, Math.min(page, totalPages - 1));
      this.render();
    }
  
    /**
     * Get total page count
     * @returns {number} Total page count
     */
    getTotalPages() {
      return Math.max(1, Math.ceil(this.data.length / this.options.pageSize));
    }
  
    /**
     * Start auto-cycling through pages
     */
    startAutoCycle() {
      if (this.autoCycleInterval) return;
      
      this.autoCycleInterval = setInterval(() => {
        const totalPages = this.getTotalPages();
        this.currentPage = (this.currentPage + 1) % totalPages;
        this.render();
      }, this.options.cycleDuration);
    }
  
    /**
     * Stop auto-cycling through pages
     */
    stopAutoCycle() {
      if (this.autoCycleInterval) {
        clearInterval(this.autoCycleInterval);
        this.autoCycleInterval = null;
      }
    }
  
    /**
     * Format cell content using formatter function if available
     * @param {Object} column - Column configuration
     * @param {Object} row - Row data
     * @returns {string} Formatted cell content
     */
    formatCell(column, row) {
      const value = row[column.id];
      return column.formatter ? column.formatter(value, row) : (value || '');
    }
  
    /**
     * Render the table to the DOM
     */
    render() {
      if (!this.element) return;
  
      // Handle loading state
      if (this.isLoading) {
        this.element.innerHTML = `
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading data...</p>
          </div>
        `;
        return;
      }
  
      // Handle error state
      if (this.error) {
        this.element.innerHTML = `
          <div class="error-state">
            <p>${this.error}</p>
            <button class="retry-button">Retry</button>
          </div>
        `;
        
        this.element.querySelector('.retry-button')?.addEventListener('click', () => {
          if (this.options.onRetry) this.options.onRetry();
        });
        
        return;
      }
  
      // Handle empty state
      if (!this.data.length) {
        this.element.innerHTML = `
          <div class="empty-state">
            <p>No data available</p>
          </div>
        `;
        return;
      }
  
      // Compute pagination
      const visibleColumns = this.options.columns.filter(col => col.visible !== false);
      const totalPages = this.getTotalPages();
      const pageSize = this.options.pageSize;
      const start = this.currentPage * pageSize;
      const end = Math.min(start + pageSize, this.data.length);
      const pageData = this.data.slice(start, end);
  
      // Render table
      const content = document.createElement('div');
      content.innerHTML = `
        <table class="paged-table">
          <thead>
            <tr>${visibleColumns.map(col => 
              `<th data-align="${col.align || 'left'}">${col.label}</th>`
            ).join('')}</tr>
          </thead>
          <tbody>
            ${pageData.map(row => `
              <tr>${visibleColumns.map(col => 
                `<td data-align="${col.align || 'left'}">${this.formatCell(col, row)}</td>`
              ).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      `;

      if (this.options.showControls) {
        content.innerHTML += this.renderPaginationControls(totalPages);
      }
      // Update DOM and attach event listeners
      this.element.replaceChildren(content);
      this.attachEventListeners();
    }
  
    /**
     * Render pagination controls
     * @param {number} totalPages - Total number of pages
     * @returns {string} HTML for pagination controls
     */
    renderPaginationControls(totalPages) {
      return `
        <div class="pagination-controls" align="center">
          <button id="first-page" ${this.currentPage === 0 ? 'disabled' : ''}>|&lt;</button>
          <button id="prev-page" ${this.currentPage === 0 ? 'disabled' : ''}>&lt;</button>
          <input id="page-input" type="number" min="1" max="${totalPages}" value="${this.currentPage + 1}" />
          <span style="font-size: var(--font-size-small)">/ ${totalPages}</span>
          <button id="next-page" ${this.currentPage >= totalPages - 1 ? 'disabled' : ''}>&gt;</button>
          <button id="last-page" ${this.currentPage >= totalPages - 1 ? 'disabled' : ''}>&gt;|</button>
          <button id="auto-cycle">${this.autoCycleInterval ? 'Stop' : 'Auto'}</button>
        </div>
      `;
    }
  
    /**
     * Attach event listeners to pagination controls
     */
    attachEventListeners() {
      const prevButton = this.element.querySelector('#prev-page');
      const nextButton = this.element.querySelector('#next-page');
      const firstButton = this.element.querySelector('#first-page');
      const lastButton = this.element.querySelector('#last-page');
      const pageInput = this.element.querySelector('#page-input');
      const autoButton = this.element.querySelector('#auto-cycle');
      
      const totalPages = this.getTotalPages();
  
      if (firstButton) {
        firstButton.addEventListener('click', () => {
          if (this.currentPage > 0) {
            this.goToPage(0);
          }
        });
      }
  
      if (prevButton) {
        prevButton.addEventListener('click', () => {
          if (this.currentPage > 0) {
            this.goToPage(this.currentPage - 1);
          }
        });
      }
  
      if (nextButton) {
        nextButton.addEventListener('click', () => {
          if (this.currentPage < totalPages - 1) {
            this.goToPage(this.currentPage + 1);
          }
        });
      }
  
      if (lastButton) {
        lastButton.addEventListener('click', () => {
          if (this.currentPage < totalPages - 1) {
            this.goToPage(totalPages - 1);
          }
        });
      }
  
      if (pageInput) {
        pageInput.addEventListener('change', () => {
          const targetPage = parseInt(pageInput.value, 10) - 1;
          if (targetPage >= 0 && targetPage < totalPages) {
            this.goToPage(targetPage);
          }
        });
  
        pageInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            const targetPage = parseInt(pageInput.value, 10) - 1;
            if (targetPage >= 0 && targetPage < totalPages) {
              this.goToPage(targetPage);
            }
          }
        });
      }
  
      if (autoButton) {
        autoButton.addEventListener('click', () => {
          if (this.autoCycleInterval) {
            this.stopAutoCycle();
          } else {
            this.startAutoCycle();
          }
          this.render();
        });
      }
    }
  
    /**
     * Clean up resources
     */
    destroy() {
      this.stopAutoCycle();
      this.element = null;
    }
  }