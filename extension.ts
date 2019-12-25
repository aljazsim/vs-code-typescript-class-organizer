import { ElementNodeGroup } from "./src/element-node-group";
import { ElementNodeGroupConfiguration } from "./src/element-node-group-configuration";
import { ClassNode } from "./src/elements/class-node";
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

export function activate(context: vscode.ExtensionContext)
{
    context.subscriptions.push(vscode.commands.registerCommand('tsco.organize', () => organize(vscode.window.activeTextEditor, getMemberOrderConfig(), getUseRegionsConfig(), getAddAccessorsBeforeCtor(), getAddPublicModifierIfMissing(), getAddRegionIdentationConfig(), getAddRegionCaptionToRegionEnd(), getGroupPropertiesByDecorators())));
    context.subscriptions.push(vscode.commands.registerCommand('tsco.organizeAll', () => organizeAll(getMemberOrderConfig(), getUseRegionsConfig(), getAddAccessorsBeforeCtor(), getAddPublicModifierIfMissing(), getAddRegionIdentationConfig(), getAddRegionCaptionToRegionEnd(), getGroupPropertiesByDecorators())));
}

function getUseRegionsConfig(): boolean
{
    return vscode.workspace.getConfiguration("tsco").get<boolean>("useRegions") === true;
}

function getAddPublicModifierIfMissing(): boolean
{
    return vscode.workspace.getConfiguration("tsco").get<boolean>("addPublicModifierIfMissing") === true;
}

function getAddAccessorsBeforeCtor(): boolean
{
    return vscode.workspace.getConfiguration("tsco").get<boolean>("accessorsBeforeCtor") === true;
}

function getAddRowNumberInRegionName(): boolean
{
    return vscode.workspace.getConfiguration("tsco").get<boolean>("addRowNumberInRegionName") === true;
}
function getAddRegionIdentationConfig(): boolean
{
    return vscode.workspace.getConfiguration("tsco").get<boolean>("addRegionIdentation") === true;
}

function getAddRegionCaptionToRegionEnd(): boolean
{
    return vscode.workspace.getConfiguration("tsco").get<boolean>("addRegionCaptionToRegionEnd") === true;
}

function getGroupPropertiesByDecorators(): boolean
{
    return vscode.workspace.getConfiguration("tsco").get<boolean>("groupPropertiesWithDecorators") === true;
}

function getMemberOrderConfig(): ElementNodeGroupConfiguration[]
{
    let memberTypeOrderConfiguration = vscode.workspace.getConfiguration("tsco").get<ElementNodeGroupConfiguration[]>("memberOrder") ?? [];
    let memberTypeOrder: ElementNodeGroupConfiguration[] = [];
    let defaultMemberTypeOrder = Object.keys(MemberType).map(x => MemberType[x as keyof typeof MemberType]); // same order as in the enum

    // add member type order from configuration (prevent duplicates)
    memberTypeOrderConfiguration
        .filter(x => !memberTypeOrder.some(y => y.memberType === x.memberType))
        .forEach(x => memberTypeOrder.push(x));

    // add missing member types (prevent duplicates)
    defaultMemberTypeOrder
        .filter(x => !memberTypeOrder.some(y => y.memberType === x))
        .forEach(x =>
        {
            let defaultElementNodeGroupConfiguration = new ElementNodeGroupConfiguration();

            defaultElementNodeGroupConfiguration.caption = MemberType[x];
            defaultElementNodeGroupConfiguration.subGroups = []; // no nested groups
            defaultElementNodeGroupConfiguration.memberType = x;
            defaultElementNodeGroupConfiguration.isRegion = true; // self contained region

            memberTypeOrder.push(defaultElementNodeGroupConfiguration);
        });

    return memberTypeOrder;
}

function getIdentation(sourceCode: string): string
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

function organizeAll(memberTypeOrder: ElementNodeGroupConfiguration[], useRegions: boolean, addAccessorsBeforeCtor: boolean, addPublicModifierIfMissing: boolean, addIdentation: boolean, addRegionCaptionToRegionEnd: boolean, groupPropertiesWithDecorators: boolean)
{
    vscode.workspace.findFiles("**/*.ts", "**/node_modules/**")
        .then(typescriptFiles => typescriptFiles.forEach(typescriptFile => vscode.workspace.openTextDocument(typescriptFile)
            .then(document => vscode.window.showTextDocument(document)
                .then(editor => organize(editor, memberTypeOrder, addAccessorsBeforeCtor, useRegions, addPublicModifierIfMissing, addIdentation, addRegionCaptionToRegionEnd, groupPropertiesWithDecorators) !== null))));

}

function organize(editor: vscode.TextEditor | undefined, memberTypeOrder: ElementNodeGroupConfiguration[], useRegions: boolean, addAccessorsBeforeCtor: boolean, addPublicModifierIfMissing: boolean, addRegionIdentation: boolean, addRegionCaptionToRegionEnd: boolean, groupElementsWithDecorators: boolean)
{
    let edit: vscode.WorkspaceEdit;
    let start: vscode.Position;
    let end: vscode.Position;
    let range: vscode.Range;

    if (editor)
    {
        let sourceCode = editor.document.getText();
        let fileName = editor.document.fileName;

        sourceCode = organizeTypes(sourceCode, fileName, memberTypeOrder, useRegions, addAccessorsBeforeCtor, addPublicModifierIfMissing, addRegionIdentation, addRegionCaptionToRegionEnd, groupElementsWithDecorators);

        start = new vscode.Position(0, 0);
        end = new vscode.Position(editor.document.lineCount, editor.document.lineAt(editor.document.lineCount - 1).text.length);
        range = new vscode.Range(start, end);

        edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, range, sourceCode);

        return vscode.workspace.applyEdit(edit);
    }
}

function print(groups: ElementNodeGroup[], sourceCode: string, start: number, end: number, identationLevel: number, addPublicModifierIfMissing: boolean, addRegionIdentation: boolean, identation: string, addRegionCaptionToRegionEnd: boolean, groupElementsWithDecorators: boolean)
{
    let sourceCode2: string;
    let count;
    let members = "";
    let newLine = "\r\n";

    for (let group of groups)
    {
        count = 0;

        for (let group2 of group.nodeSubGroups)
        {
            count += group2.nodes.length;
        }

        if (count > 0)
        {
            if (group.isRegion)
            {
                members += newLine;
                members += `${addRegionIdentation ? identation : ""}// #region ${group.caption}`;
                if (getAddRowNumberInRegionName())
                {
                    members += ` (${count})`;
                }
                members += newLine;
            }

            members += newLine;

            for (let group2 of group.nodeSubGroups)
            {
                for (let i = 0; i < group2.nodes.length; i++)
                {
                    const node = group2.nodes[i];
                    let comment = sourceCode.substring(node.fullStart, node.start).trim();
                    let code = sourceCode.substring(node.start, node.end).trim();

                    if (addPublicModifierIfMissing)
                    {
                        if (node instanceof MethodNode ||
                            node instanceof PropertyNode ||
                            node instanceof GetterNode ||
                            node instanceof SetterNode)
                        {
                            if (node.accessModifier === null)
                            {
                                code = code.replace(`${node.name}:`, `public ${node.name}:`);
                                code = code.replace(`${node.name} =`, `public ${node.name} =`);
                                code = code.replace(`${node.name};`, `public ${node.name};`);
                                code = code.replace(`${node.name}(`, `public ${node.name}(`);
                            }
                        }
                    }

                    if (groupElementsWithDecorators)
                    {
                        if (i > 0)
                        {
                            if (group2.nodes[i - 1].decorators.length > 0 &&
                                group2.nodes[i].decorators.length === 0)
                            {
                                members += newLine;
                            }
                        }
                    }

                    if (comment !== "")
                    {
                        members += `${identationLevel === 1 ? identation : ""}${comment}${newLine}`;
                    }

                    members += `${identationLevel === 1 ? identation : ""}${code}`;
                    members += newLine;

                    if (code.endsWith("}"))
                    {
                        members += newLine;
                    }
                }

                members += newLine;
            }

            if (group.isRegion)
            {
                members += newLine;

                if (addRegionCaptionToRegionEnd)
                {
                    members += `${addRegionIdentation ? identation : ""}// #endregion ${group.caption}`;
                    if (getAddRowNumberInRegionName())
                    {
                        members += ` (${count})`;
                    }
                    members += newLine;
                }
                else
                {
                    members += `${addRegionIdentation ? identation : ""}// #endregion${newLine}`;
                }
            }

            members += newLine;
        }
    }

    sourceCode2 = sourceCode.substring(0, start).trimRight();
    sourceCode2 += newLine;
    sourceCode2 += (addRegionIdentation ? identation : "") + members.trim();
    sourceCode2 += newLine;
    sourceCode2 += sourceCode.substring(end, sourceCode.length).trimLeft();

    return sourceCode2.trimLeft();
}

function organizeTypes(sourceCode: string, fileName: string, memberTypeOrder: ElementNodeGroupConfiguration[], useRegions: boolean, addAccessorsBeforeCtor: boolean, addPublicModifierIfMissing: boolean, addRegionIdentation: boolean, addRegionCaptionToRegionEnd: boolean, groupElementsWithDecorators: boolean)
{
    sourceCode = removeRegions(sourceCode);

    let identation = getIdentation(sourceCode);

    // organize type aliases, interfaces, classes, enums, functions and variables
    let sourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

    let elements = new Transformer().analyzeSyntaxTree(sourceFile);

    if (!elements.some(x => !(x instanceof UnknownNode)))
    {
        let imports = getImports(elements, groupElementsWithDecorators);
        let functions = getFunctions(elements, groupElementsWithDecorators);
        let typeAliases = getTypeAliases(elements, groupElementsWithDecorators);
        let interfaces = getInterfaces(elements, groupElementsWithDecorators);
        let classes = getClasses(elements, groupElementsWithDecorators);
        let enums = getEnums(elements, groupElementsWithDecorators);

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
            sourceCode = print(groups, sourceCode, 0, sourceCode.length, 0, false, false, identation, addRegionCaptionToRegionEnd, groupElementsWithDecorators);
        }
    }

    // organize members of interfaces and classes
    sourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

    elements = new Transformer().analyzeSyntaxTree(sourceFile);

    for (let element of elements.sort((a, b) => compareNumbers(a.fullStart, b.fullStart) * -1))
    {
        if (element instanceof InterfaceNode)
        {
            let interfaceNode = <InterfaceNode>element;
            let groups = organizeInterfaceMembers(interfaceNode, memberTypeOrder, groupElementsWithDecorators);

            sourceCode = print(groups, sourceCode, interfaceNode.membersStart, interfaceNode.membersEnd, 1, false, addRegionIdentation, identation, addRegionCaptionToRegionEnd, groupElementsWithDecorators);
        }
        else if (element instanceof ClassNode)
        {
            let classNode = <ClassNode>element;
            let groups = organizeClassMembers(classNode, memberTypeOrder, groupElementsWithDecorators);

            const constructorIndex = 1;
            let accessorIndex = addAccessorsBeforeCtor ? constructorIndex : constructorIndex + 1;

            putAccessorAt(groups, classNode, groupElementsWithDecorators, accessorIndex);
            sourceCode = print(groups, sourceCode, classNode.membersStart, classNode.membersEnd, 1, addPublicModifierIfMissing, addRegionIdentation, identation, addRegionCaptionToRegionEnd, groupElementsWithDecorators);
        }
    }

    if (!useRegions)
    {
        sourceCode = removeRegions(sourceCode);
    }

    sourceCode = formatLines(sourceCode);
    return sourceCode;
}

function organizeInterfaceMembers(interfaceNode: InterfaceNode, memberTypeOrder: ElementNodeGroupConfiguration[], groupElementsWithDecorators: boolean)
{
    let members: ElementNodeGroup[] = [];

    for (const memberType of memberTypeOrder)
    {
        if (memberType.subGroups &&
            memberType.subGroups.length > 0 &&
            memberType.memberType === null)
        {
            // nested group
            members.push(new ElementNodeGroup(memberType.caption, organizeInterfaceMembers(interfaceNode, memberType.subGroups, groupElementsWithDecorators), [], memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.publicConstProperties)
        {
            // public properties
            members.push(new ElementNodeGroup(memberType.caption, [], interfaceNode.getConstProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.publicIndexes)
        {
            // public indexes
            members.push(new ElementNodeGroup(memberType.caption, [], interfaceNode.getIndexes(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.publicMethods)
        {
            // public methods
            members.push(new ElementNodeGroup(memberType.caption, [], interfaceNode.getMethods(groupElementsWithDecorators), memberType.isRegion));
        }
    }

    return members;
}

function organizeClassMembers(classNode: ClassNode, memberTypeOrder: ElementNodeGroupConfiguration[], groupElementsWithDecorators: boolean): ElementNodeGroup[]
{
    let members: ElementNodeGroup[] = [];

    for (const memberType of memberTypeOrder)
    {
        if (memberType.subGroups &&
            memberType.subGroups.length > 0 &&
            memberType.memberType === null)
        {
            // nested group
            members.push(new ElementNodeGroup(memberType.caption, organizeClassMembers(classNode, memberType.subGroups, groupElementsWithDecorators), [], memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.privateStaticConstProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPrivateStaticConstProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.privateConstProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPrivateConstProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.privateStaticReadOnlyProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPrivateStaticReadOnlyProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.privateReadOnlyProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPrivateReadOnlyProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.privateStaticProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPrivateStaticProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.privateProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPrivateProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.protectedStaticConstProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getProtectedStaticConstProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.protectedConstProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getProtectedConstProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.protectedStaticReadOnlyProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getProtectedStaticReadOnlyProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.protectedReadOnlyProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getProtectedReadOnlyProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.protectedStaticProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getProtectedStaticProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.protectedProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getProtectedProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.publicStaticConstProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPublicStaticConstProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.publicConstProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPublicConstProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.publicStaticReadOnlyProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPublicStaticReadOnlyProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.publicReadOnlyProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPublicReadOnlyProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.publicStaticProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPublicStaticProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.publicProperties)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPublicProperties(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.constructors)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getConstructors(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.publicStaticIndexes)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPublicStaticIndexes(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.publicIndexes)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPublicIndexes(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.publicAbstractIndexes)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPublicAbstractIndexes(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.protectedStaticIndexes)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getProtectedStaticIndexes(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.protectedIndexes)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getProtectedIndexes(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.protectedAbstractIndexes)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getProtectedAbstractIndexes(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.privateStaticIndexes)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPrivateStaticIndexes(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.privateIndexes)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPrivateIndexes(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.privateAbstractIndexes)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPrivateAbstractIndexes(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.publicStaticMethods)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPublicStaticMethods(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.publicMethods)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPublicMethods(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.publicAbstractMethods)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPublicAbstractMethods(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.protectedStaticMethods)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getProtectedStaticMethods(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.protectedMethods)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getProtectedMethods(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.protectedAbstractMethods)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getProtectedAbstractMethods(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.privateStaticMethods)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPrivateStaticMethods(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.privateMethods)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPrivateMethods(groupElementsWithDecorators), memberType.isRegion));
        }
        else if (memberType.memberType === MemberType.privateAbstractMethods)
        {
            members.push(new ElementNodeGroup(memberType.caption, [], classNode.getPrivateAbstractMethods(groupElementsWithDecorators), memberType.isRegion));
        }
    }

    return members;
}

function putAccessorAt(groups: any, classNode: ClassNode, groupElementsWithDecorators: boolean, index: number)
{

    var accessorsItems = [
        { description: "Public Static Accessors", groups: [{ nodes: classNode.getPublicStaticGettersAndSetters(groupElementsWithDecorators) }], regions: true },
        { description: "Public Accessors", groups: [{ nodes: classNode.getPublicGettersAndSetters(groupElementsWithDecorators) }], regions: true },
        { description: "Public Abstract Accessors", groups: [{ nodes: classNode.getPublicAbstractGettersAndSetters(groupElementsWithDecorators) }], regions: true },

        { description: "Protected Static Accessors", groups: [{ nodes: classNode.getProtectedStaticGettersAndSetters(groupElementsWithDecorators) }], regions: true },
        { description: "Protected Accessors", groups: [{ nodes: classNode.getProtectedGettersAndSetters(groupElementsWithDecorators) }], regions: true },
        { description: "Protected Abstract Accessors", groups: [{ nodes: classNode.getProtectedAbstractGettersAndSetters(groupElementsWithDecorators) }], regions: true },

        { description: "Private Static Accessors", groups: [{ nodes: classNode.getPrivateStaticGettersAndSetters(groupElementsWithDecorators) }], regions: true },
        { description: "Private Accessors", groups: [{ nodes: classNode.getPrivateGettersAndSetters(groupElementsWithDecorators) }], regions: true },
        { description: "Private Abstract Accessors", groups: [{ nodes: classNode.getPrivateAbstractGettersAndSetters(groupElementsWithDecorators) }], regions: true },
    ];

    (accessorsItems).forEach(element =>
    {
        groups.splice(index, 0, element);
        index++;
    });
}