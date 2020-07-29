import * as vscode from 'vscode';
import { showInformationMessage, checkProjFilePath, showProjFileQuickPick } from './shared';
import { CANCEL, REMOVE } from '../constants';

import {
    readAllInstalledPackages,
    showPackagesQuickPick,
    deletePackageReference,
    QuickPick
} from './remove-methods';

function deleteAllReferences(info: QuickPick): Thenable<string> {
    var tasks = info.projects.map(project => {
        var obj: any = Object.assign({}, project);
        obj.selectedPackage = info.selectedPackage;
        return deletePackageReference(obj);
    });
    return Promise.all(tasks).then((messages: string[]) => {
        if (messages.length <= 1) {
            return messages[0];
        }

        return `Success! Removed ${info.selectedPackage} from ${messages.length} projects. Run dotnet restore to update your project.`;
    });
}

export function removeNuGetPackage() {
    checkProjFilePath(vscode.workspace.rootPath)
        .then((result: Array<string>): string[] | Thenable<string[] | Thenable<never>> => {
            if (result.length === 1) {
                return result;
            }

            return showProjFileQuickPick(result, REMOVE);
        })
        .then(readAllInstalledPackages)
        .then(showPackagesQuickPick)
        .then(deleteAllReferences)
        .then(showInformationMessage)
        .then(undefined, (err) => {
            if (err !== CANCEL) {
                vscode.window.showErrorMessage(err.message || err || 'Something went wrong! Please try again.');
            }
        });
}
