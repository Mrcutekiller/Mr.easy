/**
 * MR.easy Plain-English Changelog Engine
 * Compares semantic AST/IR snapshots and generates beginner-friendly change bullet points.
 */

'use strict';

class ChangelogEngine {
  constructor() {
    this.history = [];
  }

  /**
   * Compares two IR instances and returns human-readable sentences.
   */
  diff(oldIR, newIR) {
    const changes = [];
    if (!oldIR) {
      changes.push(`You created page "${newIR.title}".`);
      return changes;
    }

    if (oldIR.title !== newIR.title) {
      changes.push(`You changed the page title from "${oldIR.title}" to "${newIR.title}".`);
    }

    // Map nodes by type + index path
    const oldNodes = [];
    const newNodes = [];

    const flattenWithPos = (nodes, list, path = '') => {
      nodes.forEach((n, idx) => {
        const curPath = `${path}/${n.type}_${idx}`;
        list.push({ path: curPath, node: n });
        if (n.children) flattenWithPos(n.children, list, curPath);
      });
    };

    flattenWithPos(oldIR.nodes || [], oldNodes);
    flattenWithPos(newIR.nodes || [], newNodes);

    const oldMap = new Map(oldNodes.map(i => [i.path, i.node]));
    const newMap = new Map(newNodes.map(i => [i.path, i.node]));

    for (const item of newNodes) {
      const oldNode = oldMap.get(item.path);
      const newNode = item.node;

      if (!oldNode) {
        changes.push(`You added a ${newNode.type} "${newNode.label || 'element'}".`);
      } else if (oldNode.label !== newNode.label) {
        changes.push(`You changed ${newNode.type} from "${oldNode.label}" to "${newNode.label}".`);
      } else if (oldNode.price !== newNode.price && (oldNode.price || newNode.price)) {
        changes.push(`You changed ${newNode.label || 'item'} price from "${oldNode.price || 'N/A'}" to "${newNode.price || 'N/A'}".`);
      }
    }

    for (const item of oldNodes) {
      if (!newMap.has(item.path)) {
        changes.push(`You removed the ${item.node.type} "${item.node.label || 'element'}".`);
      }
    }

    if (!changes.length) {
      changes.push('No semantic changes detected.');
    }

    return changes;
  }

  recordSnapshot(ir, source) {
    const snapshot = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ir,
      source,
      changes: this.history.length ? this.diff(this.history[this.history.length - 1].ir, ir) : ['Initial creation.']
    };
    this.history.push(snapshot);
    return snapshot;
  }
}

module.exports = { ChangelogEngine };
