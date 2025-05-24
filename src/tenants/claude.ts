import { Platform, PlatformConfig, TokenizerType } from '../types';

// Stub config for Claude - will be implemented in future releases
export const claudeConfig: PlatformConfig = {
  platform: Platform.Claude,
  models: {
    'claude-4-opus': {
      name: 'Claude Opus 4',
      maxTokens: 200000,
      tokenizerType: TokenizerType.Claude,
    },
    'claude-4-sonnet': {
      name: 'Claude Sonnet 4',
      maxTokens: 200000,
      tokenizerType: TokenizerType.Claude,
    },
    'claude-3.7-sonnet': {
      name: 'Claude Sonnet 3.7',
      maxTokens: 200000,
      tokenizerType: TokenizerType.Claude,
    },
    'claude-3-opus': {
      name: 'Claude Opus 3',
      maxTokens: 200000,
      tokenizerType: TokenizerType.Claude,
    },
    'claude-3.5-haiku': {
      name: 'Claude Haiku 3.5',
      maxTokens: 200000,
      tokenizerType: TokenizerType.Claude,
    },
  },
  conversationSelector: '', // Will be filled when implemented
  modelSelector: '',        // Will be filled when implemented
  defaultModel: 'claude-4-sonnet',
  modelPatterns: [
    { text: 'claude-4-opus', model: 'claude-4-opus' },
    { text: 'claude-4-sonnet', model: 'claude-4-sonnet' },
    { text: 'claude-3.7-sonnet', model: 'claude-3.7-sonnet' },
    { text: 'claude-3-opus', model: 'claude-3-opus' },
    { text: 'claude-3.5-haiku', model: 'claude-3.5-haiku' },
  ],
}; 