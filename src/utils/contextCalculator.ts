import { ContextMeterData, ModelConfig, TokenCache, TokenizerType } from '../types';
import { countTokens, countConversationTokens, getGPTTokenizer } from '../tokenizers/gpt';
import { debugLog } from './constants';

export class ContextCalculator {
  private tokenCache: TokenCache = {};
  private model: ModelConfig;
  private isApproximate = false;
  private lastFullText: string = '';
  private lastFullCount: number = 0;

  constructor(model: ModelConfig) {
    this.model = model;
    // Tokenizer will be loaded dynamically when needed
  }

  // Process message nodes and calculate total tokens
  public async processNodes(nodes: NodeListOf<Element>): Promise<ContextMeterData> {
    try {
      debugLog(`Processing ${nodes.length} conversation nodes`);
      
      // Create array to store all messages in the conversation
      const allMessages: {role: string, content: string}[] = [];
      
      // Process each message node
      for (const node of Array.from(nodes)) {
        try {
          const role = this.determineRole(node);
          const messageText = this.extractTextFromNode(node);
          
          // Skip empty messages
          if (!messageText || messageText.trim() === '') continue;
          
          // Add this message to our array
          allMessages.push({
            role,
            content: messageText
          });
          
          debugLog(`Extracted message: role=${role}, length=${messageText.length}`);
        } catch (error) {
          debugLog('Error processing node:', error);
          // Continue with other nodes
        }
      }
      
      // Handle empty conversations
      if (allMessages.length === 0) {
        debugLog('No messages found to count');
        return {
          used: 0,
          max: this.model.maxTokens,
          pct: 0,
          model: this.model.name,
          isApproximate: false
        };
      }
      
      // Generate a cache key from the conversation content
      const fullText = allMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
      
      // Use cached count if available for same content
      if (fullText === this.lastFullText && this.lastFullCount > 0) {
        debugLog(`Using cached token count: ${this.lastFullCount}`);
        return this.createResponse(this.lastFullCount);
      }
      
      try {
        // Count tokens using the gpt-tokenizer's conversation counting
        const tokenCount = await countConversationTokens(allMessages);
        
        // Cache the result
        this.lastFullText = fullText;
        this.lastFullCount = tokenCount;
        this.isApproximate = false;
        
        debugLog(`Conversation token count: ${tokenCount}`);
        return this.createResponse(tokenCount);
      } catch (error) {
        debugLog('Error in conversation token counting, falling back to text counting', error);
        
        // Fallback: Count entire text as a single string
        const plainText = allMessages.map(msg => msg.content).join('\n\n');
        const tokenCount = await countTokens(plainText);
        
        // Add overhead for message formatting (approximate)
        const totalTokens = tokenCount + (allMessages.length * 4);
        
        // Cache this result too
        this.lastFullText = fullText;
        this.lastFullCount = totalTokens;
        this.isApproximate = true;
        
        debugLog(`Fallback token count: ${totalTokens}`);
        return this.createResponse(totalTokens);
      }
    } catch (error) {
      debugLog('Error in processNodes', error);
      return {
        used: 0,
        max: this.model.maxTokens,
        pct: 0,
        model: this.model.name,
        isApproximate: true
      };
    }
  }
  
  // Create response object
  private createResponse(tokenCount: number): ContextMeterData {
    const pct = Math.min(100, Math.floor((tokenCount / this.model.maxTokens) * 100));
    
    return {
      used: tokenCount,
      max: this.model.maxTokens,
      pct,
      model: this.model.name,
      isApproximate: this.isApproximate
    };
  }
  
  // Determine message role from the node
  private determineRole(node: Element): string {
    // Look for specific role attributes
    const roleAttr = node.getAttribute('data-message-author-role');
    if (roleAttr === 'user') return 'user';
    if (roleAttr === 'assistant') return 'assistant';
    if (roleAttr === 'system') return 'system';
    
    // Look for role in class names
    const className = node.className || '';
    if (className.includes('user') || className.includes('human')) return 'user';
    if (className.includes('assistant') || className.includes('bot')) return 'assistant';
    
    // Try to determine from position or other indicators
    const userIndicators = ['you:', 'you said:', 'user:', 'human:'];
    const assistantIndicators = ['chatgpt:', 'assistant:', 'ai:'];
    
    const text = (node.textContent || '').toLowerCase();
    
    for (const indicator of userIndicators) {
      if (text.includes(indicator)) return 'user';
    }
    
    for (const indicator of assistantIndicators) {
      if (text.includes(indicator)) return 'assistant';
    }
    
    // Default based on assumed alternating pattern
    // If we can find a previous sibling that might help determine
    const prevSibling = node.previousElementSibling;
    if (prevSibling && prevSibling.hasAttribute('data-message-author-role')) {
      const prevRole = prevSibling.getAttribute('data-message-author-role');
      return prevRole === 'user' ? 'assistant' : 'user';
    }
    
    // Default case - assume user
    return 'user';
  }
  
  // Extract clean text from a node, handling HTML properly
  private extractTextFromNode(node: Element): string {
    try {
      // Get text content
      let text = node.textContent || '';
      
      // Clean up the text a bit
      text = text.replace(/\s+/g, ' ').trim();
      
      // If too long, it might be a container with many messages - try to find a more specific container
      if (text.length > 5000) {
        debugLog('Large node detected, trying to find more specific container');
        
        // Look for more specific message content containers
        const messageContent = node.querySelector('.message-content, .markdown, p');
        if (messageContent) {
          text = messageContent.textContent || '';
          text = text.replace(/\s+/g, ' ').trim();
        }
      }
      
      return text;
    } catch (error) {
      debugLog('Error extracting text from node', error);
      return '';
    }
  }
  
  // Update the current model
  public updateModel(model: ModelConfig): void {
    if (this.model.name !== model.name) {
      debugLog(`Updating model from ${this.model.name} to ${model.name}`);
      this.model = model;
      
      // No need to update tokenizer since we always use GPT-4o
      
      // Reset caches
      this.isApproximate = false;
      this.lastFullCount = 0;
      this.lastFullText = '';
      this.tokenCache = {};
    }
  }
  
  // Clear the token cache
  public clearCache(): void {
    this.tokenCache = {};
    this.lastFullCount = 0;
    this.lastFullText = '';
  }
} 