import * as ts from "typescript";
import { AccessorNode } from "./elements/accessor-node";
import { ClassNode } from "./elements/class-node";
import { ConstructorNode } from "./elements/constructor-node";
import { ElementNode } from "./elements/element-node";
import { EnumNode } from "./elements/enum-node";
import { ExpressionNode } from "./elements/expression-node";
import { FunctionNode } from "./elements/function-node";
import { GetterNode } from "./elements/getter-node";
import { ImportNode } from "./elements/import-node";
import { IndexNode } from "./elements/index-node";
import { IndexSignatureNode } from "./elements/index-signature-node";
import { InterfaceNode } from "./elements/interface-node";
import { MethodNode } from "./elements/method-node";
import { MethodSignatureNode } from "./elements/method-signature-node";
import { PropertyNode } from "./elements/property-node";
import { PropertySignatureNode } from "./elements/property-signature-node";
import { SetterNode } from "./elements/setter-node";
import { StaticBlockDeclarationNode } from "./elements/static-block-declaration-node";
import { TypeAliasNode } from "./elements/type-alias-node";
import { VariableNode } from "./elements/variable-node";

export class Transformer
{
    // #region Public Methods (1)

    public analyzeSyntaxTree(sourceFile: ts.SourceFile, treatArrowFunctionPropertiesAsMethods: boolean)
    {
        let elements: ElementNode[] = [];

        // analyze ast
        for (let node of sourceFile.getChildren(sourceFile))
        {
            this.visitSyntaxTree(elements, node, sourceFile, treatArrowFunctionPropertiesAsMethods);
        }

        return elements;
    }

    // #endregion Public Methods (1)

    // #region Private Methods (1)

    private visitSyntaxTree(elements: ElementNode[], node: ts.Node, sourceFile: ts.SourceFile, treatArrowFunctionPropertiesAsMethods: boolean)
    {
        if (ts.isImportDeclaration(node))
        {
            elements.push(new ImportNode(sourceFile, node));
        }
        else if (ts.isTypeAliasDeclaration(node))
        {
            elements.push(new TypeAliasNode(sourceFile, node));
        }
        else if (ts.isInterfaceDeclaration(node))
        {
            elements.push(new InterfaceNode(sourceFile, node));

            for (let member of node.members)
            {
                if (ts.isPropertySignature(member))
                {
                    (<InterfaceNode>elements[elements.length - 1]).properties.push(new PropertySignatureNode(sourceFile, member));
                }
                else if (ts.isAutoAccessorPropertyDeclaration(member))
                {
                    (<InterfaceNode>elements[elements.length - 1]).accessors.push(new AccessorNode(sourceFile, member));
                }
                else if (ts.isGetAccessorDeclaration(member))
                {
                    (<InterfaceNode>elements[elements.length - 1]).getters.push(new GetterNode(sourceFile, member));
                }
                else if (ts.isSetAccessorDeclaration(member))
                {
                    (<InterfaceNode>elements[elements.length - 1]).setters.push(new SetterNode(sourceFile, member));
                }
                else if (ts.isIndexSignatureDeclaration(member))
                {
                    (<InterfaceNode>elements[elements.length - 1]).indexes.push(new IndexSignatureNode(sourceFile, member));
                }
                else if (ts.isMethodSignature(member))
                {
                    (<InterfaceNode>elements[elements.length - 1]).methods.push(new MethodSignatureNode(sourceFile, member));
                }
            }
        }
        else if (ts.isClassDeclaration(node))
        {
            elements.push(new ClassNode(sourceFile, node));

            for (let member of node.members)
            {
                if (ts.isClassStaticBlockDeclaration(member))
                {
                    (<ClassNode>elements[elements.length - 1]).staticBlockDeclarations.push(new StaticBlockDeclarationNode(sourceFile, member));
                }
                else if (ts.isConstructorDeclaration(member))
                {
                    (<ClassNode>elements[elements.length - 1]).constructors.push(new ConstructorNode(sourceFile, member));
                }
                else if (ts.isAutoAccessorPropertyDeclaration(member))
                {
                    (<ClassNode>elements[elements.length - 1]).accessors.push(new AccessorNode(sourceFile, member));
                }
                else if (ts.isPropertyDeclaration(member))
                {
                    if (treatArrowFunctionPropertiesAsMethods && member.initializer?.kind === ts.SyntaxKind.ArrowFunction)
                    {
                        (<ClassNode>elements[elements.length - 1]).methods.push(new PropertyNode(sourceFile, member));
                    }
                    else
                    {
                        (<ClassNode>elements[elements.length - 1]).properties.push(new PropertyNode(sourceFile, member));
                    }
                }
                else if (ts.isGetAccessorDeclaration(member))
                {
                    (<ClassNode>elements[elements.length - 1]).getters.push(new GetterNode(sourceFile, member));
                }
                else if (ts.isSetAccessorDeclaration(member))
                {
                    (<ClassNode>elements[elements.length - 1]).setters.push(new SetterNode(sourceFile, member));
                }
                else if (ts.isMethodDeclaration(member))
                {
                    (<ClassNode>elements[elements.length - 1]).methods.push(new MethodNode(sourceFile, member));
                }
                else if (ts.isIndexedAccessTypeNode(member))
                {
                    (<ClassNode>elements[elements.length - 1]).indexes.push(new IndexNode(sourceFile, member));
                }
            }
        }
        else if (ts.isEnumDeclaration(node))
        {
            elements.push(new EnumNode(sourceFile, node));
        }
        else if (ts.isFunctionDeclaration(node))
        {
            elements.push(new FunctionNode(sourceFile, node));
        }
        else if (ts.isVariableStatement(node))
        {
            elements.push(new VariableNode(sourceFile, node));
        }
        else if (ts.isExpression(node))
        {
            elements.push(new ExpressionNode(sourceFile, node));
        }
        else
        {
            for (let childNode of node.getChildren(sourceFile))
            {
                this.visitSyntaxTree(elements, childNode, sourceFile, treatArrowFunctionPropertiesAsMethods);
            }
        }

        return elements;
    }

    // #endregion Private Methods (1)
}
