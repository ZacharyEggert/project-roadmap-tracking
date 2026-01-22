import {Config} from '../../src/util/types.js'

export function createConfig(overrides: Partial<Config> = {}): Config {
  return {
    $schema:
      'https://raw.githubusercontent.com/ZacharyEggert/project-roadmap-tracking/refs/heads/master/schemas/config/v1.json',
    metadata: {
      description: 'Test config created by config factory',
      name: 'Test Project',
    },
    path: './prt.json',
    ...overrides,
  }
}

export function createConfigWithTempPath(tempDir: string, overrides: Partial<Config> = {}): Config {
  return createConfig({
    ...overrides,
    path: `${tempDir}/prt.json`,
  })
}
