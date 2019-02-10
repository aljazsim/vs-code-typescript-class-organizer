import { ClassNode } from "./src/elements/class-node";
import { ElementNode } from "./src/elements/element-node";
import { InterfaceNode } from "./src/elements/interface-node";
import { UnknownNode } from "./src/elements/unknown-node";
import { formatLines, removeRegions } from "./src/regions";
import { Transformer } from "./src/transformer";
import { compareNumbers, getClasses, getEnums, getFunctions, getImports, getInterfaces, getTypeAliases } from "./src/utils";
import * as ts from "typescript";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext)
{
    context.subscriptions.push(vscode.commands.registerCommand('tsco.organize', () => organize(vscode.window.activeTextEditor, getUseRegionsConfig(), getAddPublicModifierIfMissing(), getAddRegionIdentationConfig(), getIdentationConfig())));
    context.subscriptions.push(vscode.commands.registerCommand('tsco.organizeAll', () => organizeAll(getUseRegionsConfig(), getAddPublicModifierIfMissing(), getAddRegionIdentationConfig(), getIdentationConfig())));
}

function getUseRegionsConfig(): boolean
{
    return vscode.workspace.getConfiguration("tsco").get<boolean>("useRegions") === true;
}

function getAddPublicModifierIfMissing(): boolean
{
    return vscode.workspace.getConfiguration("tsco").get<boolean>("addPublicModifierIfMissing") === true;
}

function getAddRegionIdentationConfig(): boolean
{
    return vscode.workspace.getConfiguration("tsco").get<boolean>("addRegionIdentation") === true;
}

function getIdentationConfig(): string
{
    return "    ";
}

function organizeAll(useRegions: boolean, addPublicModifierIfMissing: boolean, addIdentation: boolean, identation: string)
{
    vscode.workspace.findFiles("**/*.ts", "**/node_modules/**")
        .then(typescriptFiles => typescriptFiles.forEach(typescriptFile => vscode.workspace.openTextDocument(typescriptFile)
            .then(document => vscode.window.showTextDocument(document)
                .then(editor => organize(editor, useRegions, addPublicModifierIfMissing, addIdentation, identation) !== null))));

}

function organize(editor: vscode.TextEditor | undefined, useRegions: boolean, addPublicModifierIfMissing: boolean, addRegionIdentation: boolean, identation: string)
{
    let sourceFile: ts.SourceFile;
    let sourceCode: string;
    let edit: vscode.WorkspaceEdit;
    let elements: ElementNode[];
    let start: vscode.Position;
    let end: vscode.Position;
    let range: vscode.Range;

    if (editor)
    {
        sourceCode = editor.document.getText();
        sourceCode = removeRegions(sourceCode);

        // organize type aliases, interfaces, classes, enums, functions and variables
        sourceFile = ts.createSourceFile(editor.document.fileName, sourceCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

        elements = new Transformer().analyzeSyntaxTree(sourceFile);

        if (elements.filter(x => !(x instanceof UnknownNode)))
        {
            let imports = getImports(elements);
            let functions = getFunctions(elements);
            let typeAliases = getTypeAliases(elements);
            let interfaces = getInterfaces(elements);
            let classes = getClasses(elements);
            let enums = getEnums(elements);

            let groups = [
                { description: "Imports", groups: [{ nodes: imports }], regions: false },
                { description: "Type aliases", groups: [{ nodes: typeAliases }], regions: true },
                { description: "Interfaces", groups: [{ nodes: interfaces }], regions: true },
                { description: "Classes", groups: [{ nodes: classes }], regions: true },
                { description: "Enums", groups: [{ nodes: enums }], regions: true },
                { description: "Functions", groups: [{ nodes: functions }], regions: true }
            ];

            if (functions.length + typeAliases.length + interfaces.length + classes.length + enums.length > 1 ||
                functions.length > 0)
            {
                sourceCode = print(groups, sourceCode, 0, sourceCode.length, 0, false, false, identation);
            }
        }

        // organize members of interfaces and classes
        sourceFile = ts.createSourceFile(editor.document.fileName, sourceCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

        elements = new Transformer().analyzeSyntaxTree(sourceFile);

        for (let element of elements.sort((a, b) => compareNumbers(a.fullStart, b.fullStart) * -1))
        {
            if (element instanceof InterfaceNode)
            {
                let interfaceNode = <InterfaceNode>element;
                let groups = [
                    {
                        description: "Properties",
                        groups: [
                            { nodes: interfaceNode.getConstProperties() },
                            { nodes: interfaceNode.getReadOnlyProperties() },
                            { nodes: interfaceNode.getProperties() }
                        ],
                        regions: true
                    },
                    { description: "Indexes", groups: [{ nodes: interfaceNode.getIndexes() }], regions: true },
                    { description: "Methods", groups: [{ nodes: interfaceNode.getMethods() }], regions: true }
                ];

                sourceCode = print(groups, sourceCode, interfaceNode.membersStart, interfaceNode.membersEnd, 1, false, addRegionIdentation, identation);
            }
            else if (element instanceof ClassNode)
            {
                let classNode = <ClassNode>element;
                let groups = [
                    {
                        description: "Properties",
                        groups: [
                            { nodes: classNode.getPrivateStaticConstProperties() },
                            { nodes: classNode.getPrivateConstProperties() },
                            { nodes: classNode.getPrivateStaticReadOnlyProperties() },
                            { nodes: classNode.getPrivateReadOnlyProperties() },
                            { nodes: classNode.getPrivateStaticProperties() },
                            { nodes: classNode.getPrivateProperties() },

                            { nodes: classNode.getProtectedStaticConstProperties() },
                            { nodes: classNode.getProtectedConstProperties() },
                            { nodes: classNode.getProtectedStaticReadOnlyProperties() },
                            { nodes: classNode.getProtectedReadOnlyProperties() },
                            { nodes: classNode.getProtectedStaticProperties() },
                            { nodes: classNode.getProtectedProperties() },

                            { nodes: classNode.getPublicStaticConstProperties() },
                            { nodes: classNode.getPublicConstProperties() },
                            { nodes: classNode.getPublicStaticReadOnlyProperties() },
                            { nodes: classNode.getPublicReadOnlyProperties() },
                            { nodes: classNode.getPublicStaticProperties() },
                            { nodes: classNode.getPublicProperties() }
                        ],
                        regions: true
                    },

                    { description: "Constructors", groups: [{ nodes: classNode.getConstructors() }], regions: true },

                    { description: "Public Static Accessors", groups: [{ nodes: classNode.getPublicStaticGettersAndSetters() }], regions: true },
                    { description: "Public Accessors", groups: [{ nodes: classNode.getPublicGettersAndSetters() }], regions: true },
                    { description: "Public Abstract Accessors", groups: [{ nodes: classNode.getPublicAbstractGettersAndSetters() }], regions: true },

                    { description: "Protected Static Accessors", groups: [{ nodes: classNode.getProtectedStaticGettersAndSetters() }], regions: true },
                    { description: "Protected Accessors", groups: [{ nodes: classNode.getProtectedGettersAndSetters() }], regions: true },
                    { description: "Protected Abstract Accessors", groups: [{ nodes: classNode.getProtectedAbstractGettersAndSetters() }], regions: true },

                    { description: "Private Static Accessors", groups: [{ nodes: classNode.getPrivateStaticGettersAndSetters() }], regions: true },
                    { description: "Private Accessors", groups: [{ nodes: classNode.getPrivateGettersAndSetters() }], regions: true },
                    { description: "Private Abstract Accessors", groups: [{ nodes: classNode.getPrivateAbstractGettersAndSetters() }], regions: true },

                    { description: "Public Static Indexes", groups: [{ nodes: classNode.getPublicStaticIndexes() }], regions: true },
                    { description: "Public Indexes", groups: [{ nodes: classNode.getPublicIndexes() }], regions: true },
                    { description: "Public Abstract Indexes", groups: [{ nodes: classNode.getPublicAbstractIndexes() }], regions: true },

                    { description: "Protected Static Indexes", groups: [{ nodes: classNode.getProtectedStaticIndexes() }], regions: true },
                    { description: "Protected Indexes", groups: [{ nodes: classNode.getProtectedIndexes() }], regions: true },
                    { description: "Protected Abstract Indexes", groups: [{ nodes: classNode.getProtectedAbstractIndexes() }], regions: true },

                    { description: "Private Static Indexes", groups: [{ nodes: classNode.getPrivateStaticIndexes() }], regions: true },
                    { description: "Private Indexes", groups: [{ nodes: classNode.getPrivateIndexes() }], regions: true },
                    { description: "Private Abstract Indexes", groups: [{ nodes: classNode.getPrivateAbstractIndexes() }], regions: true },

                    { description: "Public Static Methods", groups: [{ nodes: classNode.getPublicStaticMethods() }], regions: true },
                    { description: "Public Methods", groups: [{ nodes: classNode.getPublicMethods() }], regions: true },
                    { description: "Public Abstract Methods", groups: [{ nodes: classNode.getPublicAbstractMethods() }], regions: true },

                    { description: "Protected Static Methods", groups: [{ nodes: classNode.getProtectedStaticMethods() }], regions: true },
                    { description: "Protected Methods", groups: [{ nodes: classNode.getProtectedMethods() }], regions: true },
                    { description: "Protected Abstract Methods", groups: [{ nodes: classNode.getProtectedAbstractMethods() }], regions: true },

                    { description: "Private Static Methods", groups: [{ nodes: classNode.getPrivateStaticMethods() }], regions: true },
                    { description: "Private Methods", groups: [{ nodes: classNode.getPrivateMethods() }] },
                    { description: "Private Abstract Methods", groups: [{ nodes: classNode.getPrivateAbstractMethods() }], regions: true },
                ];

                sourceCode = print(groups, sourceCode, classNode.membersStart, classNode.membersEnd, 1, addPublicModifierIfMissing, addRegionIdentation, identation);
            }
        }

        if (!useRegions)
        {
            sourceCode = removeRegions(sourceCode);
        }

        sourceCode = formatLines(sourceCode);

        start = new vscode.Position(0, 0);
        end = new vscode.Position(editor.document.lineCount, editor.document.lineAt(editor.document.lineCount - 1).text.length);
        range = new vscode.Range(start, end);

        edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, range, sourceCode);

        return vscode.workspace.applyEdit(edit);
    }
}

function print(groups: any, sourceCode: string, start: number, end: number, identationLevel: number, addPublicModifierIfMissing: boolean, addRegionIdentation: boolean, identation: string)
{
    let sourceCode2: string;
    let count;
    let members = "";
    let newLine = "\r\n";

    for (let group of groups)
    {
        count = 0;

        for (let group2 of group.groups)
        {
            count += group2.nodes.length;
        }

        if (count > 0)
        {
            if (group.regions)
            {
                members += newLine;
                members += `${addRegionIdentation ? identation : ""}// #region ${group.description} (${count})${newLine}`;
            }

            members += newLine;

            for (let group2 of group.groups)
            {
                for (let node of group2.nodes)
                {
                    let comment = sourceCode.substring(node.fullStart, node.start).trim();
                    let code = sourceCode.substring(node.start, node.end).trim();

                    if (addPublicModifierIfMissing &&
                        !code.startsWith("type") &&
                        !code.startsWith("class") &&
                        !code.startsWith("interface") &&
                        !code.startsWith("function") &&
                        !code.startsWith("constructor") &&
                        !code.startsWith("private") &&
                        !code.startsWith("protected") &&
                        !code.startsWith("public"))
                    {
                        code = "public " + code;
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

            if (group.regions)
            {
                members += newLine;
                members += `${addRegionIdentation ? identation : ""}// #endregion${newLine}`;
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
