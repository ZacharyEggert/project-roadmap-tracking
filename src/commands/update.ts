import {Args, Command, Flags} from '@oclif/core'

import {RoadmapRepository} from '../repositories/roadmap.repository.js'
import errorHandlerService from '../services/error-handler.service.js'
import {readConfigFile} from '../util/read-config.js'
import {readRoadmapFile} from '../util/read-roadmap.js'
import {STATUS, Task, TaskID} from '../util/types.js'
import {updateTaskInRoadmap} from '../util/update-task.js'
import {validateTaskID} from '../util/validate-task-id.js'
import {writeRoadmapFile} from '../util/write-roadmap.js'

export default class Update extends Command {
  static override args = {
    taskID: Args.string({description: 'ID of the task to update', required: true}),
  }
  static override description = 'Update a task in place'
  static override examples = [
    '<%= config.bin %> <%= command.id %> F-001 --status=completed --tested=true --notes="Fixed all bugs"',
    '<%= config.bin %> <%= command.id %> F-002 --deps="F-001" --clear-notes',
  ]
  static override flags = {
    'clear-notes': Flags.boolean({description: 'clear all notes from the task'}),
    deps: Flags.string({
      char: 'd',
      description: 'update the dependencies of the task (comma-separated list of task IDs)',
    }),
    'no-repo': Flags.boolean({
      default: false,
      description: 'use legacy direct file I/O instead of repository pattern',
    }),
    notes: Flags.string({char: 'n', description: 'append notes to the task'}),
    status: Flags.string({
      char: 's',
      description: 'set the status of the task (completed, in-progress, not-started)',
      options: [STATUS.Completed, STATUS.InProgress, STATUS.NotStarted],
    }),
    tested: Flags.string({
      char: 't',
      description: 'update whether the task passes tests',
      options: ['true', 'false'],
    }),
    verbose: Flags.boolean({
      char: 'v',
      default: false,
      description: 'show detailed error information including stack traces',
    }),

    // flag with no value (-f, --force)
    // force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    // name: Flags.string({char: 'n', description: 'name to print'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Update)

    try {
      const config = await readConfigFile()
      // Use repository pattern by default, unless --no-repo flag is set
      const roadmap = flags['no-repo']
        ? await readRoadmapFile(config.path)
        : await RoadmapRepository.fromConfig(config).load(config.path)

      const updateObject: Partial<Task> = {}

      if (flags['clear-notes']) {
        updateObject.notes = ''
      }

      if (flags.notes) {
        let existingNotes = ''

        if (!flags['clear-notes']) {
          const existingTask = roadmap.tasks.find((task) => task.id === args.taskID)
          existingNotes = existingTask?.notes ? existingTask.notes + '\n' : ''
        }

        updateObject.notes = existingNotes + flags.notes
      }

      if (flags.status) {
        updateObject.status = flags.status as STATUS
      }

      if (flags.tested) {
        updateObject['passes-tests'] = flags.tested === 'true'
      }

      if (flags.deps) {
        const depsArray = flags.deps.split(',').map((dep) => dep.trim())

        // checking that each depArray item matches TaskID format
        for (const dep of depsArray) {
          try {
            validateTaskID(dep)
          } catch {
            this.error(`Invalid task ID in dependencies: ${dep}`)
          }
        }

        updateObject['depends-on'] = depsArray as TaskID[]
      }

      const updatedRoadmap = await updateTaskInRoadmap(roadmap, args.taskID, updateObject)

      await (flags['no-repo'] ? writeRoadmapFile(config.path, updatedRoadmap) : RoadmapRepository.fromConfig(config).save(config.path, updatedRoadmap));

      this.log(`Task ${args.taskID} has been updated.`)
    } catch (error) {
      const exitCode = errorHandlerService.handleError(error)
      this.error(errorHandlerService.formatErrorMessage(error, flags.verbose), {exit: exitCode})
    }
  }
}
