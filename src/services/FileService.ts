/**
 * File Service for CCIDE
 * Manages project file trees and file operations
 *
 * @description
 * This service handles all file system operations including:
 * - Loading and generating file trees
 * - Adding/removing files and folders
 * - Counting and searching files
 * - File type detection and categorization
 *
 * @security
 * All file operations validate inputs to prevent path traversal attacks
 * and other security vulnerabilities.
 */

import { FileNode } from '../types/ui';

/**
 * Maximum allowed filename length (standard across most filesystems)
 * @constant
 */
const MAX_FILENAME_LENGTH = 255;

/**
 * Regular expression to detect path traversal attempts
 * @constant
 */
const PATH_TRAVERSAL_REGEX = /\.\.|\/|\\|\0/;

export class FileService {
  /**
   * Validates a filename for security and correctness
   *
   * @param filename - The filename to validate
   * @throws {Error} If filename contains invalid characters or is too long
   * @private
   *
   * @security
   * Prevents path traversal attacks by rejecting:
   * - Parent directory references (..)
   * - Path separators (/, \)
   * - Null bytes (\0)
   * - Excessively long names (>255 characters)
   */
  private validateFilename(filename: string): void {
    if (!filename || filename.trim().length === 0) {
      throw new Error('Filename cannot be empty');
    }

    if (filename.length > MAX_FILENAME_LENGTH) {
      throw new Error(`Filename too long (max ${MAX_FILENAME_LENGTH} characters)`);
    }

    if (PATH_TRAVERSAL_REGEX.test(filename)) {
      throw new Error('Invalid filename: contains forbidden characters');
    }
  }

  /**
   * Generate a mock file tree for a project
   *
   * @param projectId - Unique identifier for the project
   * @returns Promise resolving to an array of root FileNodes
   *
   * @remarks
   * In development, this returns mock data.
   * In production, this should integrate with actual file system.
   *
   * @example
   * ```typescript
   * const fileService = getFileService();
   * const tree = await fileService.getProjectFileTree('project-123');
   * console.log(tree); // Array of FileNode objects
   * ```
   */
  async getProjectFileTree(projectId: string): Promise<FileNode[]> {
    // Simulate async file system operation
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Return a mock file tree structure
    return [
      {
        id: `${projectId}-root`,
        name: 'project-root',
        path: `/projects/${projectId}`,
        type: 'folder',
        isExpanded: true,
        children: [
          {
            id: `${projectId}-docs`,
            name: 'docs',
            path: `/projects/${projectId}/docs`,
            type: 'folder',
            isExpanded: false,
            children: [
              {
                id: `${projectId}-docs-readme`,
                name: 'README.md',
                path: `/projects/${projectId}/docs/README.md`,
                type: 'file',
              },
              {
                id: `${projectId}-docs-spec`,
                name: 'specification.md',
                path: `/projects/${projectId}/docs/specification.md`,
                type: 'file',
              },
              {
                id: `${projectId}-docs-arch`,
                name: 'architecture.md',
                path: `/projects/${projectId}/docs/architecture.md`,
                type: 'file',
              },
            ],
          },
          {
            id: `${projectId}-src`,
            name: 'src',
            path: `/projects/${projectId}/src`,
            type: 'folder',
            isExpanded: false,
            children: [
              {
                id: `${projectId}-src-components`,
                name: 'components',
                path: `/projects/${projectId}/src/components`,
                type: 'folder',
                isExpanded: false,
                children: [
                  {
                    id: `${projectId}-src-components-app`,
                    name: 'App.tsx',
                    path: `/projects/${projectId}/src/components/App.tsx`,
                    type: 'file',
                  },
                  {
                    id: `${projectId}-src-components-header`,
                    name: 'Header.tsx',
                    path: `/projects/${projectId}/src/components/Header.tsx`,
                    type: 'file',
                  },
                  {
                    id: `${projectId}-src-components-sidebar`,
                    name: 'Sidebar.tsx',
                    path: `/projects/${projectId}/src/components/Sidebar.tsx`,
                    type: 'file',
                  },
                ],
              },
              {
                id: `${projectId}-src-pages`,
                name: 'pages',
                path: `/projects/${projectId}/src/pages`,
                type: 'folder',
                isExpanded: false,
                children: [
                  {
                    id: `${projectId}-src-pages-home`,
                    name: 'Home.tsx',
                    path: `/projects/${projectId}/src/pages/Home.tsx`,
                    type: 'file',
                  },
                  {
                    id: `${projectId}-src-pages-about`,
                    name: 'About.tsx',
                    path: `/projects/${projectId}/src/pages/About.tsx`,
                    type: 'file',
                  },
                ],
              },
              {
                id: `${projectId}-src-utils`,
                name: 'utils',
                path: `/projects/${projectId}/src/utils`,
                type: 'folder',
                isExpanded: false,
                children: [
                  {
                    id: `${projectId}-src-utils-helpers`,
                    name: 'helpers.ts',
                    path: `/projects/${projectId}/src/utils/helpers.ts`,
                    type: 'file',
                  },
                  {
                    id: `${projectId}-src-utils-constants`,
                    name: 'constants.ts',
                    path: `/projects/${projectId}/src/utils/constants.ts`,
                    type: 'file',
                  },
                ],
              },
              {
                id: `${projectId}-src-index`,
                name: 'index.tsx',
                path: `/projects/${projectId}/src/index.tsx`,
                type: 'file',
              },
              {
                id: `${projectId}-src-app`,
                name: 'App.css',
                path: `/projects/${projectId}/src/App.css`,
                type: 'file',
              },
            ],
          },
          {
            id: `${projectId}-public`,
            name: 'public',
            path: `/projects/${projectId}/public`,
            type: 'folder',
            isExpanded: false,
            children: [
              {
                id: `${projectId}-public-index`,
                name: 'index.html',
                path: `/projects/${projectId}/public/index.html`,
                type: 'file',
              },
              {
                id: `${projectId}-public-favicon`,
                name: 'favicon.ico',
                path: `/projects/${projectId}/public/favicon.ico`,
                type: 'file',
              },
            ],
          },
          {
            id: `${projectId}-package`,
            name: 'package.json',
            path: `/projects/${projectId}/package.json`,
            type: 'file',
          },
          {
            id: `${projectId}-tsconfig`,
            name: 'tsconfig.json',
            path: `/projects/${projectId}/tsconfig.json`,
            type: 'file',
          },
          {
            id: `${projectId}-gitignore`,
            name: '.gitignore',
            path: `/projects/${projectId}/.gitignore`,
            type: 'file',
          },
        ],
      },
    ];
  }

  /**
   * Get file extension from filename
   *
   * @param filename - The name of the file
   * @returns The file extension in lowercase (without dot), or empty string if none
   *
   * @example
   * ```typescript
   * getFileExtension('test.tsx') // 'tsx'
   * getFileExtension('README')   // ''
   * getFileExtension('file.test.ts') // 'ts'
   * ```
   */
  getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1]!.toLowerCase() : '';
  }

  /**
   * Get file type category based on extension
   *
   * @param filename - The name of the file
   * @returns Category string (e.g., 'typescript', 'image', 'markdown')
   *
   * @remarks
   * Used for determining appropriate icons and syntax highlighting.
   * Falls back to 'file' for unknown extensions.
   *
   * @example
   * ```typescript
   * getFileType('App.tsx')      // 'typescript'
   * getFileType('logo.png')     // 'image'
   * getFileType('README.md')    // 'markdown'
   * getFileType('unknown.xyz')  // 'file'
   * ```
   */
  getFileType(filename: string): string {
    const ext = this.getFileExtension(filename);

    const typeMap: Record<string, string> = {
      // Code files
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',

      // Web files
      html: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      less: 'less',

      // Config files
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      toml: 'toml',
      xml: 'xml',

      // Docs
      md: 'markdown',
      mdx: 'markdown',
      txt: 'text',

      // Images
      png: 'image',
      jpg: 'image',
      jpeg: 'image',
      gif: 'image',
      svg: 'image',
      webp: 'image',

      // Other
      pdf: 'pdf',
      zip: 'archive',
      tar: 'archive',
      gz: 'archive',
    };

    return typeMap[ext] || 'file';
  }

  /**
   * Add a new file to the tree
   *
   * @param tree - Current file tree
   * @param parentPath - Path of the parent folder
   * @param filename - Name of the new file
   * @returns Updated file tree with new file added
   * @throws {Error} If filename is invalid or parent folder not found
   *
   * @security
   * Validates filename to prevent path traversal attacks
   *
   * @example
   * ```typescript
   * const updatedTree = await fileService.addFile(
   *   currentTree,
   *   '/project/src',
   *   'newFile.ts'
   * );
   * ```
   */
  async addFile(
    tree: FileNode[],
    parentPath: string,
    filename: string
  ): Promise<FileNode[]> {
    // Validate filename for security
    this.validateFilename(filename);

    const newFile: FileNode = {
      id: `${parentPath}-${filename}-${Date.now()}`,
      name: filename,
      path: `${parentPath}/${filename}`,
      type: 'file',
    };

    const addToNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.path === parentPath && node.type === 'folder') {
          return {
            ...node,
            children: [...(node.children || []), newFile],
          };
        }
        if (node.children) {
          return {
            ...node,
            children: addToNode(node.children),
          };
        }
        return node;
      });
    };

    return addToNode(tree);
  }

  /**
   * Add a new folder to the tree
   *
   * @param tree - Current file tree
   * @param parentPath - Path of the parent folder
   * @param folderName - Name of the new folder
   * @returns Updated file tree with new folder added
   * @throws {Error} If folder name is invalid or parent folder not found
   *
   * @security
   * Validates folder name to prevent path traversal attacks
   *
   * @example
   * ```typescript
   * const updatedTree = await fileService.addFolder(
   *   currentTree,
   *   '/project/src',
   *   'components'
   * );
   * ```
   */
  async addFolder(
    tree: FileNode[],
    parentPath: string,
    folderName: string
  ): Promise<FileNode[]> {
    // Validate folder name for security
    this.validateFilename(folderName);

    const newFolder: FileNode = {
      id: `${parentPath}-${folderName}-${Date.now()}`,
      name: folderName,
      path: `${parentPath}/${folderName}`,
      type: 'folder',
      isExpanded: false,
      children: [],
    };

    const addToNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.path === parentPath && node.type === 'folder') {
          return {
            ...node,
            children: [...(node.children || []), newFolder],
          };
        }
        if (node.children) {
          return {
            ...node,
            children: addToNode(node.children),
          };
        }
        return node;
      });
    };

    return addToNode(tree);
  }

  /**
   * Count total files in tree
   *
   * @param tree - File tree to count files in
   * @returns Total number of files (not folders)
   *
   * @remarks
   * Recursively counts all files in the tree, including nested files.
   * Does not count folders.
   *
   * @performance
   * O(n) where n is the total number of nodes in the tree
   */
  countFiles(tree: FileNode[]): number {
    let count = 0;

    const countNode = (node: FileNode) => {
      if (node.type === 'file') {
        count++;
      }
      if (node.children) {
        node.children.forEach(countNode);
      }
    };

    tree.forEach(countNode);
    return count;
  }

  /**
   * Count total folders in tree
   *
   * @param tree - File tree to count folders in
   * @returns Total number of folders (not files)
   *
   * @remarks
   * Recursively counts all folders in the tree, including nested folders.
   * Does not count files.
   *
   * @performance
   * O(n) where n is the total number of nodes in the tree
   */
  countFolders(tree: FileNode[]): number {
    let count = 0;

    const countNode = (node: FileNode) => {
      if (node.type === 'folder') {
        count++;
      }
      if (node.children) {
        node.children.forEach(countNode);
      }
    };

    tree.forEach(countNode);
    return count;
  }

  /**
   * Search files by name
   *
   * @param tree - File tree to search in
   * @param query - Search query string (case-insensitive)
   * @returns Array of matching file nodes
   *
   * @remarks
   * Performs case-insensitive substring match on file names.
   * Returns all matching files from the entire tree.
   *
   * @performance
   * O(n) where n is the total number of nodes in the tree
   *
   * @example
   * ```typescript
   * const results = fileService.searchFiles(tree, 'component');
   * // Returns all files with 'component' in their name
   * ```
   */
  searchFiles(tree: FileNode[], query: string): FileNode[] {
    const results: FileNode[] = [];
    const lowerQuery = query.toLowerCase();

    const searchNode = (node: FileNode) => {
      if (node.name.toLowerCase().includes(lowerQuery)) {
        results.push(node);
      }
      if (node.children) {
        node.children.forEach(searchNode);
      }
    };

    tree.forEach(searchNode);
    return results;
  }
}

// Singleton instance
let fileServiceInstance: FileService | null = null;

/**
 * Get the file service instance
 */
export function getFileService(): FileService {
  if (!fileServiceInstance) {
    fileServiceInstance = new FileService();
  }
  return fileServiceInstance;
}
