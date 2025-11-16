import React from 'react';
import { ChevronLeft, FolderOpen, MessageSquare, FolderTree } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { PanelMode } from '../../types/ui';
import { cn } from '../../utils/cn';

export const LeftPanelHeader: React.FC = () => {
  const leftPanelMode = useAppStore((state) => state.leftPanelMode);
  const setLeftPanelMode = useAppStore((state) => state.setLeftPanelMode);
  const toggleLeftPanel = useAppStore((state) => state.toggleLeftPanel);

  const modes: { mode: PanelMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'projects', label: 'Projects', icon: <FolderOpen className="w-4 h-4" /> },
    { mode: 'conversation', label: 'Conversation', icon: <MessageSquare className="w-4 h-4" /> },
    { mode: 'files', label: 'Files', icon: <FolderTree className="w-4 h-4" /> },
  ];

  return (
    <div className="h-12 border-b border-gray-700 bg-gray-800 flex items-center justify-between px-4">
      {/* Mode Selector */}
      <div className="flex gap-1 bg-gray-900 rounded-md p-1">
        {modes.map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => setLeftPanelMode(mode)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors',
              leftPanelMode === mode
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            )}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Hide Panel Button */}
      <button
        onClick={toggleLeftPanel}
        className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
        title="Hide panel"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    </div>
  );
};
