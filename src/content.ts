import { ContextCalculator } from './utils/contextCalculator';
import { TokenMeterUI } from './utils/uiComponent';
import { PlatformManager } from './utils/platformManager';
import { Platform, ContextMeterData, StorageData } from './types';
import { debugLog, EXTENSION_CONFIG } from './utils/constants';


console.log('%cTokenFlow Extension Loaded', 'background: #4CAF50; color: white; padding: 5px; border-radius: 5px; font-weight: bold;');

class ContextMeter {
  private calculator: ContextCalculator;
  private ui: TokenMeterUI;
  private platformManager: PlatformManager;
  private observer: MutationObserver | null = null;
  private currentModel: string = '';
  private updateDebounceTimer: number | null = null;
  private isInitialized = false;
  private isPlatformEnabled = true;

  constructor() {
    this.platformManager = new PlatformManager();
    this.ui = new TokenMeterUI();
    
    // Initialize calculator with default model
    if (this.platformManager.isSupported()) {
      const config = this.platformManager.getConfig()!;
      const defaultModelConfig = config.models[config.defaultModel];
      this.calculator = new ContextCalculator(defaultModelConfig);
    } else {
      // Fallback calculator for unsupported platforms
      this.calculator = new ContextCalculator({
        name: 'Unknown',
        maxTokens: 128000,
        tokenizerType: 'fallback' as any
      });
    }
    
    debugLog('Constructor initialized');
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      setTimeout(() => this.init(), 500);
    }
  }

  private async init(): Promise<void> {
    try {
      if (this.isInitialized) return;
      
      debugLog('Starting initialization...');
      
      // Check if we're on a supported platform
      if (!this.platformManager.isSupported()) {
        debugLog('Platform not supported');
        return;
      }
      
      await this.loadSettings();
      this.setupStorageListener();
      
      if (this.isPlatformEnabled) {
        this.setupFullFunctionality();
      }
      
      this.isInitialized = true;
    } catch (error) {
      debugLog('Initialization error', error);
      if (this.isPlatformEnabled) {
        this.ui.mount();
      }
    }
  }

  private async loadSettings(): Promise<void> {
    return new Promise((resolve) => {
      try {
        chrome.storage?.sync?.get(['modelTokenLimits', 'enabledPlatforms'], (data: StorageData) => {
          try {
            const config = this.platformManager.getConfig();
            if (!config) {
              resolve();
              return;
            }

            // Apply token limits if available
            const userLimits = data.modelTokenLimits;
            if (userLimits) {
              for (const [modelKey, maxTokens] of Object.entries(userLimits)) {
                if (config.models[modelKey]) {
                  config.models[modelKey].maxTokens = maxTokens;
                }
              }
              debugLog('User token limits loaded', userLimits);
            }
            
            // Check if platform is enabled
            const enabledPlatforms = data.enabledPlatforms;
            if (enabledPlatforms) {
              const platformKey = this.platformManager.getPlatform();
              this.isPlatformEnabled = platformKey ? (enabledPlatforms[platformKey] !== false) : true;
              debugLog(`${platformKey} platform enabled:`, this.isPlatformEnabled);
            }
            
            resolve();
          } catch (error) {
            debugLog('Error processing loaded settings:', error);
            resolve();
          }
        });
      } catch (e) {
        resolve();
      }
    });
  }

  private setupModelDetection(): void {
    try {
      this.updateModel();
      
      // Check for model changes periodically
      setInterval(() => {
        const newModel = this.platformManager.detectModel();
        if (newModel !== this.currentModel) {
          debugLog('Model change detected');
          this.updateModel();
          this.updateTokenCount();
        }
      }, EXTENSION_CONFIG.MODEL_CHECK_INTERVAL_MS);
      
      // Set up observer for model changes
      const config = this.platformManager.getConfig();
      if (config?.modelSelector) {
        const modelElement = document.querySelector(config.modelSelector);
        
        if (modelElement) {
          this.observer = new MutationObserver(this.debounce(() => {
            debugLog('Model selector changed');
            this.updateModel();
            this.updateTokenCount();
          }, EXTENSION_CONFIG.DEBOUNCE_DELAY));
          
          this.observer.observe(modelElement, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true
          });
        }
      }
    } catch (error) {
      debugLog('Error setting up model detection:', error);
    }
  }

  private updateModel(): void {
    try {
      const newModel = this.platformManager.detectModel();
      
      if (newModel !== this.currentModel) {
        this.currentModel = newModel;
        debugLog('Model updated to:', newModel);
        
        const modelConfig = this.platformManager.getModelConfig(newModel);
        if (modelConfig) {
          this.calculator.updateModel(modelConfig);
          debugLog('Calculator updated with new model config');
        }
      }
    } catch (error) {
      debugLog('Error updating model:', error);
    }
  }

  private setupConversationObserver(): void {
    try {
      const conversationNodes = this.platformManager.getConversationNodes();
      
      if (conversationNodes.length === 0) {
        debugLog('No conversation container found, setting up body observer');
        this.observer = new MutationObserver(this.debounce(() => {
          this.updateTokenCount();
        }, EXTENSION_CONFIG.DEBOUNCE_DELAY));
        
        this.observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        return;
      }

      // Observe each conversation node
      this.observer = new MutationObserver(this.debounce(() => {
        this.updateTokenCount();
      }, EXTENSION_CONFIG.DEBOUNCE_DELAY));

      conversationNodes.forEach(node => {
        this.observer!.observe(node, {
          childList: true,
          subtree: true,
          characterData: true
        });
      });

      debugLog(`Set up conversation observer for ${conversationNodes.length} nodes`);
    } catch (error) {
      debugLog('Error setting up conversation observer:', error);
    }
  }

  private async updateTokenCount(): Promise<void> {
    try {
      // Only update if tab is visible/active
      if (document.hidden) {
        return;
      }

      const conversationNodes = this.platformManager.getConversationNodes();
      const data = await this.calculator.processNodes(conversationNodes);
      
      this.ui.update(data);
      this.saveTokenDataToStorage(data);
      
      debugLog('Token count updated:', data);
    } catch (error) {
      debugLog('Error updating token count:', error);
    }
  }

  private saveTokenDataToStorage(data: ContextMeterData): void {
    // Only save if tab is visible/active
    if (document.hidden) {
      return;
    }

    // Simple silent storage - don't throw errors if context is invalid
    try {
      chrome.storage?.local?.set({ currentContextData: data });
    } catch {}
    
    try {
      chrome.storage?.sync?.set({ currentContextData: data });
    } catch {}
  }

  private debounce(callback: Function, delay: number): any {
    return (...args: any[]) => {
      if (this.updateDebounceTimer) {
        clearTimeout(this.updateDebounceTimer);
      }
      this.updateDebounceTimer = window.setTimeout(() => {
        callback.apply(this, args);
      }, delay);
    };
  }

  private setupStorageListener(): void {
    try {
      chrome.storage?.onChanged?.addListener((changes, namespace) => {
        try {
          if (namespace === 'sync') {
            const config = this.platformManager.getConfig();
            if (!config) return;

            if (changes.modelTokenLimits) {
              const newLimits = changes.modelTokenLimits.newValue;
              if (newLimits) {
                for (const [modelKey, maxTokens] of Object.entries(newLimits)) {
                  if (config.models[modelKey]) {
                    config.models[modelKey].maxTokens = maxTokens as number;
                  }
                }
                this.updateModel();
                this.updateTokenCount();
              }
            }

            if (changes.enabledPlatforms) {
              const newEnabled = changes.enabledPlatforms.newValue;
              const platformKey = this.platformManager.getPlatform();
              
              if (newEnabled && platformKey) {
                const wasEnabled = this.isPlatformEnabled;
                this.isPlatformEnabled = newEnabled[platformKey] !== false;
                
                if (this.isPlatformEnabled && !wasEnabled) {
                  this.setupFullFunctionality();
                } else if (!this.isPlatformEnabled && wasEnabled) {
                  this.cleanup();
                }
              }
            }
          }
        } catch (error) {
          debugLog('Error in storage change listener:', error);
        }
      });
    } catch {}
  }

  private setupFullFunctionality(): void {
    try {
      this.ui.mount();
      this.setupModelDetection();
      this.setupConversationObserver();
      this.setupVisibilityListener();
      this.updateTokenCount();
      
      debugLog('Full functionality set up');
    } catch (error) {
      debugLog('Error setting up full functionality:', error);
    }
  }

  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Tab became visible - update immediately
        this.updateTokenCount();
      }
      // If tab becomes hidden, operations will be paused automatically
    });
  }

  public cleanup(): void {
    try {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      
      if (this.updateDebounceTimer) {
        clearTimeout(this.updateDebounceTimer);
        this.updateDebounceTimer = null;
      }
      
      this.ui.unmount();
      
      debugLog('Cleanup completed');
    } catch (error) {
      debugLog('Error during cleanup:', error);
    }
  }
}

// Initialize the extension
const contextMeter = new ContextMeter();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  contextMeter.cleanup();
}); 