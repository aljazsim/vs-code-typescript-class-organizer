import { ElementNode } from "./element-node";
import * as ts from "typescript";

export class UnknownNode extends ElementNode
{
	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, unknownNode: ts.Node)
	{
		super(unknownNode);

		this.name = "unknown";

		this.fullStart = unknownNode.getFullStart();
		this.end = unknownNode.getEnd();
		this.start = unknownNode.getStart(sourceFile, false);
	}

	// #endregion
}