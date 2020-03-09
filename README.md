# TypeScript Class Organizer for VS Code

VS Code extension for keeping your TypeScript code organized by grouping and ordering class members.

## Features

Organize currently opened TypeScript file or all TypeScript files in your project.

![TypeScript Class Organizer](./doc/demo1.gif "TypeScript Class Organizer")

## Usage

### Command Palette

From the command palette you can:

- organize current TypeScript file by invoking command "TypeScript Class Organizer: Organize Current File",
- organize all TypeScript files in the project by invoking command "TypeScript Class Organizer: Organize All Files"

![Command Palette](./doc/command_palette.png "Command Palette")

### Shortcuts

You can invoke command "TypeScript Class Organizer: Organize Current File" by using the shortcut Ctr + Shift + O. You can change the shortcut by assigning a different shortcut to command "tsco.organize".

![Shortcut](./doc/shortcut.png "Shortcut")

### Context menu

You can invoke command "TypeScript Class Organizer: Organize Current File" by using the context menu item.

![Context Menu](./doc/context_menu.png "Context Menu")

## Configuration

Extensions supports the following configuration options:

- `tsco.useRegions`: When true regions surrounding member groups are added. True by default.
- `tsco.addPublicModifierIfMissing`: When true public access modifier is added. True by default.
- `tsco.addRegionIndentation`: When true regions are indented with class members. True by default.
- `tsco.addRegionCaptionToRegionEnd`: When true region caption is added to region end as well. True by default.
- `tsco.groupPropertiesWithDecorators`: When true properties with decorators will come first. False by default.
- `tsco.addRowNumberInRegionName`: When true region children count added on title. True by default.
- `tsco.accessorsBeforeCtor`: When true put accessor before ctor during organization. False by default.
- `tsco.memberOrder`: Configuration of grouping and ordering of members.
- `tsco.treatArrowFunctionPropertiesAsMethods`: When true arrow function properties will be treated as methods.

### Configuration of grouping and ordering of members

By default members are grouped and ordered in the following way:

- properties,
  - private static const properties,
  - private const properties,
  - private static readonly properties,
  - private readonly properties,
  - private static properties,
  - private properties,
  - protected static const properties,
  - protected const properties,
  - protected static readonly properties,
  - protected readonly properties,
  - protected static properties,
  - protected properties,
  - public static const properties,
  - public const properties,
  - public static readonly properties,
  - public readonly properties,
  - public static properties,
  - public properties,
- constructors,
- public static indexes,
- public indexes,
- public abstract indexes,
- protected static indexes,
- protected indexes,
- protected abstract indexes,
- private static indexes,
- private indexes,
- private abstract indexes,
- public static accessors,
- public accessors,
- public abstract accessors,
- protected static accessors,
- protected accessors,
- protected abstract accessors,
- private static accessors,
- private accessors,
- private abstract accessors,
- public static methods,
- public methods,
- public abstract methods,
- protected static methods,
- protected methods,
- protected abstract methods,
- private static methods,
- private methods,
- private abstract methods.

This configuration can ge changed by using the `tsco.memberOrder` setting in settings.json. Members can be grouped separately or grouped together with other member groups in a two level hierarchy. Every group has a property:

- `caption` (only for top level groups): the caption will be outputted if `tsco.useRegions` is set to true,
- `memberType` (top and bottom level groups): the type of the member in the group (privateStaticConstProperties, privateConstProperties, privateStaticReadOnlyProperties, privateReadOnlyProperties, privateStaticProperties, privateProperties, protectedStaticConstProperties, protectedConstProperties, protectedStaticReadOnlyProperties, protectedReadOnlyProperties, protectedStaticProperties, protectedProperties, publicStaticConstProperties, publicConstProperties, publicStaticReadOnlyProperties, publicReadOnlyProperties, publicStaticProperties, publicProperties, constructors, publicStaticIndexes, publicIndexes,
  publicAbstractIndexes, protectedStaticIndexes, protectedIndexes, protectedAbstractIndexes, privateStaticIndexes, privateIndexes, privateAbstractIndexes, publicStaticMethods, publicMethods, publicAbstractMethods, protectedStaticMethods, protectedMethods, protectedAbstractMethods, privateStaticMethods, privateMethods, privateAbstractMethods),
- `subGroups` (only for top level groups): the array of member types to be included in this group.

Example of the default `tsco.memberOrder` setting:

```json
[
  {
    "caption": "Properties",
    "memberTypes": [
      "privateStaticConstProperties",
      "privateConstProperties",
      "privateStaticReadOnlyProperties",
      "privateReadOnlyProperties",
      "privateStaticProperties",
      "privateProperties",
      "protectedStaticConstProperties",
      "protectedConstProperties",
      "protectedStaticReadOnlyProperties",
      "protectedReadOnlyProperties",
      "protectedStaticProperties",
      "protectedProperties",
      "publicStaticConstProperties",
      "publicConstProperties",
      "publicStaticReadOnlyProperties",
      "publicReadOnlyProperties",
      "publicStaticProperties",
      "publicProperties"
    ]
  },
  {
    "caption": "Constructors",
    "memberTypes": ["constructors"]
  },
  {
    "caption": "Public Static Indexers",
    "memberTypes": ["publicStaticIndexes"]
  },
  {
    "caption": "Public Indexers",
    "memberTypes": ["publicIndexes"]
  },
  {
    "caption": "Public Abstract Indexers",
    "memberTypes": ["publicAbstractIndexes"]
  },
  {
    "caption": "Protected Static Indexers",
    "memberTypes": ["protectedStaticIndexes"]
  },
  {
    "caption": "Protected Indexers",
    "memberTypes": ["protectedIndexes"]
  },
  {
    "caption": "Protected Abstract Indexers",
    "memberTypes": ["protectedAbstractIndexes"]
  },
  {
    "caption": "Private Static Indexers",
    "memberTypes": ["privateStaticIndexes"]
  },
  {
    "caption": "Private Indexers",
    "memberTypes": ["privateIndexes"]
  },
  {
    "caption": "Private Abstract Indexers",
    "memberTypes": ["privateAbstractIndexes"]
  },
  {
    "caption": "Public Static Accessors",
    "memberTypes": ["publicStaticGettersAndSetters"]
  },
  {
    "caption": "Public Accessors",
    "memberTypes": ["publicGettersAndSetters"]
  },
  {
    "caption": "Public Abstract Accessors",
    "memberTypes": ["publicAbstractGettersAndSetters"]
  },
  {
    "caption": "Protected Static Accessors",
    "memberTypes": ["protectedStaticGettersAndSetters"]
  },
  {
    "caption": "Protected Accessors",
    "memberTypes": ["protectedGettersAndSetters"]
  },
  {
    "caption": "Protected Abstract Accessors",
    "memberTypes": ["protectedAbstractGettersAndSetters"]
  },
  {
    "caption": "Private Static Accessors",
    "memberTypes": ["privateStaticGettersAndSetters"]
  },
  {
    "caption": "Private Accessors",
    "memberTypes": ["privateGettersAndSetters"]
  },
  {
    "caption": "Private Abstract Accessors",
    "memberTypes": ["privateAbstractGettersAndSetters"]
  },
  {
    "caption": "Public Static Methods",
    "memberTypes": ["publicStaticMethods"]
  },
  {
    "caption": "Public Methods",
    "memberTypes": ["publicMethods"]
  },
  {
    "caption": "Public Abstract Methods",
    "memberTypes": ["publicAbstractMethods"]
  },
  {
    "caption": "Protected Static Methods",
    "memberTypes": ["protectedStaticMethods"]
  },
  {
    "caption": "Protected Methods",
    "memberTypes": ["protectedMethods"]
  },
  {
    "caption": "Protected Abstract Methods",
    "memberTypes": ["protectedAbstractMethods"]
  },
  {
    "caption": "Private Static Methods",
    "memberTypes": ["privateStaticMethods"]
  },
  {
    "caption": "Private Methods",
    "memberTypes": ["privateMethods"]
  },
  {
    "caption": "Private Abstract Methods",
    "memberTypes": ["privateAbstractMethods"]
  }
]
```

## Change log

### 1.0.0

- Initial release.

### 1.0.9

- added add public modifier if missing option
- added add region Indentation option
- added end region caption option
- added organizing type aliases, interfaces, classes and functions
- fixed issue with Indentation tabs / spaces
- fixed issue when comments were preceding class members
- fixed issue when decorators were preceding class members
- fixed issue with removing redundant empty lines
- updated referenced packages

### 1.0.10

- added group properties with decorators option

### 1.0.11

- fixed issue with duplicated regions
- addded grouping by decorator for all elements, not just properties when grouping by decorators
- added a new line between group with decorators and group without decorators when grouping by decorators

### 1.0.12

- removed limitation where extension can be activated only when not in debug mode
- fixed bug where redundant empty lines were not removed correctly
- fix bug where public access modifier was not added to methods

### 1.0.14

- added option of adding number of members within a region (courtesy of [pillont](https://github.com/pillont))
- added option to output accessors before constructor (courtesy of [pillont](https://github.com/pillont))

### 10.0.15

- add option to customize grouping and ordering of members

### 10.0.16

- fix bug where accessors (getters and setters) got removed when organizing a class

### 10.0.17

- added option to treat arrow function properties as methods (courtesy of [testpossessed](https://github.com/testpossessed))
