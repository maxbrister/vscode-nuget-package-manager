import * as vscode from 'vscode';

import { CANCEL } from '../../constants';

// trim build information from symver 2.0 symbols. This could, in theory, cause
// collisions.
function simplify(v: string): string {
    let idx = v.indexOf('+');
    if (idx === -1) {
        return v;
    } else {
        return v.substr(0, idx);
    }
}

export default function showVersionsQuickPick({ json, selectedPackageName }: { json: any, selectedPackageName: string }): Promise<any | never> {
    let versions: Set<string> = new Set();
    json.versions
        .slice()
        .reverse()
        .concat('*')
        .forEach(version => {
            let simplified = simplify(version);
            versions.add(simplified);    
        });

    return new Promise((resolve, reject) => {
        vscode.window.showQuickPick(Array.from(versions), {
            placeHolder: 'Select the version to add.'
        }).then((selectedVersion: string | undefined) => {
            if (!selectedVersion) {
                // User canceled.
                return reject(CANCEL);
            }
            resolve({ selectedVersion, selectedPackageName });
        });
    });
}