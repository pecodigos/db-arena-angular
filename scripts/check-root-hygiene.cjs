#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const rootEntries = fs.readdirSync(repoRoot, { withFileTypes: true });

const patchOrFixPattern = /^(patch|fix)[-_a-zA-Z0-9]*\.(js|ts|sh|bash|java)$/i;
const updatePattern = /^update[-_a-zA-Z0-9]*\.(js|ts|sh|bash)$/i;

const offenders = rootEntries
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((name) => patchOrFixPattern.test(name) || updatePattern.test(name))
  .sort((a, b) => a.localeCompare(b));

if (offenders.length > 0) {
  console.error('Repository hygiene check failed. Root-level patch/fix/update scripts found:');
  offenders.forEach((name) => console.error(`- ${name}`));
  console.error('Move these files to scripts/migrations/ or scripts/legacy-patches/.');
  process.exit(1);
}

console.log('Repository hygiene check passed. No root-level patch/fix/update scripts found.');
