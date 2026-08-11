/**
 * MR.easy WhatsApp Catalog Target Compiler
 * Consumes Semantic IR → Clean, emoji-enhanced WhatsApp catalog message representation
 */

'use strict';

class WhatsAppCompilerTarget {
  constructor(options = {}) {
    this.options = options;
  }

  compileIR(ir) {
    const lines = [];
    const title = ir.title || 'Mulu Cafe';

    lines.push(`☕ *${title.toUpperCase()}*\n`);

    for (const node of ir.nodes) {
      this.renderNode(node, lines);
    }

    // Append order / action buttons
    if (ir.buttons.length) {
      lines.push('\n📲 *ACTIONS:*');
      ir.buttons.forEach(btn => {
        lines.push(`👉 ${btn.label || 'Order Now'}`);
      });
    }

    lines.push('\n_Powered by MR.easy 🇪🇹_');

    return {
      target: 'whatsapp',
      output: lines.join('\n'),
      warnings: []
    };
  }

  renderNode(node, lines) {
    if (!node) return;

    switch (node.type) {
      case 'title':
        if (node.label) lines.push(`\n📌 *${node.label}*`);
        break;
      case 'subtitle':
        if (node.label) lines.push(`_${node.label}_`);
        break;
      case 'card':
      case 'box':
        const cardTitle = node.label || (node.props && node.props.label) || '';
        const priceStr  = node.price || (node.props && node.props.price) || '';
        lines.push(`\n• *${cardTitle}*`);

        // Render child text/price nodes
        if (node.children && node.children.length) {
          for (const child of node.children) {
            if (child.type === 'text') lines.push(`  ${child.label}`);
            if (child.type === 'title') lines.push(`  *${child.label}*`);
          }
        }
        if (priceStr) lines.push(`  💰 Price: *${priceStr}*`);
        break;
      case 'text':
        if (node.label) lines.push(node.label);
        break;
      case 'item':
        lines.push(`  • ${node.label}`);
        break;
      default:
        if (node.children && node.children.length) {
          node.children.forEach(child => this.renderNode(child, lines));
        }
        break;
    }
  }
}

module.exports = { WhatsAppCompilerTarget };
