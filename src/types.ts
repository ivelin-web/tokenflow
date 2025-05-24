export enum Platform {
  ChatGPT = 'chatgpt',
  Claude = 'claude',
  Gemini = 'gemini',
  Grok = 'grok',
}

export interface ModelConfig {
  name: string;
  maxTokens: number;
  tokenizerType: TokenizerType;
}

export enum TokenizerType {
  GPT = 'gpt',
  Claude = 'claude',
  Gemini = 'gemini',
  Grok = 'grok',
  Fallback = 'fallback',
}

export interface ContextMeterData {
  used: number;
  max: number;
  pct: number;
  model: string;
  isApproximate: boolean;
}

// Simplified platform configuration
export interface PlatformConfig {
  platform: Platform;
  models: Record<string, ModelConfig>;
  // Simple selectors - just the essential ones
  conversationSelector: string;
  modelSelector: string;
  defaultModel: string;
  // Simple pattern matching for model detection
  modelPatterns: Array<{ text: string; model: string }>;
}

export interface TokenCache {
  [messageId: string]: number;
} 