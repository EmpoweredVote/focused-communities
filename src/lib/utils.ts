import removeMd from 'remove-markdown';

// --- Cursor Pagination ---

export function encodeCursor(timestamp: string, id: string): string {
  return Buffer.from(JSON.stringify({ t: timestamp, id })).toString('base64url');
}

export function decodeCursor(cursor: string): { t: string; id: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (typeof parsed.t === 'string' && typeof parsed.id === 'string') return parsed;
    return null;
  } catch {
    return null;
  }
}

// --- Excerpt Generation ---

export function generateExcerpt(body: string, maxLength = 200): string {
  const plain = removeMd(body, { useImgAltText: false })
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= maxLength) return plain;
  const truncated = plain.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '\u2026';
}

// --- Query Parameter Parsing ---

const MAX_LIMIT = 100;

export function parseLimit(raw: string | undefined, defaultLimit: number): number {
  const n = parseInt(raw ?? '', 10);
  if (isNaN(n) || n < 1) return defaultLimit;
  return Math.min(n, MAX_LIMIT);
}
