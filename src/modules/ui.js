import { CONFIG } from './config.js';
import { spotCache } from './spots.js';
import { pskReporterConfig } from './cards/psk-reporter.config.js';

export const updateHeaderInfo = () => {
    const now = new Date();
    const utcNow = new Date(now.toUTCString());
    
    const formatDate = (date) => date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const formatTime = (date, useUTC = false) => date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: useUTC ? 'UTC' : undefined
    });

    document.getElementById('time-display').innerHTML = `
        <div class="local-time">
            <span class="date">${formatDate(now)}</span>
            <span class="time">Local: ${formatTime(now)}</span>
        </div>
        <div class="utc-time">
            <span class="date">${formatDate(utcNow)}</span>
            <span class="time">UTC: ${formatTime(now, true)}</span>
        </div>
    `;

    document.getElementById('callsign').innerText = `${CONFIG.station.callsign}`;
    document.getElementById('gridsquare').innerText = `${CONFIG.station.gridsquare}`;
};

class CardPaginator {
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

const formatAge = (timestamp) => {
    if (!timestamp) {
        console.error('Missing timestamp for age calculation');
        return '';
    }
    
    const now = Math.floor(Date.now() / 1000);
    console.log('Age calc:', {
        now,
        timestamp,
        type: typeof timestamp,
        diff: now - timestamp
    });
    
    const diff = now - timestamp;
    if (isNaN(diff)) return '';
    
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
};

const formatDistance = (km) => {
    const distance = parseFloat(km);
    if (isNaN(distance)) return '';
    return Math.round(distance).toString();
};

const formatGrid = (grid, columnConfig) => {
    if (!grid) return '';
    const maxDigits = columnConfig?.maxDigits || grid.length;
    return grid.substring(0, maxDigits);
};

const formatCell = (colId, spot, columnConfig) => {
    switch(colId) {
        case 'age': return formatAge(spot.flowStartSeconds);
        case 'grid': return formatGrid(spot.grid, columnConfig);
        case 'distance': return formatDistance(spot.distance, columnConfig);
        default: return spot[colId] || '';
    }
};

const getColumnHeader = (col) => {
    if (col.id === 'distance') {
        return `DIST ${col.unit.toUpperCase()}`;
    }
    return col.label;
};

const renderSpots = (currentSpots, paginator) => {
    // Get column config from PSK Reporter card config
    const { columns } = pskReporterConfig.display;
    
    const thead = `
        <thead>
            <tr>
                ${columns.map(col => 
                    `<th data-align="${col.align}">${col.label}</th>`
                ).join('')}
            </tr>
        </thead>
        <tbody>
            ${currentSpots.map(spot => `
                <tr>
                    ${columns.map(col => 
                        `<td data-align="${col.align}">${formatCell(col.id, spot, col)}</td>`
                    ).join('')}
                </tr>
            `).join('')}
        </tbody>
    `;
    return `
        <div class="table-controls">
            <button onclick="toggleTableConfig()">⚙️ Configure Table</button>
        </div>
        <table class="qso-table">
            ${thead}
        </table>
        <div class="spot-update-time">
            ${spotCache.receptionReport.length} spots in last 24h (Page ${paginator.currentPage + 1}/${paginator.totalPages})
            <br>
            Last updated: ${new Date().toLocaleTimeString()}
        </div>
    `;
};

// Add to window for button onclick access
window.toggleTableConfig = () => {
    const dialog = document.createElement('dialog');
    dialog.className = 'config-dialog';
    const columns = CONFIG.display.table.columns;
    
    dialog.innerHTML = `
        <form method="dialog">
            <h3>Table Configuration</h3>
            ${Object.entries(columns).map(([key, config]) => `
                <label>
                    <input type="checkbox" 
                           name="${key}" 
                           ${config.enabled ? 'checked' : ''}>
                    ${config.label}
                </label>
            `).join('')}
            <label>
                Grid Digits:
                <select name="gridDigits">
                    ${[2,4,6].map(n => `
                        <option value="${n}" ${columns.grid.maxDigits === n ? 'selected' : ''}>
                            ${n}
                        </option>
                    `).join('')}
                </select>
            </label>
            <label>
                Distance Unit:
                <select name="distanceUnit">
                    <option value="km" ${columns.distance.unit === 'km' ? 'selected' : ''}>Kilometers</option>
                    <option value="mi" ${columns.distance.unit === 'mi' ? 'selected' : ''}>Miles</option>
                </select>
            </label>
            <button type="submit">Save</button>
        </form>
    `;

    dialog.addEventListener('close', () => {
        const formData = new FormData(dialog.querySelector('form'));
        Object.keys(columns).forEach(key => {
            columns[key].enabled = formData.has(key);
        });
        columns.grid.maxDigits = parseInt(formData.get('gridDigits'));
        columns.distance.unit = formData.get('distanceUnit');
        updateTable(spotCache.receptionReport);
    });

    document.body.appendChild(dialog);
    dialog.showModal();
};

export const updateTable = (spots) => {
    if (!spots?.length) return;
    const qsoListElement = document.getElementById('qso-list');
    if (!qsoListElement) return;

    const paginator = new CardPaginator('qso-list', spots, CONFIG.display.cards.itemsPerPage);
    
    const renderSpotsWrapper = (currentSpots) => {
        qsoListElement.innerHTML = renderSpots(currentSpots, paginator);
    };

    // Initial render
    renderSpotsWrapper(paginator.renderPage());

    // Start cycling
    if (window.spotCycleTimer) clearInterval(window.spotCycleTimer);
    window.spotCycleTimer = setInterval(() => {
        renderSpotsWrapper(paginator.nextPage());
    }, CONFIG.display.cards.cycleInterval * 1000);
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

export const checkForDX = (spots) => {
    const newDX = spots.find(spot => spot.distance > CONFIG.display.dxThreshold);
    if (newDX) {
        const alert = document.createElement('div');
        alert.className = 'dx-alert';
        alert.textContent = `DX Alert! ${newDX.call} at ${newDX.distance}km on ${newDX.freq}MHz!`;
        document.getElementById('dx-alerts').prepend(alert);
        setTimeout(() => alert.remove(), 5000);
    }
};
