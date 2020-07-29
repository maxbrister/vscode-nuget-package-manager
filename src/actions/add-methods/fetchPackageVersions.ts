import * as vscode from 'vscode';
import fetch from 'node-fetch';

import { clearStatusBar } from '../shared';
import { CANCEL } from '../../constants';
import { getFetchOptions } from "../../utils"
import { getFetchConfig } from '../../utils/getFetchOptions';

export default function fetchPackageVersions(selectedPackageName: string, versionsUrl: string): Promise<any> | Promise<never> {
    if (!selectedPackageName) {
        // User has canceled the process.
        return Promise.reject(CANCEL);
    }

    vscode.window.setStatusBarMessage('Loading package versions...');

    return new Promise((resolve) => {
        fetch(`${versionsUrl}${selectedPackageName}/index.json`, getFetchOptions(getFetchConfig()))
            .then((response: Response) => {
                clearStatusBar();
                resolve({ response, selectedPackageName });
            });
    });
}
