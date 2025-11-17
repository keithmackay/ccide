/**
 * AgentRegistry - Registry of available agents
 * Maintains a central registry of all specialized agents in the CCIDE system
 */

import {
  Agent,
  AgentType,
  AgentMetadata,
  WorkflowPhase
} from '../types/index.js';

/**
 * Agent registry service
 * Manages registration and lookup of specialized agents
 */
export class AgentRegistry {
  private agents: Map<string, Agent>;
  private agentsByType: Map<AgentType, Agent[]>;
  private agentsByPhase: Map<WorkflowPhase, Agent[]>;

  constructor() {
    this.agents = new Map();
    this.agentsByType = new Map();
    this.agentsByPhase = new Map();
  }

  /**
   * Register an agent in the registry
   */
  register(agent: Agent): void {
    // Add to main registry
    this.agents.set(agent.name, agent);

    // Index by type
    if (!this.agentsByType.has(agent.type)) {
      this.agentsByType.set(agent.type, []);
    }
    this.agentsByType.get(agent.type)!.push(agent);

    console.log(`[AgentRegistry] Registered agent: ${agent.name} (${agent.type})`);
  }

  /**
   * Unregister an agent from the registry
   */
  unregister(agentName: string): boolean {
    const agent = this.agents.get(agentName);
    if (!agent) {
      return false;
    }

    // Remove from main registry
    this.agents.delete(agentName);

    // Remove from type index
    const typeAgents = this.agentsByType.get(agent.type);
    if (typeAgents) {
      const index = typeAgents.findIndex(a => a.name === agentName);
      if (index !== -1) {
        typeAgents.splice(index, 1);
      }
    }

    console.log(`[AgentRegistry] Unregistered agent: ${agentName}`);
    return true;
  }

  /**
   * Get an agent by name
   */
  getAgent(name: string): Agent | undefined {
    return this.agents.get(name);
  }

  /**
   * Get all agents of a specific type
   */
  getAgentsByType(type: AgentType): Agent[] {
    return this.agentsByType.get(type) || [];
  }

  /**
   * Get all agents suitable for a specific workflow phase
   */
  getAgentsForPhase(phase: WorkflowPhase): Agent[] {
    // Map phases to agent names based on ccide-orchestrator-agent.md
    const phaseAgentMap: Record<WorkflowPhase, string[]> = {
      [WorkflowPhase.DISCOVERY]: ['ccide-orchestrator-agent'],
      [WorkflowPhase.SPECIFICATION]: ['spec-agent'],
      [WorkflowPhase.ICP_PERSONAS]: ['icp-agent'],
      [WorkflowPhase.ARCHITECTURE]: ['arch-design-agent'],
      [WorkflowPhase.UIUX_DESIGN]: ['uiux-design-agent'],
      [WorkflowPhase.PRD]: ['prd-agent'],
      [WorkflowPhase.PARALLEL_PLANNING]: ['swarm-planning-agent'],
      [WorkflowPhase.IMPLEMENTATION]: ['coding-agent'],
      [WorkflowPhase.CODE_REVIEW]: ['reviewer-agent'],
      [WorkflowPhase.TESTING]: ['testing-agent'],
      [WorkflowPhase.SECURITY]: ['security-agent'],
      [WorkflowPhase.PERFORMANCE]: ['performance-agent'],
      [WorkflowPhase.DEPLOYMENT]: ['deployment-agent'],
      [WorkflowPhase.DOCUMENTATION]: ['documentation-agent']
    };

    const agentNames = phaseAgentMap[phase] || [];
    return agentNames
      .map(name => this.agents.get(name))
      .filter((agent): agent is Agent => agent !== undefined);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Check if an agent is registered
   */
  hasAgent(name: string): boolean {
    return this.agents.has(name);
  }

  /**
   * Get agent metadata by name
   */
  getAgentMetadata(name: string): AgentMetadata | undefined {
    const agent = this.agents.get(name);
    return agent?.getMetadata();
  }

  /**
   * List all registered agent names
   */
  listAgentNames(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Get statistics about registered agents
   */
  getStats(): {
    totalAgents: number;
    agentsByType: Record<string, number>;
  } {
    const agentsByTypeCount: Record<string, number> = {};
    
    for (const [type, agents] of this.agentsByType.entries()) {
      agentsByTypeCount[type] = agents.length;
    }

    return {
      totalAgents: this.agents.size,
      agentsByType: agentsByTypeCount
    };
  }

  /**
   * Clear all registered agents
   */
  clear(): void {
    this.agents.clear();
    this.agentsByType.clear();
    this.agentsByPhase.clear();
    console.log('[AgentRegistry] Cleared all agents');
  }

  /**
   * Load agents from markdown definitions in /agents directory
   */
  async loadAgentsFromDefinitions(agentsDir: string): Promise<void> {
    // This would parse the .md files in the agents directory
    // and create agent instances based on their definitions
    // For now, this is a placeholder for the integration logic
    console.log(`[AgentRegistry] Loading agents from: ${agentsDir}`);
    // TODO: Implement agent definition parsing and instantiation
  }
}

// Singleton instance
let registryInstance: AgentRegistry | null = null;

/**
 * Get the global agent registry instance
 */
export function getAgentRegistry(): AgentRegistry {
  if (!registryInstance) {
    registryInstance = new AgentRegistry();
  }
  return registryInstance;
}

/**
 * Reset the global agent registry instance (useful for testing)
 */
export function resetAgentRegistry(): void {
  registryInstance = null;
}
