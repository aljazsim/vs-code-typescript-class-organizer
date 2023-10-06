import { AccessModifier } from "./access-modifier";
import { ElementNode } from "./element-node";
import * as ts from "typescript";

export class MethodNode extends ElementNode
{
  // #region Properties (2)

  public isAbstract: boolean;
  public isStatic: boolean;
  public isAsync: boolean;


  // #endregion Properties (2)

  // #region Constructors (1)

  constructor(sourceFile: ts.SourceFile, methodDeclaration: ts.MethodDeclaration | ts.PropertyDeclaration)
  {
    super(methodDeclaration);

    this.name = (<ts.Identifier>methodDeclaration.name).escapedText?.toString() ?? sourceFile.getFullText().substring(methodDeclaration.name.pos, methodDeclaration.name.end).trim();

    this.fullStart = methodDeclaration.getFullStart();
    this.end = methodDeclaration.getEnd();
    this.start = methodDeclaration.getStart(sourceFile, false);

    this.accessModifier = this.getAccessModifier(methodDeclaration);
    this.isAbstract = this.getIsAbstract(methodDeclaration);
    this.isStatic = this.getIsStatic(methodDeclaration);
    this.isAsync = this.getIsAsync(methodDeclaration);
    this.decorators = this.getDecorators(methodDeclaration, sourceFile);

    if (this.name.startsWith("#"))
    {
      // methods starting with # are private by default!
      this.accessModifier = AccessModifier.private;
    }
  }

  // #endregion Constructors (1)
}
