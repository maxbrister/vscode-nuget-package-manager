import * as vscode from 'vscode';
import checkProjFilePath from './checkProjFilePath';
import showProjFileQuickPick from './showProjFileQuickPick';
import clearStatusBar from './clearStatusBar';
import createUpdatedProject from './createUpdatedProject';
import { getNuGetService, SEARCH_SERVICE, VERSION_SERVICE } from './getNuGetService';
import getProjFileRecursive from './getProjFileRecursive';
import truncateProjFilePath from './truncateProjFilePath';
import { findPackageReferences, findElementEnd, findRemoveStart, findRemoveEnd } from "./xmlUtilities";

const showInformationMessage = vscode.window.showInformationMessage.bind(vscode.window);

export {
    checkProjFilePath,
    showProjFileQuickPick,
    clearStatusBar,
    showInformationMessage,
    createUpdatedProject,
    getNuGetService,
    getProjFileRecursive,
    truncateProjFilePath,
    findPackageReferences,
    findElementEnd,
    findRemoveStart,
    findRemoveEnd,
    SEARCH_SERVICE,
    VERSION_SERVICE
};
