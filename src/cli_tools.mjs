import * as fs from 'fs';
import * as Path from 'path';
import * as insta from './index.mjs';

insta.beginUnit("instatest", "cli_tools");

/** @returns {string | undefined} The directory of the current package from which the script is run. */
export function npmPackageRoot() {
    try {
        return process.env.npm_config_local_prefix;
    } catch {
        return undefined;
    }
}

/** 
 * Detects arguments of the form --XXX and --XXX=YYY and separates them from the other parameters as options.
 * @param {string[]} args - An array of command line parameters.
 * @returns {{params: string[], options: [string, string | null][]}}  
 */
export function parseCommandLineArguments(args) {
    let params = [];
    /** @type {[string, string | null][]}} */
    let options = [];
    for (const arg of args) {
        if (arg.startsWith("--")) {
            const i = arg.indexOf("=");
            if (i < 0) {
                options.push([arg.slice(2), null]);
            } else {
                options.push([arg.slice(2, i), arg.slice(i+1)]);
            }
        } else {
            params.push(arg);
        }
    }
    return {params: params, options: options}
}

insta.test ("parseCommandLineArguments", () => {
    insta.assertEq(
        parseCommandLineArguments(["src", "--browser", "index.js", "tests", "--lockdown=true"]), 
        {params: ["src", "index.js", "tests"], options: [["browser", null], ["lockdown", "true"]]});
});

/** 
 * Returns the parameters and options that the script has been called with.
 * @returns {{params: string[], options: [string, string | null][]}} 
 */
export function commandLineArguments() {
    return parseCommandLineArguments(process.argv.slice(2));
}

/**
 * Lists the paths of all files in path. 
 * @param {string} path - The path of a file or directory.
 * @param {(filename : string) => boolean} pred - A predicate which decides whether to include a filename in the result or not.
 * @returns {string[]}
 */
export function listAllFilesRecursively(path, pred) {
    /**
     * @param {string} path
     * @returns {string[]}
     */
    function recurse(path) {   
        const stats = fs.lstatSync(path);
        if (stats.isDirectory()) {
            const files = fs.readdirSync(path);
            let jfiles = [];
            for (const f of files) {
                const fp = Path.join(path, f);
                jfiles.push(...recurse(fp));
            }
            return jfiles;
        } else if (stats.isFile() && pred(path)) {
            return [path];
        } else {
            return [];
        }
    }
    return recurse(path);
}

insta.endUnit("instatest", "cli_tools");
