import { ElementNode } from "./element-node";
import { WriteModifier } from "./write-modifier";
import * as ts from "typescript";

export class PropertyNode extends ElementNode
{
	// #region Properties (3)

	public isAbstract: boolean;
	public isStatic: boolean;
	public writeMode: WriteModifier = WriteModifier.writable;

	// #endregion

	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, propertyDeclaration: ts.PropertyDeclaration)
	{
		super(propertyDeclaration);

		this.name = (<ts.Identifier>propertyDeclaration.name).escapedText.toString();

		this.fullStart = propertyDeclaration.getFullStart();
		this.end = propertyDeclaration.getEnd();
		this.start = propertyDeclaration.getStart(sourceFile, false);

		this.accessModifier = this.getAccessModifier(propertyDeclaration);
		this.isAbstract = this.getIsAbstract(propertyDeclaration);
		this.isStatic = this.getIsStatic(propertyDeclaration);
		this.writeMode = this.getWriteMode(propertyDeclaration);
		this.decorators = this.getDecorators(propertyDeclaration, sourceFile);
	}

	// #endregion
}