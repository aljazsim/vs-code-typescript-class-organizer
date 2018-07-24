import * as ts from "typescript";
import { compareStrings } from "../utils";
import { ElementNode } from "./element-node";
import { IndexSignatureNode } from "./index-signature-node";
import { MethodSignatureNode } from "./method-signature-node";
import { PropertySignatureNode } from "./property-signature-node";
import { WriteModifier } from "./write-modifier";

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
		super();

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

	public getConstProperties()
	{
		return this.properties.filter(x => x.writeMode === WriteModifier.Const).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getIndexes()
	{
		return this.indexes.sort((a, b) => compareStrings(a.name, b.name));
	}

	public getMethods()
	{
		return this.methods.sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProperties()
	{
		return this.properties.filter(x => x.writeMode === WriteModifier.Writable).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getReadOnlyProperties()
	{
		return this.properties.filter(x => x.writeMode === WriteModifier.ReadOnly).sort((a, b) => compareStrings(a.name, b.name));
	}

	// #endregion
}