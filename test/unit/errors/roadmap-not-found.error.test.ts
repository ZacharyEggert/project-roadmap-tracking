import {expect} from 'chai'

import {PrtError, PrtErrorCode, RoadmapNotFoundError} from '../../../src/errors/index.js'

describe('RoadmapNotFoundError', () => {
  describe('constructor', () => {
    it('should create error with filePath', () => {
      const error = new RoadmapNotFoundError('/path/to/prt.json')

      expect(error).to.be.instanceOf(Error)
      expect(error).to.be.instanceOf(PrtError)
      expect(error).to.be.instanceOf(RoadmapNotFoundError)
      expect(error.message).to.equal('Roadmap file not found: /path/to/prt.json')
      expect(error.code).to.equal(PrtErrorCode.PRT_FILE_ROADMAP_NOT_FOUND)
      expect(error.name).to.equal('RoadmapNotFoundError')
    })

    it('should include filePath in context', () => {
      const error = new RoadmapNotFoundError('/path/to/prt.json')

      expect(error.context).to.deep.equal({
        filePath: '/path/to/prt.json',
      })
    })

    it('should include cause in context when provided', () => {
      const cause = new Error('ENOENT: no such file or directory')
      const error = new RoadmapNotFoundError('/path/to/prt.json', cause)

      expect(error.context).to.deep.equal({
        cause: 'ENOENT: no such file or directory',
        filePath: '/path/to/prt.json',
      })
    })

    it('should not include cause in context when not provided', () => {
      const error = new RoadmapNotFoundError('/path/to/prt.json')

      expect(error.context).to.not.have.property('cause')
    })

    it('should preserve stack trace', () => {
      const error = new RoadmapNotFoundError('/path/to/prt.json')

      expect(error.stack).to.be.a('string')
      expect(error.stack).to.include('RoadmapNotFoundError')
    })
  })
})
