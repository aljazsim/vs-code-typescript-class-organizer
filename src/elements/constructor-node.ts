import * as ts from "typescript";
import { ElementNode } from "./element-node";

export class ConstructorNode extends ElementNode
{
	constructor(sourceFile: ts.SourceFile, constructorDeclaration: ts.ConstructorDeclaration)
	{
		super();

		this.name = "constructor";

		this.fullStart = constructorDeclaration.getFullStart();
		this.end = constructorDeclaration.getEnd();
		this.start = constructorDeclaration.getStart(sourceFile, false);
	}
}