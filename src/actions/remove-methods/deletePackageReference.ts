import * as fs from 'fs';
import { handleError, getProjFileExtension } from '../../utils';
import { CANCEL } from '../../constants';

const getErrorMessage = (projFileFullPath: string): string => {
    const extension = getProjFileExtension(projFileFullPath);
    const fileDescription = extension ? `.${extension}` : 'project';
    return `Failed to write an updated ${fileDescription} file. Please try again later.`;
}

function escapeRegExp(s: string): string {
    return s.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

function findRemoveStart(s: string, start: number): number {
    var idx = start - 1;
    while (idx > 0 && / \t/.test(s[idx])) {
        --idx;
    }

    return idx + 1;
}

function findRemoveEnd(s: string, end: number): number {
    var idx = end;
    while (idx < s.length && / \t/.test(s[idx])) {
        ++idx;
    }
    if (idx < s.length && s[idx] == '\r') {
        ++idx;
    }
    if (idx < s.length && s[idx] == '\n') {
        ++idx;
    }

    return idx;
}

function findElementEnd(s: string, start: number): number {
    var end = start;
    var count = 0;
    do {
        if (end >= s.length) {
            return -1;
        }
        if (s[end] == '<') {
            ++count;
        } else if (s[end] == '>') {
            --count;
        }
        ++end;
    } while (count > 0);

    return end;
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
        const packageAttribute = new RegExp(`\\sInclude=['"]${escapeRegExp(selectedPackageName)}['"]`);
        const packageVersion = new RegExp(`\\sVersion=['"]${escapeRegExp(selectedPackageVersion)}['"]`);
        var index = 0;
        var end = 0;
        while (true) {
            let substr = originalContents.substr(index);
            let subIndex = substr.search(/<PackageReference\s/);
            if (subIndex == -1) {
                return handleError("Failed to find package", getErrorMessage(projFileFullPath), reject);
            }
            
            index = index + subIndex;
            end = originalContents.indexOf(">", index);
            if (end == -1) {
                return handleError("Failed to find closing '>'", getErrorMessage(projFileFullPath), reject);
            }
            
            var packageRef = originalContents.substr(index, end - index);
            var packageIndex = packageRef.search(packageAttribute);
            var versionIndex = packageRef.search(packageVersion);
            if (packageIndex != -1 && versionIndex != -1) {
                break;
            }
            index += 1;
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
