import {Args, Command, Flags} from '@oclif/core'

import {getDefaultConfigRepository} from '../repositories/config.repository.js'
import {RoadmapRepository} from '../repositories/roadmap.repository.js'
import errorHandlerService from '../services/error-handler.service.js'
import {readConfigFile} from '../util/read-config.js'
import {readRoadmapFile} from '../util/read-roadmap.js'
import {updateTaskInRoadmap} from '../util/update-task.js'
import {writeRoadmapFile} from '../util/write-roadmap.js'

export default class PassTest extends Command {
  static override args = {
    taskID: Args.string({description: 'ID of the task to mark as passing tests', required: true}),
  }
  static override description = 'Mark a task as passes-tests'
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
    const {args, flags} = await this.parse(PassTest)

    try {
      // Use repository pattern by default, unless --no-repo flag is set
      const config = flags['no-repo'] ? await readConfigFile() : await getDefaultConfigRepository().load()
      const roadmap = flags['no-repo']
        ? await readRoadmapFile(config.path)
        : await RoadmapRepository.fromConfig(config).load(config.path)

      const updatedRoadmap = await updateTaskInRoadmap(roadmap, args.taskID, {
        'passes-tests': true,
      })

      await (flags['no-repo']
        ? writeRoadmapFile(config.path, updatedRoadmap)
        : RoadmapRepository.fromConfig(config).save(config.path, updatedRoadmap))

      this.log(`Task ${args.taskID} marked as passing tests.`)
    } catch (error) {
      const exitCode = errorHandlerService.handleError(error)
      this.error(errorHandlerService.formatErrorMessage(error, flags.verbose), {exit: exitCode})
    }
  }
}
