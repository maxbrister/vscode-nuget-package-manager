import { isPlainObject } from '../../utils';

export default function createUpdatedProject(parsedProjectFile: any, selectedPackageName: string, selectedVersion: string): any {
    if (!parsedProjectFile || !isPlainObject(parsedProjectFile.Project)) {
        // We don't try to create this, as its absence suggests something is terribly wrong.
        throw new TypeError('Cannot locate the project root in your project file. Please fix this issue and try again.');
    }

    const itemGroups = parsedProjectFile.Project.ItemGroup ? [ ...parsedProjectFile.Project.ItemGroup ] : [];
    const existingItemWithPackageRefs = itemGroups.find((group) => Array.isArray(group.PackageReference));
    const newItemWithPackageRefs = !existingItemWithPackageRefs ? { PackageReference: [] } : {
        ...existingItemWithPackageRefs,
        PackageReference: [ ...existingItemWithPackageRefs.PackageReference ]
    };
    const packageReferences = newItemWithPackageRefs.PackageReference;
    const existingReference = packageReferences.find((ref) => ref.$ && ref.$.Include === selectedPackageName);
    const newReference = {
        $: {
            Include: selectedPackageName,
            Version: selectedVersion
        }
    };

    // Update `packageReferences`.
    if (!existingReference) {
        packageReferences.push(newReference);
    }
    else {
        packageReferences[packageReferences.indexOf(existingReference)] = newReference;
    }

    // Update `itemGroups`.
    if (!existingItemWithPackageRefs) {
        itemGroups.push(newItemWithPackageRefs);
    }
    else {
        itemGroups[itemGroups.indexOf(existingItemWithPackageRefs)] = newItemWithPackageRefs;
    }

    return {
        ...parsedProjectFile,
        Project: {
            ...parsedProjectFile.Project,
            ItemGroup: itemGroups
        }
    };
}
