import React from 'react';
import { RightPanelHeader } from './RightPanelHeader';
import { RightPanelWorkpane } from './RightPanelWorkpane';
import { RightPanelFooter } from './RightPanelFooter';

export const RightPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-gray-900">
      <RightPanelHeader />
      <RightPanelWorkpane />
      <RightPanelFooter />
    </div>
  );
};
