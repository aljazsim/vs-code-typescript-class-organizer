import { ElementNode } from "./element-node";
import * as ts from "typescript";

export class ImportNode extends ElementNode
{
	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, importDeclaration: ts.ImportDeclaration)
	{
		super(importDeclaration);

		this.name = "import";

		this.fullStart = importDeclaration.getFullStart();
		this.end = importDeclaration.getEnd();
		this.start = importDeclaration.getStart(sourceFile, false);
	}

	// #endregion
}