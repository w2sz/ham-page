export const setAccentColor = (hue, saturation = 100, lightness = 50) => {
    const root = document.documentElement;
    root.style.setProperty('--accent-hue', hue);
    root.style.setProperty('--accent-saturation', `${saturation}%`);
    root.style.setProperty('--accent-lightness', `${lightness}%`);
};

export const PRESET_COLORS = {
    GOLD: { hue: 51, saturation: 100, lightness: 50 },
    BLUE: { hue: 210, saturation: 100, lightness: 50 },
    GREEN: { hue: 120, saturation: 70, lightness: 45 },
    RED: { hue: 0, saturation: 100, lightness: 50 }
};
