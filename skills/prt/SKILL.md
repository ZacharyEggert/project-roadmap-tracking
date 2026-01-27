---
name: prt
description: This skill should be used when the user asks to "manage project tasks", "track roadmap", "add a task", "list tasks", "complete a task", "update task status", "show task details", "validate roadmap", "initialize roadmap", or uses the prt CLI tool. Provides comprehensive guidance for using the Project Roadmap Tracking CLI.
version: 1.0.0
allowed-tools: Bash, Read
---

# Project Roadmap Tracking (PRT) CLI

PRT is an oclif-based CLI tool for managing project tasks in a structured JSON format (`prt.json`). It enables teams to track features, bugs, improvements, planning tasks, and research items with dependencies, priorities, and testing status.

## Quick Reference

| Command | Description |
|---------|-------------|
| `prt init [FOLDER]` | Initialize a new project roadmap |
| `prt add TITLE` | Add a new task (auto-generates ID) |
| `prt list` | List tasks with optional filtering/sorting |
| `prt show TASK` | Display detailed task information |
| `prt update TASKID` | Update task properties |
| `prt complete TASKID` | Mark a task as completed |
| `prt pass-test TASKID` | Mark task as passing tests |
| `prt validate` | Validate roadmap structure |

---

## Core Enums

### PRIORITY
| Value | Description |
|-------|-------------|
| `high` | High priority task |
| `medium` | Medium priority task (default) |
| `low` | Low priority task |

**Shortcuts in `prt list`:** `h` = high, `m` = medium, `l` = low

### STATUS
| Value | Description |
|-------|-------------|
| `not-started` | Task has not been started (default) |
| `in-progress` | Task is currently being worked on |
| `completed` | Task has been completed |

### TASK_TYPE
| Value | Letter | Description |
|-------|--------|-------------|
| `bug` | B | Bug fix |
| `feature` | F | New feature |
| `improvement` | I | Enhancement to existing functionality |
| `planning` | P | Planning or organizational task |
| `research` | R | Research or investigation task |

### Task ID Format
Format: `{TYPE_LETTER}-{NUMBER}`
- TYPE_LETTER: B, F, I, P, or R
- NUMBER: Zero-padded 3-digit number (001-999)
- Examples: `F-001`, `B-042`, `P-003`, `I-025`, `R-100`

IDs are auto-generated sequentially per task type by the `add` command.

---

## Commands

### `prt init [FOLDER]`
Initialize a new project roadmap in the specified folder.

**Arguments:**
- `folder` (optional): Directory to initialize in (default: current directory)

**Flags:**
| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--name` | `-n` | string | "My Project Roadmap" | Project name |
| `--description` | `-d` | string | "A project roadmap managed by Project Roadmap Tracking" | Project description |
| `--force` | `-f` | boolean | false | Overwrite existing files |
| `--withSampleTasks` | | boolean | false | Include sample tasks |

**Examples:**
```bash
prt init ./my-project --name "My Project" --description "Project tracking"
prt init --force --withSampleTasks
```

---

### `prt add TITLE`
Add a new task to the roadmap with auto-generated ID.

**Arguments:**
- `title` (required): Title of the task

**Flags:**
| Flag | Short | Type | Default | Required | Options |
|------|-------|------|---------|----------|---------|
| `--type` | `-t` | string | | Yes | bug, feature, improvement, planning, research |
| `--details` | `-d` | string | | Yes | Task description |
| `--priority` | `-p` | string | medium | No | high, medium, low |
| `--status` | `-s` | string | not-started | No | not-started, in-progress, completed |
| `--tags` | `-g` | string | | No | Comma-separated tags |

**Examples:**
```bash
prt add "User authentication" -t feature -d "Implement JWT authentication" -p high
prt add "Fix login bug" -t bug -d "Users can't log in with spaces in email" -p high -g "auth,critical"
prt add "Database schema design" -t planning -d "Design the initial database schema" -p medium
```

---

### `prt list`
List tasks with optional filtering and sorting.

**Flags:**
| Flag | Short | Type | Options | Description |
|------|-------|------|---------|-------------|
| `--incomplete` | `-i` | boolean | | Show only incomplete tasks (not-started or in-progress) |
| `--priority` | `-p` | string | high, medium, low, h, m, l | Filter by priority |
| `--status` | `-s` | string | completed, in-progress, not-started | Filter by status |
| `--sort` | `-o` | string | dueDate, priority, createdAt | Sort tasks by field |

**Examples:**
```bash
prt list
prt list -p high --incomplete
prt list --status=in-progress --sort=createdAt
prt list -p h -i  # Using priority shortcut
```

---

### `prt show TASK`
Display detailed information about a specific task.

**Arguments:**
- `task` (required): Task ID (e.g., F-001, B-042)

**Flags:**
| Flag | Short | Type | Description |
|------|-------|------|-------------|
| `--show-dependencies` | `-d` | boolean | Show task dependencies (one level deep) |

**Examples:**
```bash
prt show F-001
prt show B-042 --show-dependencies
```

---

### `prt update TASKID`
Update properties of an existing task.

**Arguments:**
- `taskID` (required): Task ID to update

**Flags:**
| Flag | Short | Type | Options | Description |
|------|-------|------|---------|-------------|
| `--status` | `-s` | string | completed, in-progress, not-started | Update status |
| `--notes` | `-n` | string | | Add/append notes |
| `--clear-notes` | | boolean | | Clear all notes |
| `--deps` | `-d` | string | | Comma-separated dependency task IDs |
| `--tested` | `-t` | string | true, false | Mark as tested |
| `--type` | | string | bug, feature, improvement, planning, research | Change task type (reassigns ID) |

**Examples:**
```bash
prt update F-001 --status=in-progress --notes="Started implementation"
prt update F-001 --deps="F-002,F-003"
prt update B-001 --clear-notes
prt update F-001 --tested=true
prt update B-001 --type=improvement  # Changes ID from B-001 to I-XXX
```

---

### `prt complete TASKID`
Mark a task as completed.

**Arguments:**
- `taskID` (required): Task ID to complete

**Flags:**
| Flag | Short | Type | Description |
|------|-------|------|-------------|
| `--tests` | `-t` | boolean | Also mark as passing tests |

**Examples:**
```bash
prt complete F-001
prt complete F-001 --tests
```

---

### `prt pass-test TASKID`
Mark a task as passing tests without changing its status.

**Arguments:**
- `taskID` (required): Task ID

**Examples:**
```bash
prt pass-test F-001
```

---

### `prt validate`
Validate the roadmap structure and check for issues.

**Checks performed:**
- Valid JSON structure
- Required fields on all tasks
- Circular dependencies
- Invalid task references
- Duplicate task IDs

**Examples:**
```bash
prt validate
```

---

## Global Flags

All commands support these flags:

| Flag | Short | Type | Description |
|------|-------|------|-------------|
| `--verbose` | `-v` | boolean | Show detailed error information |
| `--no-repo` | | boolean | Use legacy file I/O instead of repository pattern |

---

## Task Dependencies

Tasks support two dependency relationships stored as arrays of TaskIDs:

- **`depends-on`**: Tasks this task requires to be completed first
- **`blocks`**: Tasks that cannot start until this task completes

Use `prt update TASKID --deps="F-002,F-003"` to set dependencies.

---

## Common Workflows

### Initialize and add first tasks
```bash
prt init --name "My Project"
prt add "Setup project structure" -t planning -d "Create initial folder structure" -p high
prt add "Implement core API" -t feature -d "Build the REST API endpoints" -p high
```

### Track progress on a task
```bash
prt update F-001 --status=in-progress --notes="Started working on this"
prt update F-001 --notes="50% complete, API endpoints done"
prt complete F-001 --tests
```

### View high priority incomplete tasks
```bash
prt list -p high -i
```

### Check task details and dependencies
```bash
prt show F-001 -d
```

### Validate before committing
```bash
prt validate
```

---

## File Structure

PRT uses two JSON files:

1. **`.prtrc.json`** - Configuration file with project metadata and path to roadmap
2. **`prt.json`** - Roadmap file containing all tasks and project data

---

## Task Data Structure

Each task contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | TaskID | Auto-generated ID (e.g., F-001) |
| `title` | string | Task title |
| `details` | string | Task description |
| `type` | TASK_TYPE | bug, feature, improvement, planning, research |
| `priority` | PRIORITY | high, medium, low |
| `status` | STATUS | not-started, in-progress, completed |
| `tags` | string[] | Array of tags |
| `depends-on` | TaskID[] | Dependencies |
| `blocks` | TaskID[] | Tasks this blocks |
| `passes-tests` | boolean | Whether task passes tests |
| `notes` | string | Additional notes |
| `createdAt` | string | Creation timestamp |
| `updatedAt` | string | Last update timestamp |
| `dueDate` | string | Optional due date |
| `assignedTo` | string | Optional assignee |
| `effort` | number | Optional effort estimate |
| `github-refs` | string[] | Optional GitHub references |
