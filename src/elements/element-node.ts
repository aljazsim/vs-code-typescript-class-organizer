import { AccessModifier } from "./access-modifier";
import { PropertyNode } from "./property-node";
import { PropertySignatureNode } from "./property-signature-node";
import { WriteModifier } from "./write-modifier";
import * as ts from "typescript";

export abstract class ElementNode
{
<<<<<<< Updated upstream
    // #region Properties (5)

    public accessModifier: AccessModifier | null = null;
    public decorators: string[] = [];
    public end: number = 0;
    public fullStart: number = 0;
    public name: string = "";
    public start: number = 0;

    // #endregion
=======
  // #region Properties (6)

  public accessModifier: AccessModifier | null = null;
  public decorators: string[] = [];
  public end: number = 0;
  public fullStart: number = 0;
  public name: string = "";
  public start: number = 0;

  // #endregion Properties (6)

  // #region Constructors (1)

  constructor(public readonly node: ts.Node)
  {
  }

  // #endregion Constructors (1)

  // #region Protected Methods (15)

  protected getAccessModifier(node: ts.PropertyDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.MethodDeclaration | ts.PropertySignature | ts.IndexSignatureDeclaration)
  {
    let accessModifier: AccessModifier | null = null;
    let accessModifiers: ts.SyntaxKind[] = [ts.SyntaxKind.PrivateKeyword, ts.SyntaxKind.ProtectedKeyword, ts.SyntaxKind.PublicKeyword];
    let nodeAccessModifier: ts.Modifier | ts.ModifierLike | undefined;
>>>>>>> Stashed changes

    // #region Constructors (1)

    constructor(public readonly node: ts.Node)
    {
    }

    // #endregion

    // #region Protected Methods (5)

    protected getAccessModifier(node: ts.PropertyDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.MethodDeclaration | ts.IndexedAccessTypeNode | ts.PropertySignature | ts.IndexSignatureDeclaration)
    {
        let accessModifier: AccessModifier | null = null;
        let accessModifiers: ts.SyntaxKind[] = [ts.SyntaxKind.PrivateKeyword, ts.SyntaxKind.ProtectedKeyword, ts.SyntaxKind.PublicKeyword];
        let nodeAccessModifier: ts.Modifier | undefined;

        if (node.modifiers &&
            node.modifiers.length > 0)
        {
            nodeAccessModifier = node.modifiers.find((x) => accessModifiers.indexOf(x.kind) > -1);

            if (nodeAccessModifier)
            {
                if (nodeAccessModifier.kind === ts.SyntaxKind.PublicKeyword)
                {
                    accessModifier = AccessModifier.public;
                }
                else if (nodeAccessModifier.kind === ts.SyntaxKind.ProtectedKeyword)
                {
                    accessModifier = AccessModifier.protected;
                }
                else if (nodeAccessModifier.kind === ts.SyntaxKind.PrivateKeyword)
                {
                    accessModifier = AccessModifier.private;
                }
            }
        }

        return accessModifier;
    }

    getDecorators(node: ts.ClassDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.PropertyDeclaration | ts.MethodDeclaration | ts.IndexedAccessTypeNode | ts.ConstructorDeclaration | ts.EnumDeclaration | ts.FunctionDeclaration | ts.IndexSignatureDeclaration | ts.MethodSignature | ts.PropertySignature | ts.TypeAliasDeclaration, sourceFile: ts.SourceFile)
    {
        let parametersRegex = /\(.*\)/;

        if (node.decorators &&
            node.decorators.length > 0)
        {
            return node.decorators.map(x => x.getText(sourceFile).replace(parametersRegex, ""));
        }
        else
        {
            return [];
        }
    }

<<<<<<< Updated upstream
    protected getIsAbstract(node: ts.ClassDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.PropertyDeclaration | ts.MethodDeclaration | ts.IndexedAccessTypeNode)
=======
    return accessModifier;
  }

  protected getDecorators(node: ts.ClassDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.PropertyDeclaration | ts.MethodDeclaration | ts.IndexedAccessTypeNode | ts.ConstructorDeclaration | ts.EnumDeclaration | ts.FunctionDeclaration | ts.IndexSignatureDeclaration | ts.MethodSignature | ts.PropertySignature | ts.TypeAliasDeclaration, sourceFile: ts.SourceFile)
  {
    let parametersRegex = /\(.*\)/;

    return this.getModifiers(node).filter(m => ts.isDecorator(m)).map(x => (x as ts.Decorator).getText(sourceFile).replace(parametersRegex, "")) ?? []
  }

  protected getIsAbstract(node: ts.ClassDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.PropertyDeclaration | ts.MethodDeclaration | ts.IndexedAccessTypeNode)
  {
    return this.getModifiers(node).find((x) => x.kind === ts.SyntaxKind.AbstractKeyword) !== undefined;
  }

  protected getIsAsync(node: ts.MethodDeclaration | ts.PropertyDeclaration)
  {
    return this.getModifiers(node).find((x) => x.kind === ts.SyntaxKind.AsyncKeyword) !== undefined;
  }

  protected getIsExport(node: ts.ClassDeclaration | ts.FunctionDeclaration)
  {
    let isExport = false;

    if (node.modifiers &&
      node.modifiers.length > 0)
>>>>>>> Stashed changes
    {
        let isAbstract = false;

        if (node.modifiers &&
            node.modifiers.length > 0)
        {
            isAbstract = node.modifiers.find((x) => x.kind === ts.SyntaxKind.AbstractKeyword) !== undefined;
        }

        return isAbstract;
    }

    protected getIsExport(node: ts.ClassDeclaration | ts.FunctionDeclaration)
    {
        let isExport = false;

        if (node.modifiers &&
            node.modifiers.length > 0)
        {
            let tmp = node.modifiers.find((modifier, index, array) => modifier.kind === ts.SyntaxKind.ExportKeyword);

            if (tmp &&
                tmp.kind === ts.SyntaxKind.ExportKeyword)
            {
                isExport = true;
            }
        }

        return isExport;
    }

    protected getIsStatic(node: ts.ClassDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.PropertyDeclaration | ts.MethodDeclaration | ts.IndexedAccessTypeNode)
    {
        let isStatic = false;

        if (node.modifiers &&
            node.modifiers.length > 0)
        {
            isStatic = node.modifiers.find((x) => x.kind === ts.SyntaxKind.StaticKeyword) !== undefined;
        }

        return isStatic;
    }

    protected getWriteMode(node: ts.PropertyDeclaration | ts.VariableStatement | ts.IndexedAccessTypeNode | ts.PropertySignature | ts.IndexSignatureDeclaration)
    {
        let writeMode: WriteModifier = WriteModifier.writable;
        let writeModifiers: ts.SyntaxKind[] = [ts.SyntaxKind.ConstKeyword, ts.SyntaxKind.ReadonlyKeyword];
        let nodeWriteModifier: ts.Modifier | undefined;

        if (node.modifiers &&
            node.modifiers.length > 0)
        {
            nodeWriteModifier = node.modifiers.find((x) => writeModifiers.indexOf(x.kind) > -1);

            if (nodeWriteModifier)
            {
                if (nodeWriteModifier.kind === ts.SyntaxKind.ConstKeyword)
                {
                    writeMode = WriteModifier.const;
                }
                else if (nodeWriteModifier.kind === ts.SyntaxKind.ReadonlyKeyword)
                {
                    writeMode = WriteModifier.readOnly;
                }
            }
        }

        return writeMode;
    }

    protected isProtected(x: ElementNode)
    {
        return x.accessModifier === AccessModifier.protected;
    }

    protected isConstant(x: PropertyNode | PropertySignatureNode)
    {
        return x.writeMode === WriteModifier.const;
    }

    protected isPrivate(x: ElementNode)
    {
        return x.accessModifier === AccessModifier.private;
    }

    protected isWritable(x: PropertyNode | PropertySignatureNode)
    {
        return x.writeMode === WriteModifier.writable;
    }

    protected isReadOnly(x: PropertyNode | PropertySignatureNode)
    {
        return x.writeMode === WriteModifier.readOnly;
    }

    protected isPublic(x: ElementNode)
    {
        return x.accessModifier === AccessModifier.public || x.accessModifier === null;
    }

<<<<<<< Updated upstream
    protected getName(node: ElementNode, groupWithDecorators: boolean): string
    {
        if (groupWithDecorators)
        {
            if (node.decorators.length > 0)
            {
                return node.decorators.join(", ") + " " + node.name;
            }
        }

        return node.name;
    }

    // #endregion
=======
  protected isWritable(x: PropertyNode | PropertySignatureNode)
  {
    return x.writeMode === WriteModifier.writable;
  }

  // #endregion Protected Methods (15)
>>>>>>> Stashed changes
}
