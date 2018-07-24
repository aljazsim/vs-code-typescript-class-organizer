import * as ts from "typescript";
import { AccessModifier } from "./access-modifier";
import { compareStrings } from "../utils";
import { ConstructorNode } from "./constructor-node";
import { ElementNode } from "./element-node";
import { GetterNode } from "./getter-node";
import { IndexNode } from "./index-node";
import { MethodNode } from "./method-node";
import { PropertyNode } from "./property-node";
import { SetterNode } from "./setter-node";
import { WriteModifier } from "./write-modifier";

export class ClassNode extends ElementNode
{
	public methods: MethodNode[] = [];
	public constructors: ConstructorNode[] = [];
	public getters: GetterNode[] = [];
	public setters: SetterNode[] = [];
	public properties: PropertyNode[] = [];
	public indexes: IndexNode[] = [];
	public isAbstract: boolean;
	public isStatic: boolean;
	public membersStart: number = 0;
	public membersEnd: number = 0;

	constructor(sourceFile: ts.SourceFile, classDeclaration: ts.ClassDeclaration)
	{
		super();

		this.name = (<ts.Identifier>classDeclaration.name).escapedText.toString();

		this.fullStart = classDeclaration.getFullStart();
		this.end = classDeclaration.getEnd();
		this.start = classDeclaration.getStart(sourceFile, false);

		if (classDeclaration.members &&
			classDeclaration.members.length > 0)
		{
			this.membersStart = classDeclaration.members[0].getFullStart();
			this.membersEnd = classDeclaration.members[classDeclaration.members.length - 1].getEnd();
		}

		this.isAbstract = this.getIsAbstract(classDeclaration);
		this.isStatic = this.getIsStatic(classDeclaration);
	}

	public getPrivateProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.private && x.writeMode === WriteModifier.Writable && !x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPrivateReadOnlyProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.private && x.writeMode === WriteModifier.ReadOnly && !x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPrivateConstProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.private && x.writeMode === WriteModifier.Const && !x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProtectedProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.protected && x.writeMode === WriteModifier.Writable && !x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProtectedReadOnlyProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.protected && x.writeMode === WriteModifier.ReadOnly && !x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProtectedConstProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.protected && x.writeMode === WriteModifier.Const && !x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPublicProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.public && x.writeMode === WriteModifier.Writable && !x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPublicReadOnlyProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.public && x.writeMode === WriteModifier.ReadOnly && !x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPublicConstProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.public && x.writeMode === WriteModifier.Const && !x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPrivateStaticProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.private && x.writeMode === WriteModifier.Writable && x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPrivateStaticReadOnlyProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.private && x.writeMode === WriteModifier.ReadOnly && x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPrivateStaticConstProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.private && x.writeMode === WriteModifier.Const && x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProtectedStaticProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.protected && x.writeMode === WriteModifier.Writable && x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProtectedStaticReadOnlyProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.protected && x.writeMode === WriteModifier.ReadOnly && x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProtectedStaticConstProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.protected && x.writeMode === WriteModifier.Const && x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPublicStaticProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.public && x.writeMode === WriteModifier.Writable && x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPublicStaticReadOnlyProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.public && x.writeMode === WriteModifier.ReadOnly && x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPublicStaticConstProperties()
	{
		return this.properties.filter(x => x.accessModifier === AccessModifier.public && x.writeMode === WriteModifier.Const && x.isStatic).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getConstructors()
	{
		return this.constructors.sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPrivateMethods()
	{
		return this.methods.filter(x => x.accessModifier === AccessModifier.private && !x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProtectedMethods()
	{
		return this.methods.filter(x => x.accessModifier === AccessModifier.protected && !x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPublicMethods()
	{
		return this.methods.filter(x => x.accessModifier === AccessModifier.public && !x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPrivateAbstractMethods()
	{
		return this.methods.filter(x => x.accessModifier === AccessModifier.private && !x.isStatic && x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProtectedAbstractMethods()
	{
		return this.methods.filter(x => x.accessModifier === AccessModifier.protected && !x.isStatic && x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPublicAbstractMethods()
	{
		return this.methods.filter(x => x.accessModifier === AccessModifier.public && !x.isStatic && x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPrivateStaticMethods()
	{
		return this.methods.filter(x => x.accessModifier === AccessModifier.private && x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProtectedStaticMethods()
	{
		return this.methods.filter(x => x.accessModifier === AccessModifier.protected && x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPublicStaticMethods()
	{
		return this.methods.filter(x => x.accessModifier === AccessModifier.public && x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPrivateStaticGettersAndSetters()
	{
		return this.getters.concat(this.setters).filter(x => x.accessModifier === AccessModifier.private && x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProtectedStaticGettersAndSetters()
	{
		return this.getters.concat(this.setters).filter(x => x.accessModifier === AccessModifier.protected && x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPublicStaticGettersAndSetters()
	{
		return this.getters.concat(this.setters).filter(x => x.accessModifier === AccessModifier.public && x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPrivateGettersAndSetters()
	{
		return this.getters.concat(this.setters).filter(x => x.accessModifier === AccessModifier.private && !x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProtectedGettersAndSetters()
	{
		return this.getters.concat(this.setters).filter(x => x.accessModifier === AccessModifier.protected && !x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPublicGettersAndSetters()
	{
		return this.getters.concat(this.setters).filter(x => x.accessModifier === AccessModifier.public && !x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPrivateAbstractGettersAndSetters()
	{
		return this.getters.concat(this.setters).filter(x => x.accessModifier === AccessModifier.private && !x.isStatic && x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProtectedAbstractGettersAndSetters()
	{
		return this.getters.concat(this.setters).filter(x => x.accessModifier === AccessModifier.protected && !x.isStatic && x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPublicAbstractGettersAndSetters()
	{
		return this.getters.concat(this.setters).filter(x => x.accessModifier === AccessModifier.public && !x.isStatic && x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPrivateStaticIndexes()
	{
		return this.indexes.filter(x => x.accessModifier === AccessModifier.private && x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProtectedStaticIndexes()
	{
		return this.indexes.filter(x => x.accessModifier === AccessModifier.protected && x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPublicStaticIndexes()
	{
		return this.indexes.filter(x => x.accessModifier === AccessModifier.public && x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPrivateIndexes()
	{
		return this.indexes.filter(x => x.accessModifier === AccessModifier.private && !x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProtectedIndexes()
	{
		return this.indexes.filter(x => x.accessModifier === AccessModifier.protected && !x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPublicIndexes()
	{
		return this.indexes.filter(x => x.accessModifier === AccessModifier.public && !x.isStatic && !x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPrivateAbstractIndexes()
	{
		return this.indexes.filter(x => x.accessModifier === AccessModifier.private && !x.isStatic && x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getProtectedAbstractIndexes()
	{
		return this.indexes.filter(x => x.accessModifier === AccessModifier.protected && !x.isStatic && x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}

	public getPublicAbstractIndexes()
	{
		return this.indexes.filter(x => x.accessModifier === AccessModifier.public && !x.isStatic && x.isAbstract).sort((a, b) => compareStrings(a.name, b.name));
	}
}