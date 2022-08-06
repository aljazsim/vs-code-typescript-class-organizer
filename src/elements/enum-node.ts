import { ElementNode } from "./element-node";
import * as ts from "typescript";

export class EnumNode extends ElementNode
{
    // #region Constructors (1)

    constructor(sourceFile: ts.SourceFile, enumDeclaration: ts.EnumDeclaration)
    {
        super(enumDeclaration);

        this.name = (<ts.Identifier>enumDeclaration.name).escapedText?.toString() ?? sourceFile.getFullText().substring(enumDeclaration.name.pos, enumDeclaration.name.end).trim();

        this.fullStart = enumDeclaration.getFullStart();
        this.end = enumDeclaration.getEnd();
        this.start = enumDeclaration.getStart(sourceFile, false);
        this.decorators = this.getDecorators(enumDeclaration, sourceFile);
    }

    // #endregion
}
