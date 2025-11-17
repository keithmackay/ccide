/**
 * Unit tests for appStore file tree operations
 * Tests state management, file selection, and tree manipulation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../../stores/appStore';
import { FileNode } from '../../../types/ui';

describe('appStore - File Tree Operations', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAppStore.setState({
      fileTree: [],
      selectedFile: null,
    });
  });

  describe('setFileTree', () => {
    it('should set file tree', () => {
      const fileTree: FileNode[] = [
        {
          id: '1',
          name: 'src',
          path: '/project/src',
          type: 'folder',
          children: [],
        },
      ];

      useAppStore.getState().setFileTree(fileTree);

      expect(useAppStore.getState().fileTree).toEqual(fileTree);
    });

    it('should replace existing file tree', () => {
      const initialTree: FileNode[] = [
        {
          id: '1',
          name: 'old',
          path: '/project/old',
          type: 'folder',
        },
      ];

      const newTree: FileNode[] = [
        {
          id: '2',
          name: 'new',
          path: '/project/new',
          type: 'folder',
        },
      ];

      useAppStore.getState().setFileTree(initialTree);
      useAppStore.getState().setFileTree(newTree);

      expect(useAppStore.getState().fileTree).toEqual(newTree);
      expect(useAppStore.getState().fileTree).not.toContain(initialTree[0]);
    });

    it('should handle empty array', () => {
      useAppStore.getState().setFileTree([]);

      expect(useAppStore.getState().fileTree).toEqual([]);
    });

    it('should handle deeply nested tree structure', () => {
      const deepTree: FileNode[] = [
        {
          id: '1',
          name: 'level1',
          path: '/level1',
          type: 'folder',
          children: [
            {
              id: '2',
              name: 'level2',
              path: '/level1/level2',
              type: 'folder',
              children: [
                {
                  id: '3',
                  name: 'level3',
                  path: '/level1/level2/level3',
                  type: 'folder',
                  children: [
                    {
                      id: '4',
                      name: 'file.txt',
                      path: '/level1/level2/level3/file.txt',
                      type: 'file',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      useAppStore.getState().setFileTree(deepTree);

      expect(useAppStore.getState().fileTree).toEqual(deepTree);
    });
  });

  describe('setSelectedFile', () => {
    it('should set selected file', () => {
      const file: FileNode = {
        id: '1',
        name: 'test.txt',
        path: '/project/test.txt',
        type: 'file',
      };

      useAppStore.getState().setSelectedFile(file);

      expect(useAppStore.getState().selectedFile).toEqual(file);
    });

    it('should clear selected file with null', () => {
      const file: FileNode = {
        id: '1',
        name: 'test.txt',
        path: '/project/test.txt',
        type: 'file',
      };

      useAppStore.getState().setSelectedFile(file);
      useAppStore.getState().setSelectedFile(null);

      expect(useAppStore.getState().selectedFile).toBeNull();
    });

    it('should replace previously selected file', () => {
      const file1: FileNode = {
        id: '1',
        name: 'file1.txt',
        path: '/project/file1.txt',
        type: 'file',
      };

      const file2: FileNode = {
        id: '2',
        name: 'file2.txt',
        path: '/project/file2.txt',
        type: 'file',
      };

      useAppStore.getState().setSelectedFile(file1);
      useAppStore.getState().setSelectedFile(file2);

      expect(useAppStore.getState().selectedFile).toEqual(file2);
    });

    it('should allow selecting folders', () => {
      const folder: FileNode = {
        id: '1',
        name: 'src',
        path: '/project/src',
        type: 'folder',
        children: [],
      };

      useAppStore.getState().setSelectedFile(folder);

      expect(useAppStore.getState().selectedFile).toEqual(folder);
    });
  });

  describe('toggleFileExpanded', () => {
    const mockTree: FileNode[] = [
      {
        id: '1',
        name: 'folder1',
        path: '/folder1',
        type: 'folder',
        isExpanded: false,
        children: [
          {
            id: '2',
            name: 'file1.txt',
            path: '/folder1/file1.txt',
            type: 'file',
          },
        ],
      },
      {
        id: '3',
        name: 'folder2',
        path: '/folder2',
        type: 'folder',
        isExpanded: true,
        children: [],
      },
    ];

    beforeEach(() => {
      useAppStore.setState({ fileTree: JSON.parse(JSON.stringify(mockTree)) });
    });

    it('should toggle folder from collapsed to expanded', () => {
      useAppStore.getState().toggleFileExpanded('1');

      const folder = useAppStore.getState().fileTree[0];
      expect(folder.isExpanded).toBe(true);
    });

    it('should toggle folder from expanded to collapsed', () => {
      useAppStore.getState().toggleFileExpanded('3');

      const folder = useAppStore.getState().fileTree[1];
      expect(folder.isExpanded).toBe(false);
    });

    it('should handle multiple toggles', () => {
      useAppStore.getState().toggleFileExpanded('1');
      expect(useAppStore.getState().fileTree[0].isExpanded).toBe(true);

      useAppStore.getState().toggleFileExpanded('1');
      expect(useAppStore.getState().fileTree[0].isExpanded).toBe(false);

      useAppStore.getState().toggleFileExpanded('1');
      expect(useAppStore.getState().fileTree[0].isExpanded).toBe(true);
    });

    it('should only toggle the specified folder', () => {
      useAppStore.getState().toggleFileExpanded('1');

      expect(useAppStore.getState().fileTree[0].isExpanded).toBe(true);
      expect(useAppStore.getState().fileTree[1].isExpanded).toBe(true); // unchanged
    });

    it('should toggle nested folders', () => {
      const nestedTree: FileNode[] = [
        {
          id: '1',
          name: 'parent',
          path: '/parent',
          type: 'folder',
          isExpanded: true,
          children: [
            {
              id: '2',
              name: 'child',
              path: '/parent/child',
              type: 'folder',
              isExpanded: false,
              children: [],
            },
          ],
        },
      ];

      useAppStore.setState({ fileTree: nestedTree });
      useAppStore.getState().toggleFileExpanded('2');

      const childFolder = useAppStore.getState().fileTree[0].children![0];
      expect(childFolder.isExpanded).toBe(true);
    });

    it('should handle deeply nested folders', () => {
      const deepTree: FileNode[] = [
        {
          id: '1',
          name: 'level1',
          path: '/level1',
          type: 'folder',
          isExpanded: true,
          children: [
            {
              id: '2',
              name: 'level2',
              path: '/level1/level2',
              type: 'folder',
              isExpanded: true,
              children: [
                {
                  id: '3',
                  name: 'level3',
                  path: '/level1/level2/level3',
                  type: 'folder',
                  isExpanded: false,
                  children: [],
                },
              ],
            },
          ],
        },
      ];

      useAppStore.setState({ fileTree: deepTree });
      useAppStore.getState().toggleFileExpanded('3');

      const level3 =
        useAppStore.getState().fileTree[0].children![0].children![0];
      expect(level3.isExpanded).toBe(true);
    });

    it('should not affect files (only folders)', () => {
      const treeWithFile: FileNode[] = [
        {
          id: '1',
          name: 'file.txt',
          path: '/file.txt',
          type: 'file',
        },
      ];

      useAppStore.setState({ fileTree: treeWithFile });
      useAppStore.getState().toggleFileExpanded('1');

      // File should remain unchanged (no isExpanded property)
      expect(useAppStore.getState().fileTree[0]).toEqual(treeWithFile[0]);
    });

    it('should handle non-existent file ID gracefully', () => {
      const initialTree = JSON.parse(JSON.stringify(mockTree));
      useAppStore.setState({ fileTree: initialTree });

      useAppStore.getState().toggleFileExpanded('non-existent-id');

      // Tree should remain unchanged
      expect(useAppStore.getState().fileTree).toEqual(initialTree);
    });

    it('should initialize isExpanded to true if undefined', () => {
      const folderWithoutExpanded: FileNode[] = [
        {
          id: '1',
          name: 'folder',
          path: '/folder',
          type: 'folder',
          // isExpanded is undefined
          children: [],
        },
      ];

      useAppStore.setState({ fileTree: folderWithoutExpanded });
      useAppStore.getState().toggleFileExpanded('1');

      // Should toggle from undefined to true
      expect(useAppStore.getState().fileTree[0].isExpanded).toBe(true);
    });
  });

  describe('File Tree Immutability', () => {
    it('should not mutate original tree when toggling', () => {
      const originalTree: FileNode[] = [
        {
          id: '1',
          name: 'folder',
          path: '/folder',
          type: 'folder',
          isExpanded: false,
          children: [],
        },
      ];

      const treeCopy = JSON.parse(JSON.stringify(originalTree));
      useAppStore.setState({ fileTree: originalTree });

      useAppStore.getState().toggleFileExpanded('1');

      // Original reference should be different (immutable update)
      expect(useAppStore.getState().fileTree).not.toBe(originalTree);
      expect(originalTree).toEqual(treeCopy); // Original unchanged
    });

    it('should create new references for modified nodes', () => {
      const tree: FileNode[] = [
        {
          id: '1',
          name: 'folder',
          path: '/folder',
          type: 'folder',
          isExpanded: false,
          children: [],
        },
      ];

      useAppStore.setState({ fileTree: tree });
      const originalNode = useAppStore.getState().fileTree[0];

      useAppStore.getState().toggleFileExpanded('1');
      const updatedNode = useAppStore.getState().fileTree[0];

      expect(updatedNode).not.toBe(originalNode); // Different reference
      expect(updatedNode.isExpanded).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file tree', () => {
      useAppStore.setState({ fileTree: [] });
      useAppStore.getState().toggleFileExpanded('1');

      expect(useAppStore.getState().fileTree).toEqual([]);
    });

    it('should handle folder without children array', () => {
      const folderNoChildren: FileNode[] = [
        {
          id: '1',
          name: 'folder',
          path: '/folder',
          type: 'folder',
          isExpanded: false,
        },
      ];

      useAppStore.setState({ fileTree: folderNoChildren });
      useAppStore.getState().toggleFileExpanded('1');

      expect(useAppStore.getState().fileTree[0].isExpanded).toBe(true);
    });

    it('should handle mixed file and folder siblings', () => {
      const mixedTree: FileNode[] = [
        {
          id: '1',
          name: 'file1.txt',
          path: '/file1.txt',
          type: 'file',
        },
        {
          id: '2',
          name: 'folder',
          path: '/folder',
          type: 'folder',
          isExpanded: false,
          children: [],
        },
        {
          id: '3',
          name: 'file2.txt',
          path: '/file2.txt',
          type: 'file',
        },
      ];

      useAppStore.setState({ fileTree: mixedTree });
      useAppStore.getState().toggleFileExpanded('2');

      expect(useAppStore.getState().fileTree[1].isExpanded).toBe(true);
      expect(useAppStore.getState().fileTree[0]).toEqual(mixedTree[0]); // Unchanged
      expect(useAppStore.getState().fileTree[2]).toEqual(mixedTree[2]); // Unchanged
    });
  });

  describe('Performance', () => {
    it('should efficiently handle large flat trees', () => {
      const largeTree: FileNode[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `file-${i}`,
        name: `file-${i}.txt`,
        path: `/file-${i}.txt`,
        type: 'file' as const,
      }));

      const startTime = Date.now();
      useAppStore.getState().setFileTree(largeTree);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be fast
      expect(useAppStore.getState().fileTree).toHaveLength(1000);
    });

    it('should efficiently toggle in large nested trees', () => {
      const createLargeTree = (depth: number, breadth: number): FileNode[] => {
        if (depth === 0) return [];

        return Array.from({ length: breadth }, (_, i) => ({
          id: `${depth}-${i}`,
          name: `folder-${depth}-${i}`,
          path: `/folder-${depth}-${i}`,
          type: 'folder' as const,
          isExpanded: false,
          children: createLargeTree(depth - 1, breadth),
        }));
      };

      const largeTree = createLargeTree(4, 5); // 5^4 = 625 nodes
      useAppStore.setState({ fileTree: largeTree });

      const startTime = Date.now();
      useAppStore.getState().toggleFileExpanded('3-0');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be fast
    });
  });

  describe('Type Safety', () => {
    it('should maintain proper types for file nodes', () => {
      const file: FileNode = {
        id: '1',
        name: 'test.txt',
        path: '/test.txt',
        type: 'file',
      };

      useAppStore.getState().setFileTree([file]);

      const storedFile = useAppStore.getState().fileTree[0];
      expect(storedFile.type).toBe('file');
      expect(storedFile.id).toBe('1');
      expect(storedFile.name).toBe('test.txt');
      expect(storedFile.path).toBe('/test.txt');
    });

    it('should maintain proper types for folder nodes', () => {
      const folder: FileNode = {
        id: '1',
        name: 'src',
        path: '/src',
        type: 'folder',
        isExpanded: false,
        children: [],
      };

      useAppStore.getState().setFileTree([folder]);

      const storedFolder = useAppStore.getState().fileTree[0];
      expect(storedFolder.type).toBe('folder');
      expect(storedFolder.isExpanded).toBe(false);
      expect(storedFolder.children).toBeDefined();
    });
  });
});
