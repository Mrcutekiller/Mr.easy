/**
 * MR.easy Web Compiler Target
 * Renders Semantic IR → Full Responsive HTML/CSS Web Application
 */

'use strict';

const { Compiler } = require('../compiler');

class WebCompilerTarget {
  constructor(options = {}) {
    this.options = options;
  }

  compileIR(ir, originalAST) {
    const compiler = new Compiler();
    const result = compiler.compile(originalAST);
    return {
      target: 'web',
      output: result.html,
      warnings: result.warnings || []
    };
  }
}

module.exports = { WebCompilerTarget };
