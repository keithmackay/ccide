/**
 * Phase Detection Utility
 * Detects phase completions and transitions from assistant messages
 */

import { ProjectPhase, PhaseInfo, PhaseDeliverable } from '../types/ui';

/**
 * Phase completion patterns to detect in messages
 */
const PHASE_COMPLETION_PATTERNS: Record<ProjectPhase, RegExp[]> = {
  discovery: [
    /phase\s+0.*completed?/i,
    /discovery.*completed?/i,
    /project.*setup.*completed?/i,
  ],
  specification: [
    /phase\s+1.*completed?/i,
    /specification.*completed?/i,
    /spec.*completed?/i,
    /idea.*documented/i,
  ],
  icp_personas: [
    /phase\s+2.*completed?/i,
    /icp.*completed?/i,
    /personas?.*completed?/i,
    /user.*profiles?.*completed?/i,
  ],
  architecture: [
    /phase\s+3.*completed?/i,
    /architecture.*completed?/i,
    /page.*structure.*completed?/i,
    /information.*architecture.*completed?/i,
  ],
  uiux_design: [
    /phase\s+4.*completed?/i,
    /ui\/ux.*completed?/i,
    /design.*completed?/i,
    /wireframes?.*completed?/i,
    /mockups?.*completed?/i,
  ],
  prd: [
    /phase\s+5.*completed?/i,
    /prd.*completed?/i,
    /implementation.*plan.*completed?/i,
    /product.*requirements?.*completed?/i,
  ],
  parallel_planning: [
    /phase\s+6.*completed?/i,
    /parallel.*planning.*completed?/i,
    /swarm.*planning.*completed?/i,
    /task.*breakdown.*completed?/i,
  ],
  implementation: [
    /phase\s+7.*completed?/i,
    /implementation.*completed?/i,
    /coding.*completed?/i,
    /development.*completed?/i,
  ],
  code_review: [
    /phase\s+8.*completed?/i,
    /code.*review.*completed?/i,
    /review.*completed?/i,
  ],
  performance: [
    /phase\s+9.*completed?/i,
    /performance.*optimization.*completed?/i,
    /optimization.*completed?/i,
  ],
  deployment: [
    /phase\s+10.*completed?/i,
    /deployment.*completed?/i,
    /deployed/i,
  ],
  documentation: [
    /phase\s+11.*completed?/i,
    /documentation.*completed?/i,
    /docs.*completed?/i,
  ],
  finalization: [
    /phase\s+12.*completed?/i,
    /finalization.*completed?/i,
    /project.*completed?/i,
    /workflow.*completed?/i,
  ],
};

/**
 * Deliverable path patterns to extract from messages
 */
const DELIVERABLE_PATTERNS = [
  {
    pattern: /docs\/plans\/([a-zA-Z0-9_-]+\.md)/gi,
    type: 'document' as const,
  },
  {
    pattern: /pages\/([a-zA-Z0-9_-]+\.md)/gi,
    type: 'document' as const,
  },
  {
    pattern: /components\/([a-zA-Z0-9_-]+\.html)/gi,
    type: 'code' as const,
  },
  {
    pattern: /src\/([a-zA-Z0-9_/-]+\.(ts|tsx|js|jsx))/gi,
    type: 'code' as const,
  },
  {
    pattern: /```mermaid[\s\S]*?```/gi,
    type: 'diagram' as const,
  },
];

/**
 * Detects if a message indicates phase completion
 */
export function detectPhaseCompletion(
  message: string,
  currentPhase: ProjectPhase | null
): ProjectPhase | null {
  if (!message) return null;

  // Check each phase for completion patterns
  for (const [phase, patterns] of Object.entries(PHASE_COMPLETION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return phase as ProjectPhase;
      }
    }
  }

  return null;
}

/**
 * Extracts deliverables mentioned in a message
 */
export function extractDeliverables(message: string): PhaseDeliverable[] {
  const deliverables: PhaseDeliverable[] = [];
  const foundPaths = new Set<string>();

  for (const { pattern, type } of DELIVERABLE_PATTERNS) {
    const matches = message.matchAll(pattern);
    for (const match of matches) {
      const path = match[0];

      // Avoid duplicates
      if (foundPaths.has(path)) continue;
      foundPaths.add(path);

      // Extract name from path
      const name = type === 'diagram'
        ? 'Mermaid Diagram'
        : path.split('/').pop() || path;

      deliverables.push({
        name,
        path: type === 'diagram' ? `diagram-${deliverables.length}` : path,
        type,
        preview: type === 'diagram' ? match[0] : undefined,
      });
    }
  }

  return deliverables;
}

/**
 * Detects phase transition in a message
 */
export function detectPhaseTransition(message: string): {
  from: ProjectPhase | null;
  to: ProjectPhase | null;
} | null {
  const transitionPattern = /phase\s+(\d+).*to.*phase\s+(\d+)/i;
  const match = message.match(transitionPattern);

  if (!match) return null;

  const phaseOrder: ProjectPhase[] = [
    'discovery',
    'specification',
    'icp_personas',
    'architecture',
    'uiux_design',
    'prd',
    'parallel_planning',
    'implementation',
    'code_review',
    'performance',
    'deployment',
    'documentation',
    'finalization',
  ];

  const fromIndex = parseInt(match[1]);
  const toIndex = parseInt(match[2]);

  return {
    from: phaseOrder[fromIndex] || null,
    to: phaseOrder[toIndex] || null,
  };
}

/**
 * Extracts completion message from a phase completion
 */
export function extractCompletionMessage(message: string): string | undefined {
  // Look for summary or conclusion sections
  const summaryMatch = message.match(/(?:summary|conclusion)[:\s]+(.*?)(?:\n\n|$)/is);
  if (summaryMatch) {
    return summaryMatch[1].trim().substring(0, 300);
  }

  // Look for the first paragraph after completion mention
  const completionMatch = message.match(/completed?[.!]\s+(.*?)(?:\n\n|$)/is);
  if (completionMatch) {
    return completionMatch[1].trim().substring(0, 300);
  }

  return undefined;
}

/**
 * Creates a PhaseInfo object from a detected completion
 */
export function createPhaseInfo(
  phase: ProjectPhase,
  message: string
): PhaseInfo {
  return {
    phase,
    status: 'awaiting_review',
    deliverables: extractDeliverables(message),
    completionMessage: extractCompletionMessage(message),
  };
}

/**
 * Checks if message contains phase start indicators
 */
export function detectPhaseStart(message: string): ProjectPhase | null {
  const startPattern = /starting\s+phase\s+(\d+)/i;
  const match = message.match(startPattern);

  if (!match) return null;

  const phaseOrder: ProjectPhase[] = [
    'discovery',
    'specification',
    'icp_personas',
    'architecture',
    'uiux_design',
    'prd',
    'parallel_planning',
    'implementation',
    'code_review',
    'performance',
    'deployment',
    'documentation',
    'finalization',
  ];

  const phaseIndex = parseInt(match[1]);
  return phaseOrder[phaseIndex] || null;
}
