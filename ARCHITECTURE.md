# ARCHITECTURE.md

**Version:** 0.3.0
**Last Updated:** 2026-01-22
**Status:** Living document - evolves with the codebase

## Table of Contents

1. [Architectural Vision](#architectural-vision)
2. [System Architecture](#system-architecture)
3. [Directory Structure](#directory-structure)
4. [Core Design Patterns](#core-design-patterns)
5. [Data Flow](#data-flow)
6. [Task ID System](#task-id-system)
7. [Dependency Management](#dependency-management)
8. [Extension Points](#extension-points)
9. [Testing Strategy](#testing-strategy)
10. [Type System](#type-system)
11. [Error Handling](#error-handling)
12. [Performance Considerations](#performance-considerations)
13. [Migration Path](#migration-path)

---

## Architectural Vision

### Core Principles

**Immutability First**
All data transformations create new objects rather than mutating existing ones. This ensures predictability and makes the codebase easier to reason about.

**Type Safety**
Leverage TypeScript's type system to catch errors at compile time. Use template literal types, enums, and branded types to make invalid states unrepresentable.

**Functional Composition**
Prefer pure functions that are easy to test and compose. Side effects are isolated to command handlers and I/O operations.

**Progressive Enhancement**
Start simple, add complexity only when needed. The current MVP architecture is intentionally simple, with clear paths for evolution.

### Design Goals

- **Simplicity:** Code should be easy to understand and modify
- **Testability:** Business logic should be easy to unit test
- **Extensibility:** New commands and features should be straightforward to add
- **Reliability:** Type safety and validation prevent common errors

---

## System Architecture

### Current Architecture (v0.3.0)

```
┌─────────────────────────────────────┐
│         CLI Layer (oclif)           │
│    Commands, Args, Flags, Output    │
│  ✓ add, complete, update, validate  │
│  ✓ list, show, pass-test, init     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Service Layer                  │
│  ✓ TaskService, TaskQueryService    │
│  ✓ RoadmapService, DisplayService   │
│  ✓ TaskDependencyService            │
│  ✓ ErrorHandlerService              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Repository Layer                 │
│  ✓ RoadmapRepository (with caching) │
│  ✓ ConfigRepository                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Utility Layer (helpers)        │
│  ✓ validate-task, update-task, etc  │
│  ⚠ Legacy pattern (backward compat) │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Data Layer (JSON)           │
│      .prtrc.json, prt.json          │
└─────────────────────────────────────┘
```

**Legend:**
✓ = Implemented
⚠ = Legacy/deprecated (maintained for backward compatibility)
⚡ = Recommended for future

### Architecture Achievement

The current architecture (v0.3.0) now fully implements the recommended layered architecture pattern:

- ✓ **CLI Layer**: Thin command handlers using oclif framework
- ✓ **Service Layer**: Complete business logic abstraction
- ✓ **Repository Layer**: Full implementation with caching and file watching
- ✓ **Error Handling**: Custom error hierarchy with error codes
- ✓ **Testing**: 98.78% code coverage

**Backward Compatibility**: All commands support both the modern repository pattern (default) and legacy direct file I/O (via `--no-repo` flag).

---

## Directory Structure

### Current Structure

```
src/
├── commands/              # CLI command definitions
│   ├── add.ts            # Create new tasks
│   ├── complete.ts       # Mark tasks complete
│   ├── init.ts           # Initialize new project
│   ├── list.ts           # List/filter tasks
│   ├── pass-test.ts      # Mark task as passing tests
│   ├── show.ts           # Display task details
│   ├── update.ts         # Update task properties
│   └── validate.ts       # Validate roadmap integrity
├── services/             # ✓ Business logic layer
│   ├── task.service.ts            # Task lifecycle management
│   ├── task-query.service.ts      # Task filtering/sorting
│   ├── roadmap.service.ts         # Roadmap I/O and validation
│   ├── task-dependency.service.ts # Dependency graph & validation
│   ├── display.service.ts         # Output formatting
│   └── error-handler.service.ts   # Unified error handling
├── repositories/         # ✓ Data access layer
│   ├── roadmap.repository.ts      # Roadmap with caching/watching
│   ├── config.repository.ts       # Config with inheritance
│   └── index.ts                   # Repository exports
├── errors/               # ✓ Custom error classes
│   ├── base.error.ts              # Base PrtError class
│   ├── config-not-found.error.ts
│   ├── roadmap-not-found.error.ts
│   ├── task-not-found.error.ts
│   ├── invalid-task.error.ts
│   ├── circular-dependency.error.ts
│   ├── validation.error.ts
│   └── index.ts                   # Error exports
├── util/                 # Utility functions & types
│   ├── types.ts          # Core type definitions
│   ├── read-config.ts    # ⚠ Legacy - Read .prtrc.json
│   ├── read-roadmap.ts   # ⚠ Legacy - Read prt.json
│   ├── write-roadmap.ts  # ⚠ Legacy - Write prt.json
│   ├── update-task.ts    # Immutable task updates
│   ├── validate-task.ts  # Task validation logic
│   └── validate-task-id.ts # TaskID type assertion
└── index.ts              # Package entry point

test/
├── commands/             # Command tests
│   └── *.test.ts
├── unit/                 # ✓ Unit tests
│   ├── services/         # Service layer tests
│   │   ├── task.service.test.ts
│   │   ├── task-query.service.test.ts
│   │   ├── roadmap.service.test.ts
│   │   ├── task-dependency.service.test.ts
│   │   └── display.service.test.ts
│   └── util/             # Utility tests
│       └── *.test.ts
└── helpers/              # Test utilities
```

### Future Evolution Opportunities

While the current architecture is solid, potential future enhancements include:

```
src/
├── domain/              # ⚡ Domain models & rich business logic
│   ├── task.ts          # Task entity with methods
│   └── roadmap.ts       # Roadmap aggregate root
├── interfaces/          # ⚡ Contracts & abstractions
│   └── repository.interface.ts
└── plugins/             # ⚡ Plugin system architecture
    └── export-plugins/

test/
├── integration/         # ⚡ Integration tests (beyond unit tests)
│   └── commands/
└── fixtures/            # ⚡ Expanded test data
    └── sample-roadmaps/
```

---

## Core Design Patterns

### Pattern 1: Command Pattern (Current - ✓)

All CLI commands follow oclif's Command pattern with two approaches:

**Legacy Pattern** (older commands):
```typescript
export default class CommandName extends Command {
  static override args = { /* ... */ }
  static override flags = { /* ... */ }

  public async run(): Promise<void> {
    // 1. Parse input
    const {args, flags} = await this.parse(CommandName)

    // 2. Read config
    const config = await readConfigFile()

    // 3. Read roadmap
    const roadmap = await readRoadmapFile(config.path)

    // 4. Business logic (mutate data)
    // ...

    // 5. Write roadmap
    await writeRoadmapFile(config.path, roadmap)
  }
}
```

**Service-Based Pattern** (recommended, current):
```typescript
export default class CommandName extends Command {
  static override args = { /* ... */ }
  static override flags = { /* ... */ }

  public async run(): Promise<void> {
    // 1. Parse input
    const {args, flags} = await this.parse(CommandName)

    // 2. Read config
    const config = await readConfigFile()

    // 3. Use services for business logic
    const roadmap = await roadmapService.load(config.path)
    const filtered = taskQueryService.filter(roadmap.tasks, criteria)

    // 4. Display using DisplayService
    const lines = displayService.formatTaskList(filtered)
    for (const line of lines) {
      console.log(line)
    }
  }
}
```

**Benefits:**
- Consistent structure across all commands
- Separation of concerns (commands handle I/O, services handle logic)
- oclif handles parsing, validation, help generation
- Services are testable in isolation

**Examples:**
- Legacy: `src/commands/add.ts`
- Service-based: `src/commands/list.ts`, `src/commands/validate.ts`

### Pattern 2: Immutable Updates (Current - ✓)

Updates create new objects instead of mutating:

```typescript
// From src/util/update-task.ts
export async function updateTaskInRoadmap(
  roadmap: Roadmap,
  taskId: string,
  updates: Partial<Task>
): Promise<Roadmap> {
  const taskIndex = roadmap.tasks.findIndex(t => t.id === taskId)

  const updatedTask = {
    ...roadmap.tasks[taskIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  }

  return {
    ...roadmap,
    tasks: [
      ...roadmap.tasks.slice(0, taskIndex),
      updatedTask,
      ...roadmap.tasks.slice(taskIndex + 1)
    ]
  }
}
```

**Benefits:**
- Prevents accidental mutations
- Easier to track changes
- Automatically sets `updatedAt` timestamp

### Pattern 3: Service Layer (Current - ✓)

Business logic has been extracted into dedicated services:

**Implemented Services:**

1. **TaskService** (`src/services/task.service.ts`)
   - `createTask()` - Create new task objects
   - `addTask()` - Add task to roadmap (immutable)
   - `updateTask()` - Update task properties
   - `findTask()` - Find task by ID
   - `generateNextId()` - Generate next sequential ID

2. **TaskQueryService** (`src/services/task-query.service.ts`)
   - `filter()` - Filter tasks by criteria
   - `search()` - Search tasks by text
   - `sort()` - Sort tasks by field
   - `getByStatus()` - Get tasks by status
   - `getByType()` - Get tasks by type

3. **RoadmapService** (`src/services/roadmap.service.ts`)
   - `load()` - Read and parse roadmap
   - `save()` - Validate and write roadmap
   - `validate()` - Validate roadmap structure
   - `getStats()` - Get roadmap statistics

4. **TaskDependencyService** (`src/services/task-dependency.service.ts`)
   - `buildGraph()` - Build dependency graph
   - `detectCircular()` - Detect circular dependencies
   - `validateDependencies()` - Validate all dependencies
   - `getBlockedTasks()` - Get tasks blocked by a task
   - `getDependsOnTasks()` - Get task dependencies
   - `topologicalSort()` - Sort tasks by dependencies (TODO)

5. **DisplayService** (`src/services/display.service.ts`)
   - `formatTaskList()` - Format task list output
   - `formatTaskSummary()` - Format single task summary
   - `formatTaskDetails()` - Format complete task details
   - `formatValidationErrors()` - Format validation errors
   - `formatRoadmapStats()` - Format statistics
   - Helper formatters for status, priority, tests

**Example Usage:**
```typescript
// From src/commands/list.ts
import displayService from '../services/display.service.js'
import taskQueryService from '../services/task-query.service.js'

const filtered = taskQueryService.filter(roadmap.tasks, filterCriteria)
const sorted = taskQueryService.sort(filtered, sortBy, SortOrder.Ascending)
const lines = displayService.formatTaskList(sorted)
for (const line of lines) {
  console.log(line)
}
```

**Benefits:**
- Separation of concerns (commands are thin handlers)
- Business logic is testable in isolation
- Services exported as singletons for convenience
- Immutable patterns throughout

### Pattern 4: Repository Pattern (Current - ✓)

Data access is abstracted behind repositories with advanced features:

```typescript
// IMPLEMENTED: src/repositories/roadmap.repository.ts
export class RoadmapRepository {
  private cache: Map<string, CacheEntry> = new Map()
  private watchers: Map<string, FSWatcher> = new Map()

  constructor(config?: RepositoryConfig) {
    // Configurable caching, LRU eviction, file watching
  }

  async load(path: string): Promise<Roadmap> {
    // Check cache, validate mtime, watch for changes
    // Automatic cache invalidation on external edits
  }

  async save(path: string, roadmap: Roadmap): Promise<void> {
    // Validate, write, update cache
  }
}

// IMPLEMENTED: src/repositories/config.repository.ts
export class ConfigRepository {
  // Multi-level config inheritance (project → user → global)
  // JSON schema validation
  // Search path resolution
}
```

**Implemented Features:**
- ✓ LRU cache with configurable size
- ✓ File system watching (chokidar)
- ✓ Automatic cache invalidation
- ✓ Config inheritance and merging
- ✓ JSON schema validation
- ✓ Singleton pattern for convenience

**Benefits:**
- Significantly improved performance for large roadmaps
- External file changes automatically detected
- Type-safe configuration management
- Backward compatible via `--no-repo` flag

---

## Data Flow

### Current Flow (v0.3.0)

**Modern Pattern Flow** (default, with repositories):
```
User runs command: prt add "Task" -t feature
         ↓
    oclif parses input
         ↓
  Command.run() (thin handler)
         ↓
   ConfigRepository.load()
         ↓
  (cached or reads .prtrc.json with inheritance)
         ↓
   RoadmapRepository.load(path)
         ↓
  (cached or reads prt.json with file watching)
         ↓
  TaskService.generateNextId(roadmap, type)
         ↓
  TaskService.createTask(data)
         ↓
  TaskService.addTask(roadmap, task)
         ↓
   RoadmapRepository.save(path, roadmap)
         ↓
  (writes prt.json, updates cache)
         ↓
  Output to console
```

**Legacy Pattern Flow** (with `--no-repo` flag):
```
User runs command: prt add "Task" -t feature --no-repo
         ↓
    oclif parses input
         ↓
  Command.run() executes
         ↓
   readConfigFile()
         ↓
  reads .prtrc.json
         ↓
   readRoadmapFile(path)
         ↓
  reads prt.json
         ↓
  TaskService.generateNextId(roadmap, type)
         ↓
  TaskService.createTask(data)
         ↓
  TaskService.addTask(roadmap, task)
         ↓
   writeRoadmapFile(path, roadmap)
         ↓
  writes prt.json
         ↓
  Output to console
```

### Recommended Flow (Future with Repository Layer)

```
User runs command: prt add "Task" -t feature
         ↓
    oclif parses input
         ↓
  Command.run() (thin handler)
         ↓
  TaskService.addTask(dto)
         ↓
  RoadmapRepository.load()
         ↓
  (returns cached or reads file)
         ↓
  TaskService.createTask() + validate()
         ↓
  RoadmapRepository.save(roadmap)
         ↓
  (writes file, updates cache)
         ↓
  DisplayService.formatTaskDetails(task)
         ↓
  Output to console
```

---

## Task ID System

### Architecture

Task IDs use TypeScript template literal types for compile-time safety:

```typescript
// From src/util/types.ts
export type SingleDigit = `${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
export type TaskID = `${TASK_TYPE_LETTER}-${SingleDigit}${SingleDigit}${SingleDigit}`

// Runtime validation
export const TASK_ID_REGEX = /^(B|F|I|P|R)-[0-9]{3}$/
```

**Format:** `{TYPE}-{NUMBER}`
- TYPE: B (Bug), F (Feature), I (Improvement), P (Planning), R (Research)
- NUMBER: 001-999 (zero-padded 3 digits)

### ID Generation Algorithm

Located in `src/commands/add.ts:53-66`:

```typescript
const existingIDs = new Set(
  roadmap.tasks
    .filter(t => t.type === taskType)
    .map(t => t.id)
)

let newIDNumber = 1
while (true) {
  const potentialID = `${TYPE_MAP.get(taskType)}-${String(newIDNumber).padStart(3, '0')}`
  if (!existingIDs.has(potentialID)) {
    return potentialID
  }
  newIDNumber++
}
```

**Properties:**
- Sequential per task type
- Fills gaps from deleted tasks
- O(n) worst case but simple and predictable

### Extension Considerations

**After 999 tasks of one type:**
- ⚡ Consider moving to 4-digit IDs
- ⚡ Or implement archiving strategy
- ⚡ Or namespace by project/milestone

---

## Dependency Management

### Current System

Tasks support bidirectional dependencies:

```typescript
type Task = {
  'depends-on': Array<TaskID>  // Prerequisites
  blocks: Array<TaskID>         // Blocked tasks
  // ...
}
```

**depends-on:** Tasks that must complete before this task
**blocks:** Tasks that cannot start until this task completes

### Validation

Current validation (`src/commands/validate.ts`) checks:
- ✓ JSON structure validity
- ✓ Task field validation
- ✓ TaskID format
- ✓ Circular dependency detection
- ✓ Invalid task references (missing tasks)
- ✓ Bidirectional consistency (blocks ↔ depends-on)

**Missing (⚡ Recommended):**
- Topological sorting for execution order (partial implementation exists)

### Implemented: Circular Dependency Detection

The `TaskDependencyService` (`src/services/task-dependency.service.ts`) implements circular dependency detection using a three-color DFS algorithm:

```typescript
// From src/services/task-dependency.service.ts
export class TaskDependencyService {
  /**
   * Detects circular dependencies using depth-first search.
   * Returns the first circular dependency found, or null if none exist.
   */
  detectCircular(tasks: Task[]): CircularDependency | null {
    const graph = this.buildUnifiedGraph(tasks)
    const visited = new Set<TaskID>()

    for (const task of tasks) {
      const path: TaskID[] = []
      if (this.hasCycle(task.id, graph, visited, path)) {
        const cycle = this.extractCycle(path)
        const message = `Circular dependency detected: ${cycle.join(' -> ')}`
        return {cycle, message}
      }
    }

    return null
  }

  /**
   * Validates all dependencies in a roadmap.
   * Checks for invalid references, circular dependencies, and more.
   */
  validateDependencies(roadmap: Roadmap): DependencyValidationError[] {
    // Returns array of validation errors
  }
}
```

**Features:**
- Three-color DFS (white/gray/black nodes)
- Unified graph combining depends-on and blocks
- Detailed error messages with cycle paths
- Validation of task references
- Used by `validate` command

**Example:** See `src/commands/validate.ts:63-73`

---

## Extension Points

PRT supports extensibility through oclif's plugin system. This section provides comprehensive guidance for building plugins that extend PRT functionality.

### 8.1 Overview

PRT plugins are oclif plugins that:
- Add new commands to the `prt` CLI
- Leverage PRT's service layer for business logic
- Follow consistent patterns for maintainability
- Can be distributed via npm or installed from GitHub

**Reference Implementation:** See `examples/plugins/example-prt-plugin/` for a complete working example.

### 8.2 Plugin Architecture

#### 8.2.1 Directory Structure

```
my-prt-plugin/
├── package.json              # oclif config with bin="prt"
├── tsconfig.json             # TypeScript configuration
├── src/
│   ├── index.ts              # Plugin entry point (exports commands)
│   ├── commands/
│   │   └── my-command.ts     # Command implementations
│   └── services/
│       └── my.service.ts     # Business logic (optional)
├── test/
│   ├── commands/
│   │   └── my-command.test.ts
│   └── services/
│       └── my.service.test.ts
└── examples/
    └── sample-output.md      # Example outputs (optional)
```

#### 8.2.2 File Responsibilities

| File | Purpose |
|------|---------|
| `package.json` | oclif configuration, peer dependencies, scripts |
| `src/index.ts` | Export all commands for oclif discovery |
| `src/commands/*.ts` | Command implementations (thin handlers) |
| `src/services/*.ts` | Reusable business logic (pure functions) |
| `test/` | Unit and integration tests |

### 8.3 Import Patterns (Critical)

**IMPORTANT:** ES modules require specific import paths. Always use `/dist/` and include the `.js` extension.

#### Service Imports

```typescript
// Services - import from compiled dist directory
import roadmapService from 'project-roadmap-tracking/dist/services/roadmap.service.js'
import taskService from 'project-roadmap-tracking/dist/services/task.service.js'
import taskQueryService from 'project-roadmap-tracking/dist/services/task-query.service.js'
import taskDependencyService from 'project-roadmap-tracking/dist/services/task-dependency.service.js'
import displayService from 'project-roadmap-tracking/dist/services/display.service.js'
import errorHandlerService from 'project-roadmap-tracking/dist/services/error-handler.service.js'
```

#### Utility Imports

```typescript
// Utilities
import {readConfigFile} from 'project-roadmap-tracking/dist/util/read-config.js'
import {readRoadmapFile} from 'project-roadmap-tracking/dist/util/read-roadmap.js'
import {writeRoadmapFile} from 'project-roadmap-tracking/dist/util/write-roadmap.js'
```

#### Type Imports

```typescript
// Types and enums
import {
  Roadmap,
  Task,
  Config,
  TASK_TYPE,
  STATUS,
  PRIORITY,
  TaskID,
  Tag,
} from 'project-roadmap-tracking/dist/util/types.js'

// Errors
import {
  PrtError,
  TaskNotFoundError,
  ValidationError,
} from 'project-roadmap-tracking/dist/errors/index.js'
```

#### Why `/dist/` is Required

- ES modules require compiled JavaScript paths at runtime
- Node16 module resolution mandates `.js` extension
- TypeScript source files (`/src/`) are not directly importable
- The `/dist/` directory contains the compiled, runnable code

### 8.4 Command Implementation Pattern

Commands follow the service-based pattern: thin handlers that delegate business logic to services.

```typescript
// src/commands/export.ts
import {Command, Flags, Args} from '@oclif/core'
import {readConfigFile} from 'project-roadmap-tracking/dist/util/read-config.js'
import roadmapService from 'project-roadmap-tracking/dist/services/roadmap.service.js'
import taskQueryService from 'project-roadmap-tracking/dist/services/task-query.service.js'
import {Roadmap, STATUS, PRIORITY} from 'project-roadmap-tracking/dist/util/types.js'
import {MyExporterService} from '../services/my-exporter.service.js'

export default class Export extends Command {
  static override description = 'Export roadmap to custom format'

  static override examples = [
    '<%= config.bin %> <%= command.id %> -o output.md',
    '<%= config.bin %> <%= command.id %> --format=json --priority=high',
  ]

  static override args = {
    file: Args.string({
      description: 'Output file path',
      required: false,
    }),
  }

  static override flags = {
    output: Flags.string({
      char: 'o',
      description: 'Output file path',
    }),
    format: Flags.string({
      char: 'f',
      description: 'Export format',
      options: ['markdown', 'json', 'csv'],
      default: 'markdown',
    }),
    priority: Flags.string({
      char: 'p',
      description: 'Filter by priority',
      options: ['high', 'medium', 'low'],
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Export)

    // 1. Load configuration
    const config = await readConfigFile()

    // 2. Load roadmap using PRT service
    const roadmap = await roadmapService.load(config.path)

    // 3. Apply filters using query service
    let tasks = roadmap.tasks
    if (flags.priority) {
      tasks = taskQueryService.filter(tasks, {
        priority: flags.priority.toUpperCase() as keyof typeof PRIORITY,
      })
    }

    // 4. Use custom service for business logic
    const exporter = new MyExporterService()
    const output = exporter.export({...roadmap, tasks}, {format: flags.format})

    // 5. Handle output (I/O belongs in command)
    const outputPath = args.file ?? flags.output
    if (outputPath) {
      await this.writeFile(outputPath, output)
      this.log(`Exported to ${outputPath}`)
    } else {
      this.log(output)
    }
  }

  private async writeFile(path: string, content: string): Promise<void> {
    const fs = await import('node:fs/promises')
    await fs.writeFile(path, content, 'utf8')
  }
}
```

**Key Principles:**
- Commands handle I/O (reading config, writing files, console output)
- Services handle business logic (filtering, transformation, validation)
- Use oclif's `Flags` and `Args` for type-safe CLI parsing
- Provide `examples` for help documentation

### 8.5 package.json Configuration

```json
{
  "name": "my-prt-plugin",
  "version": "1.0.0",
  "description": "Custom plugin for PRT",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ],
  "oclif": {
    "bin": "prt",
    "dirname": "prt",
    "commands": "./dist/commands",
    "plugins": [],
    "topicSeparator": " "
  },
  "scripts": {
    "build": "tsc",
    "test": "mocha --loader=tsx/esm 'test/**/*.test.ts'",
    "lint": "eslint src test",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "@oclif/core": "^4.0.0",
    "project-roadmap-tracking": "^0.2.0"
  },
  "devDependencies": {
    "@oclif/core": "^4.0.0",
    "@types/chai": "^4",
    "@types/mocha": "^10",
    "@types/node": "^18",
    "chai": "^4",
    "mocha": "^10",
    "project-roadmap-tracking": "^0.2.0",
    "tsx": "^4",
    "typescript": "^5"
  }
}
```

**Critical Configuration:**

| Setting | Value | Purpose |
|---------|-------|---------|
| `oclif.bin` | `"prt"` | Extends PRT CLI (not standalone) |
| `oclif.commands` | `"./dist/commands"` | Where oclif finds command files |
| `type` | `"module"` | ES modules support |
| `peerDependencies` | `@oclif/core`, `project-roadmap-tracking` | Ensures version compatibility |

### 8.6 Service Usage Reference

PRT exposes these services for plugin use:

| Service | Key Methods | Purpose |
|---------|-------------|---------|
| `roadmapService` | `load(path)`, `save(path, roadmap)`, `validate(roadmap)`, `getStats(roadmap)` | File I/O and roadmap operations |
| `taskService` | `createTask(data)`, `addTask(roadmap, task)`, `updateTask(roadmap, id, updates)`, `findTask(roadmap, id)`, `generateNextId(roadmap, type)` | Task lifecycle management |
| `taskQueryService` | `filter(tasks, criteria)`, `search(tasks, query)`, `sort(tasks, field, order)`, `getByStatus(tasks, status)`, `getByType(tasks, type)` | Query and filter tasks |
| `taskDependencyService` | `buildDependencyGraph(roadmap)`, `detectCircularDependency(roadmap)`, `validateDependencies(roadmap)` | Dependency graph analysis |
| `displayService` | `formatTaskList(tasks)`, `formatTaskDetails(task)`, `formatValidationErrors(errors)`, `formatRoadmapStats(stats)` | Terminal output formatting |
| `errorHandlerService` | `handleError(error, verbose)`, `formatErrorMessage(error)` | Unified error handling |

**Example Usage:**

```typescript
// Load and filter tasks
const roadmap = await roadmapService.load(config.path)
const highPriority = taskQueryService.filter(roadmap.tasks, {
  priority: PRIORITY.High,
  status: STATUS.InProgress,
})

// Get statistics
const stats = roadmapService.getStats(roadmap)
console.log(`Total tasks: ${stats.totalTasks}`)

// Create and add a task
const nextId = taskService.generateNextId(roadmap, TASK_TYPE.Feature)
const task = taskService.createTask({
  id: nextId,
  title: 'New feature',
  details: 'Description',
  type: TASK_TYPE.Feature,
  priority: PRIORITY.High,
})
const updatedRoadmap = taskService.addTask(roadmap, task)
await roadmapService.save(config.path, updatedRoadmap)
```

### 8.7 Testing Strategies

#### Service Testing

Test services with pure data fixtures:

```typescript
// test/services/my-exporter.service.test.ts
import {expect} from 'chai'
import {MyExporterService} from '../../src/services/my-exporter.service.js'
import {Roadmap, STATUS, PRIORITY, TASK_TYPE} from 'project-roadmap-tracking/dist/util/types.js'

describe('MyExporterService', () => {
  let service: MyExporterService

  beforeEach(() => {
    service = new MyExporterService()
  })

  it('should export roadmap to markdown', () => {
    const roadmap: Roadmap = {
      $schema: '...',
      metadata: {
        name: 'Test Project',
        description: 'Test description',
        createdAt: '2026-01-01T00:00:00.000Z',
        createdBy: 'test',
      },
      tasks: [
        {
          id: 'F-001',
          title: 'Test Feature',
          details: 'Details',
          type: TASK_TYPE.Feature,
          status: STATUS.NotStarted,
          priority: PRIORITY.Medium,
          'passes-tests': false,
          'depends-on': [],
          blocks: [],
          tags: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    }

    const result = service.export(roadmap, {format: 'markdown'})

    expect(result).to.include('Test Project')
    expect(result).to.include('F-001')
    expect(result).to.include('Test Feature')
  })
})
```

#### Command Testing with Temp Directories

```typescript
// test/commands/export.test.ts
import {expect} from 'chai'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import Export from '../../src/commands/export.js'

async function withTempRoadmap(
  roadmap: Roadmap,
  callback: (context: {tempDir: string; roadmapPath: string}) => Promise<void>
): Promise<void> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prt-test-'))

  try {
    const roadmapPath = path.join(tempDir, 'prt.json')
    await fs.writeFile(roadmapPath, JSON.stringify(roadmap, null, 2))

    const configPath = path.join(tempDir, '.prtrc.json')
    await fs.writeFile(configPath, JSON.stringify({
      $schema: '...',
      metadata: {name: 'Test', description: 'Test'},
      path: roadmapPath,
    }, null, 2))

    const originalCwd = process.cwd()
    process.chdir(tempDir)

    try {
      await callback({tempDir, roadmapPath})
    } finally {
      process.chdir(originalCwd)
    }
  } finally {
    await fs.rm(tempDir, {recursive: true, force: true})
  }
}

describe('export command', () => {
  it('should export roadmap to file', async () => {
    const roadmap = createTestRoadmap()

    await withTempRoadmap(roadmap, async ({tempDir}) => {
      const outputPath = path.join(tempDir, 'output.md')
      const cmd = new Export(['-o', outputPath], {} as any)
      await cmd.run()

      const content = await fs.readFile(outputPath, 'utf8')
      expect(content).to.include('Test Project')
    })
  })
})
```

### 8.8 Plugin Installation and Distribution

#### Installation Methods

```bash
# From npm registry
prt plugins install my-prt-plugin

# From GitHub repository
prt plugins install username/my-prt-plugin

# From local directory (development)
cd /path/to/my-prt-plugin
npm run build
prt plugins link

# Uninstall
prt plugins uninstall my-prt-plugin

# List installed plugins
prt plugins
```

#### Publishing to npm

```bash
# Build the plugin
npm run build

# Test locally
prt plugins link
prt my-command --help

# Publish (ensure package.json version is updated)
npm publish
```

### 8.9 Best Practices

1. **Import from `/dist/` paths** - Always use compiled output paths, never source
2. **Include `.js` extension** - Required for ES modules
3. **Use services, not utilities** - Services are the stable public API
4. **Separate I/O from logic** - Commands handle I/O, services handle business logic
5. **Handle errors gracefully** - Use PRT's error classes when appropriate
6. **Test with fixtures** - Create mock roadmaps for testing
7. **Declare peer dependencies** - Ensures version compatibility with PRT
8. **Follow oclif patterns** - Use flags, args, and examples consistently
9. **Document commands** - Provide description and examples in command class
10. **Keep commands thin** - Business logic belongs in services

### 8.10 Reference Implementation

See `examples/plugins/example-prt-plugin/` for a complete working example:

| File | Description |
|------|-------------|
| `ARCHITECTURE.md` | Detailed plugin architecture documentation |
| `README.md` | User-facing documentation with usage examples |
| Implementation | Demonstrates export command with filtering, sorting, and multiple output formats |

The example plugin implements a markdown export feature that demonstrates:
- Service-based architecture
- Filter and sort integration with `taskQueryService`
- Multiple output formats
- Comprehensive flag handling
- Testing patterns

### 8.11 Future Extension Points

The following extension points are planned for future implementation:

#### Validation Hooks (⚡ Recommended)

```typescript
// Future: src/hooks/validation.hook.ts
export interface ValidationHook {
  validate(task: Task, roadmap: Roadmap): ValidationResult
}

export class CustomBusinessRulesHook implements ValidationHook {
  validate(task: Task): ValidationResult {
    // Custom validation logic
  }
}
```

#### Export/Import Plugins (⚡ Recommended)

```typescript
// Future: Plugin interface for data export/import
export interface ExportPlugin {
  export(roadmap: Roadmap): Promise<void>
}

// Potential implementations:
// - GitHubIssuesExporter
// - JiraExporter
// - MarkdownExporter (see example-prt-plugin)
// - CSVExporter
```

#### Integration Points (⚡ Future)

Potential integrations for future development:
- GitHub Issues sync
- Jira ticket import/export
- Slack notifications
- CI/CD status updates
- Calendar integration for due dates

---

## Testing Strategy

### Current State (v0.3.0)

**Test Coverage: 98.78%** 🎉

- ✓ Comprehensive test suite (Mocha + Chai + c8)
- ✓ Unit tests for all services (99.89% coverage)
  - `test/unit/services/task.service.test.ts`
  - `test/unit/services/task-query.service.test.ts`
  - `test/unit/services/roadmap.service.test.ts`
  - `test/unit/services/task-dependency.service.test.ts`
  - `test/unit/services/display.service.test.ts`
  - `test/unit/services/error-handler.service.test.ts`
- ✓ Unit tests for repositories (96.06% coverage)
  - `test/unit/repositories/roadmap.repository.test.ts`
  - `test/unit/repositories/config.repository.test.ts`
- ✓ Unit tests for errors (100% coverage)
  - `test/unit/errors/*.test.ts`
- ✓ Unit tests for utilities (100% coverage)
  - `test/unit/util/*.test.ts`
- ✓ Command tests (97.44% coverage)
  - `test/commands/*.test.ts`
- ⚡ Integration tests (future enhancement)
- ⚡ E2E tests (future enhancement)

### Recommended Testing Pyramid

```
         /\
        /  \
       / E2E\     ⚡ Few end-to-end tests
      /______\
     /        \
    /Integration\   ⚡ Integration tests for commands
   /__________\
  /            \
 /  Unit Tests  \  ⚡ Many unit tests for services/utils
/________________\
```

### Unit Tests (⚡ Recommended)

```typescript
// test/unit/services/task.service.test.ts
describe('TaskService', () => {
  let service: TaskService
  let mockRepo: MockRoadmapRepository

  beforeEach(() => {
    mockRepo = new MockRoadmapRepository()
    service = new TaskService(mockRepo, new ValidationService())
  })

  it('should generate sequential task IDs', async () => {
    mockRepo.setRoadmap({
      tasks: [{ id: 'F-001', /* ... */ }]
    })

    const task = await service.addTask({
      title: 'New feature',
      type: TASK_TYPE.Feature,
      details: 'Description'
    })

    expect(task.id).to.equal('F-002')
  })
})
```

### Integration Tests (⚡ Recommended)

```typescript
// test/integration/commands/add.test.ts
describe('prt add', () => {
  it('should add a new task to roadmap', async () => {
    // Setup test roadmap
    await setupTestRoadmap()

    // Run command
    await runCommand(['add', 'Task', '-t', 'feature', '-d', 'Details'])

    // Verify roadmap was updated
    const roadmap = await readRoadmap()
    expect(roadmap.tasks).to.have.length(1)
    expect(roadmap.tasks[0].title).to.equal('Task')
  })
})
```

### Test Data Factories (⚡ Recommended)

```typescript
// test/fixtures/task-factory.ts
export const taskFactory = {
  build(overrides?: Partial<Task>): Task {
    return {
      id: 'F-001',
      title: 'Test task',
      type: TASK_TYPE.Feature,
      status: STATUS.NotStarted,
      priority: PRIORITY.Medium,
      details: 'Test details',
      'passes-tests': false,
      'depends-on': [],
      blocks: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    }
  }
}
```

---

## Type System

### Template Literal Types

TaskID uses template literals for type safety:

```typescript
// Ensures IDs match exact format at compile time
type TaskID = `${TASK_TYPE_LETTER}-${SingleDigit}${SingleDigit}${SingleDigit}`

// This compiles:
const valid: TaskID = 'F-001'

// This doesn't:
const invalid: TaskID = 'X-001'  // Error: Type '"X-001"' is not assignable
const invalid2: TaskID = 'F-1'   // Error: Type '"F-1"' is not assignable
```

### Branded Types (⚡ Recommended)

For additional type safety:

```typescript
// RECOMMENDED: src/util/branded-types.ts
declare const brand: unique symbol

export type Brand<T, B> = T & { [brand]: B }
export type TaskID = Brand<string, 'TaskID'>

// Forces use of validation function
export function taskId(value: string): TaskID {
  validateTaskID(value)
  return value as TaskID
}

// Usage:
const id = taskId('F-001')  // Type: TaskID
const invalid = taskId('bad') // Throws at runtime
```

### Discriminated Unions (⚡ Future)

For task type-specific properties:

```typescript
// RECOMMENDED: Future enhancement
type BaseTask = {
  id: TaskID
  title: string
  // ...
}

type BugTask = BaseTask & {
  type: TASK_TYPE.Bug
  severity: 'critical' | 'major' | 'minor'
  stepsToReproduce: string
}

type FeatureTask = BaseTask & {
  type: TASK_TYPE.Feature
  userStory: string
}

type Task = BugTask | FeatureTask | /* ... */
```

---

## Error Handling

### Implemented: Custom Error Hierarchy (✓)

```typescript
// IMPLEMENTED: src/errors/base.error.ts
export enum PrtErrorCode {
  PRT_UNKNOWN = 'PRT_UNKNOWN',
  PRT_FILE_CONFIG_NOT_FOUND = 'PRT_FILE_CONFIG_NOT_FOUND',
  PRT_FILE_ROADMAP_NOT_FOUND = 'PRT_FILE_ROADMAP_NOT_FOUND',
  PRT_TASK_NOT_FOUND = 'PRT_TASK_NOT_FOUND',
  PRT_TASK_INVALID = 'PRT_TASK_INVALID',
  PRT_TASK_ID_INVALID = 'PRT_TASK_ID_INVALID',
  PRT_VALIDATION_FAILED = 'PRT_VALIDATION_FAILED',
  PRT_VALIDATION_CIRCULAR_DEPENDENCY = 'PRT_VALIDATION_CIRCULAR_DEPENDENCY',
}

export class PrtError extends Error {
  public readonly code: PrtErrorCode
  public readonly context?: Record<string, unknown>
  
  constructor(message: string, code: PrtErrorCode, context?: Record<string, unknown>) {
    super(message)
    this.code = code
    this.context = context
  }
}

// IMPLEMENTED: Specific error classes
// - ConfigNotFoundError
// - RoadmapNotFoundError
// - TaskNotFoundError
// - InvalidTaskError
// - CircularDependencyError
// - ValidationError
```

### Error Handler Service (✓)

```typescript
// IMPLEMENTED: src/services/error-handler.service.ts
export class ErrorHandlerService {
  handleError(error: unknown, verbose: boolean = false): never {
    // Unified error handling with context
    // Formatted output for users
    // Stack traces in verbose mode
  }
}
```

---

## Performance Considerations

### Current Performance Characteristics

**File I/O:**
- ✓ Repository pattern with LRU caching
- ✓ Mtime-based cache invalidation
- ✓ File watching for external changes
- ✓ Efficient multi-file support

**Parsing:**
- ✓ JSON.parse/stringify
- ⚡ Synchronous operations (acceptable for CLI)
- ⚡ No streaming (not needed for typical roadmap sizes)

**Search:**
- ✓ Linear search with service abstraction
- ⚡ No indexing (fast enough for typical use)

### Recommended Optimizations

#### 1. Caching (✓ IMPLEMENTED)

```typescript
// IMPLEMENTED: In RoadmapRepository
private cache: Map<string, CacheEntry> = new Map()

async load(path: string): Promise<Roadmap> {
  const cached = this.cache.get(path)
  if (cached) {
    const stats = await stat(path)
    if (stats.mtimeMs === cached.mtime) {
      return cached.data // Cache hit!
    }
  }
  
  // Cache miss or stale - load and cache
  const roadmap = await this._loadFromDisk(path)
  this._cacheSet(path, roadmap, stats.mtimeMs)
  return roadmap
}

// Features:
// ✓ LRU eviction (configurable max size)
// ✓ mtime-based invalidation
// ✓ File watching for external changes
// ✓ Per-file caching (supports multiple roadmaps)
```

#### 2. Incremental Writes (⚡ Future Optimization)

For very large roadmaps (1000+ tasks), consider:
- JSONL format (one task per line)
- SQLite database
- Append-only log with snapshots

#### 3. Indexing (⚡ Future Optimization)

```typescript
// Build index on load for O(1) lookups
class RoadmapIndex {
  private byId: Map<TaskID, Task>
  private byType: Map<TASK_TYPE, Task[]>
  private byStatus: Map<STATUS, Task[]>

  constructor(roadmap: Roadmap) {
    // Build indexes
  }

  findById(id: TaskID): Task | undefined {
    return this.byId.get(id)
  }
}
```

#### 4. Lazy Loading (⚡)

For massive roadmaps:
```typescript
// Load metadata first, tasks on demand
interface RoadmapMetadata {
  metadata: Metadata
  taskCount: number
  taskIndex: TaskIndex[]
}

interface TaskIndex {
  id: TaskID
  offset: number  // Byte offset in file
  length: number
}
```

---

## Migration Path

### Phase 1: Service Layer Extraction (✓ COMPLETED)

**Goal:** Extract business logic from commands into services

**Status:** ✓ Complete with 99.89% service coverage

**Implemented:**
1. ✓ Created `src/services/` with six services:
   - `task.service.ts` - Task lifecycle management
   - `task-query.service.ts` - Filtering and sorting
   - `roadmap.service.ts` - File I/O and validation
   - `task-dependency.service.ts` - Dependency validation
   - `display.service.ts` - Output formatting
   - `error-handler.service.ts` - Unified error handling
2. ✓ All business logic extracted from commands
3. ✓ Comprehensive unit test suite
4. ✓ All commands use service-based pattern
5. ✓ Legacy pattern maintained for backward compatibility

### Phase 2: Repository Pattern (✓ COMPLETED)

**Goal:** Abstract data access behind repositories with caching

**Status:** ✓ Complete with 96.06% repository coverage

**Implemented:**
1. ✓ `RoadmapRepository` with LRU cache and file watching
2. ✓ `ConfigRepository` with multi-level inheritance
3. ✓ All commands support `--no-repo` flag for backward compatibility
4. ✓ Comprehensive unit tests with mocking
5. ✓ Singleton pattern for ease of use

**Achievements:**
- Significant performance improvement for large roadmaps
- Automatic cache invalidation on external file changes
- Type-safe configuration management
- Full backward compatibility

### Phase 3: Error Handling (✓ COMPLETED)

**Goal:** Implement custom error hierarchy with codes

**Status:** ✓ Complete with 100% error coverage

**Implemented:**
1. ✓ Created `src/errors/` with complete error hierarchy
2. ✓ `PrtError` base class with error codes and context
3. ✓ Seven specialized error classes
4. ✓ `ErrorHandlerService` for unified error handling
5. ✓ Verbose mode for stack traces

**Achievements:**
- Consistent error messages across all commands
- Error codes for programmatic handling
- Context-aware error reporting
- User-friendly error messages

### Phase 4: Testing Infrastructure (✓ MOSTLY COMPLETED)

**Goal:** Achieve >80% test coverage

**Status:** ✓ Exceeded goal with 98.78% coverage! 🎉

**Implemented:**
1. ✓ Comprehensive test suite (Mocha + Chai + c8)
2. ✓ Test fixtures and helpers
3. ✓ Unit tests for all layers
4. ✓ Coverage reporting (HTML + LCOV)
5. ✓ Test commands in package.json

**Coverage Breakdown:**
- Services: 99.89%
- Commands: 97.44%
- Repositories: 96.06%
- Errors: 100%
- Utilities: 100%

**Remaining Opportunities:**
- ⚡ Integration tests (end-to-end command workflows)
- ⚡ CI/CD pipeline with automated testing
- ⚡ Performance benchmarks

---

## Decision Records

### Why TypeScript Strict Mode?

**Decision:** Use TypeScript with `strict: true`

**Rationale:**
- Catches null/undefined errors at compile time
- Forces explicit type annotations
- Better IDE support
- Prevents entire classes of runtime errors

### Why Immutable Updates?

**Decision:** Use spread operators instead of mutations

**Rationale:**
- Predictable behavior (no action at distance)
- Easier to track changes
- Simpler testing (pure functions)
- Potential for undo/redo features

**Trade-off:** Slightly more verbose code, minimal performance impact for current scale

### Why JSON over Database?

**Decision:** Use JSON files for data storage

**Rationale:**
- **Simplicity:** No DB setup required
- **Portability:** Files can be git-tracked
- **Human-readable:** Can edit manually if needed
- **Version control:** Works with git naturally

**Trade-off:** Performance limits at scale (thousands of tasks)

**Migration path:** Can add SQLite later without API changes if using repository pattern

### Why oclif?

**Decision:** Use oclif framework for CLI

**Rationale:**
- Industry-standard (used by Heroku, Salesforce)
- Built-in parsing, help generation, plugin system
- TypeScript-first
- Excellent documentation
- Active maintenance

### Why ES Modules?

**Decision:** Use `"type": "module"` with Node16 resolution

**Rationale:**
- Modern standard
- Better tree-shaking
- Native browser compatibility (if needed)
- Future-proof

**Trade-off:** Must use `.js` extensions in imports (even for `.ts` files)

---

## Appendix: Key Files Reference

| File | Purpose | Lines of Interest |
|------|---------|-------------------|
| `src/util/types.ts` | Core type definitions | 1-83 (entire file) |
| `src/commands/add.ts` | ID generation algorithm | 53-66 |
| `src/util/update-task.ts` | Immutable update pattern | 3-23 (entire file) |
| `src/util/validate-task.ts` | Validation logic | 3-23 (entire file) |
| `src/commands/validate.ts` | Validation orchestration | 21-77 |
| `src/services/task.service.ts` | Task lifecycle management | 1-408 (entire file) |
| `src/services/task-query.service.ts` | Filtering and sorting | 1-200+ (entire file) |
| `src/services/roadmap.service.ts` | File I/O and validation | 1-200+ (entire file) |
| `src/services/task-dependency.service.ts` | Dependency graph & circular detection | 112-126 (detectCircular), 214-302 (validateDependencies) |
| `src/services/display.service.ts` | Output formatting | 1-366 (entire file) |
| `src/commands/list.ts` | Service-based command example | 85-98 (service usage) |

---

**Document Maintainers:** Update this document when making architectural changes.
**Feedback:** Open issues for architectural discussions at https://github.com/ZacharyEggert/project-roadmap-tracking/issues
