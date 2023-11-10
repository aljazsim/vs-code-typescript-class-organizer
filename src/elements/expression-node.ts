import * as ts from "typescript";
import { ElementNode } from "./element-node";

export class ExpressionNode extends ElementNode
{
    // #region Constructors (1)

    constructor(sourceFile: ts.SourceFile, expression: ts.Expression)
    {
        super(expression);

        this.name = "";

        this.fullStart = expression.getFullStart();
        this.end = expression.getEnd();
        this.start = expression.getStart(sourceFile, false);
    }

    // #endregion Constructors (1)
}
