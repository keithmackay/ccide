/**
 * File Preview Utilities
 * Helper functions for file preview and content handling
 */

import { FileNode, PhaseDeliverable } from '../types/ui';

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Get language identifier from file extension
 */
export function getLanguageFromExtension(ext: string): string {
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
}

/**
 * Check if file extension is a code file
 */
export function isCodeFile(ext: string): boolean {
  return [
    'js', 'jsx', 'ts', 'tsx',
    'py', 'java', 'cpp', 'c',
    'css', 'html', 'json',
    'xml', 'yaml', 'yml', 'sql',
    'sh', 'bash'
  ].includes(ext);
}

/**
 * Check if file extension is a markdown file
 */
export function isMarkdownFile(ext: string): boolean {
  return ext === 'md';
}

/**
 * Check if file extension is an image file
 */
export function isImageFile(ext: string): boolean {
  return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Convert PhaseDeliverable to FileNode
 */
export function deliverableToFileNode(deliverable: PhaseDeliverable): FileNode {
  return {
    id: deliverable.path,
    name: deliverable.name,
    path: deliverable.path,
    type: 'file',
    content: deliverable.preview,
    size: deliverable.size || (deliverable.preview?.length || 0),
    lastModified: deliverable.lastModified || new Date(),
  };
}

/**
 * Mark deliverables as newly generated
 */
export function markDeliverablesAsNew(
  deliverables: PhaseDeliverable[]
): PhaseDeliverable[] {
  return deliverables.map(d => ({
    ...d,
    isNewlyGenerated: true,
    lastModified: d.lastModified || new Date(),
  }));
}

/**
 * Filter deliverables by type
 */
export function filterDeliverablesByType(
  deliverables: PhaseDeliverable[],
  type: 'document' | 'code' | 'diagram'
): PhaseDeliverable[] {
  return deliverables.filter(d => d.type === type);
}

/**
 * Get file icon color based on type
 */
export function getFileIconColor(type: string): string {
  switch (type) {
    case 'code':
      return 'text-blue-400';
    case 'diagram':
      return 'text-purple-400';
    case 'document':
      return 'text-green-400';
    default:
      return 'text-gray-400';
  }
}

/**
 * Get file type label
 */
export function getFileTypeLabel(type: string): string {
  switch (type) {
    case 'code':
      return 'Code File';
    case 'diagram':
      return 'Diagram';
    case 'document':
      return 'Document';
    default:
      return 'File';
  }
}

/**
 * Search files by name
 */
export function searchFiles(
  nodes: FileNode[],
  query: string
): FileNode[] {
  const results: FileNode[] = [];
  const lowerQuery = query.toLowerCase();

  const searchNode = (node: FileNode) => {
    if (node.name.toLowerCase().includes(lowerQuery) ||
        node.path.toLowerCase().includes(lowerQuery)) {
      results.push(node);
    }
    if (node.children) {
      node.children.forEach(searchNode);
    }
  };

  nodes.forEach(searchNode);
  return results;
}
