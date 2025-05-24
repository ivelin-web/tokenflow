# Product Requirements Document

**Project:** *Context‑Meter Chrome Extension*
**Last updated:** 5 May 2025
**Author:** Ivelin Ivanov

---

## 1 – Purpose & Vision

Give power‑users of AI chat interfaces a **live, reliable view of context‑window usage** so they can decide when to start fresh threads and avoid hallucinations or truncated replies. MVP focuses on **chat.openai.com**; the architecture must be **multi‑tenant** so future platforms (Gemini, Claude, Grok, etc.) plug in with minimal code.

---

## 2 – Scope

|                                                               | **In (MVP)**           | **Out (MVP)**                        |
| ------------------------------------------------------------- | ---------------------- | ------------------------------------ |
| Token count for ChatGPT models (gpt‑4o, gpt‑4, gpt‑3.5, etc.) | ✔︎                     | –                                    |
| Dynamic UI meter inside the chat page                         | ✔︎                     | Any server‑side component            |
| Auto‑detect model switch & adjust max context display         | ✔︎                     | API calls to OpenAI                  |
| Config scaffolding for Gemini, Claude, Grok                   | ✔︎ (stub only)         | Full support for those platforms     |
| Multiple browser support                                      | Chrome/Edge (MV3) only | Firefox, Safari                      |
| Tokenizer abstraction + dynamic loader                        | ✔︎                     | Re‑implementing tokenizers ourselves |

---

## 3 – Goals & Success Criteria

1. **Accuracy:** ±3 % token difference vs. OpenAI `tiktoken` for GPT models up to 16 k messages in the DOM.
2. **Performance:** No perceptible lag; token calculations complete < 50 ms on 1 000–message conversations.
3. **Ease of extension:** Adding a new platform ≤ 1 dev‑day (new selectors + config, no core refactor).
4. **UX:** Meter is unobtrusive but always visible; color bar changes as usage exceeds 80 % and 95 %.
5. **Privacy:** All computation stays client‑side; no text leaves the browser.

---

## 4 – User Stories (MVP)

1. **As a ChatGPT power‑user** I want to see how many tokens my conversation has consumed so I can reset before hitting the hard limit.
2. **As the same user** I want the meter to update automatically when I switch from *gpt‑4o* to *gpt‑o3* so I see the correct maximum.
3. **As a developer** I want a config file where I can map new platforms/models to tokenizers & limits without touching core logic.

---

## 5 – Functional Requirements

### 5.1 Platform Detection

* Inspect `window.location.hostname` to choose tenant (e.g. `chatgpt.com`).
* For MVP hard‐code ChatGPT; still reserve enum entries for Gemini, Claude, Grok.

### 5.2 Model Detection (ChatGPT)

* Observe the **model switcher button** (`[data-testid="model-switcher"]` or future‑proof selector).
* Emit event on text change; debounce 100 ms.

### 5.3 Tokenizer Loader

* Declarative mapping: **Platform → Model → Tokenizer module**

  * GPT models ➜ `@dqbd/tiktoken`
  * Stub entries for Anthropic, Gemini, etc.
* Load on demand via dynamic `import()`; cache instance.
* Provide fallback `charCount ÷ 3` when given model has no tokenizer.

### 5.4 Conversation Scraper

* Track DOM container that holds message bubbles (ChatGPT: `[data-testid="conversation-turns"]`).
* Use a single `MutationObserver` to capture inserts & edits; maintain an **incremental token cache** so only changed nodes re‑tokenize.

### 5.5 Context Calculation

* `totalTokens = Σ tokenize(messageText)`
* `usagePct = totalTokens / modelMaxTokens`
* Expose `{used, max, pct, model}` to UI layer.

### 5.6 UI Component

* Fixed `div` bottom‑right (z‑index 99 999).
* Displays **“38 k / 128 k (30 %)”**.
* Horizontal progress bar behind text (CSS gradient).
* Color thresholds

  * < 80 % → neutral
  * 80 – 95 % → warning (amber)
  * >  95 % → danger (red)
* Optional tooltip on hover with per‑message breakdown (out of scope MVP).

### 5.7 Settings Page (Options)

* JSON‑ish form letting user:

  * Override max tokens per model.
  * Enable/disable platforms.
* Store via `chrome.storage.sync`.

### 5.8 Error Handling

* If tokenizer load fails, show “≈” before token count to signal approximation.
* Never crash page; log to `console.debug`.

---

## 6 – Non‑Functional Requirements

| Area              | Requirement                                                    |
| ----------------- | -------------------------------------------------------------- |
| **Performance**   | CPU impact < 5 % on mid‑range laptop with 1 000‑message thread |
| **Security**      | No third‑party network calls; comply with MV3 CSP              |
| **Accessibility** | Meter text passes WCAG AA contrast ratio                       |
| **Localization**  | All UI strings in single i18n file (English default)           |

---

## 7 – Technical Architecture

1. **Manifest v3** with permissions: `activeTab`, `storage`, `scripting`, host list.
2. **Content script** only (no background worker needed for MVP).
3. **Modular tokenization layer**

   ```
   /src/tokenizers/
       gpt.ts        // wrapper around tiktoken
       claude.ts     // stub
       gemini.ts     // stub
   /src/tenants/
       chatgpt.ts    // selectors & model detection
       claude.ts     // stub
       gemini.ts     // stub
   ```
4. **Build** with Vite or ESBuild; target `chrome80` (MV3).
5. **CI**: lint, unit tests for tokenizer abstraction (jest + DOM‑testing‑library).
                                                        |

---

## 8 – Acceptance Criteria

1. Install unpacked extension ➜ open ChatGPT ➜ meter appears within 1 s.
2. Token count matches `tiktoken` CLI ±3 % for supplied 10 k‑token test thread.
3. Switching ChatGPT model updates the *max* value within 500 ms.
4. No console errors, no extension crashes after 50 k DOM mutations in stress test.
5. Edge case: if user scrolls to very top (lazy‑loaded messages), meter reconciles after nodes mount.

---

## 9 – Risks & Mitigations

| Risk                              | Impact | Mitigation                                                                         |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| DOM selectors change              | High   | Keep selectors under `/src/tenants`, add nightly smoke test                        |
| Tokenizer WASM large bundle       | Perf   | Lazy‑load only after first chat message; cache in service worker when MV3 supports |
| Model detection fails (UI change) | Med    | Fallback to last known model; show approximation symbol                            |

---

## 10 – Assumptions

* Tokenizer libraries remain FOSS (MIT/Apache) and can be bundled.
* Users understand that counts are approximate; we are not liable for over‑quota errors.
* Anthropic & Google will eventually ship official tokenizers or provide BPE specs.

