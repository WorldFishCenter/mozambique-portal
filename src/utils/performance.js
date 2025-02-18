import { memo } from 'react';

/**
 * Custom comparison function for React.memo
 * @param {Object} prevProps - Previous props
 * @param {Object} nextProps - Next props
 * @returns {boolean} - Whether component should update
 */
export const arePropsEqual = (prevProps, nextProps) => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) return false;

  return prevKeys.every(key => {
    if (typeof prevProps[key] === 'function' || typeof nextProps[key] === 'function') {
      return true; // Skip function comparison
    }
    return prevProps[key] === nextProps[key];
  });
};

/**
 * HOC to memoize components with custom comparison
 * @template P
 * @param {React.ComponentType<P>} Component - Component to memoize
 * @returns {React.MemoExoticComponent<React.ComponentType<P>>} - Memoized component
 */
export const withMemo = Component => memo(Component, arePropsEqual);

/**
 * Utility to create a debounced function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
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
