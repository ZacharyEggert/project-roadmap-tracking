import {expect} from 'chai'

import {validateTaskID} from '../../../src/util/validate-task-id.js'

describe('validateTaskID', () => {
  describe('valid task IDs', () => {
    it('should accept valid format B-001', () => {
      expect(() => validateTaskID('B-001')).to.not.throw()
    })

    it('should accept valid format F-042', () => {
      expect(() => validateTaskID('F-042')).to.not.throw()
    })

    it('should accept valid format I-999', () => {
      expect(() => validateTaskID('I-999')).to.not.throw()
    })

    it('should accept valid format P-003', () => {
      expect(() => validateTaskID('P-003')).to.not.throw()
    })

    it('should accept valid format R-001', () => {
      expect(() => validateTaskID('R-001')).to.not.throw()
    })

    it('should accept boundary number 000', () => {
      expect(() => validateTaskID('B-000')).to.not.throw()
    })

    it('should accept boundary number 001', () => {
      expect(() => validateTaskID('F-001')).to.not.throw()
    })

    it('should accept boundary number 999', () => {
      expect(() => validateTaskID('P-999')).to.not.throw()
    })

    it('should accept middle value I-500', () => {
      expect(() => validateTaskID('I-500')).to.not.throw()
    })

    it('should accept R-123', () => {
      expect(() => validateTaskID('R-123')).to.not.throw()
    })
  })

  describe('invalid task IDs', () => {
    it('should reject missing dash B001', () => {
      expect(() => validateTaskID('B001')).to.throw('task ID B001 is not valid')
    })

    it('should reject missing dash F042', () => {
      expect(() => validateTaskID('F042')).to.throw('task ID F042 is not valid')
    })

    it('should reject wrong prefix A-001', () => {
      expect(() => validateTaskID('A-001')).to.throw('task ID A-001 is not valid')
    })

    it('should reject wrong prefix Z-001', () => {
      expect(() => validateTaskID('Z-001')).to.throw('task ID Z-001 is not valid')
    })

    it('should reject wrong prefix X-042', () => {
      expect(() => validateTaskID('X-042')).to.throw('task ID X-042 is not valid')
    })

    it('should reject lowercase prefix b-001', () => {
      expect(() => validateTaskID('b-001')).to.throw('task ID b-001 is not valid')
    })

    it('should reject lowercase prefix f-042', () => {
      expect(() => validateTaskID('f-042')).to.throw('task ID f-042 is not valid')
    })

    it('should reject non-numeric suffix B-ABC', () => {
      expect(() => validateTaskID('B-ABC')).to.throw('task ID B-ABC is not valid')
    })

    it('should reject non-numeric suffix F-1A2', () => {
      expect(() => validateTaskID('F-1A2')).to.throw('task ID F-1A2 is not valid')
    })

    it('should reject too few digits B-1', () => {
      expect(() => validateTaskID('B-1')).to.throw('task ID B-1 is not valid')
    })

    it('should reject too few digits F-42', () => {
      expect(() => validateTaskID('F-42')).to.throw('task ID F-42 is not valid')
    })

    it('should reject too many digits B-0001', () => {
      expect(() => validateTaskID('B-0001')).to.throw('task ID B-0001 is not valid')
    })

    it('should reject too many digits F-1234', () => {
      expect(() => validateTaskID('F-1234')).to.throw('task ID F-1234 is not valid')
    })

    it('should reject empty string', () => {
      expect(() => validateTaskID('')).to.throw('task ID  is not valid')
    })

    it('should reject just prefix B-', () => {
      expect(() => validateTaskID('B-')).to.throw('task ID B- is not valid')
    })

    it('should reject just number -001', () => {
      expect(() => validateTaskID('-001')).to.throw('task ID -001 is not valid')
    })

    it('should reject completely invalid string "invalid"', () => {
      expect(() => validateTaskID('invalid')).to.throw('task ID invalid is not valid')
    })

    it('should reject number only "123"', () => {
      expect(() => validateTaskID('123')).to.throw('task ID 123 is not valid')
    })
  })

  describe('edge cases', () => {
    it('should reject leading whitespace " B-001"', () => {
      expect(() => validateTaskID(' B-001')).to.throw('task ID  B-001 is not valid')
    })

    it('should reject trailing whitespace "B-001 "', () => {
      expect(() => validateTaskID('B-001 ')).to.throw('task ID B-001  is not valid')
    })

    it('should reject whitespace in middle "B- 001"', () => {
      expect(() => validateTaskID('B- 001')).to.throw('task ID B- 001 is not valid')
    })

    it('should reject special characters "B-00!"', () => {
      expect(() => validateTaskID('B-00!')).to.throw('task ID B-00! is not valid')
    })

    it('should reject multiple dashes "B--001"', () => {
      expect(() => validateTaskID('B--001')).to.throw('task ID B--001 is not valid')
    })

    it('should reject forward slash "B/001"', () => {
      expect(() => validateTaskID('B/001')).to.throw('task ID B/001 is not valid')
    })

    it('should reject negative number "B--001"', () => {
      expect(() => validateTaskID('B--001')).to.throw('task ID B--001 is not valid')
    })
  })
})
