import { create } from 'zustand';
import { AppState, Project, Message, FileNode, LLMModel, PanelMode, RightPanelMode } from '../types/ui';

export const useAppStore = create<AppState>((set) => ({
  // Initial panel state
  leftPanelMode: 'projects',
  isLeftPanelVisible: true,
  isRightPanelVisible: true,

  // Initial selections
  activeProject: null,
  selectedFile: null,

  // Initial projects
  activeProjects: [],
  archivedProjects: [],

  // Initial conversation
  messages: [],
  selectedModel: null,
  availableModels: [],
  contextUsage: null,

  // Initial files
  fileTree: [],

  // Initial right panel
  rightPanelMode: 'content',
  rightPanelContent: '',
  rightPanelHeader: 'Welcome to CCIDE',
  availableFiles: [],

  // Actions
  setLeftPanelMode: (mode: PanelMode) =>
    set({ leftPanelMode: mode }),

  setRightPanelMode: (mode: RightPanelMode) =>
    set({ rightPanelMode: mode }),

  toggleLeftPanel: () =>
    set((state) => ({ isLeftPanelVisible: !state.isLeftPanelVisible })),

  toggleRightPanel: () =>
    set((state) => ({ isRightPanelVisible: !state.isRightPanelVisible })),

  setActiveProject: (project: Project | null) =>
    set({
      activeProject: project,
      leftPanelMode: project ? 'conversation' : 'projects'
    }),

  setSelectedFile: (file: FileNode | null) =>
    set({ selectedFile: file }),

  addProject: (project: Project) =>
    set((state) => ({
      activeProjects: [...state.activeProjects, project],
    })),

  archiveProject: (projectId: string) =>
    set((state) => {
      const project = state.activeProjects.find((p) => p.id === projectId);
      if (!project) return state;

      return {
        activeProjects: state.activeProjects.filter((p) => p.id !== projectId),
        archivedProjects: [
          ...state.archivedProjects,
          { ...project, isArchived: true },
        ],
      };
    }),

  unarchiveProject: (projectId: string) =>
    set((state) => {
      const project = state.archivedProjects.find((p) => p.id === projectId);
      if (!project) return state;

      return {
        archivedProjects: state.archivedProjects.filter(
          (p) => p.id !== projectId
        ),
        activeProjects: [
          ...state.activeProjects,
          { ...project, isArchived: false },
        ],
      };
    }),

  addMessage: (message: Message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages: Message[]) =>
    set({ messages }),

  setSelectedModel: (model: LLMModel | null) =>
    set({ selectedModel: model }),

  setAvailableModels: (models: LLMModel[]) =>
    set({ availableModels: models }),

  setFileTree: (tree: FileNode[]) =>
    set({ fileTree: tree }),

  toggleFileExpanded: (fileId: string) =>
    set((state) => {
      const toggleNode = (nodes: FileNode[]): FileNode[] =>
        nodes.map((node) => {
          if (node.id === fileId) {
            return { ...node, isExpanded: !node.isExpanded };
          }
          if (node.children) {
            return { ...node, children: toggleNode(node.children) };
          }
          return node;
        });

      return { fileTree: toggleNode(state.fileTree) };
    }),

  setRightPanelContent: (content: string, header: string) =>
    set({ rightPanelContent: content, rightPanelHeader: header }),

  setAvailableFiles: (files: string[]) =>
    set({ availableFiles: files }),
}));
