import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('complete', () => {
  it('runs complete cmd', async () => {
    const {stdout} = await runCommand('complete')
    expect(stdout).to.contain('hello world')
  })

  it('runs complete --name oclif', async () => {
    const {stdout} = await runCommand('complete --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
