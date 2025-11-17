import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export const RightPanelHeader: React.FC = () => {
  const isLeftPanelVisible = useAppStore((state) => state.isLeftPanelVisible);
  const toggleLeftPanel = useAppStore((state) => state.toggleLeftPanel);
  const rightPanelHeader = useAppStore((state) => state.rightPanelHeader);
  const selectedFile = useAppStore((state) => state.selectedFile);

  const displayHeader = selectedFile ? selectedFile.name : rightPanelHeader;

  return (
    <div className="h-12 border-b border-gray-700 bg-gray-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        {/* Show panel button when left panel is hidden */}
        {!isLeftPanelVisible && (
          <button
            onClick={toggleLeftPanel}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
            title="Show left panel"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <h2 className="text-sm font-semibold text-gray-200">{displayHeader}</h2>
      </div>
    </div>
  );
};
