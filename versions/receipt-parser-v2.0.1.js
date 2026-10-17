/*
  RECEIPT PARSER — turns OCR text from a receipt into form fields.
  Part of Receipt Log. See CHANGELOG.md for full history.

  VERSION HISTORY (newest first)
  v2.0.1  2026-10-17  iPhone fix: removed regex lookbehind, which iOS
                      Safari before 16.4 can't parse (broke the whole app).
  v2.0.0  2026-10-16  First version. Finds total, date, vendor, category,
                      and cash/check payment from raw OCR text. Learns from
                      vendors already in the log (spelling + last category).
*/
(function (root) {
  "use strict";

  const CATEGORIES = ["Materials", "Tools & Equipment", "Inventory", "Fuel & Mileage", "Shipping",
    "Software", "Office Supplies", "Meals", "Fees", "Other"];

  // Common vendors -> [display name, default category]. Matched loosely against OCR text.
  const VENDORS = [
    ["Home Depot", "Materials"], ["Lowe's", "Materials"], ["Menards", "Materials"],
    ["Fleet Farm", "Materials"], ["Tractor Supply", "Materials"], ["Ace Hardware", "Materials"],
    ["True Value", "Materials"], ["Fastenal", "Materials"], ["Grainger", "Materials"],
    ["McMaster-Carr", "Materials"], ["Harbor Freight", "Tools & Equipment"],
    ["Northern Tool", "Tools & Equipment"], ["AutoZone", "Materials"], ["O'Reilly", "Materials"],
    ["NAPA", "Materials"], ["Advance Auto", "Materials"], ["Walmart", "Materials"],
    ["Target", "Materials"], ["Costco", "Materials"], ["Sam's Club", "Materials"],
    ["Hy-Vee", "Meals"], ["Amazon", "Materials"], ["eBay", "Inventory"],
    ["Casey's", "Fuel & Mileage"], ["Kwik Star", "Fuel & Mileage"], ["Kwik Trip", "Fuel & Mileage"],
    ["QuikTrip", "Fuel & Mileage"], ["Shell", "Fuel & Mileage"], ["BP", "Fuel & Mileage"],
    ["Phillips 66", "Fuel & Mileage"], ["Kum & Go", "Fuel & Mileage"], ["Maverik", "Fuel & Mileage"],
    ["Love's", "Fuel & Mileage"], ["Pilot", "Fuel & Mileage"], ["Flying J", "Fuel & Mileage"],
    ["Speedway", "Fuel & Mileage"], ["Marathon", "Fuel & Mileage"], ["Sinclair", "Fuel & Mileage"],
    ["USPS", "Shipping"], ["UPS", "Shipping"], ["FedEx", "Shipping"], ["Pirate Ship", "Shipping"],
    ["Staples", "Office Supplies"], ["Office Depot", "Office Supplies"], ["OfficeMax", "Office Supplies"],
    ["Best Buy", "Tools & Equipment"], ["Micro Center", "Tools & Equipment"],
    ["DigiKey", "Materials"], ["Mouser", "Materials"], ["AutomationDirect", "Materials"],
    ["Adobe", "Software"], ["Microsoft", "Software"], ["Google", "Software"], ["Apple", "Software"],
    ["Shopify", "Software"], ["Etsy", "Fees"], ["PayPal", "Fees"], ["Square", "Fees"],
    ["McDonald's", "Meals"], ["Subway", "Meals"], ["Culver's", "Meals"], ["Starbucks", "Meals"],
    ["Jimmy John's", "Meals"], ["Panera", "Meals"], ["Taco Bell", "Meals"], ["Wendy's", "Meals"],
    ["Burger King", "Meals"], ["Chick-fil-A", "Meals"], ["Pizza Ranch", "Meals"]
  ];

  const KEYWORDS = [
    ["Fuel & Mileage", /\b(unleaded|diesel|gallons?|gal\b|pump\s*#?\d|fuel|regular\s+unl|e-?85|premium\s+unl)/i],
    ["Shipping", /\b(postage|priority\s+mail|first[-\s]class|ground\s+advantage|tracking|shipping\s+label|parcel)/i],
    ["Meals", /\b(server|table\s*#?\d|tip\b|gratuity|guests?|dine\s*in|take\s*out|burger|pizza|sandwich|coffee|fries|combo)/i],
    ["Software", /\b(subscription|license|monthly\s+plan|annual\s+plan|renewal|saas|domain)/i],
    ["Office Supplies", /\b(toner|ink\s+cart|copy\s+paper|printer\s+paper|envelopes|folders|pens\b)/i],
    ["Tools & Equipment", /\b(drill|impact\s+driver|saw\b|grinder|wrench|socket\s+set|multimeter|tool\s*kit|battery\s+pack)/i],
    ["Fees", /\b(service\s+fee|processing\s+fee|late\s+fee|filing\s+fee|permit|registration)/i],
    ["Materials", /\b(lumber|plywood|screws?|bolts?|nuts\b|washers?|pvc|conduit|wire\b|fittings?|pipe|paint|concrete|steel|fasteners?)/i]
  ];

  const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };

  const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  function pad(n) { return String(n).padStart(2, "0"); }

  // Fix common OCR slips inside numbers: O->0, l/I->1, S->5 when surrounded by digits
  function cleanNumbers(line) {
    return line
      // (no lookbehind: older iPhones can't run it)
      .replace(/([\d.,])[oO](?=\d)/g, "$10")
      .replace(/(\d)[lI|](?=\d)/g, "$11")
      .replace(/(\d)\s*[.,]\s*(\d{2})(?!\d)/g, "$1.$2");      // "12 .34" / "12,34" -> "12.34"
  }

  function amountsIn(line) {
    const out = [];
    const re = /(?:^|[^\d.])-?\$?\s?((?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2})(?!\d)/g;
    let m;
    while ((m = re.exec(line))) {
      const v = Math.round(parseFloat(m[1].replace(/,/g, "")) * 100);
      if (v > 0 && v < 10000000) out.push(v);
    }
    return out;
  }

  function findTotal(lines) {
    const ranked = [];
    const P = [
      [4, /\b(grand\s*total|amount\s*due|balance\s*due|total\s*due|total\s*amount|amount\s*paid|total\s*charged?)\b/i],
      [3, /\btotal\b/i],
      [2, /\b(visa|mastercard|master\s*card|amex|discover|debit|credit|card|cash)\b.*\d/i]
    ];
    const skip = /\b(sub\s*-?\s*total|subtot|savings|you\s*saved|discount|total\s*items|items?\s*sold|total\s*qty|# ?items|tax\b|change\b)/i;
    lines.forEach((ln, i) => {
      if (skip.test(ln)) return;
      for (const [rank, re] of P) {
        if (re.test(ln)) {
          let a = amountsIn(ln);
          if (!a.length && lines[i + 1]) a = amountsIn(lines[i + 1]);   // amount wrapped to next line
          if (a.length) ranked.push({ rank, cents: a[a.length - 1], i });
          break;
        }
      }
    });
    if (ranked.length) {
      const top = Math.max(...ranked.map(r => r.rank));
      return Math.max(...ranked.filter(r => r.rank === top).map(r => r.cents));
    }
    const all = lines.flatMap(amountsIn);
    return all.length ? Math.max(...all) : null;
  }

  function validDate(y, m, d, todayStr) {
    if (y < 100) y += 2000;
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, m - 1, d);
    if (dt.getMonth() !== m - 1) return null;
    const s = y + "-" + pad(m) + "-" + pad(d);
    const t = new Date(todayStr + "T00:00:00");
    const min = new Date(t); min.setFullYear(t.getFullYear() - 3);
    if (s > todayStr || dt < min) return null;
    return s;
  }

  function findDate(text, todayStr) {
    const pats = [
      [/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/g, m => [+m[1], +m[2], +m[3]]],
      [/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4}|\d{2})\b/g, m => [+m[3], +m[1], +m[2]]],
      [/\b(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/gi, m => [+m[3], MONTHS[m[1].toLowerCase()], +m[2]]],
      [/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?,?\s+(\d{4})\b/gi, m => [+m[3], MONTHS[m[2].toLowerCase()], +m[1]]]
    ];
    for (const [re, get] of pats) {
      let m;
      while ((m = re.exec(text))) {
        const [y, mo, d] = get(m);
        const s = validDate(y, mo, d, todayStr);
        if (s) return s;
      }
    }
    return null;
  }

  function findVendor(lines, text, knownVendors) {
    const flat = norm(text);
    // 1) a vendor already used in this log
    const kv = [...knownVendors].sort((a, b) => b.length - a.length);
    for (const v of kv) { const n = norm(v); if (n.length >= 3 && flat.includes(n)) return { name: v, known: true }; }
    // 2) built-in list (short names need a word match to avoid false hits)
    for (const [name] of VENDORS) {
      const n = norm(name);
      if (n.length <= 3) { if (new RegExp("\\b" + name.replace(/[^a-z0-9]/gi, "") + "\\b", "i").test(text)) return { name }; }
      else if (flat.includes(n)) return { name };
    }
    // 3) first plausible header line
    const bad = /(receipt|welcome|thank|store\s*#|tel\b|phone|www\.|\.com|invoice|order|cashier|register|date|time|^\d)/i;
    for (const ln of lines.slice(0, 6)) {
      const t = ln.replace(/[^A-Za-z0-9&'\- ]/g, " ").replace(/\s+/g, " ").trim();
      const letters = (t.match(/[A-Za-z]/g) || []).length;
      if (letters >= 3 && letters / t.length > 0.6 && !bad.test(t) && t.length <= 40) {
        return { name: t.toLowerCase().replace(/(^|[\s\-&])[a-z]/g, c => c.toUpperCase()) };
      }
    }
    return null;
  }

  function findCategory(vendorName, text, history) {
    if (vendorName && history[vendorName.toLowerCase()]) return history[vendorName.toLowerCase()];
    if (vendorName) { const hit = VENDORS.find(([n]) => n.toLowerCase() === vendorName.toLowerCase()); if (hit) return hit[1]; }
    for (const [cat, re] of KEYWORDS) if (re.test(text)) return cat;
    return null;
  }

  function findPayment(text) {
    if (/\bcash\b[^\n]*\d|\bchange\s*due\b|\btendered\b[^\n]*cash/i.test(text) && !/\b(visa|mastercard|amex|discover|debit|credit)\b/i.test(text)) return "Cash";
    if (/\bcheck\s*(tendered|#|no)/i.test(text)) return "Check";
    return null;
  }

  /**
   * parseReceipt(text, opts) -> {cents, date, vendor, category, pay}
   * opts.today: "YYYY-MM-DD"; opts.history: [{vendor, category}] newest first
   */
  function parseReceipt(text, opts) {
    opts = opts || {};
    const today = opts.today || new Date().toISOString().slice(0, 10);
    const hist = {}; const known = [];
    (opts.history || []).forEach(r => {
      if (!r.vendor) return;
      const k = r.vendor.toLowerCase();
      if (!(k in hist)) { hist[k] = r.category; known.push(r.vendor); }
    });
    const lines = String(text || "").split(/\r?\n/).map(l => cleanNumbers(l.trim())).filter(Boolean);
    const joined = lines.join("\n");
    const v = findVendor(lines, joined, known);
    return {
      cents: findTotal(lines),
      date: findDate(joined, today),
      vendor: v ? v.name : null,
      category: findCategory(v && v.name, joined, hist),
      pay: findPayment(joined)
    };
  }

  const api = { parseReceipt, CATEGORIES };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.ReceiptParser = api;
})(typeof self !== "undefined" ? self : this);
