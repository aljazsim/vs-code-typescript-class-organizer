"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const configuration_1 = require("./src/configuration/configuration");
const element_node_group_1 = require("./src/element-node-group");
const element_node_group_configuration_1 = require("./src/configuration/element-node-group-configuration");
const class_node_1 = require("./src/elements/class-node");
const getter_node_1 = require("./src/elements/getter-node");
const interface_node_1 = require("./src/elements/interface-node");
const method_node_1 = require("./src/elements/method-node");
const property_node_1 = require("./src/elements/property-node");
const setter_node_1 = require("./src/elements/setter-node");
const unknown_node_1 = require("./src/elements/unknown-node");
const member_type_1 = require("./src/member-type");
const regions_1 = require("./src/helpers/region-helper");
const transformer_1 = require("./src/transformer");
const utils_1 = require("./src/utils");
const ts = require("typescript");
const vscode = require("vscode");
let configuration = getConfiguration();
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('tsco.organize', () => organize(vscode.window.activeTextEditor, configuration)));
    context.subscriptions.push(vscode.commands.registerCommand('tsco.organizeAll', () => organizeAll(configuration)));
    vscode.workspace.onDidChangeConfiguration(e => configuration = getConfiguration());
    vscode.workspace.onWillSaveTextDocument(e => {
        if (vscode.window.activeTextEditor &&
            vscode.window.activeTextEditor.document.fileName == e.document.fileName) {
            if (configuration.organizeOnSave) {
                organize(vscode.window.activeTextEditor, getConfiguration());
            }
        }
    });
}
exports.activate = activate;
function getConfiguration() {
    let configuration = vscode.workspace.getConfiguration("tsco");
    return new configuration_1.Configuration(configuration.get("useRegions") === true, configuration.get("addPublicModifierIfMissing") === true, configuration.get("accessorsBeforeCtor") === true, configuration.get("addRowNumberInRegionName") === true, configuration.get("addRegionIndentation") === true, configuration.get("addRegionCaptionToRegionEnd") === true, configuration.get("groupPropertiesWithDecorators") === true, configuration.get("treatArrowFunctionPropertiesAsMethods") === true, configuration.get("organizeOnSave") === true, getMemberOrderConfig());
}
function getMemberOrderConfig() {
    let memberTypeOrderConfiguration = vscode.workspace.getConfiguration("tsco").get("memberOrder") || [];
    let memberTypeOrder = [];
    let defaultMemberTypeOrder = Object.keys(member_type_1.MemberType) // same order as in the enum
        .filter(x => !isNaN(parseInt(x, 10))) // do not include int value
        .map(x => parseInt(x, 10));
    // map member type order from configuration
    memberTypeOrderConfiguration.forEach((x) => memberTypeOrder.push(parseElementNodeGroupConfiguration(x)));
    // add missing member types (prevent duplicates)
    defaultMemberTypeOrder
        .filter(x => !memberTypeOrder.some(y => y.memberTypes && y.memberTypes.length > 0 && y.memberTypes.some(z => z === x)))
        .forEach(x => {
            let defaultElementNodeGroupConfiguration = new element_node_group_configuration_1.ElementNodeGroupConfiguration();
            defaultElementNodeGroupConfiguration.caption = convertPascalCaseToTitleCase(member_type_1.MemberType[x]);
            defaultElementNodeGroupConfiguration.memberTypes = [x];
            memberTypeOrder.push(defaultElementNodeGroupConfiguration);
        });
    return memberTypeOrder;
}
function convertPascalCaseToTitleCase(value) {
    if (value &&
        value.length > 1) {
        value = value.replace(/(?:^|\.?)([A-Z])/g, (x, y) => " " + y);
    }
    return value;
}
function parseElementNodeGroupConfiguration(x) {
    let elementNodeGroupConfiguration = new element_node_group_configuration_1.ElementNodeGroupConfiguration();
    elementNodeGroupConfiguration.caption = x.caption;
    elementNodeGroupConfiguration.memberTypes = x.memberTypes.map(y => member_type_1.MemberType[y]);
    return elementNodeGroupConfiguration;
}
function getIndentation(sourceCode) {
    let tab = "\t";
    let twoSpaces = "  ";
    let fourSpaces = "    ";
    for (const sourceCodeLine of sourceCode.split("\n")) {
        if (sourceCodeLine.startsWith(tab)) {
            return tab;
        }
        else if (sourceCodeLine.startsWith(fourSpaces)) {
            return fourSpaces;
        }
        else if (sourceCodeLine.startsWith(twoSpaces)) {
            return twoSpaces;
        }
    }
    return twoSpaces;
}
function organizeAll(configuration) {
    vscode.workspace.findFiles("**/*.ts", "**/node_modules/**")
        .then(typescriptFiles => typescriptFiles.forEach(typescriptFile => vscode.workspace.openTextDocument(typescriptFile)
            .then(document => vscode.window.showTextDocument(document)
                .then(editor => organize(editor, configuration) !== null))));
}
function organize(editor, configuration) {
    let edit;
    let start;
    let end;
    let range;
    if (editor) {
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
function print(groups, sourceCode, start, end, IndentationLevel, addRowNumberInRegionName, addPublicModifierIfMissing, addRegionIndentation, Indentation, addRegionCaptionToRegionEnd, groupElementsWithDecorators, treatArrowFunctionPropertiesAsMethods) {
    let sourceCode2;
    let count = 0;
    let members = "";
    let newLine = "\r\n";
    let nodeGroups = [];
    for (let group of groups) {
        if (group.nodes &&
            group.nodes.length > 0) {
            count = group.nodes.length;
            nodeGroups = [group.nodes];
        }
        else if (group.nodeSubGroups &&
            group.nodeSubGroups.length > 0) {
            count = group.nodeSubGroups.reduce((sum, x) => sum + x.nodes.length, 0);
            nodeGroups = group.nodeSubGroups.map(x => x.nodes).filter(x => x.length > 0);
        }
        else {
            count = 0;
            nodeGroups = [];
        }
        if (count > 0) {
            if (group.isRegion) {
                members += newLine;
                members += `${addRegionIndentation ? Indentation : ""}// #region`;
                members += group.caption ? ` ${group.caption}` : "";
                members += addRowNumberInRegionName ? ` (${count})` : "";
                members += newLine;
            }
            members += newLine;
            for (let nodeGroup of nodeGroups) {
                for (let i = 0; i < nodeGroup.length; i++) {
                    const node = nodeGroup[i];
                    let comment = sourceCode.substring(node.fullStart, node.start).trim();
                    let code = sourceCode.substring(node.start, node.end).trim();
                    if (addPublicModifierIfMissing) {
                        if (node.accessModifier === null) {
                            if (node instanceof method_node_1.MethodNode) {
                                if (code.startsWith("static")) {
                                    if (code.startsWith("static async")) {
                                        code = code.replace(new RegExp(`static\\s*async\\s*${node.name}\\s*\\(`), `public static async ${node.name}(`);
                                    }
                                    else {
                                        code = code.replace(new RegExp(`static\\s*${node.name}\\s*\\(`), `public static ${node.name}(`);
                                    }
                                }
                                else {
                                    if (code.startsWith("async")) {
                                        code = code.replace(new RegExp(`async\\s*${node.name}\\s*\\(`), `public async ${node.name}(`);
                                    }
                                    else {
                                        code = code.replace(new RegExp(`${node.name}\\s*\\(`), `public ${node.name}(`);
                                    }
                                }
                            }
                            else if (node instanceof property_node_1.PropertyNode) {
                                if (code.startsWith("static")) {
                                    code = code.replace(new RegExp(`static\\s*${node.name}\\s*:`), `public static ${node.name}:`);
                                    code = code.replace(new RegExp(`static\\s*${node.name}\\s*=`), `public static ${node.name} =`);
                                    code = code.replace(new RegExp(`static\\s*${node.name}\\s*;`), `public static ${node.name};`);
                                }
                                else if (code.startsWith("readonly")) {
                                    code = code.replace(new RegExp(`static\\s*${node.name}\\s*:`), `public readonly ${node.name}:`);
                                    code = code.replace(new RegExp(`static\\s*${node.name}\\s*=`), `public readonly ${node.name} =`);
                                    code = code.replace(new RegExp(`static\\s*${node.name}\\s*;`), `public readonly ${node.name};`);
                                }
                                else {
                                    code = code.replace(new RegExp(`${node.name}\\s*:`), `public ${node.name}:`);
                                    code = code.replace(new RegExp(`${node.name}\\s*=`), `public ${node.name} =`);
                                    code = code.replace(new RegExp(`${node.name}\\s*;`), `public ${node.name};`);
                                }
                            }
                            else if (node instanceof getter_node_1.GetterNode) {
                                if (code.startsWith("static")) {
                                    code = code.replace(new RegExp(`static\\s*get\\s*${node.name}\\s*\\(`), `public static get ${node.name}(`);
                                }
                                else {
                                    code = code.replace(new RegExp(`get\\s*${node.name}\\s*\\(`), `public get ${node.name}(`);
                                }
                            }
                            else if (node instanceof setter_node_1.SetterNode) {
                                if (code.startsWith("static")) {
                                    code = code.replace(new RegExp(`static\\s*set\\s*${node.name}\\s*\\(`), `public static set ${node.name}(`);
                                }
                                else {
                                    code = code.replace(new RegExp(`set\\s*${node.name}\\s*\\(`), `public set ${node.name}(`);
                                }
                            }
                        }
                    }
                    if (groupElementsWithDecorators) {
                        if (i > 0) {
                            if (nodeGroup[i - 1].decorators.length > 0 &&
                                nodeGroup[i].decorators.length === 0) {
                                members += newLine;
                            }
                        }
                    }
                    if (comment !== "") {
                        members += `${IndentationLevel === 1 ? Indentation : ""}${comment}${newLine}`;
                    }
                    members += `${IndentationLevel === 1 ? Indentation : ""}${code}`;
                    members += newLine;
                    if (code.endsWith("}")) {
                        members += newLine;
                    }
                    else if (node instanceof property_node_1.PropertyNode &&
                        node.isArrowFunction &&
                        treatArrowFunctionPropertiesAsMethods) {
                        // arrow function property -> add a new line
                        members += newLine;
                    }
                }
                members += newLine;
            }
            if (group.isRegion) {
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
function organizeTypes(sourceCode, fileName, configuration) {
    sourceCode = (0, regions_1.removeRegions)(sourceCode);
    let indentation = getIndentation(sourceCode);
    // organize type aliases, interfaces, classes, enums, functions and variables
    let sourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
    let elements = new transformer_1.Transformer().analyzeSyntaxTree(sourceFile, configuration.treatArrowFunctionPropertiesAsMethods);
    if (!elements.some(x => !(x instanceof unknown_node_1.UnknownNode))) {
        let imports = (0, utils_1.getImports)(elements, configuration.groupPropertiesWithDecorators);
        let functions = (0, utils_1.getFunctions)(elements, configuration.groupPropertiesWithDecorators);
        let typeAliases = (0, utils_1.getTypeAliases)(elements, configuration.groupPropertiesWithDecorators);
        let interfaces = (0, utils_1.getInterfaces)(elements, configuration.groupPropertiesWithDecorators);
        let classes = (0, utils_1.getClasses)(elements, configuration.groupPropertiesWithDecorators);
        let enums = (0, utils_1.getEnums)(elements, configuration.groupPropertiesWithDecorators);
        let groups = [
            new element_node_group_1.ElementNodeGroup("Imports", [], imports, false),
            new element_node_group_1.ElementNodeGroup("Type aliases", [], typeAliases, true),
            new element_node_group_1.ElementNodeGroup("Interfaces", [], interfaces, true),
            new element_node_group_1.ElementNodeGroup("Classes", [], classes, true),
            new element_node_group_1.ElementNodeGroup("Enums", [], enums, true),
            new element_node_group_1.ElementNodeGroup("Functions", [], functions, true)
        ];
        if (functions.length + typeAliases.length + interfaces.length + classes.length + enums.length > 1 ||
            functions.length > 0) {
            sourceCode = print(groups, sourceCode, 0, sourceCode.length, 0, configuration.addRowNumberInRegionName, false, false, indentation, configuration.addRegionCaptionToRegionEnd, configuration.groupPropertiesWithDecorators, configuration.treatArrowFunctionPropertiesAsMethods);
        }
    }
    // organize members of interfaces and classes
    sourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
    elements = new transformer_1.Transformer().analyzeSyntaxTree(sourceFile, configuration.treatArrowFunctionPropertiesAsMethods);
    for (let element of elements.sort((a, b) => (0, utils_1.compareNumbers)(a.fullStart, b.fullStart) * -1)) {
        if (element instanceof interface_node_1.InterfaceNode) {
            let interfaceNode = element;
            let groups = organizeInterfaceMembers(interfaceNode, configuration.memberOrder, configuration.groupPropertiesWithDecorators);
            sourceCode = print(groups, sourceCode, interfaceNode.membersStart, interfaceNode.membersEnd, 1, configuration.addRowNumberInRegionName, false, configuration.addRegionIndentation, indentation, configuration.addRegionCaptionToRegionEnd, configuration.groupPropertiesWithDecorators, configuration.treatArrowFunctionPropertiesAsMethods);
        }
        else if (element instanceof class_node_1.ClassNode) {
            let classNode = element;
            let groups = organizeClassMembers(classNode, configuration.memberOrder, configuration.groupPropertiesWithDecorators);
            sourceCode = print(groups, sourceCode, classNode.membersStart, classNode.membersEnd, 1, configuration.addRowNumberInRegionName, configuration.addPublicModifierIfMissing, configuration.addRegionIndentation, indentation, configuration.addRegionCaptionToRegionEnd, configuration.groupPropertiesWithDecorators, configuration.treatArrowFunctionPropertiesAsMethods);
        }
    }
    if (!configuration.useRegions) {
        sourceCode = (0, regions_1.removeRegions)(sourceCode);
    }
    sourceCode = (0, regions_1.formatLines)(sourceCode);
    return sourceCode;
}
function organizeInterfaceMembers(interfaceNode, memberTypeOrder, groupElementsWithDecorators) {
    let regions = [];
    let memberGroups;
    for (const memberTypeGroup of memberTypeOrder) {
        memberGroups = [];
        for (const memberType of memberTypeGroup.memberTypes) {
            if (memberType === member_type_1.MemberType.publicConstProperties) {
                // public const properties
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], interfaceNode.getConstProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicReadOnlyProperties) {
                // public readonly methods
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], interfaceNode.getReadOnlyProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicProperties) {
                // public methods
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], interfaceNode.getProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicIndexes) {
                // public indexes
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], interfaceNode.getIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicMethods) {
                // public methods
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], interfaceNode.getMethods(groupElementsWithDecorators), false));
            }
        }
        regions.push(new element_node_group_1.ElementNodeGroup(memberTypeGroup.caption, memberGroups, [], true));
    }
    return regions;
}
function organizeClassMembers(classNode, memberTypeOrder, groupElementsWithDecorators) {
    let regions = [];
    let memberGroups;
    for (const memberTypeGroup of memberTypeOrder) {
        memberGroups = [];
        for (const memberType of memberTypeGroup.memberTypes) {
            if (memberType === member_type_1.MemberType.privateStaticConstProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPrivateStaticConstProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.privateConstProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPrivateConstProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.privateStaticReadOnlyProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPrivateStaticReadOnlyProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.privateReadOnlyProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPrivateReadOnlyProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.privateStaticProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPrivateStaticProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.privateProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPrivateProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.protectedStaticConstProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getProtectedStaticConstProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.protectedConstProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getProtectedConstProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.protectedStaticReadOnlyProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getProtectedStaticReadOnlyProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.protectedReadOnlyProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getProtectedReadOnlyProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.protectedStaticProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getProtectedStaticProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.protectedProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getProtectedProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicStaticConstProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPublicStaticConstProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicConstProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPublicConstProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicStaticReadOnlyProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPublicStaticReadOnlyProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicReadOnlyProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPublicReadOnlyProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicStaticProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPublicStaticProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicProperties) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPublicProperties(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.constructors) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getConstructors(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicStaticIndexes) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPublicStaticIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicIndexes) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPublicIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicAbstractIndexes) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPublicAbstractIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.protectedStaticIndexes) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getProtectedStaticIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.protectedIndexes) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getProtectedIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.protectedAbstractIndexes) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getProtectedAbstractIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.privateStaticIndexes) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPrivateStaticIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.privateIndexes) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPrivateIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.privateAbstractIndexes) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPrivateAbstractIndexes(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicStaticGettersAndSetters) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPublicStaticGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicGettersAndSetters) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPublicGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicAbstractGettersAndSetters) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPublicAbstractGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.protectedStaticGettersAndSetters) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getProtectedStaticGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.protectedGettersAndSetters) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getProtectedGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.protectedAbstractGettersAndSetters) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getProtectedAbstractGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.privateStaticGettersAndSetters) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPrivateStaticGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.privateGettersAndSetters) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPrivateGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.privateAbstractGettersAndSetters) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPrivateAbstractGettersAndSetters(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicStaticMethods) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPublicStaticMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicMethods) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPublicMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.publicAbstractMethods) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPublicAbstractMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.protectedStaticMethods) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getProtectedStaticMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.protectedMethods) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getProtectedMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.protectedAbstractMethods) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getProtectedAbstractMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.privateStaticMethods) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPrivateStaticMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.privateMethods) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPrivateMethods(groupElementsWithDecorators), false));
            }
            else if (memberType === member_type_1.MemberType.privateAbstractMethods) {
                memberGroups.push(new element_node_group_1.ElementNodeGroup(null, [], classNode.getPrivateAbstractMethods(groupElementsWithDecorators), false));
            }
        }
        regions.push(new element_node_group_1.ElementNodeGroup(memberTypeGroup.caption, memberGroups, [], true));
    }
    return regions;
}
//# sourceMappingURL=extension.js.map