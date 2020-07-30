import * as vscode from 'vscode';
import * as path from 'path';
import * as child from 'child_process';
import * as fs from 'fs';
import { CANCEL, RESTORE, slnFileExtensionMatcher } from '../constants';
import { checkProjFilePath, showProjFileQuickPick, showInformationMessage } from "./shared";

interface ExecResult {
    stdout: string,
    stderr: string
}

var nugetOutput: vscode.OutputChannel;
function outputChannel() {
    nugetOutput = nugetOutput ?? vscode.window.createOutputChannel("NuGet");
    return nugetOutput;
}

function execFileAsync(file: string, args?: string[]): Thenable<ExecResult> {
    return new Promise((resolve, reject) => {
        child.execFile(file, args, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            resolve({ stdout, stderr });
        });
    });
}

function existsAsync(path: string | Buffer): Promise<boolean> {
    return new Promise((resolve) => fs.exists(path, resolve));
}

async function locateMSBuild(): Promise<string> {
    if (process.platform !== "win32") {
        return "msbuild";
    }

    // msbuild isn't normally in the path on windows. Use vswhere to locate it.
    // https://github.com/microsoft/vswhere
    const progFiles = process.env["ProgramFiles(x86)"];
    const vswhere = path.join(progFiles, "Microsoft Visual Studio", "Installer", "vswhere.exe");
    if (!await existsAsync(vswhere)) {
        return "msbuild";
    }

    var findMSBuild = ["-latest", "-requires", "Microsoft.Component.MSBuild", "-find", "MSBuild\\**\\Bin\\MSBuild.exe"];
    var { stdout } = await execFileAsync(vswhere, findMSBuild);
    stdout = stdout.trim();
    if (stdout.length > 0) {
        return stdout;
    }

    findMSBuild.push("-preRelease");
    var { stdout } = await execFileAsync(vswhere, findMSBuild);
    stdout = stdout.trim();
    if (stdout.length > 0) {
        return stdout;
    } else {
        return "msbuild";
    }
}

function handleError(wrap: Promise<void>) {
    wrap.then(undefined, (reason) => {
        if (reason !== CANCEL) {
            vscode.window.showErrorMessage(reason.message || reason || "Something went wrong! Please try again.")
        }
    })
}

async function restoreNuGetPackage(fileAsync: Thenable<string>, command: [string], all: boolean) {
    var projects = await checkProjFilePath(vscode.workspace.rootPath);
    if (projects.length > 1 && !all) {
        projects = await showProjFileQuickPick(projects, RESTORE, false);
    }
    command.push("");
    const file = await fileAsync;
    const output = outputChannel();
    output.clear();
    output.show();
    for (const idx in projects) {
        // MSBuild shouldn't be invoked in parallel on projects that might have dependencies on each other.
        command[command.length - 1] = projects[idx];
        output.appendLine("MSBuild " + [command].join(" "));
        let process = child.spawn(file, command, {
            stdio: "pipe"
        });
        process.stdout.on("data", (data) => output.append(data.toString()));
        process.stderr.on("data", (data) => output.append(data.toString()));
        await new Promise((resolve, reject) => process.on("close", (code) => {
            if (code == 0) {
                resolve();
            } else {
                output.appendLine("");
                output.appendLine(`\tError. MSBuild exited with code ${code}.`);
                reject(new Error(`Restore failed ${code}`))
            }
        }));
        output.appendLine("\tMSBuild success");
        output.appendLine("");
    }

    if (projects.length === 1) {
        showInformationMessage(`Success! Restored ${projects[0]}.`);
    } else {
        showInformationMessage(`Success! Restored ${projects.length} projects.`);
    }
}

export async function msbuildRestoreNuGetPackage(all: boolean = false) {
    const impl = async () => {
        const msbuild = locateMSBuild();
        await restoreNuGetPackage(msbuild, ["/target:Restore"], all);
    };
    handleError(impl());
}