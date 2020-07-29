import { findPackageReferences, findElementEnd, findRemoveStart, findRemoveEnd } from "../shared"
import { isPlainObject } from '../../utils';

export default function createUpdatedProject(original: any, selectedPackageName: string, selectedVersion: string): any {
    let references = findPackageReferences(original);
    let iter = references.next();
    let reference;
    while (!iter.done) {
        reference = iter.value;
        if (iter.value.packageName == selectedPackageName) {
            break;
        }

        iter = references.next();
    }

    let newContent;
    if (!!reference && reference.packageName == selectedPackageName) {
        let sub = original.substr(reference.start);
        sub = sub.replace(/\sVersion=['"][^'"]+['"]/, ` Version="${selectedVersion}"`);
        newContent = original.substr(0, reference.start) + sub;
    } else if (!!reference) {
        let idx = reference.start;
        let elementEnd = findElementEnd(original, idx);
        if (elementEnd == -1) {
            throw new Error(`PackageReference at ${idx} is not terminated`);
        }
        let { index, newline } = findRemoveEnd(original, elementEnd);
        let insert = index;
        let prefix = original.substr(0, insert);
        let postfix = original.substr(insert);
        let maybeSpace = original[elementEnd - 3] == " " ? " " : "";
        let content = `<PackageReference Include="${selectedPackageName}" Version="${selectedVersion}"${maybeSpace}/>${newline}`;
        let indent = "";
        if (insert != elementEnd) {
            // Inserting on the next line, figure out the indentation
            let lineStart = findRemoveStart(original, idx);
            indent = original.substr(lineStart, idx - lineStart);
        }
        newContent = prefix + indent + content + postfix;
    } else {
        // TODO: Add inside an ItemGroup. Account for not ItemGroup
    }

    return newContent;
}
