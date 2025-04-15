import { CONFIG } from './config.js';
import { getBandName } from './bands.js';
import { updateTable, showLoading, showError, checkForDX } from './ui.js';
import { updateBandSummary } from './bands.js';
import { pskReporterConfig } from './cards/psk-reporter.config.js';

export const spotCache = {
    receptionReport: [],
    lastUpdate: 0
};

export const parseADIF = (adifText) => {
    console.log('Starting ADIF parse...');
    const spots = [];
    const records = adifText.split('<eor>');
    
    for (const record of records) {
        if (!record.trim()) continue;
        
        const spot = {};
        const matches = record.matchAll(/<(\w+)(?::\d+(?::[A-Z])?)?>(.*?)(?=<|$)/g);
        
        for (const match of matches) {
            const [, field, value] = match;
            spot[field.toLowerCase()] = value;
        }
        
        if (!spot.qso_date || !spot.time_on || !spot.freq || 
            !spot.operator || !spot.my_gridsquare || !spot.mode) {
            continue;
        }

        try {
            const timestamp = new Date(
                spot.qso_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') + 
                'T' + 
                spot.time_on.replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3') + 
                'Z'
            ).getTime() / 1000;

            if (isNaN(timestamp)) continue;

            const freqMHz = parseFloat(spot.freq);
            if (isNaN(freqMHz)) continue;
            
            spots.push({
                flowStartSeconds: timestamp,
                frequency: freqMHz,
                receiverCallsign: spot.operator,
                receiverLocator: spot.my_gridsquare,
                mode: spot.mode,
                sNR: spot.app_pskrep_snr || '0',
                distance: spot.distance || '0'
            });
        } catch (error) {
            console.warn('Error processing spot:', error, spot);
        }
    }
    
    return { receptionReport: spots };
};

export const extractSpotData = (data) => {
    if (!data.receptionReport) return [];
    
    const newSpots = data.receptionReport.filter(report => {
        return !spotCache.receptionReport.some(
            cached => cached.flowStartSeconds === report.flowStartSeconds 
            && cached.receiverCallsign === report.receiverCallsign
        );
    });
    
    spotCache.receptionReport.push(...newSpots);
    spotCache.lastUpdate = Date.now();
    
    const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
    spotCache.receptionReport = spotCache.receptionReport
        .filter(spot => spot.flowStartSeconds > oneDayAgo)
        .sort((a, b) => b.flowStartSeconds - a.flowStartSeconds);
    
    return spotCache.receptionReport.map(spot => {
        const processed = {
            time: new Date(spot.flowStartSeconds * 1000).toUTCString().split(' ')[4] + 'z',
            freq: spot.frequency.toFixed(3),
            call: spot.receiverCallsign,
            mode: spot.mode,
            db: spot.sNR,
            grid: spot.receiverLocator,
            distance: Math.round(parseFloat(spot.distance)),
            flowStartSeconds: spot.flowStartSeconds
        };
        return processed;
    });
};

const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
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
};

export const fetchRBNSpots = async () => {
    console.log('Starting spot fetch...');
    showLoading();
    
    try {
        const params = new URLSearchParams({
            ...CONFIG.pskReporter.params,
            callsign: CONFIG.station.callsign
        });
        
        const pskURL = `${CONFIG.pskReporter.baseUrl}${CONFIG.pskReporter.queryPath}?${params}`;
        
        for (const proxyUrl of CONFIG.proxyUrls) {
            try {
                const response = await fetchWithTimeout(proxyUrl + encodeURIComponent(pskURL));
                if (!response.ok) continue;
                
                const text = await response.text();
                const data = parseADIF(text);
                const spots = extractSpotData(data);
                
                if (spots?.length > 0) {
                    updateTable(spots);
                    updateBandSummary(spots);
                    checkForDX(spots);
                    return spots;
                }
            } catch (error) {
                console.error(`Error with proxy ${proxyUrl}:`, error);
                continue;
            }
        }
        
        throw new Error('No successful response from any proxy');
    } catch (error) {
        console.error('Failed to fetch spots:', error);
        showError('Could not load spots from PSK Reporter. Please try again later.');
        return null;
    }
};
