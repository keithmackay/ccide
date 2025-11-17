/**
 * Unit tests for FilesView component
 * Tests file tree rendering, navigation, and interactions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, renderWithProviders, userEvent } from '../../utils/test-utils';
import { FilesView } from '../../../components/LeftPanel/FilesView';
import { useAppStore } from '../../../stores/appStore';
import { FileNode } from '../../../types/ui';

// Mock data
const mockFileTree: FileNode[] = [
  {
    id: '1',
    name: 'src',
    path: '/project/src',
    type: 'folder',
    isExpanded: false,
    children: [
      {
        id: '2',
        name: 'components',
        path: '/project/src/components',
        type: 'folder',
        isExpanded: false,
        children: [
          {
            id: '3',
            name: 'App.tsx',
            path: '/project/src/components/App.tsx',
            type: 'file',
          },
        ],
      },
      {
        id: '4',
        name: 'index.ts',
        path: '/project/src/index.ts',
        type: 'file',
      },
    ],
  },
  {
    id: '5',
    name: 'README.md',
    path: '/project/README.md',
    type: 'file',
  },
];

const mockFileTreeWithSpecialChars: FileNode[] = [
  {
    id: '1',
    name: 'folder with spaces',
    path: '/project/folder with spaces',
    type: 'folder',
    isExpanded: false,
    children: [
      {
        id: '2',
        name: 'file-with-dashes.tsx',
        path: '/project/folder with spaces/file-with-dashes.tsx',
        type: 'file',
      },
      {
        id: '3',
        name: 'file_with_underscores.ts',
        path: '/project/folder with spaces/file_with_underscores.ts',
        type: 'file',
      },
    ],
  },
  {
    id: '4',
    name: 'file.with.dots.js',
    path: '/project/file.with.dots.js',
    type: 'file',
  },
];

describe('FilesView', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      fileTree: [],
      selectedFile: null,
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no files exist', () => {
      renderWithProviders(<FilesView />);

      expect(screen.getByText('No files in project')).toBeInTheDocument();
    });

    it('should have proper styling for empty state', () => {
      renderWithProviders(<FilesView />);

      const emptyState = screen.getByText('No files in project');
      expect(emptyState).toHaveClass('text-gray-500');
    });
  });

  describe('File Tree Rendering', () => {
    it('should render root level files and folders', () => {
      useAppStore.setState({ fileTree: mockFileTree });
      renderWithProviders(<FilesView />);

      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.getByText('README.md')).toBeInTheDocument();
    });

    it('should not render children of collapsed folders', () => {
      useAppStore.setState({ fileTree: mockFileTree });
      renderWithProviders(<FilesView />);

      // Children should not be visible when folder is collapsed
      expect(screen.queryByText('components')).not.toBeInTheDocument();
      expect(screen.queryByText('index.ts')).not.toBeInTheDocument();
    });

    it('should render children when folder is expanded', () => {
      const expandedTree = [
        {
          ...mockFileTree[0],
          isExpanded: true,
        },
      ];

      useAppStore.setState({ fileTree: expandedTree });
      renderWithProviders(<FilesView />);

      expect(screen.getByText('components')).toBeInTheDocument();
      expect(screen.getByText('index.ts')).toBeInTheDocument();
    });

    it('should render deeply nested files when all parent folders are expanded', () => {
      const fullyExpandedTree = [
        {
          ...mockFileTree[0],
          isExpanded: true,
          children: [
            {
              ...mockFileTree[0].children![0],
              isExpanded: true,
            },
            mockFileTree[0].children![1],
          ],
        },
      ];

      useAppStore.setState({ fileTree: fullyExpandedTree });
      renderWithProviders(<FilesView />);

      expect(screen.getByText('App.tsx')).toBeInTheDocument();
    });

    it('should handle file names with special characters', () => {
      useAppStore.setState({ fileTree: mockFileTreeWithSpecialChars });
      renderWithProviders(<FilesView />);

      expect(screen.getByText('folder with spaces')).toBeInTheDocument();
      expect(screen.getByText('file.with.dots.js')).toBeInTheDocument();
    });

    it('should apply correct indentation based on nesting level', () => {
      const expandedTree = [
        {
          ...mockFileTree[0],
          isExpanded: true,
          children: [
            {
              ...mockFileTree[0].children![0],
              isExpanded: true,
            },
          ],
        },
      ];

      useAppStore.setState({ fileTree: expandedTree });
      renderWithProviders(<FilesView />);

      const srcButton = screen.getByText('src').closest('button');
      const componentsButton = screen.getByText('components').closest('button');
      const appButton = screen.getByText('App.tsx').closest('button');

      // Check indentation via padding-left style
      expect(srcButton).toHaveStyle({ paddingLeft: '8px' }); // level 0
      expect(componentsButton).toHaveStyle({ paddingLeft: '20px' }); // level 1
      expect(appButton).toHaveStyle({ paddingLeft: '32px' }); // level 2
    });
  });

  describe('Folder Interactions', () => {
    it('should toggle folder expansion on click', async () => {
      const user = userEvent.setup();
      useAppStore.setState({ fileTree: mockFileTree });
      renderWithProviders(<FilesView />);

      const toggleFileExpanded = vi.fn();
      useAppStore.setState({ toggleFileExpanded });

      const srcFolder = screen.getByText('src');
      await user.click(srcFolder);

      expect(toggleFileExpanded).toHaveBeenCalledWith('1');
    });

    it('should display chevron right for collapsed folders', () => {
      useAppStore.setState({ fileTree: mockFileTree });
      const { container } = renderWithProviders(<FilesView />);

      // ChevronRight icon should be present for collapsed folder
      const chevronRight = container.querySelector('.lucide-chevron-right');
      expect(chevronRight).toBeInTheDocument();
    });

    it('should display chevron down for expanded folders', () => {
      const expandedTree = [{ ...mockFileTree[0], isExpanded: true }];
      useAppStore.setState({ fileTree: expandedTree });
      const { container } = renderWithProviders(<FilesView />);

      // ChevronDown icon should be present for expanded folder
      const chevronDown = container.querySelector('.lucide-chevron-down');
      expect(chevronDown).toBeInTheDocument();
    });

    it('should display folder icon for folders', () => {
      useAppStore.setState({ fileTree: mockFileTree });
      const { container } = renderWithProviders(<FilesView />);

      // Folder icon should be present
      const folderIcon = container.querySelector('.lucide-folder');
      expect(folderIcon).toBeInTheDocument();
    });

    it('should display folder-open icon for expanded folders', () => {
      const expandedTree = [{ ...mockFileTree[0], isExpanded: true }];
      useAppStore.setState({ fileTree: expandedTree });
      const { container } = renderWithProviders(<FilesView />);

      // FolderOpen icon should be present
      const folderOpenIcon = container.querySelector('.lucide-folder-open');
      expect(folderOpenIcon).toBeInTheDocument();
    });
  });

  describe('File Interactions', () => {
    it('should select file on click', async () => {
      const user = userEvent.setup();
      useAppStore.setState({ fileTree: mockFileTree });
      renderWithProviders(<FilesView />);

      const setSelectedFile = vi.fn();
      useAppStore.setState({ setSelectedFile });

      const readmeFile = screen.getByText('README.md');
      await user.click(readmeFile);

      expect(setSelectedFile).toHaveBeenCalledWith(mockFileTree[1]);
    });

    it('should highlight selected file', () => {
      useAppStore.setState({
        fileTree: mockFileTree,
        selectedFile: mockFileTree[1],
      });
      renderWithProviders(<FilesView />);

      const selectedButton = screen.getByText('README.md').closest('button');
      expect(selectedButton).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should not highlight unselected files', () => {
      useAppStore.setState({
        fileTree: mockFileTree,
        selectedFile: mockFileTree[1],
      });
      renderWithProviders(<FilesView />);

      const unselectedButton = screen.getByText('src').closest('button');
      expect(unselectedButton).toHaveClass('text-gray-300');
      expect(unselectedButton).not.toHaveClass('bg-blue-600');
    });

    it('should display file icon for files', () => {
      useAppStore.setState({ fileTree: mockFileTree });
      const { container } = renderWithProviders(<FilesView />);

      // File icon should be present
      const fileIcon = container.querySelector('.lucide-file');
      expect(fileIcon).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should have hover effect on file items', () => {
      useAppStore.setState({ fileTree: mockFileTree });
      renderWithProviders(<FilesView />);

      const fileButton = screen.getByText('README.md').closest('button');
      expect(fileButton).toHaveClass('hover:bg-gray-800', 'hover:text-white');
    });

    it('should truncate long file names', () => {
      const longNameTree: FileNode[] = [
        {
          id: '1',
          name: 'this-is-a-very-long-file-name-that-should-be-truncated.tsx',
          path: '/project/this-is-a-very-long-file-name-that-should-be-truncated.tsx',
          type: 'file',
        },
      ];

      useAppStore.setState({ fileTree: longNameTree });
      renderWithProviders(<FilesView />);

      const fileName = screen.getByText(/this-is-a-very-long/);
      expect(fileName).toHaveClass('truncate');
    });

    it('should have consistent spacing between items', () => {
      useAppStore.setState({ fileTree: mockFileTree });
      const { container } = renderWithProviders(<FilesView />);

      const treeContainer = container.querySelector('.space-y-0\\.5');
      expect(treeContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render interactive elements as buttons', () => {
      useAppStore.setState({ fileTree: mockFileTree });
      renderWithProviders(<FilesView />);

      const srcButton = screen.getByText('src').closest('button');
      const readmeButton = screen.getByText('README.md').closest('button');

      expect(srcButton?.tagName).toBe('BUTTON');
      expect(readmeButton?.tagName).toBe('BUTTON');
    });

    it('should have full width clickable area', () => {
      useAppStore.setState({ fileTree: mockFileTree });
      renderWithProviders(<FilesView />);

      const button = screen.getByText('src').closest('button');
      expect(button).toHaveClass('w-full');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      useAppStore.setState({ fileTree: mockFileTree });
      renderWithProviders(<FilesView />);

      const srcButton = screen.getByText('src').closest('button');
      const readmeButton = screen.getByText('README.md').closest('button');

      // Tab to first button
      await user.tab();
      expect(srcButton).toHaveFocus();

      // Tab to second button
      await user.tab();
      expect(readmeButton).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should efficiently render large file trees', () => {
      const largeTree: FileNode[] = Array.from({ length: 100 }, (_, i) => ({
        id: `file-${i}`,
        name: `file-${i}.ts`,
        path: `/project/file-${i}.ts`,
        type: 'file' as const,
      }));

      useAppStore.setState({ fileTree: largeTree });
      const { container } = renderWithProviders(<FilesView />);

      // Should render all files
      expect(container.querySelectorAll('button')).toHaveLength(100);
    });

    it('should only render visible items in collapsed folders', () => {
      const deepTree: FileNode[] = [
        {
          id: '1',
          name: 'folder',
          path: '/project/folder',
          type: 'folder',
          isExpanded: false,
          children: Array.from({ length: 50 }, (_, i) => ({
            id: `child-${i}`,
            name: `child-${i}.ts`,
            path: `/project/folder/child-${i}.ts`,
            type: 'file' as const,
          })),
        },
      ];

      useAppStore.setState({ fileTree: deepTree });
      const { container } = renderWithProviders(<FilesView />);

      // Should only render parent folder button (children are hidden)
      expect(container.querySelectorAll('button')).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty folder', () => {
      const emptyFolderTree: FileNode[] = [
        {
          id: '1',
          name: 'empty-folder',
          path: '/project/empty-folder',
          type: 'folder',
          isExpanded: true,
          children: [],
        },
      ];

      useAppStore.setState({ fileTree: emptyFolderTree });
      renderWithProviders(<FilesView />);

      expect(screen.getByText('empty-folder')).toBeInTheDocument();
    });

    it('should handle folder without children property', () => {
      const folderNoChildren: FileNode[] = [
        {
          id: '1',
          name: 'folder',
          path: '/project/folder',
          type: 'folder',
          isExpanded: true,
        },
      ];

      useAppStore.setState({ fileTree: folderNoChildren });
      renderWithProviders(<FilesView />);

      expect(screen.getByText('folder')).toBeInTheDocument();
    });

    it('should handle files with no extension', () => {
      const noExtensionTree: FileNode[] = [
        {
          id: '1',
          name: 'Makefile',
          path: '/project/Makefile',
          type: 'file',
        },
      ];

      useAppStore.setState({ fileTree: noExtensionTree });
      renderWithProviders(<FilesView />);

      expect(screen.getByText('Makefile')).toBeInTheDocument();
    });

    it('should handle hidden files (starting with dot)', () => {
      const hiddenFileTree: FileNode[] = [
        {
          id: '1',
          name: '.gitignore',
          path: '/project/.gitignore',
          type: 'file',
        },
      ];

      useAppStore.setState({ fileTree: hiddenFileTree });
      renderWithProviders(<FilesView />);

      expect(screen.getByText('.gitignore')).toBeInTheDocument();
    });

    it('should handle unicode characters in file names', () => {
      const unicodeTree: FileNode[] = [
        {
          id: '1',
          name: 'файл.txt',
          path: '/project/файл.txt',
          type: 'file',
        },
        {
          id: '2',
          name: '文件.js',
          path: '/project/文件.js',
          type: 'file',
        },
      ];

      useAppStore.setState({ fileTree: unicodeTree });
      renderWithProviders(<FilesView />);

      expect(screen.getByText('файл.txt')).toBeInTheDocument();
      expect(screen.getByText('文件.js')).toBeInTheDocument();
    });
  });

  describe('Security', () => {
    it('should not execute script content in file names', () => {
      const xssTree: FileNode[] = [
        {
          id: '1',
          name: '<script>alert("xss")</script>',
          path: '/project/<script>alert("xss")</script>',
          type: 'file',
        },
      ];

      useAppStore.setState({ fileTree: xssTree });
      const { container } = renderWithProviders(<FilesView />);

      // Script should be rendered as text, not executed
      expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
      expect(container.querySelector('script')).not.toBeInTheDocument();
    });

    it('should properly escape HTML entities in file names', () => {
      const htmlTree: FileNode[] = [
        {
          id: '1',
          name: 'test&copy;.txt',
          path: '/project/test&copy;.txt',
          type: 'file',
        },
      ];

      useAppStore.setState({ fileTree: htmlTree });
      renderWithProviders(<FilesView />);

      expect(screen.getByText('test&copy;.txt')).toBeInTheDocument();
    });
  });
});
