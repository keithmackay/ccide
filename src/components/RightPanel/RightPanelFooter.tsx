import React from 'react';
import { File } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { cn } from '../../utils/cn';

export const RightPanelFooter: React.FC = () => {
  const availableFiles = useAppStore((state) => state.availableFiles);
  const selectedFile = useAppStore((state) => state.selectedFile);
  const setRightPanelContent = useAppStore((state) => state.setRightPanelContent);

  if (availableFiles.length === 0) {
    return null;
  }

  const handleFileClick = (filename: string) => {
    // Simulate loading file content (would be replaced with actual file reading)
    setRightPanelContent(
      `Content of ${filename}\n\nThis will be populated with actual file content by Agent 3.`,
      filename
    );
  };

  return (
    <div className="h-14 border-t border-gray-700 bg-gray-800 overflow-x-auto">
      <div className="flex items-center gap-2 px-4 h-full">
        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
          Available Files:
        </span>
        <div className="flex gap-2 overflow-x-auto">
          {availableFiles.map((filename) => (
            <button
              key={filename}
              onClick={() => handleFileClick(filename)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded text-xs whitespace-nowrap transition-colors',
                selectedFile?.name === filename
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              )}
            >
              <File className="w-3 h-3" />
              {filename}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
