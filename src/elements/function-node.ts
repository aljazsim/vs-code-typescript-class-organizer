import { ElementNode } from "./element-node";
import * as ts from "typescript";

export class FunctionNode extends ElementNode
{
	// #region Properties (1)

	public isExport: boolean;

	// #endregion

	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, functionDeclaration: ts.FunctionDeclaration)
	{
		super(functionDeclaration);

		this.name = (<ts.Identifier>functionDeclaration.name).escapedText.toString();

		this.fullStart = functionDeclaration.getFullStart();
		this.end = functionDeclaration.getEnd();
		this.start = functionDeclaration.getStart(sourceFile, false);

		this.isExport = this.getIsExport(functionDeclaration);
		this.decorators = this.getDecorators(functionDeclaration, sourceFile);
	}

	// #endregion
}