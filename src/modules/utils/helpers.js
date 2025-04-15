import { formatAge, formatGrid, formatDistance } from './formatters.js';

export const formatCell = (cardId, colId, data, colConfig) => {
    const formatters = {
        pskReporter: {
            age: (d) => formatAge(d.flowStartSeconds),
            grid: (d) => formatGrid(d.grid, colConfig),
            distance: (d) => formatDistance(d.distance, colConfig)
        },
        bandSummary: {
            activity: (d) => formatActivity(d.activity),
            spots: (d) => d.spots.toString()
        }
    };

    return formatters[cardId]?.[colId]?.(data) ?? data[colId] ?? '';
};

export const getColumnHeader = (col) => {
    if (col.id === 'distance') {
        return `DIST ${col.unit.toUpperCase()}`;
    }
    return col.label;
};

export class CardPaginator {
    constructor(elementId, items, itemsPerPage) {
        this.container = document.getElementById(elementId);
        this.items = items;
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 0;
        this.totalPages = Math.ceil(items.length / itemsPerPage);
    }

    renderPage() {
        const start = this.currentPage * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return this.items.slice(start, end);
    }

    nextPage() {
        this.currentPage = (this.currentPage + 1) % this.totalPages;
        return this.renderPage();
    }
}
