import { Platform, PlatformConfig } from '../types';
import { chatGptConfig } from './chatgpt';
import { claudeConfig } from './claude';
import { geminiConfig } from './gemini';
import { grokConfig } from './grok';

// Map platforms to their configurations
export const platformConfigs: Record<Platform, PlatformConfig> = {
  [Platform.ChatGPT]: chatGptConfig,
  [Platform.Claude]: claudeConfig,
  [Platform.Gemini]: geminiConfig,
  [Platform.Grok]: grokConfig,
};

// Get the configuration for a specific platform
export function getPlatformConfig(platform: Platform): PlatformConfig {
  return platformConfigs[platform];
}

// Detect the current platform based on URL
export function detectPlatform(): Platform | null {
  const hostname = window.location.hostname;
  
  if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
    return Platform.ChatGPT;
  } else if (hostname.includes('claude.ai')) {
    return Platform.Claude;
  } else if (hostname.includes('gemini.google.com')) {
    return Platform.Gemini;
  } else if (hostname.includes('grok.com') || hostname.includes('x.ai')) {
    return Platform.Grok;
  }
  
  return null;
} 