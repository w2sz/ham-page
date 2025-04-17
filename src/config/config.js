// src/config/config.js
import { REFRESH_INTERVALS, THEME_COLORS } from './constants.js';

/**
 * Application configuration
 */
export const CONFIG = {
    station: {
        callsign: "W2SZ",
        gridsquare: "FN32",
        operator: "KD2TAI"
    },
    display: {
        refreshInterval: 300,
        timeFormat: 'UTC',
        dxThreshold: 5000,
        screenSaverDelay: 300,
        theme: {
            accent: THEME_COLORS.ACCENT_COLORS.GOLD,
            fontSize: {
                base: 'clamp(0.8rem, 1.2vw, 1.6rem)',
                large: 'clamp(1rem, 1.5vw, 2rem)',
                small: 'clamp(0.7rem, 1vw, 1.4rem)'
            },
            spacing: {
                sm: 'clamp(0.5rem, 1vw, 1rem)',
                md: 'clamp(1rem, 1.5vw, 2rem)',
                lg: 'clamp(1.5rem, 2vw, 3rem)'
            }
        },
        quotes: {
            updateInterval: 30,
            fadeTime: 500
        },
        layout: {
            slots: 4,
            grid: {
                cards: {
                    'psk-reporter': { slot: 1, height: 'full' },
                    'band-summary': { slot: 2, height: 'full' },
                    'solar-data': { slot: 3, height: 'full' }
                }
            }
        }
    },
    refreshIntervals: {
        pskReporter: REFRESH_INTERVALS.MEDIUM,  // 5 minutes
        solar: REFRESH_INTERVALS.VERY_SLOW,     // 1 hour
        bandSummary: REFRESH_INTERVALS.MEDIUM,  // 5 minutes
        quotes: REFRESH_INTERVALS.FAST          // 30 seconds
    },
    cards: {
        pskReporter: {
            id: 'psk-reporter',
            title: 'Spotter Network',
            display: {
                showLastUpdate: true,
                columns: [
                    { id: 'call', label: 'CALL', align: 'left', visible: true },
                    { id: 'time', label: 'TIME', align: 'left', visible: false },
                    { id: 'freq', label: 'FREQ', align: 'right', visible: true },
                    { id: 'mode', label: 'MODE', align: 'right', visible: true },
                    { id: 'grid', label: 'GRID', align: 'right', maxDigits: 4, visible: true },
                    { id: 'db', label: 'DB', align: 'right', visible: false }, // Hidden by default
                    { id: 'distance', label: 'DIST', align: 'right', unit: 'km', visible: true },
                    { id: 'age', label: 'AGE', align: 'right', visible: true }
                ]
            }
        },
        bandSummary: {
            id: 'band-summary',
            title: 'Band Activity Summary',
            display: {
                showLastUpdate: true,
                columns: [
                    { id: 'band', label: 'BAND', align: 'left' },
                    // { id: 'activityStars', label: 'ACTIVITY', align: 'center' },
                    { id: 'count', label: 'SPOTS', align: 'right' },
                    { id: 'maxSignal', label: 'BEST DB', align: 'right', 
                      formatter: (val) => val > -999 ? `${val} dB` : 'N/A' }
                ]
            }
        },
        solarData: {
            id: 'solar-data',
            title: 'Solar Data',
            display: {
                showLastUpdate: true
            }
        }
    },
    pskReporter: {
        baseUrl: 'https://pskreporter.info/cgi-bin',
        queryPath: '/pskdata.pl',
        params: {
            adif: 1,
            days: 1
        }
    },
    proxyUrls: [
        'https://api.allorigins.win/raw?url='
    ]
};

/**
 * Initialize theme CSS variables
 */
export function initTheme() {
    const root = document.documentElement;
    const { theme } = CONFIG.display;
    
    root.style.setProperty('--accent-hue', theme.accent.hue);
    root.style.setProperty('--accent-saturation', `${theme.accent.saturation}%`);
    root.style.setProperty('--accent-lightness', `${theme.accent.lightness}%`);
    
    root.style.setProperty('--font-size-base', theme.fontSize.base);
    root.style.setProperty('--font-size-large', theme.fontSize.large);
    root.style.setProperty('--font-size-small', theme.fontSize.small);
    
    root.style.setProperty('--spacing-sm', theme.spacing.sm);
    root.style.setProperty('--spacing-md', theme.spacing.md);
    root.style.setProperty('--spacing-lg', theme.spacing.lg);
}
