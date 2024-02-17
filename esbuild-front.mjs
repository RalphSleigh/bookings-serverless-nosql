import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/front/index.tsx'],
  bundle: true,
  minify: true,
  sourcemap: false,
  splitting: true,
  format: 'esm',
  //target: ['chrome58', 'firefox57', 'safari11', 'edge16'],
  outdir: 'public',
  external: ['fs'],
  loader: {
    '.png': 'dataurl',
    '.woff': 'dataurl',
    '.woff2': 'dataurl',
    '.eot': 'dataurl',
    '.ttf': 'dataurl',
    '.svg': 'dataurl',
    '.gif': 'dataurl',
  },
  watch: false,
  define: {
    'BUILDATE': `"${format(new Date(),'LLL do kk:mm')}"`
  },
})