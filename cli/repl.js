/**
 * MR.easy Terminal REPL — Read-Eval-Print Loop
 * Interactive shell for MR.easy development.
 */

'use strict';

const readline = require('readline');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');
const { exec } = require('child_process');
const { compile } = require('../core/index');

let chalk;
try { chalk = require('chalk'); } catch { chalk = { green: s=>s, red: s=>s, cyan: s=>s, yellow: s=>s, bold: s=>s, gray: s=>s, white: s=>s, magenta: s=>s }; }

function startREPL() {
  console.log('');
  console.log(chalk.cyan('  MR.easy Interactive REPL v1.2'));
  console.log(chalk.gray('  Type your MR.easy code line by line. Press Enter twice (blank line) or Ctrl+D to compile.\n'));

  let sessionBuffer = '';
  let sessionVars = {};

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green('mreasy> ')
  });

  rl.prompt();

  let lineCount = 0;

  rl.on('line', (line) => {
    if (line.trim() === '') {
      if (sessionBuffer.trim() === '') {
        rl.prompt();
        return;
      }
      // Trigger compile
      evaluateREPL(sessionBuffer, sessionVars, rl, (newVars) => {
        sessionVars = newVars;
        sessionBuffer = '';
      });
      return;
    }

    sessionBuffer += line + '\n';
    lineCount++;
    rl.setPrompt(chalk.gray(`  ... ${lineCount} > `));
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\n' + chalk.yellow('Goodbye! 👋'));
    process.exit(0);
  });
}

function evaluateREPL(source, sessionVars, mainRl, callback) {
  // Prepend Mr.easy header if missing
  const fullSource = source.trim().startsWith('Mr.easy')
    ? source
    : `Mr.easy "REPL Session"\n\n${source}`;

  const { html, errors, warnings, diagnostics } = compile(fullSource);

  if (errors.length) {
    console.log('\n' + chalk.red('❌ Compilation Errors:'));
    errors.forEach(err => console.log(chalk.red(err)));
    console.log('');
    mainRl.setPrompt(chalk.green('mreasy> '));
    mainRl.prompt();
    callback(sessionVars);
    return;
  }

  const htmlLines = html.split('\n').length;
  console.log('\n' + chalk.green(`✓ Compiled → ${htmlLines} lines of HTML`));

  // Render readable structural text summary (AST outline)
  console.log(chalk.cyan('\n  Structure Overview:'));
  printStructureSummary(source);

  console.log('');
  const actionRl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  actionRl.question(
    chalk.yellow('  Action: [o]pen in browser | [c]opy HTML | [s]ave to file | [e]dit/continue > '),
    (ans) => {
      actionRl.close();
      const choice = ans.trim().toLowerCase();

      if (choice === 'o' || choice === 'open') {
        const tmpPath = path.join(os.tmpdir(), `mreasy_repl_${Date.now()}.html`);
        fs.writeFileSync(tmpPath, html, 'utf-8');
        console.log(chalk.green(`  🚀 Opened in browser: ${tmpPath}`));
        openInBrowser(tmpPath);
      } else if (choice === 'c' || choice === 'copy') {
        copyToClipboard(html);
      } else if (choice === 's' || choice === 'save') {
        const savePath = path.join(process.cwd(), 'repl-output.html');
        fs.writeFileSync(savePath, html, 'utf-8');
        console.log(chalk.green(`  💾 Saved to: ${savePath}`));
      }

      mainRl.setPrompt(chalk.green('mreasy> '));
      mainRl.prompt();
      callback(sessionVars);
    }
  );
}

function printStructureSummary(source) {
  const lines = source.split('\n');
  lines.forEach(l => {
    const trimmed = l.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const indentLevel = l.match(/^(\s*)/)[1].length / 2;
    const indentStr = ' '.repeat(indentLevel * 2);
    console.log(chalk.gray(`   ${indentStr}• `) + chalk.white(trimmed));
  });
}

function openInBrowser(filePath) {
  const start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
  exec(`${start} "" "${filePath}"`);
}

function copyToClipboard(text) {
  const proc = exec(process.platform === 'win32' ? 'clip' : process.platform === 'darwin' ? 'pbcopy' : 'xclip -selection clipboard');
  proc.stdin.write(text);
  proc.stdin.end();
  console.log(chalk.green('  📋 HTML copied to clipboard!'));
}

module.exports = { startREPL };
