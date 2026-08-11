/**
 * MR.easy Diagnostic & Error System
 * Handles line/column error reporting, caret pointers, diagnostic levels,
 * and Levenshtein distance "did you mean?" fuzzy matching.
 */

'use strict';

const DIAGNOSTIC_LEVELS = Object.freeze({
  ERROR:   'error',
  WARNING: 'warning',
  INFO:    'info'
});

class Diagnostic {
  constructor(level, message, line = 1, col = 1, source = '', suggestion = null) {
    this.level      = level;
    this.message    = message;
    this.line       = line;
    this.col        = col;
    this.source     = source;
    this.suggestion = suggestion;
  }

  /**
   * Formats the diagnostic with a caret pointer for CLI / terminal printing.
   */
  formatCaret() {
    if (!this.source) {
      return `Error at line ${this.line}, col ${this.col}: ${this.message}`;
    }
    const lines = this.source.split('\n');
    const lineContent = lines[this.line - 1] || '';
    const lineNumStr = String(this.line).padStart(4, ' ');
    const caretPadding = ' '.repeat(Math.max(0, this.col - 1));

    let output = `${lineNumStr} | ${lineContent}\n`;
    output += `     | ${caretPadding}^ ${this.message}`;
    if (this.suggestion) {
      output += ` (Did you mean '${this.suggestion}'?)`;
    }
    return output;
  }
}

/**
 * Calculates Levenshtein distance between two strings.
 */
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // deletion
        dp[i][j - 1] + 1,       // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

/**
 * Finds the closest matching keyword from a list if within distance threshold.
 */
function suggestKeyword(input, candidates, maxDistance = 3) {
  let bestMatch = null;
  let minDistance = maxDistance + 1;
  const target = input.toLowerCase();

  for (const candidate of candidates) {
    const candLower = candidate.toLowerCase();
    const dist = levenshtein(target, candLower);
    if (dist < minDistance && dist <= maxDistance) {
      minDistance = dist;
      bestMatch = candidate;
    }
  }
  return bestMatch;
}

module.exports = {
  DIAGNOSTIC_LEVELS,
  Diagnostic,
  levenshtein,
  suggestKeyword
};
