import { ElementNode } from "./elements/element-node";

export class ElementNodeGroup
{
    // #region Constructors (1)

    constructor(public caption: string, public nodeSubGroups: ElementNodeGroup[], public nodes: ElementNode[], public isRegion: boolean)
    {
    }

    // #endregion Constructors (1)
}