/**
 * Project Service for CCIDE
 * Manages project lists and state, syncing with markdown files
 */

import { Project } from '../types/models';
import { getDatabase, STORES } from './Database';

export class ProjectService {
  private db = getDatabase();
  private currentProjectId: string | null = null;

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
   * Create a new project
   */
  async createProject(
    name: string,
    description?: string,
    tags?: string[]
  ): Promise<Project> {
    const id = this.generateProjectId(name);
    const now = Date.now();

    const project: Project = {
      id,
      name,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      path: `/projects/${id}`,
      description,
      tags,
    };

    await this.db.add(STORES.PROJECTS, project);
    return project;
  }

  /**
   * Generate a unique project ID from name
   */
  private generateProjectId(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const timestamp = Date.now().toString(36);
    return `${base}-${timestamp}`;
  }

  /**
   * Get a project by ID
   */
  async getProject(id: string): Promise<Project | null> {
    const project = await this.db.get<Project>(STORES.PROJECTS, id);
    return project || null;
  }

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<Project[]> {
    return await this.db.getAll<Project>(STORES.PROJECTS);
  }

  /**
   * Get active projects
   */
  async getActiveProjects(): Promise<Project[]> {
    return await this.db.getByIndex<Project>(
      STORES.PROJECTS,
      'status',
      'active'
    );
  }

  /**
   * Get archived projects
   */
  async getArchivedProjects(): Promise<Project[]> {
    return await this.db.getByIndex<Project>(
      STORES.PROJECTS,
      'status',
      'archived'
    );
  }

  /**
   * Update a project
   */
  async updateProject(
    id: string,
    updates: Partial<Omit<Project, 'id' | 'createdAt'>>
  ): Promise<void> {
    const project = await this.getProject(id);
    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    const updatedProject: Project = {
      ...project,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.db.update(STORES.PROJECTS, updatedProject);
  }

  /**
   * Archive a project
   */
  async archiveProject(id: string): Promise<void> {
    await this.updateProject(id, { status: 'archived' });
  }

  /**
   * Unarchive a project
   */
  async unarchiveProject(id: string): Promise<void> {
    await this.updateProject(id, { status: 'active' });
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    await this.db.delete(STORES.PROJECTS, id);
  }

  /**
   * Set current active project
   */
  setCurrentProject(id: string | null): void {
    this.currentProjectId = id;
  }

  /**
   * Get current active project
   */
  getCurrentProjectId(): string | null {
    return this.currentProjectId;
  }

  /**
   * Get current active project
   */
  async getCurrentProject(): Promise<Project | null> {
    if (!this.currentProjectId) {
      return null;
    }
    return await this.getProject(this.currentProjectId);
  }

  /**
   * Search projects by name or description
   */
  async searchProjects(query: string): Promise<Project[]> {
    const allProjects = await this.getAllProjects();
    const lowerQuery = query.toLowerCase();
    return allProjects.filter(
      (project) =>
        project.name.toLowerCase().includes(lowerQuery) ||
        project.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get projects by tag
   */
  async getProjectsByTag(tag: string): Promise<Project[]> {
    const allProjects = await this.getAllProjects();
    return allProjects.filter((project) => project.tags?.includes(tag));
  }

  /**
   * Get all unique tags
   */
  async getAllTags(): Promise<string[]> {
    const allProjects = await this.getAllProjects();
    const tagsSet = new Set<string>();
    allProjects.forEach((project) => {
      project.tags?.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }

  /**
   * Get recently updated projects
   */
  async getRecentProjects(limit: number = 5): Promise<Project[]> {
    const allProjects = await this.getAllProjects();
    return allProjects
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  }

  /**
   * Export project list as markdown
   */
  async exportAsMarkdown(status: 'active' | 'archived'): Promise<string> {
    const projects =
      status === 'active'
        ? await this.getActiveProjects()
        : await this.getArchivedProjects();

    const lines = [
      `# ${status === 'active' ? 'Active' : 'Archived'} Projects`,
      '',
      ...projects.map((project) => {
        const date = new Date(project.updatedAt).toLocaleDateString();
        const desc = project.description ? ` - ${project.description}` : '';
        return `- [${project.name}](${project.path}) (${date})${desc}`;
      }),
    ];

    return lines.join('\n');
  }

  /**
   * Import projects from markdown content
   * Expected format: - [ProjectName](path) (date) - description
   */
  async importFromMarkdown(
    content: string,
    status: 'active' | 'archived'
  ): Promise<number> {
    const lines = content.split('\n');
    let imported = 0;

    for (const line of lines) {
      // Match markdown link format: - [Name](path)
      const match = line.match(/^-\s*\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        const [, name, path] = match;

        // Extract description if present
        const descMatch = line.match(/\).*?-\s*(.+)$/);
        const description = descMatch ? descMatch[1].trim() : undefined;

        // Check if project already exists
        const existingProjects = await this.searchProjects(name);
        if (existingProjects.length === 0) {
          const id = this.generateProjectId(name);
          const now = Date.now();

          const project: Project = {
            id,
            name,
            status,
            createdAt: now,
            updatedAt: now,
            path,
            description,
          };

          await this.db.add(STORES.PROJECTS, project);
          imported++;
        }
      }
    }

    return imported;
  }

  /**
   * Get project statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    archived: number;
  }> {
    const allProjects = await this.getAllProjects();
    const active = allProjects.filter((p) => p.status === 'active').length;
    const archived = allProjects.filter((p) => p.status === 'archived').length;

    return {
      total: allProjects.length,
      active,
      archived,
    };
  }

  /**
   * Bulk update project statuses
   */
  async bulkUpdateStatus(
    projectIds: string[],
    status: 'active' | 'archived'
  ): Promise<void> {
    for (const id of projectIds) {
      await this.updateProject(id, { status });
    }
  }

  /**
   * Clear all projects
   */
  async clearAll(): Promise<void> {
    await this.db.clear(STORES.PROJECTS);
    this.currentProjectId = null;
  }
}

// Singleton instance
let projectInstance: ProjectService | null = null;

/**
 * Get the project service instance
 */
export function getProjectService(): ProjectService {
  if (!projectInstance) {
    projectInstance = new ProjectService();
  }
  return projectInstance;
}
