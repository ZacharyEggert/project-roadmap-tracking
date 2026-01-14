import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('pass-test', () => {
  it('runs pass-test cmd', async () => {
    const {stdout} = await runCommand('pass-test')
    expect(stdout).to.contain('hello world')
  })

  it('runs pass-test --name oclif', async () => {
    const {stdout} = await runCommand('pass-test --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
