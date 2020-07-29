import * as vscode from 'vscode';
import * as qs from 'querystring';
import fetch from 'node-fetch';

import { CANCEL } from '../../constants';
import { getFetchOptions } from '../../utils';
import { getFetchConfig } from '../../utils/getFetchOptions';

export default async function fetchPackages(input: string, searchUrl: string): Promise<Response> {
    if (!input) {
        // Search canceled.
        throw CANCEL;
    }

    vscode.window.setStatusBarMessage('Searching NuGet...');

    const queryParams = qs.stringify({
        q: input,
        prerelease: 'true',
        take: '100',
        semVerLevel: '2.0.0'
    });

    return await fetch(`${searchUrl}?${queryParams}`, getFetchOptions(getFetchConfig()));
}
