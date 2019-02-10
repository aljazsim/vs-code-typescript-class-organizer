import * as ts from "typescript";
import { ElementNode } from "./element-node";

export class SetterNode extends ElementNode
{
	// #region Properties (2)

	public isAbstract: boolean;
	public isStatic: boolean;

	// #endregion

	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, setterDeclaration: ts.SetAccessorDeclaration)
	{
		super();

		this.name = (<ts.Identifier>setterDeclaration.name).escapedText.toString();

		this.fullStart = setterDeclaration.getFullStart();
		this.end = setterDeclaration.getEnd();
		this.start = setterDeclaration.getStart(sourceFile, false);

		this.accessModifier = this.getAccessModifier(setterDeclaration);
		this.isAbstract = this.getIsAbstract(setterDeclaration);
		this.isStatic = this.getIsStatic(setterDeclaration);
	}

	// #endregion
}