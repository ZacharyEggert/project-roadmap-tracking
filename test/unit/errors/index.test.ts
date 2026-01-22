import {expect} from 'chai'

import {
  CircularDependencyError,
  ConfigNotFoundError,
  getErrorCode,
  InvalidTaskError,
  isPrtError,
  PrtError,
  PrtErrorCode,
  RoadmapNotFoundError,
  TaskNotFoundError,
  ValidationError,
} from '../../../src/errors/index.js'

describe('errors/index', () => {
  describe('isPrtError', () => {
    it('should return true for PrtError instances', () => {
      const error = new PrtError('Test error')
      expect(isPrtError(error)).to.be.true
    })

    it('should return true for PrtError subclasses', () => {
      expect(isPrtError(new RoadmapNotFoundError('/path'))).to.be.true
      expect(isPrtError(new ConfigNotFoundError())).to.be.true
      expect(isPrtError(new InvalidTaskError('message'))).to.be.true
      expect(isPrtError(new TaskNotFoundError('F-001'))).to.be.true
      expect(isPrtError(new CircularDependencyError(['F-001']))).to.be.true
      expect(isPrtError(new ValidationError([{message: 'error', type: 'invalid-value'}]))).to.be.true
    })

    it('should return false for regular Error', () => {
      const error = new Error('Regular error')
      expect(isPrtError(error)).to.be.false
    })

    it('should return false for non-error values', () => {
      expect(isPrtError('string')).to.be.false
      expect(isPrtError(123)).to.be.false
      expect(isPrtError(null)).to.be.false
      expect(isPrtError()).to.be.false
      expect(isPrtError({})).to.be.false
    })
  })

  describe('getErrorCode', () => {
    it('should return code for PrtError instances', () => {
      const error = new PrtError('Test', PrtErrorCode.PRT_TASK_INVALID)
      expect(getErrorCode(error)).to.equal(PrtErrorCode.PRT_TASK_INVALID)
    })

    it('should return correct codes for specific error types', () => {
      expect(getErrorCode(new RoadmapNotFoundError('/path'))).to.equal(PrtErrorCode.PRT_FILE_ROADMAP_NOT_FOUND)
      expect(getErrorCode(new ConfigNotFoundError())).to.equal(PrtErrorCode.PRT_FILE_CONFIG_NOT_FOUND)
      expect(getErrorCode(new InvalidTaskError('message'))).to.equal(PrtErrorCode.PRT_TASK_INVALID)
      expect(getErrorCode(new TaskNotFoundError('F-001'))).to.equal(PrtErrorCode.PRT_TASK_NOT_FOUND)
      expect(getErrorCode(new CircularDependencyError(['F-001']))).to.equal(
        PrtErrorCode.PRT_VALIDATION_CIRCULAR_DEPENDENCY,
      )
      expect(getErrorCode(new ValidationError([{message: 'error', type: 'invalid-value'}]))).to.equal(
        PrtErrorCode.PRT_VALIDATION_FAILED,
      )
    })

    it('should return null for regular Error', () => {
      const error = new Error('Regular error')
      expect(getErrorCode(error)).to.be.null
    })

    it('should return null for non-error values', () => {
      expect(getErrorCode('string')).to.be.null
      expect(getErrorCode(123)).to.be.null
      expect(getErrorCode(null)).to.be.null
      expect(getErrorCode()).to.be.null
      expect(getErrorCode({})).to.be.null
    })
  })

  describe('exports', () => {
    it('should export all error classes', () => {
      expect(PrtError).to.be.a('function')
      expect(RoadmapNotFoundError).to.be.a('function')
      expect(ConfigNotFoundError).to.be.a('function')
      expect(InvalidTaskError).to.be.a('function')
      expect(TaskNotFoundError).to.be.a('function')
      expect(CircularDependencyError).to.be.a('function')
      expect(ValidationError).to.be.a('function')
    })

    it('should export PrtErrorCode enum', () => {
      expect(PrtErrorCode).to.be.an('object')
      expect(PrtErrorCode.PRT_UNKNOWN).to.be.a('string')
    })

    it('should export type guards', () => {
      expect(isPrtError).to.be.a('function')
      expect(getErrorCode).to.be.a('function')
    })
  })
})
