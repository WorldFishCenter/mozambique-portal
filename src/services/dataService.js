// Import static data
import monthlyMetrics from '../data/monthly-metrics.json';
import gearHabitatMetrics from '../data/gear-habitat-metrics.json';
import taxaProportions from '../data/taxa-proportions.json';
import effortMapData from '../data/effort-map.json';
import taxaLength from '../data/taxa-length.json';
import { LANDING_SITES } from '../constants/landingSites';

// Cache configuration with memory limits
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Maximum number of items in cache
const cache = new Map();

// Enhanced cache helper with memory management
const withCache = (key, fetchFn) => {
  try {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Clear old cache entries if we hit the size limit
    if (cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = Array.from(cache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      )[0][0];
      cache.delete(oldestKey);
    }

    const data = fetchFn();
    if (data !== undefined && data !== null) {
      cache.set(key, {
        timestamp: Date.now(),
        data,
      });
    }

    return data;
  } catch (error) {
    console.error(`Cache error for key ${key}:`, error);
    // Attempt to return stale cache data if available
    const staleData = cache.get(key);
    if (staleData) {
      console.warn(`Returning stale data for key ${key}`);
      return staleData.data;
    }
    throw error;
  }
};

// Filter metrics data by type
const filterMetricsByType = (data, metricType) => {
  return data.filter(record => record.type !== 'metadata' && record.metric === metricType);
};

// Fetch catch data for landing sites
export const getCatchData = async selectedLandingSite => {
  try {
    const data = withCache(`catch-${selectedLandingSite}`, () => {
      // Get data for all individual sites
      const allSitesData = LANDING_SITES.map(site => ({
        site,
        data: processSingleSiteData(monthlyMetrics, site, 'median_cpue'),
      }));

      // Get aggregated data if 'all' is selected
      const selectedData =
        selectedLandingSite === 'all'
          ? processAllSitesData(monthlyMetrics, 'median_cpue')
          : allSitesData.find(d => d.site === selectedLandingSite)?.data || [];

      return {
        selectedData,
        allSitesData,
      };
    });

    return data;
  } catch (error) {
    console.error('Error processing catch data:', error);
    throw new Error(`Failed to process catch data: ${error.message}`);
  }
};

// Fetch revenue data for landing sites
export const getRevenueData = async selectedLandingSite => {
  try {
    const data = withCache(`revenue-${selectedLandingSite}`, () => {
      // Get data for all individual sites
      const allSitesData = LANDING_SITES.map(site => ({
        site,
        data: processSingleSiteData(monthlyMetrics, site, 'median_rpue'),
      }));

      // Get aggregated data if 'all' is selected
      const selectedData =
        selectedLandingSite === 'all'
          ? processAllSitesData(monthlyMetrics, 'median_rpue')
          : allSitesData.find(d => d.site === selectedLandingSite)?.data || [];

      return {
        selectedData,
        allSitesData,
      };
    });

    return data;
  } catch (error) {
    console.error('Error processing revenue data:', error);
    throw new Error(`Failed to process revenue data: ${error.message}`);
  }
};

// Enhanced error handling for all sites data processing
const processAllSitesData = (data, metricType) => {
  if (!data || !Array.isArray(data)) {
    console.error('Invalid data provided to processAllSitesData');
    return [];
  }

  try {
    const filteredData = filterMetricsByType(data, metricType);
    const combinedData = new Map();

    filteredData.forEach(record => {
      if (!record.date) return;

      const date = new Date(record.date);
      const timestamp = date.getTime();
      if (isNaN(timestamp)) {
        console.warn('Invalid date found:', record.date);
        return;
      }

      if (!combinedData.has(timestamp)) {
        combinedData.set(timestamp, {
          x: timestamp,
          total: 0,
          count: 0,
        });
      }

      const combined = combinedData.get(timestamp);
      if (
        record.hasOwnProperty('value') &&
        record.value !== null &&
        record.value !== undefined &&
        !isNaN(record.value) &&
        record.n > 0
      ) {
        combined.total += Number(record.value);
        combined.count++;
      }
    });

    return Array.from(combinedData.values())
      .map(record => ({
        x: record.x,
        y: record.count > 0 ? Number((record.total / record.count).toFixed(2)) : null,
      }))
      .sort((a, b) => a.x - b.x);
  } catch (error) {
    console.error('Error processing all sites data:', error);
    return [];
  }
};

// Enhanced error handling for data processing
const processSingleSiteData = (data, landingSite, metricType) => {
  if (!data || !Array.isArray(data)) {
    console.error('Invalid data provided to processSingleSiteData');
    return [];
  }

  try {
    return filterMetricsByType(data, metricType)
      .filter(record => record.district?.toLowerCase() === landingSite.toLowerCase())
      .map(record => {
        const date = new Date(record.date);
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date found for landing site ${landingSite}:`, record.date);
          return null;
        }
        return {
          x: date.getTime(),
          y: !record.hasOwnProperty('value') ||
             record.value === null ||
             record.value === undefined ||
             record.n === 0
            ? null
            : Number(record.value),
        };
      })
      .filter(record => record !== null)
      .sort((a, b) => a.x - b.x);
  } catch (error) {
    console.error(`Error processing data for landing site ${landingSite}:`, error);
    return [];
  }
};

// Get district data
export const getDistrictData = landingSite => {
  const metrics = filterMetricsByType(monthlyMetrics, 'median_cpue').filter(
    record => record.district?.toLowerCase() === landingSite.toLowerCase()
  );

  const stats = {
    avgValue: metrics.reduce((sum, record) => sum + (record.value || 0), 0) / (metrics.length || 1),
    count: metrics.length,
  };

  return {
    id: landingSite,
    label: landingSite.charAt(0).toUpperCase() + landingSite.slice(1).replace('_', ' '),
    bounds: [39.1977, -6.1659], // Default to Zanzibar center coordinates
    stats,
  };
};

// Get gear metrics data
export const getGearMetrics = () => {
  return gearHabitatMetrics;
};

// Get taxa proportions data
export const getTaxaProportions = () => {
  return taxaProportions;
};

// Get effort map data
export const getEffortMapData = () => {
  return effortMapData;
};

// Get taxa length data
export const getTaxaLength = () => {
  return taxaLength;
};
