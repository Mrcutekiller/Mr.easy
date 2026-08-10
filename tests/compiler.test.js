/**
 * MR.easy Compiler Test Suite
 * Run: node tests/compiler.test.js
 */

const { compile } = require('../core/index');

let passed = 0;
let failed = 0;
let total  = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    passed++;
  } catch (err) {
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

function eq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || 'Expected'}: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)}`);
  }
}

function includes(haystack, needle, msg) {
  if (!haystack.includes(needle)) {
    throw new Error(`${msg || 'Expected string to contain'} "${needle}"`);
  }
}

function notIncludes(haystack, needle, msg) {
  if (haystack.includes(needle)) {
    throw new Error(`${msg || 'Expected string NOT to contain'} "${needle}"`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// LEXER TESTS
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n\x1b[1m Lexer Tests\x1b[0m');

const { Lexer, TOKEN_TYPES } = require('../core/lexer');

test('Lexer: tokenizes basic keywords', () => {
  const tokens = new Lexer('Mr.easy "Test"\nhero\ntitle "Hello"\n').tokenize();
  const types = tokens.map(t => t.type);
  eq(types[0], TOKEN_TYPES.MREASY, 'First token is MREASY');
});

test('Lexer: tokenizes property:value pairs', () => {
  const tokens = new Lexer('Mr.easy "Test"\ngrid cols:3\n').tokenize();
  const prop = tokens.find(t => t.type === TOKEN_TYPES.PROPERTY);
  eq(prop.value.key, 'cols');
  eq(prop.value.value, '3');
});

test('Lexer: handles property:value with space after colon', () => {
  const tokens = new Lexer('Mr.easy "Test"\npage theme: light\n').tokenize();
  const prop = tokens.find(t => t.type === TOKEN_TYPES.PROPERTY);
  eq(prop.value.key, 'theme');
  eq(prop.value.value, 'light');
});

test('Lexer: throws on missing Mr.easy declaration', () => {
  try {
    new Lexer('hero\ntitle "Hello"').tokenize();
    throw new Error('Should have thrown');
  } catch (err) {
    includes(err.message, 'Mr.easy');
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PARSER TESTS
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n\x1b[1m Parser Tests\x1b[0m');

const { Parser } = require('../core/parser');

test('Parser: parses basic program', () => {
  const tokens = new Lexer('Mr.easy "My Page"\nhero\n  title "Hi"\n').tokenize();
  const parser = new Parser(tokens);
  const { ast } = parser.parse();
  eq(ast.title, 'My Page');
  eq(ast.body.length, 1);
  eq(ast.body[0].type, 'hero');
});

test('Parser: parses set statement', () => {
  const tokens = new Lexer('Mr.easy "T"\nset x = 5\n').tokenize();
  const parser = new Parser(tokens);
  const { ast } = parser.parse();
  eq(ast.body[0].type, 'set');
  eq(ast.body[0].props.name, 'x');
  eq(ast.body[0].props.value, 5);
});

test('Parser: parses repeat block', () => {
  const tokens = new Lexer('Mr.easy "T"\nrepeat 3 times\n  text "hi"\n').tokenize();
  const parser = new Parser(tokens);
  const { ast } = parser.parse();
  eq(ast.body[0].type, 'repeat');
  eq(ast.body[0].props.count, 3);
  eq(ast.body[0].children.length, 1);
});

test('Parser: parses if/else/end', () => {
  const tokens = new Lexer('Mr.easy "T"\nif on\n  text "yes"\nelse\n  text "no"\nend\n').tokenize();
  const parser = new Parser(tokens);
  const { ast } = parser.parse();
  eq(ast.body[0].type, 'if');
  eq(ast.body[0].children.length, 1);
  eq(ast.body[0].elseChildren.length, 1);
});

test('Parser: parses for loop', () => {
  const tokens = new Lexer('Mr.easy "T"\nfor i = 1 to 5\n  text "item"\nend\n').tokenize();
  const parser = new Parser(tokens);
  const { ast } = parser.parse();
  eq(ast.body[0].type, 'for');
  eq(ast.body[0].props.varName, 'i');
  eq(ast.body[0].props.isTo, true);
});

test('Parser: parses array literal', () => {
  const tokens = new Lexer('Mr.easy "T"\nset list = [1, 2, 3]\n').tokenize();
  const parser = new Parser(tokens);
  const { ast } = parser.parse();
  eq(ast.body[0].type, 'set');
  eq(Array.isArray(ast.body[0].props.value), true);
  eq(ast.body[0].props.value.length, 3);
});

// ══════════════════════════════════════════════════════════════════════════════
// COMPILER TESTS
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n\x1b[1m Compiler Tests\x1b[0m');

test('Compiler: basic title/text', () => {
  const { html } = compile('Mr.easy "Test"\ntitle "Hello" big\ntext "World"');
  includes(html, 'Hello');
  includes(html, 'World');
  includes(html, '<!DOCTYPE html>');
});

test('Compiler: no errors on valid input', () => {
  const { errors } = compile('Mr.easy "Test"\nhero\n  title "Hi"\n');
  eq(errors.length, 0);
});

test('Compiler: set + repeat variable', () => {
  const { html } = compile('Mr.easy "Test"\nset count = 5\nrepeat count times\n  text "hello"');
  const matches = html.match(/hello/g);
  eq(matches.length, 5, 'Should have 5 hello matches');
});

test('Compiler: set arithmetic', () => {
  const { html } = compile('Mr.easy "Test"\nset x = 3\nset y = 5\nset z = x + y\ntext "{z}"');
  includes(html, '8');
});

test('Compiler: variable interpolation', () => {
  const { html } = compile('Mr.easy "Test"\nset name = "MR"\ntitle "Hello {name}"');
  includes(html, 'Hello MR');
});

test('Compiler: for loop compile-time unroll', () => {
  const { html } = compile('Mr.easy "Test"\nfor i = 1 to 3\n  text "{i}"\nend');
  includes(html, '>1<');
  includes(html, '>2<');
  includes(html, '>3<');
});

test('Compiler: if/else truthy', () => {
  const { html } = compile('Mr.easy "Test"\nset flag = on\nif flag\n  text "yes"\nelse\n  text "no"\nend');
  includes(html, 'yes');
  notIncludes(html, '>no<');
});

test('Compiler: if/else falsy', () => {
  const { html } = compile('Mr.easy "Test"\nset flag = off\nif flag\n  text "yes"\nelse\n  text "no"\nend');
  includes(html, '>no<');
  notIncludes(html, '>yes<');
});

test('Compiler: define/use component', () => {
  const { html } = compile('Mr.easy "Test"\ndefine MyBtn\n  button "Click" blue\nuse MyBtn');
  includes(html, 'mr-button');
  includes(html, 'Click');
});

test('Compiler: head/meta SEO', () => {
  const { html } = compile('Mr.easy "Test"\nhead\n  meta description:"My page"\n  meta keywords:"test"');
  includes(html, 'name="description"');
  includes(html, 'name="keywords"');
  // Meta tags should be in <head>, not <body>
  const headEnd = html.indexOf('</head>');
  const metaDesc = html.indexOf('name="description"');
  if (metaDesc > headEnd) throw new Error('Meta tag not in head section');
});

test('Compiler: page theme', () => {
  const { html } = compile('Mr.easy "Test"\npage theme:dark primary:blue');
  includes(html, '--mr-primary');
});

test('Compiler: array set', () => {
  const { html } = compile('Mr.easy "Test"\nset list = [1, 2, 3]\nrepeat list\n  text "{item}"');
  includes(html, '1');
  includes(html, '2');
  includes(html, '3');
});

test('Compiler: while loop emits script', () => {
  const { html } = compile('Mr.easy "Test"\nset x = 0\nwhile x < 3\n  text "item"\nend');
  includes(html, 'while');
  includes(html, '1000');
});

test('Compiler: while loop warning', () => {
  const { warnings } = compile('Mr.easy "Test"\nwhile on\n  text "x"\nend');
  const hasWhileWarning = warnings.some(w => w.includes('while'));
  eq(hasWhileWarning, true, 'Should warn about while loop');
});

test('Compiler: warnings array returned', () => {
  const { warnings } = compile('Mr.easy "Test"\ntext "hello"');
  eq(Array.isArray(warnings), true);
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n\x1b[1m Integration Tests\x1b[0m');

test('Integration: full website', () => {
  const source = `Mr.easy "My Website"

nav
  logo "MySite"
  links Home About

hero
  title "Welcome" big glow
  subtitle "Hello World"
  button "Get Started" blue big

section "about"
  title "About Us" medium
  text "We are amazing"

footer
  text "Made with MR.easy"`;
  const { html, errors } = compile(source);
  eq(errors.length, 0);
  includes(html, 'mr-nav');
  includes(html, 'mr-hero');
  includes(html, 'mr-section');
  includes(html, 'mr-footer');
  includes(html, 'mr-glow');
});

test('Integration: complex logic', () => {
  const source = `Mr.easy "Logic Test"

set count = 10
set name = "MR"
set items = [1, 2, 3]

title "Hello {name}" big

repeat count times
  text "Item {index}"

for i = 1 to 3
  text "For {i}"
end

if on
  text "Condition true"
else
  text "Condition false"
end`;
  const { html, errors } = compile(source);
  eq(errors.length, 0);
  includes(html, 'Hello MR');
  // repeat 10 times
  const itemMatches = html.match(/Item \d+/g);
  if (!itemMatches || itemMatches.length !== 10) throw new Error(`Expected 10 items, got ${itemMatches ? itemMatches.length : 0}`);
  includes(html, 'For 1');
  includes(html, 'For 2');
  includes(html, 'For 3');
  includes(html, 'Condition true');
});

// ══════════════════════════════════════════════════════════════════════════════
// RESULTS
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n\x1b[1m═══════════════════════════════════════\x1b[0m');
console.log(`  Passed: \x1b[32m${passed}\x1b[0m`);
console.log(`  Failed: \x1b[31m${failed}\x1b[0m`);
console.log(`  Total:  ${total}`);
console.log('');
if (failed === 0) {
  console.log('  \x1b[32m✅ All tests passed!\x1b[0m');
} else {
  console.log('  \x1b[31m❌ Some tests failed\x1b[0m');
  process.exit(1);
}
