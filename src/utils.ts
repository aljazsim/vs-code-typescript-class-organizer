import { ClassNode } from "./elements/class-node";
import { ElementNode } from "./elements/element-node";
import { EnumNode } from "./elements/enum-node";
import { ExpressionNode } from "./elements/expression-node";
import { FunctionNode } from "./elements/function-node";
import { ImportNode } from "./elements/import-node";
import { InterfaceNode } from "./elements/interface-node";
import { TypeAliasNode } from "./elements/type-alias-node";
import { VariableNode } from "./elements/variable-node";

// #region Functions (17)

export function compareNumbers(a: number, b: number) 
{
    if (a > b)
    {
        return 1;
    }
    else if (a < b)
    {
        return -1;
    }
    else
    {
        return 0;
    }
}

export function compareStrings(a: string, b: string)
{
    if (a > b)
    {
        return 1;
    }
    else if (a < b)
    {
        return -1;
    }
    else
    {
        return 0;
    }
}

export function distinct(a: string[])
{
    return a.filter((value, index, array) => array.indexOf(value) === index);
}

export function getClasses(nodes: ElementNode[], groupWithDecorators: boolean)
{
    return nodes.filter(x => x instanceof ClassNode).sort((a, b) => sort(a, b, groupWithDecorators));
}

export function getEnums(nodes: ElementNode[], groupWithDecorators: boolean)
{
    return nodes.filter(x => x instanceof EnumNode).sort((a, b) => sort(a, b, groupWithDecorators));
}

export function getExpressions(nodes: ElementNode[])
{
    // expressions are just executable code and can be interdependent
    return nodes.filter(x => x instanceof ExpressionNode);
}

export function getFunctions(nodes: ElementNode[], groupWithDecorators: boolean)
{
    return nodes.filter(x => x instanceof FunctionNode).sort((a, b) => sort(a, b, groupWithDecorators));
}

export function getImports(nodes: ElementNode[], groupWithDecorators: boolean)
{
    return nodes.filter(x => x instanceof ImportNode).sort((a, b) => sort(a, b, groupWithDecorators));
}

export function getInterfaces(nodes: ElementNode[], groupWithDecorators: boolean)
{
    return nodes.filter(x => x instanceof InterfaceNode).sort((a, b) => sort(a, b, groupWithDecorators));
}

export function getName(node: ElementNode, groupWithDecorators: boolean): string
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

export function getTypeAliases(nodes: ElementNode[], groupWithDecorators: boolean)
{
    return nodes.filter(x => x instanceof TypeAliasNode).sort((a, b) => sort(a, b, groupWithDecorators));
}

export function getVariables(nodes: ElementNode[])
{
    // variable declaration can be dependant on order variables, so it is best to not sort them
    return nodes.filter(x => x instanceof VariableNode);
}

export function groupByPlaceAboveBelow(nodes: ElementNode[], placeAbove: string[], placeBelow: string[], groupWithDecorators: boolean)
{
    const nodesAboveMiddleBelow = splitByPlaceAboveBelow(nodes, placeAbove, placeBelow);
    const nodesAbove = sortBy(nodesAboveMiddleBelow.nodesAbove, placeAbove);
    const nodesMiddle = nodesAboveMiddleBelow.nodesMiddle.sort((a, b) => sort(a, b, groupWithDecorators));
    const nodesBelow = sortBy(nodesAboveMiddleBelow.nodesBelow, placeBelow);

    return nodesAbove.concat(nodesMiddle).concat(nodesBelow);
}

export function intersects(a: string[] | null, b: string[] | null)
{
    if (a && b && a.length > 0 && b.length > 0)
    {
        return a.some(itemA => b.some(itemB => itemA === itemB));
    }

    return false;
}

export function sort<T extends ElementNode>(a: T, b: T, groupWithDecorators: boolean)
{
    return compareStrings(getName(a, groupWithDecorators), getName(b, groupWithDecorators));
}

export function sortBy<T extends ElementNode>(nodes: T[], nodeNames: string[])
{
    if (nodes && nodeNames && nodes.length > 0 && nodeNames.length > 0)
    {
        return nodeNames.map(name => nodes.find(node => node.name === name)).filter(node => node).map(node => node!);
    }
    else
    {
        return [];
    }
}

export function splitByPlaceAboveBelow<T extends ElementNode>(nodes: T[], placeAbove: string[] | null, placeBelow: string[] | null)
{
    const nodesAbove = placeAbove ? nodes.filter(n => placeAbove.indexOf(n.name) > -1) : [];
    const nodesBelow = placeBelow ? nodes.filter(n => placeBelow.indexOf(n.name) > -1) : [];
    const nodesMiddle = nodes.filter(n => nodesAbove.indexOf(n) === -1 && nodesBelow.indexOf(n) === -1);

    return {
        nodesAbove,
        nodesMiddle,
        nodesBelow
    }
}

// #endregion Functions (17)
