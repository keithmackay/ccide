/**
 * OrchestratorService - Manages CCIDE Orchestrator Agent workflow
 * Coordinates the multi-phase project development lifecycle
 */

import { Message } from '../types/ui';

/**
 * Project phase enumeration
 */
export enum ProjectPhase {
  DISCOVERY = 'discovery',
  SPECIFICATION = 'specification',
  ICP_PERSONAS = 'icp_personas',
  ARCHITECTURE = 'architecture',
  UIUX_DESIGN = 'uiux_design',
  PRD = 'prd',
  PARALLEL_PLANNING = 'parallel_planning',
  IMPLEMENTATION = 'implementation',
  CODE_REVIEW = 'code_review',
  PERFORMANCE = 'performance',
  DEPLOYMENT = 'deployment',
  DOCUMENTATION = 'documentation',
  FINALIZATION = 'finalization',
}

/**
 * Get the initial orchestrator message to kick off the workflow
 */
export function getOrchestratorInitialMessage(
  projectId: string,
  projectName: string
): Message {
  const content = `# CCIDE Orchestrator Workflow Started

**Project**: ${projectName}
**Project ID**: ${projectId}

---

I'm the CCIDE Orchestrator Agent, and I'll be guiding you through the complete development workflow for "${projectName}".

## Development Workflow Phases

I'll coordinate the following phases:

1. **Phase 0: Project Discovery & Setup** ← We are here
2. **Phase 1: Idea & Specification** (spec-agent)
3. **Phase 2: ICP & Personas** (icp-agent)
4. **Phase 3: Architecture & Pages** (arch-design-agent)
5. **Phase 4: UI/UX Design** (uiux-design-agent)
6. **Phase 5: PRD & Implementation Planning** (prd-agent)
7. **Phase 6: Parallel Planning** (swarm-planning-agent)
8. **Phase 7: Implementation** (coding-agent)
9. **Phase 8: Code Review** (reviewer-agent)
10. **Phase 9: Performance Optimization** (performance-agent)
11. **Phase 10: Deployment** (deployment-agent)
12. **Phase 11: Documentation** (documentation-agent)
13. **Phase 12: Finalization**

---

## Phase 0: Project Discovery & Setup

I'm now checking your project state and determining the best starting point.

**Let's begin with your idea!**

Please describe what you'd like to build. I'll work with you to:
- Capture your initial concept
- Ask clarifying questions to refine the idea
- Help you think through requirements
- Generate a comprehensive specification

**What would you like to create?**`;

  return {
    id: `msg-orchestrator-init-${Date.now()}`,
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
    projectId,
  };
}

/**
 * Get phase-specific prompts for the orchestrator
 */
export function getPhasePrompt(phase: ProjectPhase, projectName: string): string {
  const prompts: Record<ProjectPhase, string> = {
    [ProjectPhase.DISCOVERY]: `Starting Phase 0: Project Discovery & Setup for "${projectName}".

I'm analyzing the project state and preparing to begin the specification phase.

What is your project idea?`,

    [ProjectPhase.SPECIFICATION]: `Starting Phase 1: Idea & Specification for "${projectName}".

I'll now work with you to create a detailed specification document through interactive Q&A.

I'll ask one question at a time to help refine and clarify your idea. Let's build a comprehensive understanding of what you want to create.

What is the core problem or need that ${projectName} addresses?`,

    [ProjectPhase.ICP_PERSONAS]: `Starting Phase 2: ICP & Personas for "${projectName}".

Now that we have a specification, I need to understand your target users better.

I'll help you define:
- Ideal Customer Profile (ICP)
- Primary user types
- Detailed user personas

Who is the primary target user for ${projectName}?`,

    [ProjectPhase.ARCHITECTURE]: `Starting Phase 3: Architecture & Pages for "${projectName}".

With user personas defined, I'll now design the technical architecture and page structure.

I'll create:
- Page structure and hierarchy
- Information architecture
- Navigation graphs
- Mermaid.js diagrams

Let me analyze your requirements to design the optimal structure...`,

    [ProjectPhase.UIUX_DESIGN]: `Starting Phase 4: UI/UX Design for "${projectName}".

I'll now create the user experience design:
- User flow documents
- ASCII wireframes
- Style guide
- Component library
- HTML/CSS mockups

Beginning design process...`,

    [ProjectPhase.PRD]: `Starting Phase 5: PRD & Implementation Planning for "${projectName}".

Synthesizing all previous work into:
- Product Requirements Document (PRD)
- Detailed implementation plan
- Bite-sized development tasks
- Testing requirements

Creating comprehensive PRD...`,

    [ProjectPhase.PARALLEL_PLANNING]: `Starting Phase 6: Parallel Planning for "${projectName}".

Analyzing implementation plan to:
- Identify independent work streams
- Create parallel task breakdown
- Define agent assignments
- Optimize execution strategy

Planning parallel execution...`,

    [ProjectPhase.IMPLEMENTATION]: `Starting Phase 7: Implementation for "${projectName}".

Coordinating development:
- Executing implementation tasks
- Writing code and tests
- Managing parallel streams
- Ensuring code quality

Beginning implementation...`,

    [ProjectPhase.CODE_REVIEW]: `Starting Phase 8: Code Review for "${projectName}".

Reviewing implementation:
- Code quality analysis
- Best practices verification
- Security assessment
- Improvement suggestions

Initiating code review...`,

    [ProjectPhase.PERFORMANCE]: `Starting Phase 9: Performance Optimization for "${projectName}".

Optimizing performance:
- Token usage analysis
- Context window optimization
- Runtime performance
- Resource efficiency

Beginning performance optimization...`,

    [ProjectPhase.DEPLOYMENT]: `Starting Phase 10: Deployment for "${projectName}".

Preparing for deployment:
- CI/CD pipeline setup
- Environment configuration
- Deployment automation
- Monitoring setup

Configuring deployment...`,

    [ProjectPhase.DOCUMENTATION]: `Starting Phase 11: Documentation for "${projectName}".

Creating documentation:
- User guides
- API documentation
- Developer guides
- Deployment instructions

Generating documentation...`,

    [ProjectPhase.FINALIZATION]: `Starting Phase 12: Finalization for "${projectName}".

Completing the project:
- Final review
- Documentation verification
- Deliverables compilation
- Handoff preparation

Finalizing project...`,
  };

  return prompts[phase];
}

/**
 * Determine the current phase based on project state
 * This would inspect the project directory to see what's already been completed
 */
export function detectProjectPhase(projectPath: string): ProjectPhase {
  // TODO: Implement phase detection based on existing files
  // For now, always start at discovery
  return ProjectPhase.DISCOVERY;
}

/**
 * Get the next phase in the workflow
 */
export function getNextPhase(currentPhase: ProjectPhase): ProjectPhase | null {
  const phaseOrder = [
    ProjectPhase.DISCOVERY,
    ProjectPhase.SPECIFICATION,
    ProjectPhase.ICP_PERSONAS,
    ProjectPhase.ARCHITECTURE,
    ProjectPhase.UIUX_DESIGN,
    ProjectPhase.PRD,
    ProjectPhase.PARALLEL_PLANNING,
    ProjectPhase.IMPLEMENTATION,
    ProjectPhase.CODE_REVIEW,
    ProjectPhase.PERFORMANCE,
    ProjectPhase.DEPLOYMENT,
    ProjectPhase.DOCUMENTATION,
    ProjectPhase.FINALIZATION,
  ];

  const currentIndex = phaseOrder.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
    return null;
  }

  return phaseOrder[currentIndex + 1];
}

/**
 * Check if a phase is complete
 * This would verify the deliverables for each phase exist
 */
export function isPhaseComplete(phase: ProjectPhase, projectPath: string): boolean {
  // TODO: Implement deliverable checking
  // For now, return false
  return false;
}

/**
 * Get human-readable phase name
 */
export function getPhaseName(phase: ProjectPhase): string {
  const names: Record<ProjectPhase, string> = {
    [ProjectPhase.DISCOVERY]: 'Project Discovery & Setup',
    [ProjectPhase.SPECIFICATION]: 'Idea & Specification',
    [ProjectPhase.ICP_PERSONAS]: 'ICP & Personas',
    [ProjectPhase.ARCHITECTURE]: 'Architecture & Pages',
    [ProjectPhase.UIUX_DESIGN]: 'UI/UX Design',
    [ProjectPhase.PRD]: 'PRD & Implementation Planning',
    [ProjectPhase.PARALLEL_PLANNING]: 'Parallel Planning',
    [ProjectPhase.IMPLEMENTATION]: 'Implementation',
    [ProjectPhase.CODE_REVIEW]: 'Code Review',
    [ProjectPhase.PERFORMANCE]: 'Performance Optimization',
    [ProjectPhase.DEPLOYMENT]: 'Deployment',
    [ProjectPhase.DOCUMENTATION]: 'Documentation',
    [ProjectPhase.FINALIZATION]: 'Finalization',
  };

  return names[phase];
}
