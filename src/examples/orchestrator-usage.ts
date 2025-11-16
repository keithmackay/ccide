/**
 * Example: Using the Agent Orchestrator
 * Demonstrates how to initialize and use the orchestration system
 */

import {
  AgentOrchestrator,
  OrchestratorConfig,
  WorkflowPhase,
  initializeLLMService
} from '../services/index.js';

async function main() {
  // 1. Configure LLM service (Claude)
  initializeLLMService({
    provider: 'anthropic',
    model: 'claude-sonnet-4-5-20250929',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    maxTokens: 4096,
    temperature: 0.7
  });

  // 2. Configure orchestrator
  const config: OrchestratorConfig = {
    projectRoot: process.cwd(),
    autoProgress: false, // Require manual progression between phases
    requireApprovalPerPhase: true,
    phaseTimeout: 300000, // 5 minutes per phase
    progressFilePath: './docs/plans/progress.md',
    stateFilePath: './.ccide/state.json'
  };

  // 3. Create orchestrator
  const orchestrator = new AgentOrchestrator(config);

  // 4. Set up event listeners
  orchestrator.on('initialized', () => {
    console.log('Orchestrator initialized!');
  });

  orchestrator.on('workflow-started', () => {
    console.log('Workflow started!');
  });

  orchestrator.on('phase-started', ({ phase, agent }) => {
    console.log('Phase started:', phase, 'with agent:', agent);
  });

  orchestrator.on('phase-completed', ({ phase }) => {
    console.log('Phase completed:', phase);
  });

  orchestrator.on('approval-required', ({ phase, deliverables }) => {
    console.log('Approval required for phase:', phase);
    console.log('Deliverables:', deliverables.map(d => d.path));
  });

  orchestrator.on('workflow-completed', () => {
    console.log('Workflow completed!');
  });

  orchestrator.on('agent-error', ({ agent, error }) => {
    console.error('Agent error from', agent + ':', error);
  });

  // 5. Initialize orchestrator
  await orchestrator.initialize();

  // 6. Start workflow
  await orchestrator.start();

  // 7. Get current state
  const state = orchestrator.getWorkflowState();
  console.log('Current phase:', state.currentPhase);
  console.log('Progress:', orchestrator.getProgress() + '%');

  // 8. Approve phase (example)
  // await orchestrator.approvePhase(
  //   WorkflowPhase.SPECIFICATION,
  //   ['docs/plans/spec.md'],
  //   'Looks good!'
  // );

  // 9. Stop orchestrator when done
  // await orchestrator.stop();
}

// Run example
if (import.meta.url === 'file://' + process.argv[1]) {
  main().catch(console.error);
}

export { main };
