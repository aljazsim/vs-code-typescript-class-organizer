# TypeScript Class Organizer for VS Code

VS Code extension for keeping your TypeScript code organized by grouping and ordering class members.

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

* `tsco.useRegions`: When true regions surounding member groups are added. True by default.
* `tsco.addPublicModifierIfMissing`: When true public access modifier is added. True by default.
* `tsco.addRegionIdentation`: When true regions are idented with class members. True by default.
* `tsco.addRegionCaptionToRegionEnd`: When true region caption is added to region end as well. True by default.
* `tsco.groupPropertiesWithDecorators`: When true properties with decorators will come first. False by default.
* `tsco.addRowNumberInRegionName`: When true region children count added on title. True by default.
* `tsco.accessorsBeforeCtor`: When true put accessor before ctor during organization. False by default.
* `tsco.memberOrder`: Configuration of grouping and ordering of members.

### Configuration of grouping and ordering of members

By default members are groupped and ordered in the following way:

* properties,
  * private static const properties,
  * private const properties,
  * private static readonly properties,
  * private readonly properties,
  * private static properties,
  * private properties,
  * protected static const properties,
  * protected const properties,
  * protected static readonly properties,
  * protected readonly properties,
  * protected static properties,
  * protected properties,
  * public staticconst properties,
  * public const properties,
  * public static readonly properties,
  * public readonly properties,
  * public static properties,
  * public properties,
* constructors,
* public static indexes,
* public indexes,
* public abstract indexes,
* protected static indexes,
* protected indexes,
* protected abstract indexes,
* private static indexes,
* private indexes,
* private abstract indexes,
* public static methods,
* public methods,
* public abstract methods,
* protected static methods,
* protected methods,
* protected abstract methods,
* private static methods,
* private methods,
* private abstract methods.

This configuration can ge changed by using the `tsco.memberOrder` setting in settings.json. Members can be groupped seperately or groupped together with other member groups in a two level hierarchy. Every group has a property:

* `caption` (only for top level groups): the caption will be outputted if `tsco.useRegions` is set to true,
* `memberType` (top and bottom level groups): the type of the member in the group (privateStaticConstProperties, privateConstProperties, privateStaticReadOnlyProperties, privateReadOnlyProperties, privateStaticProperties, privateProperties, protectedStaticConstProperties, protectedConstProperties, protectedStaticReadOnlyProperties, protectedReadOnlyProperties, protectedStaticProperties, protectedProperties, publicStaticConstProperties, publicConstProperties, publicStaticReadOnlyProperties, publicReadOnlyProperties, publicStaticProperties, publicProperties, constructors, publicStaticIndexes, publicIndexes,
publicAbstractIndexes, protectedStaticIndexes, protectedIndexes, protectedAbstractIndexes, privateStaticIndexes, privateIndexes, privateAbstractIndexes, publicStaticMethods, publicMethods, publicAbstractMethods, protectedStaticMethods, protectedMethods, protectedAbstractMethods, privateStaticMethods, privateMethods, privateAbstractMethods),
* `subGroups` (only for top level groups): the array of member types to be included in this group.

Example of the default `tsco.memberOrder` setting:

``` json
[
    {
        "caption": "Properties",
        "subGroups": [
            {
                "memberType": "privateStaticConstProperties"
            },
            {
                "memberType": "privateConstProperties"
            },
            {
                "memberType": "privateStaticReadOnlyProperties"
            },
            {
                "memberType": "privateReadOnlyProperties"
            },
            {
                "memberType": "privateStaticProperties"
            },
            {
                "memberType": "privateProperties"
            },
            {
                "memberType": "protectedStaticConstProperties"
            },
            {
                "memberType": "protectedConstProperties"
            },
            {
                "memberType": "protectedStaticReadOnlyProperties"
            },
            {
                "memberType": "protectedReadOnlyProperties"
            },
            {
                "memberType": "protectedStaticProperties"
            },
            {
                "memberType": "protectedProperties"
            },
            {
                "memberType": "publicStaticConstProperties"
            },
            {
                "memberType": "publicConstProperties"
            },
            {
                "memberType": "publicStaticReadOnlyProperties"
            },
            {
                "memberType": "publicReadOnlyProperties"
            },
            {
                "memberType": "publicStaticProperties"
            },
            {
                "memberType": "publicProperties"
            }
        ]
    },
    {
        "caption": "Constructors",
        "memberType": "constructors"
    },
    {
        "caption": "Public Static Indexers",
        "memberType": "publicStaticIndexes"
    },
    {
        "caption": "Public Indexers",
        "memberType": "publicIndexes"
    },
    {
        "caption": "Public Abstract Indexers",
        "memberType": "publicAbstractIndexes"
    },
    {
        "caption": "Protected Static Indexers",
        "memberType": "protectedStaticIndexes"
    },
    {
        "caption": "Protected Indexers",
        "memberType": "protectedIndexes"
    },
    {
        "caption": "Protected Abstract Indexers",
        "memberType": "protectedAbstractIndexes"
    },
    {
        "caption": "Private Static Indexers",
        "memberType": "privateStaticIndexes"
    },
    {
        "caption": "Private Indexers",
        "memberType": "privateIndexes"
    },
    {
        "caption": "Private Abstract Indexers",
        "memberType": "privateAbstractIndexes"
    },
    {
        "caption": "Public Static Methods",
        "memberType": "publicStaticMethods"
    },
    {
        "caption": "Public Methods",
        "memberType": "publicMethods"
    },
    {
        "caption": "Public Abstract Methods",
        "memberType": "publicAbstractMethods"
    },
    {
        "caption": "Protected Static Methods",
        "memberType": "protectedStaticMethods"
    },
    {
        "caption": "Protected Methods",
        "memberType": "protectedMethods"
    },
    {
        "caption": "Protected Abstract Methods",
        "memberType": "protectedAbstractMethods"
    },
    {
        "caption": "Private Static Methods",
        "memberType": "privateStaticMethods"
    },
    {
        "caption": "Private Methods",
        "memberType": "privateMethods"
    },
    {
        "caption": "Private Abstract Methods",
        "memberType": "privateAbstractMethods"
    }
]
```

## Change log

### 1.0.0

* Initial release.

### 1.0.9

* added add public modifier if missing option
* added add region identation option
* added end region caption option
* added organiting type aliases, interfaces, classes and functions
* fixed issue with identation tabs / spaces
* fixed issue when comments were preceding class members
* fixed issue when decorators were preceding class members
* fixed issue with removing redundant empty lines
* updated referenced packages

### 1.0.10

* added group properties with decorators option

### 1.0.11

* fixed issue with duplicated regions
* addded grouping by decorator for all elements, not just properties when groupping by decorators
* added a new line between group with decorators and group without decorators when groupping by decorators

### 1.0.12

* removed limitation where extension can be activated only when not in debug mode
* fixed bug where redundant empty lines were not removed correctly
* fix bug where public access modifier was not added to methods

### 1.0.14

* added option of adding number of members within a region (courtesy of [pillont](https://github.com/pillont))
* added option to output accessors before constructor (courtesy of [pillont](https://github.com/pillont))

### 10.0.15

* add option to customize grouping and ordering of members
