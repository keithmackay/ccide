import React from 'react';
import { FileNode } from '../../../types/ui';
import { File, Folder, Calendar, HardDrive } from 'lucide-react';

interface FileMetadataProps {
  file: FileNode;
  size?: number;
  lastModified?: Date;
}

export const FileMetadata: React.FC<FileMetadataProps> = ({
  file,
  size,
  lastModified,
}) => {
  const formatSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (date?: Date): string => {
    if (!date) return 'Unknown';
    return date.toLocaleString();
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {file.type === 'folder' ? (
            <Folder className="w-12 h-12 text-blue-400" />
          ) : (
            <File className="w-12 h-12 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-200 truncate mb-2">
            {file.name}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <File className="w-4 h-4" />
              <span className="font-medium">Path:</span>
              <span className="text-gray-300 truncate">{file.path}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <HardDrive className="w-4 h-4" />
              <span className="font-medium">Size:</span>
              <span className="text-gray-300">{formatSize(size)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Last Modified:</span>
              <span className="text-gray-300">{formatDate(lastModified)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="font-medium">Type:</span>
              <span className="text-gray-300 capitalize">{file.type}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
