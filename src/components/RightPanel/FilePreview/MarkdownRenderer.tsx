import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Simple markdown-to-HTML converter
  // In a real implementation, you'd use a library like react-markdown or marked
  const renderMarkdown = (md: string): string => {
    let html = md;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-gray-200 mt-6 mb-3">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-200 mt-8 mb-4">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-200 mt-8 mb-4">$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-100">$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong class="font-bold text-gray-100">$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-300">$1</em>');
    html = html.replace(/_(.*?)_/g, '<em class="italic text-gray-300">$1</em>');

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, _lang, code) => {
      return `<pre class="bg-gray-950 border border-gray-800 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm font-mono text-gray-300">${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-green-400 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>');

    // Lists
    html = html.replace(/^\s*[-*+]\s+(.*)$/gim, '<li class="ml-6 text-gray-300 list-disc">$1</li>');
    html = html.replace(/^\s*\d+\.\s+(.*)$/gim, '<li class="ml-6 text-gray-300 list-decimal">$1</li>');

    // Blockquotes
    html = html.replace(/^>\s+(.*)$/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 text-gray-400 italic">$1</blockquote>');

    // Horizontal rule
    html = html.replace(/^---$/gim, '<hr class="border-gray-700 my-6" />');

    // Paragraphs (lines separated by blank lines)
    const lines = html.split('\n');
    const paragraphs: string[] = [];
    let currentParagraph = '';

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Check if line is already wrapped in a tag
      const isWrapped = trimmedLine.match(/^<(h[1-6]|li|pre|blockquote|hr|div)/);

      if (isWrapped) {
        if (currentParagraph) {
          paragraphs.push(`<p class="text-gray-300 mb-4">${currentParagraph}</p>`);
          currentParagraph = '';
        }
        paragraphs.push(trimmedLine);
      } else if (trimmedLine === '') {
        if (currentParagraph) {
          paragraphs.push(`<p class="text-gray-300 mb-4">${currentParagraph}</p>`);
          currentParagraph = '';
        }
      } else {
        currentParagraph += (currentParagraph ? ' ' : '') + trimmedLine;
      }
    });

    if (currentParagraph) {
      paragraphs.push(`<p class="text-gray-300 mb-4">${currentParagraph}</p>`);
    }

    return paragraphs.join('\n');
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
    </div>
  );
};
