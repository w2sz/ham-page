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
                    ${this.currentData.map(spot => `
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
                    ${data.map(item => `
                        <tr>${visibleColumns.map(col => 
                            `<td data-align="${col.align}">${formatCell(cardId, col.id, item, col)}</td>`
                        ).join('')}</tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        element.replaceChildren(content);
    }
}

export const updateTable = (spots) => {
    const element = document.getElementById('qso-list');
    const pageSize = 20;
    let currentPage = 0;
    let autoCycleInterval = null;
    let lastFetchTime = new Date();
    let countdown = CONFIG.display.refreshInterval;

    const renderPage = () => {
        const totalPages = Math.ceil(spots.length / pageSize);
        const start = currentPage * pageSize;
        const end = start + pageSize;
        const paginatedSpots = spots.slice(start, end);
        CardManager.renderCard('pskReporter', paginatedSpots, element);

        const paginationControls = `
            <div class="pagination-controls" style="display: flex; align-items: center; gap: var(--spacing-sm); margin-top: var(--spacing-sm);">
                <button id="prev-page" ${currentPage === 0 ? 'disabled' : ''} style="padding: var(--spacing-sm); background: var(--button-bg); color: var(--button-text); border-radius: var(--border-radius); border: none;">&lt;</button>
                <span style="font-size: var(--font-size-small); color: var(--text-secondary);">Page</span>
                <input id="page-input" type="number" min="1" max="${totalPages}" value="${currentPage + 1}" style="width: 3rem; text-align: center; padding: var(--spacing-sm); background: var(--input-bg); color: var(--input-text); border: 1px solid var(--input-border); border-radius: var(--border-radius);" />
                <span style="font-size: var(--font-size-small); color: var(--text-secondary);">/ ${totalPages}</span>
                <button id="next-page" ${end >= spots.length ? 'disabled' : ''} style="padding: var(--spacing-sm); background: var(--button-bg); color: var(--button-text); border-radius: var(--border-radius); border: none;">&gt;</button>
                <button id="auto-cycle" style="padding: var(--spacing-sm); background: var(--button-bg); color: var(--button-text); border-radius: var(--border-radius); border: none;">${autoCycleInterval ? 'Stop' : 'Auto'}</button>
            </div>
            <div class="secondary-text" style="font-size: var(--font-size-small); color: var(--text-secondary); margin-top: var(--spacing-sm);">
                Total entries: ${spots.length} | Last fetched: ${lastFetchTime.toLocaleTimeString()} | Next fetch in: ${countdown}s
            </div>
        `;
        element.insertAdjacentHTML('beforeend', paginationControls);

        document.getElementById('prev-page')?.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                renderPage();
            }
        });

        document.getElementById('next-page')?.addEventListener('click', () => {
            if (end < spots.length) {
                currentPage++;
                renderPage();
            }
        });

        const pageInput = document.getElementById('page-input');
        pageInput?.addEventListener('blur', () => {
            const targetPage = parseInt(pageInput.value, 10) - 1;
            if (targetPage >= 0 && targetPage < totalPages) {
                currentPage = targetPage;
                renderPage();
            }
        });

        pageInput?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const targetPage = parseInt(pageInput.value, 10) - 1;
                if (targetPage >= 0 && targetPage < totalPages) {
                    currentPage = targetPage;
                    renderPage();
                }
            }
        });

        document.getElementById('auto-cycle')?.addEventListener('click', () => {
            if (autoCycleInterval) {
                clearInterval(autoCycleInterval);
                autoCycleInterval = null;
                renderPage();
            } else {
                startAutoCycle();
            }
        });
    };

    const startAutoCycle = () => {
        autoCycleInterval = setInterval(() => {
            currentPage = (currentPage + 1) % Math.ceil(spots.length / pageSize);
            renderPage();
        }, 5000); // Auto-cycle every 5 seconds
    };

    const startCountdown = () => {
        const timer = setInterval(() => {
            countdown--;
            if (countdown <= 0) {
                clearInterval(timer);
                countdown = CONFIG.display.refreshInterval;
                lastFetchTime = new Date();
                renderPage();
            } else {
                renderPage();
            }
        }, 1000);
    };

    renderPage();
    startCountdown();
    startAutoCycle(); // Enable auto-cycle by default
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