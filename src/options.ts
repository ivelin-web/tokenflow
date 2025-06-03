import { debugLog } from './utils/constants';
import { StorageData, ContextMeterData, Platform } from './types';
import { PLATFORM_DISPLAY_NAMES, isPlatformSupported } from './utils/platformConfig';

// Default token limits for ChatGPT models
const DEFAULT_LIMITS = {
  'gpt-4o': 128000,
  'gpt-4.1': 128000,
  'gpt-4.1-mini': 128000,
  'o3': 128000,
  'o4-mini': 128000,
  'o4-mini-high': 128000,
  'gpt-4.5': 128000
};

// Default platform settings (only ChatGPT enabled for MVP)
const DEFAULT_PLATFORMS = {
  'chatgpt': true,
  'claude': false,  // Disabled for MVP
  'gemini': false,  // Disabled for MVP
  'grok': false     // Disabled for MVP
};

// Load saved settings from storage
function loadSettings(): void {
  debugLog('Loading settings from storage');
  
  chrome.storage.sync.get(['modelTokenLimits', 'enabledPlatforms'], (data: StorageData) => {
    debugLog('Retrieved settings:', data);
    
    const limits = data.modelTokenLimits || DEFAULT_LIMITS;
    const platforms = { ...DEFAULT_PLATFORMS, ...(data.enabledPlatforms || {}) } as Record<string, boolean>;
    platforms.claude = false;
    platforms.gemini = false;
    platforms.grok = false;
    
    // Set token limit input values
    for (const [model, limit] of Object.entries(limits)) {
      const input = document.getElementById(model) as HTMLInputElement;
      if (input) {
        input.value = limit.toString();
      }
    }
    
    // Set defaults for any new models that might not be in storage yet
    for (const model of Object.keys(DEFAULT_LIMITS)) {
      const input = document.getElementById(model) as HTMLInputElement;
      if (input && !input.value) {
        input.value = DEFAULT_LIMITS[model as keyof typeof DEFAULT_LIMITS].toString();
      }
    }
    
    // Set platform toggle states
    for (const [platform, enabled] of Object.entries(platforms)) {
      const toggle = document.getElementById(`platform-${platform}`) as HTMLInputElement;
      if (toggle) {
        toggle.checked = enabled;
      }
    }
    
    // Set defaults for any new platforms that might not be in storage yet
    for (const platform of Object.keys(DEFAULT_PLATFORMS)) {
      const toggle = document.getElementById(`platform-${platform}`) as HTMLInputElement;
      if (toggle && toggle.checked === undefined) {
        toggle.checked = DEFAULT_PLATFORMS[platform as keyof typeof DEFAULT_PLATFORMS];
      }
    }
    
    debugLog('Settings loaded successfully');
  });
}

// Format a number for display (e.g., 1200 -> "1.2k")
function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

// Update the token meter UI with the latest data
function updateTokenMeter(data: ContextMeterData): void {
  debugLog('Updating token meter with data:', data);
  
  const tokenMeterText = document.getElementById('token-meter-text');
  const tokenMeterFill = document.getElementById('token-meter-fill');
  const currentModel = document.getElementById('current-model');
  
  if (!tokenMeterText || !tokenMeterFill || !currentModel) {
    debugLog('Missing UI elements for token meter');
    return;
  }
  
  try {
    // Update the text
    const usedFormatted = formatNumber(data.used);
    const maxFormatted = formatNumber(data.max);
    const approximateSymbol = data.isApproximate ? '≈' : '';
    
    const displayText = `${approximateSymbol}${usedFormatted} / ${maxFormatted} (${data.pct}%)`;
    tokenMeterText.textContent = displayText;
    debugLog('Updated token text to:', displayText);
    
    // Update the progress bar
    tokenMeterFill.style.width = `${data.pct}%`;
    
    // Change color based on percentage
    if (data.pct >= 95) {
      tokenMeterFill.style.backgroundColor = '#ef4146'; // Danger (red)
    } else if (data.pct >= 80) {
      tokenMeterFill.style.backgroundColor = '#f97316'; // Warning (orange)
    } else {
      tokenMeterFill.style.backgroundColor = '#10a37f'; // Normal (ChatGPT green)
    }
    
    // Update model name
    currentModel.textContent = `Current model: ${data.model}`;
    
    debugLog('Token meter UI updated successfully');
  } catch (error) {
    debugLog('Error updating token meter UI:', error);
  }
}

// Save settings to storage
function saveSettings(): void {
  const modelTokenLimits: Record<string, number> = {};
  const enabledPlatforms: Record<string, boolean> = {};
  
  // Get values from token limit inputs
  for (const model of Object.keys(DEFAULT_LIMITS)) {
    const input = document.getElementById(model) as HTMLInputElement;
    if (input && input.value) {
      modelTokenLimits[model] = parseInt(input.value, 10);
    } else {
      modelTokenLimits[model] = DEFAULT_LIMITS[model as keyof typeof DEFAULT_LIMITS];
    }
  }
  
  // Get values from platform toggles
  for (const platform of Object.keys(DEFAULT_PLATFORMS)) {
    const toggle = document.getElementById(`platform-${platform}`) as HTMLInputElement;
    if (toggle) {
      enabledPlatforms[platform] = toggle.checked;
    } else {
      enabledPlatforms[platform] = DEFAULT_PLATFORMS[platform as keyof typeof DEFAULT_PLATFORMS];
    }
  }
  
  // Save to storage
  chrome.storage.sync.set({ modelTokenLimits, enabledPlatforms }, () => {
    // Show success message
    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.textContent = 'Settings saved!';
      statusElement.classList.add('success');
      
      // Hide message after 2 seconds
      setTimeout(() => {
        statusElement.textContent = '';
        statusElement.classList.remove('success');
      }, 2000);
    }
  });
}

// Show content for unsupported platform
function showUnsupportedPlatformContent(platform: Platform): void {
  debugLog('Showing unsupported platform content for:', platform);
  
  // Hide the token usage and model limits cards
  const tokenUsageCard = document.getElementById('token-usage-card');
  const modelLimitsCard = document.querySelector('.card:nth-child(4)');
  
  if (tokenUsageCard) {
    (tokenUsageCard as HTMLElement).style.display = 'none';
  }
  
  if (modelLimitsCard) {
    (modelLimitsCard as HTMLElement).style.display = 'none';
  }
  
  // Show the unsupported platform card
  const unsupportedCard = document.getElementById('unsupported-platform-card');
  const platformNameElement = document.getElementById('unsupported-platform-name');
  
  if (unsupportedCard && platformNameElement) {
    const platformName = PLATFORM_DISPLAY_NAMES[platform];
    platformNameElement.textContent = `${platformName} Support Coming Soon!`;
    (unsupportedCard as HTMLElement).style.display = 'block';
  }
}

// Check if options page is being viewed from a supported platform tab
function checkCurrentPlatform(): void {
  if (chrome.tabs) {
    // First check if we're in a tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const currentTab = tabs[0];
        
        // Check if URL matches any of the platforms
        const url = currentTab.url || '';
        let detectedPlatform: Platform | null = null;
        
        if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
          detectedPlatform = Platform.ChatGPT;
        } else if (url.includes('claude.ai')) {
          detectedPlatform = Platform.Claude;
        } else if (url.includes('gemini.google.com')) {
          detectedPlatform = Platform.Gemini;
        } else if (url.includes('grok.com') || url.includes('x.ai')) {
          detectedPlatform = Platform.Grok;
        }
        
        // If it's an unsupported platform, show the special UI
        if (detectedPlatform && !isPlatformSupported(detectedPlatform)) {
          showUnsupportedPlatformContent(detectedPlatform);
        }
      }
    });
  }
}

// Initialize the options page
document.addEventListener('DOMContentLoaded', () => {
  debugLog('DOM content loaded');
  
  // Check if we're on an unsupported platform
  checkCurrentPlatform();
  
  // Load saved settings
  loadSettings();
  
  // Try to get current context data immediately from both storage areas
  loadTokenData();
  
  // Add save button listener for all settings
  const saveButton = document.getElementById('save');
  if (saveButton) {
    saveButton.addEventListener('click', saveSettings);
  }
  
  // Add storage listener to update token meter when data changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    debugLog('Storage changes detected:', changes, 'in namespace:', namespace);
    
    if (changes.currentContextData) {
      const newData = changes.currentContextData.newValue;
      debugLog('New context data received:', newData);
      
      if (newData) {
        updateTokenMeter(newData);
      }
    }
  });
});

// Load token data from storage (checking both local and sync)
function loadTokenData(): void {
  // First try local storage as it should be faster
  chrome.storage.local.get(['currentContextData'], (localData: StorageData) => {
    debugLog('Local storage token data:', localData.currentContextData);
    
    if (localData.currentContextData) {
      updateTokenMeter(localData.currentContextData);
    } else {
      // If no local data, check sync storage
      chrome.storage.sync.get(['currentContextData'], (syncData: StorageData) => {
        debugLog('Sync storage token data:', syncData.currentContextData);
        
        if (syncData.currentContextData) {
          updateTokenMeter(syncData.currentContextData);
        } else {
          // No data found in either storage
          debugLog('No token data available in any storage');
          displayNoTokenData();
        }
      });
    }
  });
}

// Display message when no token data is available
function displayNoTokenData(): void {
  const tokenMeterText = document.getElementById('token-meter-text');
  const currentModel = document.getElementById('current-model');
  
  if (tokenMeterText) tokenMeterText.textContent = 'No token data available';
  if (currentModel) currentModel.textContent = 'Start a conversation to see token usage';
} 