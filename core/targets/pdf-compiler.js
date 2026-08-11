/**
 * MR.easy Printable PDF Target Compiler
 * Consumes Semantic IR → Print-optimized HTML layout for menus, flyers, and brochures
 */

'use strict';

const { WebCompilerTarget } = require('./web-compiler');

class PDFCompilerTarget {
  constructor(options = {}) {
    this.options = options;
  }

  compileIR(ir, originalAST) {
    const web = new WebCompilerTarget();
    const result = web.compileIR(ir, originalAST);

    // Inject print-specific CSS rules
    const printCSS = `
<style media="print">
  @page { size: A4 portrait; margin: 15mm; }
  body { background: white !important; color: black !important; font-family: serif !important; }
  .mr-hero, .mr-section, .mr-card { background: transparent !important; color: black !important; border: 1px solid #ccc !important; box-shadow: none !important; }
  .mr-button { background: white !important; color: black !important; border: 1px solid black !important; text-decoration: underline; }
  .mr-glow { text-shadow: none !includes; }
  .mr-divider { border-color: #000 !important; }
  .no-print { display: none !important; }
</style>
<script>
  window.addEventListener('DOMContentLoaded', () => {
    // Print button helper
    const btn = document.createElement('button');
    btn.textContent = '🖨️ Print / Save as PDF';
    btn.className = 'no-print';
    btn.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:12px 24px;background:#6366f1;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer;box-shadow:0 10px 20px rgba(0,0,0,0.3);';
    btn.onclick = () => window.print();
    document.body.appendChild(btn);
  });
</script>
`;

    const pdfHtml = result.output.replace('</head>', `${printCSS}\n</head>`);

    return {
      target: 'pdf',
      output: pdfHtml,
      warnings: []
    };
  }
}

module.exports = { PDFCompilerTarget };
