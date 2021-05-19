#!/usr/bin/env node

import program from 'commander';
import 'dotenv/config';

program.version(require('../package.json').version);

// Load the individual commands
import 'commands/download/download.js';
import 'commands/open/open.js';

program.parse();
