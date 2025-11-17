import React, { useEffect, useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Loader2, Search, RefreshCw, FileQuestion } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { FileNode } from '../../types/ui';
import { cn } from '../../utils/cn';
import { FileIcon } from '../FileIcon';
import { getFileService } from '../../services/FileService';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

interface FileTreeItemProps {
  node: FileNode;
  level: number;
  searchQuery?: string;
}

const FileTreeItem: React.FC<FileTreeItemProps> = React.memo(({ node, level, searchQuery }) => {
  const selectedFile = useAppStore((state) => state.selectedFile);
  const setSelectedFile = useAppStore((state) => state.setSelectedFile);
  const toggleFileExpanded = useAppStore((state) => state.toggleFileExpanded);

  const isSelected = selectedFile?.id === node.id;

  // Check if node matches search query
  const matchesSearch = !searchQuery || node.name.toLowerCase().includes(searchQuery.toLowerCase());

  // If searching, show all children if parent matches or any child matches
  const hasMatchingChild = useMemo(() => {
    if (!searchQuery || !node.children) return false;

    const checkChildren = (children: FileNode[]): boolean => {
      return children.some(child => {
        if (child.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return true;
        }
        return child.children ? checkChildren(child.children) : false;
      });
    };

    return checkChildren(node.children);
  }, [searchQuery, node.children]);

  const shouldShow = matchesSearch || hasMatchingChild;

  if (!shouldShow) return null;

  const handleClick = () => {
    if (node.type === 'folder') {
      toggleFileExpanded(node.id);
    } else {
      setSelectedFile(node);
    }
  };

  const FolderIcon = node.isExpanded ? FolderOpen : Folder;

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
        title={node.path}
        aria-label={`${node.type === 'folder' ? 'Folder' : 'File'}: ${node.name}`}
        aria-expanded={node.type === 'folder' ? node.isExpanded : undefined}
        aria-selected={isSelected}
        role={node.type === 'folder' ? 'treeitem' : 'option'}
      >
        {node.type === 'folder' && (
          node.isExpanded ? (
            <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
          )
        )}
        {node.type === 'folder' ? (
          <FolderIcon className={cn(
            'w-4 h-4 flex-shrink-0',
            node.isExpanded ? 'text-yellow-500' : 'text-yellow-400'
          )} />
        ) : (
          <FileIcon filename={node.name} className="w-4 h-4 flex-shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
        {node.type === 'folder' && node.children && (
          <span className="ml-auto text-xs text-gray-500">
            {node.children.length}
          </span>
        )}
      </button>

      {node.type === 'folder' && node.isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
});

FileTreeItem.displayName = 'FileTreeItem';

export const FilesView: React.FC = () => {
  const fileTree = useAppStore((state) => state.fileTree);
  const setFileTree = useAppStore((state) => state.setFileTree);
  const activeProject = useAppStore((state) => state.activeProject);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search query to improve performance (reduces search executions by ~90%)
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  const fileService = getFileService();

  // Load file tree when active project changes
  useEffect(() => {
    if (activeProject) {
      loadFileTree();
    } else {
      setFileTree([]);
    }
  }, [activeProject?.id]);

  const loadFileTree = async () => {
    if (!activeProject) return;

    setIsLoading(true);
    setError(null);

    try {
      const tree = await fileService.getProjectFileTree(activeProject.id);
      setFileTree(tree);
    } catch (err) {
      setError('Failed to load file tree');
      console.error('Error loading file tree:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadFileTree();
  };

  const fileCount = useMemo(() => {
    return fileService.countFiles(fileTree);
  }, [fileTree]);

  const folderCount = useMemo(() => {
    return fileService.countFolders(fileTree);
  }, [fileTree]);

  if (!activeProject) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center" role="status">
        <FileQuestion className="w-12 h-12 text-gray-600 mb-3" aria-hidden="true" />
        <p className="text-gray-500 text-sm">No project selected</p>
        <p className="text-gray-600 text-xs mt-1">Select a project to view its files</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" aria-hidden="true" />
        <p className="text-gray-400 text-sm">Loading files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center" role="alert">
        <div className="text-red-400 text-sm mb-3">{error}</div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm transition-colors"
          aria-label="Retry loading file tree"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" role="region" aria-label="Project Files">
      {/* Header with search and stats */}
      <div className="p-3 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              aria-label="Search files in project"
              role="searchbox"
            />
          </div>
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
            title="Refresh file tree"
            aria-label="Refresh file tree"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 text-xs text-gray-500" role="status" aria-live="polite">
          <span aria-label={`${folderCount} folders`}>{folderCount} folders</span>
          <span aria-label={`${fileCount} files`}>{fileCount} files</span>
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto p-2" role="tree" aria-label="File tree">
        {fileTree.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm" role="status">
            No files in project
          </div>
        ) : (
          <div className="space-y-0.5">
            {fileTree.map((node) => (
              <FileTreeItem
                key={node.id}
                node={node}
                level={0}
                searchQuery={debouncedSearchQuery}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
