# example-prt-plugin

An example oclif plugin for [PRT (Project Roadmap Tracking)](https://github.com/ZacharyEggert/project-roadmap-tracking) that demonstrates how to extend the PRT CLI with custom commands.

This plugin adds a `prt export` command that converts your `prt.json` roadmap into a well-structured, human-readable markdown document.

---

## Features

- ✅ **Export to Markdown**: Convert your roadmap to a formatted `.md` file
- ✅ **Flexible Output**: Export to file or stdout
- ✅ **Rich Formatting**: Includes project metadata, statistics, and organized task lists
- ✅ **Customizable**: Control what sections to include and how tasks are grouped
- ✅ **Dependency Visualization**: Shows task dependencies and blockers
- ✅ **Reusable Service**: Use `MarkdownExporterService` programmatically

---

## Installation

### Install from npm

```bash
prt plugins install example-prt-plugin
```

### Install from GitHub

```bash
prt plugins install ZacharyEggert/example-prt-plugin
```

### Install for Local Development

```bash
# Clone the repository
git clone https://github.com/ZacharyEggert/project-roadmap-tracking.git
cd project-roadmap-tracking/examples/plugins/example-prt-plugin

# Install dependencies
npm install

# Build the plugin
npm run build

# Link the plugin for development
prt plugins link
```

---

## Usage

### Basic Export

Export your roadmap to stdout:

```bash
prt export
```

**Output:**
```markdown
# My Project

A sample project for tracking tasks.

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
...
```

### Export to File

Save the output to a markdown file:

```bash
prt export -o roadmap.md
```

Or specify a full path:

```bash
prt export --output=/path/to/my-roadmap.md
```

### Exclude Completed Tasks

Focus on active work by excluding completed tasks:

```bash
prt export --no-completed
```

### Group by Type Instead of Status

Organize tasks by type (Feature, Bug, etc.) rather than status:

```bash
prt export --group-by=type
```

Available grouping options:
- `status` (default) - Group by Not Started, In Progress, Completed
- `type` - Group by Feature, Bug, Improvement, Planning, Research
- `priority` - Group by High, Medium, Low

### Sort Tasks

Change how tasks are sorted within groups:

```bash
# Sort by creation date (oldest first)
prt export --sort-by=createdAt

# Sort by update date (most recently updated first)
prt export --sort-by=updatedAt

# Sort by priority (default)
prt export --sort-by=priority
```

### Minimal Output

Generate a minimal export without metadata or statistics:

```bash
prt export --minimal
```

This excludes:
- Project metadata section
- Task statistics section

Only the task list is included.

### Combine Options

```bash
# Export incomplete high-priority tasks to a file
prt export -o sprint.md --no-completed --priority=high

# Export all features sorted by date
prt export --group-by=type --sort-by=createdAt -o features.md
```

---

## Command Reference

### `prt export [FILE]`

Export your PRT roadmap to markdown format.

**Arguments:**

- `FILE` (optional) - Output file path. If omitted, outputs to stdout.

**Flags:**

- `-o, --output=<path>` - Output file path (alternative to FILE argument)
- `--no-completed` - Exclude completed tasks from export
- `--no-metadata` - Exclude project metadata section
- `--no-stats` - Exclude task statistics section
- `--minimal` - Exclude both metadata and statistics (equivalent to `--no-metadata --no-stats`)
- `--group-by=<status|type|priority>` - How to group tasks (default: status)
- `--sort-by=<priority|createdAt|updatedAt>` - How to sort tasks within groups (default: priority)
- `--priority=<high|medium|low>` - Filter by priority level
- `--status=<not-started|in-progress|completed>` - Filter by status
- `--type=<bug|feature|improvement|planning|research>` - Filter by task type
- `--help` - Show help for the export command

**Examples:**

```bash
# Basic export to file
prt export roadmap.md

# Export with custom options
prt export -o docs/roadmap.md --group-by=type --no-completed

# Export only high-priority in-progress tasks
prt export --priority=high --status=in-progress

# Minimal export for quick reference
prt export --minimal > tasks.md
```

---

## Markdown Output Format

The exported markdown follows this structure:

```markdown
# Project Name

Project description

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

---

## Configuration

### Plugin Configuration

The plugin uses your existing PRT configuration (`.prtrc.json`). No additional configuration is required.

The plugin will:
1. Locate your `.prtrc.json` file (current directory, parent directories, or home directory)
2. Read the `roadmapPath` to find your `prt.json` file
3. Export the roadmap to markdown

### Customizing Export Defaults

You can create a `.prtrc.json` in your project with export defaults (future feature):

```json
{
  "projectName": "My Project",
  "description": "Project description",
  "version": "1.0.0",
  "roadmapPath": "./prt.json",
  "export": {
    "groupBy": "status",
    "sortBy": "priority",
    "includeCompleted": true,
    "includeMetadata": true,
    "includeStats": true
  }
}
```

---

## Programmatic Usage

You can use the `MarkdownExporterService` directly in your own code:

```typescript
import {MarkdownExporterService} from 'example-prt-plugin'
import roadmapService from 'project-roadmap-tracking/dist/services/roadmap.service.js'

// Load roadmap
const roadmap = await roadmapService.load('./prt.json')

// Create exporter
const exporter = new MarkdownExporterService()

// Export with options
const markdown = exporter.export(roadmap, {
  includeMetadata: true,
  includeStats: true,
  includeCompletedTasks: false,
  groupBy: 'type',
  taskSortBy: 'priority',
})

// Write to file or process further
console.log(markdown)
```

---

## For Plugin Developers

This plugin serves as a reference implementation for building PRT plugins. Key lessons:

### 1. Plugin Structure

```
example-prt-plugin/
├── package.json           # oclif config: bin="prt", commands path
├── src/
│   ├── index.ts          # Export commands
│   ├── commands/
│   │   └── export.ts     # Command implementation
│   └── services/
│       └── markdown-exporter.service.ts  # Business logic
└── test/
    └── ...               # Tests mirror src/ structure
```

### 2. Extending PRT CLI

Set `"bin": "prt"` in `package.json` to extend the PRT CLI:

```json
{
  "oclif": {
    "bin": "prt",
    "dirname": "prt",
    "commands": "./dist/commands"
  }
}
```

### 3. Using PRT Services

Import and reuse PRT's service layer:

```typescript
import roadmapService from 'project-roadmap-tracking/dist/services/roadmap.service.js'
import taskQueryService from 'project-roadmap-tracking/dist/services/task-query.service.js'
import {readConfigFile} from 'project-roadmap-tracking/dist/util/read-config.js'
import {Roadmap, Task, PRIORITY, STATUS} from 'project-roadmap-tracking/dist/util/types.js'
```

### 4. Declare Peer Dependencies

```json
{
  "peerDependencies": {
    "@oclif/core": "^4.0.0",
    "project-roadmap-tracking": "^0.2.0"
  }
}
```

### 5. Service-Based Design

Separate business logic from I/O:

```typescript
// Good: Service is pure, testable
export class MarkdownExporterService {
  export(roadmap: Roadmap): string {
    // Pure transformation logic
  }
}

// Command handles I/O
export default class Export extends Command {
  async run(): Promise<void> {
    const roadmap = await roadmapService.load(path)
    const exporter = new MarkdownExporterService()
    const markdown = exporter.export(roadmap)
    await this.writeFile(output, markdown)
  }
}
```

### 6. Testing

- Unit test services with fixture data
- Integration test commands with temp directories
- Use PRT's test helpers for creating mock roadmaps

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed implementation guidance.

---

## Contributing

Contributions are welcome! This plugin is part of the [PRT project](https://github.com/ZacharyEggert/project-roadmap-tracking).

**Development workflow:**

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Link for testing
prt plugins link

# Test your changes
prt export --help
prt export
```

**Before submitting a PR:**

1. Run tests: `npm test`
2. Run linter: `npm run lint`
3. Build successfully: `npm run build`
4. Update documentation if adding features

---

## License

MIT License - see [LICENSE](../../../LICENSE) for details.

---

## Related Documentation

- [PRT Main Documentation](../../../README.md)
- [PRT Architecture](../../../ARCHITECTURE.md)
- [Plugin Architecture](./ARCHITECTURE.md)
- [oclif Plugin Development](https://oclif.io/docs/plugins)

---

## Support

- **Issues**: [GitHub Issues](https://github.com/ZacharyEggert/project-roadmap-tracking/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ZacharyEggert/project-roadmap-tracking/discussions)
- **Documentation**: [PRT Docs](https://github.com/ZacharyEggert/project-roadmap-tracking)

---

**Version:** 1.0.0
**Author:** PRT Contributors
**Repository:** [project-roadmap-tracking](https://github.com/ZacharyEggert/project-roadmap-tracking)
