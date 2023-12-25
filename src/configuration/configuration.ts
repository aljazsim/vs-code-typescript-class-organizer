import { ElementNodeGroupConfiguration } from "./element-node-group-configuration";
import * as vscode from "vscode";
import { MemberType } from "../member-type";
import { distinct } from "../helpers/array-helper";

export class Configuration
{
    // #region Constructors (1)

    constructor(public readonly useRegions: boolean, public readonly addPublicModifierIfMissing: boolean, public readonly addMemberCountInRegionName: boolean, public readonly addRegionIndentation: boolean, public readonly addRegionCaptionToRegionEnd: boolean, public readonly groupPropertiesWithDecorators: boolean, public readonly treatArrowFunctionPropertiesAsMethods: boolean, public readonly organizeOnSave: boolean, public readonly memberOrder: ElementNodeGroupConfiguration[])
    {
    }

    // #endregion Constructors (1)

    // #region Public Static Methods (1)

    public static getConfiguration()
    {
        let configuration = vscode.workspace.getConfiguration("tsco");

        return new Configuration(
            configuration.get<boolean>("useRegions") === true,
            configuration.get<boolean>("addPublicModifierIfMissing") === true,
            configuration.get<boolean>("addMemberCountInRegionName") === true,
            configuration.get<boolean>("addRegionIndentation") === true,
            configuration.get<boolean>("addRegionCaptionToRegionEnd") === true,
            configuration.get<boolean>("groupPropertiesWithDecorators") === true,
            configuration.get<boolean>("treatArrowFunctionPropertiesAsMethods") === true,
            configuration.get<boolean>("organizeOnSave") === true,
            Configuration.getMemberOrderConfig()
        );
    }

    // #endregion Public Static Methods (1)

    // #region Private Static Methods (2)

    private static getMemberOrderConfig(): ElementNodeGroupConfiguration[]
    {
        let memberTypeOrderConfiguration = vscode.workspace.getConfiguration("tsco").get<ElementNodeGroupConfiguration[]>("memberOrder") || [];
        let memberTypeOrder: ElementNodeGroupConfiguration[] = [];
        let defaultMemberTypeOrder = Object.keys(MemberType) // same order as in the enum
            .filter(x => !isNaN(parseInt(x, 10))) // do not include int value
            .map(x => <MemberType>parseInt(x, 10));

        // map member type order from configuration
        memberTypeOrderConfiguration.forEach((x: any) => memberTypeOrder.push(Configuration.parseElementNodeGroupConfiguration(x)));

        // add missing member types (prevent duplicates)
        defaultMemberTypeOrder
            .filter(x => !memberTypeOrder.some(y => y.memberTypes && y.memberTypes.length > 0 && y.memberTypes.some(z => z === x)))
            .forEach(x =>
            {
                let defaultElementNodeGroupConfiguration = new ElementNodeGroupConfiguration();

                defaultElementNodeGroupConfiguration.caption = convertPascalCaseToTitleCase(MemberType[x]);
                defaultElementNodeGroupConfiguration.memberTypes = [x];

                memberTypeOrder.push(defaultElementNodeGroupConfiguration);
            });

        return memberTypeOrder;
    }

    private static parseElementNodeGroupConfiguration(x: any)
    {
        let elementNodeGroupConfiguration = new ElementNodeGroupConfiguration();

        elementNodeGroupConfiguration.caption = x.caption;
        elementNodeGroupConfiguration.memberTypes = distinct(x.memberTypes as string[] ?? []).map(y => MemberType[y as keyof typeof MemberType]);
        elementNodeGroupConfiguration.placeAbove = distinct(x.placeAbove as string[] ?? []);
        elementNodeGroupConfiguration.placeBelow = distinct(x.placeBelow as string[] ?? []);

        return elementNodeGroupConfiguration;
    }

    // #endregion Private Static Methods (2)
} 