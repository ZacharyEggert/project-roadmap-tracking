export type Config = {
  $schema: string
  metadata: {
    description: string
    name: string
  }
  path: string
}

export type Roadmap = {
  $schema: string
  metadata: {
    createdAt: string
    createdBy: string
    description: string
    name: string
  }
  tasks: Array<Task>
}

export type Tag = string

export enum PRIORITY {
  High = 'high',
  Low = 'low',
  Medium = 'medium',
}

export enum STATUS {
  Completed = 'completed',
  InProgress = 'in-progress',
  NotStarted = 'not-started',
}

export enum TASK_TYPE {
  Bug = 'bug',
  Feature = 'feature',
  Improvement = 'improvement',
  Planning = 'planning',
  Research = 'research',
}

export type SingleDigit = `${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`

export type TaskID = `${TASK_TYPE}-${SingleDigit}${SingleDigit}${SingleDigit}`
export const TASK_ID_REGEX = /^(bug|feature|improvement|planning|research)-[0-9]{3}$/

export type Task = {
  assignedTo?: null | string
  blocking: Array<Task['id']>
  createdAt?: null | string
  'depends-on': Array<Task['id']>
  details: string
  dueDate?: null | string
  id: TaskID
  'passes-tests': boolean
  priority: PRIORITY
  status: STATUS
  tags: Array<Tag>
  title: string
  type: TASK_TYPE
  updatedAt?: null | string
}
