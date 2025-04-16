export const BAND_RANGES = [
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
];

export const getBandName = (freqMHz) => {
    const band = BAND_RANGES.find(b => freqMHz >= b.min && freqMHz <= b.max);
    return band ? band.name : 'Unknown';
};

export const updateBandSummary = async (spots) => {
    const bandSummaryElement = document.getElementById('band-summary');
    if (!bandSummaryElement || !spots?.length) return;

    const bands = spots.reduce((acc, spot) => {
        const freq = parseFloat(spot.freq);
        const band = getBandName(freq);
        if (!acc[band]) {
            acc[band] = { count: 0, maxSignal: -999 };
        }
        acc[band].count++;
        acc[band].maxSignal = Math.max(acc[band].maxSignal, parseInt(spot.db) || 0);
        return acc;
    }, {});

    const summaryHTML = `
        <table class="paged-table">
            <thead>
                <tr>
                    <th>Band</th>
                    <th>Spots</th>
                    <th>Best Signal</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(bands)
                    .filter(([band]) => band !== 'Unknown')
                    .sort((a, b) => {
                        const bandA = BAND_RANGES.find(r => r.name === a[0]);
                        const bandB = BAND_RANGES.find(r => r.name === b[0]);
                        return (bandA?.min || 0) - (bandB?.min || 0);
                    })
                    .map(([band, data]) => `
                        <tr>
                            <td>${band}</td>
                            <td>${data.count}</td>
                            <td>${data.maxSignal} dB</td>
                        </tr>
                    `).join('')}
            </tbody>
        </table>
    `;

    bandSummaryElement.innerHTML = summaryHTML || '<div>No active bands</div>';
};
