export class PagedTable {
    constructor(elementId, options = {}) {
        this.element = document.getElementById(elementId);
        this.pageSize = options.pageSize || 20;
        this.currentPage = 0;
        this.autoCycleInterval = null;
        this.data = [];
        this.columns = options.columns || [];
        this.onUpdate = options.onUpdate;
        this.isLoading = false;
        if (options.autoCycle) {
            setTimeout(() => this.startAutoCycle(), 0);
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.render();
    }

    setData(data) {
        this.data = data;
        this.render();
    }

    render() {
        if (!this.element) return;

        if (this.isLoading) {
            this.element.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading data...</p>
                </div>
            `;
            return;
        }

        if (!this.data?.length) {
            this.element.innerHTML = `
                <div class="empty-state">
                    <p>No data available</p>
                </div>
            `;
            return;
        }

        // Filter columns based on visibility
        const visibleColumns = this.columns.filter(col => col.visible !== false);

        // Ensure we have valid numbers to prevent NaN
        const dataLength = Array.isArray(this.data) ? this.data.length : 0;
        const pageSize = this.pageSize > 0 ? this.pageSize : 1;
        
        const totalPages = Math.max(1, Math.ceil(dataLength / pageSize));
        const start = this.currentPage * pageSize;
        const end = start + pageSize;
        const pageData = this.data.slice(start, end);

        const content = document.createElement('div');
        content.innerHTML = `
            <table class="paged-table">
                <thead>
                    <tr>${visibleColumns.map(col => 
                        `<th data-align="${col.align}">${col.label}</th>`
                    ).join('')}</tr>
                </thead>
                <tbody>
                    ${pageData.map(item => `
                        <tr>${visibleColumns.map(col => 
                            `<td data-align="${col.align}">${this.formatCell(col, item)}</td>`
                        ).join('')}</tr>
                    `).join('')}
                </tbody>
            </table>
            ${this.renderPaginationControls(totalPages)}
        `;

        this.element.replaceChildren(content);
        this.attachEventListeners();
    }

    formatCell(column, item) {
        return column.formatter ? column.formatter(item[column.id], item) : (item[column.id] || '');
    }

    renderPaginationControls(totalPages) {
        // Ensure all values are valid to prevent NaN errors
        const validTotalPages = isNaN(totalPages) || totalPages < 1 ? 1 : totalPages;
        const validCurrentPage = isNaN(this.currentPage) ? 0 : this.currentPage;
        const displayPage = validCurrentPage + 1;
        
        return `
            <br>
            <div class="pagination-controls" align="center">
                <button id="first-page" ${validCurrentPage === 0 ? 'disabled' : ''}>|&lt;</button>
                <button id="prev-page" ${validCurrentPage === 0 ? 'disabled' : ''}>&lt;</button>
                <span>Page</span>
                <input id="page-input" type="number" min="1" max="${validTotalPages}" value="${displayPage}" />
                <span>/ ${validTotalPages}</span>
                <button id="next-page" ${displayPage >= validTotalPages ? 'disabled' : ''}>&gt;</button>
                <button id="last-page" ${displayPage >= validTotalPages ? 'disabled' : ''}>&gt;|</button>
                <button id="auto-cycle">${this.autoCycleInterval ? 'Stop' : 'Auto'}</button>
            </div>
            <br>
        `;
    }

    attachEventListeners() {
        const prevButton = this.element.querySelector('#prev-page');
        const nextButton = this.element.querySelector('#next-page');
        const firstButton = this.element.querySelector('#first-page');
        const lastButton = this.element.querySelector('#last-page');
        const pageInput = this.element.querySelector('#page-input');
        const autoButton = this.element.querySelector('#auto-cycle');
        
        // Ensure we have valid numbers to prevent NaN
        const dataLength = Array.isArray(this.data) ? this.data.length : 0;
        const pageSize = this.pageSize > 0 ? this.pageSize : 1;
        const totalPages = Math.max(1, Math.ceil(dataLength / pageSize));

        if (firstButton) {
            firstButton.addEventListener('click', () => {
                if (this.currentPage > 0) {
                    this.currentPage = 0;
                    this.render();
                }
            });
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (this.currentPage > 0) {
                    this.currentPage--;
                    this.render();
                }
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (this.currentPage < totalPages - 1) {
                    this.currentPage++;
                    this.render();
                }
            });
        }

        if (lastButton) {
            lastButton.addEventListener('click', () => {
                if (this.currentPage < totalPages - 1) {
                    this.currentPage = totalPages - 1;
                    this.render();
                }
            });
        }

        if (pageInput) {
            pageInput.addEventListener('change', () => {
                const targetPage = parseInt(pageInput.value, 10) - 1;
                if (targetPage >= 0 && targetPage < totalPages) {
                    this.currentPage = targetPage;
                    this.render();
                }
            });

            pageInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    const targetPage = parseInt(pageInput.value, 10) - 1;
                    if (targetPage >= 0 && targetPage < totalPages) {
                        this.currentPage = targetPage;
                        this.render();
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

    startAutoCycle() {
        if (this.autoCycleInterval) return;
        this.autoCycleInterval = setInterval(() => {
            // Ensure we have valid numbers to prevent NaN
            const dataLength = Array.isArray(this.data) ? this.data.length : 0;
            const pageSize = this.pageSize > 0 ? this.pageSize : 1;
            const totalPages = Math.max(1, Math.ceil(dataLength / pageSize));
            
            // Ensure currentPage is valid
            if (isNaN(this.currentPage)) {
                this.currentPage = 0;
            } else {
                this.currentPage = (this.currentPage + 1) % totalPages;
            }
            
            this.render();
        }, 8000);
    }

    stopAutoCycle() {
        if (this.autoCycleInterval) {
            clearInterval(this.autoCycleInterval);
            this.autoCycleInterval = null;
        }
    }
}