import { ContextMeterData } from '../types';
import { debugLog, EXTENSION_CONFIG } from './constants';

export class TokenMeterUI {
  private container: HTMLElement = document.createElement('div');
  private textElement: HTMLElement = document.createElement('div');
  private progressBar: HTMLElement = document.createElement('div');
  private progressInner: HTMLElement = document.createElement('div');
  private lastUpdateTimestamp: number = 0;
  private updateQueueTimer: number | null = null;
  private queuedData: ContextMeterData | null = null;
  private static instance: TokenMeterUI | null = null;
  
  constructor() {
    if (TokenMeterUI.instance) {
      return TokenMeterUI.instance;
    }
    
    this.container = document.createElement('div');
    this.container.id = 'tokenflow-container';
    this.textElement = document.createElement('div');
    this.progressBar = document.createElement('div');
    this.progressInner = document.createElement('div');
    
    this.setupUI();
    TokenMeterUI.instance = this;
  }
  
  // Create and style the UI elements
  private setupUI(): void {
    // Container styles
    Object.assign(this.container.style, {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      backgroundColor: 'rgba(52, 53, 65, 0.85)',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: '8px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '13px',
      zIndex: EXTENSION_CONFIG.MAX_Z_INDEX.toString(),
      display: 'flex',
      flexDirection: 'column',
      width: '160px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
      border: '1px solid rgba(86, 88, 105, 0.5)',
      pointerEvents: 'auto',
      userSelect: 'none',
      visibility: 'visible',
      opacity: '0.9',
      backdropFilter: 'blur(5px)',
      transform: 'translateZ(0)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    });
    
    // Text element styles
    Object.assign(this.textElement.style, {
      textAlign: 'center',
      margin: '4px 0',
      userSelect: 'none',
      fontWeight: '500',
      fontSize: '14px',
      fontVariantNumeric: 'tabular-nums',
      color: '#ffffff'
    });
    
    // Progress bar styles
    Object.assign(this.progressBar.style, {
      height: '6px',
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '3px',
      overflow: 'hidden',
      marginTop: '4px',
    });
    
    // Progress bar inner element (will be updated with the percentage)
    Object.assign(this.progressInner.style, {
      height: '100%',
      width: '0%',
      backgroundColor: '#10a37f',  // ChatGPT green color
      transition: 'width 0.3s ease, background-color 0.3s ease',
      borderRadius: '3px',
    });
    
    // Add to DOM
    this.progressBar.appendChild(this.progressInner);
    this.container.appendChild(this.textElement);
    this.container.appendChild(this.progressBar);
    
    // Add a label to indicate what this is
    const label = document.createElement('div');
    label.textContent = 'TokenFlow';
    Object.assign(label.style, {
      fontSize: '10px',
      fontWeight: '600',
      opacity: '0.8',
      textAlign: 'center',
      marginBottom: '3px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: '#10a37f'  // ChatGPT green
    });
    this.container.insertBefore(label, this.textElement);
    
    // Add hover effect - slightly expand on hover
    this.container.addEventListener('mouseenter', () => {
      this.container.style.opacity = '1';
      this.container.style.transform = 'translateZ(0) scale(1.02)';
    });
    
    this.container.addEventListener('mouseleave', () => {
      this.container.style.opacity = '0.9';
      this.container.style.transform = 'translateZ(0) scale(1)';
    });
  }
  
  // Mount the UI to the document
  public mount(): void {
    // Check if already in DOM by ID to avoid duplicates
    const existingElement = document.getElementById('tokenflow-container');
    if (existingElement) {
      debugLog('UI already in DOM, removing old instance');
      existingElement.remove();
    }
    
    debugLog('Mounting UI to DOM');
    document.body.appendChild(this.container);
    
    // Force a reflow to ensure it appears
    void this.container.offsetHeight;
    
    // Make sure it's visible by forcing it to the front
    this.container.style.zIndex = EXTENSION_CONFIG.MAX_Z_INDEX.toString();
    this.container.style.visibility = 'visible';
    this.container.style.opacity = '1';
  }
  
  // Format a number for display (e.g., 1200 -> "1.2k")
  private formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }
  
  // Update the UI with new data (debounced to prevent flickering)
  public update(data: ContextMeterData): void {
    // Store the data for processing
    this.queuedData = data;
    
    // If another update is pending, don't schedule a new one
    if (this.updateQueueTimer !== null) {
      return;
    }
    
    // If it's been less than cooldown time since last update, queue the update
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTimestamp;
    
    if (timeSinceLastUpdate < EXTENSION_CONFIG.UI_UPDATE_COOLDOWN_MS) {
      // Schedule the update to happen after the cooldown period
      this.updateQueueTimer = window.setTimeout(() => {
        this.processUpdate();
      }, EXTENSION_CONFIG.UI_UPDATE_COOLDOWN_MS - timeSinceLastUpdate);
    } else {
      // Update immediately
      this.processUpdate();
    }
  }
  
  // Process the actual UI update
  private processUpdate(): void {
    if (!this.queuedData) return;
    
    const data = this.queuedData;
    this.queuedData = null;
    this.updateQueueTimer = null;
    this.lastUpdateTimestamp = Date.now();
    
    // Update the text
    const usedFormatted = this.formatNumber(data.used);
    const maxFormatted = this.formatNumber(data.max);
    const approximateSymbol = data.isApproximate ? '≈' : '';
    
    this.textElement.textContent = `${approximateSymbol}${usedFormatted} / ${maxFormatted} (${data.pct}%)`;
    
    // Update the progress bar
    this.progressInner.style.width = `${data.pct}%`;
    
    // Change color based on percentage
    if (data.pct >= 95) {
      this.progressInner.style.backgroundColor = '#ef4146'; // Danger (red)
      this.container.style.borderColor = 'rgba(239, 65, 70, 0.6)';
    } else if (data.pct >= 80) {
      this.progressInner.style.backgroundColor = '#f97316'; // Warning (orange)
      this.container.style.borderColor = 'rgba(249, 115, 22, 0.6)';
    } else {
      this.progressInner.style.backgroundColor = '#10a37f'; // Normal (ChatGPT green)
      this.container.style.borderColor = 'rgba(86, 88, 105, 0.5)';
    }
    
    // Make sure it's visible by forcing it to the front
    this.container.style.zIndex = EXTENSION_CONFIG.MAX_Z_INDEX.toString();
    this.container.style.visibility = 'visible';
    this.container.style.opacity = '0.9';
  }
  
  // Remove the UI from the document
  public unmount(): void {
    if (document.body.contains(this.container)) {
      document.body.removeChild(this.container);
    }
    
    if (this.updateQueueTimer !== null) {
      window.clearTimeout(this.updateQueueTimer);
      this.updateQueueTimer = null;
    }
  }
} 