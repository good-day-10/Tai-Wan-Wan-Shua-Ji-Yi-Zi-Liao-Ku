const chineseDigits: Record<string, number> = {
  零: 0, 〇: 0, 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};

function parseChineseNumber(value: string): number | undefined {
  if (!value) return undefined;
  if (![...value].some((character) => ['十', '百', '千'].includes(character))) {
    const digits = [...value].map((character) => chineseDigits[character]);
    return digits.every((digit) => digit !== undefined) ? Number(digits.join('')) : undefined;
  }

  let total = 0;
  let current = 0;
  for (const character of value) {
    if (character in chineseDigits) {
      current = chineseDigits[character];
    } else if (character === '十') {
      total += (current || 1) * 10;
      current = 0;
    } else if (character === '百') {
      total += (current || 1) * 100;
      current = 0;
    } else if (character === '千') {
      total += (current || 1) * 1000;
      current = 0;
    } else {
      return undefined;
    }
  }
  return total + current;
}

export function getStoryDecade(era: string): number | undefined {
  const westernYear = era.match(/\b((?:19|20)\d{2})\b/);
  if (westernYear) return Math.floor(Number(westernYear[1]) / 10) * 10;

  const rocEra = era.match(/民國\s*([零〇一二兩三四五六七八九十百千\d]+)\s*年(?:代)?/);
  if (rocEra) {
    const year = /^\d+$/.test(rocEra[1]) ? Number(rocEra[1]) : parseChineseNumber(rocEra[1]);
    if (year && year >= 1 && year <= 200) return Math.floor((year + 1911) / 10) * 10;
  }

  return undefined;
}

export function getEarliestStoryDecade(eras: string[]): number | undefined {
  const decades = eras.map(getStoryDecade).filter((decade): decade is number => decade !== undefined);
  return decades.length ? Math.min(...decades) : undefined;
}
