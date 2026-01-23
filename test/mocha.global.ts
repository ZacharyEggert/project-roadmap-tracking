import {resetDefaultConfigRepository} from '../src/repositories/config.repository.js'
import {resetDefaultRepository} from '../src/repositories/roadmap.repository.js'

/**
 * Global mocha hooks for cleanup
 * Runs after each test file completes
 */
export const mochaHooks = {
  afterEach() {
    // Reset singleton repositories to prevent test pollution
    resetDefaultRepository()
    resetDefaultConfigRepository()
  },
}
