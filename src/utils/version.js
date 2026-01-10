import packageJson from '../../package.json';

/**
 * Application version information
 * Version is read from package.json (single source of truth)
 */
export const APP_VERSION = packageJson.version;

/**
 * Get formatted version string
 * @param {string} prefix - Optional prefix (default: 'v')
 * @returns {string} Formatted version string
 */
export const getVersionString = (prefix = 'v') => {
  return `${prefix}${APP_VERSION}`;
};

/**
 * Get version info object
 * @returns {Object} Version information object
 */
export const getVersionInfo = () => {
  return {
    version: APP_VERSION,
    versionString: getVersionString(),
    name: packageJson.name,
  };
};

export default APP_VERSION;

