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
        this.statusProvider = options.statusProvider;
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

        const totalPages = Math.ceil(this.data.length / this.pageSize);
        const start = this.currentPage * this.pageSize;
        const end = start + this.pageSize;
        const pageData = this.data.slice(start, end);

        const content = document.createElement('div');
        content.innerHTML = `
            <table class="qso-table">
                <thead>
                    <tr>${this.columns.map(col => 
                        `<th data-align="${col.align}">${col.label}</th>`
                    ).join('')}</tr>
                </thead>
                <tbody>
                    ${pageData.map(item => `
                        <tr>${this.columns.map(col => 
                            `<td data-align="${col.align}">${this.formatCell(col, item)}</td>`
                        ).join('')}</tr>
                    `).join('')}
                </tbody>
            </table>
            ${this.renderPaginationControls(totalPages)}
            ${this.statusProvider ? this.statusProvider() : ''}
        `;

        this.element.replaceChildren(content);
        this.attachEventListeners();
    }

    formatCell(column, item) {
        return column.formatter ? column.formatter(item[column.id], item) : (item[column.id] || '');
    }

    renderPaginationControls(totalPages) {
        return `
            <div class="pagination-controls">
                <button id="prev-page" ${this.currentPage === 0 ? 'disabled' : ''}>&lt;</button>
                <span>Page</span>
                <input id="page-input" type="number" min="1" max="${totalPages}" value="${this.currentPage + 1}" />
                <span>/ ${totalPages}</span>
                <button id="next-page" ${(this.currentPage + 1) >= totalPages ? 'disabled' : ''}>&gt;</button>
                <button id="auto-cycle">${this.autoCycleInterval ? 'Stop' : 'Auto'}</button>
            </div>
        `;
    }

    attachEventListeners() {
        const prevButton = this.element.querySelector('#prev-page');
        const nextButton = this.element.querySelector('#next-page');
        const pageInput = this.element.querySelector('#page-input');
        const autoButton = this.element.querySelector('#auto-cycle');
        const totalPages = Math.ceil(this.data.length / this.pageSize);

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
            const totalPages = Math.ceil(this.data.length / this.pageSize);
            this.currentPage = (this.currentPage + 1) % totalPages;
            this.render();
        }, 5000);
    }

    stopAutoCycle() {
        if (this.autoCycleInterval) {
            clearInterval(this.autoCycleInterval);
            this.autoCycleInterval = null;
        }
    }
}
