import * as vscode from 'vscode';

import { addNuGetPackage, removeNuGetPackage, updateNuGetPackage, msbuildRestoreNuGetPackage } from './actions';

export function activate(context: vscode.ExtensionContext) {
    const disposableCommands = [
        vscode.commands.registerCommand('extension.addNuGetPackage', addNuGetPackage),
        vscode.commands.registerCommand('extension.updateNuGetPackage', updateNuGetPackage),
        vscode.commands.registerCommand('extension.removeNuGetPackage', removeNuGetPackage),
        vscode.commands.registerCommand('extension.msbuildRestoreNuGetPackage', () => msbuildRestoreNuGetPackage(false)),
        vscode.commands.registerCommand('extension.msbuildRestoreAllNuGetPackage', () => msbuildRestoreNuGetPackage(true))
    ];

    disposableCommands.forEach((disposable) => context.subscriptions.push(disposable));
}
