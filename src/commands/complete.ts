import {Args, Command, Flags} from '@oclif/core'

import errorHandlerService from '../services/error-handler.service.js'
import {readConfigFile} from '../util/read-config.js'
import {readRoadmapFile} from '../util/read-roadmap.js'
import {STATUS} from '../util/types.js'
import {updateTaskInRoadmap} from '../util/update-task.js'
import {writeRoadmapFile} from '../util/write-roadmap.js'

export default class Complete extends Command {
  static override args = {
    taskID: Args.string({description: 'ID of the task to complete', required: true}),
  }
  static override description = 'Mark a task as completed'
  static override examples = ['<%= config.bin %> <%= command.id %> F-001 --tests']
  static override flags = {
    // flag with no value (-f, --force)
    // force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    // name: Flags.string({char: 'n', description: 'name to print'}),
    tests: Flags.boolean({char: 't', description: 'mark task as passes-tests'}),
    verbose: Flags.boolean({
      char: 'v',
      default: false,
      description: 'show detailed error information including stack traces',
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Complete)

    try {
      const config = await readConfigFile()
      const roadmap = await readRoadmapFile(config.path)

      const updatedRoadmap = await updateTaskInRoadmap(
        roadmap,
        args.taskID,
        flags.tests
          ? {
              'passes-tests': true,
              status: STATUS.Completed,
            }
          : {
              status: STATUS.Completed,
            },
      )

      await writeRoadmapFile(config.path, updatedRoadmap)

      this.log(`Task ${args.taskID} marked as completed.`)
    } catch (error) {
      const exitCode = errorHandlerService.handleError(error)
      this.error(errorHandlerService.formatErrorMessage(error, flags.verbose), {exit: exitCode})
    }
  }
}
