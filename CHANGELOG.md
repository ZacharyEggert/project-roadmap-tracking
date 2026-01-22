# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-01-22

### Added
- **Repository Pattern**: Implemented `RoadmapRepository` with LRU caching and file watching (chokidar)
- **Config Repository**: Multi-level config inheritance (project → user → global) with JSON schema validation
- **Error Handling**: Complete custom error hierarchy with error codes (`PrtError`, `ConfigNotFoundError`, `TaskNotFoundError`, etc.)
- **Error Handler Service**: Unified error handling with verbose mode for stack traces
- **Service Layer**: Six comprehensive services for business logic separation
  - `task.service.ts` - Task lifecycle management
  - `task-query.service.ts` - Task filtering and sorting
  - `roadmap.service.ts` - Roadmap I/O and validation
  - `task-dependency.service.ts` - Dependency graph and validation
  - `display.service.ts` - Output formatting
  - `error-handler.service.ts` - Unified error handling
- **Performance**: LRU cache with configurable size and automatic mtime-based invalidation
- **File Watching**: Automatic cache invalidation on external file changes
- **Backward Compatibility**: `--no-repo` flag on all commands for legacy direct file I/O

### Changed
- All commands now use repository pattern by default (with `--no-repo` fallback)
- Enhanced architecture with proper layering (CLI → Services → Repositories → Data)
- Improved error messages with context and error codes
- Updated documentation (README.md and ARCHITECTURE.md) to reflect current state

### Improved
- **Test Coverage**: Achieved 98.78% code coverage across all layers
  - Services: 99.89%
  - Repositories: 96.06%
  - Commands: 97.44%
  - Errors: 100%
  - Utilities: 100%
- Performance optimization for large roadmaps through caching
- Type safety with comprehensive error handling
- Documentation quality and completeness

### Technical Debt Resolved
- Migrated from direct file I/O to repository pattern
- Extracted business logic from commands into services
- Implemented proper error hierarchy
- Added comprehensive test suite

## [0.1.0] - 2025-01-15

### Added
- Initial release of project-roadmap-tracking CLI
- `init` command to initialize a new project roadmap
- `add` command to add new tasks to the roadmap
- `list` command to list tasks with filtering and sorting options
- `show` command to display details of a specific task
- `complete` command to mark tasks as completed
- `pass-test` command to mark tasks as passing tests
- `update` command to update task properties (status, notes, dependencies, test status)
- `validate` command to validate roadmap JSON structure
- Support for task types: bug, feature, improvement, planning, research
- Support for priority levels: high, medium, low
- Support for task status: not-started, in-progress, completed
- Task dependencies and blocking relationships
- Task tagging system
- Test status tracking (passes-tests)

### Features
- CLI-based task management for project tracking
- JSON-based roadmap storage
- Configuration file support (.prtrc.json)
- Comprehensive help system with command documentation
- Full TypeScript support with type safety
