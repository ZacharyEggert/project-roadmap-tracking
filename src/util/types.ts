export type Config = {
  $schema: string
  cache?: {
    enabled?: boolean
    maxSize?: number
    watchFiles?: boolean
  }
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

export enum TASK_TYPE_LETTER {
  Bug = 'B',
  Feature = 'F',
  Improvement = 'I',
  Planning = 'P',
  Research = 'R',
}

export const TASK_TYPE_MAP: Map<TASK_TYPE, TASK_TYPE_LETTER> = new Map([
  [TASK_TYPE.Bug, TASK_TYPE_LETTER.Bug],
  [TASK_TYPE.Feature, TASK_TYPE_LETTER.Feature],
  [TASK_TYPE.Improvement, TASK_TYPE_LETTER.Improvement],
  [TASK_TYPE.Planning, TASK_TYPE_LETTER.Planning],
  [TASK_TYPE.Research, TASK_TYPE_LETTER.Research],
])

export type SingleDigit = `${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`

export type TaskID = `${TASK_TYPE_LETTER}-${SingleDigit}${SingleDigit}${SingleDigit}`
export const TASK_ID_REGEX = /^(B|F|I|P|R)-[0-9]{3}$/

export type Task = {
  assignedTo?: null | string
  blocks: Array<Task['id']>
  createdAt?: null | string
  'depends-on': Array<Task['id']>
  details: string
  dueDate?: null | string
  effort?: null | number
  'github-refs'?: Array<string>
  id: TaskID
  notes?: null | string
  'passes-tests': boolean
  priority: PRIORITY
  status: STATUS
  tags: Array<Tag>
  title: string
  type: TASK_TYPE
  updatedAt?: null | string
}
