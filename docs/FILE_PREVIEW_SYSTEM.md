# File Preview System Documentation

## Overview

The File Preview System is a comprehensive solution for displaying and managing files within the CCIDE application. It integrates seamlessly with the phase completion flow and deliverables system, providing users with rich previews of generated files.

## Architecture

### Component Structure

```
src/components/RightPanel/FilePreview/
├── FilePreviewPanel.tsx      # Main file preview component
├── FileMetadata.tsx           # File information display
├── CodeHighlighter.tsx        # Syntax highlighting for code files
├── MarkdownRenderer.tsx       # Markdown rendering
├── PhaseFilesPanel.tsx        # Phase deliverables viewer
└── index.ts                   # Exports
```

### Data Flow

1. **File Selection**: User selects a file from the tree view (FilesView)
2. **State Update**: Selected file is stored in appStore.selectedFile
3. **Preview Display**: RightPanelWorkpane renders FilePreviewPanel with the selected file
4. **Content Loading**: File content is loaded from file.content or fetched if needed
5. **Rendering**: Appropriate renderer (Code/Markdown/Plain) displays the content

### Phase Integration Flow

1. **Phase Completion**: Assistant message triggers phase completion detection
2. **Deliverable Extraction**: phaseDetection.ts extracts deliverables from message
3. **Phase Review**: PhaseReviewPanel displays deliverables list
4. **File Viewing**: User clicks "View All Files" to open PhaseFilesPanel
5. **File Preview**: Individual files can be previewed with full content

## Components

### FilePreviewPanel

**Purpose**: Main component for displaying file previews with metadata and content.

**Props**:
- `file: FileNode` - The file to preview
- `content?: string` - Optional content override
- `isNewlyGenerated?: boolean` - Highlights newly generated files

**Features**:
- Automatic content type detection
- Loading states
- Error handling
- Metadata display
- Responsive layout

**File Type Support**:
- Code files: JavaScript, TypeScript, Python, Java, C/C++, CSS, HTML, JSON, YAML, SQL, Bash
- Markdown files: Rendered with formatting
- Plain text: Basic text display
- Diagrams: Displayed in preview section

### FileMetadata

**Purpose**: Displays file information including name, path, size, and last modified date.

**Props**:
- `file: FileNode` - The file to display metadata for
- `size?: number` - File size in bytes
- `lastModified?: Date` - Last modification date

**Display**:
- File/folder icon
- Name (truncated if long)
- Full path
- Size (formatted)
- Last modified date
- Type (file/folder)

### CodeHighlighter

**Purpose**: Provides syntax highlighting for code files.

**Props**:
- `code: string` - Code content to highlight
- `language?: string` - Programming language
- `showLineNumbers?: boolean` - Show/hide line numbers (default: true)

**Supported Languages**:
- JavaScript (js)
- JSX (jsx)
- TypeScript (ts)
- TSX (tsx)
- Python (py)
- Java (java)
- C/C++ (c, cpp)
- CSS (css)
- HTML (html)
- JSON (json)
- YAML (yaml)
- SQL (sql)
- Bash (sh, bash)

**Features**:
- Line numbers
- Syntax highlighting (keywords, strings, comments, numbers)
- Line hover effects
- Language badge
- Horizontal scroll for long lines

### MarkdownRenderer

**Purpose**: Renders markdown files with proper formatting.

**Props**:
- `content: string` - Markdown content to render

**Supported Markdown Features**:
- Headers (h1, h2, h3)
- Bold and italic text
- Code blocks with language detection
- Inline code
- Links (open in new tab)
- Lists (bullet and numbered)
- Blockquotes
- Horizontal rules

### PhaseFilesPanel

**Purpose**: Displays all files generated in a phase with file list and preview.

**Props**:
- `deliverables: PhaseDeliverable[]` - List of phase deliverables
- `phaseName: string` - Name of the phase

**Layout**:
- Left sidebar: File list with icons and names
- Right panel: Selected file preview
- Responsive design with scroll

**Features**:
- File selection
- Type-based icons (code/document/diagram)
- Preview integration
- Empty state handling

## Integration Points

### Tree View Integration (FilesView)

The file preview system integrates with the existing tree view:

```typescript
// When user clicks a file in the tree
setSelectedFile(node); // Updates appStore

// RightPanelWorkpane automatically detects and shows preview
if (selectedFile) {
  return <FilePreviewPanel file={selectedFile} />;
}
```

### Phase Completion Integration

Phase completion automatically extracts deliverables:

```typescript
// In phaseDetection.ts
export function extractDeliverables(message: string): PhaseDeliverable[]

// Phase review shows deliverables
<PhaseReviewPanel />
  └─> Shows deliverable list
  └─> "View All Files" button
      └─> Opens PhaseFilesPanel
```

### State Management (appStore)

```typescript
// File selection
selectedFile: FileNode | null;
setSelectedFile: (file: FileNode | null) => void;

// Phase tracking
currentPhase: PhaseInfo | null;
setCurrentPhase: (phaseInfo: PhaseInfo | null) => void;

// Content display
rightPanelContent: string;
rightPanelMode: RightPanelMode;
```

## Types

### FileNode (Extended)

```typescript
interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isExpanded?: boolean;
  content?: string;          // NEW: File content
  size?: number;             // NEW: File size in bytes
  lastModified?: Date;       // NEW: Last modified date
}
```

### PhaseDeliverable (Extended)

```typescript
interface PhaseDeliverable {
  name: string;
  path: string;
  type: 'document' | 'code' | 'diagram';
  preview?: string;
  size?: number;              // NEW: File size
  lastModified?: Date;        // NEW: Last modified date
  isNewlyGenerated?: boolean; // NEW: Flag for highlighting
}
```

## Utilities

### filePreview.ts

Utility functions for file handling:

- `getFileExtension(filename)` - Extract file extension
- `getLanguageFromExtension(ext)` - Map extension to language
- `isCodeFile(ext)` - Check if extension is code
- `isMarkdownFile(ext)` - Check if extension is markdown
- `isImageFile(ext)` - Check if extension is image
- `formatFileSize(bytes)` - Format size for display
- `deliverableToFileNode(deliverable)` - Convert deliverable to file node
- `markDeliverablesAsNew(deliverables)` - Mark as newly generated
- `filterDeliverablesByType(deliverables, type)` - Filter by type
- `getFileIconColor(type)` - Get icon color for type
- `getFileTypeLabel(type)` - Get human-readable type label
- `searchFiles(nodes, query)` - Search files by name

## Usage Examples

### Basic File Preview

```typescript
import { FilePreviewPanel } from './FilePreview';

function MyComponent() {
  const selectedFile = useAppStore(state => state.selectedFile);

  return (
    <FilePreviewPanel
      file={selectedFile}
      content="console.log('Hello World');"
    />
  );
}
```

### Phase Files Display

```typescript
import { PhaseFilesPanel } from './FilePreview';

function PhaseReview() {
  const currentPhase = useAppStore(state => state.currentPhase);

  return (
    <PhaseFilesPanel
      deliverables={currentPhase.deliverables}
      phaseName="Implementation"
    />
  );
}
```

### Using Utilities

```typescript
import {
  getFileExtension,
  getLanguageFromExtension,
  formatFileSize
} from '../utils/filePreview';

const ext = getFileExtension('example.ts'); // 'ts'
const lang = getLanguageFromExtension(ext); // 'typescript'
const size = formatFileSize(1024); // '1 KB'
```

## Styling

All components use Tailwind CSS with consistent design:

- **Color Scheme**: Gray-based dark theme
- **Accents**: Blue (primary), Green (success), Purple (special), Yellow (warning)
- **Borders**: Gray-700
- **Backgrounds**: Gray-800, Gray-900, Gray-950
- **Text**: Gray-200 (primary), Gray-300 (secondary), Gray-400 (tertiary)

## Future Enhancements

Potential improvements:

1. **Enhanced Syntax Highlighting**: Integrate Prism.js or highlight.js
2. **Image Preview**: Support for image file types
3. **PDF Preview**: Support for PDF documents
4. **Diff View**: Show file changes between versions
5. **Search in File**: Search within file content
6. **Download**: Download file functionality
7. **Edit Mode**: Allow inline editing
8. **Split View**: Compare multiple files side-by-side
9. **Breadcrumbs**: Show file path navigation
10. **Minimap**: Code minimap for large files

## Performance Considerations

- Content is lazy-loaded only when needed
- Large files use virtual scrolling (future)
- Syntax highlighting is optimized with regex
- Component memoization prevents unnecessary re-renders
- File tree uses efficient tree traversal

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- High contrast text
- Focus indicators
- Screen reader friendly

## Testing

Test coverage includes:

- File type detection
- Content rendering for all file types
- Error states
- Loading states
- Integration with tree view
- Phase completion flow

## Troubleshooting

### File content not loading

Check:
1. File has `content` property or `rightPanelContent` is set
2. File type is supported
3. No errors in console

### Syntax highlighting not working

Check:
1. File extension is correctly mapped in `getLanguageFromExtension`
2. Language is in supported list
3. Code is valid

### Preview not showing

Check:
1. `selectedFile` is set in appStore
2. `RightPanelWorkpane` is rendering
3. `rightPanelMode` is 'content'

## Related Files

- `/src/components/RightPanel/RightPanelWorkpane.tsx` - Main integration point
- `/src/components/RightPanel/PhaseReviewPanel.tsx` - Phase review integration
- `/src/components/LeftPanel/FilesView.tsx` - File tree view
- `/src/stores/appStore.ts` - State management
- `/src/types/ui.ts` - Type definitions
- `/src/utils/phaseDetection.ts` - Phase completion detection

## Summary

The File Preview System provides a complete solution for viewing and managing files in CCIDE. It supports multiple file types, integrates with phase completion, and provides a rich user experience with syntax highlighting, markdown rendering, and metadata display.
