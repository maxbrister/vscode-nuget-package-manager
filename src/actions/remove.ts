import * as vscode from 'vscode';
import * as path from 'path';

import { showInformationMessage, checkProjFilePath, showProjFileQuickPick } from './shared';
import { emptyString, CANCEL, REMOVE } from '../constants';

import {
    readInstalledPackages,
    showPackagesQuickPick,
    deletePackageReference
} from './remove-methods';

export function removeNuGetPackage() {
    checkProjFilePath(vscode.workspace.rootPath)
        .then((result: Array<string>): string[] | Thenable<string[] | Thenable<never>> => {
            if (result.length === 1) {
                return result;
            }

            return showProjFileQuickPick(result, REMOVE);
        })
        .then((result) => {
            return result[0];
        })
        .then(readInstalledPackages)
        .then(showPackagesQuickPick)
        .then(deletePackageReference)
        .then(showInformationMessage)
        .then(undefined, (err) => {
            if (err !== CANCEL) {
                vscode.window.showErrorMessage(err.message || err || 'Something went wrong! Please try again.');
            }
        });
}
