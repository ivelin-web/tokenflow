import { Platform, PlatformConfig, TokenizerType } from '../types';

// Stub config for Gemini - will be implemented in future releases
export const geminiConfig: PlatformConfig = {
  platform: Platform.Gemini,
  models: {
    'gemini-2.5-flash': {
      name: '2.5 Flash',
      maxTokens: 1000000,
      tokenizerType: TokenizerType.Gemini,
    },
    'gemini-2.5-pro-preview': {
      name: '2.5 Pro (preview)',
      maxTokens: 1000000,
      tokenizerType: TokenizerType.Gemini,
    },
  },
  conversationSelector: '', // Will be filled when implemented
  modelSelector: '',        // Will be filled when implemented
  defaultModel: 'gemini-2.5-flash',
  modelPatterns: [
    { text: '2.5 Flash', model: 'gemini-2.5-flash' },
    { text: '2.5 Pro (preview)', model: 'gemini-2.5-pro-preview' },
  ],
}; 