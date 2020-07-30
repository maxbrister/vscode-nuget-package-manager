import * as vscode from 'vscode';

import { truncateProjFilePath } from './';
import { CANCEL, REMOVE, RESTORE } from '../../constants';

/**
 * Helper method for getting the placeholder text.
 *
 * @param {string} action
 * @returns {string}
 */
function getPlaceholder(action: string): string {
    if (action === RESTORE) {
        return `Which project do you wish to ${action.toLowerCase()}?`;
    }
    
    const preposition = action === REMOVE ? 'From' : 'To';
    return `${preposition} which project file do you wish to ${action.toLowerCase()} this dependency?`;
}

export default function showProjFileQuickPick(foundProjFiles: Array<string>, action: string, includeAll: boolean = true): Thenable<string[]> {
    // Truncate `.[fc]sproj` file paths for readability, mapping the truncated string to the full path
    // for easy retrieval once a truncated path is picked by the user.
    const initialMap = includeAll ? {"All": foundProjFiles} : {};
    const truncatedPathMap = foundProjFiles.reduce((newMap, projFilePath) => {
        newMap[truncateProjFilePath(projFilePath)] = [projFilePath];
        return newMap;
    }, initialMap);

    return vscode.window.showQuickPick(Object.keys(truncatedPathMap), {
        placeHolder: getPlaceholder(action)
    }).then((choice?: string) => {
        if (!choice) {
            // User canceled.
            return Promise.reject(CANCEL);
        }

        return truncatedPathMap[choice];
    });
}
