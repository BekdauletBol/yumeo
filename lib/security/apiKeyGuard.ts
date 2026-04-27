/**
 * Guard that ensures the Anthropic API key is never exposed to the browser.
 * Call this at the top of every server-side function that uses the key.
 *
 * @throws Error if called in a browser environment.
 */
export function assertServerSide(): void {
    if (typeof window !== 'undefined') {
      throw new Error(
        'SECURITY: Attempted to access Anthropic API key in a browser context. ' +
          'All AI calls must go through /api routes.',
      );
    }
  }
  
  /**
   * Retrieve the Anthropic API key from environment variables.
   * Must only be called on the server.
   */
  export function getAnthropicKey(): string {
    assertServerSide();
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env.local');
    }
    return key;
  }