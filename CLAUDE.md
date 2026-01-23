# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Project Roadmap Tracking (PRT) is an oclif-based CLI tool for managing project tasks in a structured JSON format (`prt.json`). The tool enables teams to track features, bugs, improvements, planning tasks, and research items with dependencies, priorities, and testing status.

## Development Commands

```bash
# Build the project (clean and compile TypeScript)
yarn build

# Run linter
yarn lint

# Run tests
yarn test

# Test a single file
yarn mocha --forbid-only "test/path/to/file.test.ts"

# Local development - run the CLI without installing
./bin/dev.js COMMAND

# Link for global development testing
yarn link
prt COMMAND
```

## Architecture

### Data Model

The project uses two core JSON files managed in user projects:

1. **`.prtrc.json`** (config file) - Stores project metadata and path to roadmap
2. **`prt.json`** (roadmap file) - Contains all tasks and project data

### Task ID System

Task IDs follow the format `{TYPE}-{NUMBER}` where:

- TYPE: Single letter prefix (B=Bug, F=Feature, I=Improvement, P=Planning, R=Research)
- NUMBER: Zero-padded 3-digit number (001-999)
- Examples: `F-001`, `B-042`, `P-003`

IDs are auto-generated sequentially per task type by the `add` command (see `src/commands/add.ts:53-66`).

### Command Structure

All commands extend `@oclif/core`'s `Command` class. Commands are located in `src/commands/` and automatically discovered by oclif.

**Legacy pattern** (direct utility calls):

1. **Parse flags/args** using `this.parse()`
2. **Read config** via `readConfigFile()` from `src/util/read-config.ts`
3. **Read roadmap** via `readRoadmapFile()` from `src/util/read-roadmap.ts`
4. **Mutate data** as needed
5. **Write roadmap** via `writeRoadmapFile()` from `src/util/write-roadmap.ts`

**Modern pattern** (service-based, recommended):

1. **Parse flags/args** using `this.parse()`
2. **Read config** via `readConfigFile()`
3. **Use services** for business logic (taskService, roadmapService, taskQueryService)
4. **Write via services** or utility functions as needed

Both patterns are valid, but newer commands should prefer the service-based approach for better maintainability and testability (see `src/commands/add.ts` for an example).

### Service Layer

The project uses a service layer that provides centralized business logic for roadmap and task operations. Services use immutable patterns and are exported as singletons for convenience.

#### RoadmapService

Located at `src/services/roadmap.service.ts`, this service handles file I/O and roadmap-level operations:

- **`load(path: string)`** - Reads and parses a roadmap from a JSON file
- **`save(path: string, roadmap: Roadmap)`** - Validates and writes a roadmap to a JSON file
- **`validate(roadmap: Roadmap)`** - Validates roadmap structure, task data, and reference integrity
- **`getStats(roadmap: Roadmap)`** - Returns statistics (counts by status, type, priority)

#### TaskService

Located at `src/services/task.service.ts`, this service manages the task lifecycle:

- **`createTask(data)`** - Creates a new task object with defaults and timestamps
- **`addTask(roadmap, task)`** - Adds a task to roadmap (returns new roadmap, immutable)
- **`updateTask(roadmap, taskId, updates)`** - Updates a task (returns new roadmap, immutable)
- **`findTask(roadmap, taskId)`** - Finds a task by ID
- **`generateNextId(roadmap, taskType)`** - Generates the next available task ID for a type

#### TaskQueryService

Located at `src/services/task-query.service.ts`, this service provides query and filtering operations:

- **`filter(tasks, criteria)`** - Filters tasks by status, type, priority, tags, etc.
- **`search(tasks, query)`** - Searches tasks by title/details (case-insensitive)
- **`sort(tasks, field, order)`** - Sorts tasks by any field with ascending/descending order
- **`getByStatus(tasks, status)`** - Convenience method to get tasks by status
- **`getByType(tasks, type)`** - Convenience method to get tasks by type

**Example usage:**

```typescript
import roadmapService from './services/roadmap.service.js'
import taskService from './services/task.service.js'
import taskQueryService from './services/task-query.service.js'

// Load roadmap
const roadmap = await roadmapService.load('./prt.json')

// Create and add a task
const taskId = taskService.generateNextId(roadmap, TASK_TYPE.Feature)
const task = taskService.createTask({
  id: taskId,
  title: 'New feature',
  details: 'Feature description',
  type: TASK_TYPE.Feature,
  priority: PRIORITY.High,
})
const updatedRoadmap = taskService.addTask(roadmap, task)

// Query tasks
const highPriorityTasks = taskQueryService.filter(roadmap.tasks, {
  priority: PRIORITY.High,
  status: STATUS.InProgress,
})

// Save roadmap
await roadmapService.save('./prt.json', updatedRoadmap)
```

### Core Utilities

- **`src/util/types.ts`** - TypeScript definitions for Task, Roadmap, Config, and enums
- **`src/util/read-roadmap.ts`** - Reads and parses `prt.json`
- **`src/util/write-roadmap.ts`** - Serializes and writes `prt.json`
- **`src/util/update-task.ts`** - Immutably updates a task in roadmap, automatically sets `updatedAt`
- **`src/util/validate-task.ts`** - Validates task structure and field values
- **`src/util/validate-task-id.ts`** - Type assertion for TaskID format

### Task Dependencies

Tasks support two dependency relationships stored as arrays of TaskIDs:

- **`depends-on`** - Tasks this task requires to be completed first
- **`blocks`** - Tasks that cannot start until this task completes

The `validate` command checks for circular dependencies and malformed task data.

### TypeScript Configuration

- **Module system**: ES modules (`"type": "module"` in package.json)
- **Module resolution**: Node16
- **Target**: ES2022
- **All imports must include `.js` extension** (even for `.ts` files) due to Node16 module resolution

## Using PRT Commands for Project Management

PRT provides eight commands for managing project roadmaps. Claude can use these commands to manage tasks while working on this project.

### Command Reference

#### 1. `prt init [FOLDER]`

Initialize a new project roadmap in the specified folder (defaults to current directory).

**Flags:**

- `-n, --name <name>` - Project name
- `-d, --description <desc>` - Project description
- `-f, --force` - Overwrite existing files
- `--withSampleTasks` - Include sample tasks in the roadmap

**Example:**

```bash
prt init ./my-project --name "My Project" --description "Project tracking"
```

#### 2. `prt add TITLE`

Add a new task to the roadmap with auto-generated ID.

**Required flags:**

- `-t, --type <type>` - Task type: `bug`, `feature`, `improvement`, `planning`, or `research`
- `-d, --details <details>` - Detailed description of the task

**Optional flags:**

- `-p, --priority <priority>` - Priority: `high`, `medium`, or `low` (default: `medium`)
- `-s, --status <status>` - Status: `not-started`, `in-progress`, or `completed` (default: `not-started`)
- `-g, --tags <tags>` - Comma-separated list of tags

**Example:**

```bash
prt add "User authentication" -t feature -d "Implement JWT authentication" -p high
prt add "Fix login bug" -t bug -d "Users can't log in with spaces in email" -p high -g "auth,critical"
```

#### 3. `prt list`

List tasks with optional filtering and sorting.

**Flags:**

- `-i, --incomplete` - Show only incomplete tasks (not-started or in-progress)
- `-p, --priority <priority>` - Filter by priority: `high`, `medium`, or `low`
- `-s, --status <status>` - Filter by status: `not-started`, `in-progress`, or `completed`
- `-o, --sort <field>` - Sort by field: `createdAt`, `updatedAt`, `priority`, `status`, `title`, `type`

**Examples:**

```bash
prt list
prt list -p high --incomplete
prt list --status=in-progress --sort=createdAt
```

#### 4. `prt show TASK`

Display detailed information about a specific task.

**Arguments:**

- `TASK` - Task ID (e.g., `F-001`, `B-042`)

**Example:**

```bash
prt show F-001
```

#### 5. `prt update TASKID`

Update properties of an existing task.

**Flags:**

- `-s, --status <status>` - Update status: `not-started`, `in-progress`, or `completed`
- `-n, --notes <notes>` - Add or update notes
- `-d, --deps <deps>` - Update dependencies (comma-separated task IDs)
- `-t, --tested <boolean>` - Mark as tested (true/false)
- `--clear-notes` - Clear all notes from the task

**Examples:**

```bash
prt update F-001 --status=in-progress --notes="Started implementation"
prt update F-001 --deps="F-002,F-003"
prt update B-001 --clear-notes
```

#### 6. `prt complete TASKID`

Mark a task as completed.

**Flags:**

- `-t, --tests` - Also mark the task as passing tests

**Examples:**

```bash
prt complete F-001
prt complete F-001 --tests
```

#### 7. `prt pass-test TASKID`

Mark a task as passing tests without changing its status.

**Example:**

```bash
prt pass-test F-001
```

#### 8. `prt validate`

Validate the roadmap structure and check for issues.

Checks for:

- Valid JSON structure
- Required fields on all tasks
- Circular dependencies
- Invalid task references
- Duplicate task IDs

**Example:**

```bash
prt validate
```

### Completing Tasks

- When the user requests to complete a task:
  - Review the requirements of the specific task.
    - `prt show TASKID` can be used to display task details.
  - Ensure all dependencies are completed.
    - Use `prt show TASKID` to check dependencies.
    - If dependencies are not completed, inform the user, and offer to complete one of the dependencies instead.
  - Complete all actions required by the task.
    - This may involve writing code, updating documentation, or other project-related work.
    - Do not mark the task as complete until all work is done.
    - Do not attempt to complete tasks that are outside of the scope of the given task.
  - Run the test suite to verify functionality.
    - `yarn test` should be used for this step.
  - Run the typescript compiler to ensure no type errors.
    - `yarn build` should be used for this step.
  - Run the linter to ensure code quality.
    - `yarn lint` should be used for this step.
    - If there are linting errors, run `yarn lint --fix` to automatically fix issues.
    - If there are still linting errors after auto-fixing, manually fix them.
  - Use the `prt complete TASKID --tests` command to mark the task as completed only after all checks pass and the task is fully implemented.
  - Check that the task is marked as completed and passing tests by using `prt show TASKID`.

## Adding New Commands

1. Create `src/commands/your-command.ts`
2. Extend `Command` from `@oclif/core`
3. Define `static args` and `static flags` as needed
4. Implement `async run()` method
5. **Recommended:** Use the service-based pattern for business logic
   - Import services: `taskService`, `roadmapService`, `taskQueryService`
   - Pattern: read config → use services for business logic → write via services
   - See `src/commands/add.ts` for a complete example
   - **Alternative:** Legacy pattern using direct utility functions is still supported
     - Pattern: read config → read roadmap → mutate → write roadmap
     - Utilities available: `updateTaskInRoadmap()`, `readRoadmapFile()`, `writeRoadmapFile()`
6. Run `yarn build` to compile
7. Run `oclif readme` to auto-update README.md with command documentation

## Testing

Tests use Mocha + Chai and are located in `test/` directory. The test structure mirrors the `src/` directory. Test files must end in `.test.ts`.

## Release Process

### Automated Release (Recommended)

Releases are fully automated via GitHub Actions:

1. Update version in `package.json`
2. Commit and push to `master` branch
3. GitHub Actions automatically:
   - Checks if version already exists (skips if it does)
   - Updates README via `oclif readme` if needed
   - Creates a GitHub release with auto-generated release notes
   - Publishes to npm registry

**Required Setup:**

1. **npm Authentication** (choose one):

   **Option A: Trusted Publishing** (recommended, more secure):
   - Go to https://www.npmjs.com/settings/project-roadmap-tracking/packages/project-roadmap-tracking/access
   - Navigate to "Publishing Access" → Configure "Trusted Publishers"
   - Add GitHub Actions as trusted publisher:
     - Provider: GitHub Actions
     - Repository: ZacharyEggert/project-roadmap-tracking
     - Workflow: .github/workflows/onRelease.yml
     - Environment: (leave blank)
   - No npm token needed! Uses OIDC authentication.

   **Option B: Granular Access Token** (fallback):
   - Go to https://www.npmjs.com/settings/~/tokens
   - Generate new token → Granular Access Token
   - Select packages: project-roadmap-tracking
   - Permissions: Read and write
   - Add as GitHub secret: `NPM_TOKEN`
   - The workflow will automatically use this if Trusted Publishing isn't configured

2. **GitHub Secrets** (required):
   - `GH_TOKEN` - GitHub personal access token with `repo` and `workflow` scopes
   - `GH_EMAIL` - Your git email (from `git config user.email`)
   - `GH_USERNAME` - Your git username (from `git config user.name`)

### Manual Release

If you need to release manually:

1. Update version in `package.json`
2. Run `yarn prepack` (generates manifest and updates README)
3. Commit changes
4. Run `yarn pack` to create tarball
5. Run `npm publish` to publish to npm registry
6. Create GitHub release: `gh release create v{VERSION} --generate-notes`

The `prepack` script automatically runs `oclif manifest` and `oclif readme` to keep generated files in sync.
