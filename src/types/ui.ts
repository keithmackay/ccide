/**
 * CCIDE UI Type Definitions
 * TypeScript interfaces for UI components and state
 */

export type PanelMode = 'projects' | 'conversation' | 'files';

export interface Project {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  projectId: string;
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isExpanded?: boolean;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
}

export interface ContextUsage {
  used: number;
  total: number;
  percentage: number;
}

export interface AppState {
  // Panel state
  leftPanelMode: PanelMode;
  isLeftPanelVisible: boolean;
  isRightPanelVisible: boolean;

  // Active selections
  activeProject: Project | null;
  selectedFile: FileNode | null;

  // Projects
  activeProjects: Project[];
  archivedProjects: Project[];

  // Conversation
  messages: Message[];
  selectedModel: LLMModel | null;
  availableModels: LLMModel[];
  contextUsage: ContextUsage | null;

  // Files
  fileTree: FileNode[];

  // Right panel
  rightPanelContent: string;
  rightPanelHeader: string;
  availableFiles: string[];

  // Actions
  setLeftPanelMode: (mode: PanelMode) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setActiveProject: (project: Project | null) => void;
  setSelectedFile: (file: FileNode | null) => void;
  addProject: (project: Project) => void;
  archiveProject: (projectId: string) => void;
  unarchiveProject: (projectId: string) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setSelectedModel: (model: LLMModel | null) => void;
  setFileTree: (tree: FileNode[]) => void;
  toggleFileExpanded: (fileId: string) => void;
  setRightPanelContent: (content: string, header: string) => void;
  setAvailableFiles: (files: string[]) => void;
}
