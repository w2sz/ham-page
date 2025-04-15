import { CONFIG } from '../modules/config.js';
import { updateHeaderInfo } from '../modules/ui.js';
import { fetchSpotData } from '../modules/api/pskReporter.js';
import { parseADIF } from '../modules/data/pskReporter.js';
import { PagedTable } from '../modules/components/PagedTable.js';
import { getRandomQuotes } from '../data/quotes.js';
import { updateBandSummary } from '../modules/bands.js';
import { spotStatus, getStatusHTML } from '../modules/api/pskReporter.js';

let spotTable = null;

async function updateSpots() {
    if (!spotTable) return;
    
    try {
        spotTable.setLoading(true);
        const adifText = await fetchSpotData();
        
        if (!adifText) {
            throw new Error('No data received');
        }
        
        const spots = parseADIF(adifText)
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(spot => ({
                ...spot,
                freq: parseFloat(spot.freq).toFixed(3),
                distance: Math.round(parseFloat(spot.distance)),
                time: spot.time.replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3')
            }));
            
        spotTable.setData(spots);
        
    } catch (error) {
        console.error('Failed to update spots:', error);
        spotTable.setData([]);
    } finally {
        spotTable.setLoading(false);
    }
}

const initScreenSaver = () => {
    let timeout;
    const resetTimer = () => {
        clearTimeout(timeout);
        document.body.classList.remove('screen-saver-active');
        timeout = setTimeout(() => {
            document.body.classList.add('screen-saver-active');
        }, CONFIG.display.screenSaverDelay * 1000);
    };

    document.addEventListener('mousemove', resetTimer);
    resetTimer();
};

const updateQuote = async () => {
    const quoteElement = document.getElementById('quote');
    if (!quoteElement) return;
    
    const [quote] = getRandomQuotes(1);
    quoteElement.innerHTML = `"${quote.text}" - ${quote.author}`;
};

const initLayout = () => {
    const root = document.documentElement;
    root.style.setProperty('--grid-slots', CONFIG.display.layout.slots);

    const cardLayouts = CONFIG.display.layout.grid.cards;
    
    Object.entries(cardLayouts).forEach(([cardId, layout]) => {
        const card = document.getElementById(cardId);
        if (card) {
            card.style.gridColumn = layout.slot;
            card.dataset.height = layout.height;
        }
    });
};

const init = () => {
    initLayout();
    updateHeaderInfo();
    setInterval(updateHeaderInfo, 1000);

    // Initialize spot table
    spotTable = new PagedTable('qso-list', {
        pageSize: 20,
        columns: CONFIG.cards.pskReporter.display.columns,
        statusProvider: getStatusHTML,
        autoCycle: true
    });
    
    // Start data updates
    updateSpots();
    setInterval(updateSpots, CONFIG.display.refreshInterval * 1000);
    
    initScreenSaver();
    updateQuote();
    setInterval(updateQuote, CONFIG.display.quotes.updateInterval * 1000);
};

document.addEventListener('DOMContentLoaded', init);