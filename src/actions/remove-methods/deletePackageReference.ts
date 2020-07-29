import * as fs from 'fs';
import { handleError, getProjFileExtension } from '../../utils';
import { findPackageReferences, findElementEnd, findRemoveStart, findRemoveEnd } from "../shared"
import { CANCEL } from '../../constants';

const getErrorMessage = (projFileFullPath: string): string => {
    const extension = getProjFileExtension(projFileFullPath);
    const fileDescription = extension ? `.${extension}` : 'project';
    return `Failed to write an updated ${fileDescription} file. Please try again later.`;
}

export default function deletePackageReference({
    projFileFullPath,
    selectedPackage,
    parsed,
    packageRefSection,
    originalContents = ''
}: any): Promise<string> | Promise<never> {
    if (!selectedPackage) {
        // Search canceled.
        return Promise.reject(CANCEL);
    }

    return new Promise((resolve, reject) => {
        // What follows... isn't exactly pretty. It's important to preserve formatting/whitespace in the
        // rest of the project file. None of the popular JS only libraries seem to support this.
        // Solution is to abuse regex.
        const [ selectedPackageName, selectedPackageVersion ] = selectedPackage.split(/\s/);
        let references = findPackageReferences(originalContents);
        let index = -1;
        let result = references.next();
        while (!!result.value) {
            if (result.value.packageName == selectedPackageName && result.value.packageVersion == selectedPackageVersion) {
                index = result.value.start;
                break;
            }

            result = references.next();
        }

        if (index == -1) {
            return handleError("Could not locate package", getErrorMessage(projFileFullPath), reject);
        }

        var removeStart = findRemoveStart(originalContents, index);
        var elementEnd = findElementEnd(originalContents, index);
        if (elementEnd == -1) {
            return handleError("PackageReference is not terminated", getErrorMessage(projFileFullPath), reject);
        }
        var removeEnd = findRemoveEnd(originalContents, elementEnd);
        var newContents = originalContents.substr(0, removeStart) + originalContents.substr(removeEnd);
        fs.writeFile(projFileFullPath, newContents, (err) => {
            if (err) {
                return handleError(err, getErrorMessage(projFileFullPath), reject);
            }

            return resolve(`Success! Removed ${selectedPackageName}@${selectedPackageVersion} from ${projFileFullPath}. Run dotnet restore to update your project.`);
        });
    });
}
