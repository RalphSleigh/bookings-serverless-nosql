const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')

//(async () => {
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

const entrypoints = walk('src/lambdas')
//.filter(p => p.includes('handler.ts'))
//.filter(p => p.includes('.ts'))
const outDir = `dist-lambda`;
const functionsDir = `src`;

esbuild
    .build({
       entryPoints: entrypoints,
       //entryPoints: ["src/lambdas/env/handler.ts"],
        bundle: true,
        minify: true,
        //splitting: true,
        outdir: path.join(__dirname, outDir),
        outbase: functionsDir,
        outExtension: { '.js': '.mjs' },
        format: 'esm',
        platform: 'node',
        //sourcemap: 'inline',
        target: ['node18'],
        external: ['sequelize', 'aws-sdk','lodash', 'aws-lambda','@aws-sdk/*','dynamodb-onetable', 'react-html-email'],
        metafile: true,
        banner: {
            js: `
            import path from 'path';
            import { fileURLToPath } from 'url';
            import { createRequire as topLevelCreateRequire } from 'module';
            const require = topLevelCreateRequire(import.meta.url);
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            `,
          },
    }).then(build => {

        return esbuild
        .build({
           entryPoints:['src/lambdas/test/handler.ts'
           ],
           //entryPoints: ["src/lambdas/env/handler.ts"],
            bundle: true,
            minify: false,
            //splitting: true,
            outdir: path.join(__dirname, outDir),
            outbase: functionsDir,
            outExtension: { '.js': '.mjs' },
            //format: 'cjs',
            platform: 'node',
            //sourcemap: 'inline',
            target: ['node16'],
            external: ['sequelize','aws-sdk','lodash', 'aws-lambda'],
            metafile: true,
        }).then(build => {
            require('fs').writeFileSync('meta.json',
            JSON.stringify(build.metafile))
        })


    })


//})()