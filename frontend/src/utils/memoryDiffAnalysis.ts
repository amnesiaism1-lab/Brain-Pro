export type SequenceRecallRule = 'forward' | 'reverse' | 'sort-asc' | 'plus-one';

export type DigitDiffStatus = 'exact' | 'transposed' | 'wrong' | 'missing';

export interface SequenceDiffItem {
  index: number;
  expectedChar: string;
  expectedLabel?: string;
  userChar: string;
  userLabel?: string;
  status: DigitDiffStatus;
  /** Zero-based index in expectedTokens where userChar actually belongs (when status === 'transposed'). */
  targetPosIndex?: number;
  shiftDelta?: number;
  isAdjacentSwap?: boolean;
  numericDelta?: number;
}

export interface SequenceDiffResult {
  items: SequenceDiffItem[];
  exactCount: number;
  transposedCount: number;
  wrongCount: number;
  missingCount: number;
  matchPercent: number;
  forgotRuleTransform: boolean;
  ruleApplied: SequenceRecallRule;
  expectedChunked: string;
  userChunked: string;
  diagnosisVi: string;
  tipVi: string;
}

export interface AnalyzeSequenceDiffParams {
  expected: string;
  userTyped: string;
  rawStimulus?: string;
  rule?: SequenceRecallRule;
  isWordTokens?: boolean;
  tokenLabels?: Record<string, string>;
}

/**
 * Computes the expected answer sequence from a raw stimulus string under a recall rule.
 */
export function computeExpectedSequence(
  rawSeq: string,
  rule: SequenceRecallRule = 'forward',
  isWordTokens = false
): string {
  if (isWordTokens) {
    const words = rawSeq.trim().split(/\s+/).filter(Boolean);
    if (rule === 'reverse') return [...words].reverse().join(' ');
    if (rule === 'sort-asc') return [...words].sort().join(' ');
    return words.join(' ');
  }

  const chars = rawSeq.split('');
  switch (rule) {
    case 'reverse':
      return [...chars].reverse().join('');
    case 'sort-asc':
      return [...chars].sort().join('');
    case 'plus-one':
      return chars
        .map(ch => {
          if (ch >= '0' && ch <= '9') {
            return String((Number(ch) + 1) % 10);
          }
          if (ch >= 'A' && ch <= 'Z') {
            const nextCode = ch.charCodeAt(0) === 90 ? 65 : ch.charCodeAt(0) + 1;
            return String.fromCharCode(nextCode);
          }
          return ch;
        })
        .join('');
    case 'forward':
    default:
      return rawSeq;
  }
}

/**
 * Splits a token list into cognitively ergonomic chunk groups (no orphan 1-char tail when >= 5).
 */
export function formatChunkedSequence(tokens: string[], isWordTokens = false): string {
  if (tokens.length === 0) return '';
  if (isWordTokens) return tokens.join(' · ');
  const len = tokens.length;
  if (len <= 4) return tokens.join('');

  const groups: string[] = [];
  let cursor = 0;
  while (cursor < len) {
    const remaining = len - cursor;
    let take = 3;
    if (remaining <= 3) {
      take = remaining;
    } else if (remaining === 4) {
      take = 2;
    }
    groups.push(tokens.slice(cursor, cursor + take).join(''));
    cursor += take;
  }
  return groups.join(' · ');
}

/**
 * Performs two-pass sequence alignment to classify exact matches, transposed positions,
 * wrong substitutions, missing slots, and rule-application mistakes.
 */
export function analyzeSequenceDiff(params: AnalyzeSequenceDiffParams): SequenceDiffResult {
  const {
    expected,
    userTyped,
    rawStimulus,
    rule = 'forward',
    isWordTokens = false,
    tokenLabels
  } = params;

  const expectedTokens = isWordTokens
    ? expected.trim().split(/\s+/).filter(Boolean)
    : expected.split('');
  const userTokens = isWordTokens
    ? userTyped.trim().split(/\s+/).filter(Boolean)
    : userTyped.split('');

  const items: SequenceDiffItem[] = Array.from({ length: expectedTokens.length });
  const unmatchedExpectedIndices: number[] = [];

  // Pass 1: Lock all exact index matches so duplicate digits cannot steal already-matched positions
  for (let i = 0; i < expectedTokens.length; i++) {
    const exp = expectedTokens[i];
    const usr = userTokens[i] ?? '';
    if (usr !== '' && usr === exp) {
      items[i] = {
        index: i,
        expectedChar: exp,
        expectedLabel: tokenLabels?.[exp],
        userChar: usr,
        userLabel: tokenLabels?.[usr],
        status: 'exact'
      };
    } else {
      unmatchedExpectedIndices.push(i);
    }
  }

  // Pass 2: Classify remaining slots into 'missing', 'transposed' (closest available), or 'wrong'
  const availablePool = [...unmatchedExpectedIndices];
  for (let i = 0; i < expectedTokens.length; i++) {
    if (items[i]) continue;

    const exp = expectedTokens[i];
    const usr = userTokens[i] ?? '';

    if (!usr) {
      items[i] = {
        index: i,
        expectedChar: exp,
        expectedLabel: tokenLabels?.[exp],
        userChar: '',
        status: 'missing'
      };
      continue;
    }

    // Find closest unmatched occurrence of usr in expectedTokens
    let bestPoolPos = -1;
    let bestDist = Infinity;
    for (let p = 0; p < availablePool.length; p++) {
      const targetIdx = availablePool[p];
      if (expectedTokens[targetIdx] === usr) {
        const d = Math.abs(targetIdx - i);
        if (d < bestDist) {
          bestDist = d;
          bestPoolPos = p;
        }
      }
    }

    if (bestPoolPos !== -1) {
      const targetPosIndex = availablePool.splice(bestPoolPos, 1)[0];
      const shiftDelta = targetPosIndex - i;
      const isAdjacentSwap =
        Math.abs(shiftDelta) === 1 && userTokens[targetPosIndex] === expectedTokens[i];

      items[i] = {
        index: i,
        expectedChar: exp,
        expectedLabel: tokenLabels?.[exp],
        userChar: usr,
        userLabel: tokenLabels?.[usr],
        status: 'transposed',
        targetPosIndex,
        shiftDelta,
        isAdjacentSwap
      };
    } else {
      const numericDelta =
        exp.length === 1 && usr.length === 1 && exp >= '0' && exp <= '9' && usr >= '0' && usr <= '9'
          ? Number(usr) - Number(exp)
          : undefined;

      items[i] = {
        index: i,
        expectedChar: exp,
        expectedLabel: tokenLabels?.[exp],
        userChar: usr,
        userLabel: tokenLabels?.[usr],
        status: 'wrong',
        numericDelta
      };
    }
  }

  const exactCount = items.filter(it => it.status === 'exact').length;
  const transposedCount = items.filter(it => it.status === 'transposed').length;
  const wrongCount = items.filter(it => it.status === 'wrong').length;
  const missingCount = items.filter(it => it.status === 'missing').length;
  const matchPercent =
    expectedTokens.length > 0 ? Math.round((exactCount / expectedTokens.length) * 100) : 100;

  const normalizedRaw = rawStimulus
    ? isWordTokens
      ? rawStimulus.trim().split(/\s+/).filter(Boolean).join(' ')
      : rawStimulus
    : undefined;
  const normalizedExpected = expectedTokens.join(isWordTokens ? ' ' : '');
  const normalizedUser = userTokens.join(isWordTokens ? ' ' : '');
  const forgotRuleTransform = Boolean(
    rule !== 'forward' &&
      normalizedRaw &&
      normalizedUser === normalizedRaw &&
      normalizedExpected !== normalizedRaw
  );

  const adjacentSwapItems = items.filter(it => it.isAdjacentSwap);
  const firstBadIdx = items.findIndex(it => it.status !== 'exact');
  const len = expectedTokens.length;
  const isSerialMiddleDrop =
    len >= 5 &&
    firstBadIdx >= 1 &&
    firstBadIdx <= len - 2 &&
    items[0]?.status === 'exact' &&
    items[len - 1]?.status === 'exact';
  const isTailDrop =
    len >= 4 &&
    firstBadIdx >= Math.ceil(len / 2) &&
    items.slice(0, firstBadIdx).every(it => it.status === 'exact');

  let diagnosisVi = '';
  let tipVi = '';

  if (exactCount === len) {
    diagnosisVi = 'Chính xác tuyệt đối ở mọi vị trí trong chuỗi.';
    tipVi = 'Duy trì nhịp chia cụm ổn định để sẵn sàng tăng độ dài chuỗi.';
  } else if (forgotRuleTransform) {
    const ruleNameVi =
      rule === 'reverse'
        ? 'ĐẢO NGƯỢC từ cuối về đầu'
        : rule === 'sort-asc'
          ? 'SẮP XẾP TĂNG DẦN (0 → 9)'
          : 'CỘNG THÊM +1 từng chữ số';
    diagnosisVi = `Bạn đã nhớ đúng 100% dãy gốc (${rawStimulus}), nhưng quên áp dụng quy tắc ${ruleNameVi}!`;
    tipVi = `Trước khi bấm phím đầu tiên, hãy dừng 0.5 giây tự nhắc quy tắc: ${ruleNameVi}.`;
  } else if (transposedCount > 0 && wrongCount === 0 && missingCount === 0) {
    if (adjacentSwapItems.length >= 2) {
      const a = adjacentSwapItems[0].index + 1;
      const b = (adjacentSwapItems[0].targetPosIndex ?? adjacentSwapItems[0].index) + 1;
      const low = Math.min(a, b);
      const high = Math.max(a, b);
      diagnosisVi = `Bạn nhớ đủ toàn bộ chữ số, nhưng bị đảo chỗ cặp liền kề tại vị trí #${low} ↔ #${high} (ô màu vàng).`;
    } else {
      diagnosisVi = `Bạn nhớ đúng ${exactCount + transposedCount}/${len} ký tự nhưng có ${transposedCount} vị trí bị xô lệch thứ tự (ô màu vàng).`;
    }
    tipVi = 'Hãy đọc nhẩm theo từng cụm 2–3 số ngắt nhịp rõ ràng để khóa chặt thứ tự trước–sau.';
  } else if (isSerialMiddleDrop) {
    diagnosisVi = `Hiệu ứng vị trí chuỗi (Serial Position): bạn nhớ rất chắc đầu và cuối, nhưng rơi thông tin ở khúc giữa (từ vị trí #${firstBadIdx + 1}).`;
    tipVi = `Thử chia thành các cụm nhỏ (${formatChunkedSequence(expectedTokens, isWordTokens)}) thay vì đọc liền một mạch.`;
  } else if (isTailDrop) {
    diagnosisVi = `Đoạn đầu chính xác (${firstBadIdx}/${len} vị trí đầu), bắt đầu hụt nhịp từ vị trí #${firstBadIdx + 1} ở cuối chuỗi.`;
    tipVi = 'Giữ hơi thở đều và cố định 2–3 ký tự cuối thành một nhóm âm riêng biệt.';
  } else if (wrongCount === 1 && transposedCount === 0 && missingCount === 0) {
    const errItem = items.find(it => it.status === 'wrong')!;
    diagnosisVi = `Chỉ sai duy nhất 1 vị trí #${errItem.index + 1}: bạn nhập "${errItem.userChar}" thay vì "${errItem.expectedChar}" (ô màu đỏ).`;
    tipVi = 'Nhìn nhanh lại toàn bộ hàng trên (xanh lá) và hàng dưới để ghi nhớ điểm khác biệt duy nhất.';
  } else {
    diagnosisVi = `Bạn khớp đúng ${exactCount}/${len} vị trí${transposedCount > 0 ? `, có ${transposedCount} vị trí đúng ký tự nhưng lệch chỗ (vàng)` : ''}${wrongCount > 0 ? `, ${wrongCount} vị trí sai ký tự (đỏ)` : ''}.`;
    tipVi = `Hãy ghi nhớ theo nhịp phân nhóm: ${formatChunkedSequence(expectedTokens, isWordTokens)}.`;
  }

  return {
    items,
    exactCount,
    transposedCount,
    wrongCount,
    missingCount,
    matchPercent,
    forgotRuleTransform,
    ruleApplied: rule,
    expectedChunked: formatChunkedSequence(expectedTokens, isWordTokens),
    userChunked: formatChunkedSequence(userTokens, isWordTokens),
    diagnosisVi,
    tipVi
  };
}

export interface SpatialDiffResult {
  failStep: number;
  expectedBlock: number;
  tappedBlock: number;
  errorType: 'forgot-reverse' | 'order-shift' | 'trap-block' | 'wrong-cell';
  tappedStepInExpected: number; // 0-based or -1
  rowDelta: number;
  colDelta: number;
  manhattanDist: number;
  diagnosisVi: string;
  tipVi: string;
}

/**
 * Analyzes where a Corsi block tap diverged spatially or sequentially from expected target.
 */
export function analyzeSpatialDiff(params: {
  rawSequence: number[];
  expectedSequence: number[];
  userInputs: number[];
  gridSize: number;
  isReverse: boolean;
  isTrap?: boolean;
}): SpatialDiffResult {
  const { rawSequence, expectedSequence, userInputs, gridSize, isReverse, isTrap } = params;
  const failStep = Math.max(0, userInputs.length - 1);
  const tappedBlock = userInputs[failStep] ?? 0;
  const expectedBlock = expectedSequence[failStep] ?? rawSequence[0] ?? 0;

  const expRow = Math.floor(expectedBlock / gridSize);
  const expCol = expectedBlock % gridSize;
  const tapRow = Math.floor(tappedBlock / gridSize);
  const tapCol = tappedBlock % gridSize;
  const rowDelta = tapRow - expRow;
  const colDelta = tapCol - expCol;
  const manhattanDist = Math.abs(rowDelta) + Math.abs(colDelta);

  const tappedStepInExpected = expectedSequence.indexOf(tappedBlock);
  const forgotReverse =
    isReverse &&
    failStep === 0 &&
    tappedBlock === rawSequence[0] &&
    rawSequence[0] !== expectedSequence[0];

  const dirParts: string[] = [];
  if (rowDelta < 0) dirParts.push(`lệch lên ${Math.abs(rowDelta)} hàng`);
  else if (rowDelta > 0) dirParts.push(`lệch xuống ${rowDelta} hàng`);
  if (colDelta < 0) dirParts.push(`sang trái ${Math.abs(colDelta)} cột`);
  else if (colDelta > 0) dirParts.push(`sang phải ${colDelta} cột`);
  const dirDesc = dirParts.join(', ');

  let errorType: SpatialDiffResult['errorType'] = 'wrong-cell';
  let diagnosisVi = '';
  let tipVi = '';

  if (isTrap) {
    errorType = 'trap-block';
    diagnosisVi = `Bạn vừa chạm nhầm vào Ô BẪY ĐỎ (không thuộc chuỗi an toàn)! Ô đúng của Bước #${failStep + 1} nằm ở hàng ${expRow + 1}, cột ${expCol + 1}.`;
    tipVi = 'Đánh dấu vị trí ô bẫy đỏ trong đầu trước khi tái hiện đường đi.';
  } else if (forgotReverse) {
    errorType = 'forgot-reverse';
    diagnosisVi = `Bạn vừa bấm ô đầu tiên của chuỗi xuôi (Hàng ${tapRow + 1}, Cột ${tapCol + 1})! Ở chế độ Đảo ngược, Bước #1 phải bắt đầu từ ô CUỐI CÙNG (Hàng ${expRow + 1}, Cột ${expCol + 1}).`;
    tipVi = 'Khi chuỗi ngừng chớp, hãy neo ánh mắt vào điểm cuối cùng phát sáng trước khi bấm.';
  } else if (tappedStepInExpected !== -1) {
    errorType = 'order-shift';
    diagnosisVi = `Đúng vị trí nhưng LỆCH THỨ TỰ: ô bạn bấm (màu vàng) thuộc Bước #${tappedStepInExpected + 1}, trong khi Bước #${failStep + 1} hiện tại phải là ô màu xanh lá (Hàng ${expRow + 1}, Cột ${expCol + 1}).`;
    tipVi = 'Liên kết các ô sáng thành một hình đa giác liên hoàn thay vì nhớ từng chấm rời rạc.';
  } else {
    errorType = 'wrong-cell';
    diagnosisVi = `Lệch tọa độ tại Bước #${failStep + 1}: bạn bấm ${manhattanDist === 1 ? 'ô ngay sát cạnh' : dirDesc || 'ô khác'} so với ô chuẩn (Hàng ${expRow + 1}, Cột ${expCol + 1}).`;
    tipVi = 'Neo từng điểm sáng tương đối theo 4 góc hoặc đường chéo của lưới để tránh trượt 1 ô.';
  }

  return {
    failStep,
    expectedBlock,
    tappedBlock,
    errorType,
    tappedStepInExpected,
    rowDelta,
    colDelta,
    manhattanDist,
    diagnosisVi,
    tipVi
  };
}
