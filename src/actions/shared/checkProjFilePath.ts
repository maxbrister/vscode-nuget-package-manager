import * as vscode from 'vscode';

import { handleError } from '../../utils';
import { getProjFileRecursive } from './';

export default function checkProjFilePath(startPath: string, includeSln: boolean = false): Promise<string[]> {
    return getProjFileRecursive(startPath, includeSln)
        .then<Array<string>>((foundProjFile?: Array<string>) => {
            if (foundProjFile.length < 1) {
                throw new Error('Cannot find any .csproj or .fsproj file for your project! Please fix this error and try again.');
            }

            return foundProjFile;
        });
}
