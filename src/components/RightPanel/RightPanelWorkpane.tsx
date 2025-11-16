import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { FileText } from 'lucide-react';

export const RightPanelWorkpane: React.FC = () => {
  const rightPanelContent = useAppStore((state) => state.rightPanelContent);
  const selectedFile = useAppStore((state) => state.selectedFile);
  const activeProject = useAppStore((state) => state.activeProject);

  // Display file content if a file is selected
  const displayContent = selectedFile
    ? `File: ${selectedFile.path}\n\n${rightPanelContent || 'File content will be displayed here...'}`
    : rightPanelContent || 'Select a project or file to view content';

  const hasContent = rightPanelContent || selectedFile;

  return (
    <div className="flex-1 overflow-auto bg-gray-900 p-6">
      {!hasContent ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <FileText className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">No content to display</p>
          <p className="text-sm mt-2">
            {!activeProject
              ? 'Create or select a project to get started'
              : 'Files will be displayed here as you work'}
          </p>
        </div>
      ) : (
        <div className="max-w-5xl">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
            {displayContent}
          </pre>
        </div>
      )}
    </div>
  );
};
