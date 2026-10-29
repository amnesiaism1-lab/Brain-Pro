const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (full.endsWith('.tsx')) {
      results.push(full);
    }
  });
  return results;
}

const files = walk('frontend/src');
console.log(`Auditing ${files.length} TSX files...`);

const report = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, i) => {
    const lineNum = i + 1;

    // 1. bg-white without dark:bg
    if (line.includes('bg-white') && !line.includes('dark:bg') && !line.includes('text-white') && !line.includes('bg-white/')) {
      // Ignore if it's inside SVG or fixed element that has explicit dark mode context
      report.push({ file, lineNum, type: 'bg-white without dark:bg', text: line.trim() });
    }

    // 2. text-slate-800 or text-slate-900 without dark:text
    if ((line.includes('text-slate-800') || line.includes('text-slate-900') || line.includes('text-gray-900')) && !line.includes('dark:text') && !line.includes('bg-amber') && !line.includes('bg-yellow')) {
      report.push({ file, lineNum, type: 'dark text without dark:text', text: line.trim() });
    }

    // 3. text-slate-700 or text-slate-600 without dark:text
    if ((line.includes('text-slate-700') || line.includes('text-slate-600')) && !line.includes('dark:text') && !line.includes('dark:') && line.includes('className=')) {
      // Potential contrast issue in dark mode
      report.push({ file, lineNum, type: 'mid-dark text without dark:text', text: line.trim() });
    }

    // 4. Hardcoded dark background bg-slate-900 or bg-slate-950 without light variant
    if ((line.includes('bg-slate-900') || line.includes('bg-slate-950') || line.includes('bg-slate-850')) && !line.includes('dark:bg-slate-') && !line.includes('dark:bg-') && !line.includes('text-white')) {
      report.push({ file, lineNum, type: 'hardcoded dark bg in light mode', text: line.trim() });
    }
  });
});

console.log(`Found ${report.length} potential theme inconsistency lines.`);
const byType = {};
report.forEach(r => {
  byType[r.type] = (byType[r.type] || 0) + 1;
});
console.log('Summary by type:', byType);

// Group by file
const byFile = {};
report.forEach(r => {
  const rel = path.relative(process.cwd(), r.file).replace(/\\/g, '/');
  byFile[rel] = byFile[rel] || [];
  byFile[rel].push(r);
});

// Print top files with issues
const sortedFiles = Object.entries(byFile).sort((a, b) => b[1].length - a[1].length);
console.log('\nTop files with theme inconsistencies:');
sortedFiles.slice(0, 20).forEach(([f, list]) => {
  console.log(`- ${f}: ${list.length} issues`);
});
