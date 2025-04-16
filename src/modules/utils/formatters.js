export const formatDate = (date) => date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

export const formatTime = (date, useUTC = false) => {
    const options = {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    
    if (useUTC) {
        return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}:${String(date.getUTCSeconds()).padStart(2, '0')}`;
    }
    
    return date.toLocaleTimeString('en-US', options);
};

export const formatAge = (timestamp) => {
    if (!timestamp) {
        console.error('Missing timestamp for age calculation');
        return '';
    }
    
    const now = Math.floor(Date.now() / 1000);
    // Convert string timestamp to number if needed
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    const diff = now - ts;
    
    if (isNaN(diff)) return '';
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
};

export const formatDistance = (km) => {
    const distance = parseFloat(km);
    if (isNaN(distance)) return '';
    return Math.round(distance).toString();
};

export const formatGrid = (grid, columnConfig) => {
    if (!grid) return '';
    // Default to 4 characters if not specified
    const maxDigits = columnConfig?.maxDigits || 4;
    // Ensure grid is uppercase and padded to maxDigits
    return grid.toUpperCase().padEnd(maxDigits, ' ').substring(0, maxDigits);
};
