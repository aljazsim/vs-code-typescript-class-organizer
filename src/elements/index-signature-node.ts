import * as ts from "typescript";
import { ElementNode } from "./element-node";
import { WriteModifier } from "./write-modifier";

export class IndexSignatureNode extends ElementNode
{
	public writeMode: WriteModifier = WriteModifier.Writable;

	constructor(sourceFile: ts.SourceFile, indexSignatureDeclaration: ts.IndexSignatureDeclaration)
	{
		super();

		this.name = "index";

		this.fullStart = indexSignatureDeclaration.getFullStart();
		this.end = indexSignatureDeclaration.getEnd();
		this.start = indexSignatureDeclaration.getStart(sourceFile, false);

		this.accessModifier = this.getAccessModifier(indexSignatureDeclaration);
		this.writeMode = this.getWriteMode(indexSignatureDeclaration);
	}
}