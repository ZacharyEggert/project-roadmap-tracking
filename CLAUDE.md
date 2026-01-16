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

All commands extend `@oclif/core`'s `Command` class and follow this pattern:

1. **Parse flags/args** using `this.parse()`
2. **Read config** via `readConfigFile()` from `src/util/read-config.ts`
3. **Read roadmap** via `readRoadmapFile()` from `src/util/read-roadmap.ts`
4. **Mutate data** as needed
5. **Write roadmap** via `writeRoadmapFile()` from `src/util/write-roadmap.ts`

Commands are located in `src/commands/` and automatically discovered by oclif.

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

## Adding New Commands

1. Create `src/commands/your-command.ts`
2. Extend `Command` from `@oclif/core`
3. Define `static args` and `static flags` as needed
4. Implement `async run()` method
5. Use the standard pattern: read config → read roadmap → mutate → write roadmap
6. For task mutations, use `updateTaskInRoadmap()` utility
7. Run `yarn build` to compile
8. Run `oclif readme` to auto-update README.md with command documentation

## Testing

Tests use Mocha + Chai and are located in `test/` directory. The test structure mirrors the `src/` directory. Test files must end in `.test.ts`.

## Release Process

1. Update version in `package.json`
2. Run `yarn prepack` (generates manifest and updates README)
3. Commit changes
4. Run `yarn pack` to create tarball
5. Run `npm publish` to publish to npm registry

The `prepack` script automatically runs `oclif manifest` and `oclif readme` to keep generated files in sync.
