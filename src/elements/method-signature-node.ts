import { ElementNode } from "./element-node";
import * as ts from "typescript";

export class MethodSignatureNode extends ElementNode
{
	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, methodSignatureDeclaration: ts.MethodSignature)
	{
		super(methodSignatureDeclaration);

		this.name = (<ts.Identifier>methodSignatureDeclaration.name).escapedText.toString();

		this.fullStart = methodSignatureDeclaration.getFullStart();
		this.end = methodSignatureDeclaration.getEnd();
		this.start = methodSignatureDeclaration.getStart(sourceFile, false);
		this.decorators = this.getDecorators(methodSignatureDeclaration, sourceFile);
	}

	// #endregion
}