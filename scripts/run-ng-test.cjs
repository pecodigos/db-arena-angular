#!/usr/bin/env node

const { spawn } = require('node:child_process');

function resolveChromeBin() {
  if (process.env.CHROME_BIN) {
    return process.env.CHROME_BIN;
  }

  try {
    const puppeteer = require('puppeteer');
    return puppeteer.executablePath();
  } catch (error) {
    return undefined;
  }
}

const chromeBin = resolveChromeBin();
if (chromeBin) {
  process.env.CHROME_BIN = chromeBin;
}

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['ng', 'test', ...process.argv.slice(2)];

const child = spawn(command, args, {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
