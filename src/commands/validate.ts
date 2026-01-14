import {Command} from '@oclif/core'
import {readFile} from 'node:fs/promises'

import {readConfigFile} from '../util/read-config.js'
import {Roadmap} from '../util/types.js'
import {validateTask} from '../util/validate-task.js'

export default class Validate extends Command {
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
  }

  public async run(): Promise<void> {
    await this.parse(Validate)

    this.log(`validating roadmap...`)

    const config = await readConfigFile().catch((error: unknown) => {
      this.error(`failed to read config file: ${error ? (error as Error).message : String(error)}`)
    })

    const roadmapPath = config.path

    const roadmapData = await readFile(roadmapPath, 'utf8')

    let roadmap: Roadmap

    try {
      roadmap = JSON.parse(roadmapData) as Roadmap
      this.log(`roadmap at ${roadmapPath} is valid JSON`)
    } catch (error: unknown) {
      this.error(`roadmap at ${roadmapPath} is not valid JSON: ${error ? (error as Error).message : String(error)}`)
    }

    if (roadmap.tasks.length === 0) {
      this.log('roadmap contains no tasks to validate')
      this.log('roadmap validation complete')
      return
    }

    for (const task of roadmap.tasks) {
      try {
        validateTask(task)
      } catch (error: unknown) {
        this.error(`task ID ${task.id} is invalid: ${error ? (error as Error).message : String(error)}`)
      }
    }

    this.log(roadmap.tasks.length > 1 ? `all ${roadmap.tasks.length} tasks are valid` : `1 task is valid`)
    this.log(`roadmap validation complete`)
  }
}
