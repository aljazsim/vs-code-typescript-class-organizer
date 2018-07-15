import * as ts from "typescript";
import * as vscode from "vscode";
import { formatLines, formatRegions, removeRegions } from "./regions";
import { organizeTransformer } from "./transformer";

export function activate(context: vscode.ExtensionContext)
{
    context.subscriptions.push(vscode.commands.registerCommand('tsco.organize', () => organize(vscode.window.activeTextEditor, getUseRegions())));
    context.subscriptions.push(vscode.commands.registerCommand('tsco.organizeAll', () => organizeAll(getUseRegions())));

    vscode.workspace.

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
    let transformation: ts.TransformationResult<ts.Node>;
    let start: vscode.Position;
    let end: vscode.Position;
    let range: vscode.Range;

    if (editor)
    {
        sourceCode = editor.document.getText();
        sourceCode = removeRegions(sourceCode);

        sourceFile = ts.createSourceFile(editor.document.fileName, sourceCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

        transformation = ts.transform(sourceFile, [organizeTransformer]);

        sourceCode = ts.createPrinter().printNode(ts.EmitHint.SourceFile, transformation.transformed[0], sourceFile);
        sourceCode = formatRegions(sourceCode);

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