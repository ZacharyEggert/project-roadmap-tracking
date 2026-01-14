import {/* Args, */ Command, Flags} from '@oclif/core'

import {readConfigFile} from '../util/read-config.js'
import {readRoadmapFile} from '../util/read-roadmap.js'
import {STATUS} from '../util/types.js'

export default class List extends Command {
  static override args = {
    // file: Args.string({description: 'file to read'}),
  }
  static override description = 'describe the command here'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    // flag with no value (-f, --force)
    // force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    // name: Flags.string({char: 'n', description: 'name to print'}),
    incomplete: Flags.boolean({char: 'i', description: 'filter tasks to show in-progress and not-started only'}),
    priority: Flags.string({
      char: 'p',
      description: 'filter tasks by priority (high, medium, low)',
      options: ['high', 'medium', 'low'],
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
      type: 'option',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(List)

    const incompleteOnly = flags.incomplete ?? false
    const priorityFilter = (flags.priority ?? null) as 'high' | 'low' | 'medium' | null
    const sortBy = (flags.sort ?? null) as 'createdAt' | 'dueDate' | 'priority' | null
    const statusFilter = (flags.status ?? null) as null | STATUS

    // if statusFilter is set, it overrides incompleteOnly
    const effectiveStatusFilter: STATUS[] = statusFilter
      ? [statusFilter]
      : incompleteOnly
        ? (['in-progress', 'not-started'] as STATUS[])
        : (['completed', 'in-progress', 'not-started'] as STATUS[])

    const config = await readConfigFile()

    const roadmapPath = config.path

    const roadmap = await readRoadmapFile(roadmapPath)

    const tasks = roadmap.tasks
      .filter((task) => effectiveStatusFilter.includes(task.status))
      .filter((task) => priorityFilter === null || task.priority === priorityFilter)
      .sort((a, b) => {
        if (sortBy === 'dueDate') {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          return dateA - dateB
        }

        if (sortBy === 'priority') {
          const priorityOrder = {
            high: 1,
            low: 3,
            medium: 2,
          }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }

        if (sortBy === 'createdAt') {
          const createdA = a.createdAt ? new Date(a.createdAt).getTime() : Infinity
          const createdB = b.createdAt ? new Date(b.createdAt).getTime() : Infinity
          return createdA - createdB
        }

        return 0
      })

    // Display
    console.log(`\nTasks (${tasks.length} total):\n`)
    for (const task of tasks) {
      const status = task.status === STATUS.Completed ? '✓' : task.status === STATUS.InProgress ? '~' : '○'
      const tests = task['passes-tests'] ? '✓' : '✗'
      const prioritySymbol = {
        high: 'H',
        low: 'L',
        medium: 'M',
      }[task.priority]

      console.log(`${status} [${prioritySymbol}] [${task.id}] ${task.title}`)
      console.log(`   Type: ${task.type} | Tests: ${tests} | Deps: ${task['depends-on'].length}`)
      if (task['depends-on'].length > 0) {
        console.log(`   Depends on: ${task['depends-on'].join(', ')}`)
      }

      console.log()
    }
  }
}
