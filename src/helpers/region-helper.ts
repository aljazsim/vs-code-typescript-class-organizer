// #region Functions (2)

export function removeRegions(sourceCode: string)
{
    const newLine = "\n";
    const emptyLine = "";
    let anythingRegex = ".";
    let regionRegex = "#region";
    let endregionRegex = "#endregion";
    let spaceRegex = "\\s";

    let startRegionsRegex = new RegExp(`^//${spaceRegex}*${regionRegex}${spaceRegex}+${anythingRegex}+$`, "i");
    let endRegionsRegex = new RegExp(`^//${spaceRegex}*${endregionRegex}(${spaceRegex}+${anythingRegex}+)?$`, "i");
    let lines: string[] = sourceCode.split(newLine);
    let lines2: string[] = [];

    for (let i = 0; i < lines.length; i++)
    {
        if (!startRegionsRegex.test(lines[i].trim()) &&
            !endRegionsRegex.test(lines[i].trim()))
        {
            lines2.push(lines[i]);
        }
        else
        {
            while (lines.length > i &&
                lines[i] === emptyLine)
            {
                i++;
            }

            while (lines2.length > 0 &&
                lines2[lines2.length - 1] === emptyLine)
            {
                lines2.pop();
            }
        }
    }

    return lines2.join(newLine);
}

// #endregion Functions (2)
