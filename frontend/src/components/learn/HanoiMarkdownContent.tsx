import React from 'react';
import { Lightbulb, Compass, ShieldAlert, Info } from 'lucide-react';

interface HanoiMarkdownContentProps {
  content: string;
}

/**
 * Tokenize and parse inline formatting:
 * **bold**, `code`, *italic*, and mathematical/directional symbols
 */
function parseInline(text: string): React.ReactNode[] {
  const cleaned = text
    .replace(/\$\s*\\rightarrow\s*\$/g, '→')
    .replace(/\$\s*\\parallel\s*\$/g, '∥')
    .replace(/\$\s*\\perp\s*\$/g, '⊥')
    .replace(/\$([0-9.]+)\^\\circ\\text\{([A-Za-z]+)\}\$/g, '$1°$2')
    .replace(/\$([0-9.]+)\^\\circ\s*-\s*([0-9.]+)\^\\circ\$/g, '$1° – $2°')
    .replace(/\$\s*<\s*([0-9.]+)\^\\circ\s*\$/g, '< $1°')
    .replace(/\$([0-9.]+)\^\\circ\$/g, '$1°')
    .replace(/\$(\d+)\s*\\pm\s*(\d+)\$/g, '$1 ± $2');

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
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-amber-500/15 dark:bg-amber-500/20 text-amber-950 dark:text-amber-200 font-mono text-xs font-bold border border-amber-600/25 dark:border-amber-400/30"
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

    if (!line) {
      i++;
      continue;
    }

    // 1. Schematic / Code Blocks (```)
    if (line.startsWith('```')) {
      i++;
      const codeLines: string[] = [];
      while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
        codeLines.push(rawLines[i]);
        i++;
      }
      i++;
      elements.push(
        <div
          key={`code-${elKey++}`}
          className="my-5 p-4 sm:p-5 rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-800 font-mono text-xs sm:text-[13px] leading-relaxed text-amber-200 overflow-x-auto shadow-inner"
        >
          <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-slate-400 mb-2 pb-1.5 border-b border-slate-800">
            Sơ đồ cấu trúc tư duy
          </div>
          <pre className="whitespace-pre">{codeLines.join('\n')}</pre>
        </div>
      );
      continue;
    }

    // 2. Pedagogical Callouts & Blockquotes (> [!TIP], > [!IMPORTANT], > [!WARNING], > [!NOTE])
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        quoteLines.push(rawLines[i].trim().replace(/^>\s*/, ''));
        i++;
      }

      const firstLine = quoteLines[0] || '';
      const alertMatch = firstLine.match(/^\[!(TIP|IMPORTANT|WARNING|NOTE)\]\s*(.*)/i);

      if (alertMatch) {
        const alertType = alertMatch[1].toUpperCase();
        const restFirstLine = alertMatch[2];
        const bodyLines = [
          ...(restFirstLine ? [restFirstLine] : []),
          ...quoteLines.slice(1)
        ];

        const configMap: Record<
          string,
          {
            label: string;
            Icon: React.ComponentType<{ className?: string }>;
            boxClass: string;
            badgeClass: string;
            textClass: string;
          }
        > = {
          TIP: {
            label: 'Mẹo Định Hướng Thực Chiến',
            Icon: Lightbulb,
            boxClass: 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-500/40 dark:border-emerald-700/60',
            badgeClass: 'text-emerald-800 dark:text-emerald-300',
            textClass: 'text-slate-800 dark:text-slate-200'
          },
          IMPORTANT: {
            label: 'Nguyên Lý Cốt Lõi Cần Khắc Ghi',
            Icon: Compass,
            boxClass: 'bg-amber-50/90 dark:bg-amber-950/35 border-amber-500/45 dark:border-amber-700/60',
            badgeClass: 'text-amber-900 dark:text-amber-300',
            textClass: 'text-slate-800 dark:text-slate-200'
          },
          WARNING: {
            label: 'Cảnh Báo Bẫy Giao Thông & Nhầm Lẫn Phổ Biến',
            Icon: ShieldAlert,
            boxClass: 'bg-rose-50/90 dark:bg-rose-950/35 border-rose-500/45 dark:border-rose-800/60',
            badgeClass: 'text-rose-800 dark:text-rose-300',
            textClass: 'text-slate-800 dark:text-slate-200'
          },
          NOTE: {
            label: 'Ghi Chú Bổ Sung',
            Icon: Info,
            boxClass: 'bg-sky-50/90 dark:bg-sky-950/30 border-sky-500/40 dark:border-sky-800/60',
            badgeClass: 'text-sky-800 dark:text-sky-300',
            textClass: 'text-slate-800 dark:text-slate-200'
          }
        };

        const cfg = configMap[alertType] || configMap.NOTE;
        const AlertIcon = cfg.Icon;

        elements.push(
          <div
            key={`alert-${elKey++}`}
            className={`my-5 p-4 sm:p-5 rounded-2xl border ${cfg.boxClass} space-y-2 shadow-xs`}
          >
            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${cfg.badgeClass}`}>
              <AlertIcon className="w-4 h-4 shrink-0" />
              <span>{cfg.label}</span>
            </div>
            <div className={`space-y-1.5 text-sm leading-relaxed ${cfg.textClass} max-w-[74ch]`}>
              {bodyLines.map((ql, qIdx) => {
                if (ql.startsWith('* ') || ql.startsWith('- ')) {
                  return (
                    <div key={`aq-${qIdx}`} className="flex items-start gap-2 pl-1">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
                      <span>{parseInline(ql.replace(/^(\*|-)\s+/, ''))}</span>
                    </div>
                  );
                }
                if (/^\d+\.\s+/.test(ql)) {
                  const m = ql.match(/^(\d+)\.\s+(.*)/);
                  return (
                    <div key={`aq-${qIdx}`} className="flex items-start gap-2 pl-1">
                      <span className="font-mono font-bold text-xs mt-0.5">{m?.[1]}.</span>
                      <span>{parseInline(m?.[2] || ql)}</span>
                    </div>
                  );
                }
                return <p key={`aq-${qIdx}`}>{parseInline(ql)}</p>;
              })}
            </div>
          </div>
        );
        continue;
      }

      elements.push(
        <blockquote
          key={`quote-${elKey++}`}
          className="my-5 pl-4 pr-4 py-3 border-l-4 border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 rounded-r-2xl text-sm leading-relaxed text-slate-800 dark:text-slate-200 max-w-[74ch]"
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={`qp-${qIdx}`} className="my-1">
              {parseInline(ql)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 3. Horizontal Divider (---)
    if (line === '---') {
      elements.push(
        <div key={`hr-${elKey++}`} className="my-7 flex items-center gap-3">
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
        </div>
      );
      i++;
      continue;
    }

    // 4. Heading 3 (###)
    if (line.startsWith('### ')) {
      const headingText = line.replace(/^###\s+/, '');
      elements.push(
        <div
          key={`h3-${elKey++}`}
          className="mt-8 mb-3.5 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 first:border-t-0 first:pt-0 first:mt-2"
        >
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <span className="w-2 h-6 rounded-full bg-gradient-to-b from-amber-500 to-orange-600 inline-block shrink-0" />
            <span>{parseInline(headingText)}</span>
          </h3>
        </div>
      );
      i++;
      continue;
    }

    // 5. Heading 4 (####)
    if (line.startsWith('#### ')) {
      const headingText = line.replace(/^####\s+/, '');
      elements.push(
        <div key={`h4-${elKey++}`} className="mt-5 mb-2">
          <h4 className="text-base font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0" />
            <span>{parseInline(headingText)}</span>
          </h4>
        </div>
      );
      i++;
      continue;
    }

    // 6. Data Matrix Table (| ... |)
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (
        i < rawLines.length &&
        rawLines[i].trim().startsWith('|') &&
        rawLines[i].trim().endsWith('|')
      ) {
        tableLines.push(rawLines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headers = tableLines[0]
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

        const bodyRows = tableLines.slice(2).map((r) =>
          r
            .split('|')
            .map((c) => c.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        );

        elements.push(
          <div
            key={`table-${elKey++}`}
            className="my-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm bg-white dark:bg-slate-900/95"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
                    {headers.map((h, hIdx) => (
                      <th
                        key={`th-${hIdx}`}
                        className="py-3 px-4 font-extrabold uppercase tracking-wider text-[11px] text-slate-800 dark:text-amber-200 whitespace-nowrap"
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
                          className="py-3 px-4 text-slate-700 dark:text-slate-300 leading-relaxed align-top"
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

    // 7. Unordered List (* or - including 1-level indented sub-bullets)
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const listItems: Array<{ main: string; subs: string[] }> = [];
      while (i < rawLines.length) {
        const raw = rawLines[i];
        const trimmed = raw.trim();
        if (!trimmed) break;
        const isIndented = /^\s{2,}(\*|-)\s+/.test(raw);
        if (isIndented && listItems.length > 0) {
          listItems[listItems.length - 1].subs.push(trimmed.replace(/^(\*|-)\s+/, ''));
          i++;
        } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          listItems.push({ main: trimmed.replace(/^(\*|-)\s+/, ''), subs: [] });
          i++;
        } else {
          break;
        }
      }

      elements.push(
        <ul key={`ul-${elKey++}`} className="space-y-2.5 my-3.5 pl-1 max-w-[74ch]">
          {listItems.map((item, idx) => (
            <li
              key={`li-${idx}`}
              className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-[1.75]"
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <div className="flex-1">{parseInline(item.main)}</div>
              </div>
              {item.subs.length > 0 && (
                <ul className="mt-1.5 ml-5 space-y-1.5 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                  {item.subs.map((sub, sIdx) => (
                    <li
                      key={`sub-${sIdx}`}
                      className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
                    >
                      {parseInline(sub)}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 8. Ordered List (1., 2., ... including indented sub-bullets)
    if (/^\d+\.\s+/.test(line)) {
      const listItems: Array<{ num: string; text: string; subs: string[] }> = [];
      while (i < rawLines.length) {
        const raw = rawLines[i];
        const trimmed = raw.trim();
        if (!trimmed) break;
        const isIndentedBullet = /^\s{2,}(\*|-)\s+/.test(raw);
        if (isIndentedBullet && listItems.length > 0) {
          listItems[listItems.length - 1].subs.push(trimmed.replace(/^(\*|-)\s+/, ''));
          i++;
        } else if (/^\d+\.\s+/.test(trimmed)) {
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            listItems.push({ num: numMatch[1], text: numMatch[2], subs: [] });
          }
          i++;
        } else {
          break;
        }
      }

      elements.push(
        <ol key={`ol-${elKey++}`} className="space-y-3 my-4 pl-1 max-w-[74ch]">
          {listItems.map((item, idx) => (
            <li
              key={`oli-${idx}`}
              className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-[1.75]"
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/25">
                  {item.num}
                </span>
                <div className="flex-1">{parseInline(item.text)}</div>
              </div>
              {item.subs.length > 0 && (
                <ul className="mt-2 ml-9 space-y-1.5 border-l-2 border-amber-500/30 pl-3.5">
                  {item.subs.map((sub, sIdx) => (
                    <li
                      key={`osub-${sIdx}`}
                      className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
                    >
                      {parseInline(sub)}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 9. Regular Paragraph
    elements.push(
      <p
        key={`p-${elKey++}`}
        className="text-sm sm:text-[15px] leading-[1.78] text-slate-700 dark:text-slate-300 my-3 max-w-[74ch]"
      >
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
};
