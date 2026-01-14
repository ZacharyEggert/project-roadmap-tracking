import {TaskID} from './types.js'

export function validateTaskID(taskID: string): asserts taskID is TaskID {
  if (!/^(B|F|I|P|R)-[0-9]{3}$/.test(taskID)) {
    throw new Error(`task ID ${taskID} is not valid. Must match format: [B|F|I|P|R]-[000-999]`)
  }
}
