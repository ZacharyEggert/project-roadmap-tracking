import {Args, Command, Flags} from '@oclif/core'

import {readConfigFile} from '../util/read-config.js'
import {readRoadmapFile} from '../util/read-roadmap.js'
import {updateTaskInRoadmap} from '../util/update-task.js'
import {writeRoadmapFile} from '../util/write-roadmap.js'

export default class PassTest extends Command {
  static override args = {
    taskID: Args.string({description: 'ID of the task to complete', required: true}),
  }
  static override description = 'describe the command here'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({char: 'n', description: 'name to print'}),
  }

  public async run(): Promise<void> {
    const {args} = await this.parse(PassTest)

    const config = await readConfigFile()
    const roadmap = await readRoadmapFile(config.path)

    const updatedRoadmap = await updateTaskInRoadmap(roadmap, args.taskID, {
      'passes-tests': true,
    })

    await writeRoadmapFile(config.path, updatedRoadmap)

    this.log(`Task ${args.taskID} marked as passes-tests.`)
  }
}
