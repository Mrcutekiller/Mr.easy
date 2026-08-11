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
const { startREPL }            = require('./repl');
const { startTUI }             = require('./tui');
const { startTerminalImagePreview } = require('./image-preview');

// ── Parse flags ────────────────────────────────────────────────────────────────
function parseFlags(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) { flags.port = parseInt(args[++i]); }
    else if (args[i] === '--minify') { flags.minify = true; }
    else if (args[i] === '--tui') { flags.tui = true; }
    else if (args[i] === '--terminal-image') { flags.terminalImage = true; }
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
  console.log(chalk.gray('  v1.2.0  •  by Biruk\n'));
}

// ── Help ───────────────────────────────────────────────────────────────────────
function help() {
  banner();
  console.log(chalk.yellow('  Commands:\n'));
  console.log(chalk.green('  mreasy new <name>') + '       Create a new project');
  console.log(chalk.green('  mreasy run') + '             Start live preview server');
  console.log(chalk.green('  mreasy run --tui') + '       Start live split-pane TUI wireframe preview');
  console.log(chalk.green('  mreasy run --terminal-image') + ' Live image preview (Kitty/iTerm2)');
  console.log(chalk.green('  mreasy build') + '            Build project to HTML');
  console.log(chalk.green('  mreasy compile <file>') + '   Compile a single .mreasy file');
  console.log(chalk.green('  mreasy validate <file>') + '  Validate a .mreasy file');
  console.log(chalk.green('  mreasy deploy [--target vercel|netlify|gh-pages]') + ' Deploy project bundle');
  console.log(chalk.green('  mreasy ai "<prompt>"') + '    Generate .mreasy page from prompt');
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

hero
  title "${name}" big glow
  subtitle "Edit index.mreasy to build your custom website!"
  button "Get Started" blue big
`;

  fs.writeFileSync(path.join(dir, 'index.mreasy'), starter);
  fs.writeFileSync(path.join(dir, '.mreasyrc'), JSON.stringify({ name, entry: 'index.mreasy', dist: 'dist' }, null, 2));
  fs.writeFileSync(path.join(dir, 'README.md'), `# ${name}\n\nBuilt with **MR.easy**\n\n## Run Live Server\n\`\`\`powershell\nmreasy run\n\`\`\`\n\n## Build HTML\n\`\`\`powershell\nmreasy build\n\`\`\`\n`);

  // Generate initial compiled dist/index.html
  try {
    const { html } = compileFile(path.join(dir, 'index.mreasy'));
    fs.writeFileSync(path.join(dir, 'dist', 'index.html'), html);
  } catch {}

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

  const { html, errors, warnings } = compileFile(srcFile);
  const output = flags.minify ? minifyHTML(html) : html;
  const outFile = path.join(cwd, distDir, 'index.html');
  fs.writeFileSync(outFile, output);

  if (errors.length) errors.forEach(e => console.log(chalk.red(`  ✗ ${e}`)));
  if (warnings.length) warnings.forEach(w => console.log(chalk.yellow(`  ⚠ ${w}`)));
  const size = Buffer.byteLength(output, 'utf-8');
  const kb = (size / 1024).toFixed(1);
  console.log(chalk.green(`  ✓ Built → ${path.relative(cwd, outFile)} (${kb} KB${flags.minify ? ', minified' : ''})`));
}

// ── Compile single file ────────────────────────────────────────────────────────
function compileSingle(file, flags) {
  if (!file) { console.log(chalk.red('  ✗ Please provide a file: mreasy compile <file>')); return; }
  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) { console.log(chalk.red(`  ✗ File not found: ${file}`)); return; }

  const { html, errors, warnings } = compileFile(abs);
  const output = flags.minify ? minifyHTML(html) : html;
  const outFile = abs.replace(/\.mreasy$/, '.html');
  fs.writeFileSync(outFile, output);

  if (errors.length) errors.forEach(e => console.log(chalk.red(`  ✗ ${e}`)));
  if (warnings.length) warnings.forEach(w => console.log(chalk.yellow(`  ⚠ ${w}`)));
  console.log(chalk.green(`  ✓ Compiled → ${path.relative(process.cwd(), outFile)}`));
}

// ── Validate ───────────────────────────────────────────────────────────────────
function validate(file) {
  if (!file) { console.log(chalk.red('  ✗ Please provide a file: mreasy validate <file>')); return; }
  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) { console.log(chalk.red(`  ✗ File not found: ${file}`)); return; }

  const source = fs.readFileSync(abs, 'utf-8');
  const { html, errors, warnings } = compile(source);

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
    if (warnings.length) {
      console.log(chalk.yellow(`  ⚠ ${warnings.length} warning(s):`));
      warnings.forEach(w => console.log(chalk.yellow(`    - ${w}`)));
    }
  }
}

// ── Export (ZIP bundle) ───────────────────────────────────────────────────────
function exportProject() {
  const cwd    = process.cwd();
  const rcFile = path.join(cwd, '.mreasyrc');
  const rc     = fs.existsSync(rcFile) ? JSON.parse(fs.readFileSync(rcFile)) : {};
  const entry  = rc.entry || 'index.mreasy';

  const srcFile = path.join(cwd, entry);
  if (!fs.existsSync(srcFile)) {
    console.log(chalk.red(`  ✗ No entry file found: ${entry}`));
    return;
  }

  const { html, errors, warnings } = compileFile(srcFile);
  if (errors.length) {
    errors.forEach(e => console.log(chalk.red(`  ✗ ${e}`)));
    return;
  }

  // Create dist directory with all assets
  const distDir = path.join(cwd, 'dist');
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(path.join(distDir, 'index.html'), html);

  // Copy images if they exist
  const imagesDir = path.join(cwd, 'images');
  if (fs.existsSync(imagesDir)) {
    const imagesDist = path.join(distDir, 'images');
    fs.mkdirSync(imagesDist, { recursive: true });
    fs.readdirSync(imagesDir).forEach(file => {
      const src = path.join(imagesDir, file);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, path.join(imagesDist, file));
      }
    });
  }

  if (warnings.length) warnings.forEach(w => console.log(chalk.yellow(`  ⚠ ${w}`)));
  const size = Buffer.byteLength(html, 'utf-8');
  const kb = (size / 1024).toFixed(1);
  console.log(chalk.green(`  ✓ Exported to dist/ (${kb} KB)`));
  console.log(chalk.gray(`    dist/index.html`));
  if (fs.existsSync(imagesDir)) console.log(chalk.gray(`    dist/images/`));
  console.log(chalk.cyan(`\n  Deploy dist/ to any static host (Netlify, Vercel, GitHub Pages)`));
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
     // ── Build ──────────────────────────────────────────────────────────────────────
function build(flags) {
  const cwd     = process.cwd();
  const rcFile  = path.join(cwd, '.mreasyrc');
  const rc      = fs.existsSync(rcFile) ? JSON.parse(fs.readFileSync(rcFile)) : {};
  const entry   = rc.entry || 'index.mreasy';
  const distDir = rc.dist  || 'dist';
  const target  = flags.target || 'web';
  const lang    = flags.lang || 'en';

  let srcFile = path.join(cwd, entry);
  if (!fs.existsSync(srcFile)) {
    console.log(chalk.yellow(`  ⚠ File not found: ${entry}`));
    return;
  }

  fs.mkdirSync(path.join(cwd, distDir), { recursive: true });
  const source = fs.readFileSync(srcFile, 'utf-8');

  const { output, errors, warnings, costEstimate, health } = compile(source, { target, lang });

  const ext = target === 'whatsapp' || target === 'sms' ? 'txt' : 'html';
  const outFile = path.join(cwd, distDir, `index.${ext}`);
  fs.writeFileSync(outFile, output);

  if (errors.length) errors.forEach(e => console.log(chalk.red(`  ✗ ${e}`)));
  if (warnings.length) warnings.forEach(w => console.log(chalk.yellow(`  ${w}`)));

  const size = Buffer.byteLength(output, 'utf-8');
  const kb = (size / 1024).toFixed(1);
  console.log(chalk.green(`  ✓ Built Target [${target.toUpperCase()}] → ${path.relative(cwd, outFile)} (${kb} KB)`));

  if (costEstimate) {
    console.log(chalk.cyan(`  💰 ${costEstimate.summaryText}`));
  }
  if (health) {
    console.log(chalk.gray(`  ⚡ Est. Load: ${health.loadTimeSec}s | ♿ A11y: ${health.a11yScore}/100 | 💡 ${health.beginnerAdvice}`));
  }
}

// ── Health Monitoring ────────────────────────────────────────────────────────
async function runHealthCheck(url) {
  const { checkWebsiteHealth } = require('./health');
  console.log(chalk.cyan(`  🔍 Monitoring website health for ${url || 'local site'}...`));
  const res = await checkWebsiteHealth(url || 'http://localhost:3000');
  if (res.isOnline) {
    console.log(chalk.green(`  ✓ Website is ONLINE (${res.responseTimeMs}ms response time)`));
    console.log(chalk.green(`  ✓ SSL Status: ${res.sslValid ? 'Valid SSL' : 'HTTP Only'}`));
    if (res.staleNotice) console.log(chalk.yellow(`  ⚠ ${res.staleNotice}`));
  } else {
    console.log(chalk.red(`  ✗ Website OFFLINE or Unreachable: ${res.error || 'HTTP ' + res.statusCode}`));
  }
}

// ── Starter Pack Command ─────────────────────────────────────────────────────
function runStarter(query) {
  const { matchStarterPack } = require('../core/starter-packs');
  const pack = matchStarterPack(query);
  console.log(chalk.green(`  📦 Matched Starter Pack: ${pack.name}`));
  console.log(chalk.gray(`  Category: ${pack.category} — ${pack.description}\n`));
  console.log(chalk.cyan('--- MR.easy Source ---'));
  console.log(pack.source);
}

// ── History Command ──────────────────────────────────────────────────────────
function runHistory() {
  console.log(chalk.cyan('  📜 Time-Travel Page History Snapshot Engine:'));
  console.log(chalk.white('  • Track semantic diffs automatically during compilation.'));
  console.log(chalk.white('  • Visual timeline active in Web IDE (`mreasy run`).'));
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
  case 'export':    banner(); exportProject();                               break;
  case 'init':      banner(); initProject();                                 break;
  case 'doctor':    banner(); doctor();                                      break;
  case 'repl':      startREPL();                                             break;
  case 'health':    banner(); runHealthCheck(positional[0]);                 break;
  case 'starter':   banner(); runStarter(positional.join(' '));              break;
  case 'history':
  case 'changes':   banner(); runHistory();                                  break;
  case 'help':
  case '--help':
  case '-h':        help();                                                  break;
  default:          help();                                                  break;
}
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
  case 'export':    banner(); exportProject();                               break;
  case 'init':      banner(); initProject();                                 break;
  case 'doctor':    banner(); doctor();                                      break;
  case 'repl':      startREPL();                                             break;
  case 'deploy':     banner(); deployProject(positional[0] || 'vercel');       break;
  case 'ai':         banner(); aiGenerator(positional.join(' '));              break;
  case 'help':
  case '--help':
  case '-h':        help();                                                  break;
  default:          help();                                                  break;
}

// ── Deploy Command ────────────────────────────────────────────────────────────
function deployProject(target = 'vercel') {
  console.log(chalk.cyan(`  📦 Building project for 1-click deployment (${target})...`));
  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  const entryFile = path.join(process.cwd(), 'index.mreasy');
  if (fs.existsSync(entryFile)) {
    const { html } = compileFile(entryFile);
    fs.writeFileSync(path.join(distDir, 'index.html'), minifyHTML(html), 'utf-8');
  }

  if (target === 'vercel') {
    const vercelConfig = { version: 2, builds: [{ src: "dist/**", use: "@vercel/static" }] };
    fs.writeFileSync(path.join(process.cwd(), 'vercel.json'), JSON.stringify(vercelConfig, null, 2), 'utf-8');
    console.log(chalk.green(`  ✓ Generated vercel.json configuration`));
    console.log(chalk.cyan(`  🚀 Ready! Run 'npx vercel' or push to GitHub to deploy on Vercel.\n`));
  } else if (target === 'netlify') {
    fs.writeFileSync(path.join(process.cwd(), 'netlify.toml'), '[build]\n  publish = "dist"\n', 'utf-8');
    console.log(chalk.green(`  ✓ Generated netlify.toml configuration`));
    console.log(chalk.cyan(`  🚀 Ready! Run 'npx netlify-cli deploy --prod' to deploy on Netlify.\n`));
  } else {
    console.log(chalk.green(`  ✓ Static site bundle built in ./dist/index.html`));
    console.log(chalk.cyan(`  🚀 Ready for static web hosting!\n`));
  }
}

// ── AI Generator Command ──────────────────────────────────────────────────────
function aiGenerator(promptStr) {
  if (!promptStr || !promptStr.trim()) {
    console.log(chalk.red('  ✗ Please provide a prompt: mreasy ai "a modern coffee shop landing page"'));
    return;
  }

  console.log(chalk.cyan(`  🤖 Generating MR.easy site for: "${promptStr}"...`));
  const p = promptStr.toLowerCase();

  let code = `Mr.easy "${promptStr.charAt(0).toUpperCase() + promptStr.slice(1)}"\n\n`;

  if (p.includes('coffee') || p.includes('restaurant') || p.includes('cafe') || p.includes('food')) {
    code += `nav
  logo "Artisan Cafe"
  links Home Menu Story Contact
  theme-toggle

hero
  title "Craft Coffee & Fresh Pastries" big glow
  subtitle "Handcrafted with passion every single day in Addis Ababa"
  button "View Menu" blue big
  whatsapp-buy phone:"+251911000000" item:"Specialty Coffee Bundle" price:"$15"

section "menu"
  title "Popular Favorites" center
  grid cols:3
    card shadow
      icon coffee
      title "Espresso" small
      text "Rich double shot from Yirgacheffe beans"
    card shadow
      icon heart
      title "Cappuccino" small
      text "Creamy milk foam with dark roast espresso"
    card shadow
      icon star
      title "Croissant" small
      text "Freshly baked butter croissant"

footer
  text "Made with ❤️ using MR.easy"
`;
  } else if (p.includes('portfolio') || p.includes('developer') || p.includes('designer')) {
    code += `nav
  logo "DevPortfolio"
  links About Projects Skills Contact
  theme-toggle

hero
  title "Full-Stack Engineer & Creator" big glow
  subtitle "Building simple, fast, and beautiful web products"
  button "View Work" blue big open-modal:contactModal

section "projects"
  title "Featured Projects" center
  grid cols:2
    card shadow glass
      icon rocket
      title "MR.easy Language" small
      text "The simplest web programming language"
      button "Live Preview" outline toast:"Opening project..."
    card shadow glass
      icon bolt
      title "AI Web Assistant" small
      text "Smart site generator powered by LLMs"
      button "Live Preview" outline toast:"Opening project..."

modal id:contactModal title:"Let's Work Together"
  input type:text placeholder:"Your Name"
  input type:email placeholder:"Your Email"
  button "Send Message" blue

footer
  text "© 2026 Developer Portfolio • Built with MR.easy"
`;
  } else {
    code += `nav
  logo "My App"
  links Features Pricing About Contact
  theme-toggle

hero
  title "Build Websites Faster Than Ever" big glow
  subtitle "The simple web programming language for everyone"
  button "Get Started" blue big open-modal:signupModal

pricing-table
  plan title:"Starter" price:"$0/mo" button:"Get Started"
    item "1 Project"
    item "Community Support"
  plan title:"Pro" price:"$19/mo" badge:"Popular" button:"Go Pro" featured:true
    item "Unlimited Projects"
    item "Custom Domain"
    item "Priority Support"

modal id:signupModal title:"Create Your Account"
  input type:text placeholder:"Full Name"
  input type:email placeholder:"Email Address"
  button "Sign Up Free" green

footer
  text "Made with ❤️ using MR.easy"
`;
  }

  const filename = 'ai-generated.mreasy';
  fs.writeFileSync(path.join(process.cwd(), filename), code, 'utf-8');
  console.log(chalk.green(`  ✓ Created ${filename}!`));
  console.log(chalk.cyan(`  💡 Run 'mreasy run' to preview your new website live!\n`));
}
