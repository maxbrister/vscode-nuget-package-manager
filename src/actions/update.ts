import { checkProjFilePath, showProjFileQuickPick } from "./shared";
import * as vscode from 'vscode';
import { CANCEL, UPDATE } from '../constants';
import { readAllInstalledPackages, showPackagesQuickPick, QuickPick } from "./remove-methods";
import { showInformationMessage, createUpdatedProject } from "./shared";
import { writeFile, showVersionsQuickPick, fetchPackageVersions, handleVersionsResponse } from "./add-methods";
import { getNuGetService, VERSION_SERVICE } from "./shared";

function selectPackageVersion(projects: QuickPick, versionUrl: string) {
    const [ selectedPackage, selectedPackageVersion ] = projects.selectedPackage.split(/\s/);
    let fetch: any = fetchPackageVersions(selectedPackage, versionUrl);
    return fetch.then(handleVersionsResponse)
        .then(showVersionsQuickPick)
        .then((result) => {
            projects.selectedPackage = selectedPackage;
            return {
                projects,
                selectedVersion: result.selectedVersion
            }
        });
}

function updatePackages({projects, selectedVersion}: {projects: QuickPick, selectedVersion: string}) {
    let tasks = projects.projects.map(project => {
        let contents = createUpdatedProject(project.originalContents, projects.selectedPackage, selectedVersion);
        return writeFile({
            pickedProjFile: project.projFileFullPath,
            contents,
            selectedPackageName: projects.selectedPackage,
            selectedVersion,
            originalContents: project.originalContents
        });
    });
    return Promise.all(tasks);
}

function selectMessage(messages: string[]): string {
    if (messages.length === 1) {
        return messages[0];
    }

    return `Success! Updated ${messages.length} packages`;
}

export function updateNuGetPackage() {
    let projects = checkProjFilePath(vscode.workspace.rootPath)
        .then((result: string[]): string[] | Thenable<string[]> => {
            if (result.length === 1) {
                return result
            }

            return showProjFileQuickPick(result, UPDATE)
        })
        .then(readAllInstalledPackages)
        .then(showPackagesQuickPick);
    let versionUrl = getNuGetService(VERSION_SERVICE);
    Promise.all([projects, versionUrl])
        .then(([projects, versionUrl]) => selectPackageVersion(projects, versionUrl))
        .then(updatePackages)
        .then(selectMessage)
        .then(showInformationMessage)
        .then(undefined, (err) => {
            if (err !== CANCEL) {
                vscode.window.showErrorMessage(err.message || err || 'Something went wrong! Please try again.');
            }
        });
}