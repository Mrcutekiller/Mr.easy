/**
 * MR.easy New Features Test Suite
 * Run: node tests/new-features.test.js
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

function includes(haystack, needle, msg) {
  if (!haystack.includes(needle)) {
    throw new Error(`${msg || 'Expected string to contain'} "${needle}"`);
  }
}

console.log('\n\x1b[1m MR.easy New Features Unit Tests\x1b[0m');

test('Theme Toggle Component', () => {
  const src = `Mr.easy "Theme Test"\nnav\n  theme-toggle\n`;
  const { html, errors } = compile(src);
  if (errors.length) throw new Error(errors[0]);
  includes(html, 'mr-theme-toggle');
  includes(html, 'mrToggleTheme()');
});

test('Toast Notification Element & Button Modifier', () => {
  const src = `Mr.easy "Toast Test"\ntoast "Saved successfully!"\nbutton "Save" toast:"Form saved!"\n`;
  const { html, errors } = compile(src);
  if (errors.length) throw new Error(errors[0]);
  includes(html, 'mrShowToast(\'Saved successfully!\')');
  includes(html, 'mrShowToast(\'Form saved!\')');
});

test('Open Modal Trigger on Button', () => {
  const src = `Mr.easy "Modal Test"\nbutton "Contact" open-modal:contactModal\nmodal id:contactModal title:"Get in Touch"\n  text "Hello"\n`;
  const { html, errors } = compile(src);
  if (errors.length) throw new Error(errors[0]);
  includes(html, 'mrOpenModal(\'contactModal\')');
  includes(html, 'id="contactModal"');
});

test('WhatsApp Direct Checkout Button', () => {
  const src = `Mr.easy "WhatsApp Test"\nwhatsapp-buy phone:"+251911000000" item:"Specialty Coffee" price:"$15"\n`;
  const { html, errors } = compile(src);
  if (errors.length) throw new Error(errors[0]);
  includes(html, 'mr-whatsapp-btn');
  includes(html, 'https://wa.me/251911000000');
  includes(html, 'Specialty%20Coffee');
});

test('Pricing Table & Plan Components', () => {
  const src = `Mr.easy "Pricing Test"
pricing-table
  plan title:"Basic" price:"$0/mo" button:"Start Free"
    item "1 Project"
  plan title:"Pro" price:"$19/mo" badge:"Popular" featured:true
    item "Unlimited Projects"
`;
  const { html, errors } = compile(src);
  if (errors.length) throw new Error(errors[0]);
  includes(html, 'mr-pricing-table');
  includes(html, 'mr-pricing-card featured');
  includes(html, 'mr-pricing-badge');
  includes(html, 'Popular');
});

test('Import Component File', () => {
  const fs = require('fs');
  const path = require('path');
  const tempImportPath = path.join(process.cwd(), 'temp-header-test.mreasy');
  fs.writeFileSync(tempImportPath, 'logo "MyImportedBrand"\n', 'utf-8');
  try {
    const src = `Mr.easy "Import Test"\nimport "./temp-header-test.mreasy"\n`;
    const { html, errors } = compile(src);
    if (errors.length) throw new Error(errors[0]);
    includes(html, 'MyImportedBrand');
  } finally {
    if (fs.existsSync(tempImportPath)) fs.unlinkSync(tempImportPath);
  }
});

console.log(`\n\x1b[1mResults: ${passed}/${total} passed (${failed} failed)\x1b[0m\n`);
if (failed > 0) process.exit(1);
