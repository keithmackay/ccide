import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { FileText } from 'lucide-react';
import { SettingsPage } from '../SettingsPage';
import { PhaseReviewPanel } from './PhaseReviewPanel';
import { FilePreviewPanel } from './FilePreview';

export const RightPanelWorkpane: React.FC = () => {
  const rightPanelMode = useAppStore((state) => state.rightPanelMode);
  const rightPanelContent = useAppStore((state) => state.rightPanelContent);
  const selectedFile = useAppStore((state) => state.selectedFile);
  const activeProject = useAppStore((state) => state.activeProject);
  const setRightPanelMode = useAppStore((state) => state.setRightPanelMode);

  // Show settings page
  if (rightPanelMode === 'settings') {
    return <SettingsPage onClose={() => setRightPanelMode('content')} />;
  }

  // Show phase review panel
  if (rightPanelMode === 'phase-review') {
    return <PhaseReviewPanel />;
  }

  // Display file preview if a file is selected
  if (selectedFile) {
    return (
      <div className="flex-1 overflow-auto bg-gray-900 p-6">
        <FilePreviewPanel
          file={selectedFile}
          content={rightPanelContent}
        />
      </div>
    );
  }

  // Display generic content if available
  const hasContent = rightPanelContent;

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
            {rightPanelContent}
          </pre>
        </div>
      )}
    </div>
  );
};
