# CCIDE Agent Coordination and Orchestration System

This directory contains the core orchestration services for CCIDE (Claude Code IDE), a web-based IDE for LLMs with a complete product development workflow.

## Architecture Overview

The orchestration system coordinates specialized agents through a 13-phase development lifecycle, from initial idea to deployment and documentation.

### Core Services

#### 1. AgentRegistry (`services/AgentRegistry.ts`)
- **Purpose**: Registry of available agents
- **Responsibilities**:
  - Register and manage specialized agents
  - Lookup agents by name, type, or phase
  - Provide agent metadata and capabilities
  - Load agents from markdown definitions

#### 2. AgentCommunication (`services/AgentCommunication.ts`)
- **Purpose**: Message passing between agents
- **Responsibilities**:
  - Send messages between agents
  - Broadcast messages to all agents
  - Message history tracking
  - Event-based communication
  - Wait for specific messages or responses

#### 3. WorkflowManager (`services/WorkflowManager.ts`)
- **Purpose**: State machine for workflow phases
- **Responsibilities**:
  - Define and manage 13 workflow phases
  - Validate phase transitions
  - Track dependencies between phases
  - Validate phase completion
  - Calculate workflow progress

#### 4. ProgressTracker (`services/ProgressTracker.ts`)
- **Purpose**: Track progress through workflow phases
- **Responsibilities**:
  - Maintain workflow state
  - Track deliverables
  - Record blockers and issues
  - Track user approvals
  - Persist state to disk
  - Generate progress reports

#### 5. AgentOrchestrator (`services/AgentOrchestrator.ts`)
- **Purpose**: Main orchestrator implementing the 13-phase workflow
- **Responsibilities**:
  - Coordinate agent execution
  - Manage phase transitions
  - Handle agent completion and errors
  - Request and track user approvals
  - Emit events for workflow milestones

#### 6. LLMService (`services/LLMService.ts`)
- **Purpose**: LLM integration for Claude API and other models
- **Responsibilities**:
  - Abstract LLM provider interactions
  - Support Claude (Anthropic) and OpenAI
  - Handle streaming and non-streaming requests
  - Track token usage

## Workflow Phases

The orchestration system implements a 13-phase workflow:

1. **Discovery** - Project setup and state assessment
2. **Specification** - Idea capture and spec creation
3. **ICP & Personas** - Target audience definition
4. **Architecture** - Page structure and information architecture
5. **UI/UX Design** - Wireframes, style guide, and components
6. **PRD** - Product requirements and implementation plan
7. **Parallel Planning** - Task breakdown for parallel execution
8. **Implementation** - Code development
9. **Code Review** - Quality assurance
10. **Testing** - Comprehensive testing
11. **Security** - Security assessment
12. **Performance** - Optimization
13. **Deployment** - Production deployment
14. **Documentation** - Complete documentation

## Type System

All TypeScript interfaces and types are defined in `types/index.ts`:

### Core Interfaces

- **Agent**: Contract for all specialized agents
- **AgentContext**: Execution context for agents
- **AgentResult**: Result of agent execution
- **WorkflowPhase**: Enum of all 13 phases
- **WorkflowPhaseConfig**: Configuration for each phase
- **ProgressState**: Current state of the workflow
- **Deliverable**: Output produced by an agent
- **AgentMessage**: Inter-agent communication message
- **OrchestratorConfig**: Configuration for the orchestrator
- **LLMConfig**: LLM provider configuration

### Enums

- **AgentType**: Agent categories (specification, design, implementation, etc.)
- **MessageType**: Types of inter-agent messages
- **DeliverableType**: Types of deliverables (document, code, test, etc.)

## Usage

### Basic Setup

```typescript
import {
  AgentOrchestrator,
  OrchestratorConfig,
  initializeLLMService
} from './services/index.js';

// Initialize LLM service
initializeLLMService({
  provider: 'anthropic',
  model: 'claude-sonnet-4-5-20250929',
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  maxTokens: 4096,
  temperature: 0.7
});

// Configure orchestrator
const config: OrchestratorConfig = {
  projectRoot: process.cwd(),
  autoProgress: false,
  requireApprovalPerPhase: true,
  phaseTimeout: 300000
};

// Create and initialize orchestrator
const orchestrator = new AgentOrchestrator(config);
await orchestrator.initialize();

// Start workflow
await orchestrator.start();
```

### Event Handling

```typescript
orchestrator.on('phase-started', ({ phase, agent }) => {
  console.log(`Phase ${phase} started with ${agent}`);
});

orchestrator.on('phase-completed', ({ phase }) => {
  console.log(`Phase ${phase} completed`);
});

orchestrator.on('approval-required', ({ phase, deliverables }) => {
  // Handle approval request
});
```

### Manual Phase Control

```typescript
// Get current state
const state = orchestrator.getWorkflowState();

// Approve a phase
await orchestrator.approvePhase(
  WorkflowPhase.SPECIFICATION,
  ['docs/plans/spec.md'],
  'Looks good!'
);

// Reject a phase
await orchestrator.rejectPhase(
  WorkflowPhase.SPECIFICATION,
  ['docs/plans/spec.md'],
  'Needs more detail'
);
```

## Integration with Existing Agents

The system integrates with agent definitions in `/agents/`:

- `spec-agent.md` - Specification development
- `icp-agent.md` - Customer profile and personas
- `arch-design-agent.md` - Architecture design
- `uiux-design-agent.md` - UI/UX design
- `prd-agent.md` - PRD and implementation planning
- `swarm-planning-agent.md` - Parallel task planning
- `coding-agent.md` - Code implementation
- `reviewer-agent.md` - Code review
- `testing-agent.md` - Testing
- `security-agent.md` - Security assessment
- `performance-agent.md` - Performance optimization
- `deployment-agent.md` - Deployment
- `documentation-agent.md` - Documentation

## File Structure

```
src/
├── types/
│   └── index.ts              # TypeScript interfaces and types
├── services/
│   ├── AgentRegistry.ts      # Agent registry service
│   ├── AgentCommunication.ts # Message passing service
│   ├── WorkflowManager.ts    # Workflow state machine
│   ├── ProgressTracker.ts    # Progress tracking service
│   ├── AgentOrchestrator.ts  # Main orchestrator
│   ├── LLMService.ts         # LLM integration
│   └── index.ts              # Service exports
├── examples/
│   └── orchestrator-usage.ts # Usage examples
└── README.md                 # This file
```

## Commands

### /bootstrap

Initialize a new CCIDE project:

```
/bootstrap
```

This command:
1. Creates project structure (docs/, pages/, components/, .ccide/)
2. Initializes workflow state
3. Creates workplan and progress files
4. Starts the orchestrator in Discovery phase

## State Persistence

The orchestrator persists state in two ways:

1. **JSON State File** (`.ccide/state.json`)
   - Complete workflow state
   - Machine-readable format
   - Used for resuming sessions

2. **Markdown Progress File** (`docs/plans/progress.md`)
   - Human-readable progress report
   - Current phase and completed phases
   - Deliverables by phase
   - Active blockers
   - Approval history

## Error Handling

The orchestrator provides robust error handling:

- **Agent Errors**: Captured and recorded as blockers
- **Phase Validation**: Ensures dependencies are satisfied
- **Deliverable Validation**: Checks for required deliverables
- **State Recovery**: Can resume from persisted state

## Events

The orchestrator emits the following events:

- `initialized` - Orchestrator initialized
- `workflow-started` - Workflow started
- `phase-started` - New phase started
- `phase-completed` - Phase completed
- `approval-required` - User approval needed
- `approval-requested` - Agent requested approval
- `phase-approved` - Phase approved by user
- `phase-rejected` - Phase rejected by user
- `progress-update` - Agent progress update
- `agent-error` - Agent encountered error
- `agent-failed` - Agent failed to complete
- `workflow-completed` - All phases complete
- `workflow-error` - Workflow error occurred
- `stopped` - Orchestrator stopped
- `reset` - Orchestrator reset

## Best Practices

1. **Always initialize LLM service before orchestrator**
2. **Set up event listeners before starting workflow**
3. **Persist state regularly** (automatically handled)
4. **Handle approval events appropriately**
5. **Monitor agent errors and blockers**
6. **Use type definitions** for type safety
7. **Follow the phase sequence** - don't skip phases

## Future Enhancements

- [ ] Web UI for orchestrator control
- [ ] Real-time collaboration support
- [ ] Agent hot-reloading
- [ ] Advanced scheduling algorithms
- [ ] Parallel agent execution
- [ ] Rollback and replay capabilities
- [ ] Enhanced metrics and analytics
- [ ] Plugin system for custom agents

## License

See main project LICENSE file.
