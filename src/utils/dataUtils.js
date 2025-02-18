// Memoized data generator with performance optimizations
export const generateTimeSeriesData = (() => {
  const cache = new Map();

  return (days = 30, baseValue = 100, volatility = 0.2) => {
    const cacheKey = `${days}-${baseValue}-${volatility}`;

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const data = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      const value = baseValue + baseValue * volatility * (Math.random() - 0.5);
      return {
        x: date.getTime(),
        y: Math.round(value),
      };
    });

    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    cache.set(cacheKey, data);
    return data;
  };
})();

// Format numbers with appropriate units (K, M, B)
export const formatNumber = number => {
  if (number >= 1000000000) {
    return (number / 1000000000).toFixed(1) + 'B';
  }
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  }
  if (number >= 1000) {
    return (number / 1000).toFixed(1) + 'K';
  }
  return number.toString();
};

// Format currency values
export const formatCurrency = (value, currency = 'MT') => {
  return new Intl.NumberFormat('en-MZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Debounce function for performance optimization
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
