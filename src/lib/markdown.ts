import React from 'react';

/**
 * Simple markdown parser for basic formatting
 * Supports *italic* and **bold** text
 */
export const parseMarkdown = (text: string): React.ReactNode => {
  if (!text) return text;

  // First process bold text (**text**)
  let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Then process italic text (*text*)
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Convert to React nodes
  const parts = processed.split(/(<strong>.*?<\/strong>|<em>.*?<\/em>)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('<strong>') && part.endsWith('</strong>')) {
      const content = part.slice(8, -9);
      return React.createElement('strong', { key: index }, content);
    }
    if (part.startsWith('<em>') && part.endsWith('</em>')) {
      const content = part.slice(4, -5);
      return React.createElement('em', { key: index }, content);
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
  
  return processed;
};