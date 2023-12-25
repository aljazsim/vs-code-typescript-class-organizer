import { ElementNode } from "./element-node";

export class ElementNodeGroup
{
    // #region Constructors (1)

    constructor(public caption: string | null, public nodeSubGroups: ElementNodeGroup[], public nodes: ElementNode[], public isRegion: boolean)
    {
    }

    // #endregion Constructors (1)
} 