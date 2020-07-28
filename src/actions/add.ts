import * as vscode from 'vscode';
import * as path from 'path';

import { emptyString, CANCEL } from '../constants';
import { showInformationMessage, clearStatusBar } from './shared/';
import {
    showSearchBox,
    fetchPackages,
    handleSearchResponse,
    showPackageQuickPick,
    fetchPackageVersions,
    handleVersionsResponse,
    showVersionsQuickPick,
    handleVersionsQuickPick,
    writeFile
} from './add-methods';

function writeFiles(info: any[]): Thenable<string> {
    var tasks = info.map(info => writeFile(info));
    return Promise.all(tasks).then((results: string[]) => {
        if (results.length == 1) {
            return results[0];
        }

        return `Success! Wrote to ${results.length} projects. Run dotnet restore to update your project.`
    });
}

export function addNuGetPackage() {
    showSearchBox()
        .then(fetchPackages)
        .then(handleSearchResponse)
        .then(showPackageQuickPick)
        .then(fetchPackageVersions)
        .then(handleVersionsResponse)
        .then(showVersionsQuickPick)
        .then(handleVersionsQuickPick)
        .then(writeFiles)
        .then(showInformationMessage)
        .then(undefined, (err) => {
            clearStatusBar();
            if (err !== CANCEL) {
                vscode.window.showErrorMessage(err.message || err || 'Something went wrong! Please try again.');
            }
        });
}

