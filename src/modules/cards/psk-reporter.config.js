export const pskReporterConfig = {
    id: 'psk-reporter',
    title: 'PSK Reporter',
    display: {
        itemsPerPage: 15,
        cycleInterval: 10,
        columns: [
            { id: 'call', label: 'CALL', align: 'right' },
            { id: 'freq', label: 'FREQ', align: 'left' },
            { id: 'age', label: 'AGE', align: 'center' },
            { id: 'grid', label: 'GRID', align: 'center', maxDigits: 4 },
            { id: 'distance', label: 'KM/MI', align: 'right', unit: 'km' },
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
