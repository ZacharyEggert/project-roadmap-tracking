import {readFile} from 'node:fs/promises'

import {RoadmapNotFoundError} from '../errors/index.js'
import {Roadmap} from './types.js'

export async function readRoadmapFile(path: string): Promise<Roadmap> {
  try {
    const data = await readFile(path, 'utf8')
    return JSON.parse(data) as Roadmap
  } catch (error) {
    // Re-throw SyntaxError for JSON parsing issues
    if (error instanceof SyntaxError) {
      throw error
    }

    throw new RoadmapNotFoundError(path, error instanceof Error ? error : undefined)
  }
}
