import React, { useEffect, useState } from 'react';
import { LeftPanel } from './components/LeftPanel/LeftPanel';
import { RightPanel } from './components/RightPanel/RightPanel';
import { LoginScreen } from './components/Auth/LoginScreen';
import { AccountSetup } from './components/Auth/AccountSetup';
import { useAppStore } from './stores/appStore';
import { cn } from './utils/cn';
import { getSettingsService } from './services/SettingsService';
import { getAccountService } from './services/AccountService';
import { LLMModel } from './types/ui';
import { usePasswordSession } from './hooks/usePasswordSession';
import { getDefaultModelConfig } from './services/SettingsHelper';
import { initializeLLMService, resetLLMService } from './services/LLMService';
import { LLMConfig } from './types/index';

export const App: React.FC = () => {
  const isLeftPanelVisible = useAppStore((state) => state.isLeftPanelVisible);
  const setAvailableModels = useAppStore((state) => (state as any).setAvailableModels);
  const setSelectedModel = useAppStore((state) => state.setSelectedModel);
  const loadProjects = useAppStore((state) => state.loadProjects);
  const clearAllProjects = useAppStore((state) => state.clearAllProjects);
  const { password, setPassword } = usePasswordSession();

  // Expose clearAllProjects to window for dev console access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__clearAllProjects = clearAllProjects;
      console.log('[App] Debug: window.__clearAllProjects() available in console');
    }
  }, [clearAllProjects]);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  // Handle successful login
  const handleLoginSuccess = (loginPassword: string) => {
    setPassword(loginPassword, true);
    setIsAuthenticated(true);
  };

  // Handle account setup completion
  const handleSetupComplete = (setupPassword: string) => {
    setPassword(setupPassword, true);
    setIsAuthenticated(true);
    setShowSetup(false);
  };

  // Load saved models on app initialization
  useEffect(() => {
    const loadSavedModels = async () => {
      try {
        const settingsService = getSettingsService();
        const settings = await settingsService.getSettings();

        if (settings?.llmConfigs && settings.llmConfigs.length > 0) {
          // Convert stored configs to LLMModel format
          const models: LLMModel[] = settings.llmConfigs.map(config => ({
            id: config.id,
            name: config.modelName,
            provider: config.provider,
            contextWindow: config.maxTokens || 200000, // Default context window
          }));

          // Update app store with available models
          if (setAvailableModels) {
            setAvailableModels(models);
          }

          // Set the default model
          const defaultConfig = settings.llmConfigs.find(c => c.isDefault);
          if (defaultConfig) {
            const defaultModel = models.find(m => m.id === defaultConfig.id);
            if (defaultModel) {
              setSelectedModel(defaultModel);
            }
          } else if (models.length > 0) {
            // If no default, use first model
            const firstModel = models[0];
            if (firstModel) {
              setSelectedModel(firstModel);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load saved models:', error);
      }
    };

    loadSavedModels();
  }, [setAvailableModels, setSelectedModel]);

  // Load projects from database when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[App] Loading projects from database...');
      loadProjects().then(() => {
        console.log('[App] Projects loaded successfully');
      }).catch((error) => {
        console.error('[App] Failed to load projects:', error);
      });
    }
  }, [isAuthenticated, loadProjects]);

  // Initialize LLM service when password is available
  useEffect(() => {
    const initLLMService = async () => {
      if (!password) {
        // No password, reset LLM service
        console.log('[App] No password available, LLM service not initialized');
        resetLLMService();
        return;
      }

      try {
        console.log('\n═══════════════════════════════════════════════════');
        console.log('[App] 🔐 User logged in - Initializing LLM service...');
        console.log('═══════════════════════════════════════════════════');

        // Get default model config with decrypted API key
        const modelConfig = await getDefaultModelConfig(password);

        if (!modelConfig) {
          console.log('[App] ⚠️  No default model configured');
          console.log('[App] 💡 User needs to configure API keys in Settings');
          console.log('═══════════════════════════════════════════════════\n');
          return;
        }

        console.log('[App] ✓ Default model config retrieved:');
        console.log('  → Provider:', modelConfig.provider);
        console.log('  → Model:', modelConfig.modelName);
        console.log('  → Endpoint:', modelConfig.endpoint || 'proxy (default)');
        console.log('  → API key:', modelConfig.apiKey ? '✓ present' : '✗ missing');
        console.log('  → API key length:', modelConfig.apiKey?.length || 0, 'chars');
        console.log('  → Max tokens:', modelConfig.maxTokens || 4096);
        console.log('  → Temperature:', modelConfig.temperature ?? 0.7);

        // Convert StoredLLMConfig to LLMConfig
        const llmConfig: LLMConfig = {
          provider: modelConfig.provider,
          model: modelConfig.modelName,
          apiKey: modelConfig.apiKey,
          endpoint: modelConfig.endpoint,
          maxTokens: modelConfig.maxTokens,
          temperature: modelConfig.temperature,
        };

        // Initialize the LLM service
        initializeLLMService(llmConfig);
        console.log('\n[App] ✅ LLM service initialized successfully!');
        console.log('[App] 🚀 All conversations will use:', modelConfig.modelName);
        console.log('[App] 🔄 Conversations will be routed through configured LLM service');
        console.log('═══════════════════════════════════════════════════\n');
      } catch (error) {
        console.error('\n[App] ❌ Failed to initialize LLM service');
        console.error('[App] Error:', error instanceof Error ? error.message : 'Unknown error');
        console.error('[App] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        console.log('═══════════════════════════════════════════════════\n');
      }
    };

    initLLMService();
  }, [password]);

  // Show account setup screen when requested
  if (showSetup) {
    return <AccountSetup onSetupComplete={handleSetupComplete} />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onNeedSetup={() => setShowSetup(true)}
      />
    );
  }

  // Main application (only shown when authenticated)
  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Left Panel - 1/3 width when visible */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          isLeftPanelVisible ? 'w-1/3 min-w-[320px] max-w-[600px]' : 'w-0'
        )}
      >
        {isLeftPanelVisible && <LeftPanel />}
      </div>

      {/* Right Panel - 2/3 width, or full width when left panel is hidden */}
      <div
        className={cn(
          'flex-1 transition-all duration-300 ease-in-out',
          isLeftPanelVisible ? 'w-2/3' : 'w-full'
        )}
      >
        <RightPanel />
      </div>
    </div>
  );
};
