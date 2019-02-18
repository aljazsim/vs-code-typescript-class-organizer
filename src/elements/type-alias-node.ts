import { ElementNode } from "./element-node";
import * as ts from "typescript";

export class TypeAliasNode extends ElementNode
{
	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, typeAliasDeclaration: ts.TypeAliasDeclaration)
	{
		super(typeAliasDeclaration);

		this.name = (<ts.Identifier>typeAliasDeclaration.name).escapedText.toString();

		this.fullStart = typeAliasDeclaration.getFullStart();
		this.end = typeAliasDeclaration.getEnd();
		this.start = typeAliasDeclaration.getStart(sourceFile, false);
		this.decorators = this.getDecorators(typeAliasDeclaration, sourceFile);
	}

	// #endregion
}
