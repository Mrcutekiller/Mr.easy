#!/usr/bin/env node
/**
 * MR.easy CLI — Command Line Interface
 * Usage:
 *   mreasy new <name>      Create a new project
 *   mreasy run [--port N]  Start live preview server
 *   mreasy build [--minify] Build to HTML
 *   mreasy compile <file>  Compile a single file
 *   mreasy validate <file> Validate a .mreasy file
 *   mreasy init            Initialize in current directory
 *   mreasy doctor          Check environment health
 *   mreasy repl            Start interactive REPL
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const readline = require('readline');

let chalk;
try { chalk = require('chalk'); } catch { chalk = { green: s=>s, red: s=>s, cyan: s=>s, yellow: s=>s, bold: s=>s, gray: s=>s, white: s=>s, magenta: s=>s }; }

const { compile, compileFile } = require('../core/index');
const { startServer }          = require('./server');

// ── Parse flags ────────────────────────────────────────────────────────────────
function parseFlags(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) { flags.port = parseInt(args[++i]); }
    else if (args[i] === '--minify') { flags.minify = true; }
    else if (args[i] === '--help' || args[i] === '-h') { flags.help = true; }
    else if (args[i] === '--version' || args[i] === '-v') { flags.version = true; }
    else { positional.push(args[i]); }
  }
  return { flags, positional };
}

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
  console.log(chalk.gray('  v1.1.0  •  by Biruk\n'));
}

// ── Help ───────────────────────────────────────────────────────────────────────
function help() {
  banner();
  console.log(chalk.yellow('  Commands:\n'));
  console.log(chalk.green('  mreasy new <name>') + '       Create a new project');
  console.log(chalk.green('  mreasy run') + '             Start live preview server');
  console.log(chalk.green('  mreasy build') + '            Build project to HTML');
  console.log(chalk.green('  mreasy compile <file>') + '   Compile a single .mreasy file');
  console.log(chalk.green('  mreasy validate <file>') + '  Validate a .mreasy file');
  console.log(chalk.green('  mreasy init') + '             Initialize project in current dir');
  console.log(chalk.green('  mreasy doctor') + '           Check environment health');
  console.log(chalk.green('  mreasy repl') + '             Start interactive REPL');
  console.log(chalk.green('  mreasy help') + '             Show this help\n');
  console.log(chalk.yellow('  Flags:\n'));
  console.log(chalk.green('  --port <N>') + '              Set server port (default: 3000)');
  console.log(chalk.green('  --minify') + '                Minify output HTML\n');
  console.log(chalk.gray('  Example:'));
  console.log(chalk.cyan('    mreasy new mywebsite'));
  console.log(chalk.cyan('    cd mywebsite'));
  console.log(chalk.cyan('    mreasy run --port 8080\n'));
}

// ── Minify HTML ────────────────────────────────────────────────────────────────
function minifyHTML(html) {
  return html
    .replace(/\n\s*/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s*\/>/g, '/>')
    .trim();
}

// ── New Project ────────────────────────────────────────────────────────────────
function newProject(name) {
  if (!name) { console.log(chalk.red('  ✗ Please provide a project name: mreasy new <name>')); return; }

  const dir = path.join(process.cwd(), name);
  if (fs.existsSync(dir)) { console.log(chalk.red(`  ✗ Folder "${name}" already exists`)); return; }

  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, 'images'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'dist'),   { recursive: true });

  const starter = `Mr.easy "${name}"

# Welcome to your MR.easy website!
# Edit index.mreasy and watch the live preview update!

nav
  logo "${name}"
  links Home About Contact

hero
  title "Welcome to ${name}" big glow
  subtitle "Built with MR.easy — the simple web language"
  spacer size:20
  row center
    button "Get Started" blue big
    button "Learn More" outline

section "about"
  title "About" medium
  text "We build amazing things with MR.easy"

footer
  text "Made with MR.easy"
`;

  fs.writeFileSync(path.join(dir, 'index.mreasy'), starter);
  fs.writeFileSync(path.join(dir, '.mreasyrc'), JSON.stringify({ name, entry: 'index.mreasy', dist: 'dist' }, null, 2));
  fs.writeFileSync(path.join(dir, 'README.md'), `# ${name}\n\nBuilt with **MR.easy**\n\n## Run\n\`\`\`\nmreasy run\n\`\`\`\n`);

  console.log('');
  console.log(chalk.green(`  ✓ Created project "${name}" successfully!\n`));
  console.log(chalk.white('  Next steps:'));
  console.log(chalk.cyan(`    cd ${name}`));
  console.log(chalk.cyan('    mreasy run\n'));
}

// ── Init (in current directory) ────────────────────────────────────────────────
function initProject() {
  const cwd = process.cwd();
  const rcFile = path.join(cwd, '.mreasyrc');

  if (fs.existsSync(rcFile)) {
    console.log(chalk.yellow('  ⚠ Project already initialized (.mreasyrc exists)'));
    return;
  }

  const dirName = path.basename(cwd);
  fs.mkdirSync(path.join(cwd, 'images'), { recursive: true });
  fs.mkdirSync(path.join(cwd, 'dist'),   { recursive: true });

  if (!fs.existsSync(path.join(cwd, 'index.mreasy'))) {
    const starter = `Mr.easy "${dirName}"\n\nhero\n  title "Hello World" big glow\n  subtitle "Edit index.mreasy to get started!"\n  button "Click Me" blue big\n`;
    fs.writeFileSync(path.join(cwd, 'index.mreasy'), starter);
  }

  fs.writeFileSync(rcFile, JSON.stringify({ name: dirName, entry: 'index.mreasy', dist: 'dist' }, null, 2));

  console.log(chalk.green('  ✓ Initialized MR.easy project in current directory'));
  console.log(chalk.cyan('    mreasy run') + '  — start live preview\n');
}

// ── Build ──────────────────────────────────────────────────────────────────────
function build(flags) {
  const cwd     = process.cwd();
  const rcFile  = path.join(cwd, '.mreasyrc');
  const rc      = fs.existsSync(rcFile) ? JSON.parse(fs.readFileSync(rcFile)) : {};
  const entry   = rc.entry || 'index.mreasy';
  const distDir = rc.dist  || 'dist';

  let srcFile = path.join(cwd, entry);
  if (!fs.existsSync(srcFile)) {
    console.log(chalk.yellow(`  ⚠ File not found: ${entry}`));
    return;
  }

  fs.mkdirSync(path.join(cwd, distDir), { recursive: true });

  const { html, errors } = compileFile(srcFile);
  const output = flags.minify ? minifyHTML(html) : html;
  const outFile = path.join(cwd, distDir, 'index.html');
  fs.writeFileSync(outFile, output);

  if (errors.length) {
    errors.forEach(e => console.log(chalk.yellow(`  ⚠ ${e}`)));
  }
  const size = Buffer.byteLength(output, 'utf-8');
  const kb = (size / 1024).toFixed(1);
  console.log(chalk.green(`  ✓ Built → ${path.relative(cwd, outFile)} (${kb} KB${flags.minify ? ', minified' : ''})`));
}

// ── Compile single file ────────────────────────────────────────────────────────
function compileSingle(file, flags) {
  if (!file) { console.log(chalk.red('  ✗ Please provide a file: mreasy compile <file>')); return; }
  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) { console.log(chalk.red(`  ✗ File not found: ${file}`)); return; }

  const { html, errors } = compileFile(abs);
  const output = flags.minify ? minifyHTML(html) : html;
  const outFile = abs.replace(/\.mreasy$/, '.html');
  fs.writeFileSync(outFile, output);

  if (errors.length) errors.forEach(e => console.log(chalk.yellow(`  ⚠ ${e}`)));
  console.log(chalk.green(`  ✓ Compiled → ${path.relative(process.cwd(), outFile)}`));
}

// ── Validate ───────────────────────────────────────────────────────────────────
function validate(file) {
  if (!file) { console.log(chalk.red('  ✗ Please provide a file: mreasy validate <file>')); return; }
  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) { console.log(chalk.red(`  ✗ File not found: ${file}`)); return; }

  const source = fs.readFileSync(abs, 'utf-8');
  const { html, errors } = compile(source);

  if (errors.length) {
    console.log(chalk.red(`  ✗ ${errors.length} error(s) found:\n`));
    errors.forEach((e, i) => console.log(chalk.red(`    ${i + 1}. ${e}`)));
    console.log('');
    process.exit(1);
  } else {
    const lines = source.split('\n').length;
    console.log(chalk.green(`  ✓ ${file} is valid!`));
    console.log(chalk.gray(`    ${lines} lines, ${source.length} characters`));
    console.log(chalk.gray(`    ${html.length} characters of HTML output`));
  }
}

// ── Doctor ─────────────────────────────────────────────────────────────────────
function doctor() {
  console.log(chalk.yellow('  Checking environment...\n'));

  // Node.js version
  const nodeVer = process.version;
  const nodeOk = parseInt(nodeVer.slice(1)) >= 14;
  console.log(`  ${nodeOk ? chalk.green('✓') : chalk.red('✗')} Node.js ${nodeVer} ${nodeOk ? '(OK)' : '(requires v14+)'}`);

  // npm version
  try {
    const npmVer = require('child_process').execSync('npm --version', { encoding: 'utf-8' }).trim();
    console.log(`  ${chalk.green('✓')} npm ${npmVer}`);
  } catch {
    console.log(`  ${chalk.yellow('⚠')} npm not found`);
  }

  // Check dependencies
  const pkg = require('../package.json');
  const deps = Object.keys(pkg.dependencies || {});
  let allDepsOk = true;
  for (const dep of deps) {
    try { require.resolve(dep); }
    catch { console.log(`  ${chalk.red('✗')} Missing dependency: ${dep}`); allDepsOk = false; }
  }
  if (allDepsOk) console.log(`  ${chalk.green('✓')} All dependencies installed`);

  // Check .mreasyrc
  const cwd = process.cwd();
  const rcFile = path.join(cwd, '.mreasyrc');
  if (fs.existsSync(rcFile)) {
    try {
      const rc = JSON.parse(fs.readFileSync(rcFile));
      console.log(`  ${chalk.green('✓')} .mreasyrc found (entry: ${rc.entry || 'index.mreasy'})`);
    } catch {
      console.log(`  ${chalk.red('✗')} .mreasyrc is invalid JSON`);
    }
  } else {
    console.log(`  ${chalk.yellow('⚠')} No .mreasyrc (run ${chalk.cyan('mreasy init')} to create one)`);
  }

  // Check for .mreasy files
  const files = fs.readdirSync(cwd).filter(f => f.endsWith('.mreasy'));
  if (files.length) {
    console.log(`  ${chalk.green('✓')} Found ${files.length} .mreasy file(s)`);
  } else {
    console.log(`  ${chalk.yellow('⚠')} No .mreasy files in current directory`);
  }

  console.log('');
}

// ── REPL ───────────────────────────────────────────────────────────────────────
function startREPL() {
  console.log(chalk.cyan('  MR.easy REPL v1.1.0'));
  console.log(chalk.gray('  Type MR.easy code and press Enter. Type "exit" to quit.\n'));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green('mreasy> ')
  });

  let buffer = '';
  let inBlock = false;

  rl.prompt();

  rl.on('line', (line) => {
    const trimmed = line.trim();

    if (trimmed === 'exit' || trimmed === 'quit') {
      console.log(chalk.gray('  Goodbye!'));
      rl.close();
      return;
    }

    if (trimmed === 'clear') {
      buffer = '';
      inBlock = false;
      console.log(chalk.gray('  Buffer cleared'));
      rl.prompt();
      return;
    }

    if (trimmed === 'run' || trimmed === 'exec') {
      if (!buffer.trim()) {
        console.log(chalk.yellow('  ⚠ No code to run. Type MR.easy code first.'));
        rl.prompt();
        return;
      }
      try {
        const { html, errors } = compile(buffer);
        if (errors.length) {
          errors.forEach(e => console.log(chalk.red(`  ✗ ${e}`)));
        } else {
          // Write to temp file and open
          const tmpFile = path.join(require('os').tmpdir(), 'mreasy-repl.html');
          fs.writeFileSync(tmpFile, html);
          console.log(chalk.green(`  ✓ Compiled! Output: ${tmpFile}`));
          // Try to open in browser
          try { require('open')(tmpFile); } catch {}
        }
      } catch (err) {
        console.log(chalk.red(`  ✗ ${err.message}`));
      }
      rl.prompt();
      return;
    }

    if (trimmed === 'show') {
      if (!buffer.trim()) {
        console.log(chalk.yellow('  ⚠ Buffer is empty'));
      } else {
        console.log(chalk.cyan('\n--- Buffer ---'));
        console.log(buffer);
        console.log(chalk.cyan('--- End ---\n'));
      }
      rl.prompt();
      return;
    }

    // If it looks like a block start, buffer it
    const blockKeywords = ['nav', 'hero', 'section', 'header', 'footer', 'card', 'grid', 'row', 'form', 'list', 'tabs'];
    const firstWord = trimmed.split(/\s/)[0];
    if (blockKeywords.includes(firstWord) || inBlock) {
      buffer += line + '\n';
      if (!inBlock) inBlock = true;
      // Simple check: if line is less indented than previous, block might be done
      if (inBlock && trimmed && !trimmed.startsWith(' ') && !trimmed.startsWith('\t') && firstWord !== inBlock) {
        // Might be end of block - try to compile
      }
    } else {
      buffer += line + '\n';
    }

    // Auto-compile single statements
    if (!inBlock || trimmed === '') {
      try {
        const testSource = buffer.trim() ? `Mr.easy "REPL"\n\n${buffer}` : '';
        if (testSource) {
          const { html, errors } = compile(testSource);
          if (!errors.length) {
            // Extract just body content
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch) {
              const bodyContent = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').trim();
              if (bodyContent) {
                console.log(chalk.cyan('  → ') + bodyContent.substring(0, 200));
              }
            }
          }
        }
      } catch {}
      inBlock = false;
    }

    rl.prompt();
  });

  rl.on('close', () => process.exit(0));
}

// ── Main ───────────────────────────────────────────────────────────────────────
const [,, cmd, ...rest] = process.argv;
const { flags, positional } = parseFlags(rest);

if (flags.version) {
  console.log('mreasy v1.1.0');
  process.exit(0);
}

switch (cmd) {
  case 'new':       banner(); newProject(positional[0]);                     break;
  case 'run':       banner(); startServer(process.cwd(), flags.port);        break;
  case 'build':     banner(); build(flags);                                  break;
  case 'compile':   banner(); compileSingle(positional[0], flags);           break;
  case 'validate':  banner(); validate(positional[0]);                       break;
  case 'init':      banner(); initProject();                                 break;
  case 'doctor':    banner(); doctor();                                      break;
  case 'repl':      startREPL();                                             break;
  case 'help':
  case '--help':
  case '-h':        help();                                                  break;
  default:          help();                                                  break;
}
