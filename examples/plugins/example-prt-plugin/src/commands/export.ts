import {Command, Flags} from '@oclif/core'
import {writeFile} from 'node:fs/promises'
import {getDefaultConfigRepository} from 'project-roadmap-tracking/dist/repositories/config.repository.js'
import {RoadmapRepository} from 'project-roadmap-tracking/dist/repositories/roadmap.repository.js'
import errorHandlerService from 'project-roadmap-tracking/dist/services/error-handler.service.js'
import taskQueryService, {
  FilterCriteria,
} from 'project-roadmap-tracking/dist/services/task-query.service.js'
import {readConfigFile} from 'project-roadmap-tracking/dist/util/read-config.js'
import {readRoadmapFile} from 'project-roadmap-tracking/dist/util/read-roadmap.js'
import {PRIORITY, STATUS, TASK_TYPE} from 'project-roadmap-tracking/dist/util/types.js'

import markdownExporterService, {MarkdownExportOptions} from '../services/markdown-exporter.service.js'

export default class Export extends Command {
  static override description = 'export roadmap to markdown format'
static override examples = [
    '<%= config.bin %> <%= command.id %> --output roadmap.md',
    '<%= config.bin %> <%= command.id %> --minimal --no-completed',
    '<%= config.bin %> <%= command.id %> --group-by type --sort-by priority',
    '<%= config.bin %> <%= command.id %> --status in-progress --priority high',
  ]
static override flags = {
    // Grouping and sorting
    'group-by': Flags.string({
      default: 'status',
      description: 'group tasks by field',
      options: ['status', 'type', 'priority'],
    }),

    // Format options
    minimal: Flags.boolean({
      default: false,
      description: 'use minimal compact format (single-line tasks, no metadata/stats)',
    }),

    // Filter options
    'no-completed': Flags.boolean({
      default: false,
      description: 'exclude completed tasks from export',
    }),

    // Standard flags
    'no-repo': Flags.boolean({
      default: false,
      description: 'use legacy direct file I/O instead of repository pattern',
    }),

    // Output options
    output: Flags.string({
      char: 'o',
      description: 'output file path (if not specified, outputs to stdout)',
      required: false,
    }),

    priority: Flags.string({
      char: 'p',
      description: 'filter tasks by priority',
      options: ['high', 'medium', 'low', 'h', 'm', 'l'],
    }),

    'sort-by': Flags.string({
      default: 'priority',
      description: 'sort tasks within groups by field',
      options: ['priority', 'status', 'type', 'createdAt', 'updatedAt'],
    }),

    status: Flags.string({
      char: 's',
      description: 'filter tasks by status (can be used multiple times)',
      multiple: true,
      options: ['completed', 'in-progress', 'not-started'],
    }),

    tags: Flags.string({
      char: 'g',
      description: 'filter tasks by tags (comma-separated)',
    }),

    type: Flags.string({
      char: 't',
      description: 'filter tasks by type',
      options: ['bug', 'feature', 'improvement', 'planning', 'research'],
    }),

    verbose: Flags.boolean({
      char: 'v',
      default: false,
      description: 'show detailed error information including stack traces',
    }),
  }
// Priority mapping (same as list command)
  private static readonly priorityMap: Record<string, PRIORITY> = {
    h: PRIORITY.High,
    high: PRIORITY.High,
    l: PRIORITY.Low,
    low: PRIORITY.Low,
    m: PRIORITY.Medium,
    medium: PRIORITY.Medium,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Export)

    try {
      // 1. LOAD CONFIG AND ROADMAP
      // Use repository pattern by default, unless --no-repo flag is set
      const config = flags['no-repo']
        ? await readConfigFile()
        : await getDefaultConfigRepository().load()

      const roadmapPath = config.path

      const roadmap = flags['no-repo']
        ? await readRoadmapFile(roadmapPath)
        : await RoadmapRepository.fromConfig(config).load(roadmapPath)

      // 2. BUILD FILTER CRITERIA
      const filterCriteria: Partial<FilterCriteria> = {}

      // Status filter
      if (flags.status && flags.status.length > 0) {
        filterCriteria.status = flags.status as STATUS[]
      } else if (flags['no-completed']) {
        filterCriteria.status = [STATUS.NotStarted, STATUS.InProgress]
      }

      // Priority filter
      if (flags.priority) {
        const priorityValue = Export.priorityMap[flags.priority]
        if (priorityValue) {
          filterCriteria.priority = priorityValue
        }
      }

      // Type filter
      if (flags.type) {
        filterCriteria.type = flags.type as TASK_TYPE
      }

      // Tags filter
      if (flags.tags) {
        filterCriteria.tags = flags.tags.split(',').map((tag) => tag.trim())
      }

      // 3. APPLY FILTERS
      const hasFilters = Object.keys(filterCriteria).length > 0
      const filteredTasks = hasFilters
        ? // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
          taskQueryService.filter(roadmap.tasks, filterCriteria)
        : roadmap.tasks

      // Create filtered roadmap for export
      const filteredRoadmap = {
        ...roadmap,
        tasks: filteredTasks,
      }

      // 4. BUILD EXPORT OPTIONS
      const exportOptions: MarkdownExportOptions = {
        groupBy: flags['group-by'] as 'priority' | 'status' | 'type',
        includeCompletedTasks: !flags['no-completed'], // Will be handled by pre-filtering
        minimal: flags.minimal,
        taskSortBy: flags['sort-by'] as 'createdAt' | 'priority' | 'status' | 'type' | 'updatedAt',
      }

      // 5. GENERATE MARKDOWN
      const markdown = markdownExporterService.export(filteredRoadmap, exportOptions)

      // 6. OUTPUT
      if (flags.output) {
        // Write to file
        await writeFile(flags.output, markdown, 'utf8')
        this.log(`Exported roadmap to ${flags.output}`)
      } else {
        // Output to stdout
        console.log(markdown)
      }
    } catch (error) {
      const exitCode = errorHandlerService.handleError(error)
      this.error(errorHandlerService.formatErrorMessage(error, flags.verbose), {exit: exitCode})
    }
  }
}
