import {Args, Command, Flags} from '@oclif/core'

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
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Complete)

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
  }
}
