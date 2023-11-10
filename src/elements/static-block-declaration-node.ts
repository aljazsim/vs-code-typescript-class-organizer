import * as ts from "typescript";
import { ElementNode } from "./element-node";

export class StaticBlockDeclarationNode extends ElementNode
{
    // #region Constructors (1)

    constructor(sourceFile: ts.SourceFile, staticBlockDeclaration: ts.ClassStaticBlockDeclaration)
    {
        super(staticBlockDeclaration);

        this.name = "";

        this.fullStart = staticBlockDeclaration.getFullStart();
        this.end = staticBlockDeclaration.getEnd();
        this.start = staticBlockDeclaration.getStart(sourceFile, false);
    }

    // #endregion Constructors (1)
}
