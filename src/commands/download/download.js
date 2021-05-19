import path from 'path';

import chalk from 'chalk';
import program from 'commander';
import open from 'open';

import { downloadData, filterData, buildJSON, saveJSON } from './lib';
import { buildSheetURL, checkAndCreateDir } from '../../util';

const downloadCmd = program.command('download').description('Download Google Sheet data');

const parseNumber = (n) => parseInt(n);

downloadCmd
  .requiredOption('-s, --sheet-id <string>', 'Google Sheet ID (required)', process.env.SHEET_ID)
  .option('-o, --output-dir <dir>', 'Directory to save assets into', '.')
  .option('-r, --ignore-rows <range>', 'List of rows to ignore')
  .option('-x, --exclude-fields <list>', 'Include all fields except list')
  .option('-i, --include-fields <list>', 'Only include specified list of fields')
  .option(
    '-n, --include-instructions <row>',
    'Row # to use to identify fields to include',
    parseNumber
  )
  .option('--credentials-file <file>', 'Load Google credentials from JSON file')
  .option('--client-email <string>', 'Service account client email')
  .option('-p, --private-key <string>', 'Service account private key')
  .option('-O, --open', 'Open source sheet after export')
  .action(downloadSheets);

async function downloadSheets(options) {
  const { sheetId, outputDir, open: openSheet } = options;

  global.options = options;

  try {
    const configData = await downloadData(sheetId);

    checkAndCreateDir(outputDir);
    console.log(`Outputting to ${path.resolve(outputDir)}`);

    // Loop through each sheet and create a file
    for (let [sheetName, data] of Object.entries(configData)) {
      console.log(`\nSaving ${chalk.cyan(sheetName)}...`);

      saveJSON(sheetName, buildJSON(filterData(data)));
    }

    if (openSheet) await open(buildSheetURL(sheetId));
  } catch ({ message }) {
    console.error(`\n${chalk.red('Error: ')} ${message}`);

    process.exit(1);
  }
}
