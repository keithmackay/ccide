/**
 * Integration tests for file tree and preview workflow
 * Tests the complete flow from file selection to content display
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { screen, renderWithProviders, userEvent, waitFor } from '../utils/test-utils';
import { FilesView } from '../../components/LeftPanel/FilesView';
import { RightPanelWorkpane } from '../../components/RightPanel/RightPanelWorkpane';
import { useAppStore } from '../../stores/appStore';
import { FileNode } from '../../types/ui';

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
        name: 'App.tsx',
        path: '/project/src/App.tsx',
        type: 'file',
      },
      {
        id: '3',
        name: 'index.ts',
        path: '/project/src/index.ts',
        type: 'file',
      },
    ],
  },
  {
    id: '4',
    name: 'README.md',
    path: '/project/README.md',
    type: 'file',
  },
];

describe('File Tree and Preview Integration', () => {
  beforeEach(() => {
    // Reset store state
    useAppStore.setState({
      fileTree: mockFileTree,
      selectedFile: null,
      rightPanelContent: '',
      rightPanelMode: 'content',
      activeProject: {
        id: 'test-project',
        name: 'Test Project',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        path: '/project',
      },
    });
  });

  describe('File Selection Flow', () => {
    it('should display file path in preview when file is selected', async () => {
      const user = userEvent.setup();

      // Render both components
      const { rerender } = renderWithProviders(
        <>
          <FilesView />
          <RightPanelWorkpane />
        </>
      );

      // Initially no file selected
      expect(screen.getByText(/Select a project or file to view content/)).toBeInTheDocument();

      // Click on README file
      const readmeButton = screen.getByText('README.md');
      await user.click(readmeButton);

      // Re-render to reflect state change
      rerender(
        <>
          <FilesView />
          <RightPanelWorkpane />
        </>
      );

      // File path should be displayed
      await waitFor(() => {
        expect(screen.getByText(/File: \/project\/README\.md/)).toBeInTheDocument();
      });
    });

    it('should highlight selected file in tree view', async () => {
      const user = userEvent.setup();

      renderWithProviders(<FilesView />);

      const readmeButton = screen.getByText('README.md').closest('button');

      // Initially not highlighted
      expect(readmeButton).not.toHaveClass('bg-blue-600');

      // Click to select
      await user.click(readmeButton!);

      // Should be highlighted
      await waitFor(() => {
        expect(readmeButton).toHaveClass('bg-blue-600', 'text-white');
      });
    });

    it('should update preview when switching between files', async () => {
      const user = userEvent.setup();

      const { rerender } = renderWithProviders(
        <>
          <FilesView />
          <RightPanelWorkpane />
        </>
      );

      // Expand src folder first
      await user.click(screen.getByText('src'));

      rerender(
        <>
          <FilesView />
          <RightPanelWorkpane />
        </>
      );

      // Select first file
      await user.click(screen.getByText('README.md'));

      rerender(
        <>
          <FilesView />
          <RightPanelWorkpane />
        </>
      );

      await waitFor(() => {
        expect(screen.getByText(/README\.md/)).toBeInTheDocument();
      });

      // Select second file
      useAppStore.setState({
        fileTree: [
          {
            ...mockFileTree[0],
            isExpanded: true,
          },
          mockFileTree[1],
        ],
      });

      rerender(
        <>
          <FilesView />
          <RightPanelWorkpane />
        </>
      );

      await user.click(screen.getByText('App.tsx'));

      rerender(
        <>
          <FilesView />
          <RightPanelWorkpane />
        </>
      );

      await waitFor(() => {
        expect(screen.getByText(/App\.tsx/)).toBeInTheDocument();
      });
    });

    it('should maintain file selection when toggling folders', async () => {
      const user = userEvent.setup();

      useAppStore.setState({
        fileTree: [
          {
            ...mockFileTree[0],
            isExpanded: true,
          },
          mockFileTree[1],
        ],
        selectedFile: mockFileTree[0].children![0], // App.tsx selected
      });

      renderWithProviders(<FilesView />);

      // App.tsx should be highlighted
      const appButton = screen.getByText('App.tsx').closest('button');
      expect(appButton).toHaveClass('bg-blue-600');

      // Collapse folder
      await user.click(screen.getByText('src'));

      // Selection should still exist in store even if not visible
      expect(useAppStore.getState().selectedFile?.id).toBe('2');
    });
  });

  describe('Folder Navigation Flow', () => {
    it('should expand folder and show children', async () => {
      const user = userEvent.setup();

      renderWithProviders(<FilesView />);

      // Children not visible initially
      expect(screen.queryByText('App.tsx')).not.toBeInTheDocument();

      // Click folder to expand
      await user.click(screen.getByText('src'));

      // Wait for state update
      await waitFor(() => {
        expect(useAppStore.getState().fileTree[0].isExpanded).toBe(true);
      });
    });

    it('should collapse folder and hide children', async () => {
      const user = userEvent.setup();

      useAppStore.setState({
        fileTree: [
          {
            ...mockFileTree[0],
            isExpanded: true,
          },
          mockFileTree[1],
        ],
      });

      renderWithProviders(<FilesView />);

      // Children visible initially
      expect(screen.getByText('App.tsx')).toBeInTheDocument();

      // Click folder to collapse
      await user.click(screen.getByText('src'));

      // Children should be hidden
      await waitFor(() => {
        expect(screen.queryByText('App.tsx')).not.toBeInTheDocument();
      });
    });

    it('should navigate deep nested structure', async () => {
      const user = userEvent.setup();

      const deepTree: FileNode[] = [
        {
          id: '1',
          name: 'level1',
          path: '/level1',
          type: 'folder',
          isExpanded: false,
          children: [
            {
              id: '2',
              name: 'level2',
              path: '/level1/level2',
              type: 'folder',
              isExpanded: false,
              children: [
                {
                  id: '3',
                  name: 'deep-file.txt',
                  path: '/level1/level2/deep-file.txt',
                  type: 'file',
                },
              ],
            },
          ],
        },
      ];

      useAppStore.setState({ fileTree: deepTree });
      renderWithProviders(<FilesView />);

      // Expand level 1
      await user.click(screen.getByText('level1'));

      await waitFor(() => {
        expect(screen.getByText('level2')).toBeInTheDocument();
      });

      // Update state to reflect expansion
      useAppStore.setState({
        fileTree: [
          {
            ...deepTree[0],
            isExpanded: true,
          },
        ],
      });

      // Re-render to show level2
      renderWithProviders(<FilesView />);

      // Expand level 2
      await user.click(screen.getByText('level2'));

      await waitFor(() => {
        expect(useAppStore.getState().fileTree[0].isExpanded).toBe(true);
      });
    });
  });

  describe('Preview Content Display', () => {
    it('should show placeholder when no file selected', () => {
      renderWithProviders(<RightPanelWorkpane />);

      expect(screen.getByText('No content to display')).toBeInTheDocument();
      expect(screen.getByText(/Files will be displayed here/)).toBeInTheDocument();
    });

    it('should display file content when provided', () => {
      const fileContent = 'console.log("Hello, World!");';

      useAppStore.setState({
        selectedFile: mockFileTree[1],
        rightPanelContent: fileContent,
      });

      renderWithProviders(<RightPanelWorkpane />);

      expect(screen.getByText(new RegExp(fileContent))).toBeInTheDocument();
    });

    it('should show file path even without content', () => {
      useAppStore.setState({
        selectedFile: mockFileTree[1],
        rightPanelContent: '',
      });

      renderWithProviders(<RightPanelWorkpane />);

      expect(screen.getByText(/File: \/project\/README\.md/)).toBeInTheDocument();
      expect(screen.getByText(/File content will be displayed here/)).toBeInTheDocument();
    });

    it('should format content with monospace font', () => {
      useAppStore.setState({
        selectedFile: mockFileTree[1],
        rightPanelContent: 'const x = 1;',
      });

      const { container } = renderWithProviders(<RightPanelWorkpane />);

      const preElement = container.querySelector('pre');
      expect(preElement).toHaveClass('font-mono');
    });

    it('should preserve whitespace in content', () => {
      const contentWithWhitespace = 'line 1\n  indented line 2\n    more indented';

      useAppStore.setState({
        selectedFile: mockFileTree[1],
        rightPanelContent: contentWithWhitespace,
      });

      const { container } = renderWithProviders(<RightPanelWorkpane />);

      const preElement = container.querySelector('pre');
      expect(preElement).toHaveClass('whitespace-pre-wrap');
    });
  });

  describe('State Synchronization', () => {
    it('should sync file tree state between multiple components', async () => {
      const user = userEvent.setup();

      const { rerender } = renderWithProviders(
        <>
          <FilesView />
          <RightPanelWorkpane />
        </>
      );

      // Select file in tree view
      await user.click(screen.getByText('README.md'));

      // Both components should reflect the same state
      const selectedInStore = useAppStore.getState().selectedFile;
      expect(selectedInStore?.name).toBe('README.md');

      // Preview should update
      rerender(
        <>
          <FilesView />
          <RightPanelWorkpane />
        </>
      );

      await waitFor(() => {
        expect(screen.getByText(/README\.md/)).toBeInTheDocument();
      });
    });

    it('should handle rapid file selection changes', async () => {
      const user = userEvent.setup();

      useAppStore.setState({
        fileTree: [
          {
            ...mockFileTree[0],
            isExpanded: true,
          },
          mockFileTree[1],
        ],
      });

      renderWithProviders(<FilesView />);

      // Rapidly click different files
      await user.click(screen.getByText('App.tsx'));
      await user.click(screen.getByText('index.ts'));
      await user.click(screen.getByText('README.md'));

      // Final selection should be README.md
      await waitFor(() => {
        expect(useAppStore.getState().selectedFile?.name).toBe('README.md');
      });
    });

    it('should clear selection when file is deselected', async () => {
      useAppStore.setState({
        selectedFile: mockFileTree[1],
      });

      renderWithProviders(<FilesView />);

      // Programmatically clear selection
      useAppStore.getState().setSelectedFile(null);

      await waitFor(() => {
        expect(useAppStore.getState().selectedFile).toBeNull();
      });
    });
  });

  describe('Empty States', () => {
    it('should show appropriate message when no project is active', () => {
      useAppStore.setState({
        fileTree: [],
        activeProject: null,
      });

      renderWithProviders(<RightPanelWorkpane />);

      expect(screen.getByText('No content to display')).toBeInTheDocument();
      expect(screen.getByText(/Create or select a project to get started/)).toBeInTheDocument();
    });

    it('should show files placeholder when project exists but no files', () => {
      useAppStore.setState({
        fileTree: [],
        activeProject: {
          id: '1',
          name: 'Empty Project',
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          path: '/empty',
        },
      });

      renderWithProviders(
        <>
          <FilesView />
          <RightPanelWorkpane />
        </>
      );

      expect(screen.getByText('No files in project')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing file path gracefully', () => {
      const fileWithoutPath: FileNode = {
        id: '1',
        name: 'test.txt',
        path: '',
        type: 'file',
      };

      useAppStore.setState({
        selectedFile: fileWithoutPath,
      });

      const { container } = renderWithProviders(<RightPanelWorkpane />);

      // Should not crash
      expect(container).toBeInTheDocument();
    });

    it('should handle malformed file tree gracefully', () => {
      const malformedTree: any = [
        {
          id: '1',
          // missing name
          path: '/test',
          type: 'file',
        },
      ];

      useAppStore.setState({
        fileTree: malformedTree,
      });

      const { container } = renderWithProviders(<FilesView />);

      // Should not crash
      expect(container).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large file trees without performance degradation', async () => {
      const largeTree: FileNode[] = Array.from({ length: 100 }, (_, i) => ({
        id: `file-${i}`,
        name: `file-${i}.txt`,
        path: `/project/file-${i}.txt`,
        type: 'file' as const,
      }));

      useAppStore.setState({ fileTree: largeTree });

      const startTime = performance.now();
      renderWithProviders(<FilesView />);
      const endTime = performance.now();

      // Should render quickly (< 100ms for 100 files)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle rapid folder toggle operations', async () => {
      const user = userEvent.setup();

      renderWithProviders(<FilesView />);

      // Rapidly toggle folder
      const srcFolder = screen.getByText('src');

      for (let i = 0; i < 10; i++) {
        await user.click(srcFolder);
      }

      // Should handle all toggles without errors
      expect(useAppStore.getState().fileTree[0].isExpanded).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard navigation between files', async () => {
      const user = userEvent.setup();

      renderWithProviders(<FilesView />);

      // Tab to first file
      await user.tab();
      expect(screen.getByText('src').closest('button')).toHaveFocus();

      // Tab to second file
      await user.tab();
      expect(screen.getByText('README.md').closest('button')).toHaveFocus();
    });

    it('should allow selecting files with keyboard', async () => {
      const user = userEvent.setup();

      renderWithProviders(<FilesView />);

      // Navigate to file
      await user.tab();
      await user.tab();

      // Press Enter to select
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(useAppStore.getState().selectedFile?.name).toBe('README.md');
      });
    });

    it('should provide clear visual feedback for selected items', () => {
      useAppStore.setState({
        selectedFile: mockFileTree[1],
      });

      renderWithProviders(<FilesView />);

      const selectedButton = screen.getByText('README.md').closest('button');
      expect(selectedButton).toHaveClass('bg-blue-600', 'text-white');
    });
  });

  describe('Panel Modes', () => {
    it('should respect settings panel mode', () => {
      useAppStore.setState({
        rightPanelMode: 'settings',
      });

      renderWithProviders(<RightPanelWorkpane />);

      // Settings page should be shown instead of content
      expect(screen.queryByText('No content to display')).not.toBeInTheDocument();
    });

    it('should respect phase-review panel mode', () => {
      useAppStore.setState({
        rightPanelMode: 'phase-review',
      });

      renderWithProviders(<RightPanelWorkpane />);

      // Phase review panel should be shown instead of content
      expect(screen.queryByText('No content to display')).not.toBeInTheDocument();
    });

    it('should show content in content mode', () => {
      useAppStore.setState({
        rightPanelMode: 'content',
        selectedFile: null,
      });

      renderWithProviders(<RightPanelWorkpane />);

      expect(screen.getByText('No content to display')).toBeInTheDocument();
    });
  });
});
