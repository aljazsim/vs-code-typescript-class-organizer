import { ElementNode } from "./element-node";
import * as ts from "typescript";

export class SetterNode extends ElementNode
{
  // #region Properties (2)

  public isAbstract: boolean;
  public isStatic: boolean;

  // #endregion Properties (2)

  // #region Constructors (1)

  constructor(sourceFile: ts.SourceFile, setterDeclaration: ts.SetAccessorDeclaration)
  {
    super(setterDeclaration);

    this.name = (<ts.Identifier>setterDeclaration.name).escapedText?.toString() ?? sourceFile.getFullText().substring(setterDeclaration.name.pos, setterDeclaration.name.end);

    this.fullStart = setterDeclaration.getFullStart();
    this.end = setterDeclaration.getEnd();
    this.start = setterDeclaration.getStart(sourceFile, false);

    this.accessModifier = this.getAccessModifier(setterDeclaration);
    this.isAbstract = this.getIsAbstract(setterDeclaration);
    this.isStatic = this.getIsStatic(setterDeclaration);
    this.decorators = this.getDecorators(setterDeclaration, sourceFile);
  }

  // #endregion Constructors (1)
}
