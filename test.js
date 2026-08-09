const { compile } = require('./core/index');

const source = `Mr.easy "Test Page"

hero
  title "Hello World" big glow
  subtitle "MR.easy works!"
  button "Click Me" blue big

section "features"
  grid cols:3
    card shadow
      icon star
      title "Feature 1" small
      text "Amazing"
    card shadow
      icon heart
      title "Feature 2" small
      text "Beautiful"
    card shadow
      icon bolt
      title "Feature 3" small
      text "Fast"

footer
  text "Made with Mr.easy"
`;

const { html, errors } = compile(source);
console.log('✓ Errors:', errors.length === 0 ? 'NONE' : errors);
console.log('✓ HTML length:', html.length, 'characters');
console.log('✓ Has hero section:', html.includes('mr-hero'));
console.log('✓ Has grid:', html.includes('mr-grid'));
console.log('✓ Has glow title:', html.includes('mr-glow'));
console.log('✓ Has button:', html.includes('mr-button'));
console.log('\n✅ MR.easy compiler is working correctly!\n');

// Write output for inspection
const fs = require('fs');
fs.writeFileSync('./test-output.html', html);
console.log('✓ Test output written to test-output.html');
