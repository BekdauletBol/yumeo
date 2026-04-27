/**
 * Truncate a string to a maximum length, appending an ellipsis if needed.
 * Truncation happens at word boundaries when possible.
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    const sliced = str.slice(0, maxLength - 1);
    const lastSpace = sliced.lastIndexOf(' ');
    return (lastSpace > maxLength * 0.7 ? sliced.slice(0, lastSpace) : sliced) + '…';
  }
  
  /**
   * Truncate a string to a maximum number of tokens (approximate: 4 chars ≈ 1 token).
   */
  export function truncateToTokens(str: string, maxTokens: number): string {
    return truncate(str, maxTokens * 4);
  }
  
  /**
   * Format file size in bytes to a human-readable string.
   */
  export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }