import * as ts from "typescript";

export function addRegions(nodes: ts.Node[], text: string)
{
	const region = `#region ${text} (${nodes.length})`;
	const endregion = `#endregion`;
	const newLinePlaceholder = "newline";
	const cleanPlaceholder = "clean";

	if (nodes.length > 0)
	{
		// add regions
		nodes[0] = ts.addSyntheticLeadingComment(nodes[0], ts.SyntaxKind.SingleLineCommentTrivia, newLinePlaceholder, false);
		nodes[0] = ts.addSyntheticLeadingComment(nodes[0], ts.SyntaxKind.SingleLineCommentTrivia, region, false);
		nodes[0] = ts.addSyntheticLeadingComment(nodes[0], ts.SyntaxKind.SingleLineCommentTrivia, newLinePlaceholder, false);
		nodes[nodes.length - 1] = ts.addSyntheticTrailingComment(nodes[nodes.length - 1], ts.SyntaxKind.SingleLineCommentTrivia, cleanPlaceholder, true);
		nodes[nodes.length - 1] = ts.addSyntheticTrailingComment(nodes[nodes.length - 1], ts.SyntaxKind.SingleLineCommentTrivia, newLinePlaceholder, true);
		nodes[nodes.length - 1] = ts.addSyntheticTrailingComment(nodes[nodes.length - 1], ts.SyntaxKind.SingleLineCommentTrivia, endregion, true);
	}
}

export function removeRegions(sourceCode: string)
{
	const newLine = "\r\n";
	const emptyLine = "";
	let regionRegex = "#region";
	let endregionRegex = "#endregion";
	let accessModifierRegex = "(Public|Protected|Private)";
	let writeModifierRegex = "(Readonly|Static)";
	let staticModifierRegex = "(Static)";
	let propertiesRegex = "(Properties)";
	let indexesRegex = "(Indexes)";
	let accessorsRegex = "(Accessors)";
	let constructorRegex = "(Constructors)";
	let methodsRegex = "(Methods)";
	let countRegex = "\\([0-9]+\\)";
	let spaceRegex = "\\s*";
	let propertiesRegionRegex = new RegExp(`^${spaceRegex}//${spaceRegex}${regionRegex}${spaceRegex}${accessModifierRegex}${spaceRegex}(${writeModifierRegex}${spaceRegex})?${propertiesRegex}${spaceRegex}${countRegex}${spaceRegex}$`, "i");
	let accessorsRegionRegex = new RegExp(`^${spaceRegex}//${spaceRegex}${regionRegex}${spaceRegex}${accessModifierRegex}${spaceRegex}${accessorsRegex}${spaceRegex}${countRegex}${spaceRegex}$`, "i");
	let constructorRegionRegex = new RegExp(`^${spaceRegex}//${spaceRegex}${regionRegex}${spaceRegex}${constructorRegex}${spaceRegex}${countRegex}${spaceRegex}`, "i");
	let methodsRegionRegex = new RegExp(`^${spaceRegex}//${spaceRegex}${regionRegex}${spaceRegex}${accessModifierRegex}${spaceRegex}(${staticModifierRegex}${spaceRegex})?${methodsRegex}${spaceRegex}${countRegex}${spaceRegex}$`, "i");

	let propertySiganturesRegionRegex = new RegExp(`^${spaceRegex}//${spaceRegex}${regionRegex}${spaceRegex}(${writeModifierRegex}${spaceRegex})?${propertiesRegex}${spaceRegex}${countRegex}${spaceRegex}$`, "i");
	let indexSiganturesRegionRegex = new RegExp(`^${spaceRegex}//${spaceRegex}${regionRegex}${spaceRegex}(${writeModifierRegex}${spaceRegex})?${indexesRegex}${spaceRegex}${countRegex}${spaceRegex}$`, "i");
	let methodSignaturesRegionRegex = new RegExp(`^${spaceRegex}//${spaceRegex}${regionRegex}${spaceRegex}${methodsRegex}${spaceRegex}${countRegex}${spaceRegex}$`, "i");

	let endregionsRegex = new RegExp(`^${spaceRegex}//${spaceRegex}${endregionRegex}${spaceRegex}$`, "i");
	let lines: string[] = sourceCode.split(newLine);
	let lines2: string[] = [];

	for (let i = 0; i < lines.length; i++)
	{
		if (!propertiesRegionRegex.test(lines[i]) &&
			!accessorsRegionRegex.test(lines[i]) &&
			!constructorRegionRegex.test(lines[i]) &&
			!methodsRegionRegex.test(lines[i]) &&
			!endregionsRegex.test(lines[i]) &&
			!propertySiganturesRegionRegex.test(lines[i]) &&
			!indexSiganturesRegionRegex.test(lines[i]) &&
			!methodSignaturesRegionRegex.test(lines[i]))
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
	let closingBraceRegex = new RegExp(`^\\s*\}.*$`);
	let importRegex = new RegExp(`^import.+from.+;$`);

	let lines: string[] = sourceCode.split(newLine);
	let lines2: string[] = [];

	for (let i = 0; i < lines.length - 1; i++)
	{
		if (openingBraceRegex.test(lines[i]) &&
			newLineRegex.test(lines[i + 1]))
		{
			// remove empty line after {
			lines2.push(lines[i]);

			i++;
		}
		else if (newLineRegex.test(lines[i]) &&
			closingBraceRegex.test(lines[i + 1]))
		{
			// remove empty line before }
			i++;

			lines2.push(lines[i]);

		}
		else if (newLineRegex.test(lines[i]) &&
			newLineRegex.test(lines[i + 1]))
		{
			// skip emptyline
		}
		else if (importRegex.test(lines[i]) &&
			!importRegex.test(lines[i + 1]))
		{
			// add empty line after imports
			lines2.push(lines[i]);
			lines2.push("");
		}
		else
		{
			lines2.push(lines[i]);
		}

	}

	return lines2.join(newLine);
}
