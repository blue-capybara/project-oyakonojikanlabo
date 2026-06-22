function normalizeSegment(segment) {
  if (!segment) return '';

  try {
    return encodeURIComponent(decodeURIComponent(segment));
  } catch {
    return encodeURIComponent(segment);
  }
}

export function normalizeUrlPath(input) {
  const value = `${input ?? ''}`.trim();
  if (!value) return null;

  let pathname = value;

  try {
    pathname = new URL(value, 'https://oyakonojikanlabo.jp').pathname;
  } catch {
    pathname = value;
  }

  pathname = pathname.split('#')[0].split('?')[0].trim();
  if (!pathname) return null;

  pathname = pathname.replace(/\/{2,}/g, '/');
  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`;
  }

  const normalized = pathname
    .split('/')
    .map((segment, index) => (index === 0 ? '' : normalizeSegment(segment)))
    .join('/');

  const canonical = normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized;
  if (!canonical) {
    return '/';
  }

  return canonical.toLowerCase();
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

export function parseSoft404Csv(text) {
  const trimmed = text.replace(/^\uFEFF/, '').trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  const header = parseCsvLine(lines[0]);
  const normalizedHeader = header.map((cell) => cell.trim().toLowerCase());
  const urlIndex = normalizedHeader.findIndex((cell) => cell === 'url');
  const lastCrawledIndex = normalizedHeader.findIndex(
    (cell) => cell === 'last_crawled' || cell === 'last_crawl' || cell === '前回のクロール',
  );

  if (urlIndex < 0) {
    throw new Error('soft404 CSV に url 列がありません');
  }

  const rowMap = new Map();

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const pathname = normalizeUrlPath(cells[urlIndex]);
    if (!pathname || pathname === '/') continue;

    const lastCrawled = (cells[lastCrawledIndex] ?? '').trim();
    const previous = rowMap.get(pathname);

    if (!previous || lastCrawled > previous.lastCrawled) {
      rowMap.set(pathname, {
        url: pathname,
        lastCrawled,
        source: 'gsc_soft404',
      });
    }
  }

  return [...rowMap.values()].sort((a, b) => a.url.localeCompare(b.url, 'ja'));
}
