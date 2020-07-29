import * as vscode from 'vscode';
import { CANCEL } from '../../constants';

const errorMessage = 'No matching results found. Please try again.';

interface SearchResult {
    id: string,
    versions: any[],
    totalDownloads: string
}

export default async function showPackageQuickPick(json: any): Promise<any> {
    if (!json) {
        throw new Error(errorMessage);
    }

    const data: SearchResult[] = json.data;
    if (!data || data.length < 1) {
        throw new Error(errorMessage);
    }

    let options = data.map(entry => entry.id);
    let selectedId: string = await vscode.window.showQuickPick(options);
    if (!selectedId) {
        throw CANCEL;
    }

    let selection = data.find(entry => entry.id == selectedId);
    return { json: {
        versions: selection.versions.map(info => info.version)
    }, selectedPackageName: selectedId };
}
