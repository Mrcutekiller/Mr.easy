/**
 * MR.easy — Main entry point
 * Chains: source → Lexer → Parser → Compiler → HTML
 */

const { Lexer }    = require('./lexer');
const { Parser }   = require('./parser');
const { Compiler } = require('./compiler');

/**
 * Compile MR.easy source code to HTML.
 * @param {string} source  - Raw .mreasy file content
 * @returns {{ html: string, errors: string[], warnings: string[] }}
 */
function compile(source) {
  try {
    // 1. Tokenize
    const lexer  = new Lexer(source);
    const tokens = lexer.tokenize();

    // 2. Parse
    const parser         = new Parser(tokens);
    const { ast, errors } = parser.parse();

    // 3. Compile
    const compiler = new Compiler();
    const { html, warnings } = compiler.compile(ast);

    return { html, errors, warnings: warnings || [] };
  } catch (err) {
    return {
      html: buildErrorPage(err.message),
      errors: [err.message],
      warnings: []
    };
  }
}

/**
 * Compile a .mreasy file to HTML.
 * @param {string} filePath
 * @returns {{ html: string, errors: string[] }}
 */
function compileFile(filePath) {
  const fs     = require('fs');
  const source = fs.readFileSync(filePath, 'utf-8');
  return compile(source);
}

/** Build a beautiful error page */
function buildErrorPage(message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MR.easy Error</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body { background:#0f172a; color:#e2e8f0; font-family:'Inter',sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:20px; }
    .error-box { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:16px; padding:40px; max-width:640px; width:100%; }
    .error-icon { font-size:3rem; margin-bottom:16px; }
    h1 { color:#ef4444; font-size:1.5rem; margin-bottom:12px; }
    pre { background:#1e293b; padding:20px; border-radius:8px; overflow:auto; font-size:0.9rem; color:#94a3b8; white-space:pre-wrap; }
    .tip { margin-top:24px; padding:16px; background:rgba(99,102,241,0.1); border-left:3px solid #6366f1; border-radius:0 8px 8px 0; color:#a5b4fc; font-size:0.9rem; }
  </style>
</head>
<body>
  <div class="error-box">
    <div class="error-icon">💥</div>
    <h1>MR.easy Error</h1>
    <pre>${message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
    <div class="tip">
      💡 <strong>Tip:</strong> Every MR.easy file must start with:<br>
      <code style="color:#818cf8">Mr.easy "Your Page Title"</code>
    </div>
  </div>
</body>
</html>`;
}

module.exports = { compile, compileFile };
