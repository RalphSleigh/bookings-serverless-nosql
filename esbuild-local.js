const fs = await import('fs')
const path = await import('path')
const esbuild = await import('esbuild')
const ImportGlobPlugin = await import('esbuild-plugin-import-glob')

var walk = function (dir) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            /* Recurse into a subdirectory */
            results = results.concat(walk(file));
        } else {
            /* Is a file */
            results.push(file);
        }
    });
    return results;
}

const entrypoints = ['src/local-server.ts', ...walk('src/lambdas'), ...walk('src/lambda-common'), ...walk('src/shared')]
//.filter(p => p.includes('handler.ts'))
.filter(p => p.includes('.ts'))
const outDir = `dist-local`;
const functionsDir = `src`;

esbuild
    .build({
        entryPoints: entrypoints,
        bundle: false,
        minify: false,
        //splitting: true,
        outdir: path.join(outDir),
        outbase: functionsDir,
        format: 'esm',
        platform: 'node',
        sourcemap: 'inline',
        target: ['node16'],
        //external: ['pg-hstore','aws-sdk'],
        //plugins: [ImportGlobPlugin.default.default()],
        watch: true,
    })