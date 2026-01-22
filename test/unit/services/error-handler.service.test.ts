import {expect} from 'chai'
import {describe, it} from 'mocha'

import {
  CircularDependencyError,
  ConfigNotFoundError,
  InvalidTaskError,
  PrtError,
  PrtErrorCode,
  RoadmapNotFoundError,
  TaskNotFoundError,
  ValidationError,
} from '../../../src/errors/index.js'
import errorHandlerService, {ExitCodes} from '../../../src/services/error-handler.service.js'

describe('ErrorHandlerService', () => {
  describe('getExitCodeForErrorCode', () => {
    it('should map config not found to NOT_FOUND exit code', () => {
      const exitCode = errorHandlerService.getExitCodeForErrorCode(PrtErrorCode.PRT_FILE_CONFIG_NOT_FOUND)
      expect(exitCode).to.equal(ExitCodes.NOT_FOUND)
    })

    it('should map roadmap not found to NOT_FOUND exit code', () => {
      const exitCode = errorHandlerService.getExitCodeForErrorCode(PrtErrorCode.PRT_FILE_ROADMAP_NOT_FOUND)
      expect(exitCode).to.equal(ExitCodes.NOT_FOUND)
    })

    it('should map task not found to NOT_FOUND exit code', () => {
      const exitCode = errorHandlerService.getExitCodeForErrorCode(PrtErrorCode.PRT_TASK_NOT_FOUND)
      expect(exitCode).to.equal(ExitCodes.NOT_FOUND)
    })

    it('should map task ID invalid to VALIDATION_ERROR exit code', () => {
      const exitCode = errorHandlerService.getExitCodeForErrorCode(PrtErrorCode.PRT_TASK_ID_INVALID)
      expect(exitCode).to.equal(ExitCodes.VALIDATION_ERROR)
    })

    it('should map task invalid to VALIDATION_ERROR exit code', () => {
      const exitCode = errorHandlerService.getExitCodeForErrorCode(PrtErrorCode.PRT_TASK_INVALID)
      expect(exitCode).to.equal(ExitCodes.VALIDATION_ERROR)
    })

    it('should map validation failed to VALIDATION_ERROR exit code', () => {
      const exitCode = errorHandlerService.getExitCodeForErrorCode(PrtErrorCode.PRT_VALIDATION_FAILED)
      expect(exitCode).to.equal(ExitCodes.VALIDATION_ERROR)
    })

    it('should map circular dependency to DEPENDENCY_ERROR exit code', () => {
      const exitCode = errorHandlerService.getExitCodeForErrorCode(PrtErrorCode.PRT_VALIDATION_CIRCULAR_DEPENDENCY)
      expect(exitCode).to.equal(ExitCodes.DEPENDENCY_ERROR)
    })

    it('should map unknown error to GENERAL_ERROR exit code', () => {
      const exitCode = errorHandlerService.getExitCodeForErrorCode(PrtErrorCode.PRT_UNKNOWN)
      expect(exitCode).to.equal(ExitCodes.GENERAL_ERROR)
    })
  })

  describe('formatErrorMessage', () => {
    it('should format PrtError with message and code', () => {
      const error = new ConfigNotFoundError('/path/to/config')
      const message = errorHandlerService.formatErrorMessage(error, false)

      expect(message).to.include('Error:')
      expect(message).to.include('Code: PRT_FILE_CONFIG_NOT_FOUND')
    })

    it('should format PrtError with context in verbose mode', () => {
      const error = new PrtError('Test error', PrtErrorCode.PRT_UNKNOWN, {
        taskId: 'F-001',
        userId: 123,
      })
      const message = errorHandlerService.formatErrorMessage(error, true)

      expect(message).to.include('Error: Test error')
      expect(message).to.include('Code: PRT_UNKNOWN')
      expect(message).to.include('Context:')
      expect(message).to.include('"taskId": "F-001"')
      expect(message).to.include('"userId": 123')
    })

    it('should not include context in non-verbose mode', () => {
      const error = new PrtError('Test error', PrtErrorCode.PRT_UNKNOWN, {
        taskId: 'F-001',
      })
      const message = errorHandlerService.formatErrorMessage(error, false)

      expect(message).to.include('Error: Test error')
      expect(message).to.include('Code: PRT_UNKNOWN')
      expect(message).to.not.include('Context:')
      expect(message).to.not.include('taskId')
    })

    it('should include stack trace in verbose mode', () => {
      const error = new Error('Test error')
      const message = errorHandlerService.formatErrorMessage(error, true)

      expect(message).to.include('Error: Test error')
      expect(message).to.include('Stack trace:')
      expect(message).to.include('at ')
    })

    it('should not include stack trace in non-verbose mode', () => {
      const error = new Error('Test error')
      const message = errorHandlerService.formatErrorMessage(error, false)

      expect(message).to.include('Error: Test error')
      expect(message).to.not.include('Stack trace:')
    })

    it('should format generic Error', () => {
      const error = new Error('Generic error message')
      const message = errorHandlerService.formatErrorMessage(error, false)

      expect(message).to.include('Error: Generic error message')
      expect(message).to.not.include('Code:')
    })

    it('should format non-Error values', () => {
      const message = errorHandlerService.formatErrorMessage('string error', false)
      expect(message).to.include('Error: string error')
    })

    it('should handle PrtError without extra context fields', () => {
      const error = new TaskNotFoundError('F-001')
      const message = errorHandlerService.formatErrorMessage(error, true)

      expect(message).to.include('Error:')
      expect(message).to.include('Code: PRT_TASK_NOT_FOUND')
      // TaskNotFoundError always includes taskId in context
      expect(message).to.include('Context:')
      expect(message).to.include('taskId')
    })
  })

  describe('handleError', () => {
    it('should return NOT_FOUND for ConfigNotFoundError', () => {
      const error = new ConfigNotFoundError('/path/to/config')
      const exitCode = errorHandlerService.handleError(error)
      expect(exitCode).to.equal(ExitCodes.NOT_FOUND)
    })

    it('should return NOT_FOUND for RoadmapNotFoundError', () => {
      const error = new RoadmapNotFoundError('/path/to/roadmap.json')
      const exitCode = errorHandlerService.handleError(error)
      expect(exitCode).to.equal(ExitCodes.NOT_FOUND)
    })

    it('should return NOT_FOUND for TaskNotFoundError', () => {
      const error = new TaskNotFoundError('F-001')
      const exitCode = errorHandlerService.handleError(error)
      expect(exitCode).to.equal(ExitCodes.NOT_FOUND)
    })

    it('should return VALIDATION_ERROR for InvalidTaskError', () => {
      const error = new InvalidTaskError('Invalid task data')
      const exitCode = errorHandlerService.handleError(error)
      expect(exitCode).to.equal(ExitCodes.VALIDATION_ERROR)
    })

    it('should return VALIDATION_ERROR for ValidationError', () => {
      const error = new ValidationError([
        {
          message: 'Validation failed',
          type: 'invalid-value',
        },
      ])
      const exitCode = errorHandlerService.handleError(error)
      expect(exitCode).to.equal(ExitCodes.VALIDATION_ERROR)
    })

    it('should return DEPENDENCY_ERROR for CircularDependencyError', () => {
      const error = new CircularDependencyError(['F-001', 'F-002', 'F-001'])
      const exitCode = errorHandlerService.handleError(error)
      expect(exitCode).to.equal(ExitCodes.DEPENDENCY_ERROR)
    })

    it('should return GENERAL_ERROR for generic Error', () => {
      const error = new Error('Generic error')
      const exitCode = errorHandlerService.handleError(error)
      expect(exitCode).to.equal(ExitCodes.GENERAL_ERROR)
    })

    it('should return GENERAL_ERROR for non-Error values', () => {
      const exitCode = errorHandlerService.handleError('string error')
      expect(exitCode).to.equal(ExitCodes.GENERAL_ERROR)
    })
  })

  describe('isRecoverableError', () => {
    it('should return false for PrtError', () => {
      const error = new ConfigNotFoundError('/path/to/config')
      expect(errorHandlerService.isRecoverableError(error)).to.be.false
    })

    it('should return false for generic Error', () => {
      const error = new Error('Generic error')
      expect(errorHandlerService.isRecoverableError(error)).to.be.false
    })

    it('should return false for non-Error values', () => {
      expect(errorHandlerService.isRecoverableError('string error')).to.be.false
    })
  })
})
