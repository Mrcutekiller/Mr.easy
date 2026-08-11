/**
 * MR.easy SMS Target Compiler
 * Consumes Semantic IR → Ultra-compact text-only representation optimized for SMS limits
 */

'use strict';

class SMSCompilerTarget {
  constructor(options = {}) {
    this.options = options;
  }

  compileIR(ir) {
    const title = ir.title || 'Mulu Cafe';
    let text = `${title.toUpperCase()}: `;

    const items = [];
    for (const item of ir.items) {
      const name  = item.label || item.props?.label || '';
      const price = item.price || item.props?.price || '';
      if (name) {
        items.push(price ? `${name} ${price}` : name);
      }
    }

    if (items.length) {
      text += items.join(', ') + '. ';
    }

    if (ir.buttons.length) {
      text += `Order: ${ir.buttons[0].label || 'Contact us'}.`;
    }

    // Limit length to SMS boundaries
    const charCount = text.length;
    const segmentCount = Math.ceil(charCount / 160) || 1;

    return {
      target: 'sms',
      output: text.trim(),
      charCount,
      segmentCount,
      warnings: charCount > 320 ? ['SMS exceeds 2 segments (320 chars). Consider shortening text.'] : []
    };
  }
}

module.exports = { SMSCompilerTarget };
