import * as ts from "typescript";

import { Configuration } from "../configuration/configuration";
import { ClassNode } from "../elements/class-node";
import { ElementNode } from "../elements/element-node";
import { EnumNode } from "../elements/enum-node";
import { ExpressionNode } from "../elements/expression-node";
import { FunctionNode } from "../elements/function-node";
import { ImportNode } from "../elements/import-node";
import { InterfaceNode } from "../elements/interface-node";
import { TypeAliasNode } from "../elements/type-alias-node";
import { VariableNode } from "../elements/variable-node";
import { getIsConst, getIsDeclaration, getIsExport, getLeadingComment, getTrailingComment } from "../helpers/node-helper";

export class SourceCodeAnalyzer
{
    // #region Public Static Methods (2)

    public static getNodes(sourceFile: ts.SourceFile, configuration: Configuration)
    {
        let elements: ElementNode[] = [];

        // traverse top ast nodes
        for (const node of sourceFile.getChildren(sourceFile))
        {
            elements = elements.concat(this.traverseSyntaxTree(node, sourceFile, configuration));
        }

        return elements;
    }

    /**
     * Extracts trailing comments at the end of the file.
     * These are comments that appear after the last syntax node and are attached to the EndOfFileToken.
     * This ensures commented-out code at the end of files is preserved during reorganization.
     * 
     * @param sourceFile The TypeScript source file to analyze
     * @returns The trailing comments text, or null if there are no trailing comments
     */
    public static getFileTrailer(sourceFile: ts.SourceFile)
    {
        // Get trailing comments from the EndOfFileToken
        const children = sourceFile.getChildren(sourceFile);
        const eofToken = children.find(node => node.kind === ts.SyntaxKind.EndOfFileToken);
        
        if (eofToken)
        {
            const fullText = sourceFile.getFullText();
            const commentRanges = ts.getLeadingCommentRanges(fullText, eofToken.pos);
            
            if (commentRanges && commentRanges.length > 0)
            {
                const start = commentRanges[0].pos;
                const end = commentRanges[commentRanges.length - 1].end;
                
                return fullText.substring(start, end);
            }
        }
        
        return null;
    }

    public static hasReference(sourceFile: ts.SourceFile, identifier: string)
    {
        return sourceFile.getChildren(sourceFile).some(node => this.findReference(node, sourceFile, identifier));
    }

    // #endregion Public Static Methods

    // #region Private Static Methods (2)

    private static findReference(node: ts.Node, sourceFile: ts.SourceFile, identifier: string)
    {
        if (ts.isImportDeclaration(node))
        {
            return false;
        }
        if (ts.isIdentifier(node) && node.getText(sourceFile) === identifier)
        {
            return true;
        }
        else
        {
            for (const childNode of node.getChildren(sourceFile))
            {
                if (this.findReference(childNode, sourceFile, identifier))
                {
                    return true;
                }
            }
        }

        return false;
    }

    private static traverseSyntaxTree(node: ts.Node, sourceFile: ts.SourceFile, configuration: Configuration)
    {
        let elements: ElementNode[] = [];

        if (ts.isImportDeclaration(node))
        {
            // import
            elements.push(new ImportNode(sourceFile, node));
        }
        else if (ts.isTypeAliasDeclaration(node))
        {
            // type
            elements.push(new TypeAliasNode(sourceFile, node, configuration.types.members.treatArrowFunctionPropertiesAsMethods));
        }
        else if (ts.isInterfaceDeclaration(node))
        {
            // interface
            elements.push(new InterfaceNode(sourceFile, node, configuration.interfaces.members.treatArrowFunctionPropertiesAsMethods));
        }
        else if (ts.isClassDeclaration(node))
        {
            // class
            elements.push(new ClassNode(sourceFile, node, configuration.classes.members.treatArrowFunctionPropertiesAsMethods, configuration.classes.members.treatArrowFunctionReadOnlyPropertiesAsMethods));
        }
        else if (ts.isEnumDeclaration(node))
        {
            // enum
            elements.push(new EnumNode(sourceFile, node));
        }
        else if (ts.isFunctionDeclaration(node))
        {
            // function
            elements.push(new FunctionNode(sourceFile, node));
        }
        else if (ts.isVariableStatement(node))
        {
            const isExport = getIsExport(node);
            const isDeclaration = getIsDeclaration(node);
            const isConst = getIsConst(node.declarationList);
            const leadingComment = getLeadingComment(node, sourceFile);
            const trailingComment = getTrailingComment(node, sourceFile);

            // variable statement can have multiple variables -> break them up so we can organize them
            for (const variableDeclaration of node.declarationList.declarations)
            {
                // variable
                elements.push(new VariableNode(sourceFile, variableDeclaration, isExport, isConst, isDeclaration, leadingComment, trailingComment));
            }
        }
        else if (node.kind == ts.SyntaxKind.SyntaxList)
        {
            // traverse children ast nodes
            for (const childNode of node.getChildren(sourceFile))
            {
                elements = elements.concat(this.traverseSyntaxTree(childNode, sourceFile, configuration));
            }
        }
        else if (!ts.isEmptyStatement(node) && node.kind != ts.SyntaxKind.EndOfFileToken)
        {
            // expression
            elements.push(new ExpressionNode(sourceFile, node));
        }

        return elements;
    }

    // #endregion Private Static Methods
}
