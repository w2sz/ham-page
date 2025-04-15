import { CONFIG } from './config.js';
import { formatDate, formatTime } from './utils/formatters.js';
import { formatCell} from './utils/helpers.js';

class Card {
    constructor(config) {
        this.id = config.id;
        this.title = config.title;
        this.display = config.display;
        this.element = document.getElementById(this.id);
    }

    initialize() {
        throw new Error('initialize() must be implemented by subclass');
    }

    update() {
        throw new Error('update() must be implemented by subclass');
    }

    render() {
        throw new Error('render() must be implemented by subclass');
    }
}

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

export const updateHeaderInfo = () => {
    const now = new Date();

    document.getElementById('time-display').innerHTML = `
        <div class="time-item local-time">
            <div>${formatDate(now)}</div>
            <div>${formatTime(now)}</div>
        </div>
        <div class="time-item utc-time">UTC: ${formatTime(now, true)}</div>
    `;

    document.getElementById('callsign').innerText = `${CONFIG.station.callsign}`;
    document.getElementById('gridsquare').innerText = `${CONFIG.station.gridsquare}`;
};

export class CardManager {
    static renderCard(cardId, data, element) {
        const config = CONFIG.cards[cardId];
        if (!config || !element) return;

        const visibleColumns = config.display.columns.filter(col => col.visible);
        
        const content = document.createElement('div');
        content.innerHTML = `
            <table class="qso-table">
                <thead>
                    <tr>${visibleColumns.map(col => 
                        `<th data-align="${col.align}">${col.label}</th>`
                    ).join('')}</tr>
                </thead>
                <tbody>
                    ${data.slice(0, config.display.maxItems).map(item => `
                        <tr>${visibleColumns.map(col => 
                            `<td data-align="${col.align}">${formatCell(cardId, col.id, item, col)}</td>`
                        ).join('')}</tr>
                    `).join('')}
                </tbody>
            </table>
            ${config.display.showLastUpdate ? `
                <div class="card-footer">
                    <span>${data.length} entries</span>
                    <span>Last update: ${new Date().toLocaleTimeString()}</span>
                </div>
            ` : ''}
        `;
        
        element.replaceChildren(content);
    }
}

export const updateTable = (spots) => {
    const element = document.getElementById('qso-list');
    CardManager.renderCard('pskReporter', spots, element);
};

export const startCountdown = () => {
    let countdown = CONFIG.display.refreshInterval;
    const countdownElement = document.getElementById('refresh-countdown');
    
    const timer = setInterval(() => {
        countdown--;
        if (countdownElement) {
            countdownElement.textContent = countdown;
        }
        if (countdown <= 0) {
            clearInterval(timer);
        }
    }, 1000);
};

export const showLoading = () => {
    const qsoListElement = document.getElementById('qso-list');
    if (!qsoListElement) return;
    
    qsoListElement.classList.add('loading-state');
    qsoListElement.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Connecting to PSK Reporter...</p>
        </div>
    `;
};

export const updateLoadingStatus = (status) => {
    const statusElement = document.querySelector('.loading-status');
    if (statusElement) {
        statusElement.textContent = status;
    }
};

export const showError = (message) => {
    const qsoListElement = document.getElementById('qso-list');
    if (!qsoListElement) return;
    
    qsoListElement.classList.remove('loading-state');
    qsoListElement.innerHTML = `
        <div class="error">
            <p>${message}</p>
            <button onclick="window.location.reload()">Retry</button>
        </div>
    `;
};