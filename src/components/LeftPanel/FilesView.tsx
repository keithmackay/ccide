import React from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { FileNode } from '../../types/ui';
import { cn } from '../../utils/cn';

interface FileTreeItemProps {
  node: FileNode;
  level: number;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, level }) => {
  const selectedFile = useAppStore((state) => state.selectedFile);
  const setSelectedFile = useAppStore((state) => state.setSelectedFile);
  const toggleFileExpanded = useAppStore((state) => state.toggleFileExpanded);

  const isSelected = selectedFile?.id === node.id;

  const handleClick = () => {
    if (node.type === 'folder') {
      toggleFileExpanded(node.id);
    } else {
      setSelectedFile(node);
    }
  };

  const Icon =
    node.type === 'folder'
      ? node.isExpanded
        ? FolderOpen
        : Folder
      : File;

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors',
          isSelected
            ? 'bg-blue-600 text-white'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {node.type === 'folder' && (
          node.isExpanded ? (
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          )
        )}
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>

      {node.type === 'folder' && node.isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FilesView: React.FC = () => {
  const fileTree = useAppStore((state) => state.fileTree);

  return (
    <div className="h-full overflow-y-auto p-2">
      {fileTree.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          No files in project
        </div>
      ) : (
        <div className="space-y-0.5">
          {fileTree.map((node) => (
            <FileTreeItem key={node.id} node={node} level={0} />
          ))}
        </div>
      )}
    </div>
  );
};
