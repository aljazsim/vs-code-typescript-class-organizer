import * as ts from "typescript";
import { ElementNode } from "./element-node";

export class TypeAliasNode extends ElementNode
{
	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, enumDeclaration: ts.TypeAliasDeclaration)
	{
		super();

		this.name = (<ts.Identifier>enumDeclaration.name).escapedText.toString();

		this.fullStart = enumDeclaration.getFullStart();
		this.end = enumDeclaration.getEnd();
		this.start = enumDeclaration.getStart(sourceFile, false);
	}

	// #endregion
}
