/**
 * Project Folder Service for CCIDE
 * Manages project folder structures and file operations
 */

import { ProjectFile, ProjectFolder } from '../types/models';
import { getDatabase, STORES } from './Database';
import {
  getProjectSubfolderPath,
  getStandardProjectFolders,
  buildProjectFilePath,
  isValidFileName,
  getFileExtension,
  normalizePath,
  determineFileFolder,
} from '../utils/projectFileSystem';

export class ProjectFolderService {
  private db = getDatabase();

  constructor() {
    this.init();
  }

  /**
   * Initialize the service
   */
  private async init(): Promise<void> {
    await this.db.init();
  }

  /**
   * Create standard folder structure for a project
   */
  async createProjectFolders(projectId: string): Promise<ProjectFolder[]> {
    const folders: ProjectFolder[] = [];
    const now = Date.now();
    const standardFolders = getStandardProjectFolders();

    for (const folderName of standardFolders) {
      const path = getProjectSubfolderPath(projectId, folderName);
      const folder: ProjectFolder = {
        id: `${projectId}-${folderName}`,
        projectId,
        name: folderName,
        path,
        createdAt: now,
        fileCount: 0,
      };

      try {
        await this.db.add(STORES.PROJECT_FOLDERS, folder);
        folders.push(folder);
      } catch (error) {
        // Folder might already exist, skip
        console.warn(`Folder ${path} already exists`);
      }
    }

    return folders;
  }

  /**
   * Create a custom folder in a project
   */
  async createCustomFolder(
    projectId: string,
    folderName: string
  ): Promise<ProjectFolder> {
    const path = getProjectSubfolderPath(projectId, folderName);
    const now = Date.now();

    const folder: ProjectFolder = {
      id: `${projectId}-${folderName}`,
      projectId,
      name: folderName,
      path,
      createdAt: now,
      fileCount: 0,
    };

    await this.db.add(STORES.PROJECT_FOLDERS, folder);
    return folder;
  }

  /**
   * Get all folders for a project
   */
  async getProjectFolders(projectId: string): Promise<ProjectFolder[]> {
    return await this.db.getByIndex<ProjectFolder>(
      STORES.PROJECT_FOLDERS,
      'projectId',
      projectId
    );
  }

  /**
   * Get a folder by path
   */
  async getFolderByPath(path: string): Promise<ProjectFolder | undefined> {
    const normalizedPath = normalizePath(path);
    const folders = await this.db.getAll<ProjectFolder>(STORES.PROJECT_FOLDERS);
    return folders.find((f) => f.path === normalizedPath);
  }

  /**
   * Delete a folder (and all its files)
   */
  async deleteFolder(folderId: string): Promise<void> {
    const folder = await this.db.get<ProjectFolder>(STORES.PROJECT_FOLDERS, folderId);
    if (!folder) {
      throw new Error(`Folder ${folderId} not found`);
    }

    // Delete all files in this folder
    const files = await this.getFilesByFolder(folder.projectId, folder.name);
    for (const file of files) {
      await this.db.delete(STORES.PROJECT_FILES, file.id);
    }

    // Delete the folder
    await this.db.delete(STORES.PROJECT_FOLDERS, folderId);
  }

  /**
   * Add a file to a project
   */
  async addFile(
    projectId: string,
    fileName: string,
    content: string,
    options?: {
      folder?: string;
      fileType?: string;
      purpose?: string;
      tags?: string[];
      description?: string;
    }
  ): Promise<ProjectFile> {
    if (!isValidFileName(fileName)) {
      throw new Error(`Invalid file name: ${fileName}`);
    }

    const folder = options?.folder || determineFileFolder(fileName, options?.fileType, options?.purpose);
    const path = buildProjectFilePath(projectId, fileName, folder);
    const fileType = options?.fileType || getFileExtension(fileName);
    const now = Date.now();

    const file: ProjectFile = {
      id: `${projectId}-${folder}-${fileName}-${now}`,
      projectId,
      fileName,
      folder,
      path,
      content,
      fileType,
      size: content.length,
      createdAt: now,
      updatedAt: now,
      metadata: {
        purpose: options?.purpose,
        tags: options?.tags,
        description: options?.description,
      },
    };

    await this.db.add(STORES.PROJECT_FILES, file);

    // Update folder file count
    await this.updateFolderFileCount(projectId, folder);

    return file;
  }

  /**
   * Get a file by ID
   */
  async getFile(fileId: string): Promise<ProjectFile | undefined> {
    return await this.db.get<ProjectFile>(STORES.PROJECT_FILES, fileId);
  }

  /**
   * Get a file by path
   */
  async getFileByPath(path: string): Promise<ProjectFile | undefined> {
    const normalizedPath = normalizePath(path);
    const files = await this.db.getAll<ProjectFile>(STORES.PROJECT_FILES);
    return files.find((f) => f.path === normalizedPath);
  }

  /**
   * Get all files for a project
   */
  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    return await this.db.getByIndex<ProjectFile>(
      STORES.PROJECT_FILES,
      'projectId',
      projectId
    );
  }

  /**
   * Get files in a specific folder
   */
  async getFilesByFolder(projectId: string, folder: string): Promise<ProjectFile[]> {
    const allFiles = await this.getProjectFiles(projectId);
    return allFiles.filter((f) => f.folder === folder);
  }

  /**
   * Update a file's content
   */
  async updateFile(
    fileId: string,
    updates: {
      content?: string;
      fileName?: string;
      metadata?: ProjectFile['metadata'];
    }
  ): Promise<void> {
    const file = await this.getFile(fileId);
    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }

    const updatedFile: ProjectFile = {
      ...file,
      ...updates,
      size: updates.content ? updates.content.length : file.size,
      updatedAt: Date.now(),
    };

    // If file name changed, update the path
    if (updates.fileName && updates.fileName !== file.fileName) {
      updatedFile.path = buildProjectFilePath(
        file.projectId,
        updates.fileName,
        file.folder
      );
    }

    await this.db.update(STORES.PROJECT_FILES, updatedFile);
  }

  /**
   * Move a file to a different folder
   */
  async moveFile(fileId: string, targetFolder: string): Promise<void> {
    const file = await this.getFile(fileId);
    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }

    const oldFolder = file.folder;
    const newPath = buildProjectFilePath(file.projectId, file.fileName, targetFolder);

    const updatedFile: ProjectFile = {
      ...file,
      folder: targetFolder,
      path: newPath,
      updatedAt: Date.now(),
    };

    await this.db.update(STORES.PROJECT_FILES, updatedFile);

    // Update folder file counts
    await this.updateFolderFileCount(file.projectId, oldFolder);
    await this.updateFolderFileCount(file.projectId, targetFolder);
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    const file = await this.getFile(fileId);
    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }

    await this.db.delete(STORES.PROJECT_FILES, fileId);

    // Update folder file count
    await this.updateFolderFileCount(file.projectId, file.folder);
  }

  /**
   * Delete all files and folders for a project
   */
  async deleteProjectFiles(projectId: string): Promise<void> {
    // Delete all files
    const files = await this.getProjectFiles(projectId);
    for (const file of files) {
      await this.db.delete(STORES.PROJECT_FILES, file.id);
    }

    // Delete all folders
    const folders = await this.getProjectFolders(projectId);
    for (const folder of folders) {
      await this.db.delete(STORES.PROJECT_FOLDERS, folder.id);
    }
  }

  /**
   * Search files by name or content
   */
  async searchFiles(
    projectId: string,
    query: string,
    searchContent: boolean = false
  ): Promise<ProjectFile[]> {
    const allFiles = await this.getProjectFiles(projectId);
    const lowerQuery = query.toLowerCase();

    return allFiles.filter((file) => {
      const nameMatch = file.fileName.toLowerCase().includes(lowerQuery);
      const contentMatch = searchContent && file.content.toLowerCase().includes(lowerQuery);
      return nameMatch || contentMatch;
    });
  }

  /**
   * Get files by type
   */
  async getFilesByType(projectId: string, fileType: string): Promise<ProjectFile[]> {
    const allFiles = await this.getProjectFiles(projectId);
    return allFiles.filter((f) => f.fileType === fileType);
  }

  /**
   * Get files by tags
   */
  async getFilesByTag(projectId: string, tag: string): Promise<ProjectFile[]> {
    const allFiles = await this.getProjectFiles(projectId);
    return allFiles.filter((f) => f.metadata?.tags?.includes(tag));
  }

  /**
   * Get recently updated files
   */
  async getRecentFiles(projectId: string, limit: number = 10): Promise<ProjectFile[]> {
    const allFiles = await this.getProjectFiles(projectId);
    return allFiles
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    folderStats: { folder: string; fileCount: number; totalSize: number }[];
    fileTypeStats: { type: string; count: number }[];
  }> {
    const files = await this.getProjectFiles(projectId);
    const folders = await this.getProjectFolders(projectId);

    const totalFiles = files.length;
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    // Calculate folder stats
    const folderStats = folders.map((folder) => {
      const folderFiles = files.filter((f) => f.folder === folder.name);
      return {
        folder: folder.name,
        fileCount: folderFiles.length,
        totalSize: folderFiles.reduce((sum, f) => sum + f.size, 0),
      };
    });

    // Calculate file type stats
    const typeMap = new Map<string, number>();
    files.forEach((file) => {
      typeMap.set(file.fileType, (typeMap.get(file.fileType) || 0) + 1);
    });
    const fileTypeStats = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    return {
      totalFiles,
      totalSize,
      folderStats,
      fileTypeStats,
    };
  }

  /**
   * Update folder file count
   */
  private async updateFolderFileCount(projectId: string, folderName: string): Promise<void> {
    const folderId = `${projectId}-${folderName}`;
    const folder = await this.db.get<ProjectFolder>(STORES.PROJECT_FOLDERS, folderId);

    if (folder) {
      const files = await this.getFilesByFolder(projectId, folderName);
      folder.fileCount = files.length;
      await this.db.update(STORES.PROJECT_FOLDERS, folder);
    }
  }

  /**
   * Bulk add files
   */
  async bulkAddFiles(
    projectId: string,
    files: Array<{
      fileName: string;
      content: string;
      folder?: string;
      fileType?: string;
      purpose?: string;
    }>
  ): Promise<ProjectFile[]> {
    const addedFiles: ProjectFile[] = [];

    for (const fileData of files) {
      const file = await this.addFile(projectId, fileData.fileName, fileData.content, {
        folder: fileData.folder,
        fileType: fileData.fileType,
        purpose: fileData.purpose,
      });
      addedFiles.push(file);
    }

    return addedFiles;
  }

  /**
   * Export project files as a JSON structure
   */
  async exportProjectFiles(projectId: string): Promise<string> {
    const files = await this.getProjectFiles(projectId);
    const folders = await this.getProjectFolders(projectId);

    const exportData = {
      projectId,
      folders: folders.map((f) => ({
        name: f.name,
        path: f.path,
        fileCount: f.fileCount,
      })),
      files: files.map((f) => ({
        fileName: f.fileName,
        folder: f.folder,
        path: f.path,
        content: f.content,
        fileType: f.fileType,
        metadata: f.metadata,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import project files from JSON
   */
  async importProjectFiles(
    projectId: string,
    jsonData: string
  ): Promise<{ filesImported: number; foldersCreated: number }> {
    const data = JSON.parse(jsonData);
    let filesImported = 0;
    let foldersCreated = 0;

    // Create folders if they don't exist
    for (const folderData of data.folders || []) {
      try {
        await this.createCustomFolder(projectId, folderData.name);
        foldersCreated++;
      } catch (error) {
        // Folder might already exist
      }
    }

    // Import files
    for (const fileData of data.files || []) {
      try {
        await this.addFile(projectId, fileData.fileName, fileData.content, {
          folder: fileData.folder,
          fileType: fileData.fileType,
          purpose: fileData.metadata?.purpose,
          tags: fileData.metadata?.tags,
          description: fileData.metadata?.description,
        });
        filesImported++;
      } catch (error) {
        console.error(`Failed to import file ${fileData.fileName}:`, error);
      }
    }

    return { filesImported, foldersCreated };
  }
}

// Singleton instance
let folderServiceInstance: ProjectFolderService | null = null;

/**
 * Get the project folder service instance
 */
export function getProjectFolderService(): ProjectFolderService {
  if (!folderServiceInstance) {
    folderServiceInstance = new ProjectFolderService();
  }
  return folderServiceInstance;
}
