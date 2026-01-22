import {expect} from 'chai'

import {ConfigNotFoundError, PrtError, PrtErrorCode} from '../../../src/errors/index.js'

describe('ConfigNotFoundError', () => {
  describe('constructor', () => {
    it('should create error with default filePath', () => {
      const error = new ConfigNotFoundError()

      expect(error).to.be.instanceOf(Error)
      expect(error).to.be.instanceOf(PrtError)
      expect(error).to.be.instanceOf(ConfigNotFoundError)
      expect(error.message).to.equal('Config file not found: .prtrc.json')
      expect(error.code).to.equal(PrtErrorCode.PRT_FILE_CONFIG_NOT_FOUND)
      expect(error.name).to.equal('ConfigNotFoundError')
    })

    it('should create error with custom filePath', () => {
      const error = new ConfigNotFoundError('/custom/path/.prtrc.json')

      expect(error.message).to.equal('Config file not found: /custom/path/.prtrc.json')
    })

    it('should include filePath in context', () => {
      const error = new ConfigNotFoundError('.prtrc.json')

      expect(error.context).to.deep.equal({
        filePath: '.prtrc.json',
      })
    })

    it('should include cause in context when provided', () => {
      const cause = new Error('ENOENT: no such file or directory')
      const error = new ConfigNotFoundError('.prtrc.json', cause)

      expect(error.context).to.deep.equal({
        cause: 'ENOENT: no such file or directory',
        filePath: '.prtrc.json',
      })
    })

    it('should not include cause in context when not provided', () => {
      const error = new ConfigNotFoundError()

      expect(error.context).to.not.have.property('cause')
    })

    it('should preserve stack trace', () => {
      const error = new ConfigNotFoundError()

      expect(error.stack).to.be.a('string')
      expect(error.stack).to.include('ConfigNotFoundError')
    })
  })
})
