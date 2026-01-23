# project-roadmap-tracking

A modern, production-ready CLI tool for managing project tasks and roadmaps with advanced features like dependency tracking, validation, and comprehensive test coverage.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/project-roadmap-tracking.svg)](https://npmjs.org/package/project-roadmap-tracking)
[![Downloads/week](https://img.shields.io/npm/dw/project-roadmap-tracking.svg)](https://npmjs.org/package/project-roadmap-tracking)

## Features

- 📝 **Task Management**: Create, update, and track bugs, features, improvements, planning tasks, and research items
- 🔗 **Dependency Tracking**: Define task dependencies and detect circular dependencies
- 🎯 **Priority & Status**: Organize tasks by priority (high/medium/low) and status (not-started/in-progress/completed)
- ✅ **Test Tracking**: Mark tasks as passing tests to maintain quality
- 🔍 **Powerful Filtering**: Filter and sort tasks by multiple criteria
- 📊 **Validation**: Comprehensive roadmap validation with detailed error reporting
- ⚡ **Performance**: LRU caching and file watching for optimal performance
- 🏗️ **Modern Architecture**: Service layer, repository pattern, and 96.81% test coverage
- 📦 **Configuration**: Multi-level config inheritance (project → user → global)
- 🔄 **Backward Compatible**: Legacy mode via `--no-repo` flag

## Quick Start

### Installation

```bash
npm install -g project-roadmap-tracking
```

### Initialize a Project

```bash
# Initialize with sample tasks
prt init --name "My Project" --withSampleTasks

# Or create an empty roadmap
prt init --name "My Project"
```

### Basic Usage

```bash
# Add a new feature
prt add "User authentication" -t feature -d "Implement JWT auth" -p high

# List all high-priority tasks
prt list -p high

# Show task details
prt show F-001

# Update task status
prt update F-001 --status=in-progress

# Complete a task
prt complete F-001 --tests

# Validate roadmap integrity
prt validate
```

## Architecture

PRT follows a modern layered architecture:

- **CLI Layer**: Thin command handlers using oclif
- **Service Layer**: Business logic (TaskService, RoadmapService, etc.)
- **Repository Layer**: Data access with caching and file watching
- **Error Handling**: Custom error hierarchy with error codes

For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Data Format

PRT uses two JSON files to manage your project:

### `.prtrc.json` (Configuration)
Project configuration with optional caching settings:

```json
{
  "$schema": "https://raw.githubusercontent.com/ZacharyEggert/project-roadmap-tracking/master/schemas/config/v1.1.json",
  "name": "My Project",
  "description": "Project description",
  "path": "./prt.json",
  "cache": {
    "enabled": true,
    "maxSize": 10
  }
}
```

### `prt.json` (Roadmap)
Your tasks and project data:

```json
{
  "$schema": "https://raw.githubusercontent.com/ZacharyEggert/project-roadmap-tracking/master/schemas/roadmap/v1.json",
  "metadata": {
    "name": "My Project",
    "createdAt": "2026-01-22T10:00:00.000Z"
  },
  "tasks": [
    {
      "id": "F-001",
      "title": "User authentication",
      "type": "feature",
      "status": "in-progress",
      "priority": "high",
      "details": "Implement JWT authentication",
      "tags": ["auth", "security"],
      "depends-on": [],
      "blocks": [],
      "passes-tests": false,
      "createdAt": "2026-01-22T10:00:00.000Z",
      "updatedAt": "2026-01-22T10:00:00.000Z"
    }
  ]
}
```

### Task ID Format

Task IDs follow the pattern `{TYPE}-{NUMBER}`:
- **B-001**: Bug
- **F-001**: Feature
- **I-001**: Improvement
- **P-001**: Planning
- **R-001**: Research

IDs are auto-generated sequentially per task type.

<!-- toc -->
* [project-roadmap-tracking](#project-roadmap-tracking)
* [Initialize with sample tasks](#initialize-with-sample-tasks)
* [Or create an empty roadmap](#or-create-an-empty-roadmap)
* [Add a new feature](#add-a-new-feature)
* [List all high-priority tasks](#list-all-high-priority-tasks)
* [Show task details](#show-task-details)
* [Update task status](#update-task-status)
* [Complete a task](#complete-a-task)
* [Validate roadmap integrity](#validate-roadmap-integrity)
* [Usage](#usage)
* [Commands](#commands)
* [Clone the repository](#clone-the-repository)
* [Install dependencies](#install-dependencies)
* [Build the project](#build-the-project)
* [Run tests](#run-tests)
* [Run tests with coverage](#run-tests-with-coverage)
* [Run linter](#run-linter)
* [Auto-fix linting issues](#auto-fix-linting-issues)
* [Format code](#format-code)
* [Run CLI locally without installing](#run-cli-locally-without-installing)
* [Link for global development testing](#link-for-global-development-testing)
* [Run all tests](#run-all-tests)
* [Run a specific test file](#run-a-specific-test-file)
* [Generate coverage report](#generate-coverage-report)
* [View coverage summary](#view-coverage-summary)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g project-roadmap-tracking
$ prt COMMAND
running command...
$ prt (--version)
project-roadmap-tracking/0.2.3 linux-x64 node-v20.20.0
$ prt --help [COMMAND]
USAGE
  $ prt COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`prt help [COMMAND]`](#prt-help-command)
* [`prt plugins`](#prt-plugins)
* [`prt plugins add PLUGIN`](#prt-plugins-add-plugin)
* [`prt plugins:inspect PLUGIN...`](#prt-pluginsinspect-plugin)
* [`prt plugins install PLUGIN`](#prt-plugins-install-plugin)
* [`prt plugins link PATH`](#prt-plugins-link-path)
* [`prt plugins remove [PLUGIN]`](#prt-plugins-remove-plugin)
* [`prt plugins reset`](#prt-plugins-reset)
* [`prt plugins uninstall [PLUGIN]`](#prt-plugins-uninstall-plugin)
* [`prt plugins unlink [PLUGIN]`](#prt-plugins-unlink-plugin)
* [`prt plugins update`](#prt-plugins-update)

## `prt help [COMMAND]`

Display help for prt.

```
USAGE
  $ prt help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for prt.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.36/src/commands/help.ts)_

## `prt plugins`

List installed plugins.

```
USAGE
  $ prt plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ prt plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/index.ts)_

## `prt plugins add PLUGIN`

Installs a plugin into prt.

```
USAGE
  $ prt plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into prt.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the PRT_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the PRT_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ prt plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ prt plugins add myplugin

  Install a plugin from a github url.

    $ prt plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ prt plugins add someuser/someplugin
```

## `prt plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ prt plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ prt plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/inspect.ts)_

## `prt plugins install PLUGIN`

Installs a plugin into prt.

```
USAGE
  $ prt plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into prt.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the PRT_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the PRT_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ prt plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ prt plugins install myplugin

  Install a plugin from a github url.

    $ prt plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ prt plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/install.ts)_

## `prt plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ prt plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ prt plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/link.ts)_

## `prt plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ prt plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ prt plugins unlink
  $ prt plugins remove

EXAMPLES
  $ prt plugins remove myplugin
```

## `prt plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ prt plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/reset.ts)_

## `prt plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ prt plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ prt plugins unlink
  $ prt plugins remove

EXAMPLES
  $ prt plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/uninstall.ts)_

## `prt plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ prt plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ prt plugins unlink
  $ prt plugins remove

EXAMPLES
  $ prt plugins unlink myplugin
```

## `prt plugins update`

Update installed plugins.

```
USAGE
  $ prt plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/update.ts)_
<!-- commandsstop -->

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/ZacharyEggert/project-roadmap-tracking.git
cd project-roadmap-tracking

# Install dependencies
yarn install

# Build the project
yarn build
```

### Development Commands

```bash
# Run tests
yarn test

# Run tests with coverage
yarn test:coverage:summary

# Run linter
yarn lint

# Auto-fix linting issues
yarn lint:fix

# Format code
yarn format

# Run CLI locally without installing
./bin/dev.js COMMAND

# Link for global development testing
yarn link
prt COMMAND
```

### Testing

PRT has comprehensive test coverage (96.81%):

- **Unit tests**: Services, repositories, utilities, errors
- **Command tests**: All CLI commands
- **Test runner**: Mocha + Chai
- **Coverage**: c8

```bash
# Run all tests
yarn test

# Run a specific test file
yarn mocha --loader=tsx/esm "test/path/to/file.test.ts"

# Generate coverage report
yarn test:coverage

# View coverage summary
yarn test:coverage:summary
```

### Architecture

For detailed architecture documentation, including design patterns, service layer architecture, repository pattern, and migration path, see [ARCHITECTURE.md](ARCHITECTURE.md).

Key architectural features:
- ✓ Service layer for business logic (97.43% coverage)
- ✓ Repository pattern with caching and file watching (94.7% coverage)
- ✓ Custom error hierarchy with error codes (100% coverage)
- ✓ Comprehensive test suite (96.81% overall coverage)
- ✓ Backward compatible legacy mode

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

### Release Process

1. Update version in `package.json`
2. Run `yarn prepack` (generates manifest and updates README)
3. Commit changes
4. Run `yarn pack` to create tarball
5. Run `npm publish` to publish to npm registry

## License

MIT

## Links

- [GitHub Repository](https://github.com/ZacharyEggert/project-roadmap-tracking)
- [npm Package](https://www.npmjs.com/package/project-roadmap-tracking)
- [Issues](https://github.com/ZacharyEggert/project-roadmap-tracking/issues)
- [Architecture Documentation](ARCHITECTURE.md)
- [Contributing Guidelines](CONTRIBUTING.md)
