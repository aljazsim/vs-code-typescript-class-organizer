import * as ts from "typescript";

import { AccessModifier } from "./access-modifier";
import { PropertyNode } from "./property-node";
import { PropertySignatureNode } from "./property-signature-node";
import { WriteModifier } from "./write-modifier";

export abstract class ElementNode
{
    // #region Properties (6)

    public accessModifier: AccessModifier | null = null;
    public decorators: string[] = [];
    public end: number = 0;
    public fullStart: number = 0;
    public name: string = "";
    public start: number = 0;

    public get decoratorsWithoutParameters()
    {
        return this.decorators.map(d => d.replace(/\(.*\)/, ""))
    }

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

    protected getDecorators(node: ts.ClassDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.PropertyDeclaration | ts.MethodDeclaration | ts.IndexedAccessTypeNode | ts.ConstructorDeclaration | ts.EnumDeclaration | ts.FunctionDeclaration | ts.IndexSignatureDeclaration | ts.MethodSignature | ts.PropertySignature | ts.TypeAliasDeclaration, sourceFile: ts.SourceFile)
    {
        return this.getModifiers(node).filter(m => ts.isDecorator(m)).map(x => (x as ts.Decorator).getText(sourceFile).trim()) ?? []
    }

    protected getIsAbstract(node: ts.ClassDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.PropertyDeclaration | ts.MethodDeclaration | ts.IndexedAccessTypeNode)
    {
        return this.getModifiers(node).find((x) => x.kind === ts.SyntaxKind.AbstractKeyword) !== undefined;
    }

    protected getIsAsync(node: ts.MethodDeclaration | ts.PropertyDeclaration)
    {
        return this.getModifiers(node).find((x) => x.kind === ts.SyntaxKind.AsyncKeyword) !== undefined;
    }

    protected getIsExport(node: ts.ClassDeclaration | ts.FunctionDeclaration | ts.VariableStatement)
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
        return this.getModifiers(node).find((x) => x.kind === ts.SyntaxKind.StaticKeyword) !== undefined;
    }

    protected getModifiers(node: ts.ClassDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.PropertyDeclaration | ts.MethodDeclaration | ts.IndexedAccessTypeNode | ts.ConstructorDeclaration | ts.EnumDeclaration | ts.FunctionDeclaration | ts.IndexSignatureDeclaration | ts.MethodSignature | ts.PropertySignature | ts.TypeAliasDeclaration | ts.VariableStatement)
    {
        let modifiers: ts.NodeArray<ts.ModifierLike> | undefined;

        if (ts.isClassDeclaration(node))
        {
            modifiers = (node as ts.ClassDeclaration).modifiers;
        }
        else if (ts.isGetAccessorDeclaration(node))
        {
            modifiers = (node as ts.GetAccessorDeclaration).modifiers;
        }
        else if (ts.isSetAccessorDeclaration(node))
        {
            modifiers = (node as ts.SetAccessorDeclaration).modifiers;
        }
        else if (ts.isPropertyDeclaration(node))
        {
            modifiers = (node as ts.PropertyDeclaration).modifiers;
        }
        else if (ts.isMethodDeclaration(node))
        {
            modifiers = (node as ts.MethodDeclaration).modifiers;
        }
        else if (ts.isIndexedAccessTypeNode(node))
        {
            // no modifiers
        }
        else if (ts.isConstructorDeclaration(node))
        {
            modifiers = (node as ts.ConstructorDeclaration).modifiers;
        }
        else if (ts.isEnumDeclaration(node))
        {
            modifiers = (node as ts.EnumDeclaration).modifiers;
        }
        else if (ts.isFunctionDeclaration(node))
        {
            modifiers = (node as ts.FunctionDeclaration).modifiers;
        }
        else if (ts.isIndexSignatureDeclaration(node))
        {
            modifiers = (node as ts.IndexSignatureDeclaration).modifiers;
        }
        else if (ts.isMethodSignature(node))
        {
            modifiers = (node as ts.MethodSignature).modifiers;
        }
        else if (ts.isPropertySignature(node))
        {
            modifiers = (node as ts.PropertySignature).modifiers;
        }
        else if (ts.isTypeAliasDeclaration(node))
        {
            modifiers = (node as ts.TypeAliasDeclaration).modifiers;
        }
        else if (ts.isVariableStatement(node))
        {
            modifiers = (node as ts.VariableStatement).modifiers;
        }

        return modifiers ?? [];
    }

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

    protected getWriteMode(node: ts.PropertyDeclaration | ts.VariableStatement | ts.IndexedAccessTypeNode | ts.PropertySignature | ts.IndexSignatureDeclaration)
    {
        let writeMode: WriteModifier = WriteModifier.writable;
        let writeModifiers: ts.SyntaxKind[] = [ts.SyntaxKind.ConstKeyword, ts.SyntaxKind.ReadonlyKeyword];
        let nodeWriteModifier = this.getModifiers(node).find((x) => writeModifiers.indexOf(x.kind) > -1);

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

        return writeMode;
    }

    protected isConstant(x: PropertyNode | PropertySignatureNode)
    {
        return x.writeMode === WriteModifier.const;
    }

    protected isPrivate(x: ElementNode)
    {
        return x.accessModifier === AccessModifier.private;
    }

    protected isProtected(x: ElementNode)
    {
        return x.accessModifier === AccessModifier.protected;
    }

    protected isPublic(x: ElementNode)
    {
        return x.accessModifier === AccessModifier.public || x.accessModifier === null;
    }

    protected isReadOnly(x: PropertyNode | PropertySignatureNode)
    {
        return x.writeMode === WriteModifier.readOnly;
    }

    protected isWritable(x: PropertyNode | PropertySignatureNode)
    {
        return x.writeMode === WriteModifier.writable;
    }

    // #endregion Protected Methods (15)
}
