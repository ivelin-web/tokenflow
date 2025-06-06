import { ContextMeterData } from '../types';
import { debugLog, EXTENSION_CONFIG, DEFAULT_THEME_STORAGE_KEY } from './constants';
import type { PlatformConfig } from '../types';

interface ThemeColors {
  background: string;
  color: string;
  border: string;
  progressBg: string;
  progressBar: string;
}

export class TokenMeterUI {
  private container: HTMLElement = document.createElement('div');
  private textElement: HTMLElement = document.createElement('div');
  private progressBar: HTMLElement = document.createElement('div');
  private progressInner: HTMLElement = document.createElement('div');
  private label: HTMLElement = document.createElement('div');
  private styleElement: HTMLStyleElement = document.createElement('style');
  private currentTheme: 'light' | 'dark' = 'dark';
  private themeStorageKey: string = DEFAULT_THEME_STORAGE_KEY;
  private themeConfig: PlatformConfig['themeConfig'] | undefined;
  private cleanup: (() => void)[] = [];
  private lastUpdateTimestamp: number = 0;
  private updateQueueTimer: number | null = null;
  private queuedData: ContextMeterData | null = null;
  private static instance: TokenMeterUI | null = null;
  
  private readonly themes: Record<'light' | 'dark', ThemeColors> = {
    dark: {
      background: 'rgba(102, 126, 234, 0.15)',
      color: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      progressBg: 'rgba(255, 255, 255, 0.2)',
      progressBar: 'rgba(255, 255, 255, 0.8)'
    },
    light: {
      background: 'rgba(102, 126, 234, 0.25)',
      color: '#000000',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      progressBg: 'rgba(0, 0, 0, 0.1)',
      progressBar: 'rgba(0, 0, 0, 0.6)'
    }
  };
  
  constructor(themeConfig?: PlatformConfig['themeConfig']) {
    if (TokenMeterUI.instance) {
      return TokenMeterUI.instance;
    }

    if (themeConfig) {
      this.themeConfig = themeConfig;
      this.themeStorageKey = themeConfig.storageKey;
    }
    
    this.container = document.createElement('div');
    this.container.id = 'tokenflow-container';
    this.textElement = document.createElement('div');
    this.progressBar = document.createElement('div');
    this.progressInner = document.createElement('div');
    
    this.setupUI();
    this.initThemeDetection();
    TokenMeterUI.instance = this;
  }
  
  // Create and style the UI elements with modern design
  private setupUI(): void {
    // Container styles - compact glass-morphism design  
    Object.assign(this.container.style, {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)', // Safari support
      padding: '10px 12px',
      borderRadius: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Display", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      fontSize: '12px',
      zIndex: EXTENSION_CONFIG.MAX_Z_INDEX.toString(),
      display: 'flex',
      flexDirection: 'column',
      width: '140px',
      minWidth: '120px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(102, 126, 234, 0.2)',
      pointerEvents: 'auto',
      userSelect: 'none',
      visibility: 'visible',
      opacity: '0.9',
      transform: 'translateZ(0)',
      transition: 'all 0.3s ease',
      cursor: 'default',
    });
    
    // Add data attribute for custom tooltip (remove browser title to avoid double tooltips)
    this.container.setAttribute('data-tooltip', 'Text-only tracking. Media files are excluded and limits are approximate.');
    
    // Header label with icon - more compact
    this.label = document.createElement('div');
    this.label.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="margin-right: 6px; opacity: 0.8;">
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>TokenFlow</span>
      </div>
    `;

    Object.assign(this.label.style, {
      fontSize: '10px',
      fontWeight: '600',
      opacity: '0.7',
      textAlign: 'left',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
    });
    
    // Text element styles - more compact
    Object.assign(this.textElement.style, {
      textAlign: 'center',
      margin: '4px 0 6px 0',
      userSelect: 'none',
      fontWeight: '500',
      fontSize: '12px',
      fontVariantNumeric: 'tabular-nums',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
      lineHeight: '1.2'
    });
    
    // Progress bar container styles - smaller
    Object.assign(this.progressBar.style, {
      height: '4px',
      width: '100%',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '4px',
      position: 'relative',
      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)'
    });

    // Simplified shimmer effect
    const shimmer = document.createElement('div');
    Object.assign(shimmer.style, {
      position: 'absolute',
      top: '0',
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
      animation: 'tokenflow-shimmer 4s infinite ease-in-out'
    });
    
    // Progress bar inner element - simpler
    Object.assign(this.progressInner.style, {
      height: '100%',
      width: '0%',
      transition: 'all 0.4s ease',
      borderRadius: '4px',
      position: 'relative'
    });

    // CSS animations and tooltip styling
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = this.getStyleContent(this.currentTheme);
    document.head.appendChild(this.styleElement);

    // Build the DOM structure
    this.progressBar.appendChild(shimmer);
    this.progressBar.appendChild(this.progressInner);
    this.container.appendChild(this.label);
    this.container.appendChild(this.textElement);
    this.container.appendChild(this.progressBar);
    
    // Subtle hover effects
    this.container.addEventListener('mouseenter', () => {
      Object.assign(this.container.style, {
        opacity: '1',
        transform: 'translateZ(0) scale(1.02)',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(102, 126, 234, 0.3)'
      });
    });
    
    this.container.addEventListener('mouseleave', () => {
      Object.assign(this.container.style, {
        opacity: '0.9',
        transform: 'translateZ(0) scale(1)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(102, 126, 234, 0.2)'
      });
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
    
    // Make sure it's visible
    this.container.style.zIndex = EXTENSION_CONFIG.MAX_Z_INDEX.toString();
    this.container.style.visibility = 'visible';
    this.container.style.opacity = '0.9';
  }
  
  // Format a number for display with better formatting
  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString();
  }
  
  // Update the UI with new data (debounced to prevent flickering)
  public update(data: ContextMeterData): void {
    this.queuedData = data;
    
    if (this.updateQueueTimer !== null) {
      return;
    }
    
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTimestamp;
    
    if (timeSinceLastUpdate < EXTENSION_CONFIG.UI_UPDATE_COOLDOWN_MS) {
      this.updateQueueTimer = window.setTimeout(() => {
        this.processUpdate();
      }, EXTENSION_CONFIG.UI_UPDATE_COOLDOWN_MS - timeSinceLastUpdate);
    } else {
      this.processUpdate();
    }
  }
  
  // Process the actual UI update with enhanced styling
  private processUpdate(): void {
    if (!this.queuedData) return;
    
    const data = this.queuedData;
    this.queuedData = null;
    this.updateQueueTimer = null;
    this.lastUpdateTimestamp = Date.now();
    
    // Simple, clean text layout
    const usedFormatted = this.formatNumber(data.used);
    const maxFormatted = this.formatNumber(data.max);
    const approximateSymbol = data.isApproximate ? '≈ ' : '';
    
    this.textElement.innerHTML = `
      <div style="font-size: 11px; opacity: 0.8; margin-bottom: 1px;">
        ${approximateSymbol}${usedFormatted} / ${maxFormatted}
      </div>
      <div style="font-size: 13px; font-weight: 600;">
        ${data.pct}%
      </div>
    `;
    
    // Update progress bar
    this.progressInner.style.width = `${data.pct}%`;
    
    // Simple color changes for progress bar only
    let progressColor = '';
    let backgroundOpacity = '0.15';
    
    if (data.pct >= 95) {
      // Critical - Red progress bar
      progressColor = 'rgba(239, 65, 70, 0.9)';
      backgroundOpacity = '0.2'; // Slightly more visible for critical
    } else if (data.pct >= 80) {
      // Warning - Orange progress bar  
      progressColor = 'rgba(249, 115, 22, 0.9)';
      backgroundOpacity = '0.18';
    } else if (data.pct >= 60) {
      // Caution - Yellow progress bar
      progressColor = 'rgba(245, 158, 11, 0.9)';
      backgroundOpacity = '0.16';
    } else {
      // Normal - use theme colors
      progressColor = this.themes[this.currentTheme].progressBar;
      backgroundOpacity = '0.15';
    }
    
    // Apply colors - keep container glass effect, only change progress bar
    this.progressInner.style.background = progressColor;
    this.container.style.background = `rgba(102, 126, 234, ${backgroundOpacity})`;
    
    // Subtle pulse for very high usage
    if (data.pct >= 95) {
      this.container.style.animation = 'tokenflow-pulse 3s infinite ease-in-out';
    } else {
      this.container.style.animation = 'none';
    }
    
    // Ensure visibility
    this.container.style.zIndex = EXTENSION_CONFIG.MAX_Z_INDEX.toString();
    this.container.style.visibility = 'visible';
  }
  
  // Remove the UI from the document
  public unmount(): void {
    if (document.body.contains(this.container)) {
      // Simple fade out
      this.container.style.opacity = '0';
      
      setTimeout(() => {
        if (document.body.contains(this.container)) {
          document.body.removeChild(this.container);
        }
      }, 200);
    }
    
    if (this.updateQueueTimer !== null) {
      window.clearTimeout(this.updateQueueTimer);
      this.updateQueueTimer = null;
    }

    this.cleanup.forEach(fn => fn());
    this.cleanup = [];
  }

  private detectTheme(): 'light' | 'dark' {
    try {
      const stored = localStorage.getItem(this.themeStorageKey);
      if (stored && this.themeConfig) {
        if (this.themeConfig.darkValues?.includes(stored)) return 'dark';
        if (this.themeConfig.lightValues?.includes(stored)) return 'light';
        
        const lowerStored = stored.toLowerCase();
        if (this.themeConfig.darkContains?.some(val => lowerStored.includes(val.toLowerCase()))) return 'dark';
        if (this.themeConfig.lightContains?.some(val => lowerStored.includes(val.toLowerCase()))) return 'light';
      }
    } catch (e) {
      debugLog('Theme storage read error', e);
    }
    
    const html = document.documentElement;
    const dataTheme = html.getAttribute('data-theme');
    if (dataTheme === 'light' || dataTheme === 'dark') return dataTheme;
    
    if (html.classList.contains('light')) return 'light';
    if (html.classList.contains('dark')) return 'dark';
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private getStyleContent(theme: 'light' | 'dark'): string {
    const tooltipBg = theme === 'dark'
      ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(45, 45, 45, 0.95))'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(245, 245, 245, 0.95))';
    const tooltipColor = theme === 'dark' ? '#ffffff' : '#000000';
    const tooltipBorder = theme === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    return `
      @keyframes tokenflow-shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }

      @keyframes tokenflow-pulse {
        0%, 100% { opacity: 0.9; }
        50% { opacity: 1; }
      }

      #tokenflow-container {
        position: relative;
      }

      #tokenflow-container:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 100%;
        right: 0;
        margin-bottom: 12px;
        background: ${tooltipBg};
        color: ${tooltipColor};
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 500;
        line-height: 1.3;
        white-space: pre-line;
        text-align: left;
        z-index: ${EXTENSION_CONFIG.MAX_Z_INDEX + 1};
        box-shadow:
          0 8px 32px rgba(0, 0, 0, 0.4),
          0 2px 8px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        max-width: 180px;
        min-width: 140px;
        pointer-events: none;
        opacity: 0;
        transform: translateY(8px) scale(0.95);
        animation: tooltip-appear 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        font-family: -apple-system, BlinkMacSystemFont, "Segue UI", "SF Pro Display", Roboto, sans-serif;
      }

      #tokenflow-container:hover::before {
        content: "";
        position: absolute;
        bottom: 100%;
        right: 20px;
        margin-bottom: 4px;
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid ${tooltipBorder};
        z-index: ${EXTENSION_CONFIG.MAX_Z_INDEX + 1};
        opacity: 0;
        animation: tooltip-appear 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards;
      }

      @keyframes tooltip-appear {
        0% {
          opacity: 0;
          transform: translateY(8px) scale(0.95);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const colors = this.themes[theme];
    
    this.container.style.background = colors.background;
    this.container.style.color = colors.color;
    this.container.style.border = colors.border;
    
    this.textElement.style.color = colors.color;
    this.label.style.color = colors.color;
    this.progressBar.style.backgroundColor = colors.progressBg;
    this.progressInner.style.background = colors.progressBar;
    
    this.styleElement.textContent = this.getStyleContent(theme);
  }

  private handleThemeChange = (): void => {
    const newTheme = this.detectTheme();
    if (newTheme !== this.currentTheme) {
      this.currentTheme = newTheme;
      this.applyTheme(this.currentTheme);
    }
  };

  private initThemeDetection(): void {
    this.currentTheme = this.detectTheme();
    this.applyTheme(this.currentTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', this.handleThemeChange);
    this.cleanup.push(() => mediaQuery.removeEventListener('change', this.handleThemeChange));

    const observer = new MutationObserver(this.handleThemeChange);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['data-theme', 'class'] 
    });
    this.cleanup.push(() => observer.disconnect());

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === this.themeStorageKey) this.handleThemeChange();
    };
    window.addEventListener('storage', handleStorageChange);
    this.cleanup.push(() => window.removeEventListener('storage', handleStorageChange));
  }
} 