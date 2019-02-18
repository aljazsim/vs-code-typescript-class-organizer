import { ElementNode } from "./element-node";
import { WriteModifier } from "./write-modifier";
import * as ts from "typescript";

export class IndexNode extends ElementNode
{
	// #region Properties (3)

	public isAbstract: boolean;
	public isStatic: boolean;
	public writeMode: WriteModifier = WriteModifier.writable;

	// #endregion

	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, indexDeclaration: ts.IndexedAccessTypeNode)
	{
		super(indexDeclaration);

		this.name = "index";

		this.fullStart = indexDeclaration.getFullStart();
		this.end = indexDeclaration.getEnd();
		this.start = indexDeclaration.getStart(sourceFile, false);

		this.accessModifier = this.getAccessModifier(indexDeclaration);
		this.isAbstract = this.getIsAbstract(indexDeclaration);
		this.isStatic = this.getIsStatic(indexDeclaration);
		this.writeMode = this.getWriteMode(indexDeclaration);
		this.decorators = this.getDecorators(indexDeclaration, sourceFile);
	}

	// #endregion
}