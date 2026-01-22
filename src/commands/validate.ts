import {Command, Flags} from '@oclif/core'
import {readFile} from 'node:fs/promises'

import {getDefaultConfigRepository} from '../repositories/config.repository.js'
import {RoadmapRepository} from '../repositories/roadmap.repository.js'
import displayService from '../services/display.service.js'
import errorHandlerService from '../services/error-handler.service.js'
import taskDependencyService from '../services/task-dependency.service.js'
import {readConfigFile} from '../util/read-config.js'
import {Roadmap} from '../util/types.js'
import {validateTask} from '../util/validate-task.js'

export default class Validate extends Command {
  static override args = {
    // file: Args.string({description: 'file to read'}),
  }
  static override description = 'Validate roadmap structure, task data, and check for circular dependencies'
  static override examples = ['<%= config.bin %> <%= command.id %>']
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
    const {flags} = await this.parse(Validate)

    try {
      this.log(`validating roadmap...`)

      // Use repository pattern by default, unless --no-repo flag is set
      const config = flags['no-repo'] ? await readConfigFile() : await getDefaultConfigRepository().load()

      const roadmapPath = config.path

      let roadmap: Roadmap

      if (flags['no-repo']) {
        const roadmapData = await readFile(roadmapPath, 'utf8')
        try {
          roadmap = JSON.parse(roadmapData) as Roadmap
          this.log(`roadmap at ${roadmapPath} is valid JSON`)
        } catch (error: unknown) {
          this.error(`roadmap at ${roadmapPath} is not valid JSON: ${error ? (error as Error).message : String(error)}`)
        }
      } else {
        try {
          roadmap = await RoadmapRepository.fromConfig(config).load(roadmapPath)
          this.log(`roadmap at ${roadmapPath} is valid JSON`)
        } catch (error: unknown) {
          this.error(`roadmap at ${roadmapPath} is not valid JSON: ${error ? (error as Error).message : String(error)}`)
        }
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

      // this.log(roadmap.tasks.length > 1 ? `all ${roadmap.tasks.length} tasks are valid` : `1 task is valid`)

      // Validate dependencies (including circular dependency check)
      this.log(`validating task dependencies...`)
      const dependencyErrors = taskDependencyService.validateDependencies(roadmap)

      if (dependencyErrors.length > 0) {
        const errorLines = displayService.formatValidationErrors(dependencyErrors)
        for (const line of errorLines) {
          this.log(line)
        }

        // Exit with error if any dependency errors found
        this.error('Dependency validation failed')
      }

      this.log(`all task dependencies are valid`)
      this.log(`roadmap validation complete`)
    } catch (error) {
      const exitCode = errorHandlerService.handleError(error)
      this.error(errorHandlerService.formatErrorMessage(error, flags.verbose), {exit: exitCode})
    }
  }
}
