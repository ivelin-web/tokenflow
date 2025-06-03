// GPT tokenizer implementation using gpt-tokenizer with dynamic imports
// This reduces the initial bundle size by loading the tokenizer only when needed

import { debugLog } from '../utils/constants';

// Define chat message type matching gpt-tokenizer's expected format
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface TokenizerInterface {
  encode: (text: string) => number[];
  encodeChat: (messages: ChatMessage[]) => number[];
}

// Cache for the dynamically loaded tokenizer
let tokenizerCache: TokenizerInterface | null = null;
let tokenizerPromise: Promise<TokenizerInterface> | null = null;

/**
 * Dynamically load the GPT-4o tokenizer
 */
async function loadGPTTokenizer(): Promise<TokenizerInterface> {
  if (tokenizerCache) {
    return tokenizerCache;
  }

  if (tokenizerPromise) {
    return tokenizerPromise;
  }

  tokenizerPromise = (async () => {
    try {
      // Dynamic import to reduce initial bundle size
      const { encode, encodeChat } = await import('gpt-tokenizer/model/gpt-4o');
      
      const tokenizer: TokenizerInterface = {
        encode,
        encodeChat
      };
      
      tokenizerCache = tokenizer;
      debugLog('GPT-4o tokenizer loaded successfully');
      return tokenizer;
    } catch (error) {
      debugLog('Error loading GPT tokenizer:', error);
      throw error;
    }
  })();

  return tokenizerPromise;
}

/**
 * Get the GPT tokenizer for all GPT models
 */
export function getGPTTokenizer(): Promise<TokenizerInterface> {
  debugLog('Using GPT-4o tokenizer for all GPT models');
  return loadGPTTokenizer();
}

/**
 * Load the tokenizer
 */
export async function loadTokenizer(): Promise<boolean> {
  try {
    await loadGPTTokenizer();
    return true;
  } catch (error) {
    debugLog('Error initializing tokenizer:', error);
    return false;
  }
}

/**
 * Count tokens for a single message
 */
export async function countTokens(text: string): Promise<number> {
  if (!text) return 0;
  
  try {
    const tokenizer = await loadGPTTokenizer();
    const tokens = tokenizer.encode(text);
    return tokens.length;
  } catch (error) {
    debugLog('Error counting tokens:', error);
    // Character-based fallback
    return Math.ceil(text.length / 4);
  }
}

/**
 * Count tokens for a message with role (user/assistant/system)
 */
export async function countMessageTokens(content: string, role: string = 'user'): Promise<number> {
  if (!content) return 0;
  
  try {
    const tokenizer = await loadGPTTokenizer();
    
    // Create a single-message chat array with role constraint to valid types
    const validRole = (role === 'user' || role === 'assistant' || role === 'system') 
      ? role as ChatMessage['role']
      : 'user'; // Default to user if role is invalid
      
    const message: ChatMessage = { 
      role: validRole, 
      content 
    };
    
    const tokens = tokenizer.encodeChat([message]);
    return tokens.length;
  } catch (error) {
    debugLog('Error counting message tokens:', error);
    // Fallback to basic token count + role overhead
    const contentTokens = await countTokens(content);
    return contentTokens + 4; // Approximate overhead for role formatting
  }
}

/**
 * Count tokens for an entire conversation
 */
export async function countConversationTokens(messages: {role: string, content: string}[]): Promise<number> {
  if (!messages || messages.length === 0) return 0;
  
  try {
    const tokenizer = await loadGPTTokenizer();
    
    // Convert input messages to valid ChatMessage format
    const validMessages: ChatMessage[] = messages.map(msg => {
      // Ensure role is valid
      const validRole = (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system')
        ? msg.role as ChatMessage['role']
        : 'user'; // Default to user if role is invalid
        
      return {
        role: validRole,
        content: msg.content || ''
      };
    });
    
    // This is exactly what we need - encodeChat handles the format OpenAI uses
    const tokens = tokenizer.encodeChat(validMessages);
    debugLog(`Conversation with ${validMessages.length} messages has ${tokens.length} tokens`);
    return tokens.length;
  } catch (error) {
    debugLog('Error in conversation token counting:', error);
    
    // Fallback to counting individual messages
    let totalTokens = 0;
    for (const message of messages) {
      const messageTokens = await countMessageTokens(message.content || '', message.role || 'user');
      totalTokens += messageTokens;
    }
    
    // Add small overhead for overall formatting
    totalTokens += 3;
    
    return totalTokens;
  }
} 