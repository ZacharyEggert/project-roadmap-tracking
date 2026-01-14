import {Args, Command, Flags} from '@oclif/core'
import {mkdir, readdir, writeFile} from 'node:fs/promises'

import {Config, PRIORITY, Roadmap, STATUS, TASK_TYPE} from '../util/types.js'

export default class Init extends Command {
  static override args = {
    folder: Args.string({description: 'folder to initialize the project roadmap in'}),
  }
  static override description = 'initialize a new project roadmap (prt.json and prt.config.json)'
  static override examples = ['<%= config.bin %> <%= command.id %> [path/to/directory]']
  static override flags = {
    // flag with no value (-f, --force)
    description: Flags.string({char: 'd', description: 'description to print'}),
    force: Flags.boolean({char: 'f', description: 'force initialization even if files already exist'}),
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({char: 'n', description: 'name to print'}),
    withSampleTasks: Flags.boolean({description: 'include sample tasks in the initialized roadmap'}),
  }

  buildBlankRoadmap({
    description,
    name,
    withSampleTasks,
  }: {
    description: string
    name: string
    withSampleTasks: boolean
  }): Roadmap {
    return {
      $schema: 'https://project-roadmap-tracking.com/schemas/roadmap/v1.json',
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: `project-roadmap-tracking CLI`,
        description: `${description}`,
        name: `${name}`,
      },
      tasks: withSampleTasks
        ? [
            {
              assignedTo: null,
              blocks: [],
              createdAt: new Date().toISOString(),
              'depends-on': [],
              details: 'This is a sample task to get you started.',
              dueDate: null,
              id: 'F-001',
              'passes-tests': true,
              priority: PRIORITY.Medium,
              status: STATUS.NotStarted,
              tags: ['sample'],
              title: 'Sample Task',
              type: TASK_TYPE.Feature,
              updatedAt: new Date().toISOString(),
            },
          ]
        : [],
    }
  }

  buildConfig({description, name, path}: {description: string; name: string; path: string}): Config {
    return {
      $schema: 'https://project-roadmap-tracking.com/schemas/config/v1.json',
      metadata: {
        description: `${description}`,
        name: `${name}`,
      },
      path: `${path}/prt.json`,
    }
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Init)

    const path = args.folder ?? '.'
    this.log(`creating project roadmap in${path === '.' ? ' current directory' : ': ' + args.folder}`)
    const name = flags.name ?? 'My Project Roadmap'
    const description = flags.description ?? 'A project roadmap managed by Project Roadmap Tracking'

    // create prt.json and prt.config.json files here
    const config = this.buildConfig({description, name, path})
    const roadmap = this.buildBlankRoadmap({description, name, withSampleTasks: flags.withSampleTasks ?? false})

    if (path !== '.') {
      // check if target directory exists
      // if it does not, create it
      await readdir(path).catch(async (error) => {
        if (error) {
          this.log(`target directory does not exist, creating: ${path}`)
          try {
            // create the directory
            await mkdir(path, {recursive: true})
          } catch (error) {
            this.error(`failed to create target directory: ${(error as Error).message}`)
          }
        }
      })
    }

    // check if config already exists in the target directory
    // if it does, and --force is not set, throw an error
    // if it does, and --force is set, overwrite the files
    await readdir('.')
      .then(async (files) => {
        if (!flags.force && (files.includes('prt.json') || files.includes('prt.config.json'))) {
          this.error('prt.config.json already exist in the current directory. Use --force to overwrite.')
        }

        await writeFile(`./.prtrc.json`, JSON.stringify(config, null, 2))
        this.log('project roadmap config initialized')
      })
      .catch((error) => {
        this.error(`failed to read current directory: ${error.message}`)
      })

    // create prt.json and prt.config.json files in specified directory

    await readdir(path)
      .then(async (files) => {
        if (!flags.force && files.includes('prt.json')) {
          this.error('prt.json already exists in the target directory. Use --force to overwrite.')
        }

        await writeFile(`${path}/prt.json`, JSON.stringify(roadmap, null, 2))
        this.log('project roadmap initialized')
      })
      .catch((error) => {
        this.error(`failed to read directory: ${error.message}`)
      })
  }
}
