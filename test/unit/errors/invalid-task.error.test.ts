import {expect} from 'chai'

import {InvalidTaskError, PrtError, PrtErrorCode} from '../../../src/errors/index.js'

describe('InvalidTaskError', () => {
  describe('constructor', () => {
    it('should create error with message only', () => {
      const error = new InvalidTaskError('Task validation failed')

      expect(error).to.be.instanceOf(Error)
      expect(error).to.be.instanceOf(PrtError)
      expect(error).to.be.instanceOf(InvalidTaskError)
      expect(error.message).to.equal('Task validation failed')
      expect(error.code).to.equal(PrtErrorCode.PRT_TASK_INVALID)
      expect(error.name).to.equal('InvalidTaskError')
      expect(error.context).to.deep.equal({})
    })

    it('should create error with message and taskId', () => {
      const error = new InvalidTaskError('Invalid priority', 'F-001')

      expect(error.message).to.equal('Invalid priority')
      expect(error.context).to.deep.equal({
        taskId: 'F-001',
      })
    })

    it('should create error with message, taskId, and validationField', () => {
      const error = new InvalidTaskError('Invalid priority value', 'F-001', 'priority')

      expect(error.message).to.equal('Invalid priority value')
      expect(error.context).to.deep.equal({
        taskId: 'F-001',
        validationField: 'priority',
      })
    })

    it('should not include undefined fields in context', () => {
      const error = new InvalidTaskError('Task validation failed', undefined, 'status')

      expect(error.context).to.deep.equal({
        validationField: 'status',
      })
      expect(error.context).to.not.have.property('taskId')
    })

    it('should preserve stack trace', () => {
      const error = new InvalidTaskError('Test error', 'F-001')

      expect(error.stack).to.be.a('string')
      expect(error.stack).to.include('InvalidTaskError')
    })
  })
})
