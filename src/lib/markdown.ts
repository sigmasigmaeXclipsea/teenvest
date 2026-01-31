/**
 * Simple markdown parser for basic formatting
 * Supports *italic* and **bold** text
 * Returns HTML string for use with dangerouslySetInnerHTML
 */
export const parseMarkdown = (text: string): string => {
  if (!text) return text;

  // First process bold text (**text**)
  let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Then process italic text (*text*)
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  return processed;
};
