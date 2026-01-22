# ARCHITECTURE.md

**Version:** 0.2.0
**Last Updated:** 2026-01-21
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

### Current Architecture (v0.2.0)

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
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Utility Layer (helpers)        │
│  ✓ validate-task, update-task, etc  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    File I/O Layer (node:fs)         │
│  ✓ read-roadmap, write-roadmap      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Data Layer (JSON)           │
│      .prtrc.json, prt.json          │
└─────────────────────────────────────┘
```

**Legend:**
✓ = Implemented
⚡ = Recommended for future

### Recommended Architecture (Future Enhancements)

```
┌─────────────────────────────────────┐
│         CLI Layer (oclif)           │
│      Thin command handlers only     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Service Layer (Current)        │
│  ✓ TaskService, TaskQueryService    │
│  ✓ RoadmapService, DisplayService   │
│  ✓ TaskDependencyService            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Repository Layer                 │
│  ⚡ RoadmapRepository (with caching) │
│  ⚡ ConfigRepository                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Data Layer (JSON)           │
│      .prtrc.json, prt.json          │
└─────────────────────────────────────┘
```

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
│   └── display.service.ts         # Output formatting
├── util/                 # Utility functions & types
│   ├── types.ts          # Core type definitions
│   ├── read-config.ts    # Read .prtrc.json
│   ├── read-roadmap.ts   # Read prt.json
│   ├── write-roadmap.ts  # Write prt.json
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

### Recommended Structure (Future Evolution)

```
src/
├── commands/             # CLI layer (thin handlers)
├── services/             # ⚡ Business logic layer
│   ├── task.service.ts
│   ├── validation.service.ts
│   └── dependency.service.ts
├── repositories/         # ⚡ Data access layer
│   ├── roadmap.repository.ts
│   └── config.repository.ts
├── domain/              # ⚡ Domain models & logic
│   ├── task.ts
│   └── roadmap.ts
├── errors/              # ⚡ Custom error classes
│   └── task-errors.ts
├── interfaces/          # ⚡ Contracts & abstractions
│   └── repository.interface.ts
└── util/                # Pure utility functions
    ├── types.ts
    └── date-utils.ts

test/
├── unit/                # ⚡ Unit tests
│   ├── services/
│   └── domain/
├── integration/         # ⚡ Integration tests
│   └── commands/
└── fixtures/            # ⚡ Test data
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

### Pattern 4: Repository Pattern (Recommended - ⚡)

Abstract data access behind repositories:

```typescript
// RECOMMENDED: src/repositories/roadmap.repository.ts
export class RoadmapRepository {
  private cache?: Roadmap

  constructor(private configRepo: ConfigRepository) {}

  async load(): Promise<Roadmap> {
    if (this.cache) return this.cache

    const config = await this.configRepo.get()
    const data = await readFile(config.path, 'utf8')
    this.cache = JSON.parse(data) as Roadmap
    return this.cache
  }

  async save(roadmap: Roadmap): Promise<void> {
    const config = await this.configRepo.get()
    await writeFile(
      config.path,
      JSON.stringify(roadmap, null, 2),
      'utf8'
    )
    this.cache = roadmap
  }

  invalidateCache(): void {
    this.cache = undefined
  }
}
```

**Benefits:**
- Adds caching layer
- Centralizes file I/O
- Easier to test with mocks
- Can add features like backups, transactions

---

## Data Flow

### Current Flow (v0.2.0)

**Legacy Pattern Flow** (some commands still use this):
```
User runs command: prt add "Task" -t feature
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
  Business logic in command
  (generate ID, create task)
         ↓
   writeRoadmapFile(path, roadmap)
         ↓
  writes prt.json
         ↓
  Output to console
```

**Service-Based Pattern Flow** (current implementation):
```
User runs command: prt list -p high
         ↓
    oclif parses input
         ↓
  Command.run() (thin handler)
         ↓
   readConfigFile()
         ↓
  reads .prtrc.json
         ↓
   readRoadmapFile(path)
         ↓
  reads prt.json
         ↓
  TaskQueryService.filter(tasks, criteria)
         ↓
  TaskQueryService.sort(tasks, field)
         ↓
  DisplayService.formatTaskList(tasks)
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

### 1. Custom Commands (✓ Supported Today)

oclif auto-discovers commands in `src/commands/`:

```typescript
// src/commands/custom.ts
import {Command, Flags} from '@oclif/core'

export default class Custom extends Command {
  static description = 'Your custom command'

  async run(): Promise<void> {
    // Implementation
  }
}
```

Run with: `prt custom`

### 2. oclif Plugins (✓ Supported Today)

Already includes `@oclif/plugin-plugins`:

```bash
# Install plugin
prt plugins install my-prt-plugin

# Plugin can add commands, hooks, etc.
```

### 3. Validation Hooks (⚡ Recommended)

```typescript
// RECOMMENDED: src/hooks/validation.hook.ts
export interface ValidationHook {
  validate(task: Task, roadmap: Roadmap): ValidationResult
}

// Custom validation
export class CustomBusinessRulesHook implements ValidationHook {
  validate(task: Task): ValidationResult {
    // Custom logic
  }
}
```

### 4. Export/Import Plugins (⚡ Recommended)

```typescript
// RECOMMENDED: Future plugin architecture
export interface ExportPlugin {
  export(roadmap: Roadmap): Promise<void>
}

// Examples:
// - GitHubIssuesExporter
// - JiraExporter
// - MarkdownExporter
// - CSVExporter
```

### 5. Integration Points (⚡ Future)

Potential integrations:
- GitHub Issues sync
- Jira ticket import/export
- Slack notifications
- CI/CD status updates
- Calendar integration for due dates

---

## Testing Strategy

### Current State (v0.2.0)

- ✓ Test structure exists (`test/` directory)
- ✓ Mocha + Chai configured
- ✓ Unit tests for all services
  - `test/unit/services/task.service.test.ts`
  - `test/unit/services/task-query.service.test.ts`
  - `test/unit/services/roadmap.service.test.ts`
  - `test/unit/services/task-dependency.service.test.ts`
  - `test/unit/services/display.service.test.ts`
- ✓ Unit tests for utilities
  - `test/unit/util/validate-task.test.ts`
  - `test/unit/util/validate-task-id.test.ts`
  - `test/unit/util/update-task.test.ts`
  - `test/unit/util/read-roadmap.test.ts`
  - `test/unit/util/write-roadmap.test.ts`
  - `test/unit/util/read-config.test.ts`
- ✓ Command tests (basic)
  - `test/commands/*.test.ts`
- ⚡ Integration tests needed
- ⚡ E2E tests needed

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

### Current State

Basic error handling:
- Commands throw errors
- oclif catches and displays them
- Process exits with code 1

### Recommended: Custom Error Hierarchy

```typescript
// RECOMMENDED: src/errors/task-errors.ts
export abstract class TaskError extends Error {
  abstract code: string
  abstract exitCode: number
}

export class TaskNotFoundError extends TaskError {
  code = 'TASK_NOT_FOUND'
  exitCode = 1

  constructor(public taskId: TaskID) {
    super(`Task ${taskId} not found`)
  }
}

export class CircularDependencyError extends TaskError {
  code = 'CIRCULAR_DEPENDENCY'
  exitCode = 1

  constructor(public cycle: TaskID[]) {
    super(`Circular dependency detected: ${cycle.join(' → ')}`)
  }
}

export class InvalidTaskDataError extends TaskError {
  code = 'INVALID_TASK_DATA'
  exitCode = 1

  constructor(public taskId: TaskID, public field: string) {
    super(`Invalid ${field} for task ${taskId}`)
  }
}
```

### Error Codes for CLI Exit Codes

```typescript
export const ExitCodes = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  VALIDATION_ERROR: 2,
  NOT_FOUND: 3,
  DEPENDENCY_ERROR: 4,
} as const
```

---

## Performance Considerations

### Current Performance Characteristics

**File I/O:**
- ✓ Simple: Direct file reads/writes
- ⚡ No caching: Re-reads on every command
- ⚡ Full file writes: Even for single task updates

**Parsing:**
- ✓ JSON.parse/stringify
- ⚡ Synchronous operations
- ⚡ No streaming for large files

**Search:**
- ✓ Linear search through tasks array
- ⚡ No indexing

### Recommended Optimizations

#### 1. Caching (⚡)

```typescript
// In RoadmapRepository
private cache?: {
  roadmap: Roadmap
  mtime: number
}

async load(): Promise<Roadmap> {
  const stats = await stat(this.path)

  if (this.cache && this.cache.mtime === stats.mtimeMs) {
    return this.cache.roadmap
  }

  const roadmap = await this.readFromDisk()
  this.cache = { roadmap, mtime: stats.mtimeMs }
  return roadmap
}
```

#### 2. Incremental Writes (⚡)

For very large roadmaps, consider:
- JSONL format (one task per line)
- SQLite database
- Append-only log with snapshots

#### 3. Indexing (⚡)

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

**Completed Steps:**
1. ✓ Created `src/services/` directory with five services:
   - `task.service.ts` - Task lifecycle management
   - `task-query.service.ts` - Filtering and sorting
   - `roadmap.service.ts` - File I/O and validation
   - `task-dependency.service.ts` - Dependency validation
   - `display.service.ts` - Output formatting
2. ✓ Moved ID generation logic to `TaskService`
3. ✓ Moved validation logic to `TaskDependencyService`
4. ✓ Updated commands to use services (`list`, `validate`)
5. ✓ Added comprehensive unit tests for all services

**Status:** Phase 1 complete. Services are implemented and tested.

**Remaining work:**
- Some commands still use legacy pattern (can migrate incrementally)

### Phase 2: Repository Pattern (Add Abstraction)

**Goal:** Abstract data access behind repositories

**Steps:**
1. Create `src/repositories/roadmap.repository.ts`
2. Create `src/repositories/config.repository.ts`
3. Add caching layer
4. Update services to use repositories
5. Add repository tests with mocks

**Benefits:**
- Easier testing
- Can add caching
- Can swap storage backend

### Phase 3: Error Handling Refactor

**Goal:** Implement custom error hierarchy

**Steps:**
1. Create `src/errors/` directory
2. Implement custom error classes
3. Update services to throw custom errors
4. Add error code mapping
5. Update command error handling

### Phase 4: Testing Infrastructure

**Goal:** Achieve >80% test coverage

**Steps:**
1. Create test fixtures and factories
2. Write unit tests for services
3. Write integration tests for commands
4. Add test coverage reporting
5. Add CI/CD with test enforcement

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
