export interface PackageReference {
    packageName: string,
    packageVersion: string,
    start: number
}
export function* findPackageReferences(content: string): Generator<PackageReference> {
    const packageName = /\sInclude=['"]([^'"]+)['"]/;
    const packageVersion = /\sVersion=['"]([^'"]+)['"]/;
    var index = 0;
    while (true) {
        let substr = content.substr(index);
        let subIndex = substr.search(/<PackageReference\s/);
        if (subIndex == -1) {
            return;
        }

        index = index + subIndex;
        let end = content.indexOf(">", index);
        if (end == -1) {
            throw Error(`Invalid PackageReference at index ${index}. No closing '>'.`);
        }

        var packageRef = content.substr(index, end - index);
        var name = packageRef.match(packageName);
        var version = packageRef.match(packageVersion);
        if (!!name && !!version) {
            yield {
                packageName: name[1],
                packageVersion: version[1],
                start: index
            };
        }

        index = end;
    }
}

export function findElementEnd(s: string, start: number): number {
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

export function findRemoveStart(s: string, start: number): number {
    var idx = start - 1;
    while (idx > 0 && / |\t/.test(s[idx])) {
        --idx;
    }

    return idx + 1;
}

export function findRemoveEnd(s: string, end: number) {
    var idx = end;
    while (idx < s.length && / |\t/.test(s[idx])) {
        ++idx;
    }
    let newlineStart = idx;
    if (idx < s.length && s[idx] == '\r') {
        ++idx;
    }
    if (idx < s.length && s[idx] == '\n') {
        ++idx;
    }

    return {
        index: idx,
        newline: s.substr(newlineStart, idx - newlineStart)
    };
}