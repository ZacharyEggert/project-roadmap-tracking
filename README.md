project-roadmap-tracking
=================

CLI based project task tracking


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/project-roadmap-tracking.svg)](https://npmjs.org/package/project-roadmap-tracking)
[![Downloads/week](https://img.shields.io/npm/dw/project-roadmap-tracking.svg)](https://npmjs.org/package/project-roadmap-tracking)


<!-- toc -->
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
project-roadmap-tracking/0.0.0 darwin-arm64 node-v25.2.1
$ prt --help [COMMAND]
USAGE
  $ prt COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`prt hello PERSON`](#prt-hello-person)
* [`prt hello world`](#prt-hello-world)
* [`prt help [COMMAND]`](#prt-help-command)
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

## `prt hello PERSON`

Say hello

```
USAGE
  $ prt hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ prt hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/ZacharyEggert/project-roadmap-tracking/blob/v0.0.0/src/commands/hello/index.ts)_

## `prt hello world`

Say hello world

```
USAGE
  $ prt hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ prt hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/ZacharyEggert/project-roadmap-tracking/blob/v0.0.0/src/commands/hello/world.ts)_

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
<!-- commandsstop -->
