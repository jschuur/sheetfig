import fs from 'fs';

import path from 'path';

import chalk from 'chalk';
import jsonfile from 'jsonfile';
import ora from 'ora';
import rangeParser from 'parse-numeric-range';
import pluralize from 'pluralize';
import prettyBytes from 'pretty-bytes';
import { extractSheets } from 'spreadsheet-to-json';

import { getCredentials, getFieldGroups, flattenNestedData, buildSheetURL } from '../../util';

// Converts incoming Google Sheet cells into the corresponding type
const parseCellValue = (value) => {
  // Catches checkboxes
  if (value === 'TRUE' || value === 'FALSE') return value === 'TRUE';

  // Parse numbers
  if (!isNaN(value)) return Number(value);

  return value;
};

// Download the Google Sheet data
export async function downloadData(sheetId) {
  const credentials = getCredentials();

  if (!sheetId) throw Error(`No sheet ID provided`);

  console.log(`📄 Using ${buildSheetURL(sheetId)}`);

  const spinner = ora('Downloading sheet data').start();

  try {
    const sheets = await extractSheets({
      spreadsheetKey: sheetId,
      credentials,
      formatCell: parseCellValue,
    });

    spinner.succeed('Sheet data downloaded');
    console.log(`\nFound ${pluralize('worksheet', Object.keys(sheets).length, true)}`);

    return sheets;
  } catch ({ message }) {
    spinner.fail(`Couldn't download sheet data`);

    throw new Error(`Unable to get data (${message})`);
  }
}

// Reduce dataset based on rules
export function filterData(data) {
  let { excludeFields, includeFields, includeInstructions, ignoreRows } = global.options;
  let includeFieldsList;
  let ignoreRowsList = ignoreRows ? rangeParser(ignoreRows) : [];

  if (includeInstructions) {
    if (isNaN(parseInt(includeInstructions)))
      throw Error(`Invalid includeInstructions row parameter: ${includeInstructions}`);

    const includeInstructionsRow = data[includeInstructions - 2];
    includeFieldsList = Object.keys(includeInstructionsRow).filter(
      (key) => includeInstructionsRow[key]
    );

    // Ignore this row too later
    ignoreRowsList.push(includeInstructions);
  } else if (includeFields) includeFieldsList = includeFields.split(',');

  if (includeFieldsList?.length) {
    console.log(`Only exporting ${includeFieldsList.join(',')}`);

    for (let row of data)
      for (field of Object.keys(row)) if (!includeFieldsList.includes(field)) delete row[field];
  } else if (excludeFields) {
    console.log(`Skipping ${excludeFields}`);

    for (let row of data) excludeFields.split(',').forEach((field) => delete row[field]);
  }

  if (ignoreRowsList?.length) return data.filter((row, i) => !ignoreRowsList.includes(i + 2));

  return data;
}

// Create the output JSON object from a worksheet
export function buildJSON(data) {
  const headers = Object.keys(data[0]);

  // Get collections of different field types to process
  const fields = headers.filter((field) => !RegExp(/[._]/).test(field));
  const arrays = getFieldGroups(headers, '_');
  const objects = getFieldGroups(headers, '.');

  // Process each row
  return data
    .map((row) => {
      // TODO: Skip blank entries that made it through

      // Start out with all the values that aren't arrays (field_0) or objects (field.key)
      var entry = fields.reduce((acc, field) => {
        const value = row[field];

        return value ? { ...acc, [field]: value } : acc;
      }, {});

      // Now build the arrays
      for (let array of arrays) {
        let value = flattenNestedData(row, array, '_');
        if (value) entry[array] = value;
      }

      // Finally build the objects
      for (let obj of objects) {
        let value = flattenNestedData(row, obj, '.');
        if (value) entry[obj] = value;
      }

      return entry;
    })
    .filter((entry) => entry);
}

// Save a JSON object to a file
export function saveJSON(filename, data) {
  const { outputDir } = global.options;

  if (!filename.endsWith('.json')) filename = filename + '.json';

  outputFilename = path.join(process.cwd(), outputDir, filename);

  jsonfile.writeFileSync(outputFilename, data, { spaces: 2 });
  const fileStats = fs.statSync(outputFilename);

  console.log(
    `${chalk.yellow(pluralize('row', data.length, true))} written (${prettyBytes(
      fileStats.size
    )}).\n`
  );
}
