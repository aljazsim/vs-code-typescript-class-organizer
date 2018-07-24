import * as ts from "typescript";
import { ElementNode } from "./element-node";

export class MethodSignatureNode extends ElementNode
{
	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, methodsignatureDeclaration: ts.MethodSignature)
	{
		super();

		this.name = (<ts.Identifier>methodsignatureDeclaration.name).escapedText.toString();

		this.fullStart = methodsignatureDeclaration.getFullStart();
		this.end = methodsignatureDeclaration.getEnd();
		this.start = methodsignatureDeclaration.getStart(sourceFile, false);
	}

	// #endregion
}