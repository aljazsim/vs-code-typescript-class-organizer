import { sort } from "../utils";
import { ElementNode } from "./element-node";
import { IndexSignatureNode } from "./index-signature-node";
import { MethodSignatureNode } from "./method-signature-node";
import { PropertySignatureNode } from "./property-signature-node";
import * as ts from "typescript";

export class InterfaceNode extends ElementNode
{
	// #region Properties (5)

	public indexes: IndexSignatureNode[] = [];
	public membersEnd: number = 0;
	public membersStart: number = 0;
	public methods: MethodSignatureNode[] = [];
	public properties: PropertySignatureNode[] = [];

	// #endregion

	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, interfaceDeclaration: ts.InterfaceDeclaration)
	{
		super(interfaceDeclaration);

		this.name = (<ts.Identifier>interfaceDeclaration.name).escapedText.toString();

		this.fullStart = interfaceDeclaration.getFullStart();
		this.end = interfaceDeclaration.getEnd();
		this.start = interfaceDeclaration.getStart(sourceFile, false);

		if (interfaceDeclaration.members &&
			interfaceDeclaration.members.length > 0)
		{
			this.membersStart = interfaceDeclaration.members[0].getFullStart();
			this.membersEnd = interfaceDeclaration.members[interfaceDeclaration.members.length - 1].getEnd();
		}
	}

	// #endregion

	// #region Public Methods (5)

	public getConstProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isConstant(x)).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getIndexes(groupWithDecorators: boolean)
	{
		return this.indexes.sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getMethods(groupWithDecorators: boolean)
	{
		return this.methods.sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isWritable(x)).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getReadOnlyProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isReadOnly(x)).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	// #endregion
}