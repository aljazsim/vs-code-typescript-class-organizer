import { ElementNode } from "./element-node";
import { WriteModifier } from "./write-modifier";
import * as ts from "typescript";

export class PropertySignatureNode extends ElementNode
{
	// #region Properties (1)

	public writeMode: WriteModifier = WriteModifier.writable;

	// #endregion

	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, propertySignatureDeclaration: ts.PropertySignature)
	{
		super(propertySignatureDeclaration);

		this.name = (<ts.Identifier>propertySignatureDeclaration.name).escapedText.toString();

		this.fullStart = propertySignatureDeclaration.getFullStart();
		this.end = propertySignatureDeclaration.getEnd();
		this.start = propertySignatureDeclaration.getStart(sourceFile, false);

		this.accessModifier = this.getAccessModifier(propertySignatureDeclaration);
		this.writeMode = this.getWriteMode(propertySignatureDeclaration);
		this.decorators = this.getDecorators(propertySignatureDeclaration, sourceFile);
	}

	// #endregion
}