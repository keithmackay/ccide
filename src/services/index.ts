/**
 * CCIDE Services Index
 * Central export point for all orchestration and infrastructure services
 */

// Types
export * from '../types/index.js';

// Infrastructure Services (Agent 1)
export { Database, getDatabase, STORES } from './Database';
export { AnalyticsService, getAnalyticsService } from './AnalyticsService';
export { SettingsService, getSettingsService } from './SettingsService';
export { ProjectService, getProjectService } from './ProjectService';
export { FileService, getFileService } from './FileService';
export { ProjectFolderService, getProjectFolderService } from './ProjectFolderService';

// Orchestration Services (Agent 3)
export { AgentRegistry, getAgentRegistry, resetAgentRegistry } from './AgentRegistry.js';
export { AgentCommunication, getAgentCommunication, resetAgentCommunication } from './AgentCommunication.js';
export { WorkflowManager, getWorkflowManager, resetWorkflowManager } from './WorkflowManager.js';
export { ProgressTracker } from './ProgressTracker.js';
export { AgentOrchestrator } from './AgentOrchestrator.js';

// LLM Services (Agent 3)
export type {
  ILLMService
} from './LLMService.js';
export {
  ClaudeLLMService,
  OpenAILLMService,
  LLMServiceFactory,
  initializeLLMService,
  getLLMService,
  resetLLMService
} from './LLMService.js';
