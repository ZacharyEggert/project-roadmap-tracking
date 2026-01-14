import {Task} from './types.js'

export function validateTask(task: Task, {skipID}: {skipID?: boolean} = {}): void {
  if (!skipID && !/^(B|F|I|P|R)-[0-9]{3}$/.test(task.id)) {
    throw new Error(`task ID ${task.id} is not valid. Must match format: [B|F|I|P|R]-[000-999]`)
  }

  if (!['bug', 'feature', 'improvement', 'planning', 'research'].includes(task.type)) {
    throw new Error(`task ${skipID ? '' : `ID ${task.id}`} has invalid type: ${task.type}`)
  }

  if (!['high', 'low', 'medium'].includes(task.priority)) {
    throw new Error(`task ${skipID ? '' : `ID ${task.id}`} has invalid priority: ${task.priority}`)
  }

  if (!['completed', 'in-progress', 'not-started'].includes(task.status)) {
    throw new Error(`task ${skipID ? '' : `ID ${task.id}`} has invalid status: ${task.status}`)
  }

  if (!task.details) {
    throw new Error(`task ${skipID ? '' : `ID ${task.id}`} must have details`)
  }
}
