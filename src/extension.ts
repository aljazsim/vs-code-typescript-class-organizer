import * as vscode from "vscode";

import globToRegExp from "glob-to-regexp";

import { Settings } from "./settings/settings";
import { Configuration } from "./tsco-cli/configuration/configuration";
import { fileExists, getDirectoryPath, getFullPath, getRelativePath, joinPath, readFile, writeFile } from "./tsco-cli/helpers/file-system-helper";
import { log, setLogger } from "./tsco-cli/source-code/source-code-logger";
import { SourceCodeOrganizer } from "./tsco-cli/source-code/source-code-organizer";

// #region Functions (11)

async function getConfiguration(configurationFilePath: string | null)
{
    if (configurationFilePath)
    {
        if (await fileExists(configurationFilePath))
        {
            // absolute configuration file path from settings
            return await Configuration.getConfiguration(configurationFilePath);
        }
        else if (await fileExists(joinPath(getWorkspaceRootDirectoryPath(), configurationFilePath)))
        {
            // relative configuration file path from settings
            return await Configuration.getConfiguration(joinPath(getWorkspaceRootDirectoryPath(), configurationFilePath));
        }
        else
        {
            log(`tsco configuration file ${getFullPath(configurationFilePath)} not found`);
        }
    }

    let workspaceRootDirectoryPath = getWorkspaceRootDirectoryPath();

    configurationFilePath = joinPath(workspaceRootDirectoryPath, "tsco.json");

    if (await fileExists(configurationFilePath))
    {
        // look in workspace root
        return await Configuration.getConfiguration(configurationFilePath);
    }

    // go one folder up to see if there's a configuration file
    while (workspaceRootDirectoryPath != getDirectoryPath(workspaceRootDirectoryPath))
    {
        workspaceRootDirectoryPath = getDirectoryPath(workspaceRootDirectoryPath);
        configurationFilePath = joinPath(workspaceRootDirectoryPath, "tsco.json");

        if (await fileExists(configurationFilePath))
        {
            return await Configuration.getConfiguration(configurationFilePath);
        }
    }

    log("tsco using default configuration");

    // default configuration
    return Configuration.getDefaultConfiguration();
}

function getOpenedEditor(filePath: string)
{
    return vscode.window.visibleTextEditors.find(e => getFullPath(e.document.uri.fsPath).toLowerCase() === getFullPath(filePath).toLowerCase());
}

function getWorkspaceRootDirectoryPath()
{
    if (vscode.workspace.workspaceFolders &&
        vscode.workspace.workspaceFolders.length > 0)
    {
        return getFullPath(vscode.workspace.workspaceFolders[0].uri.fsPath)
    }

    return getFullPath("./");
}

function matches(pattern: string, text: string)
{
    return globToRegExp(pattern).test(text);
}

function shouldOrganizeFile(sourceCodeFilePathRelative: string, configuration: Configuration): { shouldOrganize: boolean, reason?: string }
{
    let include = true;
    let exclude = false;

    if (configuration.files.include.length > 0)
    {
        include = configuration.files.include.some(inc => matches(inc, sourceCodeFilePathRelative) || matches(inc, sourceCodeFilePathRelative.replaceAll("../", "").replaceAll("./", "")));
    }

    if (configuration.files.exclude.length > 0)
    {
        exclude = configuration.files.exclude.some(exc => matches(exc, sourceCodeFilePathRelative) || matches(exc, sourceCodeFilePathRelative.replaceAll("../", "").replaceAll("./", "")));
    }

    if (!include)
    {
        return { shouldOrganize: false, reason: "does not match file include patterns" };
    }
    
    if (exclude)
    {
        return { shouldOrganize: false, reason: "matches file exclude patterns" };
    }
    
    return { shouldOrganize: true };
}

async function onInitialize()
{
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
    {
        const configurationFilePath = joinPath(getFullPath(vscode.workspace.workspaceFolders[0].uri.fsPath), "tsco.json");

        if (await fileExists(configurationFilePath))
        {
            vscode.window.showWarningMessage(`TypeScript Class Organizer configuration file already exists at ${configurationFilePath}.`);
        }
        else
        {
            await writeFile(configurationFilePath, JSON.stringify(Configuration.getDefaultConfiguration(), null, 4), true);

            const document = await vscode.workspace.openTextDocument(configurationFilePath);

            await vscode.window.showTextDocument(document);

            vscode.window.showWarningMessage(`TypeScript Class Organizer created a default configuration file at ${configurationFilePath}.`);
        }
    }
}

async function onOrganize(sourceCodeFilePath: string | undefined | null)
{
    if (sourceCodeFilePath)
    {
        sourceCodeFilePath = getFullPath(sourceCodeFilePath);

        if (matches("**/*.ts", sourceCodeFilePath) && await fileExists(sourceCodeFilePath))
        {
            return await organize(sourceCodeFilePath, await getConfiguration(settings.configurationFilePath))
        }
    }

    return false;
}

async function onOrganizeAll()
{
    const configuration = await getConfiguration(settings.configurationFilePath);

    let files = 0;
    let organized = 0;

    for (const filePath of await vscode.workspace.findFiles("**/*.ts", "**/node_modules/**"))
    {
        files++;

        if (await organize(getFullPath(filePath.fsPath), configuration))
        {
            organized++;
        }
    }

    if (organized > 0)
    {
        vscode.window.showInformationMessage(`TypeScript Class Organizer organized ${organized} file${files > 1 ? "s" : ""} out of ${files} file${files > 1 ? "s" : ""}.`);
    }
    else
    {
        vscode.window.showInformationMessage(`TypeScript Class Organizer did not find any files in need of organizing.`);
    }
}

async function onSave(event: vscode.TextDocumentWillSaveEvent)
{
    if (settings.organizeOnSave && event.document.languageId === "typescript")
    {
        const sourceCodeFilePath = getFullPath(event.document.uri.fsPath);
        
        if (matches("**/*.ts", sourceCodeFilePath))
        {
            event.waitUntil((async () => {
                const configuration = await getConfiguration(settings.configurationFilePath);
                const workspaceRootDirectoryPath = getWorkspaceRootDirectoryPath();
                const sourceCodeDirectoryPath = workspaceRootDirectoryPath;
                const sourceCodeFilePathRelative = getRelativePath(sourceCodeDirectoryPath, sourceCodeFilePath);

                const fileCheck = shouldOrganizeFile(sourceCodeFilePathRelative, configuration);
                
                if (!fileCheck.shouldOrganize)
                {
                    log(`tsco skipping organizing ${sourceCodeFilePath}, because it ${fileCheck.reason}`);
                    return [];
                }

                const sourceCode = event.document.getText();
                const organizedSourceCode = await SourceCodeOrganizer.organizeSourceCode(sourceCodeFilePath, sourceCode, configuration);

                if (organizedSourceCode !== sourceCode)
                {
                    const start = new vscode.Position(0, 0);
                    const end = new vscode.Position(event.document.lineCount - 1, event.document.lineAt(event.document.lineCount - 1).text.length);
                    const range = new vscode.Range(start, end);
                    
                    log(`tsco organized ${sourceCodeFilePath}`);
                    
                    return [vscode.TextEdit.replace(range, organizedSourceCode)];
                }
                else
                {
                    log(`tsco skipping organizing ${sourceCodeFilePath}, because it is already organized`);
                    return [];
                }
            })());
        }
    }
}

async function openEditor(filePath: string)
{
    let editor = getOpenedEditor(filePath);

    if (!editor)
    {
        const document = await vscode.workspace.openTextDocument(filePath);

        editor = await vscode.window.showTextDocument(document);
    }

    return editor;
}

async function organize(sourceCodeFilePath: string, configuration: Configuration)
{
    const workspaceRootDirectoryPath = getWorkspaceRootDirectoryPath();
    const sourceCodeDirectoryPath = workspaceRootDirectoryPath;
    const sourceCodeFilePathRelative = getRelativePath(sourceCodeDirectoryPath, sourceCodeFilePath);

    const fileCheck = shouldOrganizeFile(sourceCodeFilePathRelative, configuration);
    
    if (!fileCheck.shouldOrganize)
    {
        log(`tsco skipping organizing ${sourceCodeFilePath}, because it ${fileCheck.reason}`);
        return false;
    }

    // organize and save
    let editor = await getOpenedEditor(sourceCodeFilePath);
    const sourceCode = editor ? editor.document.getText() : await readFile(sourceCodeFilePath);
    const organizedSourceCode = await SourceCodeOrganizer.organizeSourceCode(sourceCodeFilePath, sourceCode, configuration);

    if (organizedSourceCode !== sourceCode)
    {
        editor ??= await openEditor(sourceCodeFilePath);
        const start = new vscode.Position(0, 0);
        const end = new vscode.Position(editor.document.lineCount - 1, editor.document.lineAt(editor.document.lineCount - 1).text.length);
        const range = new vscode.Range(start, end);
        const edit = new vscode.WorkspaceEdit();

        edit.replace(editor.document.uri, range, organizedSourceCode);

        await vscode.workspace.applyEdit(edit);

        log(`tsco organized ${sourceCodeFilePath}`);

        return true;
    }
    else
    {
        log(`tsco skipping organizing ${sourceCodeFilePath}, because it is already organized`);
    }

    return false;
}

// #endregion Functions

// #region Exported Functions (1)

export function activate(context: vscode.ExtensionContext)
{
    context.subscriptions.push(vscode.commands.registerCommand('tsco.initialize', async () => await onInitialize()));
    context.subscriptions.push(vscode.commands.registerCommand('tsco.organize', async () => await onOrganize(vscode.window.activeTextEditor?.document.uri.fsPath)));
    context.subscriptions.push(vscode.commands.registerCommand('tsco.organizeAll', async () => await onOrganizeAll()));

    vscode.workspace.onDidChangeConfiguration(() => settings = Settings.getSettings());
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument((e) => onSave(e)));

    setLogger({
        log: (message: string) => output.appendLine(message),
        logError: (error: string | Error | unknown) => output.appendLine(`ERROR: ${error instanceof Error ? error.message : error?.toString() ?? ""}`)
    });
}

// #endregion Exported Functions

// #region Variables (2)

const output = vscode.window.createOutputChannel("tsco");

let settings = Settings.getSettings();

// #endregion Variables
