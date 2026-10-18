import React from 'react';

interface HanoiMarkdownContentProps {
  content: string;
}

/**
 * Tokenize and parse inline formatting:
 * **bold**, `code`, *italic*, and LaTeX / math symbols
 */
function parseInline(text: string): React.ReactNode[] {
  // Clean mathematical and directional symbols
  const cleaned = text
    .replace(/\$\s*\\rightarrow\s*\$/g, '→')
    .replace(/\$\s*\\parallel\s*\$/g, '∥')
    .replace(/\$\s*\\perp\s*\$/g, '⊥')
    .replace(/\$85\^\\circ\s*-\s*110\^\\circ\$/g, '85° – 110°')
    .replace(/\$160\^\\circ\s*-\s*190\^\\circ\$/g, '160° – 190°')
    .replace(/\$245\^\\circ\s*-\s*275\^\\circ\$/g, '245° – 275°')
    .replace(/\$\s*<\s*5\^\\circ\s*\$/g, '< 5°')
    .replace(/\$85\^\\circ\$/g, '85°')
    .replace(/\$95\^\\circ\$/g, '95°')
    .replace(/\$([0-9.]+)\^\\circ\$/g, '$1°');

  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(cleaned.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={`b-${key++}`} className="font-extrabold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code 
          key={`c-${key++}`} 
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-amber-500/15 text-amber-900 dark:text-amber-200 font-mono text-[11px] sm:text-xs font-bold border border-amber-500/30"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={`i-${key++}`} className="italic text-slate-700 dark:text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < cleaned.length) {
    tokens.push(cleaned.substring(lastIndex));
  }

  return tokens;
}

export const HanoiMarkdownContent: React.FC<HanoiMarkdownContentProps> = ({ content }) => {
  if (!content) return null;

  const rawLines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let i = 0;
  let elKey = 0;

  while (i < rawLines.length) {
    const line = rawLines[i].trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // 1. Horizontal Rule (---)
    if (line === '---') {
      elements.push(
        <div key={`hr-${elKey++}`} className="my-8 flex items-center justify-center gap-3">
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
          <span className="text-amber-500 font-bold text-xs">◆</span>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
        </div>
      );
      i++;
      continue;
    }

    // 2. Heading 3 (###)
    if (line.startsWith('### ')) {
      const headingText = line.replace(/^###\s+/, '');
      elements.push(
        <div key={`h3-${elKey++}`} className="mt-8 mb-4 pt-4 border-t border-slate-200/60 dark:border-slate-800 first:border-t-0 first:pt-0">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="w-2.5 h-6 rounded-full bg-gradient-to-b from-amber-500 to-orange-500 inline-block shrink-0 shadow-sm" />
            <span>{parseInline(headingText)}</span>
          </h3>
        </div>
      );
      i++;
      continue;
    }

    // 3. Heading 4 (####)
    if (line.startsWith('#### ')) {
      const headingText = line.replace(/^####\s+/, '');
      elements.push(
        <div key={`h4-${elKey++}`} className="mt-5 mb-2.5">
          <h4 className="text-base sm:text-lg font-black text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0" />
            <span>{parseInline(headingText)}</span>
          </h4>
        </div>
      );
      i++;
      continue;
    }

    // 4. Table (| ... |)
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        // Extract headers
        const headerRow = tableLines[0];
        const headers = headerRow
          .split('|')
          .map(c => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

        // Body rows (skip line 1 which is separator | :--- |)
        const bodyRows = tableLines.slice(2).map(r =>
          r
            .split('|')
            .map(c => c.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        );

        elements.push(
          <div 
            key={`table-${elKey++}`} 
            className="my-6 overflow-hidden rounded-2xl border border-amber-200/80 dark:border-slate-700/80 shadow-md bg-white dark:bg-slate-900/90"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent dark:from-amber-950/60 dark:via-orange-950/40 dark:to-slate-900 border-b border-amber-300/40 dark:border-slate-700">
                    {headers.map((h, hIdx) => (
                      <th 
                        key={`th-${hIdx}`} 
                        className="py-3.5 px-4 font-black uppercase tracking-wider text-[11px] sm:text-xs text-amber-950 dark:text-amber-200"
                      >
                        {parseInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bodyRows.map((row, rIdx) => (
                    <tr 
                      key={`tr-${rIdx}`} 
                      className="hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition-colors"
                    >
                      {row.map((cell, cIdx) => (
                        <td 
                          key={`td-${cIdx}`} 
                          className="py-3 px-4 text-slate-700 dark:text-slate-300 leading-relaxed font-normal align-top"
                        >
                          {parseInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
        continue;
      }
    }

    // 5. Unordered List (* or -)
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const listItems: string[] = [];
      while (i < rawLines.length && (rawLines[i].trim().startsWith('* ') || rawLines[i].trim().startsWith('- '))) {
        listItems.push(rawLines[i].trim().replace(/^(\*|-)\s+/, ''));
        i++;
      }

      elements.push(
        <ul key={`ul-${elKey++}`} className="space-y-2 my-3 pl-1">
          {listItems.map((item, idx) => (
            <li key={`li-${idx}`} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <div className="flex-1">{parseInline(item)}</div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Ordered List (1., 2., etc.)
    if (/^\d+\.\s+/.test(line)) {
      const listItems: { num: string; text: string }[] = [];
      while (i < rawLines.length && /^\d+\.\s+/.test(rawLines[i].trim())) {
        const itemLine = rawLines[i].trim();
        const numMatch = itemLine.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          listItems.push({ num: numMatch[1], text: numMatch[2] });
        }
        i++;
      }

      elements.push(
        <ol key={`ol-${elKey++}`} className="space-y-2.5 my-3 pl-1">
          {listItems.map((item, idx) => (
            <li key={`oli-${idx}`} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {item.num}
              </span>
              <div className="flex-1">{parseInline(item.text)}</div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 7. Regular Paragraph
    elements.push(
      <p key={`p-${elKey++}`} className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 my-2.5">
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
};
