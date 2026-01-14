import {readFile} from 'node:fs/promises'

import {Roadmap} from './types.js'

export async function readRoadmapFile(path: string): Promise<Roadmap> {
  const data = await readFile(path, 'utf8')
  return JSON.parse(data) as Roadmap
}
