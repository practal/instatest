import * as fs from 'fs';
import * as Path from 'path';

/**
 * @param {string} dir
 */
function webpackConfig(dir) { 
    const index_js = Path.resolve(dir, "index.js");
    return `export default {
mode: 'development',
entry: '${index_js}',
output: {
    path: '${dir}',
    filename: 'index.bundled.js',
}
};
`;
}

/**
 * @param {string} packageName
 */
function indexHTML(packageName) {
    return `<!DOCTYPE html>
<html lang="en-US">
 
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${packageName}</title>
</head>
 
<body>
<script src="./index.bundled.js"></script>

<h1>instatest <em>${packageName}</em></h1>
<pre id="weblog">
</pre>


</body>
 
</html>
`;
}

/**
 * @param {string} packageName
 * @param {boolean} lockdown
 * @param {string[]} files
 */
function indexJS(packageName, lockdown, files) {
    let js = `import * as insta from "instatest";\n`;
    if (lockdown) js += "insta.lockdown();\n";
    for (const f of files) {
        js += `import "${f}";\n`;
    }
    js += `
window.addEventListener('DOMContentLoaded', (event) => {
    function log(s) { document.getElementById('weblog').textContent += s + "\\n"; }\n
    insta.runTests("${packageName}", log);
});`
    return js;
}

/**
 * @param {string} packageName
 * @param {string} packageRootDir
 * @param {string} browserTestDir
 * @param {boolean} lockdown
 * @param {string[]} files
 */
export function generateBrowserDir(packageName, packageRootDir, browserTestDir, lockdown, files) {
    const dir = Path.resolve(packageRootDir, browserTestDir);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: false});
    }
    if (!fs.lstatSync(dir).isDirectory) throw new Error("Target for browser test is not a directory: " + dir);
    /**
     * @param {string} name
     * @param {string} content
     */
    function writeFile(name, content) {
        const p = Path.resolve(dir, name);
        fs.writeFileSync(p, content);
    }
    writeFile("webpack.config.js", webpackConfig(dir));
    writeFile("index.html", indexHTML(packageName));
    writeFile("index.js", indexJS(packageName, lockdown, files));
    console.log("Generated browser test directory at " + dir);
} 



