import { Platform } from '../types';

/**
 * Configuration indicating which platforms are currently supported by the extension.
 * When adding support for a new platform, simply change its value to true here.
 */
export const SUPPORTED_PLATFORMS: Record<Platform, boolean> = {
  [Platform.ChatGPT]: true,  // ChatGPT is currently fully supported
  [Platform.Claude]: false,  // Claude support coming soon
  [Platform.Gemini]: false,  // Gemini support coming soon
  [Platform.Grok]: false,    // Grok support coming soon
};

/**
 * Display names for each platform, used in the UI
 */
export const PLATFORM_DISPLAY_NAMES: Record<Platform, string> = {
  [Platform.ChatGPT]: 'ChatGPT',
  [Platform.Claude]: 'Claude',
  [Platform.Gemini]: 'Gemini',
  [Platform.Grok]: 'Grok',
};

/**
 * Checks if a platform is currently supported by the extension
 */
export function isPlatformSupported(platform: Platform | null): boolean {
  if (!platform) return false;
  return SUPPORTED_PLATFORMS[platform];
} 