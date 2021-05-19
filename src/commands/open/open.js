import chalk from 'chalk';
import program from 'commander';
import open from 'open';

import { buildSheetURL } from '../../util';

const openCmd = program.command('open').description('Open source sheets');

openCmd
  .requiredOption('-s, --sheet-id <string>', 'Google Sheet ID (required)', process.env.SHEET_ID)
  .option('-o, --output-dir <dir>', 'Directory to save assets into', '.')
  .option('-l, --credentials-file <file>', 'Load Google credentials from JSON file')
  .option('-c, --client-email <string>', 'Service account client email')
  .option('-p, --private-key <string>', 'Service account private key')
  .action(openSheets);

async function openSheets(options) {
  const { sheetId } = options;

  if (sheetId) await open(buildSheetURL(sheetId));
  else console.error(`${chalk.red('Error: ')} Could not determine sheet ID to open`);
}
