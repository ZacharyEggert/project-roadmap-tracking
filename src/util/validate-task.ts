import {InvalidTaskError} from '../errors/index.js'
import {Task} from './types.js'

export function validateTask(task: Task, {skipID}: {skipID?: boolean} = {}): void {
  if (!skipID && !/^(B|F|I|P|R)-[0-9]{3}$/.test(task.id)) {
    throw new InvalidTaskError(`task ID ${task.id} is not valid. Must match format: [B|F|I|P|R]-[000-999]`, task.id, 'id')
  }

  if (!['bug', 'feature', 'improvement', 'planning', 'research'].includes(task.type)) {
    throw new InvalidTaskError(`task ${skipID ? '' : `ID ${task.id}`} has invalid type: ${task.type}`, skipID ? undefined : task.id, 'type')
  }

  if (!['high', 'low', 'medium'].includes(task.priority)) {
    throw new InvalidTaskError(`task ${skipID ? '' : `ID ${task.id}`} has invalid priority: ${task.priority}`, skipID ? undefined : task.id, 'priority')
  }

  if (!['completed', 'in-progress', 'not-started'].includes(task.status)) {
    throw new InvalidTaskError(`task ${skipID ? '' : `ID ${task.id}`} has invalid status: ${task.status}`, skipID ? undefined : task.id, 'status')
  }

  if (!task.details) {
    throw new InvalidTaskError(`task ${skipID ? '' : `ID ${task.id}`} must have details`, skipID ? undefined : task.id, 'details')
  }
}
