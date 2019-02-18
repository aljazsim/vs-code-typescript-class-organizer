import { ElementNode } from "./element-node";
import * as ts from "typescript";

export class GetterNode extends ElementNode
{
	// #region Properties (2)

	public isAbstract: boolean;
	public isStatic: boolean;

	// #endregion

	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, getterDeclaration: ts.GetAccessorDeclaration)
	{
		super(getterDeclaration);

		this.name = (<ts.Identifier>getterDeclaration.name).escapedText.toString();

		this.fullStart = getterDeclaration.getFullStart();
		this.end = getterDeclaration.getEnd();
		this.start = getterDeclaration.getStart(sourceFile, false);

		this.accessModifier = this.getAccessModifier(getterDeclaration);
		this.isAbstract = this.getIsAbstract(getterDeclaration);
		this.isStatic = this.getIsStatic(getterDeclaration);
		this.decorators = this.getDecorators(getterDeclaration, sourceFile);
	}

	// #endregion
}