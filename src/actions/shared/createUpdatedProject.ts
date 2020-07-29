import { findPackageReferences, findElementEnd, findRemoveStart, findRemoveEnd } from "../shared"
import { stat } from "fs";
import { reverse } from "dns";
import { join } from "path";

function isNewline(s: string) {
    return s == '\n' || s == '\r';
}

function inferNewLine(s: string, lineStartHint: number) {
    if (isNewline(s[lineStartHint - 1])) {
        if (s[lineStartHint - 1] == "\r" || s[lineStartHint - 2] == "\r" || s[lineStartHint] == "\r") {
            return "\r\n";
        } else {
            return "\n";
        }
    } else {
        return s.indexOf("\r") === -1 ? "\n" : "\r\n";
    }
}

interface Line {
    index: number,
    line: string
}

// Skips blank lines
function* reverseLineIterator(s: string, start: number): Generator<Line> {
    while (true) {
        while (start > 0 && isNewline(s[start])) --start;
        if (start == 0) return;
        let end = start;
        while (end > 0 && !isNewline(s[end])) --end;
        yield {
            index: end + 1,
            line: s.substr(end + 1, start - end)
        };
        start = end;
    }
}

export default function createUpdatedProject(original: string, selectedPackageName: string, selectedVersion: string): any {
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
        let re = /<\/Project\s*>/gm;
        let lastIndex = -1;
        while (true) {
            let m = re.exec(original);
            if (m === null) {
                break;
            }
            lastIndex = m.index;
        }
        if (lastIndex == -1) {
            throw new Error("Failed to find </Project>");
        }
        let insertIdx = findRemoveStart(original, lastIndex);

        // Skip over imports if possible
        if (isNewline(original[insertIdx - 1])) {
            let iter = reverseLineIterator(original, insertIdx - 1);
            let next = iter.next();
            while (!next.done) {
                let {index, line} = next.value;
                let isImport = line.search(/^\s*<Import[^>]*\/>\s*$/);
                if (isImport === 0) {
                    insertIdx = index;
                } else if (/\S+/.test(line)) {
                    break;
                }
                next = iter.next();
            }
        }

        // Find the proper indentation by looking at the previous line
        let indent = "";
        if (isNewline(original[insertIdx - 1])) {
            let iter = reverseLineIterator(original, insertIdx - 1);
            let prev = iter.next();
            if (!prev.done) {
                let line = prev.value.line;
                let m = line.match(/^(\s+)</);
                if (!!m) {
                    indent = m[1];
                }
            }
        }

        let innerIndent = indent.repeat(2);
        if (innerIndent.length === 0) {
            innerIndent = "  ";
        }

        // Infer space here to? This should be a pretty uncommon scenario.
        let newLine = inferNewLine(original, insertIdx);
        let content = `${indent}<ItemGroup>${newLine}${innerIndent}<PackageReference Include="${selectedPackageName}" Version="${selectedVersion}" />${newLine}${indent}</ItemGroup>${newLine}`;
        let prefix = original.substr(0, insertIdx);
        let postfix = original.substr(insertIdx);
        newContent = prefix + content + postfix;
    }

    return newContent;
}
