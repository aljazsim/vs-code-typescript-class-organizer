import * as ts from "typescript";
import { ElementNodeGroup } from "../elements/element-node-group";
import { Transformer } from "../transformer";
import { getClasses, getEnums, getExpressions, getFunctions, getImports, getInterfaces, getTypeAliases, getVariables, groupByPlaceAboveBelow } from "./node-helper";
import { ClassNode } from "../elements/class-node";
import { ElementNodeGroupConfiguration } from "../configuration/element-node-group-configuration";
import { MemberType } from "../member-type";
import { InterfaceNode } from "../elements/interface-node";
import { Configuration } from "../configuration/configuration";
import { removeRegions } from "./region-helper";
import { compareNumbers } from "./comparing-helper";
import { PropertyNode } from "../elements/property-node";
import { MethodNode } from "../elements/method-node";
import { AccessorNode } from "../elements/accessor-node";
import { GetterNode } from "../elements/getter-node";
import { SetterNode } from "../elements/setter-node";
import { WriteModifier } from "../elements/write-modifier";
import { ElementNode } from "../elements/element-node";

// #region Functions (7)

export function formatLines(sourceCode: string)
{
    const newLine = "\r\n";
    let emptyLineRegex = new RegExp(`^\\s*$`);
    let newLineRegex = new RegExp(`\r?\n|\r`);
    let openingBraceRegex = new RegExp(`^.*\{\\s*$`);
    let closingBraceRegex = new RegExp(`^\\s*\}\\s*$`);

    let lines: string[] = sourceCode.split(newLineRegex);

    for (let i = 0; i < lines.length - 1; i++)
    {
        if (openingBraceRegex.test(lines[i]) &&
            emptyLineRegex.test(lines[i + 1]))
        {
            // remove empty line after {
            lines.splice(i + 1, 1);

            i--;
        }
        else if (emptyLineRegex.test(lines[i]) &&
            closingBraceRegex.test(lines[i + 1]))
        {
            // remove empty line before }
            lines.splice(i, 1);

            i--;
        }
        else if (emptyLineRegex.test(lines[i]) &&
            emptyLineRegex.test(lines[i + 1]))
        {
            lines.splice(i, 1);

            i--;
        }
    }

    return lines.join(newLine);
}

export function getIndentation(sourceCode: string): string
{
    let tab = "\t";
    let twoSpaces = "  ";
    let fourSpaces = twoSpaces + twoSpaces;

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

export function organizeClassMembers(classNode: ClassNode, memberTypeOrder: ElementNodeGroupConfiguration[], groupElementsWithDecorators: boolean): ElementNodeGroup[]
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

export function organizeInterfaceMembers(interfaceNode: InterfaceNode, memberTypeOrder: ElementNodeGroupConfiguration[], groupElementsWithDecorators: boolean)
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

export function organizeTypes(sourceCode: string, fileName: string, configuration: Configuration)
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

        if (typeAliases.length + interfaces.length + classes.length + enums.length + functions.length > 1 ||
            typeAliases.length + interfaces.length + classes.length + enums.length == 0 && functions.length >= 1)
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

export function print(groups: ElementNodeGroup[], sourceCode: string, start: number, end: number, IndentationLevel: number, addMemberCountInRegionName: boolean, addPublicModifierIfMissing: boolean, addRegionIndentation: boolean, indentation: string, addRegionCaptionToRegionEnd: boolean, groupElementsWithDecorators: boolean, treatArrowFunctionPropertiesAsMethods: boolean)
{
    let sourceCode2: string;
    let count = 0;
    let members = "";
    const newLine = "\r\n";
    const spacesRegex = "\\s*";
    const staticRegex = `(static${spacesRegex})?`;
    const readonlyRegex = `(readonly${spacesRegex})?`;
    const constRegex = `(const${spacesRegex})?`;
    const abstractRegex = `(abstract${spacesRegex})?`;
    const asyncRegex = `(async${spacesRegex})?`;
    const getterRegex = `get${spacesRegex}`;
    const setterRegex = `set${spacesRegex}`;
    const accessorRegex = `accessor${spacesRegex}`;
    const getAsync = (isAsync: boolean) => isAsync ? "async " : "";
    const getStatic = (isStatic: boolean) => isStatic ? "static " : "";
    const getAbstract = (isAbstract: boolean) => isAbstract ? "abstract " : "";
    const getReadOnly = (writeMode: WriteModifier) => writeMode === WriteModifier.readOnly ? "readonly " : "";
    const getConst = (writeMode: WriteModifier) => writeMode === WriteModifier.const ? "const " : "";
    const addPublic = (strings: string[]) => "public " + strings.filter(s => s !== "").map(s => s.trim()).join(" ");
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
                members += `${addRegionIndentation ? indentation : ""}// #region`;
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
                            let regex: RegExp | null = null;
                            let replaceWith: string | null = null;

                            if (node instanceof MethodNode)
                            {
                                regex = new RegExp(`${staticRegex}${abstractRegex}${asyncRegex}${node.name}`);
                                replaceWith = addPublic([getStatic(node.isStatic), getAbstract(node.isAbstract), getAsync(node.isAsync), node.name]);
                            }
                            else if (node instanceof PropertyNode)
                            {
                                regex = new RegExp(`${staticRegex}${abstractRegex}${constRegex}${readonlyRegex}${node.name}`)
                                replaceWith = addPublic([getStatic(node.isStatic), getAbstract(node.isAbstract), getConst(node.writeMode), getReadOnly(node.writeMode), node.name]);
                            }
                            else if (node instanceof AccessorNode)
                            {
                                regex = RegExp(`${staticRegex}${abstractRegex}${accessorRegex}${node.name}`);
                                replaceWith = addPublic([getStatic(node.isStatic), getAbstract(node.isAbstract), "accessor", node.name]);
                            }
                            else if (node instanceof GetterNode)
                            {
                                regex = RegExp(`${staticRegex}${abstractRegex}${getterRegex}${node.name}`);
                                replaceWith = addPublic([getStatic(node.isStatic), getAbstract(node.isAbstract), "get", node.name]);
                            }
                            else if (node instanceof SetterNode)
                            {
                                regex = new RegExp(`${staticRegex}${abstractRegex}${setterRegex}${node.name}`);
                                replaceWith = addPublic([getStatic(node.isStatic), getAbstract(node.isAbstract), "set", node.name]);
                            }

                            if (regex && replaceWith)
                            {
                                code = replaceAfterDecorators(code, node.decorators, regex, replaceWith);
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
                        members += `${IndentationLevel === 1 ? indentation : ""}${comment}${newLine}`;
                    }

                    members += `${IndentationLevel === 1 ? indentation : ""}${code}`;
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
                members += `${addRegionIndentation ? indentation : ""}// #endregion`;
                members += addRegionCaptionToRegionEnd ? ` ${group.caption}` : "";
                members += addMemberCountInRegionName ? ` (${count})` : "";
                members += newLine;
            }

            members += newLine;
        }
    }

    sourceCode2 = sourceCode.substring(0, start).trimEnd();
    sourceCode2 += newLine;
    sourceCode2 += (addRegionIndentation ? indentation : "") + members.trim();
    sourceCode2 += newLine;
    sourceCode2 += sourceCode.substring(end, sourceCode.length).trimStart();

    return sourceCode2.trimStart();
}

export function replaceAfterDecorators(code: string, decorators: string[], replaceWhat: RegExp, replaceWith: string)
{
    const afterDecoratorsStart = decorators.length === 0 ? 0 : (code.lastIndexOf(decorators[decorators.length - 1]) + decorators[decorators.length - 1].length);
    const codeDecorators = code.substring(0, afterDecoratorsStart);
    const codeAfterDecorators = code.substring(afterDecoratorsStart);

    return codeDecorators + codeAfterDecorators.replace(replaceWhat, replaceWith);
}

// #endregion Functions (7)
