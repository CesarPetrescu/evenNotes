export function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

export function truncate(text: string, limit: number) {
  return text.length <= limit ? text : `${text.slice(0, limit - 3)}...`;
}

export function singleLine(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

export function escapeHtml(s: string) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function sortNotes(notes: import('./types').Note[]) {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
    return Date.parse(b.updated_at) - Date.parse(a.updated_at);
  });
}

export function normalizeNotes(input: import('./types').Note[]) {
  return input.map((n) => ({
    ...n,
    title: typeof n.title === 'string' ? n.title : 'Untitled',
    content: typeof n.content === 'string' ? n.content : '',
    image: n.image && typeof n.image === 'object' && typeof n.image.dataUrl === 'string'
      ? {
          kind: (n.image.kind === 'drawing' ? 'drawing' : 'upload') as 'drawing' | 'upload',
          mimeType: typeof n.image.mimeType === 'string' ? n.image.mimeType : 'image/png',
          dataUrl: n.image.dataUrl,
          width: typeof n.image.width === 'number' ? n.image.width : undefined,
          height: typeof n.image.height === 'number' ? n.image.height : undefined
        }
      : null,
    pinned: Boolean(n.pinned),
    created_at: typeof n.created_at === 'string' ? n.created_at : new Date().toISOString(),
    updated_at: typeof n.updated_at === 'string' ? n.updated_at : new Date().toISOString()
  }));
}

function normalizeGlassesText(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

function wrapLine(line: string, max: number) {
  const normalized = normalizeGlassesText(line).trim();
  if (!normalized) return [''];

  const out: string[] = [];
  let rest = normalized;

  while (rest.length > max) {
    const candidates = [' ', '/', '-', '_', '.', ',', '|']
      .map((c) => rest.lastIndexOf(c, max))
      .filter((i) => i >= Math.floor(max * 0.45));
    const brk = candidates.length > 0 ? Math.max(...candidates) + 1 : max;
    out.push(rest.slice(0, brk).trimEnd());
    rest = rest.slice(brk).trimStart();
  }
  if (rest) out.push(rest);
  return out;
}

export function wrapText(text: string, maxLen: number, maxLines: number, maxChars: number) {
  const lines = normalizeGlassesText(text).split('\n');
  const out: string[] = [];
  let trunc = false;

  for (const line of lines) {
    for (const chunk of wrapLine(line, maxLen)) {
      if (out.length >= maxLines) { trunc = true; break; }
      out.push(chunk);
    }
    if (trunc) break;
  }

  let result = out.join('\n').trimEnd();

  if (result.length > maxChars) {
    result = result.slice(0, maxChars - 3).trimEnd();
    trunc = true;
  }

  if (trunc) {
    const suffix = result.includes('\n') ? '\n...' : ' ...';
    result = `${result.slice(0, Math.max(0, maxChars - suffix.length)).trimEnd()}${suffix}`;
  }

  return result || '(empty)';
}
