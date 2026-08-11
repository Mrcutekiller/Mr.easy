/**
 * MR.easy Built-in UX Critique & Usability Auditor
 * Audits Semantic IR for common UX, accessibility, and content issues.
 */

'use strict';

class UXSuggestion {
  constructor(message, recommendation, line = 1) {
    this.type           = 'ux_suggestion';
    this.message        = message;
    this.recommendation = recommendation;
    this.line           = line;
  }

  format() {
    return `⚠ UX suggestion (line ${this.line}): ${this.message}\n   💡 ${this.recommendation}`;
  }
}

function auditUX(ir) {
  const suggestions = [];

  // 1. Missing page title
  if (!ir.title || ir.title === 'My MR.easy Page') {
    suggestions.push(new UXSuggestion(
      'Your page does not have a descriptive title.',
      'Add a title to your page declaration, e.g. Mr.easy "Mulu Cafe & Bakery"',
      1
    ));
  }

  // 2. Missing Call to Action (CTA) button
  if (!ir.buttons || ir.buttons.length === 0) {
    suggestions.push(new UXSuggestion(
      'This page has no button or Call to Action (CTA).',
      'Visitors may not know what action to take next. Add a button, e.g. button "Order Now" blue big',
      1
    ));
  }

  // 3. Duplicate button labels
  const buttonLabels = new Map();
  if (ir.buttons) {
    for (const btn of ir.buttons) {
      const lbl = (btn.label || '').trim().toLowerCase();
      if (lbl) {
        if (buttonLabels.has(lbl)) {
          suggestions.push(new UXSuggestion(
            `Two buttons have the exact same label "${btn.label}".`,
            'Consider giving them different names so visitors know where each button leads.',
            btn.line || 1
          ));
        } else {
          buttonLabels.set(lbl, true);
        }
      }
    }
  }

  // 4. Missing image descriptions / alt text
  const checkNodes = (nodes) => {
    for (const n of nodes) {
      if (n.type === 'image' || n.type === 'img') {
        if (!n.props?.alt && !n.label) {
          suggestions.push(new UXSuggestion(
            'Image is missing an alt text description.',
            'Add alt:"Description" so screen readers and search engines understand your image.',
            n.line || 1
          ));
        }
      }
      if (n.type === 'text' && n.label && n.label.split(/\s+/).length > 150) {
        suggestions.push(new UXSuggestion(
          'Very long paragraph detected (>150 words).',
          'Break long text into smaller paragraphs or bullet points for easier mobile reading.',
          n.line || 1
        ));
      }
      if (n.children) checkNodes(n.children);
    }
  };

  if (ir.nodes) checkNodes(ir.nodes);

  return suggestions;
}

module.exports = { UXSuggestion, auditUX };
