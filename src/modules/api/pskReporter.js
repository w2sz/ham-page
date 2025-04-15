import { CONFIG } from '../config.js';

export const spotStatus = {
    lastUpdate: null,
    nextUpdate: null,
    totalSpots: 0,
    isLoading: false
};

export async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

export async function fetchSpotData() {
    spotStatus.isLoading = true;
    
    try {
        const params = new URLSearchParams({
            ...CONFIG.pskReporter.params,
            callsign: CONFIG.station.callsign
        });
        
        const pskURL = `${CONFIG.pskReporter.baseUrl}${CONFIG.pskReporter.queryPath}?${params}`;
        
        for (const proxyUrl of CONFIG.proxyUrls) {
            try {
                const response = await fetch(proxyUrl + encodeURIComponent(pskURL));
                if (!response.ok) continue;
                const data = await response.text();
                
                // Update status with new fetch time
                spotStatus.lastUpdate = new Date();
                spotStatus.nextUpdate = new Date(Date.now() + CONFIG.display.refreshInterval * 1000);
                
                // Count the spots by looking for QSO records
                spotStatus.totalSpots = (data.match(/<qso_date/gi) || []).length;
                
                return data;
            } catch (error) {
                console.warn(`Proxy ${proxyUrl} failed:`, error);
                continue;
            }
        }
        throw new Error('All proxies failed');
    } finally {
        spotStatus.isLoading = false;
    }
}

export function getStatusHTML() {
    const now = new Date();
    const remainingSeconds = spotStatus.nextUpdate ? 
        Math.max(0, Math.floor((spotStatus.nextUpdate - now) / 1000)) : 0;

    return `
        <div class="status-text">
            <span>Total spots: ${spotStatus.totalSpots}</span>
            <span class="divider">|</span>
            <span>Last update: ${spotStatus.lastUpdate?.toLocaleTimeString() || 'Never'}</span>
            <span class="divider">|</span>
            <span>Next update in: ${remainingSeconds}s</span>
        </div>
    `;
}
