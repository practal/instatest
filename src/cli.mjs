#!/usr/bin/env node

// This file cannot be tested, as it contains the test runner itself!

import * as insta from './index.mjs';
import * as cli from './cli_tools.mjs';
import * as gen from './gen_browsertest.mjs';
import * as Path from 'path';

const args = cli.commandLineArguments();

let lockdown = !!process.env.npm_package_config_instatest_lockdown;

const DEFAULT_BROWSER_TEST_DIR = "instatest-browser";
let browserTestDir = undefined;

for (const [n, v] of args.options) {
    switch (n) {
        case "lockdown":
            if (v === null || v === "true") {
                lockdown = true;
            } else if (v === "false") {
                lockdown = false;
            } else throw new Error("Invalid --lockdown option: '" + v + "'.");
            break;
        case "browser":
            if (v === null) browserTestDir = DEFAULT_BROWSER_TEST_DIR; 
            else browserTestDir = String(v);
            break;
        default:
            throw new Error("Invalid option '" + n + "'.");
    }
}

if (lockdown) {
    insta.lockdown();
}

/**
 * @param {string} path
 * @returns {boolean}
 */
function hasJavaScriptSuffix(path) {
    return path.endsWith(".js") || path.endsWith(".mjs");
}

const rootdir = cli.npmPackageRoot();
if (rootdir === undefined) {
    console.error("Cannot determine package root directory.");
    process.exit(1);
}
console.log("Package root directory: " + rootdir);
console.log("Working directory: " + process.cwd());

const currentPackageName = process.env.npm_package_name;
if (!currentPackageName) throw new Error("Cannot determine name of current package.");

let files = [];
for (const p of args.params) {
    const resolved = Path.resolve(process.cwd(), p);
    const jfiles = cli.listAllFilesRecursively(resolved, hasJavaScriptSuffix);
    files.push(...jfiles);
}

if (!browserTestDir) {
    for await (const f of files) {
        console.log("Scheduling tests in '" + f + "' ...");
        let m = await import("file://" + f);
    }
    await insta.runTests(currentPackageName, s => console.log(s));
} else {
    gen.generateBrowserDir(currentPackageName, rootdir, browserTestDir, lockdown, files);
}


