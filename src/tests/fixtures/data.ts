/**
 * Test fixtures - Mock data for testing
 */

import {
  Message,
  LLMConfig,
  Settings,
  Project,
  AnalyticsSummary,
} from '@types/models';

/**
 * Mock Messages
 */
export const mockMessages: Message[] = [
  {
    id: 1,
    timestamp: Date.now() - 3600000,
    projectId: 'project-1',
    userMessage: 'Hello, how can I create a React component?',
    llmResponse: 'Here is how to create a React component...',
    tokens: 150,
    model: 'claude-3-opus',
    status: 'success',
  },
  {
    id: 2,
    timestamp: Date.now() - 1800000,
    projectId: 'project-1',
    userMessage: 'Can you help me with TypeScript?',
    llmResponse: 'Sure! TypeScript is...',
    tokens: 200,
    model: 'claude-3-sonnet',
    status: 'success',
  },
  {
    id: 3,
    timestamp: Date.now() - 900000,
    projectId: 'project-2',
    userMessage: 'What is IndexedDB?',
    llmResponse: 'IndexedDB is...',
    tokens: 180,
    model: 'gpt-4',
    status: 'success',
  },
];

/**
 * Mock LLM Configs
 */
export const mockLLMConfigs: LLMConfig[] = [
  {
    id: 'config-1',
    provider: 'anthropic',
    modelName: 'claude-3-opus',
    apiKey: 'sk-ant-test-key-123',
    isDefault: true,
    maxTokens: 4096,
    temperature: 0.7,
  },
  {
    id: 'config-2',
    provider: 'openai',
    modelName: 'gpt-4',
    apiKey: 'sk-test-key-456',
    isDefault: false,
    maxTokens: 8192,
    temperature: 0.5,
  },
];

/**
 * Mock Settings
 */
export const mockSettings: Settings = {
  id: 1,
  llmConfigs: mockLLMConfigs,
  preferences: {
    theme: 'dark',
    defaultModel: 'claude-3-opus',
    autoSave: true,
  },
  lastUpdated: Date.now(),
};

/**
 * Mock Projects
 */
export const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'E-Commerce Platform',
    status: 'active',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 3600000,
    path: '/projects/ecommerce',
    description: 'Building a modern e-commerce platform',
    tags: ['react', 'typescript', 'tailwind'],
  },
  {
    id: 'project-2',
    name: 'Blog System',
    status: 'active',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 1800000,
    path: '/projects/blog',
    description: 'Personal blog with CMS',
    tags: ['nextjs', 'markdown'],
  },
  {
    id: 'project-3',
    name: 'Old Project',
    status: 'archived',
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 15,
    path: '/projects/old',
    description: 'Archived project',
    tags: ['legacy'],
  },
];

/**
 * Mock Analytics Summary
 */
export const mockAnalyticsSummary: AnalyticsSummary = {
  totalMessages: 150,
  totalTokens: 50000,
  projectBreakdown: [
    {
      projectId: 'project-1',
      projectName: 'E-Commerce Platform',
      messageCount: 80,
      tokenCount: 30000,
    },
    {
      projectId: 'project-2',
      projectName: 'Blog System',
      messageCount: 70,
      tokenCount: 20000,
    },
  ],
  modelUsage: [
    {
      model: 'claude-3-opus',
      count: 90,
      tokens: 35000,
    },
    {
      model: 'gpt-4',
      count: 60,
      tokens: 15000,
    },
  ],
  dateRange: {
    start: Date.now() - 86400000 * 30,
    end: Date.now(),
  },
};

/**
 * Factory functions for creating test data
 */
export const createMockMessage = (overrides?: Partial<Message>): Message => ({
  timestamp: Date.now(),
  projectId: 'test-project',
  userMessage: 'Test question',
  llmResponse: 'Test response',
  tokens: 100,
  model: 'test-model',
  status: 'success',
  ...overrides,
});

export const createMockProject = (overrides?: Partial<Project>): Project => ({
  id: 'test-project-' + Math.random(),
  name: 'Test Project',
  status: 'active',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  path: '/test/path',
  ...overrides,
});

export const createMockLLMConfig = (
  overrides?: Partial<LLMConfig>
): LLMConfig => ({
  id: 'test-config-' + Math.random(),
  provider: 'anthropic',
  modelName: 'test-model',
  apiKey: 'test-key',
  isDefault: false,
  ...overrides,
});
