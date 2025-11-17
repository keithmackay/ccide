/**
 * Project File System Utilities
 * Provides utilities for managing project folder structures and file paths
 */

/**
 * Convert a project name to a valid folder name
 * Replaces spaces and special characters with dashes
 */
export function projectNameToFolderName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Get the base project folder path
 */
export function getProjectBasePath(projectId: string): string {
  return `/projects/${projectId}`;
}

/**
 * Get the full path for a project subfolder
 */
export function getProjectSubfolderPath(projectId: string, subfolder: string): string {
  return `${getProjectBasePath(projectId)}/${subfolder}`;
}

/**
 * Standard project folder structure
 */
export const PROJECT_FOLDERS = {
  DOCS: 'docs',
  COMPONENTS: 'components',
  PAGES: 'pages',
  SRC: 'src',
  ASSETS: 'assets',
  TESTS: 'tests',
} as const;

/**
 * Get all standard project folders
 */
export function getStandardProjectFolders(): string[] {
  return Object.values(PROJECT_FOLDERS);
}

/**
 * Determine the appropriate folder for a file based on its type/purpose
 */
export function determineFileFolder(
  fileName: string,
  fileType?: string,
  filePurpose?: string
): string {
  // Check by explicit purpose first
  if (filePurpose) {
    const purposeMap: Record<string, string> = {
      documentation: PROJECT_FOLDERS.DOCS,
      component: PROJECT_FOLDERS.COMPONENTS,
      page: PROJECT_FOLDERS.PAGES,
      source: PROJECT_FOLDERS.SRC,
      asset: PROJECT_FOLDERS.ASSETS,
      test: PROJECT_FOLDERS.TESTS,
    };
    const purposeFolder = purposeMap[filePurpose.toLowerCase()];
    if (purposeFolder) {
      return purposeFolder;
    }
  }

  // Check by file type
  if (fileType) {
    const typeMap: Record<string, string> = {
      markdown: PROJECT_FOLDERS.DOCS,
      md: PROJECT_FOLDERS.DOCS,
      txt: PROJECT_FOLDERS.DOCS,
      pdf: PROJECT_FOLDERS.DOCS,
      tsx: PROJECT_FOLDERS.COMPONENTS,
      jsx: PROJECT_FOLDERS.COMPONENTS,
      ts: PROJECT_FOLDERS.SRC,
      js: PROJECT_FOLDERS.SRC,
      css: PROJECT_FOLDERS.SRC,
      scss: PROJECT_FOLDERS.SRC,
      png: PROJECT_FOLDERS.ASSETS,
      jpg: PROJECT_FOLDERS.ASSETS,
      jpeg: PROJECT_FOLDERS.ASSETS,
      svg: PROJECT_FOLDERS.ASSETS,
      gif: PROJECT_FOLDERS.ASSETS,
      test: PROJECT_FOLDERS.TESTS,
      spec: PROJECT_FOLDERS.TESTS,
    };
    const typeFolder = typeMap[fileType.toLowerCase()];
    if (typeFolder) {
      return typeFolder;
    }
  }

  // Check by file name patterns
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes('.test.') || lowerName.includes('.spec.')) {
    return PROJECT_FOLDERS.TESTS;
  }
  if (lowerName.includes('component') || lowerName.endsWith('.tsx') || lowerName.endsWith('.jsx')) {
    return PROJECT_FOLDERS.COMPONENTS;
  }
  if (lowerName.endsWith('.md') || lowerName.endsWith('.txt')) {
    return PROJECT_FOLDERS.DOCS;
  }
  if (
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.svg') ||
    lowerName.endsWith('.gif')
  ) {
    return PROJECT_FOLDERS.ASSETS;
  }

  // Default to src folder
  return PROJECT_FOLDERS.SRC;
}

/**
 * Build a complete file path within a project
 */
export function buildProjectFilePath(
  projectId: string,
  fileName: string,
  folder?: string
): string {
  const targetFolder = folder || determineFileFolder(fileName);
  return `${getProjectSubfolderPath(projectId, targetFolder)}/${fileName}`;
}

/**
 * Parse a file path into its components
 */
export interface ParsedFilePath {
  projectId: string;
  folder: string;
  fileName: string;
  fullPath: string;
}

export function parseProjectFilePath(path: string): ParsedFilePath | null {
  // Expected format: /projects/{projectId}/{folder}/{fileName}
  const match = path.match(/^\/projects\/([^/]+)\/([^/]+)\/(.+)$/);
  if (!match) {
    return null;
  }

  const [, projectId, folder, fileName] = match;
  return {
    projectId: projectId!,
    folder: folder!,
    fileName: fileName!,
    fullPath: path,
  };
}

/**
 * Validate a project folder name
 */
export function isValidFolderName(folderName: string): boolean {
  const standardFolders = getStandardProjectFolders();
  return standardFolders.includes(folderName) || /^[a-z0-9-_]+$/.test(folderName);
}

/**
 * Validate a file name
 */
export function isValidFileName(fileName: string): boolean {
  // Allow alphanumeric, dashes, underscores, and dots
  // Must not start with a dot (hidden files)
  return /^[a-zA-Z0-9][a-zA-Z0-9-_.]*$/.test(fileName);
}

/**
 * Get file extension from file name
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1]! : '';
}

/**
 * Check if a path is within a project
 */
export function isProjectPath(path: string, projectId: string): boolean {
  const basePath = getProjectBasePath(projectId);
  return path.startsWith(basePath);
}

/**
 * Normalize a path (remove double slashes, trailing slashes, etc.)
 */
export function normalizePath(path: string): string {
  return path
    .replace(/\/+/g, '/') // Replace multiple slashes with single
    .replace(/\/$/, '') // Remove trailing slash
    .replace(/^\//, '/'); // Ensure leading slash
}
