import { formatTime, formatGrid, formatAge } from '../utils/formatters.js';

export const spotCache = {
    receptionReport: [],
    lastUpdate: 0
};

export function parseADIF(adifText) {
    if (!adifText) return [];
    
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
        
        if (spot.qso_date && spot.time_on && spot.freq) {
            const timestamp = new Date(
                spot.qso_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') + 
                'T' + 
                spot.time_on.replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3') + 
                'Z'
            ).getTime() / 1000;

            // Format data at parse time
            spots.push({
                timestamp: timestamp,
                time: formatTime(new Date(timestamp * 1000), true),
                call: spot.operator?.toUpperCase() || '',
                freq: parseFloat(spot.freq).toFixed(3),
                mode: spot.mode || '',
                grid: formatGrid(spot.my_gridsquare || '', { maxDigits: 4 }),
                db: spot.app_pskrep_snr ? `${spot.app_pskrep_snr}` : '?',
                distance: spot.distance ? `${Math.round(parseFloat(spot.distance))}` : '?',
                age: formatAge(timestamp)  // Add formatted age
            });
        }
    }
    
    return spots;
}

export function processSpotData(data) {
    if (!data || !Array.isArray(data.receptionReport)) {
        console.warn('Invalid spot data received:', data);
        return [];
    }

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
    
    return formatSpots(spotCache.receptionReport);
}

function formatSpots(spots) {
    return spots.map(spot => ({
        time: new Date(spot.flowStartSeconds * 1000).toUTCString().split(' ')[4] + 'z',
        freq: spot.frequency.toFixed(3),
        call: spot.receiverCallsign,
        mode: spot.mode,
        db: spot.sNR,
        grid: spot.receiverLocator,
        distance: Math.round(parseFloat(spot.distance)),
        flowStartSeconds: spot.flowStartSeconds,
        timestamp: spot.timestamp || Date.now() / 1000  // Ensure timestamp is available
    }));
}
