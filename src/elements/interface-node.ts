import { AccessorNode } from "./accessor-node";
import { ElementNode } from "./element-node";
import { GetterNode } from "./getter-node";
import { IndexSignatureNode } from "./index-signature-node";
import { MethodSignatureNode } from "./method-signature-node";
import { PropertySignatureNode } from "./property-signature-node";
import { SetterNode } from "./setter-node";
import * as ts from "typescript";

export class InterfaceNode extends ElementNode
{
  // #region Properties (8)

  public accessors: AccessorNode[] = [];
  public getters: GetterNode[] = [];
  public indexes: IndexSignatureNode[] = [];
  public membersEnd: number = 0;
  public membersStart: number = 0;
  public methods: MethodSignatureNode[] = [];
  public properties: PropertySignatureNode[] = [];
  public setters: SetterNode[] = [];

  // #endregion Properties (8)

  // #region Constructors (1)

  constructor(sourceFile: ts.SourceFile, interfaceDeclaration: ts.InterfaceDeclaration)
  {
    super(interfaceDeclaration);

    this.name = (<ts.Identifier>interfaceDeclaration.name).escapedText?.toString() ?? sourceFile.getFullText().substring(interfaceDeclaration.name.pos, interfaceDeclaration.name.end).trim();

    this.fullStart = interfaceDeclaration.getFullStart();
    this.end = interfaceDeclaration.getEnd();
    this.start = interfaceDeclaration.getStart(sourceFile, false);

    if (interfaceDeclaration.members && interfaceDeclaration.members.length > 0)
    {
      this.membersStart = interfaceDeclaration.members[0].getFullStart();
      this.membersEnd = interfaceDeclaration.members[interfaceDeclaration.members.length - 1].getEnd();
    }
  }

  // #endregion Constructors (1)

  // #region Public Methods (7)

  public getAccessors()
  {
    return this.accessors.concat(this.setters);
  }

  public getConstProperties()
  {
    return this.properties.filter(x => this.isConstant(x));
  }

  public getGettersAndSetters()
  {
    return this.getters.concat(this.setters);
  }

  public getIndexes()
  {
    return this.indexes;
  }

  public getMethods()
  {
    return this.methods;
  }

  public getProperties()
  {
    return this.properties.filter(x => this.isWritable(x));
  }

  public getReadOnlyProperties()
  {
    return this.properties.filter(x => this.isReadOnly(x));
  }

  // #endregion Public Methods (7)
}
