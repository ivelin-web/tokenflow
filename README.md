# TokenFlow Chrome Extension

A lightweight Chrome extension that tracks token usage in AI chat platforms like ChatGPT, providing real-time context window monitoring.

## Features

- **Real-time Token Tracking**: Monitor token usage as you chat
- **Multiple Platform Support**: Currently supports ChatGPT (more platforms coming soon)
- **Smart Model Detection**: Automatically detects the current AI model
- **Visual Progress Indicator**: Color-coded progress bar showing context usage
- **Lightweight & Fast**: Optimized bundle with dynamic loading
- **Privacy-First**: All processing happens locally in your browser

## Important Limitations

⚠️ **Text-Only Tracking**: TokenFlow currently tracks tokens from text content only. Images, audio, videos, attachments, and other media files are **not included** in token calculations.

⚠️ **Approximate Limits**: Token limits shown may differ from actual platform limits. Web interfaces often have different constraints than API limits, and these can change without notice.

⚠️ **Estimation Accuracy**: Token counts are approximations based on available tokenization algorithms and may vary slightly from official platform counts.

## Installation

### From Source (Development)

1. Clone the repository:
```bash
git clone https://github.com/ivelin-web/tokenflow.git
cd tokenflow
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## Supported Platforms

- ✅ **ChatGPT** (chat.openai.com) - Full support
- 🚧 **Claude** (claude.ai) - Coming soon
- 🚧 **Gemini** (gemini.google.com) - Coming soon
- 🚧 **Grok** (x.ai) - Coming soon

## Supported Models

### ChatGPT
- GPT-4o (128k tokens)
- GPT-4.1 (128k tokens)
- GPT-4.1-mini (128k tokens)
- o3 (128k tokens)
- o4-mini (128k tokens)
- o4-mini-high (128k tokens)
- GPT-4.5 (128k tokens)

## Development

### Project Structure

```
src/
├── content.ts              # Main content script
├── options.ts              # Extension options page
├── types.ts                # TypeScript type definitions
├── tenants/                # Platform-specific configurations
│   ├── index.ts            # Platform detection and management
│   ├── chatgpt.ts          # ChatGPT configuration
│   ├── claude.ts           # Claude configuration (stub)
│   ├── gemini.ts           # Gemini configuration (stub)
│   └── grok.ts             # Grok configuration (stub)
├── tokenizers/             # Token counting implementations
│   ├── index.ts            # Tokenizer selection
│   ├── gpt.ts              # GPT tokenizer (dynamic import)
│   └── ...                 # Other tokenizers
└── utils/                  # Utility classes
    ├── contextCalculator.ts # Token calculation logic
    ├── platformManager.ts   # Platform management
    ├── uiComponent.ts       # UI rendering
    └── constants.ts         # Configuration constants
```

### Adding New Platforms

1. Create a new configuration file in `src/tenants/`:
```typescript
// src/tenants/newplatform.ts
import { Platform, PlatformConfig, TokenizerType } from '../types';

export const newPlatformConfig: PlatformConfig = {
  platform: Platform.NewPlatform,
  models: {
    'model-name': {
      name: 'Model Display Name',
      maxTokens: 100000,
      tokenizerType: TokenizerType.NewPlatform,
    },
  },
  conversationSelector: '[data-conversation]', // CSS selector for messages
  modelSelector: '[data-model-selector]',      // CSS selector for model picker
  defaultModel: 'model-name',
  modelPatterns: [
    { text: 'model-name', model: 'model-name' },
  ],
};
```

2. Add the platform to `src/types.ts`:
```typescript
export enum Platform {
  // ... existing platforms
  NewPlatform = 'newplatform',
}
```

3. Update `src/tenants/index.ts` to include the new platform.

### Build Commands

- `npm run build` - Production build
- `npm run dev` - Development build with watch mode

### Code Style

- Use TypeScript for all new code
- Follow the existing naming conventions
- Keep functions small and focused
- Add JSDoc comments for public APIs
- Use async/await for asynchronous operations

## Architecture

The extension uses a modular architecture:

1. **Platform Manager**: Detects the current platform and loads appropriate configuration
2. **Context Calculator**: Handles token counting using platform-specific tokenizers
3. **UI Component**: Renders the token meter with real-time updates
4. **Dynamic Loading**: Tokenizers are loaded on-demand to reduce initial bundle size

## Performance

- Initial bundle size: ~18.4 kB (main content script)
- Tokenizer loaded dynamically: ~1.7 MB (only when needed)
- Memory usage: < 10 MB
- CPU impact: Minimal (debounced updates)

## Privacy

- No data is sent to external servers
- All token counting happens locally
- No tracking or analytics
- Open source and auditable

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes following the code style guidelines
4. Test thoroughly on the target platform
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

For issues and feature requests, please use the GitHub issue tracker. 