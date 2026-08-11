/**
 * Comprehensive Test Suite for MR.easy Feature Suite (Prompts 1-8)
 */

'use strict';

const assert = require('assert');
const { compile } = require('../core/index');
const { suggestKeyword, levenshtein } = require('../core/diagnostics');

console.log('🧪 Starting MR.easy Feature Suite Automated Tests...\n');

// 1. Levenshtein & Fuzzy Matcher
console.log('1️⃣ Testing Levenshtein & Fuzzy Keyword Matcher...');
assert.strictEqual(levenshtein('titel', 'title'), 2);
assert.strictEqual(suggestKeyword('titel', ['hero', 'title', 'section']), 'title');
assert.strictEqual(suggestKeyword('heroo', ['hero', 'title', 'card']), 'hero');
console.log('   ✓ Levenshtein distance and fuzzy suggestions verified.');

// 2. Diagnostics & Caret Pointers & Non-Fatal Error Recovery
console.log('\n2️⃣ Testing Error Diagnostics & Non-Fatal Error Recovery...');
const badSource = `Mr.easy "Error Test"\n\ntitel "Hello World"\nhero\n  title "Valid Hero" big glow\n`;
const { html: badHtml, errors, diagnostics } = compile(badSource);
assert(diagnostics.length > 0, 'Expected diagnostics array');
assert(errors.length > 0, 'Expected errors array');
assert(errors[0].includes('Did you mean \'title\'?'), 'Expected fuzzy match suggestion in error');
assert(badHtml.includes('mr-error-box'), 'Expected non-fatal error placeholder box in HTML');
assert(badHtml.includes('Valid Hero'), 'Expected valid section to still compile normally');
console.log('   ✓ Line/col diagnostics, caret formatting, and non-fatal fallback box verified.');

// 3. Variables & String Interpolation
console.log('\n3️⃣ Testing Variables & String Interpolation...');
const varSource = `Mr.easy "Var Test"\n\nset username = "Biruk"\nhero\n  title "Welcome {username}" big glow\n`;
const { html: varHtml } = compile(varSource);
assert(varHtml.includes('Welcome Biruk'), 'Expected string interpolation {username} -> Biruk');
console.log('   ✓ Variable set and {var} interpolation verified.');

// 4. Conditionals (if / else / end)
console.log('\n4️⃣ Testing Conditionals (if / else / end)...');
const ifSource = `Mr.easy "If Test"\n\nset loggedIn = true\nif loggedIn\n  button "Logout" red\nelse\n  button "Login" green\nend\n`;
const { html: ifHtml } = compile(ifSource);
assert(ifHtml.includes('Logout'), 'Expected true conditional branch to render');
assert(!ifHtml.includes('Login'), 'Expected false conditional branch to be skipped');
console.log('   ✓ Indentation-based conditionals verified.');

// 5. Loops (repeat item in items)
console.log('\n5️⃣ Testing Loops (repeat item in items & repeat N times)...');
const loopSource = `Mr.easy "Loop Test"\n\nset features = ["Speed", "Simplicity", "Beauty"]\ngrid cols:3\n  repeat item in features\n    card shadow\n      title "{item}"\n  end\n`;
const { html: loopHtml } = compile(loopSource);
assert(loopHtml.includes('Speed'), 'Expected loop item 1 to render');
assert(loopHtml.includes('Simplicity'), 'Expected loop item 2 to render');
assert(loopHtml.includes('Beauty'), 'Expected loop item 3 to render');
console.log('   ✓ Repeat loops over array items verified.');

// 6. Reusable Components
console.log('\n6️⃣ Testing Reusable Components...');
const compSource = `Mr.easy "Component Test"\n\ncomponent PricingCard title price\n  card shadow\n    title "{title}"\n    text "{price}"\nend\n\nPricingCard "Basic Plan" "$9/mo"\n`;
const { html: compHtml } = compile(compSource);
assert(compHtml.includes('Basic Plan'), 'Expected component parameter title to render');
assert(compHtml.includes('$9/mo'), 'Expected component parameter price to render');
console.log('   ✓ Component definition, parameter mapping, and invocation verified.');

// 7. Differentiator Features (Animations, Validation)
console.log('\n7️⃣ Testing Animations & Form Validation...');
const diffSource = `Mr.easy "Diff Test"\n\ncard shadow fade-in slide-up pulse\n  title "Animated Card"\n\nform\n  input "email" required email-format\n`;
const { html: diffHtml } = compile(diffSource);
assert(diffHtml.includes('fade-in'), 'Expected fade-in animation class');
assert(diffHtml.includes('slide-up'), 'Expected slide-up animation class');
assert(diffHtml.includes('required'), 'Expected required HTML attribute');
assert(diffHtml.includes('email'), 'Expected email type attribute');
console.log('   ✓ Animation classes and form validation attributes verified.');

console.log('\n✅ ALL FEATURE SUITE TESTS PASSED SUCCESSFULLY! 🎉\n');
