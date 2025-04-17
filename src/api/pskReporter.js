// src/api/pskReporter.js
import { CONFIG } from '../config/config.js';

/**
 * Fetches PSK Reporter data
 * @returns {Promise<string>} ADIF-formatted spot data
 * @throws {Error} If fetch fails
 */
export async function fetchPskReporterData() {
  const params = new URLSearchParams({
    ...CONFIG.pskReporter.params,
    callsign: CONFIG.station.callsign
  });
  
  const pskURL = `${CONFIG.pskReporter.baseUrl}${CONFIG.pskReporter.queryPath}?${params}`;
  
  // Try each proxy until one works
  for (const proxyUrl of CONFIG.proxyUrls) {
    try {
      const response = await fetch(proxyUrl + encodeURIComponent(pskURL));
      
      if (!response.ok) {
        console.warn(`Proxy ${proxyUrl} returned status ${response.status}`);
        continue;
      }
      
      return await response.text();
    } catch (error) {
      console.warn(`Proxy ${proxyUrl} failed:`, error);
    }
  }
  
  throw new Error('All proxies failed to fetch PSK Reporter data');
}

