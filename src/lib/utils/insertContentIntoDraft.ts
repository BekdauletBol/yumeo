/**
 * Utilities for inserting content into draft with proper formatting
 */

export type ContentToInsert = {
  type: 'figure' | 'table' | 'equation' | 'diagram' | 'reference';
  title: string;
  content: string;
  caption?: string;
  figureNumber?: number;
  tableNumber?: number;
};

/**
 * Format content based on type for insertion into draft
 */
export function formatContentForInsertion(item: ContentToInsert): string {
  switch (item.type) {
    case 'figure':
      return `[Figure ${item.figureNumber}: ${item.caption || item.title}]\n${item.content}\n`;

    case 'table':
      return `[Table ${item.tableNumber}: ${item.caption || item.title}]\n\`\`\`\n${item.content}\n\`\`\`\n`;

    case 'equation':
      return `${item.content} `;

    case 'diagram':
      return `[Diagram: ${item.caption || item.title}]\n\`\`\`mermaid\n${item.content}\n\`\`\`\n`;

    case 'reference':
      return `[Reference: ${item.title}]\n`;

    default:
      return item.content;
  }
}

/**
 * Get auto-numbered figure caption
 */
export function getFigureNumber(figuresCount: number): number {
  return figuresCount + 1;
}

/**
 * Get auto-numbered table number
 */
export function getTableNumber(tablesCount: number): number {
  return tablesCount + 1;
}
