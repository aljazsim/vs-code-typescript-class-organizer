# TypeScript Class Organizer for VS Code

Keeps your TypeScript code organized by grouping and ordering class members.

## Features
Organize currently opened TypeScript file or all TypeScript files in your project.

![TypeScript Class Organizer](./doc/demo1.gif "TypeScript Class Organizer")

## Usage

### Command Palette
From the command palette you can:

* organize current TypeScript file by invoking command "TypeScript Class Organizer: Organize Current File",
* organize all TypeScript files in the project by invoking command "TypeScript Class Organizer: Organize All Files"

![Command Palette](./doc/command_palette.png "Command Palette")

### Shortcuts

You can invoke command "TypeScript Class Organizer: Organize Current File" by using the shortcut Ctr + Shift + O. You can change the shortcut by assigning a different shortcut to command "tsco.organize".

![Shortcut](./doc/shortcut.png "Shortcut")

### Context menu

You can invoke command "TypeScript Class Organizer: Organize Current File" by using the context menu item.

![Context Menu](./doc/context_menu.png "Context Menu")


## Configuration

Extensions supports the following configuration options:

* `tsco.useRegions`: When true regions surounding member groups are added.

## Change log

### 1.0.0

Initial release.