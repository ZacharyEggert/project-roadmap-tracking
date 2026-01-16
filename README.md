# project-roadmap-tracking

CLI based project task tracking

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/project-roadmap-tracking.svg)](https://npmjs.org/package/project-roadmap-tracking)
[![Downloads/week](https://img.shields.io/npm/dw/project-roadmap-tracking.svg)](https://npmjs.org/package/project-roadmap-tracking)

<!-- toc -->
* [project-roadmap-tracking](#project-roadmap-tracking)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g project-roadmap-tracking
$ prt COMMAND
running command...
$ prt (--version)
project-roadmap-tracking/0.1.0 darwin-arm64 node-v25.2.1
$ prt --help [COMMAND]
USAGE
  $ prt COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`prt add TITLE`](#prt-add-title)
* [`prt complete TASKID`](#prt-complete-taskid)
* [`prt help [COMMAND]`](#prt-help-command)
* [`prt init [FOLDER]`](#prt-init-folder)
* [`prt list`](#prt-list)
* [`prt pass-test TASKID`](#prt-pass-test-taskid)
* [`prt plugins`](#prt-plugins)
* [`prt plugins add PLUGIN`](#prt-plugins-add-plugin)
* [`prt plugins:inspect PLUGIN...`](#prt-pluginsinspect-plugin)
* [`prt plugins install PLUGIN`](#prt-plugins-install-plugin)
* [`prt plugins link PATH`](#prt-plugins-link-path)
* [`prt plugins remove [PLUGIN]`](#prt-plugins-remove-plugin)
* [`prt plugins reset`](#prt-plugins-reset)
* [`prt plugins uninstall [PLUGIN]`](#prt-plugins-uninstall-plugin)
* [`prt plugins unlink [PLUGIN]`](#prt-plugins-unlink-plugin)
* [`prt plugins update`](#prt-plugins-update)
* [`prt show TASK`](#prt-show-task)
* [`prt update TASKID`](#prt-update-taskid)
* [`prt validate`](#prt-validate)

## `prt add TITLE`

add a new task to the roadmap

```
USAGE
  $ prt add TITLE -d <value> -t bug|feature|improvement|planning|research [-p high|medium|low] [-s
    not-started|in-progress|completed] [-g <value>]

ARGUMENTS
  TITLE  title of the task to add

FLAGS
  -d, --details=<value>    (required) description of the task to add
  -g, --tags=<value>       comma-separated list of tags to add to the task
  -p, --priority=<option>  [default: medium] priority of the task to add
                           <options: high|medium|low>
  -s, --status=<option>    [default: not-started] status of the task to add
                           <options: not-started|in-progress|completed>
  -t, --type=<option>      (required) type of the task to add
                           <options: bug|feature|improvement|planning|research>

DESCRIPTION
  add a new task to the roadmap

EXAMPLES
  $ prt add
```

_See code: [src/commands/add.ts](https://github.com/ZacharyEggert/project-roadmap-tracking/blob/v0.1.0/src/commands/add.ts)_

## `prt complete TASKID`

Mark a task as completed

```
USAGE
  $ prt complete TASKID [-t]

ARGUMENTS
  TASKID  ID of the task to complete

FLAGS
  -t, --tests  mark task as passes-tests

DESCRIPTION
  Mark a task as completed

EXAMPLES
  $ prt complete F-001 --tests
```

_See code: [src/commands/complete.ts](https://github.com/ZacharyEggert/project-roadmap-tracking/blob/v0.1.0/src/commands/complete.ts)_

## `prt help [COMMAND]`

Display help for prt.

```
USAGE
  $ prt help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for prt.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.36/src/commands/help.ts)_

## `prt init [FOLDER]`

initialize a new project roadmap (prt.json and prt.config.json)

```
USAGE
  $ prt init [FOLDER] [-d <value>] [-f] [-n <value>] [--withSampleTasks]

ARGUMENTS
  [FOLDER]  folder to initialize the project roadmap in

FLAGS
  -d, --description=<value>  description to print
  -f, --force                force initialization even if files already exist
  -n, --name=<value>         name to print
      --withSampleTasks      include sample tasks in the initialized roadmap

DESCRIPTION
  initialize a new project roadmap (prt.json and prt.config.json)

EXAMPLES
  $ prt init [path/to/directory]
```

_See code: [src/commands/init.ts](https://github.com/ZacharyEggert/project-roadmap-tracking/blob/v0.1.0/src/commands/init.ts)_

## `prt list`

list tasks in the project roadmap

```
USAGE
  $ prt list [-i] [-p high|medium|low|h|m|l] [-o dueDate|priority|createdAt] [-s
    completed|in-progress|not-started]

FLAGS
  -i, --incomplete         filter tasks to show in-progress and not-started only
  -o, --sort=<option>      sort tasks by field (dueDate, priority, createdAt)
                           <options: dueDate|priority|createdAt>
  -p, --priority=<option>  filter tasks by priority (high, medium, low)
                           <options: high|medium|low|h|m|l>
  -s, --status=<option>    filter tasks by status (completed, in-progress, not-started)
                           <options: completed|in-progress|not-started>

DESCRIPTION
  list tasks in the project roadmap

EXAMPLES
  $ prt list -p=h --incomplete --sort=createdAt
```

_See code: [src/commands/list.ts](https://github.com/ZacharyEggert/project-roadmap-tracking/blob/v0.1.0/src/commands/list.ts)_

## `prt pass-test TASKID`

Mark a task as passes-tests

```
USAGE
  $ prt pass-test TASKID

ARGUMENTS
  TASKID  ID of the task to mark as passing tests

DESCRIPTION
  Mark a task as passes-tests

EXAMPLES
  $ prt pass-test F-001
```

_See code: [src/commands/pass-test.ts](https://github.com/ZacharyEggert/project-roadmap-tracking/blob/v0.1.0/src/commands/pass-test.ts)_

## `prt plugins`

List installed plugins.

```
USAGE
  $ prt plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ prt plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/index.ts)_

## `prt plugins add PLUGIN`

Installs a plugin into prt.

```
USAGE
  $ prt plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into prt.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the PRT_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the PRT_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ prt plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ prt plugins add myplugin

  Install a plugin from a github url.

    $ prt plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ prt plugins add someuser/someplugin
```

## `prt plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ prt plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ prt plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/inspect.ts)_

## `prt plugins install PLUGIN`

Installs a plugin into prt.

```
USAGE
  $ prt plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into prt.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the PRT_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the PRT_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ prt plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ prt plugins install myplugin

  Install a plugin from a github url.

    $ prt plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ prt plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/install.ts)_

## `prt plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ prt plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ prt plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/link.ts)_

## `prt plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ prt plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ prt plugins unlink
  $ prt plugins remove

EXAMPLES
  $ prt plugins remove myplugin
```

## `prt plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ prt plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/reset.ts)_

## `prt plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ prt plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ prt plugins unlink
  $ prt plugins remove

EXAMPLES
  $ prt plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/uninstall.ts)_

## `prt plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ prt plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ prt plugins unlink
  $ prt plugins remove

EXAMPLES
  $ prt plugins unlink myplugin
```

## `prt plugins update`

Update installed plugins.

```
USAGE
  $ prt plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/update.ts)_

## `prt show TASK`

show details of a specific task in the project roadmap

```
USAGE
  $ prt show TASK

ARGUMENTS
  TASK  task ID to show

DESCRIPTION
  show details of a specific task in the project roadmap

EXAMPLES
  $ prt show F-001
```

_See code: [src/commands/show.ts](https://github.com/ZacharyEggert/project-roadmap-tracking/blob/v0.1.0/src/commands/show.ts)_

## `prt update TASKID`

Update a task in place

```
USAGE
  $ prt update TASKID [--clear-notes] [-d <value>] [-n <value>] [-s completed|in-progress|not-started] [-t
    true|false]

ARGUMENTS
  TASKID  ID of the task to update

FLAGS
  -d, --deps=<value>     update the dependencies of the task (comma-separated list of task IDs)
  -n, --notes=<value>    append notes to the task
  -s, --status=<option>  set the status of the task (completed, in-progress, not-started)
                         <options: completed|in-progress|not-started>
  -t, --tested=<option>  update whether the task passes tests
                         <options: true|false>
      --clear-notes      clear all notes from the task

DESCRIPTION
  Update a task in place

EXAMPLES
  $ prt update F-001 --status=completed --tested=true --notes="Fixed all bugs"

  $ prt update F-002 --deps="F-001" --clear-notes
```

_See code: [src/commands/update.ts](https://github.com/ZacharyEggert/project-roadmap-tracking/blob/v0.1.0/src/commands/update.ts)_

## `prt validate`

describe the command here

```
USAGE
  $ prt validate

DESCRIPTION
  describe the command here

EXAMPLES
  $ prt validate
```

_See code: [src/commands/validate.ts](https://github.com/ZacharyEggert/project-roadmap-tracking/blob/v0.1.0/src/commands/validate.ts)_
<!-- commandsstop -->
