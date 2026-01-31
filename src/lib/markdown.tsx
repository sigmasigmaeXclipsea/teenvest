/**
<<<<<<< HEAD:src/lib/markdown.tsx
 * Simple markdown parser for basic formatting.
 * Supports *italic* and **bold** text.
 */
import { createElement } from 'react';
import type { ReactNode } from 'react';

export const parseMarkdown = (text: string): ReactNode => {
=======
 * Simple markdown parser for basic formatting
 * Supports *italic* and **bold** text
 * Returns HTML string for use with dangerouslySetInnerHTML
 */
export const parseMarkdown = (text: string): string => {
>>>>>>> a398009a4477ed85581aae27611f08e45fdfc99c:src/lib/markdown.ts
  if (!text) return text;

  // First process bold text (**text**)
  let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Then process italic text (*text*)
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
<<<<<<< HEAD:src/lib/markdown.tsx

  // Convert to React nodes
  const parts = processed.split(/(<strong>.*?<\/strong>|<em>.*?<\/em>)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('<strong>') && part.endsWith('</strong>')) {
      const content = part.slice(8, -9);
      return createElement('strong', { key: index }, content);
    }
    if (part.startsWith('<em>') && part.endsWith('</em>')) {
      const content = part.slice(4, -5);
      return createElement('em', { key: index }, content);
    }
    return part;
  });
};

/**
 * Parse markdown and return as string with HTML tags
 * For use in dangerouslySetInnerHTML
 */
export const parseMarkdownToHTML = (text: string): string => {
  if (!text) return text;

  let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
=======
>>>>>>> a398009a4477ed85581aae27611f08e45fdfc99c:src/lib/markdown.ts
  
  return processed;
};