import { MemberType } from "./member-type";

export class ElementNodeGroupConfiguration
{
    // #region Properties (4)

    public caption: string = "";
    public subGroups: ElementNodeGroupConfiguration[] = [];
    public isRegion: boolean = true;
    public memberType: MemberType | null = null;

    // #endregion Properties (4)
}