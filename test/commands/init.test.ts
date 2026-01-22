import {expect} from 'chai'
import {mkdir} from 'node:fs/promises'
import {join} from 'node:path'

import type {Config, Roadmap} from '../../src/util/types.js'

import Init from '../../src/commands/init.js'
import {PRIORITY, STATUS, TASK_TYPE} from '../../src/util/types.js'
import {assertCommandError, assertCommandSuccess, runCommand} from '../helpers/command-runner.js'
import {
  cleanupTempDir,
  createTempConfigFile,
  createTempDir,
  createTempRoadmapFile,
  fileExists,
  readTempJsonFile,
} from '../helpers/fs-helpers.js'

describe('init', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempDir('init-test-')
  })

  afterEach(async () => {
    await cleanupTempDir(tempDir)
  })

  describe('success cases', () => {
    it('should initialize roadmap in current directory', async () => {
      const result = await runCommand(Init, [], {}, tempDir)

      assertCommandSuccess(result)
      expect(result.stdout).to.include('creating project roadmap in current directory')
      expect(result.stdout).to.include('project roadmap config initialized')
      expect(result.stdout).to.include('project roadmap initialized')

      const configPath = join(tempDir, '.prtrc.json')
      const roadmapPath = join(tempDir, 'prt.json')

      expect(await fileExists(configPath)).to.be.true
      expect(await fileExists(roadmapPath)).to.be.true
    })

    it('should initialize roadmap in custom folder path', async () => {
      const customFolder = 'custom/nested/path'
      const result = await runCommand(Init, [customFolder], {}, tempDir)

      assertCommandSuccess(result)
      expect(result.stdout).to.include(`creating project roadmap in: ${customFolder}`)
      expect(result.stdout).to.include('target directory does not exist, creating')

      const configPath = join(tempDir, '.prtrc.json')
      const roadmapPath = join(tempDir, customFolder, 'prt.json')

      expect(await fileExists(configPath)).to.be.true
      expect(await fileExists(roadmapPath)).to.be.true

      // Verify config path field points to custom folder
      const config = await readTempJsonFile<Config>(configPath)
      expect(config.path).to.equal(`${customFolder}/prt.json`)
    })

    it('should initialize with custom project name', async () => {
      const customName = 'My Custom Project'
      const result = await runCommand(Init, [], {name: customName}, tempDir)

      assertCommandSuccess(result)

      const configPath = join(tempDir, '.prtrc.json')
      const roadmapPath = join(tempDir, 'prt.json')

      const config = await readTempJsonFile<Config>(configPath)
      const roadmap = await readTempJsonFile<Roadmap>(roadmapPath)

      expect(config.metadata.name).to.equal(customName)
      expect(roadmap.metadata.name).to.equal(customName)
    })

    it('should initialize with custom project description', async () => {
      const customDesc = 'Custom description for testing'
      const result = await runCommand(Init, [], {description: customDesc}, tempDir)

      assertCommandSuccess(result)

      const configPath = join(tempDir, '.prtrc.json')
      const roadmapPath = join(tempDir, 'prt.json')

      const config = await readTempJsonFile<Config>(configPath)
      const roadmap = await readTempJsonFile<Roadmap>(roadmapPath)

      expect(config.metadata.description).to.equal(customDesc)
      expect(roadmap.metadata.description).to.equal(customDesc)
    })

    it('should initialize with both name and description flags', async () => {
      const customName = 'Test Project'
      const customDesc = 'Test Description'
      const result = await runCommand(Init, [], {description: customDesc, name: customName}, tempDir)

      assertCommandSuccess(result)

      const configPath = join(tempDir, '.prtrc.json')
      const roadmapPath = join(tempDir, 'prt.json')

      const config = await readTempJsonFile<Config>(configPath)
      const roadmap = await readTempJsonFile<Roadmap>(roadmapPath)

      expect(config.metadata.name).to.equal(customName)
      expect(config.metadata.description).to.equal(customDesc)
      expect(roadmap.metadata.name).to.equal(customName)
      expect(roadmap.metadata.description).to.equal(customDesc)
    })

    it('should initialize with sample tasks when flag provided', async () => {
      const result = await runCommand(Init, [], {withSampleTasks: true}, tempDir)

      assertCommandSuccess(result)

      const roadmapPath = join(tempDir, 'prt.json')
      const roadmap = await readTempJsonFile<Roadmap>(roadmapPath)

      expect(roadmap.tasks).to.have.lengthOf(1)

      const task = roadmap.tasks[0]
      expect(task.id).to.equal('F-001')
      expect(task.title).to.equal('Sample Task')
      expect(task.details).to.equal('This is a sample task to get you started.')
      expect(task.type).to.equal(TASK_TYPE.Feature)
      expect(task.status).to.equal(STATUS.NotStarted)
      expect(task.priority).to.equal(PRIORITY.Medium)
      expect(task['passes-tests']).to.be.true
      expect(task.tags).to.deep.equal(['sample'])
      expect(task.blocks).to.be.an('array').that.is.empty
      expect(task['depends-on']).to.be.an('array').that.is.empty
      expect(task.assignedTo).to.be.null
      expect(task.dueDate).to.be.null
      expect(task.createdAt).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(task.updatedAt).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should initialize with empty tasks array by default', async () => {
      const result = await runCommand(Init, [], {}, tempDir)

      assertCommandSuccess(result)

      const roadmapPath = join(tempDir, 'prt.json')
      const roadmap = await readTempJsonFile<Roadmap>(roadmapPath)

      expect(roadmap.tasks).to.be.an('array').that.is.empty
    })

    it('should overwrite existing files when --force flag is provided', async () => {
      // First initialization with original name
      const originalName = 'Original Project'
      await runCommand(Init, [], {name: originalName}, tempDir)

      // Verify original files exist
      const configPath = join(tempDir, '.prtrc.json')
      const roadmapPath = join(tempDir, 'prt.json')
      let config = await readTempJsonFile<Config>(configPath)
      expect(config.metadata.name).to.equal(originalName)

      // Second initialization with force and updated name
      const updatedName = 'Updated Project'
      const result = await runCommand(Init, [], {force: true, name: updatedName}, tempDir)

      assertCommandSuccess(result)

      // Verify files were overwritten
      config = await readTempJsonFile<Config>(configPath)
      const roadmap = await readTempJsonFile<Roadmap>(roadmapPath)

      expect(config.metadata.name).to.equal(updatedName)
      expect(roadmap.metadata.name).to.equal(updatedName)
      expect(roadmap.tasks).to.be.an('array').that.is.empty
    })
  })

  describe('error handling', () => {
    it('should fail when prt.config.json already exists without --force', async () => {
      // Note: init command checks for 'prt.config.json' (line 114) not '.prtrc.json'
      // This appears to be a bug in the init command, but we test actual behavior
      const existingConfig: Config = {
        $schema:
          'https://raw.githubusercontent.com/ZacharyEggert/project-roadmap-tracking/refs/heads/master/schemas/config/v1.json',
        metadata: {
          description: 'Existing',
          name: 'Existing',
        },
        path: './prt.json',
      }
      await createTempConfigFile(existingConfig, tempDir, 'prt.config.json')

      const result = await runCommand(Init, [], {}, tempDir)

      assertCommandError(result, /already exist/)
      expect(result.error?.message).to.include('--force')
    })

    it('should fail when prt.json already exists in current directory without --force', async () => {
      // Create existing roadmap file
      const existingRoadmap: Roadmap = {
        $schema:
          'https://raw.githubusercontent.com/ZacharyEggert/project-roadmap-tracking/refs/heads/master/schemas/roadmap/v1.json',
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: 'test',
          description: 'Existing',
          name: 'Existing',
        },
        tasks: [],
      }
      await createTempRoadmapFile(existingRoadmap, tempDir)

      const result = await runCommand(Init, [], {}, tempDir)

      assertCommandError(result, /already exist/)
      expect(result.error?.message).to.include('--force')
    })

    it('should fail when prt.json already exists in custom folder without --force', async () => {
      const customFolder = 'custom-folder'
      const customPath = join(tempDir, customFolder)

      // Create the custom folder and roadmap file
      await mkdir(customPath, {recursive: true})
      const existingRoadmap: Roadmap = {
        $schema:
          'https://raw.githubusercontent.com/ZacharyEggert/project-roadmap-tracking/refs/heads/master/schemas/roadmap/v1.json',
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: 'test',
          description: 'Existing',
          name: 'Existing',
        },
        tasks: [],
      }
      await createTempRoadmapFile(existingRoadmap, customPath)

      const result = await runCommand(Init, [customFolder], {}, tempDir)

      assertCommandError(result, /already exists in the target directory/)
      expect(result.error?.message).to.include('--force')
    })
  })

  describe('file structure validation', () => {
    it('should create .prtrc.json with correct structure', async () => {
      const customName = 'Test Project'
      const customDesc = 'Test Description'
      await runCommand(Init, [], {description: customDesc, name: customName}, tempDir)

      const configPath = join(tempDir, '.prtrc.json')
      const config = await readTempJsonFile<Config>(configPath)

      expect(config).to.have.property('$schema')
      expect(config.$schema).to.equal(
        'https://raw.githubusercontent.com/ZacharyEggert/project-roadmap-tracking/refs/heads/master/schemas/config/v1.json',
      )
      expect(config).to.have.property('metadata')
      expect(config.metadata).to.have.property('name')
      expect(config.metadata).to.have.property('description')
      expect(config.metadata.name).to.equal(customName)
      expect(config.metadata.description).to.equal(customDesc)
      expect(config).to.have.property('path')
      expect(config.path).to.equal('./prt.json')
    })

    it('should create prt.json with correct structure', async () => {
      const customName = 'Test Project'
      const customDesc = 'Test Description'
      await runCommand(Init, [], {description: customDesc, name: customName}, tempDir)

      const roadmapPath = join(tempDir, 'prt.json')
      const roadmap = await readTempJsonFile<Roadmap>(roadmapPath)

      expect(roadmap).to.have.property('$schema')
      expect(roadmap.$schema).to.equal(
        'https://raw.githubusercontent.com/ZacharyEggert/project-roadmap-tracking/refs/heads/master/schemas/roadmap/v1.json',
      )
      expect(roadmap).to.have.property('metadata')
      expect(roadmap.metadata).to.have.property('name')
      expect(roadmap.metadata).to.have.property('description')
      expect(roadmap.metadata).to.have.property('createdBy')
      expect(roadmap.metadata).to.have.property('createdAt')
      expect(roadmap.metadata.name).to.equal(customName)
      expect(roadmap.metadata.description).to.equal(customDesc)
      expect(roadmap.metadata.createdBy).to.equal('project-roadmap-tracking CLI')
      expect(roadmap.metadata.createdAt).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(roadmap).to.have.property('tasks')
      expect(roadmap.tasks).to.be.an('array')
    })

    it('should set config path field to correct roadmap location for current dir', async () => {
      await runCommand(Init, [], {}, tempDir)

      const configPath = join(tempDir, '.prtrc.json')
      const config = await readTempJsonFile<Config>(configPath)

      expect(config.path).to.equal('./prt.json')
    })

    it('should set config path field to correct roadmap location for custom folder', async () => {
      const customFolder = 'custom-path'
      await runCommand(Init, [customFolder], {}, tempDir)

      const configPath = join(tempDir, '.prtrc.json')
      const config = await readTempJsonFile<Config>(configPath)

      expect(config.path).to.equal(`${customFolder}/prt.json`)
    })

    it('should have consistent metadata between config and roadmap files', async () => {
      const customName = 'Shared Name'
      const customDesc = 'Shared Description'
      await runCommand(Init, [], {description: customDesc, name: customName}, tempDir)

      const configPath = join(tempDir, '.prtrc.json')
      const roadmapPath = join(tempDir, 'prt.json')

      const config = await readTempJsonFile<Config>(configPath)
      const roadmap = await readTempJsonFile<Roadmap>(roadmapPath)

      expect(config.metadata.name).to.equal(roadmap.metadata.name)
      expect(config.metadata.description).to.equal(roadmap.metadata.description)
      expect(config.metadata.name).to.equal(customName)
      expect(roadmap.metadata.name).to.equal(customName)
    })

    it('should use default values when flags omitted', async () => {
      await runCommand(Init, [], {}, tempDir)

      const configPath = join(tempDir, '.prtrc.json')
      const roadmapPath = join(tempDir, 'prt.json')

      const config = await readTempJsonFile<Config>(configPath)
      const roadmap = await readTempJsonFile<Roadmap>(roadmapPath)

      expect(config.metadata.name).to.equal('My Project Roadmap')
      expect(config.metadata.description).to.equal('A project roadmap managed by Project Roadmap Tracking')
      expect(roadmap.metadata.name).to.equal('My Project Roadmap')
      expect(roadmap.metadata.description).to.equal('A project roadmap managed by Project Roadmap Tracking')
    })

    it('should create sample task with correct structure when --withSampleTasks provided', async () => {
      await runCommand(Init, [], {withSampleTasks: true}, tempDir)

      const roadmapPath = join(tempDir, 'prt.json')
      const roadmap = await readTempJsonFile<Roadmap>(roadmapPath)

      expect(roadmap.tasks).to.have.lengthOf(1)

      const task = roadmap.tasks[0]

      // Verify all required fields exist
      expect(task).to.have.property('id')
      expect(task).to.have.property('title')
      expect(task).to.have.property('details')
      expect(task).to.have.property('type')
      expect(task).to.have.property('status')
      expect(task).to.have.property('priority')
      expect(task).to.have.property('passes-tests')
      expect(task).to.have.property('tags')
      expect(task).to.have.property('blocks')
      expect(task).to.have.property('depends-on')
      expect(task).to.have.property('assignedTo')
      expect(task).to.have.property('dueDate')
      expect(task).to.have.property('createdAt')
      expect(task).to.have.property('updatedAt')

      // Verify field values
      expect(task.id).to.equal('F-001')
      expect(task.title).to.equal('Sample Task')
      expect(task.details).to.equal('This is a sample task to get you started.')
      expect(task.type).to.equal(TASK_TYPE.Feature)
      expect(task.status).to.equal(STATUS.NotStarted)
      expect(task.priority).to.equal(PRIORITY.Medium)
      expect(task['passes-tests']).to.be.true
      expect(task.tags).to.deep.equal(['sample'])
      expect(task.blocks).to.be.an('array').that.is.empty
      expect(task['depends-on']).to.be.an('array').that.is.empty
      expect(task.assignedTo).to.be.null
      expect(task.dueDate).to.be.null

      // Verify ISO 8601 timestamp format
      expect(task.createdAt).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(task.updatedAt).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })

  describe('edge cases', () => {
    it('should handle special characters in project name and description', async () => {
      const specialName = 'Project™ with émojis 🚀 and "quotes"'
      const specialDesc = 'Special: <>&"\'\n\t chars'
      const result = await runCommand(Init, [], {description: specialDesc, name: specialName}, tempDir)

      assertCommandSuccess(result)

      const configPath = join(tempDir, '.prtrc.json')
      const roadmapPath = join(tempDir, 'prt.json')

      const config = await readTempJsonFile<Config>(configPath)
      const roadmap = await readTempJsonFile<Roadmap>(roadmapPath)

      expect(config.metadata.name).to.equal(specialName)
      expect(config.metadata.description).to.equal(specialDesc)
      expect(roadmap.metadata.name).to.equal(specialName)
      expect(roadmap.metadata.description).to.equal(specialDesc)
    })

    it('should create deeply nested directories for roadmap', async () => {
      const deepPath = 'level1/level2/level3/level4'
      const result = await runCommand(Init, [deepPath], {}, tempDir)

      assertCommandSuccess(result)
      expect(result.stdout).to.include('target directory does not exist, creating')

      const roadmapPath = join(tempDir, deepPath, 'prt.json')
      expect(await fileExists(roadmapPath)).to.be.true

      const configPath = join(tempDir, '.prtrc.json')
      const config = await readTempJsonFile<Config>(configPath)
      expect(config.path).to.equal(`${deepPath}/prt.json`)
    })

    it('should handle folder paths with spaces', async () => {
      const pathWithSpaces = 'my folder/sub folder'
      const result = await runCommand(Init, [pathWithSpaces], {}, tempDir)

      assertCommandSuccess(result)

      const roadmapPath = join(tempDir, pathWithSpaces, 'prt.json')
      expect(await fileExists(roadmapPath)).to.be.true

      const configPath = join(tempDir, '.prtrc.json')
      const config = await readTempJsonFile<Config>(configPath)
      expect(config.path).to.equal(`${pathWithSpaces}/prt.json`)
    })

    it('should initialize in existing empty directory', async () => {
      const existingDir = 'existing-dir'
      const existingPath = join(tempDir, existingDir)
      await mkdir(existingPath, {recursive: true})

      const result = await runCommand(Init, [existingDir], {}, tempDir)

      assertCommandSuccess(result)

      const roadmapPath = join(existingPath, 'prt.json')
      expect(await fileExists(roadmapPath)).to.be.true
    })

    it('should handle all flags together correctly', async () => {
      const customFolder = 'custom-dir'
      const customName = 'Full Test'
      const customDesc = 'All flags test'

      const result = await runCommand(
        Init,
        [customFolder],
        {
          description: customDesc,
          force: true,
          name: customName,
          withSampleTasks: true,
        },
        tempDir,
      )

      assertCommandSuccess(result)

      const configPath = join(tempDir, '.prtrc.json')
      const roadmapPath = join(tempDir, customFolder, 'prt.json')

      expect(await fileExists(configPath)).to.be.true
      expect(await fileExists(roadmapPath)).to.be.true

      const config = await readTempJsonFile<Config>(configPath)
      const roadmap = await readTempJsonFile<Roadmap>(roadmapPath)

      expect(config.metadata.name).to.equal(customName)
      expect(config.metadata.description).to.equal(customDesc)
      expect(config.path).to.equal(`${customFolder}/prt.json`)
      expect(roadmap.metadata.name).to.equal(customName)
      expect(roadmap.metadata.description).to.equal(customDesc)
      expect(roadmap.tasks).to.have.lengthOf(1)
      expect(roadmap.tasks[0].id).to.equal('F-001')
    })
  })
})
