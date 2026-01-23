# example-prt-plugin Architecture

**Version:** 1.0.0
**Last Updated:** 2026-01-22
**Plugin Type:** oclif Plugin for PRT (Project Roadmap Tracking)

## Table of Contents

1. [Plugin Overview](#plugin-overview)
2. [Plugin Structure](#plugin-structure)
3. [oclif Integration](#oclif-integration)
4. [Service Architecture](#service-architecture)
5. [Markdown Export Format](#markdown-export-format)
6. [Leveraging PRT Services](#leveraging-prt-services)
7. [Extension Points](#extension-points)

---

## Plugin Overview

### Purpose

The `example-prt-plugin` demonstrates how to build oclif plugins that extend the PRT CLI tool. It implements a markdown export feature that converts `prt.json` roadmaps into well-structured, human-readable markdown documents.

### Key Features

- **Export Command**: `prt export [FILE]` - Exports roadmap to markdown
- **Flexible Output**: Export to file or stdout
- **Rich Formatting**: Includes metadata, statistics, task lists organized by status
- **Dependency Visualization**: Shows task dependencies and blockers
- **Reusable Service**: `MarkdownExporterService` for programmatic use

### Design Goals

1. **Simplicity**: Serve as a clear, minimal example for plugin developers
2. **Best Practices**: Demonstrate proper oclif patterns and PRT service usage
3. **Extensibility**: Provide hooks for customizing markdown output
4. **Type Safety**: Leverage TypeScript and PRT's type system

---

## Plugin Structure

### Directory Layout

```
example-prt-plugin/
├── package.json              # Plugin manifest with oclif config
├── tsconfig.json             # TypeScript configuration
├── README.md                 # User-facing documentation
├── ARCHITECTURE.md           # This file
├── src/
│   ├── index.ts             # Plugin entry point (exports commands)
│   ├── commands/
│   │   └── export.ts        # Export command implementation
│   └── services/
│       └── markdown-exporter.service.ts  # Core export logic
├── test/
│   ├── commands/
│   │   └── export.test.ts   # Command tests
│   └── services/
│       └── markdown-exporter.service.test.ts  # Service tests
└── examples/
    └── sample-export.md     # Example output
```

### File Responsibilities

**`package.json`**
- Declares `@oclif/core` as peer dependency (must match PRT version)
- Specifies `oclif.bin` as `"prt"` to extend PRT CLI
- Lists commands in `oclif.commands` for auto-discovery
- Declares `prt` as peer dependency for importing services

**`src/index.ts`**
```typescript
export {default as ExportCommand} from './commands/export.js'
```

**`src/commands/export.ts`**
- Extends `Command` from `@oclif/core`
- Defines flags and args for export command
- Delegates business logic to `MarkdownExporterService`
- Handles I/O (reading config, writing output)

**`src/services/markdown-exporter.service.ts`**
- Pure service class for markdown generation
- Takes `Roadmap` as input, returns markdown string
- No I/O or side effects (testable)
- Leverages PRT services for data processing

---

## oclif Integration

### Plugin Discovery

oclif automatically discovers plugins installed via:

```bash
# From npm registry
prt plugins install example-prt-plugin

# From GitHub
prt plugins install ZacharyEggert/example-prt-plugin

# Local development (symlink)
cd /path/to/example-prt-plugin
prt plugins link
```

### Command Registration

Commands are registered via `package.json`:

```json
{
  "name": "example-prt-plugin",
  "version": "1.0.0",
  "oclif": {
    "bin": "prt",
    "dirname": "prt",
    "commands": "./dist/commands",
    "plugins": [],
    "topicSeparator": " "
  }
}
```

**Key Properties:**
- `"bin": "prt"` - Extends the `prt` CLI (not a standalone tool)
- `"commands": "./dist/commands"` - Where oclif finds commands after build
- Commands are automatically namespaced if desired (e.g., `prt export`)

### Command Implementation Pattern

```typescript
// src/commands/export.ts
import {Command, Flags} from '@oclif/core'
import {readConfigFile} from 'prt/dist/util/read-config.js'
import roadmapService from 'prt/dist/services/roadmap.service.js'
import {MarkdownExporterService} from '../services/markdown-exporter.service.js'

export default class Export extends Command {
  static description = 'Export roadmap to markdown format'

  static flags = {
    output: Flags.string({
      char: 'o',
      description: 'Output file path (default: stdout)',
    }),
    // ... more flags
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Export)
    
    // Load roadmap using PRT services
    const config = await readConfigFile()
    const roadmap = await roadmapService.load(config.roadmapPath)
    
    // Generate markdown
    const exporter = new MarkdownExporterService()
    const markdown = exporter.export(roadmap)
    
    // Output
    if (flags.output) {
      await this.writeFile(flags.output, markdown)
      this.log(`Exported to ${flags.output}`)
    } else {
      this.log(markdown)
    }
  }
}
```

### Peer Dependencies

The plugin declares PRT as a peer dependency to:
1. Import and reuse PRT services
2. Ensure version compatibility
3. Avoid bundling duplicate code

```json
{
  "peerDependencies": {
    "@oclif/core": "^4.0.0",
    "prt": "^1.0.0"
  }
}
```

---

## Service Architecture

### MarkdownExporterService

**Location:** `src/services/markdown-exporter.service.ts`

**Responsibility:** Transform a `Roadmap` object into markdown text.

**Design Pattern:** Pure function / Service class

```typescript
export interface MarkdownExportOptions {
  includeMetadata?: boolean      // Default: true
  includeStats?: boolean          // Default: true
  includeCompletedTasks?: boolean // Default: true
  taskSortBy?: 'priority' | 'createdAt' | 'updatedAt'  // Default: 'priority'
  groupBy?: 'status' | 'type' | 'priority'  // Default: 'status'
}

export class MarkdownExporterService {
  /**
   * Export a roadmap to markdown format.
   * @param roadmap - The roadmap to export
   * @param options - Export options
   * @returns Markdown string
   */
  export(roadmap: Roadmap, options: MarkdownExportOptions = {}): string {
    const sections: string[] = []
    
    // 1. Header
    sections.push(this.generateHeader(roadmap))
    
    // 2. Metadata (optional)
    if (options.includeMetadata !== false) {
      sections.push(this.generateMetadata(roadmap))
    }
    
    // 3. Statistics (optional)
    if (options.includeStats !== false) {
      sections.push(this.generateStatistics(roadmap))
    }
    
    // 4. Tasks (grouped)
    sections.push(this.generateTaskSections(roadmap, options))
    
    return sections.join('\n\n---\n\n')
  }

  private generateHeader(roadmap: Roadmap): string {
    return `# ${roadmap.name}\n\n${roadmap.description || ''}`
  }

  private generateMetadata(roadmap: Roadmap): string {
    return [
      '## Metadata',
      '',
      `- **Version:** ${roadmap.version}`,
      `- **Created:** ${new Date(roadmap.createdAt).toLocaleDateString()}`,
      `- **Updated:** ${new Date(roadmap.updatedAt).toLocaleDateString()}`,
    ].join('\n')
  }

  private generateStatistics(roadmap: Roadmap): string {
    // Use roadmapService.getStats() for statistics
  }

  private generateTaskSections(
    roadmap: Roadmap, 
    options: MarkdownExportOptions
  ): string {
    // Use taskQueryService for filtering/sorting
  }

  private formatTask(task: Task): string {
    // Format individual task as markdown list item
  }
}
```

**Key Methods:**
- `export(roadmap, options)` - Main entry point
- `generateHeader()` - Title and description
- `generateMetadata()` - Roadmap metadata
- `generateStatistics()` - Task counts, completion %
- `generateTaskSections()` - Tasks grouped by status/type/priority
- `formatTask()` - Individual task formatting

**Testing Strategy:**
- Unit tests with fixture roadmaps
- Golden file testing (compare against known-good outputs)
- Edge cases: empty roadmap, no dependencies, circular deps

---

## Markdown Export Format

### Format Specification

The exported markdown follows this structure:

```markdown
# Project Name

Project description goes here.

---

## Metadata

- **Version:** 1.0.0
- **Created:** 1/15/2026
- **Updated:** 1/22/2026

---

## Statistics

- **Total Tasks:** 42
- **Completed:** 35 (83%)
- **In Progress:** 5 (12%)
- **Not Started:** 2 (5%)

**By Type:**
- Features: 15
- Bugs: 10
- Improvements: 8
- Planning: 7
- Research: 2

**By Priority:**
- High: 12
- Medium: 20
- Low: 10

---

## Tasks

### Not Started

#### High Priority

- **[F-015]** User authentication
  - Type: Feature | Status: Not Started | Tests: ✗
  - Created: 1/20/2026 | Updated: 1/20/2026
  - Details: Implement JWT-based authentication system
  - Depends On: F-012, F-013

#### Medium Priority

- **[I-005]** Optimize database queries
  - Type: Improvement | Status: Not Started | Tests: ✗
  - Created: 1/18/2026 | Updated: 1/18/2026
  - Details: Add indexes and query optimization

### In Progress

#### High Priority

- **[B-003]** Fix login redirect bug
  - Type: Bug | Status: In Progress | Tests: ✗
  - Created: 1/15/2026 | Updated: 1/21/2026
  - Details: Users stuck on login page after authentication
  - Notes: Investigating session storage issue
  - Blocks: F-015

### Completed

#### High Priority

- **[F-001]** Project initialization
  - Type: Feature | Status: Completed | Tests: ✓
  - Created: 1/10/2026 | Updated: 1/15/2026
  - Completed: 1/15/2026
  - Details: Set up project structure and dependencies
```

### Formatting Rules

1. **Headers**: Use `#` for title, `##` for sections, `###` for status groups, `####` for priority subgroups
2. **Task Format**:
   - Bold task ID in brackets: `**[F-001]**`
   - Title on same line
   - Metadata indented with `-`
   - Multi-line details indented
3. **Icons**:
   - Tests passing: ✓
   - Tests not passing: ✗
   - Not started: (none or ○)
4. **Sections**: Use `---` horizontal rules between major sections
5. **Dependencies**: List as comma-separated task IDs

### Customization Options

Users can customize via flags:

```bash
# Exclude completed tasks
prt export --no-completed

# Group by type instead of status
prt export --group-by=type

# Sort by created date
prt export --sort-by=createdAt

# Minimal output (no stats/metadata)
prt export --minimal
```

---

## Leveraging PRT Services

The plugin imports and uses PRT's service layer for consistency and code reuse.

### RoadmapService

**Import:**
```typescript
import roadmapService from 'prt/dist/services/roadmap.service.js'
```

**Usage:**
```typescript
// Load roadmap from file
const roadmap = await roadmapService.load(config.roadmapPath)

// Get statistics
const stats = roadmapService.getStats(roadmap)
// Returns: { totalTasks, byStatus, byType, byPriority, completionRate }
```

**Why Use It:**
- Handles JSON parsing and validation
- Ensures roadmap structure is valid
- Provides consistent error handling
- Includes built-in statistics calculation

### TaskQueryService

**Import:**
```typescript
import taskQueryService from 'prt/dist/services/task-query.service.js'
```

**Usage:**
```typescript
// Filter tasks
const highPriorityTasks = taskQueryService.filter(roadmap.tasks, {
  priority: PRIORITY.High,
  status: STATUS.InProgress,
})

// Sort tasks
const sortedTasks = taskQueryService.sort(
  roadmap.tasks,
  'priority',
  'desc'
)

// Search tasks
const results = taskQueryService.search(
  roadmap.tasks,
  'authentication'
)
```

**Why Use It:**
- Consistent filtering/sorting logic
- Type-safe query criteria
- Handles edge cases (null values, etc.)
- Performance optimized

### TaskDependencyService

**Import:**
```typescript
import taskDependencyService from 'prt/dist/services/task-dependency.service.js'
```

**Usage:**
```typescript
// Build dependency graph
const graph = taskDependencyService.buildDependencyGraph(roadmap)

// Get dependencies for a task
const deps = graph.get('F-001')
// Returns: Set<TaskID>

// Detect circular dependencies
const cycle = taskDependencyService.detectCircularDependency(roadmap)
if (cycle) {
  console.warn(`Circular dependency detected: ${cycle.join(' → ')}`)
}
```

**Why Use It:**
- Unified dependency graph (combines depends-on and blocks)
- Circular dependency detection
- Used for validation and visualization

### DisplayService

**Import:**
```typescript
import displayService from 'prt/dist/services/display.service.js'
```

**Usage:**
```typescript
// Format task details (for terminal output)
const formatted = displayService.formatTaskDetails(task)

// Format task list
const listOutput = displayService.formatTaskList(tasks, options)

// Format validation errors
const errorOutput = displayService.formatValidationErrors(errors)
```

**Why Use It:**
- Consistent formatting across commands
- Handles color codes, icons, alignment
- You can use similar patterns for markdown formatting

### Type System

**Import:**
```typescript
import {
  Roadmap,
  Task,
  TASK_TYPE,
  STATUS,
  PRIORITY,
  TaskID,
} from 'prt/dist/util/types.js'
```

**Why Use It:**
- Type safety for all PRT data structures
- Enums for valid values (prevents typos)
- Template literal types for TaskID validation

### Config Loading

**Import:**
```typescript
import {readConfigFile} from 'prt/dist/util/read-config.js'
```

**Usage:**
```typescript
const config = await readConfigFile()
// Returns: { projectName, description, version, roadmapPath }
```

**Why Use It:**
- Handles `.prtrc.json` lookup (current dir → parent dirs → home dir)
- Validates config structure
- Provides default values

### Best Practices

1. **Import from compiled output**: Use `/dist/` paths, not `/src/`
2. **Include `.js` extension**: Required for ES modules
3. **Handle errors**: Catch and handle PRT error types
4. **Use services, not utilities**: Services are the stable public API
5. **Type imports**: Import types separately for tree-shaking

---

## Extension Points

### Custom Markdown Sections

Extend `MarkdownExporterService` with custom sections:

```typescript
export class CustomMarkdownExporter extends MarkdownExporterService {
  protected generateCustomSection(roadmap: Roadmap): string {
    // Add custom analysis, charts, etc.
  }
}
```

### Multiple Export Formats

The service pattern makes it easy to add other formats:

```typescript
// src/services/json-exporter.service.ts
export class JSONExporterService {
  export(roadmap: Roadmap): string {
    return JSON.stringify(roadmap, null, 2)
  }
}

// src/services/csv-exporter.service.ts
export class CSVExporterService {
  export(roadmap: Roadmap): string {
    // Convert to CSV
  }
}
```

### Format Plugins

Future enhancement: Allow users to add custom export formats:

```typescript
// User's custom formatter
export interface ExportFormatter {
  format(roadmap: Roadmap): string
}

// Plugin registers formatter
prt.registerExportFormatter('html', new HTMLExporter())

// Use it
prt export --format=html
```

---

## Summary

This architecture demonstrates:

1. ✅ **oclif plugin structure** - Proper package.json config, command discovery
2. ✅ **Service-based design** - Reusable `MarkdownExporterService`
3. ✅ **PRT service integration** - Leverages existing services for consistency
4. ✅ **Type safety** - Uses PRT's TypeScript types
5. ✅ **Testability** - Pure functions, no I/O in services
6. ✅ **Extensibility** - Clear extension points for customization

**Next Steps:**
- Implement `MarkdownExporterService`
- Implement `export` command
- Add comprehensive tests
- Document usage in README
