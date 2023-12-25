import { ElementNode } from "../elements/element-node";

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