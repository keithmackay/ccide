import React, { useEffect } from 'react';
import { LeftPanel } from './components/LeftPanel/LeftPanel';
import { RightPanel } from './components/RightPanel/RightPanel';
import { useAppStore } from './stores/appStore';
import { cn } from './utils/cn';
import { getSettingsService } from './services/SettingsService';
import { LLMModel } from './types/ui';

export const App: React.FC = () => {
  const isLeftPanelVisible = useAppStore((state) => state.isLeftPanelVisible);
  const setAvailableModels = useAppStore((state) => (state as any).setAvailableModels);
  const setSelectedModel = useAppStore((state) => state.setSelectedModel);

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
            setSelectedModel(models[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load saved models:', error);
      }
    };

    loadSavedModels();
  }, [setAvailableModels, setSelectedModel]);

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
