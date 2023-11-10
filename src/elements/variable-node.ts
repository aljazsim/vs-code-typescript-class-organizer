import * as ts from "typescript";
import { ElementNode } from "./element-node";

export class VariableNode extends ElementNode
{
    // #region Constructors (1)

    constructor(sourceFile: ts.SourceFile, variableStatement: ts.VariableStatement)
    {
        super(variableStatement);

        this.name = "";

        this.fullStart = variableStatement.getFullStart();
        this.end = variableStatement.getEnd();
        this.start = variableStatement.getStart(sourceFile, false);
    }

    // #endregion Constructors (1)
}
