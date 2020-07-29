import * as vscode from 'vscode';
import * as path from 'path';

import { CANCEL } from '../constants';
import { showInformationMessage, clearStatusBar } from './shared/';
import {
    showSearchBox,
    fetchPackages,
    handleSearchResponse,
    showPackageQuickPick,
    showVersionsQuickPick,
    handleVersionsQuickPick,
    writeFile
} from './add-methods';
import { getNuGetService, SEARCH_SERVICE, VERSION_SERVICE } from "./shared";

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
    let searchBox = showSearchBox();
    let searchUrl = getNuGetService(SEARCH_SERVICE);
    let versionUrl = getNuGetService(VERSION_SERVICE);
    Promise.all([searchBox, searchUrl])
        .then(([search, searchUrl]) => fetchPackages(search, searchUrl))
        .then(handleSearchResponse)
        .then(showPackageQuickPick)
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

