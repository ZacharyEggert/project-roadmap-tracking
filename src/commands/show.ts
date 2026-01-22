import {Args, Command, Flags} from '@oclif/core'

import {RoadmapRepository} from '../repositories/roadmap.repository.js'
import displayService from '../services/display.service.js'
import errorHandlerService from '../services/error-handler.service.js'
import {readConfigFile} from '../util/read-config.js'
import {readRoadmapFile} from '../util/read-roadmap.js'

export default class Show extends Command {
  static override args = {
    task: Args.string({description: 'task ID to show', required: true}),
  }
  static override description = 'show details of a specific task in the project roadmap'
  static override examples = ['<%= config.bin %> <%= command.id %> F-001']
  static override flags = {
    'no-repo': Flags.boolean({
      default: false,
      description: 'use legacy direct file I/O instead of repository pattern',
    }),
    // flag with no value (-f, --force)
    // force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    // name: Flags.string({char: 'n', description: 'name to print'}),
    verbose: Flags.boolean({
      char: 'v',
      default: false,
      description: 'show detailed error information including stack traces',
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Show)

    try {
      const config = await readConfigFile()
      const roadmapPath = config.path
      // Use repository pattern by default, unless --no-repo flag is set
      const roadmap = flags['no-repo']
        ? await readRoadmapFile(roadmapPath)
        : await RoadmapRepository.fromConfig(config).load(roadmapPath)

      const task = roadmap.tasks.find((t) => t.id === args.task)

      if (!task) {
        this.error(`task with ID ${args.task} not found in roadmap \n  see list of tasks with: 'prt list'`)
      }

      const lines = displayService.formatTaskDetails(task)
      for (const line of lines) {
        console.log(line)
      }
    } catch (error) {
      const exitCode = errorHandlerService.handleError(error)
      this.error(errorHandlerService.formatErrorMessage(error, flags.verbose), {exit: exitCode})
    }
  }
}
