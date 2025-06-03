import { TokenizerType } from '../types';
import * as gptTokenizer from './gpt';

// Interface for a tokenizer
interface Tokenizer {
  loadTokenizer: () => Promise<boolean>;
  countTokens: (text: string) => Promise<number>;
}

// Map tokenizer types to their implementations
const tokenizers: Record<string, Tokenizer> = {
  [TokenizerType.GPT]: gptTokenizer,
  // Default fallback tokenizer
  [TokenizerType.Fallback]: {
    loadTokenizer: async () => false,
    countTokens: async (text: string) => Math.ceil(text.length / 3),
  }
};

// Get the appropriate tokenizer based on type
export function getTokenizer(type: TokenizerType): Tokenizer {
  return tokenizers[type] || tokenizers[TokenizerType.Fallback];
}

// Generic function to count tokens with any tokenizer
export async function countTokens(text: string, type: TokenizerType): Promise<number> {
  const tokenizer = getTokenizer(type);
  return await tokenizer.countTokens(text);
} 