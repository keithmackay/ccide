import React, { useState } from 'react';
import { PhaseDeliverable } from '../../../types/ui';
import { FilePreviewPanel } from './FilePreviewPanel';
import { FileText, Code, FileCode, ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface PhaseFilesPanelProps {
  deliverables: PhaseDeliverable[];
  phaseName: string;
}

const DeliverableIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'code':
      return <Code className="w-5 h-5 text-blue-400" />;
    case 'diagram':
      return <FileCode className="w-5 h-5 text-purple-400" />;
    default:
      return <FileText className="w-5 h-5 text-green-400" />;
  }
};

export const PhaseFilesPanel: React.FC<PhaseFilesPanelProps> = ({
  deliverables,
}) => {
  const [selectedDeliverable, setSelectedDeliverable] = useState<PhaseDeliverable | null>(
    deliverables.length > 0 ? (deliverables[0] ?? null) : null
  );

  const handleDeliverableClick = (deliverable: PhaseDeliverable) => {
    setSelectedDeliverable(deliverable);
  };

  if (deliverables.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No Files Generated</p>
          <p className="text-sm mt-2">
            No deliverables were generated in this phase
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Left sidebar - file list */}
      <div className="w-80 border-r border-gray-700 flex flex-col bg-gray-850">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200">
            Phase Files
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {deliverables.length} {deliverables.length === 1 ? 'file' : 'files'} generated
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {deliverables.map((deliverable, index) => (
            <button
              key={index}
              onClick={() => handleDeliverableClick(deliverable)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-2 text-left',
                selectedDeliverable === deliverable
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              )}
            >
              <DeliverableIcon type={deliverable.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {deliverable.name}
                </p>
                <p className="text-xs opacity-75 truncate">
                  {deliverable.path}
                </p>
              </div>
              {selectedDeliverable === deliverable && (
                <ChevronRight className="w-5 h-5 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right panel - file preview */}
      <div className="flex-1 overflow-auto p-6">
        {selectedDeliverable ? (
          selectedDeliverable.preview ? (
            <FilePreviewPanel
              file={{
                id: selectedDeliverable.path,
                name: selectedDeliverable.name,
                path: selectedDeliverable.path,
                type: 'file',
              }}
              content={selectedDeliverable.preview}
              isNewlyGenerated={true}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Preview Available</p>
                <p className="text-sm mt-2">
                  Content preview is not available for this file
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a File</p>
              <p className="text-sm mt-2">
                Choose a file from the list to view its contents
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
