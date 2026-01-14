import {Args, Command /* , Flags */} from '@oclif/core'

import {readConfigFile} from '../util/read-config.js'
import {readRoadmapFile} from '../util/read-roadmap.js'

export default class Show extends Command {
  static override args = {
    task: Args.string({description: 'task ID to show', required: true}),
  }
  static override description = 'show details of a specific task in the project roadmap'
  static override examples = ['<%= config.bin %> <%= command.id %> F-001']
  static override flags = {
    // flag with no value (-f, --force)
    // force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    // name: Flags.string({char: 'n', description: 'name to print'}),
  }

  public async run(): Promise<void> {
    const {args} = await this.parse(Show)

    const config = await readConfigFile().catch((error) => {
      this.error(`failed to read config file: ${error ? error.message : String(error)}`)
    })

    const roadmapPath = config.path

    const roadmap = await readRoadmapFile(roadmapPath)

    const task = roadmap.tasks.find((t) => t.id === args.task)

    if (!task) {
      this.error(`task with ID ${args.task} not found in roadmap \n  see list of tasks with: 'prt list'`)
    }

    const completeStatus = task.status === 'completed' ? '✓' : task.status === 'in-progress' ? '~' : '○'
    const testStatus = task['passes-tests'] ? '✓' : '✗'
    const priorityLabel = {
      high: 'High',
      low: 'Low',
      medium: 'Medium',
    }[task.priority]

    console.log(`\nTask: ${task.id}\n`)
    console.log(`Title: ${task.title}`)
    console.log(`Type: ${task.type}`)
    console.log(`Priority: ${priorityLabel}`)
    console.log(
      `Status: ${completeStatus} ${task.status
        .replaceAll('-', ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')} | ${testStatus} Tests Passing`,
    )
    console.log(`\nDetails:\n${task.details}`)

    // Dependencies
    if (task['depends-on'].length > 0) {
      console.log(`\nDepends On: ${task['depends-on'].join(', ')}`)
    } else {
      console.log(`\nDepends On: None`)
    }

    // Blocks (optional)
    if (task.blocks && task.blocks.length > 0) {
      console.log(`Blocks: ${task.blocks.join(', ')}`)
    }

    // Timestamps
    console.log(`\nCreated: ${task.createdAt}`)
    console.log(`Updated: ${task.updatedAt}`)

    // Optional fields - only display if present
    if (task.tags && task.tags.length > 0) {
      console.log(`\nTags: ${task.tags.join(', ')}`)
    }

    if (task.effort !== undefined) {
      console.log(`Effort: ${task.effort}`)
    }

    if (task['github-refs'] && task['github-refs'].length > 0) {
      console.log(`GitHub Refs: ${task['github-refs'].join(', ')}`)
    }

    if (task.notes) {
      console.log(`\nNotes:\n${task.notes}`)
    }

    console.log('')
  }
}
