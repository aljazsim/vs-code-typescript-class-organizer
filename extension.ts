import * as ts from "typescript";
import * as vscode from "vscode";
import { ClassNode } from "./src/elements/class-node";
import { compareNumbers } from "./src/utils";
import { ElementNode } from "./src/elements/element-node";
import { formatLines, removeRegions } from "./src/regions";
import { InterfaceNode } from "./src/elements/interface-node";
import { Transformer } from "./src/transformer";

export function activate(context: vscode.ExtensionContext)
{
    context.subscriptions.push(vscode.commands.registerCommand('tsco.organize', () => organize(vscode.window.activeTextEditor, getUseRegions())));
    context.subscriptions.push(vscode.commands.registerCommand('tsco.organizeAll', () => organizeAll(getUseRegions())));
}

function getUseRegions(): boolean
{
    return vscode.workspace.getConfiguration("tsco").get<boolean>("useRegions") === true;
}

function organizeAll(useRegions: boolean)
{
    vscode.workspace.findFiles("**/*.ts", "**/node_modules/**")
        .then(typescriptFiles => typescriptFiles.forEach(typescriptFile => vscode.workspace.openTextDocument(typescriptFile)
            .then(document => vscode.window.showTextDocument(document)
                .then(editor => organize(editor, useRegions) !== null))));

}

function organize(editor: vscode.TextEditor | undefined, useRegions: boolean)
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

        sourceFile = ts.createSourceFile(editor.document.fileName, sourceCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

        elements = new Transformer().analyzeSyntaxTree(sourceFile);

        for (let element of elements.sort((a, b) => compareNumbers(a.fullStart, b.fullStart) * -1))
        {
            if (element instanceof InterfaceNode)
            {
                let interfaceNode = <InterfaceNode>element;
                let groups = [
                    {
                        description: "Properties", groups: [
                            { nodes: interfaceNode.getConstProperties() },
                            { nodes: interfaceNode.getReadOnlyProperties() },
                            { nodes: interfaceNode.getProperties() }
                        ]
                    },
                    { description: "Indexes", groups: [{ nodes: interfaceNode.getIndexes() }] },
                    { description: "Methods", groups: [{ nodes: interfaceNode.getMethods() }] }
                ];

                sourceCode = print(groups, sourceCode, interfaceNode.membersStart, interfaceNode.membersEnd, false);
            }
            else if (element instanceof ClassNode)
            {
                let classNode = <ClassNode>element;
                let groups = [
                    {
                        description: "Properties", groups: [
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
                        ]
                    },

                    { description: "Constructors", groups: [{ nodes: classNode.getConstructors() }] },

                    { description: "Public Static Accessors", groups: [{ nodes: classNode.getPublicStaticGettersAndSetters() }] },
                    { description: "Public Accessors", groups: [{ nodes: classNode.getPublicGettersAndSetters() }] },
                    { description: "Public Abstract Accessors", groups: [{ nodes: classNode.getPublicAbstractGettersAndSetters() }] },

                    { description: "Protected Static Accessors", groups: [{ nodes: classNode.getProtectedStaticGettersAndSetters() }] },
                    { description: "Protected Accessors", groups: [{ nodes: classNode.getProtectedGettersAndSetters() }] },
                    { description: "Protected Abstract Accessors", groups: [{ nodes: classNode.getProtectedAbstractGettersAndSetters() }] },

                    { description: "Private Static Accessors", groups: [{ nodes: classNode.getPrivateStaticGettersAndSetters() }] },
                    { description: "Private Accessors", groups: [{ nodes: classNode.getPrivateGettersAndSetters() }] },
                    { description: "Private Abstract Accessors", groups: [{ nodes: classNode.getPrivateAbstractGettersAndSetters() }] },

                    { description: "Public Static Indexes", groups: [{ nodes: classNode.getPublicStaticIndexes() }] },
                    { description: "Public Indexes", groups: [{ nodes: classNode.getPublicIndexes() }] },
                    { description: "Public Abstract Indexes", groups: [{ nodes: classNode.getPublicAbstractIndexes() }] },

                    { description: "Protected Static Indexes", groups: [{ nodes: classNode.getProtectedStaticIndexes() }] },
                    { description: "Protected Indexes", groups: [{ nodes: classNode.getProtectedIndexes() }] },
                    { description: "Protected Abstract Indexes", groups: [{ nodes: classNode.getProtectedAbstractIndexes() }] },

                    { description: "Private Static Indexes", groups: [{ nodes: classNode.getPrivateStaticIndexes() }] },
                    { description: "Private Indexes", groups: [{ nodes: classNode.getPrivateIndexes() }] },
                    { description: "Private Abstract Indexes", groups: [{ nodes: classNode.getPrivateAbstractIndexes() }] },

                    { description: "Public Static Methods", groups: [{ nodes: classNode.getPublicStaticMethods() }] },
                    { description: "Public Methods", groups: [{ nodes: classNode.getPublicMethods() }] },
                    { description: "Public Abstract Methods", groups: [{ nodes: classNode.getPublicAbstractMethods() }] },

                    { description: "Protected Static Methods", groups: [{ nodes: classNode.getProtectedStaticMethods() }] },
                    { description: "Protected Methods", groups: [{ nodes: classNode.getProtectedMethods() }] },
                    { description: "Protected Abstract Methods", groups: [{ nodes: classNode.getProtectedAbstractMethods() }] },

                    { description: "Private Static Methods", groups: [{ nodes: classNode.getPrivateStaticMethods() }] },
                    { description: "Private Methods", groups: [{ nodes: classNode.getPrivateMethods() }] },
                    { description: "Private Abstract Methods", groups: [{ nodes: classNode.getPrivateAbstractMethods() }] },
                ];

                sourceCode = print(groups, sourceCode, classNode.membersStart, classNode.membersEnd, true);
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

function print(groups: any, sourceCode: string, start: number, end: number, addPublicModifierIfMissing: boolean)
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
            members += newLine;
            members += `\t// #region ${group.description} (${count})`;
            members += newLine;
            members += newLine;

            for (let group2 of group.groups)
            {
                for (let node of group2.nodes)
                {
                    let code = sourceCode.substring(node.fullStart, node.end).trim();

                    if (addPublicModifierIfMissing &&
                        !code.startsWith("constructor") &&
                        !code.startsWith("private") &&
                        !code.startsWith("protected") &&
                        !code.startsWith("public"))
                    {
                        code = "public " + code;
                    }

                    members += `\t${code}`;
                    members += newLine;
                }

                members += newLine;
                members += newLine;
            }

            members += newLine;
            members += "\t// #endregion";
            members += newLine;
            members += newLine;
        }
    }

    sourceCode2 = sourceCode.substring(0, start).trimRight();
    sourceCode2 += newLine;
    sourceCode2 += "\t" + members.trim();
    sourceCode2 += newLine;
    sourceCode2 += sourceCode.substring(end - 1, sourceCode.length - 1).trimLeft();

    return sourceCode2.trimLeft();
}