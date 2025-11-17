import React, { useEffect, useState } from 'react';
import { FileNode } from '../../../types/ui';
import { FileMetadata } from './FileMetadata';
import { CodeHighlighter } from './CodeHighlighter';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FileText, AlertCircle } from 'lucide-react';

interface FilePreviewPanelProps {
  file: FileNode;
  content?: string;
  isNewlyGenerated?: boolean;
}

export const FilePreviewPanel: React.FC<FilePreviewPanelProps> = ({
  file,
  content,
  isNewlyGenerated = false,
}) => {
  const [fileContent, setFileContent] = useState<string>(content || '');
  const [isLoading, setIsLoading] = useState<boolean>(!content);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // Use content from file.content if available, then props content, then fetch
    if (file.content) {
      setFileContent(file.content);
      setIsLoading(false);
    } else if (content) {
      setFileContent(content);
      setIsLoading(false);
    } else if (file.type === 'file') {
      // In a real implementation, you'd fetch the file content here
      // For now, we'll simulate loading
      setIsLoading(true);
      setTimeout(() => {
        setFileContent('// File content would be loaded here\n// Path: ' + file.path);
        setIsLoading(false);
      }, 500);
    }
  }, [file, content]);

  const getFileExtension = (filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  };

  const getLanguageFromExtension = (ext: string): string => {
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'css': 'css',
      'html': 'html',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'md': 'markdown',
      'txt': 'plaintext',
    };
    return languageMap[ext] || 'plaintext';
  };

  const isCodeFile = (ext: string): boolean => {
    return ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'css', 'html', 'json', 'xml', 'yaml', 'yml', 'sql', 'sh', 'bash'].includes(ext);
  };

  const isMarkdownFile = (ext: string): boolean => {
    return ext === 'md';
  };

  const extension = getFileExtension(file.name);
  const language = getLanguageFromExtension(extension);

  if (file.type === 'folder') {
    return (
      <div className="h-full flex flex-col">
        <FileMetadata file={file} />
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Folder Preview</p>
            <p className="text-sm mt-2">
              Select a file to view its contents
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {isNewlyGenerated && (
        <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-400 font-medium">
            ✓ Newly generated file from the current phase
          </p>
        </div>
      )}

      <FileMetadata
        file={file}
        size={file.size || fileContent.length}
        lastModified={file.lastModified || new Date()}
      />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-sm">Loading file content...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium">Error Loading File</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {isMarkdownFile(extension) ? (
            <MarkdownRenderer content={fileContent} />
          ) : isCodeFile(extension) ? (
            <CodeHighlighter
              code={fileContent}
              language={language}
              showLineNumbers={true}
            />
          ) : (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                {fileContent}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
