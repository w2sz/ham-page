export const pskReporterConfig = {
    id: 'psk-reporter',
    title: 'PSK Reporter',
    display: {
        // Maximum number of spots to display in the table
        maxItems: 20,
        cycleInterval: 10,
        showLastUpdate: true,
        columns: [
            { id: 'call', label: 'CALL', align: 'left' },
            { id: 'freq', label: 'FREQ', align: 'right' },
            { id: 'age', label: 'AGE', align: 'center' },
            { id: 'grid', label: 'GRID', align: 'center', maxDigits: 4 },
            { id: 'distance', label: 'DIST', align: 'right', unit: 'km' },
            // Available but hidden columns
            // { id: 'time', label: 'TIME', align: 'left' },
            // { id: 'mode', label: 'MODE', align: 'left' },
            // { id: 'db', label: 'DB', align: 'right' },
            // { id: 'band', label: 'BAND', align: 'left' },
            // { id: 'country', label: 'CTY', align: 'left' },
            // { id: 'continent', label: 'CONT', align: 'center' }
        ]
    }
};
