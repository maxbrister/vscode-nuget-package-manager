export interface PackageReference {
    packageName: string,
    packageVersion: string,
    start: number
}
export function* findPackageReferences(content: string): Generator<PackageReference> {
    const packageName = /\sInclude=['"]([^"]+)['"]/;
    const packageVersion = /\sVersion=['"]([^"]+)['"]/;
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