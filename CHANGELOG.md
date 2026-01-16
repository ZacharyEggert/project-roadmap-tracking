# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
