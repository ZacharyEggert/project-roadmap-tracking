import {Args, Command, Flags} from '@oclif/core'

import taskService from '../services/task.service.js'
import {readConfigFile} from '../util/read-config.js'
import {readRoadmapFile} from '../util/read-roadmap.js'
import {PRIORITY, STATUS, TASK_TYPE} from '../util/types.js'
import {writeRoadmapFile} from '../util/write-roadmap.js'

export default class Add extends Command {
  static override args = {
    title: Args.string({description: 'title of the task to add', required: true}),
  }
  static override description = 'add a new task to the roadmap'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    // force: Flags.boolean({char: 'f'}),
    // name: Flags.string({char: 'n', description: 'name to print'}),
    details: Flags.string({char: 'd', description: 'description of the task to add', required: true}),
    priority: Flags.string({
      char: 'p',
      default: PRIORITY.Medium,
      description: 'priority of the task to add',
      options: [PRIORITY.High, PRIORITY.Medium, PRIORITY.Low],
      required: false,
    }),
    status: Flags.string({
      char: 's',
      default: STATUS.NotStarted,
      description: 'status of the task to add',
      options: [STATUS.NotStarted, STATUS.InProgress, STATUS.Completed],
      required: false,
    }),
    tags: Flags.string({
      char: 'g',
      description: 'comma-separated list of tags to add to the task',
      required: false,
    }),
    type: Flags.string({
      char: 't',
      description: 'type of the task to add',
      options: [TASK_TYPE.Bug, TASK_TYPE.Feature, TASK_TYPE.Improvement, TASK_TYPE.Planning, TASK_TYPE.Research],
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Add)

    const config = await readConfigFile()

    const roadmap = await readRoadmapFile(config.path)
    const taskType = flags.type as TASK_TYPE

    const newTaskID = taskService.generateNextId(roadmap, taskType)

    const newTask = taskService.createTask({
      details: flags.details,
      id: newTaskID,
      priority: flags.priority as PRIORITY,
      status: flags.status as STATUS,
      tags: flags.tags ? flags.tags.split(',').map((tag) => tag.trim()) : [],
      title: args.title,
      type: taskType,
    })

    const updatedRoadmap = taskService.addTask(roadmap, newTask)

    await writeRoadmapFile(config.path, updatedRoadmap)
  }
}
