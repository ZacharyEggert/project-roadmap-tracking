import {expect} from 'chai'

import {PrtError, PrtErrorCode, TaskNotFoundError} from '../../../src/errors/index.js'

describe('TaskNotFoundError', () => {
  describe('constructor', () => {
    it('should create error with taskId only', () => {
      const error = new TaskNotFoundError('F-001')

      expect(error).to.be.instanceOf(Error)
      expect(error).to.be.instanceOf(PrtError)
      expect(error).to.be.instanceOf(TaskNotFoundError)
      expect(error.message).to.equal('Task not found: F-001')
      expect(error.code).to.equal(PrtErrorCode.PRT_TASK_NOT_FOUND)
      expect(error.name).to.equal('TaskNotFoundError')
    })

    it('should include taskId in context', () => {
      const error = new TaskNotFoundError('F-001')

      expect(error.context).to.deep.equal({
        taskId: 'F-001',
      })
    })

    it('should include roadmapPath in context when provided', () => {
      const error = new TaskNotFoundError('F-001', '/path/to/prt.json')

      expect(error.context).to.deep.equal({
        roadmapPath: '/path/to/prt.json',
        taskId: 'F-001',
      })
    })

    it('should not include roadmapPath in context when not provided', () => {
      const error = new TaskNotFoundError('F-001')

      expect(error.context).to.not.have.property('roadmapPath')
    })

    it('should preserve stack trace', () => {
      const error = new TaskNotFoundError('F-001')

      expect(error.stack).to.be.a('string')
      expect(error.stack).to.include('TaskNotFoundError')
    })

    it('should handle different task ID formats', () => {
      const error1 = new TaskNotFoundError('B-042')
      const error2 = new TaskNotFoundError('I-999')
      const error3 = new TaskNotFoundError('P-003')

      expect(error1.message).to.equal('Task not found: B-042')
      expect(error2.message).to.equal('Task not found: I-999')
      expect(error3.message).to.equal('Task not found: P-003')
    })
  })
})
