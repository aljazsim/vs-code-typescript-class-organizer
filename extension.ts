import { Configuration } from "./src/configuration";
import { ElementNodeGroup } from "./src/element-node-group";
import { ElementNodeGroupConfiguration } from "./src/element-node-group-configuration";
import { ClassNode } from "./src/elements/class-node";
import { ElementNode } from "./src/elements/element-node";
import { GetterNode } from "./src/elements/getter-node";
import { InterfaceNode } from "./src/elements/interface-node";
import { MethodNode } from "./src/elements/method-node";
import { PropertyNode } from "./src/elements/property-node";
import { SetterNode } from "./src/elements/setter-node";
import { UnknownNode } from "./src/elements/unknown-node";
import { MemberType } from "./src/member-type";
import { formatLines, removeRegions } from "./src/regions";
import { Transformer } from "./src/transformer";
import { compareNumbers, getClasses, getEnums, getFunctions, getImports, getInterfaces, getTypeAliases } from "./src/utils";
import * as ts from "typescript";
import * as vscode from "vscode";

let configuration = getConfiguration();

export function activate(context: vscode.ExtensionContext)
{
    context.subscriptions.push(vscode.commands.registerCommand('tsco.organize', () => organize(vscode.window.activeTextEditor, configuration)));
    context.subscriptions.push(vscode.commands.registerCommand('tsco.organizeAll', () => organizeAll(configuration)));

    vscode.workspace.onDidChangeConfiguration(e => configuration = getConfiguration())

    vscode.workspace.onWillSaveTextDocument(e =>
    {
        if (e.reason === vscode.TextDocumentSaveReason.Manual && 
            vscode.window.activeTextEditor &&
            vscode.window.activeTextEditor.document.fileName == e.document.fileName)
        {
            if (configuration.organizeOnSave)
            {
                organize(vscode.window.activeTextEditor, getConfiguration());
            }
        }
    });
}

function getConfiguration()
{
    let configuration = vscode.workspace.getConfiguration("tsco");

    return new Configuration(
        configuration.get<boolean>("useRegions") === true,
        configuration.get<boolean>("addPublicModifierIfMissing") === true,
        configuration.get<boolean>("accessorsBeforeCtor") === true,
        configuration.get<boolean>("addRowNumberInRegionName") === true,
        configuration.get<boolean>("addRegionIndentation") === true,
        configuration.get<boolean>("addRegionCaptionToRegionEnd") === true,
        configuration.get<boolean>("groupPropertiesWithDecorators") === true,
        configuration.get<boolean>("treatArrowFunctionPropertiesAsMethods") === true,
        configuration.get<boolean>("organizeOnSave") === true,
        getMemberOrderConfig());
}

function getMemberOrderConfig(): ElementNodeGroupConfiguration[]
{
    let memberTypeOrderConfiguration = vscode.workspace.getConfiguration("tsco").get<ElementNodeGroupConfiguration[]>("memberOrder") || [];
    let memberTypeOrder: ElementNodeGroupConfiguration[] = [];
    let defaultMemberTypeOrder = Object.keys(MemberType) // same order as in the enum
        .filter(x => !isNaN(parseInt(x, 10))) // do not include int value
        .map(x => <MemberType>parseInt(x, 10));

    // map member type order from configuration
    memberTypeOrderConfiguration.forEach((x: any) => memberTypeOrder.push(parseElementNodeGroupConfiguration(x)));

    // add missing member types (prevent duplicates)
    defaultMemberTypeOrder
        .filter(x => !memberTypeOrder.some(y => y.memberTypes && y.memberTypes.length > 0 && y.memberTypes.some(z => z === x)))
        .forEach(x =>
        {
            let defaultElementNodeGroupConfiguration = new ElementNodeGroupConfiguration();

            defaultElementNodeGroupConfiguration.caption = convertPascalCaseToTitleCase(MemberType[x]);
            defaultElementNodeGroupConfiguration.memberTypes = [x];

            memberTypeOrder.push(defaultElementNodeGroupConfiguration);
        });

    return memberTypeOrder;
}

function convertPascalCaseToTitleCase(value: string)
{
    if (value &&
        value.length > 1)
    {
        value = value.replace(/(?:^|\.?)([A-Z])/g, (x, y) => " " + y);
    }

    return value;
}

function parseElementNodeGroupConfiguration(x: any)
{
    let elementNodeGroupConfiguration = new ElementNodeGroupConfiguration();

    elementNodeGroupConfiguration.caption = x.caption;
    elementNodeGroupConfiguration.memberTypes = (x.memberTypes as string[]).map(y => MemberType[y as keyof typeof MemberType]);

    return elementNodeGroupConfiguration;
}

function getIndentation(sourceCode: string): string
{
    let tab = "\t";
    let twoSpaces = "  ";
    let fourSpaces = "    ";

    for (const sourceCodeLine of sourceCode.split("\n"))
    {
        if (sourceCodeLine.startsWith(tab))
        {
            return tab;
        }
        else if (sourceCodeLine.startsWith(fourSpaces))
        {
            return fourSpaces;
        }
        else if (sourceCodeLine.startsWith(twoSpaces))
        {
            return twoSpaces;
        }
    }

    return twoSpaces;
}

function organizeAll(configuration: Configuration)
{
    vscode.workspace.findFiles("**/*.ts", "**/node_modules/**")
        .then(typescriptFiles => typescriptFiles.forEach(typescriptFile => vscode.workspace.openTextDocument(typescriptFile)
            .then(document => vscode.window.showTextDocument(document)
                .then(editor => organize(editor, configuration) !== null))));

}

function organize(editor: vscode.TextEditor | undefined, configuration: Configuration)
{
    let edit: vscode.WorkspaceEdit;
    let start: vscode.Position;
    let end: vscode.Position;
    let range: vscode.Range;

    if (editor)
    {
        let sourceCode = editor.document.getText();
        let fileName = editor.document.fileName;

        sourceCode = organizeTypes(sourceCode, fileName, configuration);

        start = new vscode.Position(0, 0);
        end = new vscode.Position(editor.document.lineCount, editor.document.lineAt(editor.document.lineCount - 1).text.length);
        range = new vscode.Range(start, end);

        edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, range, sourceCode);

        return vscode.workspace.applyEdit(edit);
    }
}

function print(groups: ElementNodeGroup[], sourceCode: string, start: number, end: number, IndentationLevel: number, addRowNumberInRegionName: boolean, addPublicModifierIfMissing: boolean, addRegionIndentation: boolean, Indentation: string, addRegionCaptionToRegionEnd: boolean, groupElementsWithDecorators: boolean, treatArrowFunctionPropertiesAsMethods: boolean)
{
    let sourceCode2: string;
    let count = 0;
    let members = "";
    let newLine = "\r\n";
    let nodeGroups: ElementNode[][] = [];

    for (let group of groups)
    {
        if (group.nodes &&
            group.nodes.length > 0)
        {
            count = group.nodes.length;
            nodeGroups = [group.nodes];
        }
        else if (group.nodeSubGroups &&
            group.nodeSubGroups.length > 0)
        {
            count = group.nodeSubGroups.reduce((sum, x) => sum + x.nodes.length, 0);
            nodeGroups = group.nodeSubGroups.map(x => x.nodes).filter(x => x.length > 0);
        }
        else
        {
            count = 0;
            nodeGroups = [];
        }

        if (count > 0)
        {
            if (group.isRegion)
            {
                members += newLine;
                members += `${addRegionIndentation ? Indentation : ""}// #region`;
                members += group.caption ? ` ${group.caption}` : "";
                members += addRowNumberInRegionName ? ` (${count})` : "";
                members += newLine;
            }

            members += newLine;

            for (let nodeGroup of nodeGroups)
            {
                for (let i = 0; i < nodeGroup.length; i++)
                {
                    const node = nodeGroup[i];
                    let comment = sourceCode.substring(node.fullStart, node.start).trim();
                    let code = sourceCode.substring(node.start, node.end).trim();

                    if (addPublicModifierIfMissing)
                    {
                        if (node.accessModifier === null)
                        {
                            if (node instanceof MethodNode)
                            {
                                if (code.startsWith("static"))
                                {
                                    if (code.startsWith("static async"))
                                    {
                                        code = code.replace(new RegExp(`static\\s*async\\s*${node.name}\\s*\\(`), `public static async ${node.name}(`);
                                    }
                                    else
                                    {
                                        code = code.replace(new RegExp(`static\\s*${node.name}\\s*\\(`), `public static ${node.name}(`);
                                    }
                                }
                                else
                                {
                                    if (code.startsWith("async"))
                                    {
                                        code = code.replace(new RegExp(`async\\s*${node.name}\\s*\\(`), `public async ${node.name}(`);
                                    }
                                    else
                                    {
                                        code = code.replace(new RegExp(`${node.name}\\s*\\(`), `public ${node.name}(`);
                                    }
                                }
                            }
                            else if (node instanceof PropertyNode)
                            {
                                if (code.startsWith("static"))
                                {
                                    code = code.replace(new RegExp(`static\\s*${node.name}\\s*:`), `public static ${node.name}:`);
                                    code = code.replace(new RegExp(`static\\s*${node.name}\\s*=`), `public static ${node.name} =`);
                                    code = code.replace(new RegExp(`static\\s*${node.name}\\s*;`), `public static ${node.name};`);
                                }
                                else
                                {
                                    code = code.replace(new RegExp(`${node.name}\\s*:`), `public ${node.name}:`);
                                    code = code.replace(new RegExp(`${node.name}\\s*=`), `public ${node.name} =`);
                                    code = code.replace(new RegExp(`${node.name}\\s*;`), `public ${node.name};`);
                                }
                            }
                            else if (node instanceof GetterNode)
                            {
                                if (code.startsWith("static"))
                                {
                                    code = code.replace(new RegExp(`static\\s*get\\s*${node.name}\\s*\\(`), `public static get ${node.name}(`);
                                }
                                else
                                {
                                    code = code.replace(new RegExp(`get\\s*${node.name}\\s*\\(`), `public get ${node.name}(`);
                                }

                            }
                            else if (node instanceof SetterNode)
                            {
                                if (code.startsWith("static"))
                                {
                                    code = code.replace(new RegExp(`static\\s*set\\s*${node.name}\\s*\\(`), `public static set ${node.name}(`);
                                }
                                else
                                {
                                    code = code.replace(new RegExp(`set\\s*${node.name}\\s*\\(`), `public set ${node.name}(`);
                                }
                            }
                        }
                    }

                    if (groupElementsWithDecorators)
                    {
                        if (i > 0)
                        {
                            if (nodeGroup[i - 1].decorators.length > 0 &&
                                nodeGroup[i].decorators.length === 0)
                            {
                                members += newLine;
                            }
                        }
                    }

                    if (comment !== "")
                    {
                        members += `${IndentationLevel === 1 ? Indentation : ""}${comment}${newLine}`;
                    }

                    members += `${IndentationLevel === 1 ? Indentation : ""}${code}`;
                    members += newLine;

                    if (code.endsWith("}"))
                    {
                        members += newLine;
                    }
                    else if (node instanceof PropertyNode &&
                        node.isArrowFunction &&
                        treatArrowFunctionPropertiesAsMethods)
                    {
                        // arrow function property -> add a new line
                        members += newLine;
                    }
                }

                members += newLine;
            }

            if (group.isRegion)
            {
                members += newLine;
                members += `${addRegionIndentation ? Indentation : ""}// #endregion`;
                members += addRegionCaptionToRegionEnd ? ` ${group.caption}` : "";
                members += addRowNumberInRegionName ? ` (${count})` : "";
                members += newLine;
            }

            members += newLine;
        }
    }

    sourceCode2 = sourceCode.substring(0, start).trimEnd();
    sourceCode2 += newLine;
    sourceCode2 += (addRegionIndentation ? Indentation : "") + members.trim();
    sourceCode2 += newLine;
    sourceCode2 += sourceCode.substring(end, sourceCode.length).trimStart();

    return sourceCode2.trimStart();
}

function organizeTypes(sourceCode: string, fileName: string, configuration: Configuration)
{
    sourceCode = removeRegions(sourceCode);

    let indentation = getIndentation(sourceCode);

    // organize type aliases, interfaces, classes, enums, functions and variables
    let sourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

    let elements = new Transformer().analyzeSyntaxTree(sourceFile, configuration.treatArrowFunctionPropertiesAsMethods);

    if (!elements.some(x => !(x instanceof UnknownNode)))
    {
        let imports = getImports(elements, configuration.groupPropertiesWithDecorators);
        let functions = getFunctions(elements, configuration.groupPropertiesWithDecorators);
        let typeAliases = getTypeAliases(elements, configuration.groupPropertiesWithDecorators);
        let interfaces = getInterfaces(elements, configuration.groupPropertiesWithDecorators);
        let classes = getClasses(elements, configuration.groupPropertiesWithDecorators);
        let enums = getEnums(elements, configuration.groupPropertiesWithDecorators);

        let groups = [
            new ElementNodeGroup("Imports", [], imports, false),
            new ElementNodeGroup("Type aliases", [], typeAliases, true),
            new ElementNodeGroup("Interfaces", [], interfaces, true),
            new ElementNodeGroup("Classes", [], classes, true),
            new ElementNodeGroup("Enums", [], enums, true),
            new ElementNodeGroup("Functions", [], functions, true)
        ];

        if (functions.length + typeAliases.length + interfaces.length + classes.length + enums.length > 1 ||
            functions.length > 0)
        {
            sourceCode = print(groups, sourceCode, 0, sourceCode.length, 0, configuration.addRowNumberInRegionName, false, false, indentation, configuration.addRegionCaptionToRegionEnd, configuration.groupPropertiesWithDecorators, configuration.treatArrowFunctionPropertiesAsMethods);
        }
    }

    // organize members of interfaces and classes
    sourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

    elements = new Transformer().analyzeSyntaxTree(sourceFile, configuration.treatArrowFunctionPropertiesAsMethods);

    for (let element of elements.sort((a, b) => compareNumbers(a.fullStart, b.fullStart) * -1))
    {
        if (element instanceof InterfaceNode)
        {
            let interfaceNode = <InterfaceNode>element;
            let groups = organizeInterfaceMembers(interfaceNode, configuration.memberOrder, configuration.groupPropertiesWithDecorators);

            sourceCode = print(groups, sourceCode, interfaceNode.membersStart, interfaceNode.membersEnd, 1, configuration.addRowNumberInRegionName, false, configuration.addRegionIndentation, indentation, configuration.addRegionCaptionToRegionEnd, configuration.groupPropertiesWithDecorators, configuration.treatArrowFunctionPropertiesAsMethods);
        }
        else if (element instanceof ClassNode)
        {
            let classNode = <ClassNode>element;
            let groups = organizeClassMembers(classNode, configuration.memberOrder, configuration.groupPropertiesWithDecorators);

            sourceCode = print(groups, sourceCode, classNode.membersStart, classNode.membersEnd, 1, configuration.addRowNumberInRegionName, configuration.addPublicModifierIfMissing, configuration.addRegionIndentation, indentation, configuration.addRegionCaptionToRegionEnd, configuration.groupPropertiesWithDecorators, configuration.treatArrowFunctionPropertiesAsMethods);
        }
    }

    if (!configuration.useRegions)
    {
        sourceCode = removeRegions(sourceCode);
    }

    sourceCode = formatLines(sourceCode);
    return sourceCode;
}

function organizeInterfaceMembers(interfaceNode: InterfaceNode, memberTypeOrder: ElementNodeGroupConfiguration[], groupElementsWithDecorators: boolean)
{
    let regions: ElementNodeGroup[] = [];
    let memberGroups: ElementNodeGroup[];

    for (const memberTypeGroup of memberTypeOrder)
    {
        memberGroups = [];

        for (const memberType of memberTypeGroup.memberTypes)
        {
            if (memberType === MemberType.publicConstProperties)
            {
                // public const properties
                memberGroups.push(new ElementNodeGroup(null, [], interfaceNode.getConstProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicReadOnlyProperties)
            {
                // public readonly methods
                memberGroups.push(new ElementNodeGroup(null, [], interfaceNode.getReadOnlyProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicProperties)
            {
                // public methods
                memberGroups.push(new ElementNodeGroup(null, [], interfaceNode.getProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicIndexes)
            {
                // public indexes
                memberGroups.push(new ElementNodeGroup(null, [], interfaceNode.getIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicMethods)
            {
                // public methods
                memberGroups.push(new ElementNodeGroup(null, [], interfaceNode.getMethods(groupElementsWithDecorators), false));
            }
        }

        regions.push(new ElementNodeGroup(memberTypeGroup.caption, memberGroups, [], true));
    }

    return regions;
}

function organizeClassMembers(classNode: ClassNode, memberTypeOrder: ElementNodeGroupConfiguration[], groupElementsWithDecorators: boolean): ElementNodeGroup[]
{
    let regions: ElementNodeGroup[] = [];
    let memberGroups: ElementNodeGroup[];

    for (const memberTypeGroup of memberTypeOrder)
    {
        memberGroups = [];

        for (const memberType of memberTypeGroup.memberTypes)
        {
            if (memberType === MemberType.privateStaticConstProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateStaticConstProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateConstProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateConstProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateStaticReadOnlyProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateStaticReadOnlyProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateReadOnlyProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateReadOnlyProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateStaticProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateStaticProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedStaticConstProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedStaticConstProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedConstProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedConstProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedStaticReadOnlyProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedStaticReadOnlyProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedReadOnlyProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedReadOnlyProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedStaticProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedStaticProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicStaticConstProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicStaticConstProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicConstProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicConstProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicStaticReadOnlyProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicStaticReadOnlyProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicReadOnlyProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicReadOnlyProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicStaticProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicStaticProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.constructors)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getConstructors(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicStaticIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicStaticIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicAbstractIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicAbstractIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedStaticIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedStaticIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedAbstractIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedAbstractIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateStaticIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateStaticIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateAbstractIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateAbstractIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicStaticGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicStaticGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicAbstractGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicAbstractGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedStaticGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedStaticGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedAbstractGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedAbstractGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateStaticGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateStaticGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateAbstractGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateAbstractGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicStaticMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicStaticMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicAbstractMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPublicAbstractMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedStaticMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedStaticMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedAbstractMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getProtectedAbstractMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateStaticMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateStaticMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateAbstractMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getPrivateAbstractMethods(groupElementsWithDecorators), false));
            }
        }

        regions.push(new ElementNodeGroup(memberTypeGroup.caption, memberGroups, [], true));
    }

    return regions;
}