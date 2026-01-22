import {expect} from 'chai'

import {PrtError, PrtErrorCode, ValidationError, ValidationErrorDetail} from '../../../src/errors/index.js'

describe('ValidationError', () => {
  describe('constructor', () => {
    it('should create error with single validation error', () => {
      const errors: ValidationErrorDetail[] = [
        {
          message: 'Task F-001 has invalid priority',
          taskId: 'F-001',
          type: 'invalid-value',
        },
      ]
      const error = new ValidationError(errors)

      expect(error).to.be.instanceOf(Error)
      expect(error).to.be.instanceOf(PrtError)
      expect(error).to.be.instanceOf(ValidationError)
      expect(error.message).to.equal('Validation failed with 1 error')
      expect(error.code).to.equal(PrtErrorCode.PRT_VALIDATION_FAILED)
      expect(error.name).to.equal('ValidationError')
    })

    it('should create error with multiple validation errors', () => {
      const errors: ValidationErrorDetail[] = [
        {
          message: 'Task F-001 has invalid priority',
          taskId: 'F-001',
          type: 'invalid-value',
        },
        {
          message: 'Task F-002 has missing field: details',
          taskId: 'F-002',
          type: 'missing-field',
        },
        {
          message: 'Task F-003 references non-existent task',
          taskId: 'F-003',
          type: 'invalid-reference',
        },
      ]
      const error = new ValidationError(errors)

      expect(error.message).to.equal('Validation failed with 3 errors')
    })

    it('should include errorCount, errors, and errorTypes in context', () => {
      const errors: ValidationErrorDetail[] = [
        {
          message: 'Error 1',
          type: 'invalid-value',
        },
        {
          message: 'Error 2',
          type: 'missing-field',
        },
        {
          message: 'Error 3',
          type: 'invalid-value',
        },
      ]
      const error = new ValidationError(errors)

      expect(error.context).to.deep.equal({
        errorCount: 3,
        errors,
        errorTypes: ['invalid-value', 'missing-field'],
      })
    })

    it('should deduplicate error types in context', () => {
      const errors: ValidationErrorDetail[] = [
        {message: 'Error 1', type: 'invalid-value'},
        {message: 'Error 2', type: 'invalid-value'},
        {message: 'Error 3', type: 'invalid-value'},
      ]
      const error = new ValidationError(errors)

      expect(error.context?.errorTypes).to.deep.equal(['invalid-value'])
    })

    it('should handle validation errors without taskId or field', () => {
      const errors: ValidationErrorDetail[] = [
        {
          message: 'Roadmap structure is invalid',
          type: 'missing-field',
        },
      ]
      const error = new ValidationError(errors)

      expect(error.context?.errors).to.deep.equal(errors)
    })

    it('should preserve stack trace', () => {
      const errors: ValidationErrorDetail[] = [{message: 'Test error', type: 'invalid-value'}]
      const error = new ValidationError(errors)

      expect(error.stack).to.be.a('string')
      expect(error.stack).to.include('ValidationError')
    })

    it('should handle all error types', () => {
      const errors: ValidationErrorDetail[] = [
        {message: 'Missing field', type: 'missing-field'},
        {message: 'Invalid value', type: 'invalid-value'},
        {message: 'Circular dependency', type: 'circular-dependency'},
        {message: 'Invalid reference', type: 'invalid-reference'},
      ]
      const error = new ValidationError(errors)

      expect(error.context?.errorTypes).to.have.members([
        'missing-field',
        'invalid-value',
        'circular-dependency',
        'invalid-reference',
      ])
    })
  })
})
