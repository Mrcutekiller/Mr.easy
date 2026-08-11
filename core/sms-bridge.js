/**
 * MR.easy Offline-First SMS / USSD Bridge Adapter
 * Converts structured SMS/USSD text messages into MR.easy Semantic IR & website code.
 */

'use strict';

class SMSInputAdapter {
  parseSMS(smsText) {
    const lines = smsText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return null;

    let pageTitle = 'My SMS Site';
    const firstLine = lines[0];

    if (firstLine.toUpperCase().startsWith('MENU') || firstLine.toUpperCase().startsWith('SITE')) {
      pageTitle = firstLine.replace(/^(MENU|SITE)\s*/i, '') || pageTitle;
      lines.shift();
    }

    let mreasyCode = `Mr.easy "${pageTitle}"\n\nhero "${pageTitle}" "Welcome to ${pageTitle}" "Order Now" green\n\nsection "Menu Items"\n  grid cols:2\n`;

    for (const line of lines) {
      const match = line.match(/^([^0-9]+)\s+(\d+(\.\d+)?(\s*ETB)?)/i);
      if (match) {
        const itemTitle = match[1].trim();
        const price = match[2].trim();
        const priceStr = price.toUpperCase().includes('ETB') ? price : `${price} ETB`;
        mreasyCode += `    card shadow\n      title "${itemTitle}"\n      text "${priceStr}" bold\n      button "Order ${itemTitle}" green\n    end\n`;
      } else {
        mreasyCode += `    card shadow\n      title "${line}"\n    end\n`;
      }
    }

    mreasyCode += `\nfooter "Created via SMS Bridge • MR.easy 🇪🇹"\n`;
    return mreasyCode;
  }
}

module.exports = { SMSInputAdapter };
