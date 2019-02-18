import { ElementNode } from "./element-node";
import { WriteModifier } from "./write-modifier";
import * as ts from "typescript";

export class IndexSignatureNode extends ElementNode
{
	// #region Properties (1)

	public writeMode: WriteModifier = WriteModifier.writable;

	// #endregion

	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, indexSignatureDeclaration: ts.IndexSignatureDeclaration)
	{
		super(indexSignatureDeclaration);

		this.name = "index";

		this.fullStart = indexSignatureDeclaration.getFullStart();
		this.end = indexSignatureDeclaration.getEnd();
		this.start = indexSignatureDeclaration.getStart(sourceFile, false);

		this.accessModifier = this.getAccessModifier(indexSignatureDeclaration);
		this.writeMode = this.getWriteMode(indexSignatureDeclaration);
		this.decorators = this.getDecorators(indexSignatureDeclaration, sourceFile);
	}

	// #endregion
}