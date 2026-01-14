import {readFile} from 'node:fs/promises'

import {Config} from './types.js'

export async function readConfigFile() {
  const data = await readFile('.prtrc.json', 'utf8')
  return JSON.parse(data) as Config
}
