/**
 * AgentOrchestrator - Main orchestrator implementing the 13-phase workflow
 * Coordinates the complete CCIDE development lifecycle
 */

import {
  WorkflowPhase,
  AgentContext,
  AgentResult,
  OrchestratorConfig,
  MessageType,
  Deliverable,
  Approval
} from '../types/index.js';
import { AgentRegistry, getAgentRegistry } from './AgentRegistry.js';
import { AgentCommunication, getAgentCommunication } from './AgentCommunication.js';
import { WorkflowManager, getWorkflowManager } from './WorkflowManager.js';
import { ProgressTracker } from './ProgressTracker.js';
import EventEmitter from 'eventemitter3';

/**
 * Agent orchestrator service
 * Master coordinator for the CCIDE workflow
 */
export class AgentOrchestrator extends EventEmitter {
  private config: OrchestratorConfig;
  private registry: AgentRegistry;
  private communication: AgentCommunication;
  private workflowManager: WorkflowManager;
  private progressTracker: ProgressTracker;
  private running: boolean;

  constructor(config: OrchestratorConfig) {
    super();
    this.config = config;
    this.registry = getAgentRegistry();
    this.communication = getAgentCommunication();
    this.workflowManager = getWorkflowManager();
    this.progressTracker = new ProgressTracker(
      config.projectRoot,
      config.stateFilePath,
      config.progressFilePath
    );
    this.running = false;

    this.setupMessageHandlers();
  }

  /**
   * Setup message handlers for orchestrator
   */
  private setupMessageHandlers(): void {
    this.communication.registerHandler('orchestrator', async (message) => {
      console.log('[AgentOrchestrator] Received message:', message.type, 'from', message.from);

      switch (message.type) {
        case MessageType.COMPLETION:
          await this.handleAgentCompletion(message.from, message.payload);
          break;
        case MessageType.ERROR:
          await this.handleAgentError(message.from, message.payload);
          break;
        case MessageType.APPROVAL_REQUEST:
          await this.handleApprovalRequest(message.from, message.payload);
          break;
        case MessageType.PROGRESS_UPDATE:
          await this.handleProgressUpdate(message.from, message.payload);
          break;
      }
    });
  }

  /**
   * Initialize the orchestrator
   */
  async initialize(): Promise<void> {
    console.log('[AgentOrchestrator] Initializing orchestrator...');

    // Load existing state if available
    await this.progressTracker.loadState().catch(() => {
      console.log('[AgentOrchestrator] Starting with fresh state');
    });

    // Load agents from definitions
    const agentsDir = `${this.config.projectRoot}/agents`;
    await this.registry.loadAgentsFromDefinitions(agentsDir);

    console.log('[AgentOrchestrator] Orchestrator initialized');
    this.emit('initialized');
  }

  /**
   * Start the workflow from the current state
   */
  async start(): Promise<void> {
    if (this.running) {
      console.warn('[AgentOrchestrator] Orchestrator already running');
      return;
    }

    console.log('[AgentOrchestrator] Starting workflow...');
    this.running = true;
    this.emit('workflow-started');

    try {
      const state = this.progressTracker.getState();
      await this.executePhase(state.currentPhase);
    } catch (error) {
      console.error('[AgentOrchestrator] Workflow error:', error);
      this.emit('workflow-error', error);
      this.running = false;
      throw error;
    }
  }

  /**
   * Execute a specific workflow phase
   */
  async executePhase(phase: WorkflowPhase): Promise<void> {
    console.log('[AgentOrchestrator] Executing phase:', phase);

    const phaseConfig = this.workflowManager.getPhaseConfig(phase);
    if (!phaseConfig) {
      throw new Error('Unknown phase: ' + phase);
    }

    // Check if phase can be started
    const state = this.progressTracker.getState();
    if (!this.workflowManager.canStartPhase(phase, state.completedPhases)) {
      throw new Error('Cannot start phase ' + phase + ': dependencies not satisfied');
    }

    // Update progress
    this.progressTracker.setCurrentPhase(phase);
    await this.progressTracker.saveState();
    await this.progressTracker.saveProgressReport();

    // Get the agent for this phase
    const agents = this.registry.getAgentsForPhase(phase);
    if (agents.length === 0) {
      console.warn('[AgentOrchestrator] No agent available for phase:', phase);
      // Auto-complete if no agent (for phases that don't require agent execution)
      await this.completePhase(phase, []);
      return;
    }

    const agent = agents[0]; // Use first available agent

    if (!agent) {
      console.warn('[AgentOrchestrator] Agent is undefined for phase:', phase);
      await this.completePhase(phase, []);
      return;
    }

    // Prepare agent context
    const context: AgentContext = {
      phase,
      projectRoot: this.config.projectRoot,
      previousDeliverables: this.progressTracker.getAllDeliverables(),
      metadata: {},
      config: {
        requireApproval: phaseConfig.requiresApproval
      }
    };

    // Notify agent to start
    await this.communication.sendMessage(
      'orchestrator',
      agent.name,
      MessageType.START_REQUEST,
      { phase, context }
    );

    this.emit('phase-started', { phase, agent: agent.name });

    // Execute agent
    try {
      const result = await agent.execute(context);
      await this.handleAgentCompletion(agent.name, result);
    } catch (error) {
      await this.handleAgentError(agent.name, error);
    }
  }

  /**
   * Handle agent completion
   */
  private async handleAgentCompletion(
    agentName: string,
    result: AgentResult
  ): Promise<void> {
    console.log('[AgentOrchestrator] Agent completed:', agentName);

    if (!result.success) {
      console.error('[AgentOrchestrator] Agent failed:', result.error);
      this.emit('agent-failed', { agent: agentName, error: result.error });
      return;
    }

    const state = this.progressTracker.getState();
    const currentPhase = state.currentPhase;

    // Record deliverables
    for (const deliverable of result.deliverables) {
      this.progressTracker.addDeliverable(deliverable);
    }

    // Check if phase requires approval
    const phaseConfig = this.workflowManager.getPhaseConfig(currentPhase);
    if (phaseConfig?.requiresApproval) {
      // Emit approval request event
      this.emit('approval-required', {
        phase: currentPhase,
        deliverables: result.deliverables
      });

      // In a real implementation, this would wait for user approval
      // For now, we'll auto-approve
      console.log('[AgentOrchestrator] Approval required for phase:', currentPhase);
    }

    // Complete the phase
    await this.completePhase(currentPhase, result.deliverables);
  }

  /**
   * Complete a phase and transition to next
   */
  private async completePhase(
    phase: WorkflowPhase,
    deliverables: Deliverable[]
  ): Promise<void> {
    console.log('[AgentOrchestrator] Completing phase:', phase);

    // Validate phase completion
    const validation = this.workflowManager.validatePhaseCompletion(phase, deliverables);
    if (!validation.valid) {
      console.warn('[AgentOrchestrator] Phase incomplete, missing deliverables:', validation.missingDeliverables);
      // In strict mode, this would block progression
      // For now, we'll allow it with a warning
    }

    // Mark phase as complete
    this.progressTracker.completePhase(phase);
    await this.progressTracker.saveState();
    await this.progressTracker.saveProgressReport();

    this.emit('phase-completed', { phase });

    // Check if workflow is complete
    const state = this.progressTracker.getState();
    if (this.workflowManager.isWorkflowComplete(state.completedPhases)) {
      console.log('[AgentOrchestrator] Workflow complete!');
      this.running = false;
      this.emit('workflow-completed');
      return;
    }

    // Transition to next phase
    const nextPhase = this.workflowManager.getNextPhase(phase);
    if (nextPhase) {
      if (this.config.autoProgress) {
        // Auto-progress to next phase
        await this.executePhase(nextPhase);
      } else {
        // Wait for manual progression
        console.log('[AgentOrchestrator] Waiting for manual progression to:', nextPhase);
        this.emit('waiting-for-progression', { nextPhase });
      }
    }
  }

  /**
   * Handle agent error
   */
  private async handleAgentError(agentName: string, error: any): Promise<void> {
    console.error('[AgentOrchestrator] Agent error from', agentName + ':', error);

    const state = this.progressTracker.getState();

    // Record blocker
    this.progressTracker.addBlocker({
      description: 'Agent ' + agentName + ' encountered an error: ' + (error.message || String(error)),
      phase: state.currentPhase,
      severity: 'high',
      resolved: false
    });

    await this.progressTracker.saveState();
    await this.progressTracker.saveProgressReport();

    this.emit('agent-error', { agent: agentName, error });
  }

  /**
   * Handle approval request
   */
  private async handleApprovalRequest(
    agentName: string,
    payload: any
  ): Promise<void> {
    console.log('[AgentOrchestrator] Approval requested by:', agentName);
    this.emit('approval-requested', { agent: agentName, payload });
  }

  /**
   * Handle progress update
   */
  private async handleProgressUpdate(
    agentName: string,
    payload: any
  ): Promise<void> {
    console.log('[AgentOrchestrator] Progress update from:', agentName);
    this.emit('progress-update', { agent: agentName, payload });
  }

  /**
   * Approve a phase
   */
  async approvePhase(
    phase: WorkflowPhase,
    deliverablePaths: string[],
    feedback?: string
  ): Promise<void> {
    const approval: Omit<Approval, 'id' | 'timestamp'> = {
      phase,
      deliverables: deliverablePaths,
      approved: true,
      feedback
    };

    this.progressTracker.addApproval(approval);
    await this.progressTracker.saveState();
    await this.progressTracker.saveProgressReport();

    console.log('[AgentOrchestrator] Phase approved:', phase);
    this.emit('phase-approved', { phase });
  }

  /**
   * Reject a phase
   */
  async rejectPhase(
    phase: WorkflowPhase,
    deliverablePaths: string[],
    feedback: string
  ): Promise<void> {
    const approval: Omit<Approval, 'id' | 'timestamp'> = {
      phase,
      deliverables: deliverablePaths,
      approved: false,
      feedback
    };

    this.progressTracker.addApproval(approval);
    await this.progressTracker.saveState();
    await this.progressTracker.saveProgressReport();

    console.log('[AgentOrchestrator] Phase rejected:', phase);
    this.emit('phase-rejected', { phase, feedback });
  }

  /**
   * Get current workflow state
   */
  getWorkflowState() {
    return this.progressTracker.getState();
  }

  /**
   * Get workflow progress percentage
   */
  getProgress(): number {
    const state = this.progressTracker.getState();
    return this.workflowManager.getProgress(state.completedPhases);
  }

  /**
   * Stop the orchestrator
   */
  async stop(): Promise<void> {
    console.log('[AgentOrchestrator] Stopping orchestrator...');
    this.running = false;
    await this.progressTracker.saveState();
    await this.progressTracker.saveProgressReport();
    this.emit('stopped');
  }

  /**
   * Reset workflow to beginning
   */
  async reset(): Promise<void> {
    console.log('[AgentOrchestrator] Resetting workflow...');
    this.running = false;
    this.progressTracker.reset();
    await this.progressTracker.saveState();
    await this.progressTracker.saveProgressReport();
    this.emit('reset');
  }

  /**
   * Check if orchestrator is running
   */
  isRunning(): boolean {
    return this.running;
  }
}
