/**
 * MR.easy Amharic & Bilingual Translation Module
 * Translates content strings to Amharic (አማርኛ) without touching MR.easy keywords.
 */

'use strict';

// Built-in dictionary for fast local translation
const AMHARIC_DICTIONARY = {
  'welcome to mulu cafe': 'እንኳን ወደ ሙሉ ካፌ በሰላም መጡ',
  'welcome to addis cafe': 'እንኳን ወደ አዲስ ካፌ በሰላም መጡ',
  'welcome to our school': 'ወደ ትምህርት ቤታችን እንኳን በሰላም መጡ',
  'welcome to our clinic': 'ወደ ክሊኒካችን እንኳን በሰላም መጡ',
  'welcome': 'እንኳን በሰላም መጡ',
  'coffee': 'ቡና',
  'fresh ethiopian coffee': 'ትኩስ የኢትዮጵያ ቡና',
  'cake': 'ኬክ',
  'homemade chocolate cake': 'የቤት ውስጥ ቸኮሌት ኬክ',
  'tea': 'ሻይ',
  'breakfast': 'ቁርስ',
  'lunch': 'ምሳ',
  'dinner': 'እራት',
  'order now': 'አሁኑኑ ይዘዙ',
  'contact us': 'ያግኙን',
  'get started': 'ይጀምሩ',
  'learn more': 'ተጨማሪ ያንብቡ',
  'services': 'አገልግሎቶች',
  'features': 'ባህሪያት',
  'pricing': 'ዋጋ',
  'contact': 'አድራሻ',
  'home': 'መነሻ',
  'about us': 'ስለ እኛ',
  'our team': 'ቡድናችን',
  'opening hours': 'የሥራ ሰዓት',
  'phone': 'ስልክ',
  'address': 'አድራሻ',
  'addis ababa': 'አዲስ አበባ',
  'ethiopia': 'ኢትዮጵያ',
  'made with mr.easy 🇪🇹': 'በ MR.easy የተሰራ 🇪🇹'
};

class ContentTranslator {
  constructor(provider = null) {
    this.provider = provider;
    this.cache = new Map();
  }

  translateString(text, targetLang = 'am') {
    if (!text || typeof text !== 'string') return text;
    if (targetLang === 'en') return text;

    const lower = text.trim().toLowerCase();
    if (AMHARIC_DICTIONARY[lower]) {
      return AMHARIC_DICTIONARY[lower];
    }

    if (this.cache.has(lower)) {
      return this.cache.get(lower);
    }

    if (this.provider && typeof this.provider.translate === 'function') {
      const res = this.provider.translate(text, targetLang);
      this.cache.set(lower, res);
      return res;
    }

    // Default fallback: preserve original text if untranslated
    return text;
  }

  /**
   * Translates content values inside Semantic IR nodes.
   */
  translateIR(ir, targetLang = 'am') {
    if (targetLang === 'en') return ir;

    const clone = JSON.parse(JSON.stringify(ir));
    clone.title = this.translateString(clone.title, targetLang);

    const translateNodes = (nodes) => {
      for (const node of nodes) {
        if (node.label) {
          node.label = this.translateString(node.label, targetLang);
        }
        if (node.props?.label) {
          node.props.label = this.translateString(node.props.label, targetLang);
        }
        if (node.props?.text) {
          node.props.text = this.translateString(node.props.text, targetLang);
        }
        if (node.children) {
          translateNodes(node.children);
        }
      }
    };

    translateNodes(clone.nodes || []);
    return clone;
  }

  /**
   * Injects a client-side bilingual language switcher bar into HTML.
   */
  injectBilingualSwitcher(html, amharicHtml) {
    const switcherBar = `
<div class="mr-bilingual-switcher" style="position:sticky;top:0;z-index:10000;background:#0f172a;color:#e2e8f0;padding:8px 16px;display:flex;align-items:center;justify-content:flex-end;gap:12px;font-family:sans-serif;font-size:0.82rem;border-bottom:1px solid rgba(255,255,255,0.1);">
  <span style="color:#94a3b8">Language / ቋንቋ:</span>
  <button onclick="mrSetLang('en')" style="background:transparent;border:1px solid #6366f1;color:#fff;padding:3px 10px;border-radius:4px;cursor:pointer;">English</button>
  <button onclick="mrSetLang('am')" style="background:#6366f1;border:none;color:#fff;padding:3px 10px;border-radius:4px;cursor:pointer;">አማርኛ</button>
</div>
<script>
  window.mrAmharicHTML = ${JSON.stringify(amharicHtml)};
  window.mrEnglishHTML = document.body.innerHTML;
  function mrSetLang(lang) {
    if (lang === 'am' && window.mrAmharicHTML) {
      document.body.innerHTML = window.mrAmharicHTML;
    } else if (lang === 'en' && window.mrEnglishHTML) {
      document.body.innerHTML = window.mrEnglishHTML;
    }
  }
</script>
`;
    return html.replace('<body>', `<body>\n${switcherBar}`);
  }
}

module.exports = { ContentTranslator, AMHARIC_DICTIONARY };
