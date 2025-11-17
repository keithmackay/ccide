/**
 * WorkflowManager - State machine for workflow phases
 * Manages transitions between the 13 workflow phases
 */

import {
  WorkflowPhase,
  WorkflowPhaseConfig,
  ProgressState,
  Deliverable
} from '../types/index.js';
import { EventEmitter } from 'events';

/**
 * Workflow configuration with all 13 phases
 */
const WORKFLOW_PHASES: WorkflowPhaseConfig[] = [
  {
    phase: WorkflowPhase.DISCOVERY,
    name: 'Project Discovery & Setup',
    description: 'Check project state and determine current workflow stage',
    agent: 'ccide-orchestrator-agent',
    deliverables: ['docs/plans/progress.md', 'docs/plans/workplan.md'],
    successCriteria: ['Project state assessed', 'Next steps identified'],
    requiresApproval: false,
    dependencies: [],
    nextPhase: WorkflowPhase.SPECIFICATION
  },
  {
    phase: WorkflowPhase.SPECIFICATION,
    name: 'Idea & Specification',
    description: 'Capture idea and create specification document',
    agent: 'spec-agent',
    deliverables: ['docs/plans/idea.md', 'docs/plans/spec.md'],
    successCriteria: ['Specification document complete', 'User approval obtained'],
    requiresApproval: true,
    dependencies: [WorkflowPhase.DISCOVERY],
    nextPhase: WorkflowPhase.ICP_PERSONAS
  },
  {
    phase: WorkflowPhase.ICP_PERSONAS,
    name: 'ICP & Personas',
    description: 'Define ideal customer profile and user personas',
    agent: 'icp-agent',
    deliverables: ['docs/plans/icp.md', 'docs/plans/personae.md'],
    successCriteria: ['ICP defined', 'User personas created', 'User validated'],
    requiresApproval: true,
    dependencies: [WorkflowPhase.SPECIFICATION],
    nextPhase: WorkflowPhase.ARCHITECTURE
  },
  {
    phase: WorkflowPhase.ARCHITECTURE,
    name: 'Architecture & Pages',
    description: 'Define page structure and information architecture',
    agent: 'arch-design-agent',
    deliverables: ['docs/plans/pages.md', 'docs/plans/info-architecture.md'],
    successCriteria: ['Page structure defined', 'Navigation flow documented', 'User feedback obtained'],
    requiresApproval: true,
    dependencies: [WorkflowPhase.ICP_PERSONAS],
    nextPhase: WorkflowPhase.UIUX_DESIGN
  },
  {
    phase: WorkflowPhase.UIUX_DESIGN,
    name: 'UI/UX Design',
    description: 'Create user flows, wireframes, style guide, and components',
    agent: 'uiux-design-agent',
    deliverables: [
      'pages/userflow-*.md',
      'pages/wireframe-*.md',
      'docs/plans/style-guide.md',
      'docs/plans/components-list.md',
      'components/*.html'
    ],
    successCriteria: [
      'User flows documented',
      'Wireframes created',
      'Style guide defined',
      'Component library built',
      'User approval obtained'
    ],
    requiresApproval: true,
    dependencies: [WorkflowPhase.ARCHITECTURE],
    nextPhase: WorkflowPhase.PRD
  },
  {
    phase: WorkflowPhase.PRD,
    name: 'PRD & Implementation Planning',
    description: 'Create comprehensive PRD and detailed implementation plan',
    agent: 'prd-agent',
    deliverables: ['docs/plans/prd.md', 'docs/plans/implementation_plan.md'],
    successCriteria: ['PRD complete', 'Implementation plan detailed', 'Tasks defined'],
    requiresApproval: true,
    dependencies: [WorkflowPhase.UIUX_DESIGN],
    nextPhase: WorkflowPhase.PARALLEL_PLANNING
  },
  {
    phase: WorkflowPhase.PARALLEL_PLANNING,
    name: 'Parallel Planning',
    description: 'Analyze and chunk tasks for parallel execution',
    agent: 'swarm-planning-agent',
    deliverables: ['Parallelized task breakdown', 'Agent assignments'],
    successCriteria: [
      'Independent work streams identified',
      'Tasks chunked appropriately',
      'Swarm coordination plan created'
    ],
    requiresApproval: false,
    dependencies: [WorkflowPhase.PRD],
    nextPhase: WorkflowPhase.IMPLEMENTATION
  },
  {
    phase: WorkflowPhase.IMPLEMENTATION,
    name: 'Implementation',
    description: 'Execute implementation plan with coordinated development',
    agent: 'coding-agent',
    deliverables: ['Source code', 'Tests', 'Documentation'],
    successCriteria: [
      'Features implemented',
      'Tests written',
      'Code quality standards met',
      'Frequent commits made'
    ],
    requiresApproval: false,
    dependencies: [WorkflowPhase.PARALLEL_PLANNING],
    nextPhase: WorkflowPhase.CODE_REVIEW
  },
  {
    phase: WorkflowPhase.CODE_REVIEW,
    name: 'Code Review',
    description: 'Review code changes and ensure quality',
    agent: 'reviewer-agent',
    deliverables: ['Review reports', 'Code improvements'],
    successCriteria: [
      'All code reviewed',
      'Quality issues identified',
      'Best practices verified',
      'Approval obtained'
    ],
    requiresApproval: false,
    dependencies: [WorkflowPhase.IMPLEMENTATION],
    nextPhase: WorkflowPhase.TESTING
  },
  {
    phase: WorkflowPhase.TESTING,
    name: 'Testing',
    description: 'Execute comprehensive testing suite',
    agent: 'testing-agent',
    deliverables: ['Test reports', 'Test results'],
    successCriteria: [
      'Unit tests pass',
      'Integration tests pass',
      'E2E tests pass',
      '100% pass rate achieved'
    ],
    requiresApproval: false,
    dependencies: [WorkflowPhase.CODE_REVIEW],
    nextPhase: WorkflowPhase.SECURITY
  },
  {
    phase: WorkflowPhase.SECURITY,
    name: 'Security',
    description: 'Security assessment and vulnerability fixes',
    agent: 'security-agent',
    deliverables: ['Security assessment', 'Security fixes'],
    successCriteria: [
      'Vulnerabilities scanned',
      'Security risks assessed',
      'Critical issues fixed',
      'Security requirements met'
    ],
    requiresApproval: false,
    dependencies: [WorkflowPhase.TESTING],
    nextPhase: WorkflowPhase.PERFORMANCE
  },
  {
    phase: WorkflowPhase.PERFORMANCE,
    name: 'Performance',
    description: 'Performance optimization and tuning',
    agent: 'performance-agent',
    deliverables: ['Performance report', 'Optimizations'],
    successCriteria: [
      'Performance metrics collected',
      'Bottlenecks identified',
      'Optimizations implemented',
      'Target performance achieved'
    ],
    requiresApproval: false,
    dependencies: [WorkflowPhase.SECURITY],
    nextPhase: WorkflowPhase.DEPLOYMENT
  },
  {
    phase: WorkflowPhase.DEPLOYMENT,
    name: 'Deployment',
    description: 'Deploy application to production',
    agent: 'deployment-agent',
    deliverables: ['Deployment artifacts', 'Runbooks', 'Deployment validation'],
    successCriteria: [
      'Deployment configuration ready',
      'Application deployed',
      'Deployment validated',
      'Runbooks created'
    ],
    requiresApproval: true,
    dependencies: [WorkflowPhase.PERFORMANCE],
    nextPhase: WorkflowPhase.DOCUMENTATION
  },
  {
    phase: WorkflowPhase.DOCUMENTATION,
    name: 'Documentation',
    description: 'Generate comprehensive documentation',
    agent: 'documentation-agent',
    deliverables: [
      'User documentation',
      'Developer guides',
      'API documentation',
      'Deployment guides'
    ],
    successCriteria: [
      'User docs complete',
      'Developer docs complete',
      'API docs complete',
      'Troubleshooting guides created'
    ],
    requiresApproval: false,
    dependencies: [WorkflowPhase.DEPLOYMENT]
  }
];

/**
 * Workflow manager service
 * Manages workflow state and phase transitions
 */
export class WorkflowManager extends EventEmitter {
  private phaseConfigs: Map<WorkflowPhase, WorkflowPhaseConfig>;

  constructor() {
    super();
    this.phaseConfigs = new Map();
    this.initializePhases();
  }

  /**
   * Initialize phase configurations
   */
  private initializePhases(): void {
    for (const config of WORKFLOW_PHASES) {
      this.phaseConfigs.set(config.phase, config);
    }
  }

  /**
   * Get configuration for a specific phase
   */
  getPhaseConfig(phase: WorkflowPhase): WorkflowPhaseConfig | undefined {
    return this.phaseConfigs.get(phase);
  }

  /**
   * Get all phase configurations
   */
  getAllPhaseConfigs(): WorkflowPhaseConfig[] {
    return Array.from(this.phaseConfigs.values());
  }

  /**
   * Get the next phase in the workflow
   */
  getNextPhase(currentPhase: WorkflowPhase): WorkflowPhase | undefined {
    const config = this.phaseConfigs.get(currentPhase);
    return config?.nextPhase;
  }

  /**
   * Check if a phase can be started based on dependencies
   */
  canStartPhase(
    phase: WorkflowPhase,
    completedPhases: WorkflowPhase[]
  ): boolean {
    const config = this.phaseConfigs.get(phase);
    if (!config) {
      return false;
    }

    // Check if all dependencies are satisfied
    return config.dependencies.every(dep => completedPhases.includes(dep));
  }

  /**
   * Validate phase completion
   */
  validatePhaseCompletion(
    phase: WorkflowPhase,
    deliverables: Deliverable[]
  ): { valid: boolean; missingDeliverables: string[] } {
    const config = this.phaseConfigs.get(phase);
    if (!config) {
      return { valid: false, missingDeliverables: [] };
    }

    const deliverablePaths = deliverables.map(d => d.path);
    const missingDeliverables: string[] = [];

    for (const expectedPath of config.deliverables) {
      // Handle wildcard patterns
      if (expectedPath.includes('*')) {
        const pattern = expectedPath.replace(/\*/g, '.*');
        const regex = new RegExp(pattern);
        const hasMatch = deliverablePaths.some(path => regex.test(path));
        if (!hasMatch) {
          missingDeliverables.push(expectedPath);
        }
      } else {
        if (!deliverablePaths.includes(expectedPath)) {
          missingDeliverables.push(expectedPath);
        }
      }
    }

    return {
      valid: missingDeliverables.length === 0,
      missingDeliverables
    };
  }

  /**
   * Transition to next phase
   */
  async transitionToPhase(
    currentState: ProgressState,
    nextPhase: WorkflowPhase
  ): Promise<ProgressState> {
    // Validate transition is allowed
    if (!this.canStartPhase(nextPhase, currentState.completedPhases)) {
      throw new Error(
        'Cannot transition to ' + nextPhase + ': dependencies not satisfied'
      );
    }

    // Mark current phase as complete if not already
    if (!currentState.completedPhases.includes(currentState.currentPhase)) {
      currentState.completedPhases.push(currentState.currentPhase);
    }

    // Update to next phase
    const newState: ProgressState = {
      ...currentState,
      currentPhase: nextPhase,
      phaseStartedAt: new Date(),
      lastUpdated: new Date()
    };

    this.emit('phase-transition', {
      from: currentState.currentPhase,
      to: nextPhase,
      timestamp: new Date()
    });

    console.log('[WorkflowManager] Transitioned to phase: ' + nextPhase);

    return newState;
  }

  /**
   * Get workflow progress percentage
   */
  getProgress(completedPhases: WorkflowPhase[]): number {
    const totalPhases = this.phaseConfigs.size;
    const completed = completedPhases.length;
    return Math.round((completed / totalPhases) * 100);
  }

  /**
   * Get remaining phases
   */
  getRemainingPhases(currentPhase: WorkflowPhase): WorkflowPhase[] {
    const allPhases = WORKFLOW_PHASES.map(p => p.phase);
    const currentIndex = allPhases.indexOf(currentPhase);
    return allPhases.slice(currentIndex + 1);
  }

  /**
   * Check if workflow is complete
   */
  isWorkflowComplete(completedPhases: WorkflowPhase[]): boolean {
    const allPhases = Array.from(this.phaseConfigs.keys());
    return allPhases.every(phase => completedPhases.includes(phase));
  }

  /**
   * Get phase timeline
   */
  getPhaseTimeline(): WorkflowPhase[] {
    return WORKFLOW_PHASES.map(p => p.phase);
  }

  /**
   * Get agent for phase
   */
  getAgentForPhase(phase: WorkflowPhase): string | undefined {
    const config = this.phaseConfigs.get(phase);
    return config?.agent;
  }

  /**
   * Check if phase requires approval
   */
  requiresApproval(phase: WorkflowPhase): boolean {
    const config = this.phaseConfigs.get(phase);
    return config?.requiresApproval || false;
  }
}

// Singleton instance
let workflowManagerInstance: WorkflowManager | null = null;

/**
 * Get the global workflow manager instance
 */
export function getWorkflowManager(): WorkflowManager {
  if (!workflowManagerInstance) {
    workflowManagerInstance = new WorkflowManager();
  }
  return workflowManagerInstance;
}

/**
 * Reset the global workflow manager instance (useful for testing)
 */
export function resetWorkflowManager(): void {
  if (workflowManagerInstance) {
    workflowManagerInstance.removeAllListeners();
  }
  workflowManagerInstance = null;
}
