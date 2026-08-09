#!/usr/bin/env node
/**
 * MR.easy CLI — Command Line Interface
 * Usage:
 *   mreasy new <name>    Create a new project
 *   mreasy run           Start live preview server
 *   mreasy build         Compile to HTML
 *   mreasy compile <f>   Compile a single file
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Chalk v4 (CommonJS compatible) ────────────────────────────────────────────
let chalk;
try { chalk = require('chalk'); } catch { chalk = { green: s=>s, red: s=>s, cyan: s=>s, yellow: s=>s, bold: s=>s, gray: s=>s, white: s=>s, magenta: s=>s }; }

const { compile, compileFile } = require('../core/index');
const { startServer }          = require('./server');

// ── Banner ─────────────────────────────────────────────────────────────────────
function banner() {
  console.log('');
  console.log(chalk.cyan('  ███╗   ███╗██████╗        ███████╗ █████╗ ███████╗██╗   ██╗'));
  console.log(chalk.cyan('  ████╗ ████║██╔══██╗       ██╔════╝██╔══██╗██╔════╝╚██╗ ██╔╝'));
  console.log(chalk.cyan('  ██╔████╔██║██████╔╝       █████╗  ███████║███████╗ ╚████╔╝ '));
  console.log(chalk.cyan('  ██║╚██╔╝██║██╔══██╗       ██╔══╝  ██╔══██║╚════██║  ╚██╔╝  '));
  console.log(chalk.cyan('  ██║ ╚═╝ ██║██║  ██║▄█╗   ███████╗██║  ██║███████║   ██║   '));
  console.log(chalk.cyan('  ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝   ╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝  '));
  console.log('');
  console.log(chalk.white('  The simple, beautiful web programming language'));
  console.log(chalk.gray('  v1.0.0  •  by Biruk\n'));
}

// ── Help ───────────────────────────────────────────────────────────────────────
function help() {
  banner();
  console.log(chalk.yellow('  Commands:\n'));
  console.log(chalk.green('  mreasy new <name>') + '    Create a new project');
  console.log(chalk.green('  mreasy run')         + '          Start live preview server');
  console.log(chalk.green('  mreasy build')        + '         Build project to HTML');
  console.log(chalk.green('  mreasy compile <f>')  + '  Compile a single .mreasy file');
  console.log(chalk.green('  mreasy help')         + '         Show this help\n');
  console.log(chalk.gray('  Example:'));
  console.log(chalk.cyan('    mreasy new mywebsite'));
  console.log(chalk.cyan('    cd mywebsite'));
  console.log(chalk.cyan('    mreasy run\n'));
}

// ── New Project ────────────────────────────────────────────────────────────────
function newProject(name) {
  if (!name) { console.log(chalk.red('  ✗ Please provide a project name: mreasy new <name>')); return; }

  const dir = path.join(process.cwd(), name);
  if (fs.existsSync(dir)) { console.log(chalk.red(`  ✗ Folder "${name}" already exists`)); return; }

  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, 'images'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'dist'),   { recursive: true });

  // Create the starter .mreasy file
  const starter = `Mr.easy "${name}"

# 👋 Welcome to your MR.easy website!
# This is your main page. Edit it and watch the live preview update!

nav
  logo "${name}"
  links Home About Contact

hero
  title "Welcome to ${name}" big glow
  subtitle "Built with MR.easy — the simple web language"
  spacer size:20
  row center
    button "Get Started" blue big action:scroll
    button "Learn More" outline

section "about"
  title "About Us" medium
  subtitle "We build amazing things with MR.easy"
  spacer
  grid cols:3
    card shadow
      icon rocket
      title "Fast" small
      text "Build websites in minutes, not hours"
    card shadow
      icon bolt
      title "Simple" small
      text "Anyone can learn MR.easy in one day"
    card shadow
      icon heart
      title "Beautiful" small
      text "Every page looks stunning by default"

section "contact"
  title "Contact Us" medium
  spacer
  form
    label "Your Name" for:name
    input type:text placeholder:"Enter your name" id:name
    label "Your Email" for:email
    input type:email placeholder:"your@email.com" id:email
    button "Send Message" blue

footer
  text "Made with ❤️ using Mr.easy"
`;

  fs.writeFileSync(path.join(dir, 'index.mreasy'), starter);
  fs.writeFileSync(path.join(dir, '.mreasyrc'), JSON.stringify({ name, entry: 'index.mreasy', dist: 'dist' }, null, 2));
  fs.writeFileSync(path.join(dir, 'README.md'), `# ${name}\n\nBuilt with **MR.easy** 🚀\n\n## Run\n\`\`\`\nmreasy run\n\`\`\`\n`);

  console.log('');
  console.log(chalk.green(`  ✓ Created project "${name}" successfully!\n`));
  console.log(chalk.white('  Next steps:'));
  console.log(chalk.cyan(`    cd ${name}`));
  console.log(chalk.cyan('    mreasy run\n'));
}

// ── Build ──────────────────────────────────────────────────────────────────────
function build() {
  const cwd     = process.cwd();
  const rcFile  = path.join(cwd, '.mreasyrc');
  const entry   = fs.existsSync(rcFile)
    ? JSON.parse(fs.readFileSync(rcFile)).entry || 'index.mreasy'
    : 'index.mreasy';
  const distDir = fs.existsSync(rcFile)
    ? JSON.parse(fs.readFileSync(rcFile)).dist || 'dist'
    : 'dist';

  let srcFile = path.join(cwd, entry);
  if (!fs.existsSync(srcFile)) {
    if (fs.existsSync(path.join(cwd, 'examples', 'portfolio.mreasy'))) {
      srcFile = path.join(cwd, 'examples', 'portfolio.mreasy');
    } else if (fs.existsSync(path.join(cwd, 'examples', 'hello-world.mreasy'))) {
      srcFile = path.join(cwd, 'examples', 'hello-world.mreasy');
    } else {
      console.log(chalk.yellow(`  ⚠ File not found: ${entry}. Creating default dist...`));
      return;
    }
  }

  fs.mkdirSync(path.join(cwd, distDir), { recursive: true });

  const { html, errors } = compileFile(srcFile);
  const outFile = path.join(cwd, distDir, 'index.html');
  fs.writeFileSync(outFile, html);

  if (errors.length) {
    errors.forEach(e => console.log(chalk.yellow(`  ⚠ ${e}`)));
  }
  console.log(chalk.green(`  ✓ Built → ${path.relative(cwd, outFile)}`));
}

// ── Compile single file ────────────────────────────────────────────────────────
function compileSingle(file) {
  if (!file) { console.log(chalk.red('  ✗ Please provide a file: mreasy compile <file>')); return; }
  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) { console.log(chalk.red(`  ✗ File not found: ${file}`)); return; }

  const { html, errors } = compileFile(abs);
  const outFile = abs.replace(/\.mreasy$/, '.html');
  fs.writeFileSync(outFile, html);

  if (errors.length) errors.forEach(e => console.log(chalk.yellow(`  ⚠ ${e}`)));
  console.log(chalk.green(`  ✓ Compiled → ${path.relative(process.cwd(), outFile)}`));
}

// ── Main ───────────────────────────────────────────────────────────────────────
const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'new':     banner(); newProject(args[0]);          break;
  case 'run':     banner(); startServer(process.cwd());   break;
  case 'build':   banner(); build();                      break;
  case 'compile': banner(); compileSingle(args[0]);       break;
  case 'help':
  case '--help':
  case '-h':      help();                                  break;
  default:        help();                                  break;
}
