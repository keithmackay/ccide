import React from 'react';
import { Brain, Settings } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export const LeftPanelFooter: React.FC = () => {
  const leftPanelMode = useAppStore((state) => state.leftPanelMode);
  const selectedModel = useAppStore((state) => state.selectedModel);
  const contextUsage = useAppStore((state) => state.contextUsage);
  const availableModels = useAppStore((state) => state.availableModels);
  const setSelectedModel = useAppStore((state) => state.setSelectedModel);
  const setLeftPanelMode = useAppStore((state) => state.setLeftPanelMode);

  // Hide footer in Project Files mode
  if (leftPanelMode === 'files') {
    return null;
  }

  return (
    <div className="h-14 border-t border-gray-700 bg-gray-800 flex items-center justify-between px-4 gap-2">
      {/* Model Selector */}
      <div className="flex-1">
        <select
          value={selectedModel?.id || ''}
          onChange={(e) => {
            const model = availableModels.find((m) => m.id === e.target.value);
            setSelectedModel(model || null);
          }}
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Model</option>
          {availableModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      {/* Settings Icon - only show in projects mode */}
      {leftPanelMode === 'projects' && (
        <button
          onClick={() => setLeftPanelMode('settings')}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}

      {/* Context Usage */}
      {contextUsage && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Brain className="w-4 h-4" />
          <span>
            {contextUsage.used.toLocaleString()} ({contextUsage.percentage}%)
          </span>
        </div>
      )}
    </div>
  );
};
