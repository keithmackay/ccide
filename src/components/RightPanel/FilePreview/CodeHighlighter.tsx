import React from 'react';

interface CodeHighlighterProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export const CodeHighlighter: React.FC<CodeHighlighterProps> = ({
  code,
  language = 'plaintext',
  showLineNumbers = true,
}) => {
  const lines = code.split('\n');

  // Simple syntax highlighting for common languages
  const highlightLine = (line: string, lang: string): React.ReactNode => {
    // For now, return plain text with basic styling
    // In a real implementation, you'd use a library like Prism.js or highlight.js

    // Basic keyword highlighting for common languages
    const keywords: Record<string, string[]> = {
      javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await'],
      typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'interface', 'type', 'enum'],
      python: ['def', 'class', 'return', 'if', 'else', 'elif', 'for', 'while', 'import', 'from', 'async', 'await', 'with', 'as'],
      jsx: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await'],
      tsx: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'interface', 'type', 'enum'],
    };

    const langKeywords = keywords[lang.toLowerCase()] || [];

    // Simple regex-based highlighting
    let highlighted = line;

    // Highlight strings
    highlighted = highlighted.replace(
      /(['"`])((?:\\.|(?!\1).)*?)\1/g,
      '<span class="text-green-400">$1$2$1</span>'
    );

    // Highlight comments
    if (lang === 'javascript' || lang === 'typescript' || lang === 'jsx' || lang === 'tsx') {
      highlighted = highlighted.replace(
        /(\/\/.*$)/,
        '<span class="text-gray-500 italic">$1</span>'
      );
    } else if (lang === 'python') {
      highlighted = highlighted.replace(
        /(#.*$)/,
        '<span class="text-gray-500 italic">$1</span>'
      );
    }

    // Highlight keywords
    langKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
      highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>');
    });

    // Highlight numbers
    highlighted = highlighted.replace(
      /\b(\d+\.?\d*)\b/g,
      '<span class="text-yellow-400">$1</span>'
    );

    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2">
        <span className="text-xs font-medium text-gray-400 uppercase">
          {language}
        </span>
      </div>
      <div className="overflow-x-auto">
        <pre className="p-4">
          <code className="text-sm font-mono">
            {lines.map((line, index) => (
              <div
                key={index}
                className="flex hover:bg-gray-900/50 transition-colors"
              >
                {showLineNumbers && (
                  <span className="text-gray-600 select-none w-12 flex-shrink-0 text-right pr-4">
                    {index + 1}
                  </span>
                )}
                <span className="text-gray-300 flex-1">
                  {highlightLine(line, language)}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};
