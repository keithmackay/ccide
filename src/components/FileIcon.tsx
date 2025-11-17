/**
 * FileIcon Component
 * Displays appropriate icon based on file type
 *
 * @description
 * Automatically selects and displays the appropriate icon for a file based on its extension.
 * Supports color coding for different file types:
 * - Blue: Code files (ts, js, py, etc.)
 * - Purple: Markup/Style files (html, css, scss)
 * - Yellow: Config files (json, yaml, xml)
 * - Green: Documentation (md, txt, doc)
 * - Pink: Images (png, jpg, svg)
 * - Orange: Archives (zip, tar, gz)
 * - Cyan: Special files (.gitignore, .env, Dockerfile)
 * - Gray: Unknown files
 *
 * @component
 * @example
 * ```tsx
 * <FileIcon filename="App.tsx" className="w-5 h-5" />
 * <FileIcon filename="config.json" />
 * <FileIcon filename="logo.png" className="w-6 h-6" />
 * ```
 */

import React from 'react';
import {
  File,
  FileText,
  FileCode,
  FileJson,
  Image,
  FileArchive,
  Settings,
} from 'lucide-react';

/**
 * Props for the FileIcon component
 */
interface FileIconProps {
  /** The filename (including extension) to determine the icon */
  filename: string;
  /** Optional CSS classes for the icon (default: 'w-4 h-4') */
  className?: string;
}

/**
 * FileIcon component
 * Displays an icon representing the file type based on its extension
 */
export const FileIcon: React.FC<FileIconProps> = ({ filename, className = 'w-4 h-4' }) => {
  const getIconForFile = () => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    // Code files - blue
    if (['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'rb', 'php'].includes(ext)) {
      return <FileCode className={`${className} text-blue-400`} />;
    }

    // Markup/Style files - purple
    if (['html', 'css', 'scss', 'sass', 'less'].includes(ext)) {
      return <FileCode className={`${className} text-purple-400`} />;
    }

    // Config files - yellow
    if (['json', 'yaml', 'yml', 'toml', 'xml', 'config'].includes(ext)) {
      return <FileJson className={`${className} text-yellow-400`} />;
    }

    // Documentation - green
    if (['md', 'mdx', 'txt', 'doc', 'docx'].includes(ext)) {
      return <FileText className={`${className} text-green-400`} />;
    }

    // Images - pink
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
      return <Image className={`${className} text-pink-400`} />;
    }

    // Archives - orange
    if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
      return <FileArchive className={`${className} text-orange-400`} />;
    }

    // Special files - cyan
    if (filename.startsWith('.') || ['gitignore', 'env', 'dockerfile'].includes(filename.toLowerCase())) {
      return <Settings className={`${className} text-cyan-400`} />;
    }

    // Default - gray
    return <File className={`${className} text-gray-400`} />;
  };

  return getIconForFile();
};
