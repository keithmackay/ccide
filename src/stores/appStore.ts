import { create } from 'zustand';
import { AppState, Project, Message, FileNode, LLMModel, PanelMode, RightPanelMode, PhaseInfo, PhaseStatus, PhaseDeliverable } from '../types/ui';
import { getProjectService } from '../services/ProjectService';

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

  // Initial phase tracking
  currentPhase: null,

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
    set((state) => {
      // Persist to database
      const projectService = getProjectService();
      projectService.createProject(
        project.name,
        project.description,
        project.tags
      ).catch((error) => {
        console.error('[appStore] Failed to persist project:', error);
      });

      return {
        activeProjects: [...state.activeProjects, project],
      };
    }),

  archiveProject: (projectId: string) =>
    set((state) => {
      const project = state.activeProjects.find((p) => p.id === projectId);
      if (!project) return state;

      // Persist to database
      const projectService = getProjectService();
      projectService.archiveProject(projectId).catch((error) => {
        console.error('[appStore] Failed to archive project:', error);
      });

      return {
        activeProjects: state.activeProjects.filter((p) => p.id !== projectId),
        archivedProjects: [
          ...state.archivedProjects,
          { ...project, status: 'archived' },
        ],
      };
    }),

  unarchiveProject: (projectId: string) =>
    set((state) => {
      const project = state.archivedProjects.find((p) => p.id === projectId);
      if (!project) return state;

      // Persist to database
      const projectService = getProjectService();
      projectService.unarchiveProject(projectId).catch((error) => {
        console.error('[appStore] Failed to unarchive project:', error);
      });

      return {
        archivedProjects: state.archivedProjects.filter(
          (p) => p.id !== projectId
        ),
        activeProjects: [
          ...state.activeProjects,
          { ...project, status: 'active' },
        ],
      };
    }),

  addMessage: (message: Message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (messageId: string, updates: Partial<Message>) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
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

  setCurrentPhase: (phaseInfo: PhaseInfo | null) =>
    set({ currentPhase: phaseInfo }),

  updatePhaseStatus: (status: PhaseStatus) =>
    set((state) =>
      state.currentPhase
        ? { currentPhase: { ...state.currentPhase, status } }
        : state
    ),

  addPhaseDeliverable: (deliverable: PhaseDeliverable) =>
    set((state) =>
      state.currentPhase
        ? {
            currentPhase: {
              ...state.currentPhase,
              deliverables: [...state.currentPhase.deliverables, deliverable],
            },
          }
        : state
    ),

  loadProjects: async () => {
    try {
      const projectService = getProjectService();
      const [activeProjects, archivedProjects] = await Promise.all([
        projectService.getActiveProjects(),
        projectService.getArchivedProjects(),
      ]);

      console.log('[appStore] Loaded projects from database:', {
        active: activeProjects.length,
        archived: archivedProjects.length,
      });

      set({
        activeProjects,
        archivedProjects,
      });
    } catch (error) {
      console.error('[appStore] Failed to load projects:', error);
    }
  },

  clearAllProjects: async () => {
    try {
      const projectService = getProjectService();
      await projectService.clearAll();

      console.log('[appStore] All projects cleared from database');

      set({
        activeProjects: [],
        archivedProjects: [],
        activeProject: null,
      });
    } catch (error) {
      console.error('[appStore] Failed to clear projects:', error);
    }
  },
}));
