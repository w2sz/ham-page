import { Card } from './Card.js';
import { formatAge, formatDistance, formatGrid } from '../utils/formatters.js';

export class PSKReporterCard extends Card {
    constructor(config) {
        super(config);
        this.lastFetchTime = null;
        this.currentData = [];
        console.log('PSKReporterCard initialized with config:', config);
    }

    initialize() {
        if (!this.element) {
            console.error('PSKReporterCard: No element found for id:', this.id);
            return;
        }
        console.log('PSKReporterCard: Initializing element');
        this.element.innerHTML = `
            <h2>${this.title}</h2>
            <div id="qso-list"></div>
        `;
    }

    update(data) {
        if (data) {
            this.lastFetchTime = new Date();
            this.currentData = data;
        }
        this.render();
    }

    formatCell(colId, spot, columnConfig) {
        switch(colId) {
            case 'age': return formatAge(spot.flowStartSeconds);
            case 'grid': return formatGrid(spot.grid, columnConfig);
            case 'distance': return formatDistance(spot.distance, columnConfig);
            default: return spot[colId] || '';
        }
    }

    render() {
        if (!this.element || !this.currentData?.length) return;

        const content = document.getElementById('qso-list');
        if (!content) return;

        const { columns } = this.display;
        content.innerHTML = `
            <table class="qso-table">
                <thead>
                    <tr>
                        ${columns.map(col => 
                            `<th data-align="${col.align}">${col.label}</th>`
                        ).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${this.currentData.slice(0, this.display.itemsPerPage).map(spot => `
                        <tr>
                            ${columns.map(col => 
                                `<td data-align="${col.align}">
                                    ${this.formatCell(col.id, spot, col)}
                                </td>`
                            ).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="spot-update-time">
                ${this.currentData.length} spots in last 24h
                <br>
                Last fetched: ${this.lastFetchTime?.toLocaleTimeString() || 'Never'}
            </div>
        `;
    }
}
