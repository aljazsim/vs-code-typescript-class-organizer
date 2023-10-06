import { AccessModifier } from "./access-modifier";
import { ElementNode } from "./element-node";
import { WriteModifier } from "./write-modifier";
import * as ts from "typescript";

export class PropertyNode extends ElementNode
{
  // #region Properties (4)

  public isAbstract: boolean;
  public isArrowFunction: boolean;
  public isStatic: boolean;
  public writeMode: WriteModifier = WriteModifier.writable;

  // #endregion Properties (4)

  // #region Constructors (1)

  constructor(sourceFile: ts.SourceFile, propertyDeclaration: ts.PropertyDeclaration)
  {
    super(propertyDeclaration);

    this.name = (<ts.Identifier>propertyDeclaration.name).escapedText?.toString() ?? sourceFile.getFullText().substring(propertyDeclaration.name.pos, propertyDeclaration.name.end);

    this.fullStart = propertyDeclaration.getFullStart();
    this.end = propertyDeclaration.getEnd();
    this.start = propertyDeclaration.getStart(sourceFile, false);

    this.accessModifier = this.getAccessModifier(propertyDeclaration);
    this.isAbstract = this.getIsAbstract(propertyDeclaration);
    this.isStatic = this.getIsStatic(propertyDeclaration);
    this.writeMode = this.getWriteMode(propertyDeclaration);
    this.decorators = this.getDecorators(propertyDeclaration, sourceFile);

    this.isArrowFunction = this.getIsArrowFunction(propertyDeclaration);

    if (this.name.startsWith("#"))
    {
      // properties starting with # are private by default!
      this.accessModifier = AccessModifier.private;
    }
  }

  // #endregion Constructors (1)

  // #region Private Methods (1)

  private getIsArrowFunction(propertyDeclaration: ts.PropertyDeclaration)
  {
    return typeof propertyDeclaration.initializer !== "undefined" && propertyDeclaration.initializer.kind === ts.SyntaxKind.ArrowFunction;
  }

  // #endregion Private Methods (1)
}
