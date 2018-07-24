import * as ts from "typescript";
import { ElementNode } from "./element-node";
import { WriteModifier } from "./write-modifier";

export class PropertyNode extends ElementNode
{
	// #region Properties (3)

	public isAbstract: boolean;
	public isStatic: boolean;
	public writeMode: WriteModifier = WriteModifier.Writable;

	// #endregion

	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, propertyNodeDeclaration: ts.PropertyDeclaration)
	{
		super();

		this.name = (<ts.Identifier>propertyNodeDeclaration.name).escapedText.toString();

		this.fullStart = propertyNodeDeclaration.getFullStart();
		this.end = propertyNodeDeclaration.getEnd();
		this.start = propertyNodeDeclaration.getStart(sourceFile, false);

		this.accessModifier = this.getAccessModifier(propertyNodeDeclaration);
		this.isAbstract = this.getIsAbstract(propertyNodeDeclaration);
		this.isStatic = this.getIsStatic(propertyNodeDeclaration);
		this.writeMode = this.getWriteMode(propertyNodeDeclaration);
	}

	// #endregion
}