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

  // #endregion Properties (10)

  // #region Constructors (1)

  constructor(sourceFile: ts.SourceFile, classDeclaration: ts.ClassDeclaration)
  {
    super(classDeclaration);

    this.name = (<ts.Identifier>classDeclaration.name).escapedText.toString();

    this.fullStart = classDeclaration.getFullStart();
    this.end = classDeclaration.getEnd();
    this.start = classDeclaration.getStart(sourceFile, false);

    if (classDeclaration.members && classDeclaration.members.length > 0)
    {
      this.membersStart = classDeclaration.members[0].getFullStart();
      this.membersEnd = classDeclaration.members[classDeclaration.members.length - 1].getEnd();
    }

    this.isAbstract = this.getIsAbstract(classDeclaration);
    this.isStatic = this.getIsStatic(classDeclaration);
    this.decorators = this.getDecorators(classDeclaration, sourceFile);
  }

  // #endregion Constructors (1)

  // #region Public Methods (46)

  public getConstructors()
  {
    return this.constructors;
  }

  public getPrivateAbstractGettersAndSetters()
  {
    return this.getters.concat(this.setters).filter(x => this.isPrivate(x) && !x.isStatic && x.isAbstract);
  }

  public getPrivateAbstractIndexes()
  {
    return this.indexes.filter(x => this.isPrivate(x) && !x.isStatic && x.isAbstract);
  }

  public getPrivateAbstractMethods()
  {
    return this.methods.filter(x => this.isPrivate(x) && !x.isStatic && x.isAbstract);
  }

  public getPrivateConstProperties()
  {
    return this.properties.filter(x => this.isPrivate(x) && this.isConstant(x) && !x.isStatic);
  }

  public getPrivateGettersAndSetters()
  {
    return this.getters.concat(this.setters).filter(x => this.isPrivate(x) && !x.isStatic && !x.isAbstract);
  }

  public getPrivateIndexes()
  {
    return this.indexes.filter(x => this.isPrivate(x) && !x.isStatic && !x.isAbstract);
  }

  public getPrivateMethods()
  {
    return this.methods.filter(x => this.isPrivate(x) && !x.isStatic && !x.isAbstract);
  }

  public getPrivateProperties()
  {
    return this.properties.filter(x => this.isPrivate(x) && this.isWritable(x) && !x.isStatic);
  }

  public getPrivateReadOnlyProperties()
  {
    return this.properties.filter(x => this.isPrivate(x) && this.isReadOnly(x) && !x.isStatic);
  }

  public getPrivateStaticConstProperties()
  {
    return this.properties.filter(x => this.isPrivate(x) && this.isConstant(x) && x.isStatic);
  }

  public getPrivateStaticGettersAndSetters()
  {
    return this.getters.concat(this.setters).filter(x => this.isPrivate(x) && x.isStatic && !x.isAbstract);
  }

  public getPrivateStaticIndexes()
  {
    return this.indexes.filter(x => this.isPrivate(x) && x.isStatic && !x.isAbstract);
  }

  public getPrivateStaticMethods()
  {
    return this.methods.filter(x => this.isPrivate(x) && x.isStatic && !x.isAbstract);
  }

  public getPrivateStaticProperties()
  {
    return this.properties.filter(x => this.isPrivate(x) && this.isWritable(x) && x.isStatic);
  }

  public getPrivateStaticReadOnlyProperties()
  {
    return this.properties.filter(x => this.isPrivate(x) && this.isReadOnly(x) && x.isStatic);
  }

  public getProtectedAbstractGettersAndSetters()
  {
    return this.getters.concat(this.setters).filter(x => this.isProtected(x) && !x.isStatic && x.isAbstract);
  }

  public getProtectedAbstractIndexes()
  {
    return this.indexes.filter(x => this.isProtected(x) && !x.isStatic && x.isAbstract);
  }

  public getProtectedAbstractMethods()
  {
    return this.methods.filter(x => this.isProtected(x) && !x.isStatic && x.isAbstract);
  }

  public getProtectedConstProperties()
  {
    return this.properties.filter(x => this.isProtected(x) && this.isConstant(x) && !x.isStatic);
  }

  public getProtectedGettersAndSetters()
  {
    return this.getters.concat(this.setters).filter(x => this.isProtected(x) && !x.isStatic && !x.isAbstract);
  }

  public getProtectedIndexes()
  {
    return this.indexes.filter(x => this.isProtected(x) && !x.isStatic && !x.isAbstract);
  }

  public getProtectedMethods()
  {
    return this.methods.filter(x => this.isProtected(x) && !x.isStatic && !x.isAbstract);
  }

  public getProtectedProperties()
  {
    return this.properties.filter(x => this.isProtected(x) && this.isWritable(x) && !x.isStatic);
  }

  public getProtectedReadOnlyProperties()
  {
    return this.properties.filter(x => this.isProtected(x) && this.isReadOnly(x) && !x.isStatic);
  }

  public getProtectedStaticConstProperties()
  {
    return this.properties.filter(x => this.isProtected(x) && this.isConstant(x) && x.isStatic);
  }

  public getProtectedStaticGettersAndSetters()
  {
    return this.getters.concat(this.setters).filter(x => this.isProtected(x) && x.isStatic && !x.isAbstract);
  }

  public getProtectedStaticIndexes()
  {
    return this.indexes.filter(x => this.isProtected(x) && x.isStatic && !x.isAbstract);
  }

  public getProtectedStaticMethods()
  {
    return this.methods.filter(x => this.isProtected(x) && x.isStatic && !x.isAbstract);
  }

  public getProtectedStaticProperties()
  {
    return this.properties.filter(x => this.isProtected(x) && this.isWritable(x) && x.isStatic);
  }

  public getProtectedStaticReadOnlyProperties()
  {
    return this.properties.filter(x => this.isProtected(x) && this.isReadOnly(x) && x.isStatic);
  }

  public getPublicAbstractGettersAndSetters()
  {
    return this.getters.concat(this.setters).filter(x => this.isPublic(x) && !x.isStatic && x.isAbstract);
  }

  public getPublicAbstractIndexes()
  {
    return this.indexes.filter(x => this.isPublic(x) && !x.isStatic && x.isAbstract);
  }

  public getPublicAbstractMethods()
  {
    return this.methods.filter(x => this.isPublic(x) && !x.isStatic && x.isAbstract);
  }

  public getPublicConstProperties()
  {
    return this.properties.filter(x => this.isPublic(x) && this.isConstant(x) && !x.isStatic);
  }

  public getPublicGettersAndSetters()
  {
    return this.getters.concat(this.setters).filter(x => this.isPublic(x) && !x.isStatic && !x.isAbstract);
  }

  public getPublicIndexes()
  {
    return this.indexes.filter(x => this.isPublic(x) && !x.isStatic && !x.isAbstract);
  }

  public getPublicMethods()
  {
    return this.methods.filter(x => this.isPublic(x) && !x.isStatic && !x.isAbstract);
  }

  public getPublicProperties()
  {
    return this.properties.filter(x => this.isPublic(x) && this.isWritable(x) && !x.isStatic);
  }

  public getPublicReadOnlyProperties()
  {
    return this.properties.filter(x => this.isPublic(x) && this.isReadOnly(x) && !x.isStatic);
  }

  public getPublicStaticConstProperties()
  {
    return this.indexes.filter(x => this.isPublic(x) && this.isConstant(x) && x.isStatic);
  }

  public getPublicStaticGettersAndSetters()
  {
    return this.getters.concat(this.setters).filter(x => this.isPublic(x) && x.isStatic && !x.isAbstract);
  }

  public getPublicStaticIndexes()
  {
    return this.indexes.filter(x => this.isPublic(x) && x.isStatic && !x.isAbstract);
  }

  public getPublicStaticMethods()
  {
    return this.methods.filter(x => this.isPublic(x) && x.isStatic && !x.isAbstract);
  }

  public getPublicStaticProperties()
  {
    return this.properties.filter(x => this.isPublic(x) && this.isWritable(x) && x.isStatic);
  }

  public getPublicStaticReadOnlyProperties()
  {
    return this.properties.filter(x => this.isPublic(x) && this.isReadOnly(x) && x.isStatic);
  }

  // #endregion Public Methods (46)
}
