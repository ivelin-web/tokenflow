// Constants for the extension
export const DEBUG_ENABLED = process.env.NODE_ENV !== 'production';

// Debug logger that automatically detects dev/prod environment  
export const debugLog = (...args: any[]) => {
  if (DEBUG_ENABLED) {
    console.debug('TokenFlow:', ...args);
  }
};

// Extension metadata
export const EXTENSION_CONFIG = {
  NAME: 'TokenFlow',
  VERSION: '1.0.0',
  UPDATE_INTERVAL: 1000, // ms
  DEBOUNCE_DELAY: 500, // ms
  MODEL_CHECK_INTERVAL_MS: 1000,
  UI_UPDATE_COOLDOWN_MS: 500,
  SYNC_STORAGE_DELAY_MS: 2000,
  MAX_Z_INDEX: 2147483647,
} as const; 
