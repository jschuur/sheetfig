import path from 'path';
import fs from 'fs';

import jsonfile from 'jsonfile';

// Find the Google service account credentials to use
export function getCredentials() {
  const { credentialsFile } = global.options;
  let credentials;

  if (credentialsFile) {
    try {
      credentials = jsonfile.readFileSync(credentialsFile);
    } catch ({ message }) {
      spinner.fail(`Couldn't load credentials`);

      throw new Error(`Error loading credentials file (${message})`);
    }
  } else
    credentials = {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    };

  return credentials;
}

// Get a unique list of the groups of values that start with a delimiter
export function getFieldGroups(fields, delimiter) {
  return [
    ...new Set(
      fields.filter((key) => key.indexOf(delimiter) >= 0).map((key) => key.split(delimiter)[0])
    ),
  ];
}

// Turns collections of keys that contain '.' or '_' into objects/arrays
export function flattenNestedData(data, prefix, delimiter) {
  // Create an object from the nested fields
  const obj = Object.keys(data)
    .filter((key) => key.startsWith(`${prefix}${delimiter}`))
    .reduce((acc, field) => {
      const key = field.split(delimiter)[1];
      const value = data[field];

      return value ? { ...acc, [key]: value } : acc;
    }, {});

  if (!Object.keys(obj).length) return null;

  // Turn fields delimited with an underscore into an array
  if (delimiter === '_') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, []);
  } else {
    return obj;
  }
}

export function checkAndCreateDir(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    console.log(`Creating output directory ${path.basename(directoryPath)}`);
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

export const buildSheetURL = (sheetId) => `https://docs.google.com/spreadsheets/d/${sheetId}/view`;
