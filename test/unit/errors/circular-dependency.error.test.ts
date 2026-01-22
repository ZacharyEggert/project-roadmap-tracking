import {expect} from 'chai'

import {CircularDependencyError, PrtError, PrtErrorCode} from '../../../src/errors/index.js'
import {TaskID} from '../../../src/util/types.js'

describe('CircularDependencyError', () => {
  describe('constructor', () => {
    it('should create error with auto-generated message', () => {
      const cycle: TaskID[] = ['F-001', 'F-002', 'F-003']
      const error = new CircularDependencyError(cycle)

      expect(error).to.be.instanceOf(Error)
      expect(error).to.be.instanceOf(PrtError)
      expect(error).to.be.instanceOf(CircularDependencyError)
      expect(error.message).to.equal('Circular dependency detected: F-001 -> F-002 -> F-003 -> F-001')
      expect(error.code).to.equal(PrtErrorCode.PRT_VALIDATION_CIRCULAR_DEPENDENCY)
      expect(error.name).to.equal('CircularDependencyError')
    })

    it('should create error with custom message', () => {
      const cycle: TaskID[] = ['F-001', 'F-002']
      const customMessage = 'Dependency loop found in feature tasks'
      const error = new CircularDependencyError(cycle, customMessage)

      expect(error.message).to.equal(customMessage)
    })

    it('should include cycle and cycleLength in context', () => {
      const cycle: TaskID[] = ['F-001', 'F-002', 'F-003']
      const error = new CircularDependencyError(cycle)

      expect(error.context).to.deep.equal({
        cycle: ['F-001', 'F-002', 'F-003'],
        cycleLength: 3,
      })
    })

    it('should handle two-task cycle', () => {
      const cycle: TaskID[] = ['F-001', 'F-002']
      const error = new CircularDependencyError(cycle)

      expect(error.message).to.equal('Circular dependency detected: F-001 -> F-002 -> F-001')
      expect(error.context?.cycleLength).to.equal(2)
    })

    it('should handle single-task self-dependency', () => {
      const cycle: TaskID[] = ['F-001']
      const error = new CircularDependencyError(cycle)

      expect(error.message).to.equal('Circular dependency detected: F-001 -> F-001')
      expect(error.context?.cycleLength).to.equal(1)
    })

    it('should preserve stack trace', () => {
      const cycle: TaskID[] = ['F-001', 'F-002']
      const error = new CircularDependencyError(cycle)

      expect(error.stack).to.be.a('string')
      expect(error.stack).to.include('CircularDependencyError')
    })
  })
})
