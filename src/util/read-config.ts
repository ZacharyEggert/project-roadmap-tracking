import {readFile} from 'node:fs/promises'

import {ConfigNotFoundError} from '../errors/index.js'
import {Config} from './types.js'

export async function readConfigFile() {
  try {
    const data = await readFile('.prtrc.json', 'utf8')
    return JSON.parse(data) as Config
  } catch (error) {
    // Re-throw SyntaxError for JSON parsing issues
    if (error instanceof SyntaxError) {
      throw error
    }

    throw new ConfigNotFoundError('.prtrc.json', error instanceof Error ? error : undefined)
  }
}
