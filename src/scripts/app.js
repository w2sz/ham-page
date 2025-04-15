import { CONFIG } from '../modules/config.js';
import { updateHeaderInfo } from '../modules/ui.js';
import { fetchRBNSpots } from '../modules/spots.js';
import { getRandomQuotes } from '../data/quotes.js';
import { updateBandSummary } from '../modules/bands.js';

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
    fetchRBNSpots().then(spots => {
        if (spots) updateBandSummary(spots);
    });
    setInterval(fetchRBNSpots, CONFIG.display.refreshInterval * 1000);
    initScreenSaver();
    updateQuote();
};

document.addEventListener('DOMContentLoaded', init);