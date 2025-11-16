import React from 'react';
import { LeftPanelHeader } from './LeftPanelHeader';
import { LeftPanelWorkpane } from './LeftPanelWorkpane';
import { LeftPanelFooter } from './LeftPanelFooter';

export const LeftPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-700">
      <LeftPanelHeader />
      <LeftPanelWorkpane />
      <LeftPanelFooter />
    </div>
  );
};
