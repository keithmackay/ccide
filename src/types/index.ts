/**
 * CCIDE Type Definitions
 * Core TypeScript interfaces for the agent coordination system
 */

/**
 * Agent interface - Defines the contract for all specialized agents
 */
export interface Agent {
  /** Unique identifier for the agent */
  name: string;

  /** Agent version */
  version: string;

  /** Agent type/category */
  type: AgentType;

  /** List of capabilities this agent provides */
  capabilities: string[];

  /** List of required tools for this agent */
  requiredTools: string[];

  /** Optional tools that enhance agent functionality */
  optionalTools?: string[];

  /** Execute the agent's primary function */
  execute(context: AgentContext): Promise<AgentResult>;

  /** Validate if agent can execute given the current context */
  canExecute(context: AgentContext): boolean;

  /** Get agent metadata and configuration */
  getMetadata(): AgentMetadata;
}

/**
 * Agent types categorized by function
 */
export enum AgentType {
  SPECIFICATION = 'specification',
  DESIGN = 'design',
  ARCHITECTURE = 'architecture',
  IMPLEMENTATION = 'implementation',
  QUALITY = 'quality',
  DEPLOYMENT = 'deployment',
  DOCUMENTATION = 'documentation',
  COORDINATION = 'coordination',
  PLANNING = 'planning'
}

/**
 * Agent metadata
 */
export interface AgentMetadata {
  name: string;
  version: string;
  type: AgentType;
  description: string;
  capabilities: string[];
  responsibilities: string[];
  requiredTools: string[];
  optionalTools?: string[];
}

/**
 * Agent execution context
 */
export interface AgentContext {
  /** Current workflow phase */
  phase: WorkflowPhase;

  /** Project root directory */
  projectRoot: string;

  /** Previous phase deliverables */
  previousDeliverables: Deliverable[];

  /** User input/requirements */
  userInput?: string;

  /** Additional context data */
  metadata: Record<string, any>;

  /** Configuration for this agent execution */
  config?: AgentConfig;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Maximum execution time in milliseconds */
  timeout?: number;

  /** Whether to require user approval */
  requireApproval?: boolean;

  /** Custom configuration options */
  options?: Record<string, any>;
}

/**
 * Agent execution result
 */
export interface AgentResult {
  /** Whether execution was successful */
  success: boolean;

  /** Deliverables produced by this agent */
  deliverables: Deliverable[];

  /** Messages for the user */
  messages: string[];

  /** Error information if execution failed */
  error?: Error;

  /** Next recommended phase */
  nextPhase?: WorkflowPhase;

  /** Metadata about the execution */
  metadata?: Record<string, any>;
}

/**
 * Workflow phase definition - Maps to the 13 phases in ProjectWorkflowOrchestrator.md
 */
export enum WorkflowPhase {
  DISCOVERY = 'discovery',              // Phase 0: Project Discovery & Setup
  SPECIFICATION = 'specification',      // Phase 1: Idea & Specification
  ICP_PERSONAS = 'icp_personas',       // Phase 2: ICP & Personas
  ARCHITECTURE = 'architecture',        // Phase 3: Architecture & Pages
  UIUX_DESIGN = 'uiux_design',         // Phase 4: UI/UX Design
  PRD = 'prd',                         // Phase 5: PRD & Implementation Planning
  PARALLEL_PLANNING = 'parallel_planning', // Phase 6: Parallel Planning
  IMPLEMENTATION = 'implementation',    // Phase 7: Implementation
  CODE_REVIEW = 'code_review',         // Phase 8: Code Review
  TESTING = 'testing',                 // Phase 9: Testing
  SECURITY = 'security',               // Phase 10: Security
  PERFORMANCE = 'performance',         // Phase 11: Performance
  DEPLOYMENT = 'deployment',           // Phase 12: Deployment
  DOCUMENTATION = 'documentation'      // Phase 13: Documentation
}

/**
 * Workflow phase configuration
 */
export interface WorkflowPhaseConfig {
  /** Phase identifier */
  phase: WorkflowPhase;

  /** Human-readable phase name */
  name: string;

  /** Phase description */
  description: string;

  /** Agent responsible for this phase */
  agent: string;

  /** Expected deliverables */
  deliverables: string[];

  /** Success criteria for phase completion */
  successCriteria: string[];

  /** Whether user approval is required */
  requiresApproval: boolean;

  /** Dependencies on previous phases */
  dependencies: WorkflowPhase[];

  /** Next phase in the workflow */
  nextPhase?: WorkflowPhase;
}

/**
 * Deliverable produced by an agent
 */
export interface Deliverable {
  /** Deliverable type */
  type: DeliverableType;

  /** File path (relative to project root) */
  path: string;

  /** Deliverable description */
  description: string;

  /** Agent that produced this deliverable */
  producedBy: string;

  /** Workflow phase this was produced in */
  phase: WorkflowPhase;

  /** Creation timestamp */
  createdAt: Date;

  /** Whether user has approved this deliverable */
  approved?: boolean;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Deliverable types
 */
export enum DeliverableType {
  DOCUMENT = 'document',
  CODE = 'code',
  TEST = 'test',
  CONFIGURATION = 'configuration',
  ASSET = 'asset',
  REPORT = 'report'
}

/**
 * Progress state for the workflow
 */
export interface ProgressState {
  /** Current workflow phase */
  currentPhase: WorkflowPhase;

  /** Completed phases */
  completedPhases: WorkflowPhase[];

  /** All deliverables produced so far */
  deliverables: Deliverable[];

  /** Current phase start time */
  phaseStartedAt: Date;

  /** Workflow start time */
  workflowStartedAt: Date;

  /** Last updated timestamp */
  lastUpdated: Date;

  /** Blockers or issues */
  blockers: Blocker[];

  /** User approvals */
  approvals: Approval[];

  /** Additional state metadata */
  metadata: Record<string, any>;
}

/**
 * Blocker or issue
 */
export interface Blocker {
  /** Blocker ID */
  id: string;

  /** Blocker description */
  description: string;

  /** Phase where blocker occurred */
  phase: WorkflowPhase;

  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';

  /** Whether blocker is resolved */
  resolved: boolean;

  /** Resolution notes */
  resolution?: string;

  /** Created timestamp */
  createdAt: Date;

  /** Resolved timestamp */
  resolvedAt?: Date;
}

/**
 * User approval record
 */
export interface Approval {
  /** Approval ID */
  id: string;

  /** Phase being approved */
  phase: WorkflowPhase;

  /** Deliverables being approved */
  deliverables: string[];

  /** Whether approved */
  approved: boolean;

  /** User feedback */
  feedback?: string;

  /** Timestamp */
  timestamp: Date;
}

/**
 * Agent message for inter-agent communication
 */
export interface AgentMessage {
  /** Message ID */
  id: string;

  /** Sender agent name */
  from: string;

  /** Recipient agent name (or 'orchestrator') */
  to: string;

  /** Message type */
  type: MessageType;

  /** Message payload */
  payload: any;

  /** Message timestamp */
  timestamp: Date;

  /** Whether message requires response */
  requiresResponse?: boolean;

  /** Response to this message ID */
  inResponseTo?: string;
}

/**
 * Message types for agent communication
 */
export enum MessageType {
  /** Agent requesting to start execution */
  START_REQUEST = 'start_request',

  /** Agent reporting progress */
  PROGRESS_UPDATE = 'progress_update',

  /** Agent reporting completion */
  COMPLETION = 'completion',

  /** Agent reporting error */
  ERROR = 'error',

  /** Request for user input */
  USER_INPUT_REQUEST = 'user_input_request',

  /** Request for approval */
  APPROVAL_REQUEST = 'approval_request',

  /** Handoff to next agent */
  HANDOFF = 'handoff',

  /** Status query */
  STATUS_QUERY = 'status_query',

  /** General notification */
  NOTIFICATION = 'notification'
}

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  /** Project root directory */
  projectRoot: string;

  /** Whether to enable auto-progression between phases */
  autoProgress?: boolean;

  /** Whether to require user approval at each phase */
  requireApprovalPerPhase?: boolean;

  /** Maximum time per phase (in milliseconds) */
  phaseTimeout?: number;

  /** Path to progress file */
  progressFilePath?: string;

  /** Path to state file */
  stateFilePath?: string;

  /** LLM configuration */
  llmConfig?: LLMConfig;
}

/**
 * LLM (Language Model) configuration
 */
export interface LLMConfig {
  /** Provider (e.g., 'anthropic', 'openai') */
  provider: string;

  /** Model name */
  model: string;

  /** API key */
  apiKey: string;

  /** API endpoint (optional, for custom endpoints) */
  endpoint?: string;

  /** Maximum tokens per request */
  maxTokens?: number;

  /** Temperature setting */
  temperature?: number;

  /** Additional provider-specific options */
  options?: Record<string, any>;
}

/**
 * LLM request
 */
export interface LLMRequest {
  /** System prompt */
  systemPrompt?: string;

  /** User messages */
  messages: LLMMessage[];

  /** Maximum tokens to generate */
  maxTokens?: number;

  /** Temperature */
  temperature?: number;

  /** Additional options */
  options?: Record<string, any>;
}

/**
 * LLM message
 */
export interface LLMMessage {
  /** Message role */
  role: 'user' | 'assistant' | 'system';

  /** Message content */
  content: string;
}

/**
 * LLM response
 */
export interface LLMResponse {
  /** Generated text */
  text: string;

  /** Token usage */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /** Response metadata */
  metadata?: Record<string, any>;
}

/**
 * Export data models for persistence layer
 */
export type {
  Message,
  StoredLLMConfig,
  Settings,
  Project,
  AnalyticsSummary,
  EncryptionKeyInfo,
} from './models';
