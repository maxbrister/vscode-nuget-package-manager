import * as vscode from 'vscode';

export interface ProjectInfo {
    projFileFullPath: string,
    installedPackages: string[],
    packageRefSection: any,
    parsed: any,
    originalContents: any
}

export interface QuickPick {
    selectedPackage: string,
    projects: ProjectInfo[]
}

export default function showPackagesQuickPick(options: ProjectInfo[]): Thenable<QuickPick> {
    var packages = {};
    options.forEach(info => {
        info.installedPackages.forEach(pkg => {
            if (pkg in packages) {
                packages[pkg].push(info);
            } else {
                packages[pkg] = [info];
            }
        })
    });
    return vscode.window.showQuickPick(Object.keys(packages))
        .then((selectedPackage: string | undefined) => {
            if (selectedPackage) {
                return {
                    selectedPackage: selectedPackage,
                    projects: packages[selectedPackage]
                };
            }
        });
}
