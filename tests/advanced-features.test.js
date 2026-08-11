/**
 * MR.easy Advanced Feature Suite Automated Test Runner
 * Tests Semantic IR, Multi-Target Compilers, Amharic Translation,
 * UX Critique, Health Meter, ETB Cost Estimator, Starter Packs, and SMS Bridge.
 */

'use strict';

const assert = require('assert');
const { compile } = require('../core/index');
const { buildSemanticIR } = require('../core/ir');
const { ContentTranslator } = require('../core/translator');
const { ChangelogEngine } = require('../core/changelog');
const { auditUX } = require('../core/ux-critique');
const { calculatePageHealth } = require('../core/health-meter');
const { estimateHostingCost } = require('../core/cost-estimator');
const { matchStarterPack } = require('../core/starter-packs');
const { SMSInputAdapter } = require('../core/sms-bridge');

console.log('🧪 Starting MR.easy Advanced Feature Suite Automated Tests...\n');

const sampleSource = `Mr.easy "Mulu Cafe & Bakery"

hero "Mulu Cafe" "Fresh Ethiopian Coffee & Daily Pastries" "Order Now" green

card "Coffee"
  text "Fresh Ethiopian coffee"
  text "120 ETB" bold
end

card "Cake"
  text "Homemade chocolate cake"
  text "180 ETB" bold
end

button "Order Now" green
`;

// 1. Semantic IR Generation
console.log('1️⃣ Testing Semantic IR Construction...');
const { ir } = compile(sampleSource);
assert.strictEqual(ir.title, 'Mulu Cafe & Bakery');
assert(ir.buttons.length >= 1, 'Expected buttons to be indexed in IR');
console.log('   ✓ Shared Semantic IR constructed successfully.');

// 2. Multi-Target Compilation (Web, WhatsApp, PDF, SMS)
console.log('\n2️⃣ Testing Multi-Target Compilation...');
const webRes = compile(sampleSource, { target: 'web' });
assert(webRes.html.includes('class="mr-hero"'), 'Expected HTML output for Web target');

const waRes = compile(sampleSource, { target: 'whatsapp' });
assert(waRes.output.includes('☕ *MULU CAFE & BAKERY*'), 'Expected WhatsApp header formatting');
assert(waRes.output.includes('120 ETB'), 'Expected price listing in WhatsApp output');

const pdfRes = compile(sampleSource, { target: 'pdf' });
assert(pdfRes.output.includes('@page { size: A4 portrait; margin: 15mm; }'), 'Expected PDF print CSS');

const smsRes = compile(sampleSource, { target: 'sms' });
assert(smsRes.output.includes('MULU CAFE & BAKERY:'), 'Expected compact SMS header formatting');
console.log('   ✓ Web, WhatsApp, PDF, and SMS multi-target outputs verified.');

// 3. Live Bilingual Output & Amharic Translation
console.log('\n3️⃣ Testing Amharic Content Translation & Bilingual Switcher...');
const amRes = compile(sampleSource, { target: 'whatsapp', lang: 'am' });
assert(amRes.output.includes('ቡና'), 'Expected Coffee to be translated to ቡና');

const bothRes = compile(sampleSource, { target: 'web', lang: 'both' });
assert(bothRes.html.includes('class="mr-bilingual-switcher"'), 'Expected bilingual switcher bar');
console.log('   ✓ Amharic translation and bilingual switcher verified.');

// 4. Plain-English Changelog Engine
console.log('\n4️⃣ Testing Plain-English AST/IR Changelog Engine...');
const engine = new ChangelogEngine();
const initialSnap = engine.recordSnapshot(ir, sampleSource);
assert.strictEqual(initialSnap.changes[0], 'Initial creation.');

const modifiedSource = sampleSource.replace('120 ETB', '150 ETB');
const { ir: modifiedIR } = compile(modifiedSource);
const diffs = engine.diff(ir, modifiedIR);
assert(diffs.some(d => d.includes('120 ETB') && d.includes('150 ETB')), 'Expected price change diff sentence');
console.log('   ✓ Plain-English AST/IR diff generation verified.');

// 5. Built-in UX Critique Auditor
console.log('\n5️⃣ Testing Built-in UX Critique Auditor...');
const badSource = `Mr.easy "My MR.easy Page"\n\ncard "No button card"\n  text "Card content"\nend\n`;
const { ir: badIR } = compile(badSource);
const suggestions = auditUX(badIR);
assert(suggestions.some(s => s.message.includes('no button or Call to Action')), 'Expected CTA UX suggestion');
console.log('   ✓ Usability and UX critique auditor verified.');

// 6. Live Page Weight & Health Meter
console.log('\n6️⃣ Testing Live Page Weight & Health Meter...');
const health = calculatePageHealth(webRes.html, ir);
assert(health.totalWeightKB > 0, 'Expected positive total weight in KB');
assert(health.loadTimeSec > 0, 'Expected positive estimated load time');
assert(health.a11yScore >= 0 && health.a11yScore <= 100, 'Expected valid accessibility score');
console.log('   ✓ Page weight, load time, and health meter metrics verified.');

// 7. Compile-Time ETB Hosting Cost Estimator
console.log('\n7️⃣ Testing Compile-Time ETB Hosting Cost Estimator...');
const cost = estimateHostingCost(health, 1000);
assert.strictEqual(cost.currency, 'ETB');
assert(cost.totalCostETB >= 50, 'Expected valid monthly ETB hosting estimate');
console.log('   ✓ Monthly ETB hosting cost estimator verified.');

// 8. Starter Packs & Pattern Matcher
console.log('\n8️⃣ Testing Community Starter Packs & Pattern Matcher...');
const cafePack = matchStarterPack('coffee shop menu with pastries');
assert.strictEqual(cafePack.category, 'Food & Hospitality');
const schoolPack = matchStarterPack('small primary school academy');
assert.strictEqual(schoolPack.category, 'Education');
console.log('   ✓ Starter pack intent matcher verified.');

// 9. Offline-First SMS / USSD Bridge Adapter
console.log('\n9️⃣ Testing Offline-First SMS / USSD Bridge Adapter...');
const adapter = new SMSInputAdapter();
const rawSMS = `MENU Mulu Cafe\nCoffee 120 ETB\nCake 180 ETB`;
const generatedCode = adapter.parseSMS(rawSMS);
assert(generatedCode.includes('Mr.easy "Mulu Cafe"'), 'Expected generated MR.easy header from SMS');
assert(generatedCode.includes('120 ETB'), 'Expected price extraction from SMS input');
console.log('   ✓ SMS/USSD text command adapter verified.');

console.log('\n✅ ALL ADVANCED FEATURE SUITE TESTS PASSED SUCCESSFULLY! 🎉\n');
