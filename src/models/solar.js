// src/models/solar.js
import { fetchSolarData } from '../api/solar.js';
import eventService, { Events } from '../services/eventService.js';

class SolarModel {
  constructor() {
    this.solarData = null;
    this.lastUpdate = null;
    this.nextUpdate = null;
    this.isLoading = false;
    this.error = null;
  }

  /**
   * Fetches and processes solar data
   */
  async refreshData() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.error = null;
    
    // Notify UI that loading began
    eventService.publish(Events.SOLAR_UPDATED, { 
      isLoading: true, 
      solarData: this.solarData 
    });
    
    try {
      const xmlText = await fetchSolarData();
      this.solarData = this.parseSolarXML(xmlText);
      
      if (!this.solarData) {
        throw new Error('Failed to parse solar data');
      }
      
      this.lastUpdate = new Date();
      this.nextUpdate = new Date(Date.now() + 3600000); // 1 hour
      
      // Success! Publish the updated data
      eventService.publish(Events.SOLAR_UPDATED, {
        isLoading: false,
        solarData: this.solarData,
        lastUpdate: this.lastUpdate,
        nextUpdate: this.nextUpdate
      });
      
    } catch (error) {
      console.error('Error fetching solar data:', error);
      this.error = error.message;
      
      // Publish error state
      eventService.publish(Events.SOLAR_UPDATED, {
        isLoading: false,
        error: this.error,
        solarData: this.solarData
      });
      
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Parse solar XML data into a structured object
   * @param {string} xmlText - XML data from hamqsl.com
   * @returns {Object|null} Parsed solar data or null if parsing failed
   */
  parseSolarXML(xmlText) {
    if (!xmlText) return null;
    
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      
      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        console.error('XML parsing error:', parseError);
        return null;
      }

      const getNodeValue = (nodeName) => {
        const node = xmlDoc.getElementsByTagName(nodeName)[0];
        return node ? node.textContent.trim() : null;
      };

      const getBandConditions = () => {
        const bands = {};
        const bandNodes = xmlDoc.querySelectorAll('calculatedconditions band');
        
        bandNodes.forEach(node => {
          const name = node.getAttribute('name');
          const time = node.getAttribute('time');
          const condition = node.textContent.trim();
          
          if (!bands[time]) bands[time] = {};
          bands[time][name] = condition;
        });
        
        return bands;
      };

      const getVHFConditions = () => {
        const conditions = {};
        const vhfNodes = xmlDoc.querySelectorAll('calculatedvhfconditions phenomenon');
        
        vhfNodes.forEach(node => {
          const name = node.getAttribute('name');
          const location = node.getAttribute('location');
          const status = node.textContent.trim();
          
          if (!conditions[name]) conditions[name] = {};
          conditions[name][location] = status;
        });
        
        return conditions;
      };
      
      const solarData = {
        source: getNodeValue('source'),
        updated: getNodeValue('updated'),
        updatedFormatted: this.formatSolarDate(getNodeValue('updated')),
        solarFlux: getNodeValue('solarflux'),
        aIndex: getNodeValue('aindex'),
        kIndex: getNodeValue('kindex'),
        kIndexNT: getNodeValue('kindexnt'),
        xRay: getNodeValue('xray'),
        sunspots: getNodeValue('sunspots'),
        heliumLine: getNodeValue('heliumline'),
        protonFlux: getNodeValue('protonflux'),
        electronFlux: getNodeValue('electonflux'),
        aurora: getNodeValue('aurora'),
        normalization: getNodeValue('normalization'),
        latDegree: getNodeValue('latdegree'),
        solarWind: getNodeValue('solarwind'),
        magneticField: getNodeValue('magneticfield'),
        geomagField: getNodeValue('geomagfield'),
        signalNoise: getNodeValue('signalnoise'),
        fof2: getNodeValue('fof2'),
        mufFactor: getNodeValue('muffactor'),
        muf: getNodeValue('muf'),
        bandConditions: getBandConditions(),
        vhfConditions: getVHFConditions(),
        overallCondition: null
      };
      
      // Determine overall condition from band data
      solarData.overallCondition = this.determineOverallCondition(solarData.bandConditions);
      
      return solarData;
    } catch (error) {
      console.error('Error parsing solar XML:', error);
      return null;
    }
  }

  /**
   * Format solar date string for display
   * @param {string} dateString - Date string from solar XML
   * @returns {string} Formatted date string
   */
  formatSolarDate(dateString) {
    if (!dateString) return '';
    
    try {
      // Example input: "17 Apr 2023 0430 GMT"
      const parts = dateString.trim().split(' ');
      if (parts.length < 4) return dateString;
      
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      const time = parts[3].replace(/(\d{2})(\d{2})/, '$1:$2');
      const zone = parts[4] || 'GMT';
      
      return `${day} ${month} ${year} ${time} ${zone}`;
    } catch (error) {
      console.error('Error formatting solar date:', error);
      return dateString;
    }
  }

  /**
   * Determine overall HF condition based on band conditions
   * @param {Object} bandConditions - Band conditions from solar data
   * @returns {string} Overall condition description
   */
  determineOverallCondition(bandConditions) {
    if (!bandConditions || (!bandConditions.day && !bandConditions.night)) {
      return 'Unknown';
    }
    
    // Count occurrences of each condition
    const conditionCounts = {};
    const timeOfDay = new Date().getHours() >= 6 && new Date().getHours() < 18 ? 'day' : 'night';
    const relevantConditions = bandConditions[timeOfDay] || {};
    
    Object.values(relevantConditions).forEach(condition => {
      conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
    });
    
    // Find the most common condition
    let maxCount = 0;
    let mostCommonCondition = 'Unknown';
    
    for (const [condition, count] of Object.entries(conditionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonCondition = condition;
      }
    }
    
    return mostCommonCondition;
  }

  /**
   * Get status information for display
   * @returns {Object} Status information
   */
  getStatus() {
    const now = new Date();
    const remainingSeconds = this.nextUpdate ? 
      Math.max(0, Math.floor((this.nextUpdate - now) / 1000)) : 0;

    return {
      solarData: this.solarData,
      lastUpdate: this.lastUpdate,
      nextUpdate: this.nextUpdate,
      remainingSeconds,
      isLoading: this.isLoading,
      error: this.error
    };
  }
}

// Export a singleton instance
export default new SolarModel();