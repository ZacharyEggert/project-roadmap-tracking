import {expect} from 'chai'

import {PrtError, PrtErrorCode} from '../../../src/errors/base.error.js'

describe('PrtError', () => {
  describe('constructor', () => {
    it('should create an error with message and default code', () => {
      const error = new PrtError('Test error')

      expect(error).to.be.instanceOf(Error)
      expect(error).to.be.instanceOf(PrtError)
      expect(error.message).to.equal('Test error')
      expect(error.code).to.equal(PrtErrorCode.PRT_UNKNOWN)
      expect(error.name).to.equal('PrtError')
      expect(error.context).to.be.undefined
    })

    it('should create an error with message, code, and context', () => {
      const context = {field: 'priority', taskId: 'F-001'}
      const error = new PrtError('Test error', PrtErrorCode.PRT_TASK_INVALID, context)

      expect(error.message).to.equal('Test error')
      expect(error.code).to.equal(PrtErrorCode.PRT_TASK_INVALID)
      expect(error.context).to.deep.equal(context)
    })

    it('should maintain proper prototype chain', () => {
      const error = new PrtError('Test error')

      expect(error instanceof Error).to.be.true
      expect(error instanceof PrtError).to.be.true
    })

    it('should capture stack trace', () => {
      const error = new PrtError('Test error')

      expect(error.stack).to.be.a('string')
      expect(error.stack).to.include('PrtError')
    })

    it('should set name to constructor name for subclasses', () => {
      class CustomError extends PrtError {
        constructor(message: string) {
          super(message, PrtErrorCode.PRT_UNKNOWN)
        }
      }

      const error = new CustomError('Test')
      expect(error.name).to.equal('CustomError')
    })
  })

  describe('PrtErrorCode enum', () => {
    it('should have all expected error codes', () => {
      expect(PrtErrorCode.PRT_FILE_ROADMAP_NOT_FOUND).to.equal('PRT_FILE_ROADMAP_NOT_FOUND')
      expect(PrtErrorCode.PRT_FILE_CONFIG_NOT_FOUND).to.equal('PRT_FILE_CONFIG_NOT_FOUND')
      expect(PrtErrorCode.PRT_TASK_NOT_FOUND).to.equal('PRT_TASK_NOT_FOUND')
      expect(PrtErrorCode.PRT_TASK_INVALID).to.equal('PRT_TASK_INVALID')
      expect(PrtErrorCode.PRT_TASK_ID_INVALID).to.equal('PRT_TASK_ID_INVALID')
      expect(PrtErrorCode.PRT_VALIDATION_FAILED).to.equal('PRT_VALIDATION_FAILED')
      expect(PrtErrorCode.PRT_VALIDATION_CIRCULAR_DEPENDENCY).to.equal('PRT_VALIDATION_CIRCULAR_DEPENDENCY')
      expect(PrtErrorCode.PRT_UNKNOWN).to.equal('PRT_UNKNOWN')
    })
  })
})
