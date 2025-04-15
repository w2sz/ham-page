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
            ).getTime();
            
            spots.push({
                time: spot.time_on,
                call: spot.operator || '',
                freq: parseFloat(spot.freq) || 0,
                mode: spot.mode || '',
                grid: spot.my_gridsquare || '',
                distance: spot.distance || '0',
                db: spot.app_pskrep_snr || '0',
                timestamp
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
        flowStartSeconds: spot.flowStartSeconds
    }));
}
