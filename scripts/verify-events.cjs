const fs = require('fs');
const path = require('path');

const eventsDir = path.join(__dirname, '..', 'assets', 'docs', 'EVENTS');
const files = fs.readdirSync(eventsDir).filter(f => f.toLowerCase().endsWith('.md'));

const summary = {
  files: {},
  totalEvents: 0,
  totalAutomatic: 0,
  titleEmpty: [],
  consequenceFormatIssues: [],
};

for (const file of files) {
  const p = path.join(eventsDir, file);
  const raw = fs.readFileSync(p, 'utf8');
  const lines = raw.split(/\r?\n/);

  const eventMatches = raw.match(/EVENTO:/gi) || [];
  const fileEvents = eventMatches.length;
  summary.totalEvents += fileEvents;

  const automaticMatches = raw.match(/TIPO:\s*AUTOMATICO/gi) || [];
  summary.totalAutomatic += automaticMatches.length;

  // Detect empty titles per-event: scan for 'TÍTULO:' occurrences
  const titleAll = [...raw.matchAll(/^T[ÍI]TULO:\s*(.*)$/gim)];
  for (const m of titleAll) {
    const val = m[1] ? m[1].trim() : '';
    if (!val) summary.titleEmpty.push({ file, context: getContext(raw, m.index) });
  }

  // Consequence format checks: for each 'CONSECUENCIAS' occurrence, try to find at least one numeric token
  const consequenceRegex = /^CONSECUENCIAS:\s*(.*)$/gim;
  const consequenceAll = [...raw.matchAll(consequenceRegex)];
  for (const m of consequenceAll) {
    let rest = m[1] ? m[1].trim() : '';
    let idx = m.index + m[0].length;
    // if rest is empty, gather the following non-empty lines until blank or separator
    if (!rest) {
      const tail = raw.slice(idx).split(/\r?\n/);
      for (const l of tail) {
        const t = l.trim();
        if (!t) break;
        if (/^(EVENTO:|OPCI|TIPO:|T[ÍI]TULO:|CANAL:|RAREZA:)/i.test(t)) break;
        if (t === '…' || t === '...') break;
        rest = rest ? rest + ' ' + t : t;
      }
    }

    const numMatch = rest.match(/([+-]?\d+(?:[.,]\d+)?)([kK])?/);
    if (!numMatch) {
      summary.consequenceFormatIssues.push({ file, excerpt: rest || '<vacío>', context: getContext(raw, m.index) });
    }
  }

  summary.files[file] = { events: fileEvents, automatic: automaticMatches.length };
}

function getContext(text, idx) {
  if (typeof idx !== 'number' || idx < 0) return '';
  const start = Math.max(0, idx - 80);
  const end = Math.min(text.length, idx + 80);
  return text.slice(start, end).replace(/\r?\n/g, ' ');
}

console.log('Verification summary:');
console.log('Files scanned:', files.join(', '));
console.log('Total events found:', summary.totalEvents);
console.log('Total automatic events found:', summary.totalAutomatic);
console.log('Files detail:');
for (const f of Object.keys(summary.files)) {
  console.log(` - ${f}: ${summary.files[f].events} events, ${summary.files[f].automatic} automatic`);
}
if (summary.titleEmpty.length) {
  console.log('\nTitles empty in:');
  for (const t of summary.titleEmpty) console.log(` - ${t.file}: ...${t.context}...`);
} else {
  console.log('\nNo empty titles found.');
}
if (summary.consequenceFormatIssues.length) {
  console.log('\nConsequence format issues:');
  for (const c of summary.consequenceFormatIssues) console.log(` - ${c.file}: excerpt="${c.excerpt}" ...${c.context}...`);
} else {
  console.log('\nNo consequence format issues detected.');
}

process.exit(0);
