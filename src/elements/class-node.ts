import { sort } from "../utils";
import { ConstructorNode } from "./constructor-node";
import { ElementNode } from "./element-node";
import { GetterNode } from "./getter-node";
import { IndexNode } from "./index-node";
import { MethodNode } from "./method-node";
import { PropertyNode } from "./property-node";
import { SetterNode } from "./setter-node";
import * as ts from "typescript";

export class ClassNode extends ElementNode
{
	// #region Properties (10)

	public constructors: ConstructorNode[] = [];
	public getters: GetterNode[] = [];
	public indexes: IndexNode[] = [];
	public isAbstract: boolean;
	public isStatic: boolean;
	public membersEnd: number = 0;
	public membersStart: number = 0;
	public methods: MethodNode[] = [];
	public properties: PropertyNode[] = [];
	public setters: SetterNode[] = [];

	// #endregion

	// #region Constructors (1)

	constructor(sourceFile: ts.SourceFile, classDeclaration: ts.ClassDeclaration)
	{
		super(classDeclaration);

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
		this.decorators = this.getDecorators(classDeclaration, sourceFile);
	}

	// #endregion

	// #region Public Methods (46)

	public getConstructors(groupWithDecorators: boolean)
	{
		return this.constructors.sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPrivateAbstractGettersAndSetters(groupWithDecorators: boolean)
	{
		return this.getters.concat(this.setters).filter(x => this.isPrivate(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPrivateAbstractIndexes(groupWithDecorators: boolean)
	{
		return this.indexes.filter(x => this.isPrivate(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPrivateAbstractMethods(groupWithDecorators: boolean)
	{
		return this.methods.filter(x => this.isPrivate(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPrivateConstProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isPrivate(x) && this.isConstant(x) && !x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPrivateGettersAndSetters(groupWithDecorators: boolean)
	{
		return this.getters.concat(this.setters).filter(x => this.isPrivate(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPrivateIndexes(groupWithDecorators: boolean)
	{
		return this.indexes.filter(x => this.isPrivate(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPrivateMethods(groupWithDecorators: boolean)
	{
		return this.methods.filter(x => this.isPrivate(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPrivateProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isPrivate(x) && this.isWritable(x) && !x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPrivateReadOnlyProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isPrivate(x) && this.isReadOnly(x) && !x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPrivateStaticConstProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isPrivate(x) && this.isConstant(x) && x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPrivateStaticGettersAndSetters(groupWithDecorators: boolean)
	{
		return this.getters.concat(this.setters).filter(x => this.isPrivate(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPrivateStaticIndexes(groupWithDecorators: boolean)
	{
		return this.indexes.filter(x => this.isPrivate(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPrivateStaticMethods(groupWithDecorators: boolean)
	{
		return this.methods.filter(x => this.isPrivate(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPrivateStaticProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isPrivate(x) && this.isWritable(x) && x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPrivateStaticReadOnlyProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isPrivate(x) && this.isReadOnly(x) && x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProtectedAbstractGettersAndSetters(groupWithDecorators: boolean)
	{
		return this.getters.concat(this.setters).filter(x => this.isProtected(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProtectedAbstractIndexes(groupWithDecorators: boolean)
	{
		return this.indexes.filter(x => this.isProtected(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProtectedAbstractMethods(groupWithDecorators: boolean)
	{
		return this.methods.filter(x => this.isProtected(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProtectedConstProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isProtected(x) && this.isConstant(x) && !x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProtectedGettersAndSetters(groupWithDecorators: boolean)
	{
		return this.getters.concat(this.setters).filter(x => this.isProtected(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProtectedIndexes(groupWithDecorators: boolean)
	{
		return this.indexes.filter(x => this.isProtected(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProtectedMethods(groupWithDecorators: boolean)
	{
		return this.methods.filter(x => this.isProtected(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProtectedProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isProtected(x) && this.isWritable(x) && !x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProtectedReadOnlyProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isProtected(x) && this.isReadOnly(x) && !x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProtectedStaticConstProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isProtected(x) && this.isConstant(x) && x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProtectedStaticGettersAndSetters(groupWithDecorators: boolean)
	{
		return this.getters.concat(this.setters).filter(x => this.isProtected(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProtectedStaticIndexes(groupWithDecorators: boolean)
	{
		return this.indexes.filter(x => this.isProtected(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProtectedStaticMethods(groupWithDecorators: boolean)
	{
		return this.methods.filter(x => this.isProtected(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProtectedStaticProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isProtected(x) && this.isWritable(x) && x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getProtectedStaticReadOnlyProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isProtected(x) && this.isReadOnly(x) && x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPublicAbstractGettersAndSetters(groupWithDecorators: boolean)
	{
		return this.getters.concat(this.setters).filter(x => this.isPublic(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPublicAbstractIndexes(groupWithDecorators: boolean)
	{
		return this.indexes.filter(x => this.isPublic(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPublicAbstractMethods(groupWithDecorators: boolean)
	{
		return this.methods.filter(x => this.isPublic(x) && !x.isStatic && x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPublicConstProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isPublic(x) && this.isConstant(x) && !x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPublicGettersAndSetters(groupWithDecorators: boolean)
	{
		return this.getters.concat(this.setters).filter(x => this.isPublic(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPublicIndexes(groupWithDecorators: boolean)
	{
		return this.indexes.filter(x => this.isPublic(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPublicMethods(groupWithDecorators: boolean)
	{
		return this.methods.filter(x => this.isPublic(x) && !x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPublicProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isPublic(x) && this.isWritable(x) && !x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPublicReadOnlyProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isPublic(x) && this.isReadOnly(x) && !x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPublicStaticConstProperties(groupWithDecorators: boolean)
	{
		return this.indexes.filter(x => this.isPublic(x) && this.isConstant(x) && x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPublicStaticGettersAndSetters(groupWithDecorators: boolean)
	{
		return this.getters.concat(this.setters).filter(x => this.isPublic(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPublicStaticIndexes(groupWithDecorators: boolean)
	{
		return this.indexes.filter(x => this.isPublic(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPublicStaticMethods(groupWithDecorators: boolean)
	{
		return this.methods.filter(x => this.isPublic(x) && x.isStatic && !x.isAbstract).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPublicStaticProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isPublic(x) && this.isWritable(x) && x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	public getPublicStaticReadOnlyProperties(groupWithDecorators: boolean)
	{
		return this.properties.filter(x => this.isPublic(x) && this.isReadOnly(x) && x.isStatic).sort((a, b) => sort(a, b, groupWithDecorators));
	}

	// #endregion
}
