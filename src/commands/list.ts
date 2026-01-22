import {/* Args, */ Command, Flags} from '@oclif/core'

import displayService from '../services/display.service.js'
import errorHandlerService from '../services/error-handler.service.js'
import taskQueryService, {FilterCriteria, SortOrder} from '../services/task-query.service.js'
import {readConfigFile} from '../util/read-config.js'
import {readRoadmapFile} from '../util/read-roadmap.js'
import {PRIORITY, STATUS} from '../util/types.js'

export default class List extends Command {
  static override args = {
    // file: Args.string({description: 'file to read'}),
  }
  static override description = 'list tasks in the project roadmap'
  static override examples = ['<%= config.bin %> <%= command.id %> -p=h --incomplete --sort=createdAt']
  static override flags = {
    // flag with no value (-f, --force)
    // force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    // name: Flags.string({char: 'n', description: 'name to print'}),
    incomplete: Flags.boolean({char: 'i', description: 'filter tasks to show in-progress and not-started only'}),
    priority: Flags.string({
      char: 'p',
      description: 'filter tasks by priority (high, medium, low)',
      options: ['high', 'medium', 'low', 'h', 'm', 'l'],
    }),
    sort: Flags.string({
      char: 'o',
      description: 'sort tasks by field (dueDate, priority, createdAt)',
      options: ['dueDate', 'priority', 'createdAt'],
    }),
    status: Flags.string({
      char: 's',
      description: 'filter tasks by status (completed, in-progress, not-started)',
      options: ['completed', 'in-progress', 'not-started'],
    }),
    verbose: Flags.boolean({
      char: 'v',
      default: false,
      description: 'show detailed error information including stack traces',
    }),
  }
  private static readonly priorityMap: Record<string, PRIORITY> = {
    h: PRIORITY.High,
    high: PRIORITY.High,
    l: PRIORITY.Low,
    low: PRIORITY.Low,
    m: PRIORITY.Medium,
    medium: PRIORITY.Medium,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(List)

    try {
      const incompleteOnly = flags.incomplete ?? false
      const priority = (flags.priority ?? null) as 'h' | 'high' | 'l' | 'low' | 'm' | 'medium' | null
      const sortBy = (flags.sort ?? null) as 'createdAt' | 'dueDate' | 'priority' | null
      const statusFilter = (flags.status ?? null) as null | STATUS

      const priorityFilter = (priority ? List.priorityMap[priority] : null) as null | PRIORITY

      // if statusFilter is set, it overrides incompleteOnly
      const effectiveStatusFilter: STATUS[] = statusFilter
        ? [statusFilter]
        : incompleteOnly
          ? (['in-progress', 'not-started'] as STATUS[])
          : (['completed', 'in-progress', 'not-started'] as STATUS[])

      const config = await readConfigFile()

      const roadmapPath = config.path

      const roadmap = await readRoadmapFile(roadmapPath)

      // Build filter criteria
      const filterCriteria: Partial<FilterCriteria> = {}

      if (effectiveStatusFilter.length > 0) {
        filterCriteria.status =
          effectiveStatusFilter.length === 3
            ? undefined // All statuses, no filter needed
            : effectiveStatusFilter
      }

      if (priorityFilter) {
        filterCriteria.priority = priorityFilter
      }

      // Apply filtering and sorting using TaskQueryService
      const hasFilters = Object.keys(filterCriteria).length > 0
      const filtered = hasFilters
        ? // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
          taskQueryService.filter(roadmap.tasks, filterCriteria)
        : roadmap.tasks

      const tasks = sortBy ? taskQueryService.sort(filtered, sortBy, SortOrder.Ascending) : filtered

      // Display using DisplayService
      const lines = displayService.formatTaskList(tasks)
      for (const line of lines) {
        console.log(line)
      }
    } catch (error) {
      const exitCode = errorHandlerService.handleError(error)
      this.error(errorHandlerService.formatErrorMessage(error, flags.verbose), {exit: exitCode})
    }
  }
}
