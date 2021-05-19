const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const esbuild = require('esbuild');
const argv = require('minimist')(process.argv.slice(2));
const prettyBytes = require('pretty-bytes');

const env = argv.dev ? 'dev' : 'prod';
const outfile = 'dist/sheetfig.js';

esbuild
  .build({
    entryPoints: ['src/sheetfig.js'],
    outfile,
    bundle: true,
    platform: 'node',
    target: 'node12',
    sourcemap: env === 'dev',
    watch: env === 'dev',
    minify: env === 'prod',
  })
  .catch((err) => process.exit(1))
  .then(() => {
    if (env === 'prod') {
      // Display build size
      const fileStats = fs.statSync(path.resolve(process.cwd(), outfile));

      console.log(`\t${outfile}: ${chalk.cyan(prettyBytes(fileStats.size))}`);
    }
  });
