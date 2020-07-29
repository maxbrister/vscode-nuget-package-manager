import * as vscode from 'vscode';

import { addNuGetPackage, removeNuGetPackage, updateNuGetPackage } from './actions';

export function activate(context: vscode.ExtensionContext) {
    const disposableCommands = [
        vscode.commands.registerCommand('extension.addNuGetPackage', addNuGetPackage),
        vscode.commands.registerCommand('extension.updateNuGetPackage', updateNuGetPackage),
        vscode.commands.registerCommand('extension.removeNuGetPackage', removeNuGetPackage)
    ];

    disposableCommands.forEach((disposable) => context.subscriptions.push(disposable));
}
