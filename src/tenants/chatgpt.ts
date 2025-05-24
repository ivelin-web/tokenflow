import { Platform, PlatformConfig, TokenizerType } from '../types';

export const chatGptConfig: PlatformConfig = {
  platform: Platform.ChatGPT,
  models: {
    'gpt-4o': {
      name: 'GPT-4o',
      maxTokens: 128000,
      tokenizerType: TokenizerType.GPT,
    },
    'gpt-4.1': {
      name: 'GPT-4.1',
      maxTokens: 1000000,
      tokenizerType: TokenizerType.GPT,
    },
    'gpt-4.1-mini': {
      name: 'GPT-4.1-mini',
      maxTokens: 1000000,
      tokenizerType: TokenizerType.GPT,
    },
    'o3': {
      name: 'o3',
      maxTokens: 200000,
      tokenizerType: TokenizerType.GPT,
    },
    'o4-mini': {
      name: 'o4-mini',
      maxTokens: 200000,
      tokenizerType: TokenizerType.GPT,
    },
    'o4-mini-high': {
      name: 'o4-mini-high',
      maxTokens: 200000,
      tokenizerType: TokenizerType.GPT,
    },
    'gpt-4.5': {
      name: 'GPT-4.5',
      maxTokens: 128000,
      tokenizerType: TokenizerType.GPT,
    },
  },
  conversationSelector: '[data-testid^="conversation-turn-"]',
  modelSelector: 'button[data-testid="model-switcher-dropdown-button"]',
  defaultModel: 'gpt-4o',
  modelPatterns: [
    { text: 'gpt-4.1-mini', model: 'gpt-4.1-mini' },
    { text: 'gpt-4.1', model: 'gpt-4.1' },
    { text: 'gpt-4o', model: 'gpt-4o' },
    { text: 'gpt-4.5', model: 'gpt-4.5' },
    { text: 'o4-mini-high', model: 'o4-mini-high' },
    { text: 'o4-mini', model: 'o4-mini' },
    { text: '4.1-mini', model: 'gpt-4.1-mini' },
    { text: '4.1', model: 'gpt-4.1' },
    { text: '4.5', model: 'gpt-4.5' },
    { text: 'o3', model: 'o3' },
    { text: '4o', model: 'gpt-4o' },
  ],
}; 