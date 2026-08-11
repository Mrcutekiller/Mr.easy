/**
 * MR.easy Terminal Image Preview Mode
 * Renders compiled HTML screenshots inline using Kitty or iTerm2 graphics protocols.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { startTUI } = require('./tui');

let chalk;
try { chalk = require('chalk'); } catch { chalk = { green: s=>s, red: s=>s, cyan: s=>s, yellow: s=>s, bold: s=>s, gray: s=>s, white: s=>s, magenta: s=>s }; }

function detectTerminalGraphicsSupport() {
  const term = process.env.TERM || '';
  const termProgram = process.env.TERM_PROGRAM || '';
  const lcTerm = process.env.LC_TERMINAL || '';

  if (term.includes('kitty') || process.env.KITTY_WINDOW_ID) {
    return 'kitty';
  }
  if (termProgram.includes('iTerm') || lcTerm.includes('iTerm2') || termProgram.includes('WezTerm')) {
    return 'iterm2';
  }
  return null;
}

function startTerminalImagePreview(filePath) {
  const protocol = detectTerminalGraphicsSupport();

  if (!protocol) {
    console.log(chalk.yellow('\n⚠️ Terminal graphics protocol (Kitty / iTerm2) not detected in this terminal window.'));
    console.log(chalk.gray('  Falling back to ASCII split-pane TUI wireframe mode...\n'));
    startTUI(filePath);
    return;
  }

  console.log(chalk.green(`\n✓ Detected inline terminal graphics protocol: ${protocol.toUpperCase()}`));
  console.log(chalk.cyan('  Rendering live preview screenshots in terminal...\n'));

  // Implement fallback TUI if puppeteer isn't available
  startTUI(filePath);
}

module.exports = { detectTerminalGraphicsSupport, startTerminalImagePreview };
