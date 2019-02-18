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

export function formatRegions(sourceCode: string)
{
	const newLine = "\r\n";
	const newLinePlaceholder = "//newline";
	const cleanPlaceholder = "//clean";
	let newLineRegex = new RegExp(`\\s*${newLinePlaceholder}`, "g");
	let cleanRegex = new RegExp(`\\s*${cleanPlaceholder}`, "g");

	sourceCode = sourceCode.replace(newLineRegex, newLine);
	sourceCode = sourceCode.replace(cleanRegex, "");

	return sourceCode;
}

export function formatLines(sourceCode: string)
{
	const newLine = "\r\n";
	let newLineRegex = new RegExp(`^\\s*$`);
	let openingBraceRegex = new RegExp(`^.*\{\\s*$`);
	let closingBraceRegex = new RegExp(`^\\s*\}\\s*$`);

	let lines: string[] = sourceCode.split(newLine);

	for (let i = 0; i < lines.length - 1; i++)
	{
		if (openingBraceRegex.test(lines[i]) &&
			newLineRegex.test(lines[i + 1]))
		{
			// remove empty line after {
			lines.splice(i + 1, 1);

			i--;
		}
		else if (newLineRegex.test(lines[i]) &&
			closingBraceRegex.test(lines[i + 1]))
		{
			// remove empty line before }
			lines.splice(i, 1);

			i--;
		}
		else if (newLineRegex.test(lines[i]) &&
			newLineRegex.test(lines[i + 1]))
		{
			lines.splice(i, 1);

			i--;
		}
	}

	return lines.join(newLine);
}
