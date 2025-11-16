import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { ProjectsView } from './ProjectsView';
import { ConversationView } from './ConversationView';
import { FilesView } from './FilesView';

export const LeftPanelWorkpane: React.FC = () => {
  const leftPanelMode = useAppStore((state) => state.leftPanelMode);

  return (
    <div className="flex-1 overflow-hidden bg-gray-900">
      {leftPanelMode === 'projects' && <ProjectsView />}
      {leftPanelMode === 'conversation' && <ConversationView />}
      {leftPanelMode === 'files' && <FilesView />}
    </div>
  );
};
