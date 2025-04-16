import { formatAge, formatGrid, formatDistance, formatTime } from './formatters.js';

const formatters = {
    time: (val) => val.replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3'),
    freq: (val) => parseFloat(val).toFixed(3),
    grid: (val, config) => formatGrid(val, config),
    distance: (val) => formatDistance(val),
    db: (val) => `${val}dB`,
    age: (val, _, data) => formatAge(data.timestamp)
};

export const formatCell = (cardId, colId, data, colConfig) => {
    // Use column format if specified
    if (colConfig.format && formatters[colConfig.format]) {
        return formatters[colConfig.format](data[colId], colConfig, data);
    }
    
    // Fallback to raw value
    return data[colId] || '';
};

export const getColumnHeader = (col) => {
    if (col.id === 'distance') {
        return `DIST ${col.unit.toUpperCase()}`;
    }
    return col.label;
};
