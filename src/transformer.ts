import * as ts from "typescript";
import { addRegions } from "./regions";
import { ClassElement } from "typescript";
import { compareNumbers, compareStrings } from "./utils";

export const organizeTransformer = <T extends ts.Node>(context: ts.TransformationContext) => (rootNode: T) =>
{
	function visit(node: ts.Node): ts.Node
	{
		if (node.kind === ts.SyntaxKind.ClassDeclaration)
		{
			let classDeclaration = node as ts.ClassDeclaration;
			let members: ts.ClassElement[] = classDeclaration.members.filter(x => true);
			let organizedMembers: ts.ClassElement[] = [];

			organizedMembers = organizedMembers.concat(getProperties(members));
			organizedMembers = organizedMembers.concat(getConstructors(members));
			organizedMembers = organizedMembers.concat(getAccessors(members));
			organizedMembers = organizedMembers.concat(getMethods(members));

			let newclassDeclaration = ts.updateClassDeclaration(
				classDeclaration,
				classDeclaration.decorators,
				classDeclaration.modifiers,
				classDeclaration.name,
				classDeclaration.typeParameters,
				<ReadonlyArray<ts.HeritageClause>>classDeclaration.heritageClauses,
				organizedMembers);

			return newclassDeclaration;
		}
		else if (node.kind === ts.SyntaxKind.InterfaceDeclaration)
		{
			let interfaceDeclaration = node as ts.InterfaceDeclaration;
			let members: ts.TypeElement[] = interfaceDeclaration.members.filter(x => true);
			let organizedMembers: ts.TypeElement[] = [];

			organizedMembers = organizedMembers.concat(getPropertySignatures(members));
			organizedMembers = organizedMembers.concat(getIndexSignatures(members));
			organizedMembers = organizedMembers.concat(getMethodSignatures(members));

			let newclassDeclaration = ts.updateInterfaceDeclaration(
				interfaceDeclaration,
				interfaceDeclaration.decorators,
				interfaceDeclaration.modifiers,
				interfaceDeclaration.name,
				interfaceDeclaration.typeParameters,
				<ReadonlyArray<ts.HeritageClause>>interfaceDeclaration.heritageClauses,
				organizedMembers);

			return newclassDeclaration;
		}

		return ts.visitEachChild(node, visit, context);
	}

	return ts.visitNode(rootNode, visit);
};

function getProperties(members: ClassElement[]): ts.ClassElement[]
{
	let nodes: ts.Node[] = [];
	let properties = members.filter(x => x.kind === ts.SyntaxKind.PropertyDeclaration);

	// add access modifier if missing
	for (let i = 0; i < properties.length; i++)
	{
		let property = <ts.PropertyDeclaration>properties[i];

		if (property.modifiers === undefined)
		{
			properties[i] = ts.updateProperty(property, property.decorators || [], [<ts.Modifier>ts.createToken(ts.SyntaxKind.PublicKeyword)], property.name, property.questionToken, property.type, property.initializer);
		}
		else if (!property.modifiers!.some(x => x.kind === ts.SyntaxKind.PublicKeyword) &&
			!property.modifiers!.some(x => x.kind === ts.SyntaxKind.ProtectedKeyword) &&
			!property.modifiers!.some(x => x.kind === ts.SyntaxKind.PrivateKeyword))
		{
			properties[i] = ts.updateProperty(property, property.decorators || [], [<ts.Modifier>ts.createToken(ts.SyntaxKind.PublicKeyword)].concat(<ts.ModifiersArray>property.modifiers), property.name, property.questionToken, property.type, property.initializer);
		}
		else
		{
			properties[i] = ts.createProperty(property.decorators || [], property.modifiers, property.name, property.questionToken, property.type, property.initializer);
		}
	}

	// readonly properties
	let readOnlyProperties = properties.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.ReadonlyKeyword));
	let publicReadOnlyProperties = readOnlyProperties.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.PublicKeyword)).sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));
	let privateReadOnlyProperties = readOnlyProperties.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.PrivateKeyword)).sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));
	let protectedReadOnlyProperties = readOnlyProperties.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.ProtectedKeyword)).sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));

	// static properties
	let staticProperties = properties.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.StaticKeyword));
	let publicStaticProperties = staticProperties.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.PublicKeyword)).sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));
	let privateStaticProperties = staticProperties.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.PrivateKeyword)).sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));
	let protectedStaticProperties = staticProperties.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.ProtectedKeyword)).sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));

	// instance properties
	let instanceProperties = properties.filter(x =>
		!x.modifiers!.some(x => x.kind === ts.SyntaxKind.ConstKeyword) &&
		!x.modifiers!.some(x => x.kind === ts.SyntaxKind.ReadonlyKeyword) &&
		!x.modifiers!.some(x => x.kind === ts.SyntaxKind.StaticKeyword));
	let publicInstanceProperties = instanceProperties.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.PublicKeyword)).sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));
	let privateInstanceProperties = instanceProperties.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.PrivateKeyword)).sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));
	let protectedInstanceProperties = instanceProperties.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.ProtectedKeyword)).sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));

	// add regions
	addRegions(privateReadOnlyProperties, "Private Readonly Properties");
	addRegions(protectedReadOnlyProperties, "Protected Readonly Properties");
	addRegions(publicReadOnlyProperties, "Public Readonly Properties");

	addRegions(privateStaticProperties, "Private Static Properties");
	addRegions(protectedStaticProperties, "Protected Static Properties");
	addRegions(publicStaticProperties, "Public Static Properties");

	addRegions(privateInstanceProperties, "Private Properties");
	addRegions(protectedInstanceProperties, "Protected Properties");
	addRegions(publicInstanceProperties, "Public Properties");

	return <ts.ClassElement[]>nodes
		.concat(privateReadOnlyProperties) // readonly properties
		.concat(protectedReadOnlyProperties)
		.concat(publicReadOnlyProperties)
		.concat(privateStaticProperties) // static properties
		.concat(protectedStaticProperties)
		.concat(publicStaticProperties)
		.concat(privateInstanceProperties) // instance properties
		.concat(protectedInstanceProperties)
		.concat(publicInstanceProperties);
}

function getMethods(members: ClassElement[]): ts.ClassElement[]
{
	let methods = members.filter(x => x.kind === ts.SyntaxKind.MethodDeclaration);
	let nodes: ts.Node[] = [];

	// add access modifier if missing
	for (let i = 0; i < methods.length; i++)
	{
		let method = <ts.MethodDeclaration>methods[i];

		if (method.modifiers === undefined)
		{
			methods[i] = ts.updateMethod(method, method.decorators || [], [<ts.Modifier>ts.createToken(ts.SyntaxKind.PublicKeyword)], method.asteriskToken, method.name!, method.questionToken, method.typeParameters || [], method.parameters || [], method.type, method.body);
		}
		else if (!method.modifiers!.some(x => x.kind === ts.SyntaxKind.PublicKeyword) &&
			!method.modifiers!.some(x => x.kind === ts.SyntaxKind.ProtectedKeyword) &&
			!method.modifiers!.some(x => x.kind === ts.SyntaxKind.PrivateKeyword))
		{
			methods[i] = ts.updateMethod(method, method.decorators || [], [<ts.Modifier>ts.createToken(ts.SyntaxKind.PublicKeyword)].concat(<ts.ModifiersArray>(method.modifiers)), method.asteriskToken, method.name!, method.questionToken, method.typeParameters || [], method.parameters || [], method.type, method.body);
		}
		else
		{
			methods[i] = ts.updateMethod(method, method.decorators || [], method.modifiers, method.asteriskToken, method.name!, method.questionToken, method.typeParameters || [], method.parameters || [], method.type, method.body);
		}
	}

	// static methods
	let staticMethods = methods.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.StaticKeyword));
	let publicStaticMethods = staticMethods.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.PublicKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));
	let protectedStaticMethods = staticMethods.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.ProtectedKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));
	let privateStaticMethods = staticMethods.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.PrivateKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));

	// instance methods
	let instanceMethods = methods.filter(x => !x.modifiers!.some(x => x.kind === ts.SyntaxKind.StaticKeyword));
	let publicInstanceMethods = instanceMethods.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.PublicKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));
	let protectedInstanceMethods = instanceMethods.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.ProtectedKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));
	let privateInstanceMethods = instanceMethods.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.PrivateKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));

	// add regions
	addRegions(publicStaticMethods, "Public Static Methods");
	addRegions(publicStaticMethods, "Protected Static Methods");
	addRegions(privateStaticMethods, "Private Static Methods");

	addRegions(publicInstanceMethods, "Public Methods");
	addRegions(protectedInstanceMethods, "Protected Methods");
	addRegions(privateInstanceMethods, "Private Methods");

	nodes = nodes
		.concat(publicStaticMethods) // static methods
		.concat(protectedStaticMethods)
		.concat(privateStaticMethods)
		.concat(publicInstanceMethods) // instance methods
		.concat(protectedInstanceMethods)
		.concat(privateInstanceMethods);

	for (let i = 0; i < nodes.length - 1; i++)
	{
		nodes[i] = ts.addSyntheticTrailingComment(nodes[i], ts.SyntaxKind.SingleLineCommentTrivia, "newline", true);
	}

	return <ts.ClassElement[]>nodes;
}

function getAccessors(members: ClassElement[]): ts.ClassElement[]
{
	let nodes: ts.Node[] = [];
	let accessors = members.filter(x => x.kind === ts.SyntaxKind.GetAccessor || x.kind === ts.SyntaxKind.SetAccessor);

	// add access modifier if missing
	for (let i = 0; i < accessors.length; i++)
	{
		let accessor = <ts.AccessorDeclaration>accessors[i];

		if (accessor.modifiers === undefined)
		{
			if (accessor.kind === ts.SyntaxKind.GetAccessor)
			{
				accessors[i] = ts.updateGetAccessor(accessor, accessor.decorators || [], [<ts.Modifier>ts.createToken(ts.SyntaxKind.PublicKeyword)], accessor.name!, accessor.parameters || [], accessor.type, accessor.body);
			}
			else if (accessor.kind === ts.SyntaxKind.SetAccessor)
			{
				accessors[i] = ts.updateSetAccessor(accessor, accessor.decorators || [], [<ts.Modifier>ts.createToken(ts.SyntaxKind.PublicKeyword)], accessor.name!, accessor.parameters || [], accessor.body);
			}
		}
		else if (!accessor.modifiers!.some(x => x.kind === ts.SyntaxKind.PublicKeyword) &&
			!accessor.modifiers!.some(x => x.kind === ts.SyntaxKind.ProtectedKeyword) &&
			!accessor.modifiers!.some(x => x.kind === ts.SyntaxKind.PrivateKeyword))
		{
			if (accessor.kind === ts.SyntaxKind.GetAccessor)
			{
				accessors[i] = ts.updateGetAccessor(accessor, accessor.decorators || [], [<ts.Modifier>ts.createToken(ts.SyntaxKind.PublicKeyword)].concat(<ts.ModifiersArray>(accessor.modifiers)), accessor.name!, accessor.parameters || [], accessor.type, accessor.body);
			}
			else if (accessor.kind === ts.SyntaxKind.SetAccessor)
			{
				accessors[i] = ts.updateSetAccessor(accessor, accessor.decorators || [], [<ts.Modifier>ts.createToken(ts.SyntaxKind.PublicKeyword)].concat(<ts.ModifiersArray>(accessor.modifiers)), accessor.name!, accessor.parameters || [], accessor.body);
			}
		}
		else
		{
			if (accessor.kind === ts.SyntaxKind.GetAccessor)
			{
				accessors[i] = ts.updateGetAccessor(accessor, accessor.decorators || [], accessor.modifiers || [], accessor.name!, accessor.parameters || [], accessor.type, accessor.body);
			}
			else if (accessor.kind === ts.SyntaxKind.SetAccessor)
			{
				accessors[i] = ts.updateSetAccessor(accessor, accessor.decorators || [], accessor.modifiers || [], accessor.name!, accessor.parameters || [], accessor.body);
			}
		}
	}

	// static accessors
	let staticAccessors = accessors.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.StaticKeyword));
	let publicStaticAccessors = staticAccessors.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.PublicKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text + (a.kind === ts.SyntaxKind.GetAccessor ? " get" : " set"), (<ts.Identifier>b.name).text + (b.kind === ts.SyntaxKind.GetAccessor ? " get" : " set")));
	let protectedStaticAccessors = staticAccessors.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.ProtectedKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text + (a.kind === ts.SyntaxKind.GetAccessor ? " get" : " set"), (<ts.Identifier>b.name).text + (b.kind === ts.SyntaxKind.GetAccessor ? " get" : " set")));
	let privateStaticAccessors = staticAccessors.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.PrivateKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text + (a.kind === ts.SyntaxKind.GetAccessor ? " get" : " set"), (<ts.Identifier>b.name).text + (b.kind === ts.SyntaxKind.GetAccessor ? " get" : " set")));

	// instance accessors
	let instanceAccessors = accessors.filter(x => !x.modifiers!.some(x => x.kind === ts.SyntaxKind.StaticKeyword));
	let publicInstanceAccessors = instanceAccessors.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.PublicKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text + (a.kind === ts.SyntaxKind.GetAccessor ? " get" : " set"), (<ts.Identifier>b.name).text + (b.kind === ts.SyntaxKind.GetAccessor ? " get" : " set")));
	let protectedInstanceAccessors = instanceAccessors.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.ProtectedKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text + (a.kind === ts.SyntaxKind.GetAccessor ? " get" : " set"), (<ts.Identifier>b.name).text + (b.kind === ts.SyntaxKind.GetAccessor ? " get" : " set")));
	let privateInstanceAccessors = instanceAccessors.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.PrivateKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text + (a.kind === ts.SyntaxKind.GetAccessor ? " get" : " set"), (<ts.Identifier>b.name).text + (b.kind === ts.SyntaxKind.GetAccessor ? " get" : " set")));

	// add regions
	addRegions(publicStaticAccessors, "Public Static Accessors");
	addRegions(protectedStaticAccessors, "Protected Static Accessors");
	addRegions(privateStaticAccessors, "Private Static Accessors");

	addRegions(publicInstanceAccessors, "Public Accessors");
	addRegions(protectedInstanceAccessors, "Protected Accessors");
	addRegions(privateInstanceAccessors, "Private Accessors");

	nodes = nodes.concat(publicStaticAccessors) // static accessors
		.concat(protectedStaticAccessors)
		.concat(privateStaticAccessors)
		.concat(publicInstanceAccessors) // instance accessors
		.concat(protectedInstanceAccessors)
		.concat(privateInstanceAccessors);

	for (let i = 0; i < nodes.length - 1; i++)
	{
		nodes[i] = ts.addSyntheticTrailingComment(nodes[i], ts.SyntaxKind.SingleLineCommentTrivia, "newline", true);
	}

	return <ts.ClassElement[]>nodes;
}

function getConstructors(members: ClassElement[]): ts.ClassElement[]
{
	let nodes: ts.Node[] = [];
	let constructors = members.filter(x => x.kind === ts.SyntaxKind.Constructor)
		.sort((a, b) => compareNumbers((<ts.ConstructorDeclaration>a).parameters.length, (<ts.ConstructorDeclaration>a).parameters.length));

	for (let i = 0; i < constructors.length; i++)
	{
		let constructor = <ts.ConstructorDeclaration>constructors[i];

		constructors[i] = ts.updateConstructor(constructor, constructor.decorators, constructor.modifiers || [], constructor.parameters, constructor.body);
	}

	// add regions
	addRegions(constructors, "Constructors");

	// add empty lines between method signatures
	for (let i = 0; i < constructors.length - 1; i++)
	{
		constructors[i] = ts.addSyntheticTrailingComment(constructors[i], ts.SyntaxKind.SingleLineCommentTrivia, "newline", true);
	}

	return <ts.ClassElement[]>nodes.concat(constructors);
}

function getPropertySignatures(members: ts.TypeElement[]): ts.TypeElement[]
{
	let nodes: ts.Node[] = [];
	let propertySignatures = members.filter(x => x.kind === ts.SyntaxKind.PropertySignature);

	for (let i = 0; i < propertySignatures.length; i++)
	{
		let propertySignature = <ts.PropertySignature>propertySignatures[i];
		let propertySignatureModifiers = propertySignature.modifiers || ts.createNodeArray<ts.Modifier>();

		propertySignatureModifiers = ts.createNodeArray<ts.Modifier>(propertySignatureModifiers.map(x => <ts.Modifier>ts.createModifier(x.kind)));

		propertySignatures[i] = ts.updatePropertySignature(propertySignature, propertySignatureModifiers, propertySignature.name, propertySignature.questionToken, propertySignature.type, propertySignature.initializer);
	}

	// readonly property signatures
	let readOnlyPropertySigantures = propertySignatures.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.ReadonlyKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));

	// instance property signatures
	let instancePropertySignatures = propertySignatures.filter(x => !x.modifiers!.some(x => x.kind === ts.SyntaxKind.ReadonlyKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));

	// add regions
	addRegions(readOnlyPropertySigantures, "Readonly Properties");
	addRegions(instancePropertySignatures, "Properties");

	return <ts.TypeElement[]>nodes
		.concat(readOnlyPropertySigantures)
		.concat(instancePropertySignatures);
}

function getIndexSignatures(members: ts.TypeElement[]): ts.TypeElement[]
{
	let nodes: ts.Node[] = [];
	let indexSignatures = members.filter(x => x.kind === ts.SyntaxKind.IndexSignature);

	for (let i = 0; i < indexSignatures.length; i++)
	{
		let indexSignature = <ts.IndexSignatureDeclaration>indexSignatures[i];
		let indexModifiers = indexSignature.modifiers || ts.createNodeArray<ts.Modifier>();

		indexModifiers = ts.createNodeArray<ts.Modifier>(indexModifiers.map(x => <ts.Modifier>ts.createModifier(x.kind)));

		indexSignatures[i] = ts.updateIndexSignature(indexSignature, indexSignature.decorators, indexModifiers, indexSignature.parameters, indexSignature.type!);
	}

	// readonly index signatures
	let readOnlyIndexSigantures = indexSignatures.filter(x => x.modifiers!.some(x => x.kind === ts.SyntaxKind.ReadonlyKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));

	// instance property signatures
	let instanceIndexSignatures = indexSignatures.filter(x => !x.modifiers!.some(x => x.kind === ts.SyntaxKind.ReadonlyKeyword))
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));

	// add regions
	addRegions(readOnlyIndexSigantures, "Readonly Indexes");
	addRegions(instanceIndexSignatures, "Indexes");

	return <ts.TypeElement[]>nodes
		.concat(readOnlyIndexSigantures)
		.concat(instanceIndexSignatures);
}

function getMethodSignatures(members: ts.TypeElement[]): ts.TypeElement[]
{
	let methodSignatures = members.filter(x => x.kind === ts.SyntaxKind.MethodSignature)
		.sort((a, b) => compareStrings((<ts.Identifier>a.name).text, (<ts.Identifier>b.name).text));
	let nodes: ts.Node[] = [];

	// add access modifier if missing
	for (let i = 0; i < methodSignatures.length; i++)
	{
		let methodSignature = <ts.MethodSignature>methodSignatures[i];
		let methodParameters = methodSignature.parameters || ts.createNodeArray<ts.ParameterDeclaration>();
		let methodTypeParameters = methodSignature.typeParameters || ts.createNodeArray<ts.TypeParameterDeclaration>();

		methodSignatures[i] = ts.updateMethodSignature(methodSignature, methodTypeParameters, methodParameters, methodSignature.type, methodSignature.name, methodSignature.questionToken);
	}

	// add regions
	addRegions(methodSignatures, "Methods");

	nodes = nodes.concat(methodSignatures);

	// add empty lines between method signatures
	for (let i = 0; i < nodes.length - 1; i++)
	{
		nodes[i] = ts.addSyntheticTrailingComment(nodes[i], ts.SyntaxKind.SingleLineCommentTrivia, "newline", true);
	}

	return <ts.TypeElement[]>nodes;
}

// // function getTokenAtPositionWorker(sourceFile: SourceFile, position: number, allowPositionInLeadingTrivia: boolean, includePrecedingTokenAtEndPosition: ((n: Node) => boolean) | undefined, includeEndPosition: boolean): Node
// // {
// // 	let current: ts.Node = sourceFile;
// // 	outer: while (true)
// // 	{
// // 		// find the child that contains 'position'
// // 		for (const child of current.getChildren())
// // 		{
// // 			const start = allowPositionInLeadingTrivia ? child.getFullStart() : child.getStart(sourceFile, /*includeJsDoc*/ true);
// // 		}
// // 	}
// // }