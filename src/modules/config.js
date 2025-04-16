export const CONFIG = {
    station: {
        callsign: "W1AW",
        gridsquare: "FN32",
        operator: "KD2TAI"
    },
    display: {
        refreshInterval: 300,
        timeFormat: 'UTC',
        dxThreshold: 5000,
        screenSaverDelay: 300,
        theme: {
            accent: {
                hue: 51,
                saturation: 100,
                lightness: 50
            },
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
                    'band-summary': { slot: 2, height: 'full' }
                }
            }
        }
    },
    refreshIntervals: {
        pskReporter: 300,  // 5 minutes
        bandSummary: 300,  // 5 minutes
        quotes: 30         // 30 seconds
    },
    cards: {
        pskReporter: {
            id: 'psk-reporter',
            title: 'PSK Reporter',
            display: {
                showLastUpdate: true,
                columns: [
                    { id: 'call', label: 'CALL', align: 'left', visible: true },
                    { id: 'time', label: 'TIME', align: 'left', visible: false },
                    { id: 'freq', label: 'FREQ', align: 'right', visible: true },
                    { id: 'mode', label: 'MODE', align: 'center', visible: true },
                    { id: 'grid', label: 'GRID', align: 'center', maxDigits: 4, visible: true },
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
                    { id: 'freq', label: 'FREQ', align: 'right' },
                    { id: 'activity', label: 'ACT', align: 'center' },
                    { id: 'spots', label: 'SPOTS', align: 'right' }
                ]
            }
        }
    },
    bands: [
        { name: '160m', min: 1.8, max: 2.0 },
        { name: '80m', min: 3.5, max: 4.0 },
        { name: '40m', min: 7.0, max: 7.3 },
        { name: '30m', min: 10.1, max: 10.15 },
        { name: '20m', min: 14.0, max: 14.35 },
        { name: '17m', min: 18.068, max: 18.168 },
        { name: '15m', min: 21.0, max: 21.45 },
        { name: '12m', min: 24.89, max: 24.99 },
        { name: '10m', min: 28.0, max: 29.7 },
        { name: '6m', min: 50.0, max: 54.0 },
        { name: '2m', min: 144.0, max: 148.0 },
        { name: '70cm', min: 420.0, max: 450.0 }
    ],
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

// Helper function to initialize theme CSS variables
export const initTheme = () => {
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
};
