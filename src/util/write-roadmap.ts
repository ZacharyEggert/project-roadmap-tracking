import {writeFile} from 'node:fs/promises'

import {Roadmap} from './types.js'

export async function writeRoadmapFile(path: string, roadmap: Roadmap): Promise<void> {
  const data = JSON.stringify(roadmap, null, 2)
  await writeFile(path, data, 'utf8')
}
