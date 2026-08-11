/**
 * MR.easy Semantic Intermediate Representation (IR)
 * Converts AST into a canonical semantic model shared across all targets
 * (Web, WhatsApp, PDF, SMS, etc.)
 */

'use strict';

class SemanticNode {
  constructor(type, label = '', extra = {}) {
    this.id     = extra.id || `node_${Math.random().toString(36).slice(2, 9)}`;
    this.type   = type;   // page, section, hero, grid, card, title, subtitle, text, price, button, link, image, form, input, list, item, footer
    this.label  = label;
    this.props  = extra.props || {};
    this.children = extra.children || [];
    this.line   = extra.line || 1;
  }
}

class SemanticIR {
  constructor(ast) {
    this.title    = ast?.title || 'My MR.easy Page';
    this.nodes    = [];
    this.items    = [];   // Flattened list of product/service items for catalogs/menus
    this.contacts = [];   // Phone, email, address, opening hours
    this.buttons  = [];
    this.links    = [];

    if (ast && ast.body) {
      this.nodes = this.buildNodes(ast.body);
    }
  }

  buildNodes(body) {
    const result = [];
    for (const astNode of body) {
      if (!astNode) continue;
      const semNode = this.convertNode(astNode);
      if (semNode) {
        result.push(semNode);
        this.indexNode(semNode);
      }
    }
    return result;
  }

  convertNode(astNode) {
    if (!astNode) return null;
    const props = astNode.props || {};
    const label = props.label || (props.modifiers && props.modifiers[0]) || '';
    const children = astNode.children ? this.buildNodes(astNode.children) : [];

    const semNode = new SemanticNode(astNode.type, label, {
      props,
      children,
      line: astNode.line || 1
    });

    // Detect price properties on cards/boxes/items
    if (props.price) semNode.price = props.price;
    return semNode;
  }

  indexNode(node) {
    if (node.type === 'button') this.buttons.push(node);
    if (node.type === 'link') this.links.push(node);
    if (node.props?.price || node.type === 'card' || node.type === 'item') {
      this.items.push(node);
    }
    if (node.children) {
      node.children.forEach(child => this.indexNode(child));
    }
  }
}

function buildSemanticIR(ast) {
  return new SemanticIR(ast);
}

module.exports = {
  SemanticNode,
  SemanticIR,
  buildSemanticIR
};
