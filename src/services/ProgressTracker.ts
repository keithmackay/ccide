/**
 * ProgressTracker - Track progress through workflow phases
 * Manages progress state, deliverables, blockers, and approvals
 */

import {
  ProgressState,
  WorkflowPhase,
  Deliverable,
  Blocker,
  Approval,
  DeliverableType
} from '../types/index.js';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Progress tracker service
 * Manages and persists workflow progress state
 */
export class ProgressTracker {
  private state: ProgressState;
  private stateFilePath: string;
  private progressFilePath: string;

  constructor(
    projectRoot: string,
    stateFilePath?: string,
    progressFilePath?: string
  ) {
    this.stateFilePath = stateFilePath || path.join(projectRoot, '.ccide', 'state.json');
    this.progressFilePath = progressFilePath || path.join(projectRoot, 'docs', 'plans', 'progress.md');

    // Initialize default state
    this.state = this.createInitialState();
  }

  /**
   * Create initial progress state
   */
  private createInitialState(): ProgressState {
    return {
      currentPhase: WorkflowPhase.DISCOVERY,
      completedPhases: [],
      deliverables: [],
      phaseStartedAt: new Date(),
      workflowStartedAt: new Date(),
      lastUpdated: new Date(),
      blockers: [],
      approvals: [],
      metadata: {}
    };
  }

  /**
   * Get current progress state
   */
  getState(): ProgressState {
    return { ...this.state };
  }

  /**
   * Update current phase
   */
  setCurrentPhase(phase: WorkflowPhase): void {
    this.state.currentPhase = phase;
    this.state.phaseStartedAt = new Date();
    this.state.lastUpdated = new Date();
    console.log('[ProgressTracker] Current phase set to: ' + phase);
  }

  /**
   * Mark phase as complete
   */
  completePhase(phase: WorkflowPhase): void {
    if (!this.state.completedPhases.includes(phase)) {
      this.state.completedPhases.push(phase);
      this.state.lastUpdated = new Date();
      console.log('[ProgressTracker] Phase completed: ' + phase);
    }
  }

  /**
   * Add a deliverable
   */
  addDeliverable(deliverable: Deliverable): void {
    this.state.deliverables.push({
      ...deliverable,
      createdAt: deliverable.createdAt || new Date()
    });
    this.state.lastUpdated = new Date();
    console.log('[ProgressTracker] Deliverable added: ' + deliverable.path);
  }

  /**
   * Get deliverables for a specific phase
   */
  getDeliverablesForPhase(phase: WorkflowPhase): Deliverable[] {
    return this.state.deliverables.filter(d => d.phase === phase);
  }

  /**
   * Get all deliverables
   */
  getAllDeliverables(): Deliverable[] {
    return [...this.state.deliverables];
  }

  /**
   * Add a blocker
   */
  addBlocker(blocker: Omit<Blocker, 'id' | 'createdAt'>): Blocker {
    const newBlocker: Blocker = {
      ...blocker,
      id: this.generateBlockerId(),
      createdAt: new Date(),
      resolved: false
    };
    this.state.blockers.push(newBlocker);
    this.state.lastUpdated = new Date();
    console.log('[ProgressTracker] Blocker added: ' + newBlocker.description);
    return newBlocker;
  }

  /**
   * Resolve a blocker
   */
  resolveBlocker(blockerId: string, resolution: string): boolean {
    const blocker = this.state.blockers.find(b => b.id === blockerId);
    if (!blocker) {
      return false;
    }

    blocker.resolved = true;
    blocker.resolution = resolution;
    blocker.resolvedAt = new Date();
    this.state.lastUpdated = new Date();
    console.log('[ProgressTracker] Blocker resolved: ' + blockerId);
    return true;
  }

  /**
   * Get active blockers
   */
  getActiveBlockers(): Blocker[] {
    return this.state.blockers.filter(b => !b.resolved);
  }

  /**
   * Add an approval record
   */
  addApproval(approval: Omit<Approval, 'id' | 'timestamp'>): Approval {
    const newApproval: Approval = {
      ...approval,
      id: this.generateApprovalId(),
      timestamp: new Date()
    };
    this.state.approvals.push(newApproval);
    this.state.lastUpdated = new Date();
    console.log('[ProgressTracker] Approval added for phase: ' + approval.phase);
    return newApproval;
  }

  /**
   * Get approvals for a phase
   */
  getApprovalsForPhase(phase: WorkflowPhase): Approval[] {
    return this.state.approvals.filter(a => a.phase === phase);
  }

  /**
   * Check if phase is approved
   */
  isPhaseApproved(phase: WorkflowPhase): boolean {
    const approvals = this.getApprovalsForPhase(phase);
    return approvals.some(a => a.approved);
  }

  /**
   * Set metadata
   */
  setMetadata(key: string, value: any): void {
    this.state.metadata[key] = value;
    this.state.lastUpdated = new Date();
  }

  /**
   * Get metadata
   */
  getMetadata(key: string): any {
    return this.state.metadata[key];
  }

  /**
   * Save state to file
   */
  async saveState(): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.stateFilePath);
      await fs.mkdir(dir, { recursive: true });

      // Write state file
      await fs.writeFile(
        this.stateFilePath,
        JSON.stringify(this.state, null, 2),
        'utf-8'
      );

      console.log('[ProgressTracker] State saved to: ' + this.stateFilePath);
    } catch (error) {
      console.error('[ProgressTracker] Failed to save state:', error);
      throw error;
    }
  }

  /**
   * Load state from file
   */
  async loadState(): Promise<void> {
    try {
      const data = await fs.readFile(this.stateFilePath, 'utf-8');
      const loadedState = JSON.parse(data);

      // Convert date strings back to Date objects
      this.state = {
        ...loadedState,
        phaseStartedAt: new Date(loadedState.phaseStartedAt),
        workflowStartedAt: new Date(loadedState.workflowStartedAt),
        lastUpdated: new Date(loadedState.lastUpdated),
        deliverables: loadedState.deliverables.map((d: any) => ({
          ...d,
          createdAt: new Date(d.createdAt)
        })),
        blockers: loadedState.blockers.map((b: any) => ({
          ...b,
          createdAt: new Date(b.createdAt),
          resolvedAt: b.resolvedAt ? new Date(b.resolvedAt) : undefined
        })),
        approvals: loadedState.approvals.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }))
      };

      console.log('[ProgressTracker] State loaded from: ' + this.stateFilePath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('[ProgressTracker] No existing state file, using initial state');
      } else {
        console.error('[ProgressTracker] Failed to load state:', error);
        throw error;
      }
    }
  }

  /**
   * Generate progress markdown report
   */
  async generateProgressReport(): Promise<string> {
    const lines: string[] = [];

    lines.push('# CCIDE Workflow Progress');
    lines.push('');
    lines.push('**Last Updated**: ' + this.state.lastUpdated.toISOString());
    lines.push('**Workflow Started**: ' + this.state.workflowStartedAt.toISOString());
    lines.push('');

    // Current phase
    lines.push('## Current Phase');
    lines.push('');
    lines.push('**Phase**: ' + this.state.currentPhase);
    lines.push('**Started**: ' + this.state.phaseStartedAt.toISOString());
    lines.push('');

    // Completed phases
    lines.push('## Completed Phases');
    lines.push('');
    if (this.state.completedPhases.length === 0) {
      lines.push('None yet');
    } else {
      for (const phase of this.state.completedPhases) {
        lines.push('- [x] ' + phase);
      }
    }
    lines.push('');

    // Deliverables
    lines.push('## Deliverables');
    lines.push('');
    if (this.state.deliverables.length === 0) {
      lines.push('None yet');
    } else {
      const deliverablesByPhase = new Map<WorkflowPhase, Deliverable[]>();
      for (const deliverable of this.state.deliverables) {
        if (!deliverablesByPhase.has(deliverable.phase)) {
          deliverablesByPhase.set(deliverable.phase, []);
        }
        deliverablesByPhase.get(deliverable.phase)!.push(deliverable);
      }

      for (const [phase, deliverables] of deliverablesByPhase) {
        lines.push('### ' + phase);
        for (const d of deliverables) {
          const approved = d.approved ? ' ✓' : '';
          lines.push('- ' + d.path + ' (' + d.type + ')' + approved);
        }
        lines.push('');
      }
    }

    // Active blockers
    const activeBlockers = this.getActiveBlockers();
    if (activeBlockers.length > 0) {
      lines.push('## Active Blockers');
      lines.push('');
      for (const blocker of activeBlockers) {
        lines.push('### ' + blocker.id + ' (' + blocker.severity + ')');
        lines.push('');
        lines.push('**Phase**: ' + blocker.phase);
        lines.push('**Description**: ' + blocker.description);
        lines.push('**Created**: ' + blocker.createdAt.toISOString());
        lines.push('');
      }
    }

    // Approvals
    lines.push('## Approvals');
    lines.push('');
    if (this.state.approvals.length === 0) {
      lines.push('None yet');
    } else {
      for (const approval of this.state.approvals) {
        const status = approval.approved ? 'APPROVED' : 'REJECTED';
        lines.push('- ' + approval.phase + ': ' + status);
        if (approval.feedback) {
          lines.push('  - Feedback: ' + approval.feedback);
        }
      }
    }
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Save progress report to file
   */
  async saveProgressReport(): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.progressFilePath);
      await fs.mkdir(dir, { recursive: true });

      // Generate and write report
      const report = await this.generateProgressReport();
      await fs.writeFile(this.progressFilePath, report, 'utf-8');

      console.log('[ProgressTracker] Progress report saved to: ' + this.progressFilePath);
    } catch (error) {
      console.error('[ProgressTracker] Failed to save progress report:', error);
      throw error;
    }
  }

  /**
   * Generate a unique blocker ID
   */
  private generateBlockerId(): string {
    return 'blocker_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate a unique approval ID
   */
  private generateApprovalId(): string {
    return 'approval_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Reset the tracker to initial state
   */
  reset(): void {
    this.state = this.createInitialState();
    console.log('[ProgressTracker] Reset to initial state');
  }
}
