import * as ts from "typescript";
import * as vscode from "vscode";
import { Configuration } from "./src/configuration";
import { ElementNodeGroup } from "./src/element-node-group";
import { ElementNodeGroupConfiguration } from "./src/element-node-group-configuration";
import { AccessorNode } from "./src/elements/accessor-node";
import { ClassNode } from "./src/elements/class-node";
import { ElementNode } from "./src/elements/element-node";
import { GetterNode } from "./src/elements/getter-node";
import { InterfaceNode } from "./src/elements/interface-node";
import { MethodNode } from "./src/elements/method-node";
import { PropertyNode } from "./src/elements/property-node";
import { SetterNode } from "./src/elements/setter-node";
import { WriteModifier } from "./src/elements/write-modifier";
import { MemberType } from "./src/member-type";
import { formatLines, removeRegions } from "./src/regions";
import { Transformer } from "./src/transformer";
import { compareNumbers, distinct, getClasses, getEnums, getExpressions, getFunctions, getImports, getInterfaces, getTypeAliases, getVariables, groupByPlaceAboveBelow, sort } from "./src/utils";

// #region Functions (12)

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

function convertPascalCaseToTitleCase(value: string)
{
    if (value &&
        value.length > 1)
    {
        value = value.replace(/(?:^|\.?)([A-Z])/g, (x, y) => " " + y);
        value = value[0].toUpperCase() + value.substring(1);
    }

    return value;
}

function getConfiguration()
{
    let configuration = vscode.workspace.getConfiguration("tsco");

    return new Configuration(
        configuration.get<boolean>("useRegions") === true,
        configuration.get<boolean>("addPublicModifierIfMissing") === true,
        configuration.get<boolean>("addMemberCountInRegionName") === true,
        configuration.get<boolean>("addRegionIndentation") === true,
        configuration.get<boolean>("addRegionCaptionToRegionEnd") === true,
        configuration.get<boolean>("groupPropertiesWithDecorators") === true,
        configuration.get<boolean>("treatArrowFunctionPropertiesAsMethods") === true,
        configuration.get<boolean>("organizeOnSave") === true,
        getMemberOrderConfig()
    );
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

function organize(editor: vscode.TextEditor | undefined, configuration: Configuration)
{
    if (editor)
    {
        let sourceCode = editor.document.getText();

        if (!new RegExp("//\\s*tsco:ignore").test(sourceCode) &&
            !new RegExp("//\\s*<auto-generated\\s*/>").test(sourceCode))
        {
            const fileName = editor.document.fileName;
            const organizedSourceCode = organizeTypes(sourceCode, fileName, configuration);

            if (organizedSourceCode !== sourceCode)
            {
                const start = new vscode.Position(0, 0);
                const end = new vscode.Position(editor.document.lineCount, editor.document.lineAt(editor.document.lineCount - 1).text.length);
                const range = new vscode.Range(start, end);
                const edit = new vscode.WorkspaceEdit();

                edit.replace(editor.document.uri, range, organizedSourceCode);

                return vscode.workspace.applyEdit(edit);
            }
        }
    }
}

function organizeAll(configuration: Configuration)
{
    vscode.workspace.findFiles("**/*.ts", "**/node_modules/**")
        .then(typescriptFiles => typescriptFiles.forEach(typescriptFile => vscode.workspace.openTextDocument(typescriptFile)
            .then(document => vscode.window.showTextDocument(document)
                .then(editor => organize(editor, configuration) !== null))));
}

function organizeClassMembers(classNode: ClassNode, memberTypeOrder: ElementNodeGroupConfiguration[], groupElementsWithDecorators: boolean): ElementNodeGroup[]
{
    let regions: ElementNodeGroup[] = [];
    let memberGroups: ElementNodeGroup[];

    for (const memberTypeGroup of memberTypeOrder)
    {
        const placeAbove = memberTypeGroup.placeAbove;
        const placeBelow = memberTypeGroup.placeBelow;

        memberGroups = [];

        for (const memberType of memberTypeGroup.memberTypes)
        {
            if (memberType === MemberType.privateStaticConstProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateStaticConstProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateConstProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateConstProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateStaticReadOnlyProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateStaticReadOnlyProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateReadOnlyProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateReadOnlyProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateStaticProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateStaticProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedStaticConstProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedStaticConstProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedConstProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedConstProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedStaticReadOnlyProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedStaticReadOnlyProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedReadOnlyProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedReadOnlyProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedStaticProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedStaticProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicStaticConstProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicStaticConstProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicConstProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicConstProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicStaticReadOnlyProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicStaticReadOnlyProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicReadOnlyProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicReadOnlyProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicStaticProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicStaticProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.staticBlockDeclarations)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.staticBlockDeclarations, false));
            }
            else if (memberType === MemberType.constructors)
            {
                memberGroups.push(new ElementNodeGroup(null, [], classNode.getConstructors(), false));
            }
            else if (memberType === MemberType.publicStaticIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicStaticIndexes(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicIndexes(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicAbstractIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicAbstractIndexes(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedStaticIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedStaticIndexes(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedIndexes(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedAbstractIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedAbstractIndexes(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateStaticIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateStaticIndexes(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateIndexes(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateAbstractIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateAbstractIndexes(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicStaticAccessors)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicStaticAccessors(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicAccessors)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicAccessors(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicAbstractAccessors)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicAbstractAccessors(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedStaticAccessors)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedStaticAccessors(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedAccessors)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedAccessors(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedAbstractAccessors)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedAbstractAccessors(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateStaticAccessors)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateStaticAccessors(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateAccessors)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateAccessors(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateAbstractAccessors)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateAbstractAccessors(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicStaticGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicStaticGettersAndSetters(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicGettersAndSetters(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicAbstractGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicAbstractGettersAndSetters(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedStaticGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedStaticGettersAndSetters(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedGettersAndSetters(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedAbstractGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedAbstractGettersAndSetters(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateStaticGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateStaticGettersAndSetters(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateGettersAndSetters(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateAbstractGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateAbstractGettersAndSetters(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicStaticMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicStaticMethods(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicMethods(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicAbstractMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPublicAbstractMethods(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedStaticMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedStaticMethods(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedMethods(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.protectedAbstractMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getProtectedAbstractMethods(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateStaticMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateStaticMethods(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateMethods(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.privateAbstractMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(classNode.getPrivateAbstractMethods(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
        }

        regions.push(new ElementNodeGroup(memberTypeGroup.caption, memberGroups, [], true));
    }

    return regions;
}

function organizeInterfaceMembers(interfaceNode: InterfaceNode, memberTypeOrder: ElementNodeGroupConfiguration[], groupElementsWithDecorators: boolean)
{
    let regions: ElementNodeGroup[] = [];
    let memberGroups: ElementNodeGroup[];

    for (const memberTypeGroup of memberTypeOrder)
    {
        const placeAbove = memberTypeGroup.placeAbove;
        const placeBelow = memberTypeGroup.placeBelow;

        memberGroups = [];

        for (const memberType of memberTypeGroup.memberTypes)
        {
            if (memberType === MemberType.publicConstProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(interfaceNode.getConstProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicReadOnlyProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(interfaceNode.getReadOnlyProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicProperties)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(interfaceNode.getProperties(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicIndexes)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(interfaceNode.getIndexes(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicAccessors)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(interfaceNode.getAccessors(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicGettersAndSetters)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(interfaceNode.getGettersAndSetters(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
            else if (memberType === MemberType.publicMethods)
            {
                memberGroups.push(new ElementNodeGroup(null, [], groupByPlaceAboveBelow(interfaceNode.getMethods(), placeAbove, placeBelow, groupElementsWithDecorators), false));
            }
        }

        regions.push(new ElementNodeGroup(memberTypeGroup.caption, memberGroups, [], true));
    }

    return regions;
}

function organizeTypes(sourceCode: string, fileName: string, configuration: Configuration)
{
    sourceCode = removeRegions(sourceCode);

    let indentation = getIndentation(sourceCode);

    // organize type aliases, interfaces, classes, enums, functions and variables
    let sourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
    let elements = new Transformer().analyzeSyntaxTree(sourceFile, configuration.treatArrowFunctionPropertiesAsMethods);
    let imports = getImports(elements, configuration.groupPropertiesWithDecorators);
    let typeAliases = getTypeAliases(elements, configuration.groupPropertiesWithDecorators);
    let interfaces = getInterfaces(elements, configuration.groupPropertiesWithDecorators);
    let classes = getClasses(elements, configuration.groupPropertiesWithDecorators);
    let enums = getEnums(elements, configuration.groupPropertiesWithDecorators);
    let functions = getFunctions(elements, configuration.groupPropertiesWithDecorators);
    let variables = getVariables(elements);
    let expressions = getExpressions(elements);

    if (expressions.length === 0)
    {
        // having expressions could reorganize code in incorrect way
        let groups = [
            new ElementNodeGroup("Imports", [], imports, false),
            new ElementNodeGroup("Type aliases", [], typeAliases, true),
            new ElementNodeGroup("Interfaces", [], interfaces, true),
            new ElementNodeGroup("Classes", [], classes, true),
            new ElementNodeGroup("Enums", [], enums, true),
            new ElementNodeGroup("Functions", [], functions, true),
            new ElementNodeGroup("Variables", [], variables, true)
        ];

        if (typeAliases.length + interfaces.length + classes.length + enums.length + functions.length > 1)
        {
            sourceCode = print(groups, sourceCode, 0, sourceCode.length, 0, configuration.addMemberCountInRegionName, false, false, indentation, configuration.addRegionCaptionToRegionEnd, configuration.groupPropertiesWithDecorators, configuration.treatArrowFunctionPropertiesAsMethods);
        }
    }

    // organize members of interfaces and classes
    sourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

    elements = new Transformer().analyzeSyntaxTree(sourceFile, configuration.treatArrowFunctionPropertiesAsMethods);

    for (let element of elements.sort((a: any, b: any) => compareNumbers(a.fullStart, b.fullStart) * -1))
    {
        if (element instanceof InterfaceNode)
        {
            let interfaceNode = <InterfaceNode>element;
            let groups = organizeInterfaceMembers(interfaceNode, configuration.memberOrder, configuration.groupPropertiesWithDecorators);

            sourceCode = print(groups, sourceCode, interfaceNode.membersStart, interfaceNode.membersEnd, 1, configuration.addMemberCountInRegionName, false, configuration.addRegionIndentation, indentation, configuration.addRegionCaptionToRegionEnd, configuration.groupPropertiesWithDecorators, configuration.treatArrowFunctionPropertiesAsMethods);
        }
        else if (element instanceof ClassNode)
        {
            let classNode = <ClassNode>element;
            let groups = organizeClassMembers(classNode, configuration.memberOrder, configuration.groupPropertiesWithDecorators);

            sourceCode = print(groups, sourceCode, classNode.membersStart, classNode.membersEnd, 1, configuration.addMemberCountInRegionName, configuration.addPublicModifierIfMissing, configuration.addRegionIndentation, indentation, configuration.addRegionCaptionToRegionEnd, configuration.groupPropertiesWithDecorators, configuration.treatArrowFunctionPropertiesAsMethods);
        }
    }

    if (!configuration.useRegions)
    {
        sourceCode = removeRegions(sourceCode);
    }

    sourceCode = formatLines(sourceCode);

    return sourceCode;
}

function parseElementNodeGroupConfiguration(x: any)
{
    let elementNodeGroupConfiguration = new ElementNodeGroupConfiguration();

    elementNodeGroupConfiguration.caption = x.caption;
    elementNodeGroupConfiguration.memberTypes = distinct(x.memberTypes as string[] ?? []).map(y => MemberType[y as keyof typeof MemberType]);
    elementNodeGroupConfiguration.placeAbove = distinct(x.placeAbove as string[] ?? []);
    elementNodeGroupConfiguration.placeBelow = distinct(x.placeBelow as string[] ?? []);

    return elementNodeGroupConfiguration;
}

function print(groups: ElementNodeGroup[], sourceCode: string, start: number, end: number, IndentationLevel: number, addMemberCountInRegionName: boolean, addPublicModifierIfMissing: boolean, addRegionIndentation: boolean, Indentation: string, addRegionCaptionToRegionEnd: boolean, groupElementsWithDecorators: boolean, treatArrowFunctionPropertiesAsMethods: boolean)
{
    let sourceCode2: string;
    let count = 0;
    let members = "";
    const newLine = "\r\n";
    const spacesRegex = "\\s*";
    const staticRegex = `(static)?${spacesRegex}`;
    const readonlyRegex = `(readonly)?${spacesRegex}`;
    const constRegex = `(const)?${spacesRegex}`;
    const abstractRegex = `(abstract)?${spacesRegex}`;
    const asyncRegex = `(async)?${spacesRegex}`;
    const getterRegex = `get${spacesRegex}`;
    const setterRegex = `set${spacesRegex}`;
    const accessorRegex = `accessor${spacesRegex}`;
    const getAsync = (isAsync: boolean) => isAsync ? "async " : "";
    const getStatic = (isStatic: boolean) => isStatic ? "static " : "";
    const getAbstract = (isAbstract: boolean) => isAbstract ? "abstract " : "";
    const getReadOnly = (writeMode: WriteModifier) => writeMode === WriteModifier.readOnly ? "readonly " : "";
    const getConst = (writeMode: WriteModifier) => writeMode === WriteModifier.const ? "const " : "";
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
                members += addMemberCountInRegionName ? ` (${count})` : "";
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
                                code = code.replace(new RegExp(`${staticRegex}${abstractRegex}${asyncRegex}${node.name}`), `public ${getStatic(node.isStatic)}${getAbstract(node.isAbstract)}${getAsync(node.isAsync)} ${node.name}`);
                            }
                            else if (node instanceof PropertyNode)
                            {
                                code = code.replace(new RegExp(`${staticRegex}${abstractRegex}${constRegex}${readonlyRegex}${node.name}`), `public ${getStatic(node.isStatic)}${getAbstract(node.isAbstract)}${getConst(node.writeMode)}${getReadOnly(node.writeMode)} ${node.name}`);
                            }
                            else if (node instanceof AccessorNode)
                            {
                                code = code.replace(new RegExp(`${staticRegex}${abstractRegex}${accessorRegex}${node.name}`), `public ${getStatic(node.isStatic)}${getAbstract(node.isAbstract)}accessor ${node.name}`);
                            }
                            else if (node instanceof GetterNode)
                            {
                                code = code.replace(new RegExp(`${staticRegex}${abstractRegex}${getterRegex}${node.name}`), `public ${getStatic(node.isStatic)}${getAbstract(node.isAbstract)}get ${node.name}`);
                            }
                            else if (node instanceof SetterNode)
                            {
                                code = code.replace(new RegExp(`${staticRegex}${abstractRegex}${setterRegex}${node.name}`), `public ${getStatic(node.isStatic)}${getAbstract(node.isAbstract)}set ${node.name}`);
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
                members += addMemberCountInRegionName ? ` (${count})` : "";
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

// #endregion Functions (12)

// #region Variables (1)

let configuration = getConfiguration();

// #endregion Variables (1)
