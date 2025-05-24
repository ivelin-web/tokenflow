import { Platform, PlatformConfig, TokenizerType } from '../types';

// Stub config for Grok - will be implemented in future releases
export const grokConfig: PlatformConfig = {
  platform: Platform.Grok,
  models: {
    'grok-3': {
      name: 'Grok 3',
      maxTokens: 128000,
      tokenizerType: TokenizerType.Grok,
    },
  },
  conversationSelector: '', // Will be filled when implemented
  modelSelector: '',        // Will be filled when implemented
  defaultModel: 'grok-3',
  modelPatterns: [
    { text: 'Grok 3', model: 'grok-3' },
  ],
};