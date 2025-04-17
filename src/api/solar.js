// // src/api/solar.js
// import { CONFIG } from '../config/config.js';

// /**
//  * Status object for tracking solar API requests
//  */
// export const solarStatus = {
//   lastUpdate: null,
//   nextUpdate: null,
//   isLoading: false
// };

// /**
//  * Fetches solar data from hamqsl.com
//  * @returns {Promise<string>} XML-formatted solar data
//  * @throws {Error} If fetch fails
//  */
// export async function fetchSolarData() {
//   solarStatus.isLoading = true;
  
//   try {
//     const solarURL = 'https://www.hamqsl.com/solarxml.php';
    
//     // Try each proxy until one works
//     for (const proxyUrl of CONFIG.proxyUrls) {
//       try {
//         const response = await fetch(proxyUrl + encodeURIComponent(solarURL));
        
//         if (!response.ok) {
//           console.warn(`Proxy ${proxyUrl} returned status ${response.status}`);
//           continue;
//         }
        
//         const data = await response.text();
        
//         // Update status with new fetch time
//         solarStatus.lastUpdate = new Date();
//         solarStatus.nextUpdate = new Date(Date.now() + CONFIG.refreshIntervals.solar * 1000);
        
//         return data;
//       } catch (error) {
//         console.warn(`Proxy ${proxyUrl} failed:`, error);
//         // Continue to next proxy
//       }
//     }
    
//     throw new Error('All proxies failed to fetch solar data');
//   } finally {
//     solarStatus.isLoading = false;
//   }
// }

// /**
//  * Get status HTML for display
//  * @returns {string} Formatted status HTML
//  */
// export function getStatusHTML() {
//   const now = new Date();
//   const remainingSeconds = solarStatus.nextUpdate ? 
//     Math.max(0, Math.floor((solarStatus.nextUpdate - now) / 1000)) : 0;

//   return `
//     <div class="status-text">
//       <span>
//         Solar data fetched<br>
//         Last update ${solarStatus.lastUpdate?.toLocaleTimeString() || 'Never'}, 
//         next in ${remainingSeconds}s
//       </span>
//     </div>
//   `;
// }

// src/api/solar.js
import { CONFIG } from '../config/config.js';

/**
 * Fetches solar data from hamqsl.com
 * @returns {Promise<string>} XML-formatted solar data
 * @throws {Error} If fetch fails
 */
export async function fetchSolarData() {
  const solarURL = 'https://www.hamqsl.com/solarxml.php';
  
  // Try each proxy until one works
  for (const proxyUrl of CONFIG.proxyUrls) {
    try {
      const response = await fetch(proxyUrl + encodeURIComponent(solarURL));
      
      if (!response.ok) {
        console.warn(`Proxy ${proxyUrl} returned status ${response.status}`);
        continue;
      }
      
      return await response.text();
    } catch (error) {
      console.warn(`Proxy ${proxyUrl} failed:`, error);
    }
  }
  
  throw new Error('All proxies failed to fetch solar data');
}