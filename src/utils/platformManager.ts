import { Platform, PlatformConfig, ContextMeterData } from '../types';
import { detectPlatform, getPlatformConfig } from '../tenants';
import { debugLog } from './constants';

export class PlatformManager {
  private currentPlatform: Platform | null = null;
  private config: PlatformConfig | null = null;

  constructor() {
    this.currentPlatform = detectPlatform();
    if (this.currentPlatform) {
      this.config = getPlatformConfig(this.currentPlatform);
      debugLog(`Platform detected: ${this.currentPlatform}`);
    }
  }

  // Check if we're on a supported platform
  isSupported(): boolean {
    return this.currentPlatform !== null && this.config !== null;
  }

  // Get current platform
  getPlatform(): Platform | null {
    return this.currentPlatform;
  }

  // Get platform configuration
  getConfig(): PlatformConfig | null {
    return this.config;
  }

  // Detect current model using simplified pattern matching
  detectModel(): string {
    if (!this.config) {
      return '';
    }

    try {
      // Try URL first
      const url = window.location.href;
      if (url.includes('model=')) {
        const modelParam = url.split('model=')[1].split('&')[0];
        const detected = this.detectModelFromText(modelParam);
        if (detected && this.config.models[detected]) {
          return detected;
        }
      }

      // Try main model selector
      if (this.config.modelSelector) {
        const modelElement = document.querySelector(this.config.modelSelector);
        if (modelElement?.textContent) {
          const detected = this.detectModelFromText(modelElement.textContent);
          if (detected && this.config.models[detected]) {
            return detected;
          }
        }
      }

      // Fallback: try any button with model-like text
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent && this.isModelText(button.textContent)) {
          const detected = this.detectModelFromText(button.textContent);
          if (detected && this.config.models[detected]) {
            return detected;
          }
        }
      }

      return this.config.defaultModel;
    } catch (error) {
      debugLog('Error detecting model:', error);
      return this.config.defaultModel;
    }
  }

  // Get conversation nodes
  getConversationNodes(): NodeListOf<Element> {
    if (!this.config?.conversationSelector) {
      return document.querySelectorAll('.context-meter-empty-selector');
    }

    const nodes = document.querySelectorAll(this.config.conversationSelector);
    debugLog(`Found ${nodes.length} conversation nodes`);
    return nodes;
  }

  // Get model configuration
  getModelConfig(modelKey: string) {
    return this.config?.models[modelKey] || null;
  }

  // Simple text-based model detection
  private detectModelFromText(text: string): string {
    if (!this.config) {
      return '';
    }

    const lowerText = text.toLowerCase();
    
    for (const pattern of this.config.modelPatterns) {
      if (lowerText.includes(pattern.text.toLowerCase())) {
        debugLog(`Model detected: ${pattern.model} from text: ${text}`);
        return pattern.model;
      }
    }
    
    return '';
  }

  // Check if text looks like it contains model information
  private isModelText(text: string): boolean {
    if (!this.config) {
      return false;
    }

    const lowerText = text.toLowerCase();
    
    // Check if text contains any of our model patterns
    for (const pattern of this.config.modelPatterns) {
      if (lowerText.includes(pattern.text.toLowerCase())) {
        return true;
      }
    }
    
    return false;
  }
} 