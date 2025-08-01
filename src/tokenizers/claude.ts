// Stub tokenizer for Claude - will implement when Anthropic releases official tokenizer

export async function loadTokenizer(): Promise<boolean> {
  // Stub implementation
  return false;
}

export async function countTokens(text: string): Promise<number> {
  // Fallback to character count divided by 3 for now
  return Math.ceil(text.length / 3);
} 