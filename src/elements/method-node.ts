import * as ts from "typescript";
import { ElementNode } from "./element-node";

export class MethodNode extends ElementNode
{
	// #region Properties (2)

	public isAbstract: boolean;
	public isStatic: boolean;

	// #endregion

	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, methodDeclaration: ts.MethodDeclaration)
	{
		super();

		this.name = (<ts.Identifier>methodDeclaration.name).escapedText.toString();

		this.fullStart = methodDeclaration.getFullStart();
		this.end = methodDeclaration.getEnd();
		this.start = methodDeclaration.getStart(sourceFile, false);

		this.accessModifier = this.getAccessModifier(methodDeclaration);
		this.isAbstract = this.getIsAbstract(methodDeclaration);
		this.isStatic = this.getIsStatic(methodDeclaration);
	}

	// #endregion
}